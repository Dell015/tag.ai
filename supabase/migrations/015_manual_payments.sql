-- Beta payments by hand: a player asks for a coin package, pays the owner by GCash or bank QR with the
-- reference code, and an admin taps Done to credit the coins. All access goes through the functions below.

create table if not exists public.coin_packages (
  id        text primary key,
  name      text not null,
  price_php integer not null check (price_php > 0),
  coins     integer not null check (coins > 0),
  active    boolean not null default true
);
alter table public.coin_packages enable row level security;
revoke all on public.coin_packages from anon, authenticated;
grant select on public.coin_packages to anon, authenticated;
drop policy if exists coin_packages_select on public.coin_packages;
create policy coin_packages_select on public.coin_packages for select to anon, authenticated using (active);

-- Beta prices. Change them here (and in src/lib/data/shop-catalogue.ts so the screen shows the same numbers).
insert into public.coin_packages (id, name, price_php, coins) values
  ('starter', 'Starter', 10, 50),
  ('night-out', 'Night Out', 20, 110),
  ('party-pack', 'Party Pack', 50, 300),
  ('treasurer', 'Treasurer', 100, 650)
on conflict (id) do update set name = excluded.name, price_php = excluded.price_php, coins = excluded.coins;

create table if not exists public.payment_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  package_id text not null references public.coin_packages (id),
  price_php  integer not null,
  coins      integer not null,
  ref        text not null unique,
  status     text not null default 'pending' check (status in ('pending', 'paid', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid
);
alter table public.payment_requests enable row level security;
revoke all on public.payment_requests from anon, authenticated;
create index if not exists payment_requests_user_idx on public.payment_requests (user_id, created_at desc);
create index if not exists payment_requests_status_idx on public.payment_requests (status, created_at);

-- A player asks for a package. The price and coins come from the table, never from the client.
create or replace function public.create_payment_request(p_package text)
returns table (id uuid, ref text, price_php integer, coins integer)
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  pkg public.coin_packages%rowtype;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  tries int := 0;
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles p where p.id = uid) then raise exception 'No profile for this user' using errcode = 'P0002'; end if;
  select * into pkg from public.coin_packages c where c.id = p_package and c.active;
  if not found then raise exception 'That package is not for sale' using errcode = 'P0002'; end if;
  if (select count(*) from public.payment_requests r where r.user_id = uid and r.status = 'pending') >= 3 then
    raise exception 'You already have 3 requests waiting. Pay one or cancel it first.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.payment_requests r where r.user_id = uid and r.created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Too many requests today. Try again tomorrow.' using errcode = 'P0001';
  end if;
  loop
    code := 'TG-';
    for i in 1..5 loop code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from public.payment_requests r where r.ref = code);
    tries := tries + 1;
    if tries > 20 then raise exception 'Try again'; end if;
  end loop;
  return query
    insert into public.payment_requests as r (user_id, package_id, price_php, coins, ref)
    values (uid, pkg.id, pkg.price_php, pkg.coins, code)
    returning r.id, r.ref, r.price_php, r.coins;
end $$;

create or replace function public.my_payment_requests()
returns table (id uuid, ref text, price_php integer, coins integer, status text, created_at timestamptz)
language sql security definer set search_path = '' stable as $$
  select r.id, r.ref, r.price_php, r.coins, r.status, r.created_at
  from public.payment_requests r where r.user_id = (select auth.uid()) order by r.created_at desc limit 10;
$$;

create or replace function public.cancel_payment_request(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.payment_requests r set status = 'cancelled', handled_at = now()
  where r.id = p_id and r.user_id = (select auth.uid()) and r.status = 'pending';
  if not found then raise exception 'Nothing to cancel'; end if;
end $$;

create or replace function public.admin_payment_requests()
returns table (id uuid, ref text, email text, username text, price_php integer, coins integer, status text, created_at timestamptz)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select r.id, r.ref, u.email::text, p.username, r.price_php, r.coins, r.status, r.created_at
    from public.payment_requests r
    join auth.users u on u.id = r.user_id
    left join public.profiles p on p.id = r.user_id
    where r.status = 'pending' or r.handled_at > now() - interval '7 days'
    order by (r.status = 'pending') desc, r.created_at desc limit 100;
end $$;

-- The owner confirmed the money arrived: credit the coins once and tell the player.
create or replace function public.admin_complete_payment(p_id uuid)
returns numeric language plpgsql security definer set search_path = '' as $$
declare r public.payment_requests; bal numeric;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  select * into r from public.payment_requests q where q.id = p_id for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Already handled'; end if;
  insert into public.transactions (user_id, kind, amount, note) values (r.user_id, 'topup', r.coins, 'Payment ' || r.ref);
  update public.payment_requests q set status = 'paid', handled_at = now(), handled_by = (select auth.uid()) where q.id = r.id;
  insert into public.messages (user_id, title, body) values (r.user_id, 'Coins added', r.coins || ' coins are in your wallet. Thank you for playing tag.ai. Reference ' || r.ref || '.');
  select p.coins into bal from public.profiles p where p.id = r.user_id;
  return bal;
end $$;

create or replace function public.admin_reject_payment(p_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.payment_requests;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  select * into r from public.payment_requests q where q.id = p_id for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Already handled'; end if;
  update public.payment_requests q set status = 'rejected', handled_at = now(), handled_by = (select auth.uid()) where q.id = r.id;
  insert into public.messages (user_id, title, body) values (r.user_id, 'Payment not found', left('We could not find a payment for ' || r.ref || coalesce('. ' || nullif(btrim(p_reason), ''), '') || '. Send it again with the reference, or ask the admin.', 400));
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'public.create_payment_request(text)', 'public.my_payment_requests()', 'public.cancel_payment_request(uuid)',
    'public.admin_payment_requests()', 'public.admin_complete_payment(uuid)', 'public.admin_reject_payment(uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
