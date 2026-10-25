-- Players can attach a receipt screenshot to a payment request. Private bucket: the player uploads into
-- their own folder, only admins can read. Files are re-encoded to a small JPEG in the browser first.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 1048576, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg'];

drop policy if exists receipts_insert_own on storage.objects;
create policy receipts_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists receipts_admin_read on storage.objects;
create policy receipts_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and (select public.is_admin()));

alter table public.payment_requests add column if not exists receipt_path text;

create or replace function public.attach_receipt(p_id uuid, p_path text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_path is null or p_path !~ ('^' || uid::text || '/' || p_id::text || '-[0-9]{10,14}\.jpg$') then
    raise exception 'Bad receipt file' using errcode = '22023';
  end if;
  update public.payment_requests r set receipt_path = p_path where r.id = p_id and r.user_id = uid and r.status = 'pending';
  if not found then raise exception 'Nothing to attach it to'; end if;
end $$;
revoke all on function public.attach_receipt(uuid, text) from public, anon;
grant execute on function public.attach_receipt(uuid, text) to authenticated;

drop function if exists public.admin_payment_requests();
create or replace function public.admin_payment_requests()
returns table (id uuid, ref text, email text, username text, price_php integer, coins integer, status text, created_at timestamptz, receipt_path text)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select r.id, r.ref, u.email::text, p.username, r.price_php, r.coins, r.status, r.created_at, r.receipt_path
    from public.payment_requests r
    join auth.users u on u.id = r.user_id
    left join public.profiles p on p.id = r.user_id
    where r.status = 'pending' or r.handled_at > now() - interval '7 days'
    order by (r.status = 'pending') desc, r.created_at desc limit 100;
end $$;
revoke all on function public.admin_payment_requests() from public, anon;
grant execute on function public.admin_payment_requests() to authenticated;
