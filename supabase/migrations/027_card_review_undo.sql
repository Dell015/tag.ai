-- Undo the last review decision: the card goes back to the review list and, if it was removed, back into play.
create or replace function public.admin_undo_review(p_card text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.cards c set status = 'approved', reviewed_at = null, reviewed_by = null
  where c.id = p_card and c.reviewed_at is not null and c.status in ('approved', 'retired');
end;
$$;
revoke all on function public.admin_undo_review(text) from public, anon;
grant execute on function public.admin_undo_review(text) to authenticated;
