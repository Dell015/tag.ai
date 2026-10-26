-- Invite a friend: both get 30 coins when the friend has played their first game (a pot payment is on their ledger).
-- The invite code is the first 6 characters of the inviter's id. Nothing is readable directly; only these functions.

create table if not exists public.referrals (
  invitee    uuid primary key references auth.users(id) on delete cascade,
  inviter    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  paid_at    timestamptz,
  check (invitee <> inviter)
);
create index if not exists referrals_inviter_idx on public.referrals (inviter);
alter table public.referrals enable row level security;
revoke all on public.referrals from anon, authenticated;

create or replace function private.ref_code(p_id uuid) returns text language sql immutable set search_path = '' as $$
  select upper(left(replace(p_id::text, '-', ''), 6));
$$;

-- A new player arrived through an invite link: remember who invited them (once, within 3 days of signing up).
create or replace function public.claim_referral(p_code text) returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); inv uuid; made timestamptz;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_code is null or p_code !~ '^[A-Za-z0-9]{6}$' then return false; end if;
  if exists (select 1 from public.referrals where invitee = uid) then return false; end if;
  select created_at into made from auth.users where id = uid;
  if made is null or made < now() - interval '3 days' then return false; end if;
  select p.id into inv from public.profiles p where private.ref_code(p.id) = upper(p_code) and p.id <> uid limit 1;
  if inv is null then return false; end if;
  insert into public.referrals (invitee, inviter) values (uid, inv) on conflict do nothing;
  return true;
end $$;

-- Called by the invitee's app after a game. Pays both once, if the invitee really paid into a game and is 18+ confirmed.
create or replace function public.reward_referral() returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.referrals%rowtype; me text; reward constant int := 30;
begin
  if uid is null then return false; end if;
  select * into r from public.referrals where invitee = uid and paid_at is null for update;
  if not found then return false; end if;
  if not exists (select 1 from public.transactions where user_id = uid and kind = 'pot') then return false; end if;
  if not exists (select 1 from public.profiles where id = uid and is_adult_confirmed) then return false; end if;
  if (select count(*) from public.referrals where inviter = r.inviter and paid_at is not null) >= 20 then return false; end if;
  update public.referrals set paid_at = now() where invitee = uid;
  insert into public.transactions (user_id, kind, amount, note) values (uid, 'referral', reward, 'Invite reward');
  insert into public.transactions (user_id, kind, amount, note) values (r.inviter, 'referral', reward, 'A friend you invited played their first game');
  select username into me from public.profiles where id = uid;
  insert into public.messages (user_id, title, body) values
    (r.inviter, 'You earned ' || reward || ' coins', coalesce(me, 'Your friend') || ' played their first game. Thanks for inviting them.'),
    (uid, 'You earned ' || reward || ' coins', 'Thanks for joining through an invite. Enjoy the game.');
  return true;
end $$;

create or replace function public.my_referrals() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', private.ref_code(auth.uid()),
    'joined', (select count(*) from public.referrals where inviter = auth.uid()),
    'paid', (select count(*) from public.referrals where inviter = auth.uid() and paid_at is not null));
$$;

revoke all on function public.claim_referral(text), public.reward_referral(), public.my_referrals() from public, anon;
grant execute on function public.claim_referral(text), public.reward_referral(), public.my_referrals() to authenticated;
