-- Online rooms, slice 1: a host publishes a lobby, friends join by code or QR, everyone sees the roster live.
-- The room is one JSON document (the same shape the app already keeps on the phone). Nobody touches the tables
-- directly: every read and write goes through the functions below, which check who is asking.

create table public.rooms (
  code        text primary key check (code ~ '^[A-Z0-9]{6}$'),
  host_id     uuid not null references auth.users(id) on delete cascade,
  data        jsonb not null,
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index rooms_host_idx on public.rooms (host_id);

create table public.room_members (
  code     text not null references public.rooms(code) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (code, user_id)
);
create index room_members_user_idx on public.room_members (user_id);

create table public.room_join_fails (
  user_id uuid not null references auth.users(id) on delete cascade,
  at      timestamptz not null default now()
);
create index room_join_fails_idx on public.room_join_fails (user_id, at);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_join_fails enable row level security;
revoke all on public.rooms, public.room_members, public.room_join_fails from anon, authenticated;

-- Publish a lobby (first call) or replace it (host only). Stale writes are refused so a join is never lost.
create or replace function public.publish_room(p_code text, p_data jsonb, p_version integer default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  cur public.rooms%rowtype;
  pl jsonb;
  ids uuid[];
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_code !~ '^[A-Z0-9]{6}$' then raise exception 'Bad room code' using errcode = '22023'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 40000 then
    raise exception 'Room data too large' using errcode = '22023';
  end if;
  if jsonb_typeof(p_data -> 'players') <> 'array' or jsonb_array_length(p_data -> 'players') > 20 then
    raise exception 'Too many players' using errcode = '22023';
  end if;

  select * into cur from public.rooms where code = p_code for update;
  if not found then
    if (select count(*) from public.rooms where host_id = uid) >= 5 then
      raise exception 'You already have 5 open rooms. Close one first.' using errcode = '54000';
    end if;
    perform private.sweep_rooms();
    insert into public.rooms (code, host_id, data) values (p_code, uid, jsonb_set(p_data, '{online}', 'true'::jsonb));
    insert into public.room_members (code, user_id) values (p_code, uid);
    return jsonb_build_object('version', 1, 'data', jsonb_set(p_data, '{online}', 'true'::jsonb));
  end if;

  if cur.host_id <> uid then raise exception 'Only the host can change the room' using errcode = '42501'; end if;
  if p_version is not null and p_version <> cur.version then
    return jsonb_build_object('stale', true, 'version', cur.version, 'data', cur.data);
  end if;

  update public.rooms set data = jsonb_set(p_data, '{online}', 'true'::jsonb), version = version + 1, updated_at = now()
   where code = p_code returning version into cur.version;

  -- Anyone the host removed loses access. Guests (ids that are not real accounts) are ignored.
  select coalesce(array_agg((e ->> 'userId')::uuid), '{}') into ids
    from jsonb_array_elements(p_data -> 'players') e
   where (e ->> 'userId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  delete from public.room_members m where m.code = p_code and m.user_id <> uid and not (m.user_id = any(ids));
  return jsonb_build_object('version', cur.version);
end $$;

-- Join with a code. Adds you to the roster using your account name and picture.
create or replace function public.join_room(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r public.rooms%rowtype;
  me record;
  d jsonb;
  n int;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  p_code := upper(btrim(coalesce(p_code, '')));
  if (select count(*) from public.room_join_fails where user_id = uid and at > now() - interval '1 minute') >= 8 then
    raise exception 'Too many tries. Wait a minute and check the code with the host.' using errcode = '54000';
  end if;
  select * into r from public.rooms where code = p_code for update;
  if not found then
    insert into public.room_join_fails (user_id) values (uid);
    delete from public.room_join_fails where at < now() - interval '1 day';
    raise exception 'Can''t find that room. Check the code with the host.' using errcode = 'P0002';
  end if;
  d := r.data;
  if exists (select 1 from public.room_members where code = p_code and user_id = uid) then
    return jsonb_build_object('version', r.version, 'data', d);
  end if;
  if d ->> 'status' <> 'lobby' then raise exception 'That game already started.' using errcode = '55000'; end if;
  n := jsonb_array_length(d -> 'players');
  if n >= 20 then raise exception 'That room is full.' using errcode = '54000'; end if;
  select p.username, p.avatar into me from public.profiles p where p.id = uid;
  if me.username is null then raise exception 'Finish your profile first' using errcode = '55000'; end if;

  d := jsonb_set(d, '{players}', (d -> 'players') || jsonb_build_array(jsonb_build_object(
        'id', uid, 'userId', uid, 'displayName', me.username, 'avatarUrl', me.avatar,
        'turnOrder', coalesce((select max((e ->> 'turnOrder')::int) + 1 from jsonb_array_elements(d -> 'players') e), 0),
        'agreedToRules', false)));
  update public.rooms set data = d, version = version + 1, updated_at = now() where code = p_code returning version into r.version;
  insert into public.room_members (code, user_id) values (p_code, uid);
  return jsonb_build_object('version', r.version, 'data', d);
end $$;

-- Read the room (members only). Returns null when the room is gone or you are not in it.
create or replace function public.get_room(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype;
begin
  if uid is null then return null; end if;
  select * into r from public.rooms where code = upper(p_code)
     and exists (select 1 from public.room_members m where m.code = rooms.code and m.user_id = uid);
  if not found then return null; end if;
  return jsonb_build_object('version', r.version, 'data', r.data);
end $$;

-- Tap "I agree" for yourself.
create or replace function public.agree_room(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; d jsonb; ag jsonb;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or not exists (select 1 from public.room_members where code = r.code and user_id = uid) then
    raise exception 'Not in that room' using errcode = '42501';
  end if;
  d := r.data; ag := coalesce(d -> 'agreedPlayers', '[]'::jsonb);
  if ag ? uid::text then
    ag := coalesce((select jsonb_agg(x) from jsonb_array_elements_text(ag) x where x <> uid::text), '[]'::jsonb);
  else
    ag := ag || to_jsonb(uid::text);
  end if;
  d := jsonb_set(d, '{agreedPlayers}', ag);
  update public.rooms set data = d, version = version + 1, updated_at = now() where code = r.code returning version into r.version;
  return jsonb_build_object('version', r.version, 'data', d);
end $$;

-- Leave a room. The host leaving closes it.
create or replace function public.leave_room(p_code text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; d jsonb;
begin
  if uid is null then return; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found then return; end if;
  if r.host_id = uid then delete from public.rooms where code = r.code; return; end if;
  if not exists (select 1 from public.room_members where code = r.code and user_id = uid) then return; end if;
  delete from public.room_members where code = r.code and user_id = uid;
  d := jsonb_set(r.data, '{players}', coalesce((select jsonb_agg(e) from jsonb_array_elements(r.data -> 'players') e where e ->> 'userId' <> uid::text), '[]'::jsonb));
  d := jsonb_set(d, '{agreedPlayers}', coalesce((select jsonb_agg(x) from jsonb_array_elements_text(coalesce(r.data -> 'agreedPlayers', '[]'::jsonb)) x where x <> uid::text), '[]'::jsonb));
  update public.rooms set data = d, version = version + 1, updated_at = now() where code = r.code;
end $$;

-- Rooms nobody has touched for a day disappear. Called when anyone publishes; no scheduler needed.
create or replace function private.sweep_rooms() returns void language sql security definer set search_path = '' as $$
  delete from public.rooms where updated_at < now() - interval '1 day';
$$;

revoke all on function public.publish_room(text, jsonb, integer), public.join_room(text), public.get_room(text), public.agree_room(text), public.leave_room(text) from public, anon;
grant execute on function public.publish_room(text, jsonb, integer), public.join_room(text), public.get_room(text), public.agree_room(text), public.leave_room(text) to authenticated;
