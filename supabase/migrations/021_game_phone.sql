-- Online rooms, slice 3: one phone runs the game, everyone else watches live, and the game can move to another phone.
-- The game phone sends a small "view" (current card, whose turn, progress) with every change, plus a full snapshot
-- so another phone can continue it. Only the game phone can write; anyone in the room can claim the game if the
-- game phone has been silent for 45 seconds.

alter table public.rooms
  add column if not exists game_phone uuid references auth.users(id) on delete set null,
  add column if not exists game_view jsonb,
  add column if not exists game_state jsonb,
  add column if not exists game_queue jsonb,
  add column if not exists game_seq integer not null default 0,
  add column if not exists game_pushed_at timestamptz;

create or replace function private.room_view(r public.rooms) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('version', r.version, 'data',
    jsonb_set(r.data, '{paid}', r.paid) ||
    case when r.game_phone is null then '{}'::jsonb
         else jsonb_build_object('gamePhone', r.game_phone, 'gameView', coalesce(r.game_view, 'null'::jsonb),
                                 'gameAge', greatest(0, extract(epoch from (now() - coalesce(r.game_pushed_at, now())))::int)) end);
$$;

-- publish_room: the host can no longer start the game with it (use start_game), and it ignores the server-owned fields.
create or replace function public.publish_room(p_code text, p_data jsonb, p_version integer default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  cur public.rooms%rowtype;
  ids uuid[];
  newdata jsonb;
  target int; paid_total int; k text;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_code !~ '^[A-Z0-9]{6}$' then raise exception 'Bad room code' using errcode = '22023'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 40000 then
    raise exception 'Room data too large' using errcode = '22023';
  end if;
  if jsonb_typeof(p_data -> 'players') <> 'array' or jsonb_array_length(p_data -> 'players') > 20 then
    raise exception 'Too many players' using errcode = '22023';
  end if;
  newdata := jsonb_set(p_data - 'paid' - 'gamePhone' - 'gameView' - 'gameAge', '{online}', 'true'::jsonb);

  select * into cur from public.rooms where code = p_code for update;
  if not found then
    perform private.sweep_rooms();
    if (select count(*) from public.rooms where host_id = uid) >= 5 then
      raise exception 'You already have 5 open rooms. Close one first.' using errcode = '54000';
    end if;
    newdata := jsonb_set(newdata, '{status}', '"lobby"'::jsonb);
    insert into public.rooms (code, host_id, data) values (p_code, uid, newdata) returning * into cur;
    insert into public.room_members (code, user_id) values (p_code, uid);
    return private.room_view(cur);
  end if;

  if cur.host_id <> uid then raise exception 'Only the host can change the room' using errcode = '42501'; end if;
  if p_version is not null and p_version <> cur.version then
    return jsonb_build_object('stale', true) || private.room_view(cur);
  end if;

  paid_total := private.room_paid_total(cur.paid);
  target := coalesce((newdata -> 'config' ->> 'pot')::int, 0);
  if newdata ->> 'status' = 'active' and cur.data ->> 'status' = 'lobby' then
    raise exception 'Start the game with the Start button.' using errcode = '55000';
  end if;
  -- After the start, the status belongs to the game (start_game and finish_game); a stale copy on the host phone cannot change it.
  newdata := jsonb_set(newdata, '{status}', to_jsonb(cur.data ->> 'status'));
  if cur.data ->> 'status' = 'lobby' and paid_total > 0 and target < paid_total then
    raise exception 'The pot already has % coins. Choose at least that many cards.', paid_total using errcode = '55000';
  end if;

  select coalesce(array_agg((e ->> 'userId')::uuid), '{}') into ids
    from jsonb_array_elements(newdata -> 'players') e
   where (e ->> 'userId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  if cur.data ->> 'status' = 'lobby' then
    for k in select m.user_id::text from public.room_members m where m.code = p_code and m.user_id <> uid and not (m.user_id = any(ids)) loop
      perform private.refund_room_player(p_code, k::uuid);
    end loop;
    select * into cur from public.rooms where code = p_code;
  end if;
  delete from public.room_members m where m.code = p_code and m.user_id <> uid and not (m.user_id = any(ids));

  update public.rooms set data = newdata, paid = cur.paid, version = version + 1, updated_at = now()
   where code = p_code returning * into cur;
  return private.room_view(cur);
end $$;

-- The host starts the game: checks the pot, stores the first snapshot and names the game phone.
create or replace function public.start_game(p_code text, p_phone uuid, p_queue jsonb, p_state jsonb, p_view jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; target int; phone uuid;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or r.host_id <> uid then raise exception 'Only the host can start the game' using errcode = '42501'; end if;
  if r.data ->> 'status' <> 'lobby' then raise exception 'The game already started.' using errcode = '55000'; end if;
  target := coalesce((r.data -> 'config' ->> 'pot')::int, 0);
  if private.room_paid_total(r.paid) < greatest(5, target) then raise exception 'The pot is not full yet.' using errcode = '55000'; end if;
  if p_queue is null or p_state is null or octet_length(p_queue::text) > 800000 or octet_length(p_state::text) > 100000 or octet_length(coalesce(p_view, '{}'::jsonb)::text) > 4000 then
    raise exception 'Game data is too large' using errcode = '22023';
  end if;
  phone := coalesce(p_phone, uid);
  if not exists (select 1 from public.room_members where code = r.code and user_id = phone) then
    raise exception 'That player is not in the room' using errcode = '22023';
  end if;
  update public.rooms set data = jsonb_set(data, '{status}', '"active"'::jsonb), game_phone = phone, game_view = p_view,
         game_state = p_state, game_queue = p_queue, game_seq = 1, game_pushed_at = now(), version = version + 1, updated_at = now()
   where code = r.code returning * into r;
  return private.room_view(r);
end $$;

-- The game phone reports progress. Queue is only sent when it changes (more cards bought).
create or replace function public.push_game(p_code text, p_view jsonb, p_state jsonb default null, p_queue jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or r.game_phone is distinct from uid then raise exception 'You are not running this game' using errcode = '42501'; end if;
  if r.data ->> 'status' <> 'active' then raise exception 'The game is not running' using errcode = '55000'; end if;
  if octet_length(coalesce(p_view, '{}'::jsonb)::text) > 4000 or octet_length(coalesce(p_state, '{}'::jsonb)::text) > 100000 or octet_length(coalesce(p_queue, '{}'::jsonb)::text) > 800000 then
    raise exception 'Game data is too large' using errcode = '22023';
  end if;
  update public.rooms set game_view = coalesce(p_view, game_view), game_state = coalesce(p_state, game_state), game_queue = coalesce(p_queue, game_queue),
         game_seq = game_seq + 1, game_pushed_at = now(), version = version + 1
   where code = r.code returning * into r;
  return jsonb_build_object('seq', r.game_seq, 'version', r.version);
end $$;

-- Hand the game to another player who is in the room.
create or replace function public.transfer_game(p_code text, p_to uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or r.game_phone is distinct from uid then raise exception 'You are not running this game' using errcode = '42501'; end if;
  if not exists (select 1 from public.room_members where code = r.code and user_id = p_to) then raise exception 'That player is not in the room' using errcode = '22023'; end if;
  update public.rooms set game_phone = p_to, game_pushed_at = now(), version = version + 1 where code = r.code returning * into r;
  return private.room_view(r);
end $$;

-- Take the game over when the game phone has gone quiet for 45 seconds.
create or replace function public.claim_game(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or not exists (select 1 from public.room_members where code = r.code and user_id = uid) then raise exception 'Not in that room' using errcode = '42501'; end if;
  if r.data ->> 'status' <> 'active' then raise exception 'The game is not running' using errcode = '55000'; end if;
  if r.game_phone = uid then return private.room_view(r); end if;
  if coalesce(r.game_pushed_at, now() - interval '1 hour') > now() - interval '45 seconds' then
    raise exception 'The game phone is still connected.' using errcode = '55000';
  end if;
  update public.rooms set game_phone = uid, game_pushed_at = now(), version = version + 1 where code = r.code returning * into r;
  return private.room_view(r);
end $$;

-- The full snapshot, for the phone that is now running the game.
create or replace function public.get_game_state(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype;
begin
  if uid is null then return null; end if;
  select * into r from public.rooms where code = upper(p_code) and game_phone = uid;
  if not found then return null; end if;
  return jsonb_build_object('state', r.game_state, 'queue', r.game_queue, 'seq', r.game_seq);
end $$;

-- End the game (recap) or send the room back to the lobby for another round. Game phone or host.
create or replace function public.finish_game(p_code text, p_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; d jsonb;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_status not in ('ended', 'lobby') then raise exception 'Bad status' using errcode = '22023'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or (r.host_id <> uid and r.game_phone is distinct from uid) then raise exception 'Not allowed' using errcode = '42501'; end if;
  d := jsonb_set(r.data, '{status}', to_jsonb(p_status));
  if p_status = 'lobby' then d := jsonb_set(d, '{agreedPlayers}', '[]'::jsonb); end if;
  update public.rooms set data = d, paid = case when p_status = 'lobby' then '{}'::jsonb else paid end,
         game_phone = null, game_view = null, game_state = null, game_queue = null, game_seq = 0, game_pushed_at = null,
         version = version + 1, updated_at = now()
   where code = r.code returning * into r;
  return private.room_view(r);
end $$;

revoke all on function public.start_game(text, uuid, jsonb, jsonb, jsonb), public.push_game(text, jsonb, jsonb, jsonb), public.transfer_game(text, uuid),
  public.claim_game(text), public.get_game_state(text), public.finish_game(text, text) from public, anon;
grant execute on function public.start_game(text, uuid, jsonb, jsonb, jsonb), public.push_game(text, jsonb, jsonb, jsonb), public.transfer_game(text, uuid),
  public.claim_game(text), public.get_game_state(text), public.finish_game(text, text) to authenticated;
