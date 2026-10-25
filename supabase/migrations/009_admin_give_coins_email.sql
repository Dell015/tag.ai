-- Admins give coins by email instead of username. Emails are unique and a username can look like someone else's.
drop function if exists public.admin_give_coins(text, numeric, text);

create or replace function public.admin_give_coins(target_email text, amount numeric, note text default null)
returns numeric
language plpgsql security definer
set search_path = ''
as $$
declare
  uid uuid;
  bal numeric;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if amount is null or amount < 1 or amount > 10000 or amount <> trunc(amount) then
    raise exception 'Give a whole number from 1 to 10000';
  end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(btrim(target_email));
  if uid is null or not exists (select 1 from public.profiles p where p.id = uid) then
    raise exception 'No player with that email';
  end if;
  insert into public.transactions (user_id, kind, amount, note)
  values (uid, 'topup', amount, left(coalesce(nullif(btrim(note), ''), 'Given by an admin'), 200));
  select p.coins into bal from public.profiles p where p.id = uid;
  return bal;
end;
$$;

revoke execute on function public.admin_give_coins(text, numeric, text) from public, anon;
grant execute on function public.admin_give_coins(text, numeric, text) to authenticated;
