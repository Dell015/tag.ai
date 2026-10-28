-- Card review notes: a reason when an admin removes a card, and a way to send removed cards back to review once they are rewritten.
alter table public.cards add column if not exists review_note text check (review_note is null or char_length(review_note) <= 300);

-- Remove a card with a reason (kept, out of every game, reviewed).
create or replace function public.admin_remove_card(p_card text, p_reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c
  set status = 'retired', reviewed_at = coalesce(c.reviewed_at, now()), reviewed_by = coalesce(c.reviewed_by, auth.uid()),
      review_note = nullif(btrim(coalesce(p_reason, '')), '')
  where c.id = p_card;
end;
$$;

-- Removed cards go back to the review list (in play again, waiting for a new decision). The note stays so the reviewer sees what was wrong.
create or replace function public.admin_send_back(p_cards text[] default null)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare n integer;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c
  set status = 'approved', reviewed_at = null, reviewed_by = null
  where c.status = 'retired' and (
    (p_cards is not null and c.id = any (p_cards))
    or (p_cards is null and c.review_note is not null)
  );
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Approving, restoring or undoing settles the note.
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
  update public.cards c set reviewed_at = now(), reviewed_by = auth.uid(), review_note = null
  where c.id = any (card_ids) and c.reviewed_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.admin_restore_card(p_card text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), review_note = null
  where c.id = p_card and c.status = 'retired';
end;
$$;

create or replace function public.admin_undo_review(p_card text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c set status = 'approved', reviewed_at = null, reviewed_by = null, review_note = null
  where c.id = p_card and c.reviewed_at is not null and c.status in ('approved', 'retired');
end;
$$;

-- The lists carry the note.
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
    select c.id, c.text, c.kind, c.deck_id as "deckId", c.adult, c.intensity, c.category, c.source, c.pack_id as "packId", c.review_note as note
    from public.cards c
    where c.reviewed_at is null and c.status = 'approved'
    order by c.created_at, c.id
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  ) q;
  return jsonb_build_object('total', total, 'cards', rows_);
end;
$$;

create or replace function public.admin_reviewed_cards(p_status text, p_limit integer default 50)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare rows_ jsonb; total integer; st text;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  st := case when p_status = 'removed' then 'retired' else 'approved' end;
  select count(*) into total from public.cards c where c.reviewed_at is not null and c.status = st;
  select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) into rows_ from (
    select c.id, c.text, c.kind, c.deck_id as "deckId", c.adult, c.intensity, c.category, c.source, c.pack_id as "packId", c.review_note as note
    from public.cards c
    where c.reviewed_at is not null and c.status = st
    order by c.reviewed_at desc, c.id
    limit greatest(1, least(coalesce(p_limit, 50), 200))
  ) q;
  return jsonb_build_object('total', total, 'cards', rows_);
end;
$$;

revoke all on function public.admin_remove_card(text, text) from public, anon;
revoke all on function public.admin_send_back(text[]) from public, anon;
grant execute on function public.admin_remove_card(text, text) to authenticated;
grant execute on function public.admin_send_back(text[]) to authenticated;
