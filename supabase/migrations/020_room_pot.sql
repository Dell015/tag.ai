-- Online rooms, slice 2: the pot is filled from every player's own wallet, on their own phone.
-- The server keeps the ledger of who paid (rooms.paid). The host cannot edit it: publish_room ignores any
-- 'paid' field it is sent. Coins are taken from the player's balance in the same step, so nobody can add what they do not have.
-- Before the game starts, coins go back to the player who paid if they leave, are removed, or the room closes.
-- Once the game starts there are no refunds.

alter table public.rooms add column if not exists paid jsonb not null default '{}'::jsonb;

create or replace function private.room_paid_total(p jsonb) returns integer language sql immutable set search_path = '' as $$
  select coalesce(sum(v::int), 0)::int from jsonb_each_text(coalesce(p, '{}'::jsonb)) as t(k, v);
$$;

create or replace function private.room_view(r public.rooms) returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('version', r.version, 'data', jsonb_set(r.data, '{paid}', r.paid));
$$;

-- Gives one player's coins back (ledger row; the trigger moves the balance) and forgets their payment.
create or replace function private.refund_room_player(p_code text, p_uid uuid) returns void language plpgsql security definer set search_path = '' as $$
declare amt int;
begin
  select coalesce((paid ->> p_uid::text)::int, 0) into amt from public.rooms where code = p_code for update;
  if coalesce(amt, 0) > 0 then
    insert into public.transactions (user_id, kind, amount, note) values (p_uid, 'refund', amt, 'Room ' || p_code || ' closed before the game');
    update public.rooms set paid = paid - p_uid::text, version = version + 1 where code = p_code;
  end if;
end $$;

create or replace function private.refund_room_all(p_code text) returns void language plpgsql security definer set search_path = '' as $$
declare k text;
begin
  for k in select key from public.rooms, jsonb_each(paid) where code = p_code loop
    perform private.refund_room_player(p_code, k::uuid);
  end loop;
end $$;

create or replace function private.sweep_rooms() returns void language plpgsql security definer set search_path = '' as $$
declare c text;
begin
  for c in select code from public.rooms where updated_at < now() - interval '1 day' and data ->> 'status' = 'lobby' loop
    perform private.refund_room_all(c);
  end loop;
  delete from public.rooms where updated_at < now() - interval '1 day';
end $$;

create or replace function public.contribute_room(p_code text, p_amount integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r public.rooms%rowtype;
  target int; remaining int; amt int; bal numeric;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found or not exists (select 1 from public.room_members where code = r.code and user_id = uid) then
    raise exception 'Not in that room' using errcode = '42501';
  end if;
  if r.data ->> 'status' <> 'lobby' then raise exception 'The game already started.' using errcode = '55000'; end if;
  target := coalesce((r.data -> 'config' ->> 'pot')::int, 0);
  if target <= 0 then raise exception 'The host has not set the pot yet.' using errcode = '55000'; end if;
  remaining := target - private.room_paid_total(r.paid);
  if remaining <= 0 then raise exception 'The pot is already full.' using errcode = '55000'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'Add at least 1 coin.' using errcode = '22023'; end if;
  amt := least(p_amount, remaining);

  select p.coins into bal from public.profiles p where p.id = uid for update;
  if bal is null then raise exception 'No profile for this user' using errcode = 'P0002'; end if;
  if bal < amt then raise exception 'Not enough coins: you have %, this needs %', floor(bal), amt using errcode = 'P0001'; end if;
  insert into public.transactions (user_id, kind, amount, note) values (uid, 'pot', -amt, 'Pot for room ' || r.code);

  update public.rooms set paid = jsonb_set(paid, array[uid::text], to_jsonb(coalesce((paid ->> uid::text)::int, 0) + amt)),
         version = version + 1, updated_at = now() where code = r.code returning * into r;
  return private.room_view(r) || jsonb_build_object('balance', bal - amt, 'added', amt);
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
  newdata := jsonb_set(p_data - 'paid', '{online}', 'true'::jsonb);

  select * into cur from public.rooms where code = p_code for update;
  if not found then
    perform private.sweep_rooms();
    if (select count(*) from public.rooms where host_id = uid) >= 5 then
      raise exception 'You already have 5 open rooms. Close one first.' using errcode = '54000';
    end if;
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
  if newdata ->> 'status' = 'lobby' and cur.data ->> 'status' in ('active', 'ended') then
    cur.paid := '{}'::jsonb; paid_total := 0;           -- a new game starts with an empty pot
  elsif newdata ->> 'status' = 'lobby' and paid_total > 0 and target < paid_total then
    raise exception 'The pot already has % coins. Choose at least that many cards.', paid_total using errcode = '55000';
  end if;
  if newdata ->> 'status' = 'active' and cur.data ->> 'status' = 'lobby' and paid_total < greatest(5, target) then
    raise exception 'The pot is not full yet.' using errcode = '55000';
  end if;

  -- Anyone the host removed loses access and gets their coins back (before the game only).
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

  update public.rooms set data = newdata, paid = cur.paid,
         version = version + 1, updated_at = now() where code = p_code returning * into cur;
  return private.room_view(cur);
end $$;

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
  if d ->> 'status' <> 'lobby' then raise exception 'That game already started.' using errcode = '55000'; end if;
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

create or replace function public.get_room(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype;
begin
  if uid is null then return null; end if;
  select * into r from public.rooms where code = upper(p_code)
     and exists (select 1 from public.room_members m where m.code = rooms.code and m.user_id = uid);
  if not found then return null; end if;
  return private.room_view(r);
end $$;

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
  update public.rooms set data = d, version = version + 1, updated_at = now() where code = r.code returning * into r;
  return private.room_view(r);
end $$;

create or replace function public.leave_room(p_code text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r public.rooms%rowtype; d jsonb;
begin
  if uid is null then return; end if;
  select * into r from public.rooms where code = upper(p_code) for update;
  if not found then return; end if;
  if r.host_id = uid then
    if r.data ->> 'status' = 'lobby' then perform private.refund_room_all(r.code); end if;
    delete from public.rooms where code = r.code; return;
  end if;
  if not exists (select 1 from public.room_members where code = r.code and user_id = uid) then return; end if;
  if r.data ->> 'status' = 'lobby' then perform private.refund_room_player(r.code, uid); select * into r from public.rooms where code = r.code; end if;
  delete from public.room_members where code = r.code and user_id = uid;
  d := jsonb_set(r.data, '{players}', coalesce((select jsonb_agg(e) from jsonb_array_elements(r.data -> 'players') e where e ->> 'userId' <> uid::text), '[]'::jsonb));
  d := jsonb_set(d, '{agreedPlayers}', coalesce((select jsonb_agg(x) from jsonb_array_elements_text(coalesce(r.data -> 'agreedPlayers', '[]'::jsonb)) x where x <> uid::text), '[]'::jsonb));
  update public.rooms set data = d, version = version + 1, updated_at = now() where code = r.code;
end $$;

revoke all on function public.contribute_room(text, integer) from public, anon;
grant execute on function public.contribute_room(text, integer) to authenticated;
