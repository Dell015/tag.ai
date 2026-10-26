-- Online rooms, slice 4: add coins during the game, rooms that close after 60 minutes with nobody online,
-- and friends (requests, presence, invites to a room).

-- 1. Anyone in the room adds coins to the pot while the game is running --------------------------------------
create or replace function public.add_to_pot(p_code text, p_amount integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; bal numeric;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or not exists (select 1 from public.room_members where code = r.code and user_id = uid) then
    raise exception 'Not in that room' using errcode = '42501';
  end if;
  if r.data ->> 'status' <> 'active' then raise exception 'The game is not running' using errcode = '55000'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 500 then raise exception 'Add between 1 and 500 coins.' using errcode = '22023'; end if;
  select p.coins into bal from public.profiles p where p.id = uid for update;
  if bal is null then raise exception 'No profile for this user' using errcode = 'P0002'; end if;
  if bal < p_amount then raise exception 'Not enough coins: you have %, this needs %', floor(bal), p_amount using errcode = 'P0001'; end if;
  insert into public.transactions (user_id, kind, amount, note) values (uid, 'pot', -p_amount, 'Added to the pot of room ' || r.code);
  update public.rooms set paid = jsonb_set(paid, array[uid::text], to_jsonb(coalesce((paid ->> uid::text)::int, 0) + p_amount)),
         version = version + 1, updated_at = now() where code = r.code returning * into r;
  return private.room_view(r) || jsonb_build_object('balance', bal - p_amount, 'added', p_amount);
end $$;

-- 2. Rooms close after 60 minutes with nobody online ------------------------------------------------------------
alter table public.room_members add column if not exists last_seen timestamptz not null default now();
alter table public.messages add column if not exists link text check (link is null or link ~ '^/join\?code=[A-Z0-9]{6}$');

-- Reading the room counts as being online (written at most every 30 seconds per player).
create or replace function public.get_room(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype;
begin
  if uid is null then return null; end if;
  select * into r from public.rooms where code = upper(p_code)
     and exists (select 1 from public.room_members m where m.code = rooms.code and m.user_id = uid);
  if not found then return null; end if;
  update public.room_members set last_seen = now() where code = r.code and user_id = uid and last_seen < now() - interval '30 seconds';
  return private.room_view(r);
end $$;

create or replace function private.close_idle_rooms() returns void language plpgsql security definer set search_path = '' as $$
declare c record; m record;
begin
  for c in
    select r.code, r.data ->> 'status' as status from public.rooms r
     where r.updated_at < now() - interval '60 minutes'
       and coalesce(r.game_pushed_at, r.updated_at) < now() - interval '60 minutes'
       and not exists (select 1 from public.room_members x where x.code = r.code and x.last_seen > now() - interval '60 minutes')
  loop
    if c.status = 'lobby' then perform private.refund_room_all(c.code); end if;
    if c.status in ('lobby', 'active') then
      for m in select user_id from public.room_members where code = c.code loop
        insert into public.messages (user_id, title, body)
        values (m.user_id, 'Your room closed', 'Room ' || c.code || ' was empty for 60 minutes, so it closed.'
          || case when c.status = 'lobby' then ' Any coins you added are back in your wallet.' else ' The game had started, so the pot was not refunded.' end);
      end loop;
    end if;
    delete from public.room_members where code = c.code;
    delete from public.rooms where code = c.code;
  end loop;
end $$;

create or replace function private.sweep_rooms() returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.close_idle_rooms();
end $$;

do $$ begin
  create extension if not exists pg_cron with schema pg_catalog;
  perform cron.schedule('close-idle-rooms', '*/5 * * * *', 'select private.close_idle_rooms()');
exception when others then
  raise notice 'pg_cron not enabled (%). Idle rooms are still closed when anyone creates a room.', sqlerrm;
end $$;

-- 3. Friends -------------------------------------------------------------------------------------------------------
create table if not exists public.friendships (
  a uuid not null references public.profiles(id) on delete cascade,
  b uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index if not exists friendships_b on public.friendships (b);
create index if not exists friendships_requester_time on public.friendships (requested_by, created_at);
alter table public.friendships enable row level security;
revoke all on public.friendships from anon, authenticated;

create table if not exists public.presence (user_id uuid primary key references public.profiles(id) on delete cascade, seen_at timestamptz not null default now());
alter table public.presence enable row level security;
revoke all on public.presence from anon, authenticated;

create or replace function public.touch_presence() returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into public.presence (user_id) values (uid)
  on conflict (user_id) do update set seen_at = now() where public.presence.seen_at < now() - interval '40 seconds';
end $$;

create or replace function public.friend_request(p_name text) returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); other uuid; fa uuid; fb uuid; f public.friendships%rowtype;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  p_name := regexp_replace(btrim(coalesce(p_name, '')), '^@', '');
  if p_name = '' then raise exception 'Type a player name.' using errcode = '22023'; end if;
  select id into other from public.profiles where lower(username) = lower(p_name);
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

create or replace function public.respond_friend(p_id uuid, p_accept boolean) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_accept then
    update public.friendships set status = 'accepted'
     where a = least(uid, p_id) and b = greatest(uid, p_id) and status = 'pending' and requested_by <> uid;
  else
    delete from public.friendships
     where a = least(uid, p_id) and b = greatest(uid, p_id) and status = 'pending' and requested_by <> uid;
  end if;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'That request is gone.' using errcode = 'P0002'; end if;
end $$;

create or replace function public.remove_friend(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  delete from public.friendships where a = least(uid, p_id) and b = greatest(uid, p_id);
end $$;

create or replace function public.list_friends() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
        'id', p.id, 'username', p.username, 'avatar', p.avatar,
        'relation', case when f.status = 'accepted' then 'friend' when f.requested_by = uid then 'outgoing' else 'incoming' end,
        'online', f.status = 'accepted' and coalesce(pr.seen_at > now() - interval '2 minutes', false))
      order by (f.status = 'accepted') desc, lower(p.username))
      from public.friendships f
      join public.profiles p on p.id = case when f.a = uid then f.b else f.a end
      left join public.presence pr on pr.user_id = p.id
     where f.a = uid or f.b = uid), '[]'::jsonb);
end $$;

-- A member of a lobby sends a friend an inbox message with a link that joins the room.
create or replace function public.invite_friend(p_code text, p_friend uuid) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; me text;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code);
  if not found or not exists (select 1 from public.room_members where code = r.code and user_id = uid) then
    raise exception 'Not in that room' using errcode = '42501';
  end if;
  if r.data ->> 'status' <> 'lobby' then raise exception 'That game already started.' using errcode = '55000'; end if;
  if not exists (select 1 from public.friendships where a = least(uid, p_friend) and b = greatest(uid, p_friend) and status = 'accepted') then
    raise exception 'You can only invite friends.' using errcode = '42501';
  end if;
  if exists (select 1 from public.room_members where code = r.code and user_id = p_friend) then
    raise exception 'They are already in the room.' using errcode = '55000';
  end if;
  if exists (select 1 from public.messages where user_id = p_friend and link = '/join?code=' || r.code and created_at > now() - interval '10 minutes') then
    raise exception 'You already invited them.' using errcode = '55000';
  end if;
  select username into me from public.profiles where id = uid;
  insert into public.messages (user_id, title, body, link)
  values (p_friend, left(me || ' invited you to play', 60), 'Room ' || r.code || '. Tap Join to jump in.', '/join?code=' || r.code);
end $$;

revoke all on function public.add_to_pot(text, integer), public.touch_presence(), public.friend_request(text), public.respond_friend(uuid, boolean),
  public.remove_friend(uuid), public.list_friends(), public.invite_friend(text, uuid), public.get_room(text) from public, anon;
grant execute on function public.add_to_pot(text, integer), public.touch_presence(), public.friend_request(text), public.respond_friend(uuid, boolean),
  public.remove_friend(uuid), public.list_friends(), public.invite_friend(text, uuid), public.get_room(text) to authenticated;
revoke all on function private.close_idle_rooms() from public, anon, authenticated;
