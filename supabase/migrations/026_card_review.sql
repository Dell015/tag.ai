-- Card review: every card starts unreviewed and the admin goes through them one by one.
-- Existing cards stay in play while they wait. A new card is unreviewed until an admin approves it.
alter table public.cards add column if not exists reviewed_at timestamptz;
alter table public.cards add column if not exists reviewed_by uuid references auth.users (id) on delete set null;
create index if not exists cards_unreviewed_idx on public.cards (created_at, id) where reviewed_at is null and status = 'approved';

-- The next cards to review (oldest first) and how many are left.
create or replace function public.admin_review_queue(p_limit integer default 10)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare rows_ jsonb; total integer;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  select count(*) into total from public.cards c where c.reviewed_at is null and c.status = 'approved';
  select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) into rows_ from (
    select c.id, c.text, c.kind, c.deck_id as "deckId", c.adult, c.intensity, c.category, c.source, c.pack_id as "packId"
    from public.cards c
    where c.reviewed_at is null and c.status = 'approved'
    order by c.created_at, c.id
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  ) q;
  return jsonb_build_object('total', total, 'cards', rows_);
end;
$$;

-- Approve: the card stays in its deck and leaves the review list.
create or replace function public.admin_approve_cards(card_ids text[])
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare n integer;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c set reviewed_at = now(), reviewed_by = auth.uid()
  where c.id = any (card_ids) and c.reviewed_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Removing a card also marks it reviewed.
create or replace function public.retire_cards(card_ids text[])
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare n integer;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c set status = 'retired', reviewed_at = coalesce(c.reviewed_at, now()), reviewed_by = coalesce(c.reviewed_by, auth.uid())
  where c.id = any (card_ids) and c.status <> 'retired';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- A suggestion that an admin approves is reviewed by that act.
create or replace function private.cards_suggestion_reviewed()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.source = 'suggestion' and new.reviewed_at is null then
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  end if;
  return new;
end;
$$;
drop trigger if exists cards_suggestion_reviewed on public.cards;
create trigger cards_suggestion_reviewed before insert on public.cards
for each row execute function private.cards_suggestion_reviewed();

revoke all on function public.admin_review_queue(integer) from public, anon;
revoke all on function public.admin_approve_cards(text[]) from public, anon;
grant execute on function public.admin_review_queue(integer) to authenticated;
grant execute on function public.admin_approve_cards(text[]) to authenticated;
