-- Online rooms, slice 4: one shared pot with no target, per-player skipped topics, joining a game in progress.
-- The pot is one number that everyone adds to (and, before the host confirms, takes back from). Whatever is in it
-- when the host starts is how many cards the game has. The host's Confirm is stored as data.potConfirmed.

alter table public.rooms add column if not exists skips jsonb not null default '{}'::jsonb;

create or replace function private.room_view(r public.rooms) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('version', r.version, 'data',
    jsonb_set(jsonb_set(r.data, '{paid}', r.paid), '{skips}', r.skips) ||
    case when r.game_phone is null then '{}'::jsonb
         else jsonb_build_object('gamePhone', r.game_phone, 'gameView', coalesce(r.game_view, 'null'::jsonb),
                                 'gameAge', greatest(0, extract(epoch from (now() - coalesce(r.game_pushed_at, now())))::int)) end);
$$;

-- Anyone in the room says which topics they want left out. Before the game starts only.
create or replace function public.set_skips(p_code text, p_topics text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; clean text[];
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or not exists (select 1 from public.room_members where code = r.code and user_id = uid) then
    raise exception 'Not in that room' using errcode = '42501';
  end if;
  if r.data ->> 'status' <> 'lobby' then raise exception 'The rules are locked once the game starts.' using errcode = '55000'; end if;
  select coalesce(array_agg(distinct left(btrim(t), 24)) filter (where btrim(t) <> ''), '{}') into clean from unnest(coalesce(p_topics, '{}')) t;
  if array_length(clean, 1) > 30 then raise exception 'Too many topics' using errcode = '22023'; end if;
  update public.rooms set skips = jsonb_set(skips, array[uid::text], to_jsonb(clean)), version = version + 1, updated_at = now()
   where code = r.code returning * into r;
  return private.room_view(r);
end $$;

-- Add coins to the shared pot. No target: the host decides when it is enough.
create or replace function public.contribute_room(p_code text, p_amount integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r public.rooms%rowtype;
  amt int; bal numeric;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or not exists (select 1 from public.room_members where code = r.code and user_id = uid) then
    raise exception 'Not in that room' using errcode = '42501';
  end if;
  if r.data ->> 'status' <> 'lobby' then raise exception 'The game already started.' using errcode = '55000'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'Add at least 1 coin.' using errcode = '22023'; end if;
  amt := least(p_amount, 500 - private.room_paid_total(r.paid));
  if amt <= 0 then raise exception 'The pot is full. 500 cards is the most a game can have.' using errcode = '55000'; end if;

  select p.coins into bal from public.profiles p where p.id = uid for update;
  if bal is null then raise exception 'No profile for this user' using errcode = 'P0002'; end if;
  if bal < amt then raise exception 'Not enough coins: you have %, this needs %', floor(bal), amt using errcode = 'P0001'; end if;
  insert into public.transactions (user_id, kind, amount, note) values (uid, 'pot', -amt, 'Pot for room ' || r.code);

  update public.rooms set paid = jsonb_set(paid, array[uid::text], to_jsonb(coalesce((paid ->> uid::text)::int, 0) + amt)),
         version = version + 1, updated_at = now() where code = r.code returning * into r;
  return private.room_view(r) || jsonb_build_object('balance', bal - amt, 'added', amt);
end $$;

-- Take back some of your own coins, down to zero, until the host confirms the pot.
create or replace function public.withdraw_from_pot(p_code text, p_amount integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r public.rooms%rowtype;
  mine int; amt int; bal numeric;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or not exists (select 1 from public.room_members where code = r.code and user_id = uid) then
    raise exception 'Not in that room' using errcode = '42501';
  end if;
  if r.data ->> 'status' <> 'lobby' then raise exception 'The game already started. Coins in the pot are not refunded.' using errcode = '55000'; end if;
  if coalesce((r.data ->> 'potConfirmed')::boolean, false) then raise exception 'The host confirmed the pot. Coins can only be added now.' using errcode = '55000'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'Take back at least 1 coin.' using errcode = '22023'; end if;
  mine := coalesce((r.paid ->> uid::text)::int, 0);
  amt := least(p_amount, mine);
  if amt <= 0 then raise exception 'You have no coins in the pot.' using errcode = '55000'; end if;
  insert into public.transactions (user_id, kind, amount, note) values (uid, 'refund', amt, 'Taken back from room ' || r.code);
  update public.rooms set paid = case when mine - amt <= 0 then paid - uid::text else jsonb_set(paid, array[uid::text], to_jsonb(mine - amt)) end,
         version = version + 1, updated_at = now() where code = r.code returning * into r;
  select p.coins into bal from public.profiles p where p.id = uid;
  return private.room_view(r) || jsonb_build_object('balance', bal, 'removed', amt);
end $$;

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
  newdata := jsonb_set(p_data - 'paid' - 'gamePhone' - 'gameView' - 'gameAge' - 'skips', '{online}', 'true'::jsonb);

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


-- The host starts the game: the pot (at least 10) must be confirmed.
create or replace function public.start_game(p_code text, p_phone uuid, p_queue jsonb, p_state jsonb, p_view jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; phone uuid;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or r.host_id <> uid then raise exception 'Only the host can start the game' using errcode = '42501'; end if;
  if r.data ->> 'status' <> 'lobby' then raise exception 'The game already started.' using errcode = '55000'; end if;
  if private.room_paid_total(r.paid) < 10 then raise exception 'The pot needs at least 10 coins.' using errcode = '55000'; end if;
  if not coalesce((r.data ->> 'potConfirmed')::boolean, false) then raise exception 'Confirm the pot first.' using errcode = '55000'; end if;
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

-- Joining: also possible while a game is running. The newcomer can add to the pot but not change the rules.
create or replace function public.join_room(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r public.rooms%rowtype;
  me record;
  d jsonb;
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
    return private.room_view(r);
  end if;
  if d ->> 'status' not in ('lobby', 'active') then raise exception 'That game is over.' using errcode = '55000'; end if;
  if jsonb_array_length(d -> 'players') >= 20 then raise exception 'That room is full.' using errcode = '54000'; end if;
  select p.username, p.avatar into me from public.profiles p where p.id = uid;
  if me.username is null then raise exception 'Finish your profile first' using errcode = '55000'; end if;

  d := jsonb_set(d, '{players}', (d -> 'players') || jsonb_build_array(jsonb_build_object(
        'id', uid, 'userId', uid, 'displayName', me.username, 'avatarUrl', me.avatar,
        'turnOrder', coalesce((select max((e ->> 'turnOrder')::int) + 1 from jsonb_array_elements(d -> 'players') e), 0),
        'agreedToRules', false)));
  update public.rooms set data = d, version = version + 1, updated_at = now() where code = p_code returning * into r;
  insert into public.room_members (code, user_id) values (p_code, uid);
  return private.room_view(r);
end $$;


revoke all on function public.set_skips(text, text[]), public.withdraw_from_pot(text, integer) from public, anon;
grant execute on function public.set_skips(text, text[]), public.withdraw_from_pot(text, integer) to authenticated;

create or replace function public.finish_game(p_code text, p_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; d jsonb;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_status not in ('ended', 'lobby') then raise exception 'Bad status' using errcode = '22023'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or (r.host_id <> uid and r.game_phone is distinct from uid) then raise exception 'Not allowed' using errcode = '42501'; end if;
  d := jsonb_set(r.data, '{status}', to_jsonb(p_status));
  if p_status = 'lobby' then d := jsonb_set(jsonb_set(d, '{agreedPlayers}', '[]'::jsonb), '{potConfirmed}', 'false'::jsonb); end if;
  update public.rooms set data = d, paid = case when p_status = 'lobby' then '{}'::jsonb else paid end, skips = case when p_status = 'lobby' then '{}'::jsonb else skips end,
         game_phone = null, game_view = null, game_state = null, game_queue = null, game_seq = 0, game_pushed_at = null,
         version = version + 1, updated_at = now()
   where code = r.code returning * into r;
  return private.room_view(r);
end $$;
