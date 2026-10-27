-- Review history: the removed cards are kept (status retired) and the approved ones stay in play.
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
    select c.id, c.text, c.kind, c.deck_id as "deckId", c.adult, c.intensity, c.category, c.source, c.pack_id as "packId"
    from public.cards c
    where c.reviewed_at is not null and c.status = st
    order by c.reviewed_at desc, c.id
    limit greatest(1, least(coalesce(p_limit, 50), 200))
  ) q;
  return jsonb_build_object('total', total, 'cards', rows_);
end;
$$;

-- Put a removed card back in play (approved and reviewed).
create or replace function public.admin_restore_card(p_card text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where c.id = p_card and c.status = 'retired';
end;
$$;
revoke all on function public.admin_reviewed_cards(text, integer) from public, anon;
revoke all on function public.admin_restore_card(text) from public, anon;
grant execute on function public.admin_reviewed_cards(text, integer) to authenticated;
grant execute on function public.admin_restore_card(text) to authenticated;
