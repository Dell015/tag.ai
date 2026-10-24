-- Admins can give coins to a player by username (beta testing, before payments exist).
-- The coins go through the ledger as a 'topup' row, so the trigger moves the balance.
create or replace function public.admin_give_coins(target_username text, amount numeric, note text default null)
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
  select p.id into uid from public.profiles p where lower(p.username) = lower(btrim(target_username));
  if uid is null then
    raise exception 'No player with that username';
  end if;
  insert into public.transactions (user_id, kind, amount, note)
  values (uid, 'topup', amount, left(coalesce(nullif(btrim(note), ''), 'Given by an admin'), 200));
  select p.coins into bal from public.profiles p where p.id = uid;
  return bal;
end;
$$;

revoke execute on function public.admin_give_coins(text, numeric, text) from public, anon;
grant execute on function public.admin_give_coins(text, numeric, text) to authenticated;
