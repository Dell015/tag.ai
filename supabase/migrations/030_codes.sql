-- Player codes and redeem codes.
-- Every player gets a short code (also the invite code). Typing someone's code in Redeem links the two accounts for the invite bonus.
-- Admins can also make voucher codes (coins for now; the kind column leaves room for discounts and freebies later).

alter table public.transactions drop constraint if exists transactions_kind_check;
alter table public.transactions add constraint transactions_kind_check
  check (kind in ('welcome', 'purchase', 'pot', 'refund', 'topup', 'referral', 'shop', 'voucher', 'reward'));

-- Random code without look-alike characters (no 0 O 1 I L).
create or replace function private.new_player_code() returns text language plpgsql volatile set search_path = '' as $$
declare alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from public.profiles where code = c);
  end loop;
  return c;
end $$;

alter table public.profiles add column if not exists code text;
update public.profiles set code = private.new_player_code() where code is null;
alter table public.profiles alter column code set not null;
create unique index if not exists profiles_code_key on public.profiles (code);
alter table public.profiles drop constraint if exists profiles_code_format;
alter table public.profiles add constraint profiles_code_format check (code ~ '^[A-Z0-9]{6}$');

create or replace function private.profiles_set_code() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.code is null or new.code = '' then new.code := private.new_player_code(); end if;
  return new;
end $$;
drop trigger if exists profiles_set_code on public.profiles;
create trigger profiles_set_code before insert on public.profiles for each row execute function private.profiles_set_code();

-- The old invite code (first 6 characters of the id) keeps working for links that were already shared.
create or replace function private.old_ref_code(p_id uuid) returns text language sql immutable set search_path = '' as $$
  select upper(left(replace(p_id::text, '-', ''), 6));
$$;

-- The code is read only through these functions or my_referrals; players never update it.
revoke update (code) on public.profiles from authenticated;

create or replace function public.my_referrals() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', (select code from public.profiles where id = auth.uid()),
    'joined', (select count(*) from public.referrals where inviter = auth.uid()),
    'paid', (select count(*) from public.referrals where inviter = auth.uid() and paid_at is not null));
$$;

-- Used by invite links and by Redeem. Within 7 days of signing up, once, not your own code.
create or replace function private.link_inviter(uid uuid, p_code text) returns text language plpgsql security definer set search_path = '' as $$
declare inv uuid; made timestamptz;
begin
  if exists (select 1 from public.referrals where invitee = uid) then return 'You already used an invite code.'; end if;
  select created_at into made from auth.users where id = uid;
  if made is null or made < now() - interval '7 days' then return 'Invite codes only work in your first 7 days.'; end if;
  select p.id into inv from public.profiles p where (p.code = upper(p_code) or private.old_ref_code(p.id) = upper(p_code)) limit 1;
  if inv is null then return 'not found'; end if;
  if inv = uid then return 'That is your own code.'; end if;
  insert into public.referrals (invitee, inviter) values (uid, inv) on conflict do nothing;
  return 'ok';
end $$;
revoke all on function private.link_inviter(uuid, text) from public, anon, authenticated;

create or replace function public.claim_referral(p_code text) returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_code is null or p_code !~ '^[A-Za-z0-9]{6}$' then return false; end if;
  return private.link_inviter(uid, p_code) = 'ok';
end $$;

-- Friends can be added by name or by code.
create or replace function public.friend_request(p_name text)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare uid uuid := auth.uid(); other uuid; fa uuid; fb uuid; f public.friendships%rowtype;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  p_name := regexp_replace(btrim(coalesce(p_name, '')), '^@', '');
  if p_name = '' then raise exception 'Type a player name or code.' using errcode = '22023'; end if;
  select id into other from public.profiles where lower(username) = lower(p_name);
  if other is null and upper(p_name) ~ '^[A-Z0-9]{6}$' then select id into other from public.profiles where code = upper(p_name); end if;
  if other is null then raise exception 'No player is called %.', p_name using errcode = 'P0002'; end if;
  if other = uid then raise exception 'That is you.' using errcode = '22023'; end if;
  fa := least(uid, other); fb := greatest(uid, other);
  select * into f from public.friendships where a = fa and b = fb for update;
  if found then
    if f.status = 'accepted' then raise exception 'You are already friends.' using errcode = '55000'; end if;
    if f.requested_by = uid then raise exception 'You already sent a request.' using errcode = '55000'; end if;
    update public.friendships set status = 'accepted' where a = fa and b = fb;
    return 'accepted';
  end if;
  if (select count(*) from public.friendships where requested_by = uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Too many requests. Try again in a while.' using errcode = '54000';
  end if;
  if (select count(*) from public.friendships where (a = uid or b = uid) and status = 'accepted') >= 100 then
    raise exception 'Your friends list is full.' using errcode = '54000';
  end if;
  if (select count(*) from public.friendships where requested_by = uid and status = 'pending') >= 30 then
    raise exception 'You have 30 requests waiting. Wait for answers first.' using errcode = '54000';
  end if;
  insert into public.friendships (a, b, requested_by) values (fa, fb, uid);
  return 'sent';
end $$;

-- Voucher codes made by admins.
create table if not exists public.redeem_codes (
  code       text primary key check (code = upper(code) and code ~ '^[A-Z0-9-]{4,24}$'),
  kind       text not null default 'coins' check (kind in ('coins')),
  value      integer not null check (value between 1 and 10000),
  max_uses   integer check (max_uses is null or max_uses >= 1),
  used       integer not null default 0,
  expires_at timestamptz,
  active     boolean not null default true,
  note       text check (note is null or char_length(note) <= 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.redemptions (
  code    text not null references public.redeem_codes (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now(),
  primary key (code, user_id)
);
create table if not exists public.redeem_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists redeem_attempts_idx on public.redeem_attempts (user_id, at desc);
create index if not exists redemptions_user_idx on public.redemptions (user_id);
create index if not exists redeem_codes_created_by_idx on public.redeem_codes (created_by);
alter table public.redeem_codes enable row level security;
alter table public.redemptions enable row level security;
alter table public.redeem_attempts enable row level security;
revoke all on public.redeem_codes, public.redemptions, public.redeem_attempts from anon, authenticated;

create or replace function public.redeem_code(p_code text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); c text; v public.redeem_codes%rowtype; res text; inviter_name text; bad int;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  c := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  if c = '' then raise exception 'Type a code.' using errcode = '22023'; end if;
  select count(*) into bad from public.redeem_attempts where user_id = uid and at > now() - interval '10 minutes';
  if bad >= 8 then raise exception 'Too many tries. Wait a few minutes.' using errcode = '54000'; end if;

  select * into v from public.redeem_codes where code = c for update;
  if found then
    if not v.active or (v.expires_at is not null and v.expires_at < now()) or (v.max_uses is not null and v.used >= v.max_uses) then
      insert into public.redeem_attempts (user_id) values (uid);
      raise exception 'This code is no longer valid.' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.redemptions where code = c and user_id = uid) then
      raise exception 'You already used this code.' using errcode = 'P0001';
    end if;
    insert into public.redemptions (code, user_id) values (c, uid);
    update public.redeem_codes set used = used + 1 where code = c;
    insert into public.transactions (user_id, kind, amount, note) values (uid, 'voucher', v.value, 'Code ' || c);
    insert into public.messages (user_id, title, body) values (uid, 'You got ' || v.value || ' coins', 'The code ' || c || ' was redeemed.');
    return jsonb_build_object('type', 'voucher', 'coins', v.value);
  end if;

  if c ~ '^[A-Z0-9]{6}$' then
    res := private.link_inviter(uid, c);
    if res = 'ok' then
      select p.username into inviter_name from public.profiles p where p.code = c or private.old_ref_code(p.id) = c limit 1;
      return jsonb_build_object('type', 'friend', 'name', inviter_name);
    elsif res <> 'not found' then
      insert into public.redeem_attempts (user_id) values (uid);
      raise exception '%', res using errcode = 'P0001';
    end if;
  end if;

  insert into public.redeem_attempts (user_id) values (uid);
  raise exception 'That code does not exist.' using errcode = 'P0001';
end $$;

create or replace function public.admin_create_code(p_code text, p_value integer, p_max_uses integer default null, p_days integer default null, p_note text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare c text; alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; i int;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  c := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  if c = '' then
    for i in 1..8 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
  end if;
  if c !~ '^[A-Z0-9-]{4,24}$' then raise exception 'Use 4 to 24 letters, numbers or dashes.' using errcode = '22023'; end if;
  if exists (select 1 from public.profiles where code = c) then raise exception 'That is a player code.' using errcode = '22023'; end if;
  insert into public.redeem_codes (code, value, max_uses, expires_at, note, created_by)
  values (c, p_value, p_max_uses, case when p_days is null then null else now() + make_interval(days => p_days) end, nullif(btrim(coalesce(p_note, '')), ''), auth.uid());
  return c;
exception when unique_violation then
  raise exception 'That code already exists.' using errcode = 'P0001';
end $$;

create or replace function public.admin_codes() returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(q)) from (
    select code, kind, value, max_uses as "maxUses", used, expires_at as "expiresAt", active, note, created_at as "createdAt"
    from public.redeem_codes order by created_at desc limit 100) q), '[]'::jsonb);
end $$;

create or replace function public.admin_set_code_active(p_code text, p_active boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  update public.redeem_codes set active = p_active where code = upper(p_code);
end $$;

revoke all on function public.redeem_code(text), public.admin_create_code(text, integer, integer, integer, text), public.admin_codes(), public.admin_set_code_active(text, boolean) from public, anon;
grant execute on function public.redeem_code(text), public.admin_create_code(text, integer, integer, integer, text), public.admin_codes(), public.admin_set_code_active(text, boolean) to authenticated;
