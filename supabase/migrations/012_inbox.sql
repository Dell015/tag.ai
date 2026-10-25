-- In-app inbox. Each message belongs to one player. Admins can send one to a player (by email) or to everyone.
-- A message can carry a coin gift that the player claims once.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  body text not null default '' check (char_length(body) <= 500),
  coins integer not null default 0 check (coins between 0 and 10000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  claimed_at timestamptz
);
create index if not exists messages_user_created on public.messages (user_id, created_at desc);
alter table public.messages enable row level security;
create policy "read own messages" on public.messages for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.admin_send_message(target_email text, msg_title text, msg_body text, msg_coins integer default 0)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer; uid uuid;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  if msg_title is null or char_length(btrim(msg_title)) < 1 or char_length(msg_title) > 60 then raise exception 'Title is 1 to 60 characters'; end if;
  if char_length(coalesce(msg_body, '')) > 500 then raise exception 'Message is 500 characters at most'; end if;
  if msg_coins is null or msg_coins < 0 or msg_coins > 10000 then raise exception 'Gift is 0 to 10000 coins'; end if;
  if target_email is null or btrim(target_email) = '' then
    insert into public.messages (user_id, title, body, coins)
      select p.id, btrim(msg_title), coalesce(btrim(msg_body), ''), msg_coins from public.profiles p;
    get diagnostics n = row_count;
    return n;
  end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(btrim(target_email));
  if uid is null or not exists (select 1 from public.profiles p where p.id = uid) then raise exception 'No player with that email'; end if;
  insert into public.messages (user_id, title, body, coins) values (uid, btrim(msg_title), coalesce(btrim(msg_body), ''), msg_coins);
  return 1;
end $$;

create or replace function public.mark_messages_read()
returns void language sql security definer set search_path = '' as $$
  update public.messages set read_at = now() where user_id = (select auth.uid()) and read_at is null;
$$;

create or replace function public.claim_message(msg_id uuid)
returns numeric language plpgsql security definer set search_path = '' as $$
declare m public.messages; bal numeric;
begin
  select * into m from public.messages where id = msg_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'Message not found'; end if;
  if m.coins < 1 then raise exception 'Nothing to claim'; end if;
  if m.claimed_at is not null then raise exception 'Already claimed'; end if;
  update public.messages set claimed_at = now(), read_at = coalesce(read_at, now()) where id = m.id;
  insert into public.transactions (user_id, kind, amount, note) values (m.user_id, 'topup', m.coins, left('Gift: ' || m.title, 200));
  select p.coins into bal from public.profiles p where p.id = m.user_id;
  return bal;
end $$;

revoke execute on function public.admin_send_message(text, text, text, integer) from public, anon;
revoke execute on function public.mark_messages_read() from public, anon;
revoke execute on function public.claim_message(uuid) from public, anon;
grant execute on function public.admin_send_message(text, text, text, integer) to authenticated;
grant execute on function public.mark_messages_read() to authenticated;
grant execute on function public.claim_message(uuid) to authenticated;

grant select on public.messages to authenticated;
