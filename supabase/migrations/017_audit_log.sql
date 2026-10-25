-- Audit log: an append-only record of who did what. Filled by database triggers, so every path (screens, functions,
-- the dashboard) is covered without changing the functions themselves. Only admins can read it, through one function.

create table if not exists public.audit_log (
  id             bigint generated always as identity primary key,
  at             timestamptz not null default now(),
  actor_id       uuid,
  actor_label    text,
  actor_is_admin boolean not null default false,
  action         text not null,
  area           text not null,
  target_id      uuid,
  target_label   text,
  summary        text not null,
  amount         numeric,
  meta           jsonb not null default '{}'::jsonb
);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_area_idx on public.audit_log (area, at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id, at desc);
create index if not exists audit_log_target_idx on public.audit_log (target_id, at desc);

create or replace function private.audit_log_immutable() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'The audit log cannot be changed' using errcode = '42501'; end $$;
drop trigger if exists audit_log_no_update on public.audit_log;
create trigger audit_log_no_update before update or delete on public.audit_log for each row execute function private.audit_log_immutable();

create or replace function private.audit(p_action text, p_target uuid, p_summary text, p_amount numeric default null, p_meta jsonb default '{}'::jsonb, p_actor uuid default auth.uid())
returns void language plpgsql security definer set search_path = '' as $$
declare a_label text; t_label text; adm boolean := false;
begin
  begin
    if p_actor is not null then
      select coalesce(u.email::text, p_actor::text) into a_label from auth.users u where u.id = p_actor;
      adm := exists (select 1 from public.admins x where x.user_id = p_actor);
    end if;
    if p_target is not null then select coalesce(u.email::text, p_target::text) into t_label from auth.users u where u.id = p_target; end if;
    insert into public.audit_log (actor_id, actor_label, actor_is_admin, action, area, target_id, target_label, summary, amount, meta)
    values (p_actor, coalesce(a_label, case when p_actor is null then 'system' else p_actor::text end), adm, p_action, split_part(p_action, '.', 1), p_target, t_label, left(coalesce(p_summary, ''), 300), p_amount, coalesce(p_meta, '{}'::jsonb));
  exception when others then
    raise warning 'audit failed: %', sqlerrm;
  end;
end $$;

-- Coins: every ledger row.
create or replace function private.audit_tx() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.audit('coins.' || new.kind, new.user_id, coalesce(nullif(new.note, ''), new.kind), new.amount, jsonb_build_object('transaction', new.id));
  return new;
end $$;
drop trigger if exists audit_tx on public.transactions;
create trigger audit_tx after insert on public.transactions for each row execute function private.audit_tx();

-- Payments.
create or replace function private.audit_payment() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.audit('payment.requested', new.user_id, new.ref || ': ' || new.coins || ' coins for P' || new.price_php, new.price_php, jsonb_build_object('ref', new.ref, 'coins', new.coins, 'package', new.package_id));
  else
    if new.status is distinct from old.status then
      perform private.audit('payment.' || new.status, new.user_id, new.ref || ': ' || new.coins || ' coins for P' || new.price_php, new.price_php, jsonb_build_object('ref', new.ref, 'coins', new.coins));
    end if;
    if new.receipt_path is distinct from old.receipt_path and new.receipt_path is not null then
      perform private.audit('payment.receipt', new.user_id, new.ref || ': receipt uploaded', new.price_php, jsonb_build_object('ref', new.ref));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists audit_payment on public.payment_requests;
create trigger audit_payment after insert or update on public.payment_requests for each row execute function private.audit_payment();

-- Suggestions.
create or replace function private.audit_suggestion() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.audit('suggestion.sent', new.author_id, left(new.text, 140), null, jsonb_build_object('suggestion', new.id, 'kind', new.kind, 'deck', new.deck_id));
  elsif new.status is distinct from old.status then
    perform private.audit('suggestion.' || new.status, new.author_id, left(new.text, 120) || coalesce(' (' || nullif(new.reject_reason, '') || ')', ''), null, jsonb_build_object('suggestion', new.id, 'card', new.card_id));
  end if;
  return new;
end $$;
drop trigger if exists audit_suggestion on public.suggestions;
create trigger audit_suggestion after insert or update on public.suggestions for each row execute function private.audit_suggestion();

-- Cards.
create or replace function private.audit_card() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then perform private.audit('card.added', null, left(new.text, 140), null, jsonb_build_object('card', new.id, 'status', new.status)); end if;
  elsif new.status is distinct from old.status then
    perform private.audit('card.' || new.status, null, left(new.text, 140), null, jsonb_build_object('card', new.id, 'from', old.status));
  end if;
  return new;
end $$;
drop trigger if exists audit_card on public.cards;
create trigger audit_card after insert or update on public.cards for each row execute function private.audit_card();

-- Blocked words.
create or replace function private.audit_word() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then perform private.audit('word.added', null, new.word); return new;
  else perform private.audit('word.removed', null, old.word); return old; end if;
end $$;
drop trigger if exists audit_word on public.blocked_words;
create trigger audit_word after insert or delete on public.blocked_words for each row execute function private.audit_word();

-- Inbox messages.
create or replace function private.audit_message() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.audit('message.sent', new.user_id, new.title, nullif(new.coins, 0), jsonb_build_object('message', new.id));
  elsif old.claimed_at is null and new.claimed_at is not null then
    perform private.audit('message.claimed', new.user_id, new.title, nullif(new.coins, 0), jsonb_build_object('message', new.id), new.user_id);
  end if;
  return new;
end $$;
drop trigger if exists audit_message on public.messages;
create trigger audit_message after insert or update on public.messages for each row execute function private.audit_message();

-- Admin list.
create or replace function private.audit_admin() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then perform private.audit('admin.granted', new.user_id, 'Made an admin'); return new;
  else perform private.audit('admin.removed', old.user_id, 'Admin removed'); return old; end if;
end $$;
drop trigger if exists audit_admin on public.admins;
create trigger audit_admin after insert or delete on public.admins for each row execute function private.audit_admin();

-- Players.
create or replace function private.audit_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.audit('player.joined', new.id, 'Joined as ' || coalesce(new.username, 'new player'), null, '{}'::jsonb, new.id);
  else
    if new.is_adult_confirmed and not old.is_adult_confirmed then perform private.audit('player.adult_confirmed', new.id, 'Confirmed 18 or older', null, '{}'::jsonb, new.id); end if;
    if new.username is distinct from old.username and old.username is not null then perform private.audit('player.renamed', new.id, old.username || ' to ' || coalesce(new.username, '')); end if;
  end if;
  return new;
end $$;
drop trigger if exists audit_profile on public.profiles;
create trigger audit_profile after insert or update on public.profiles for each row execute function private.audit_profile();

-- Feed posts and reports.
create or replace function private.audit_post() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.audit('post.created', new.author_id, left(new.body, 140), null, jsonb_build_object('post', new.id, 'kind', new.kind, 'deck', new.deck_id));
  elsif tg_op = 'UPDATE' then
    if new.hidden is distinct from old.hidden then
      perform private.audit(case when new.hidden then 'post.hidden' else 'post.restored' end, new.author_id, left(new.body, 140), null, jsonb_build_object('post', new.id));
    end if;
  else
    perform private.audit('post.deleted', old.author_id, left(old.body, 140), null, jsonb_build_object('post', old.id));
    return old;
  end if;
  return new;
end $$;
drop trigger if exists audit_post on public.posts;
create trigger audit_post after insert or update or delete on public.posts for each row execute function private.audit_post();

create or replace function private.audit_post_report() returns trigger language plpgsql security definer set search_path = '' as $$
declare author uuid; body text;
begin
  select p.author_id, p.body into author, body from public.posts p where p.id = new.post_id;
  perform private.audit('post.reported', author, left(coalesce(body, ''), 100) || coalesce(' (' || nullif(new.reason, '') || ')', ''), null, jsonb_build_object('post', new.post_id), new.reporter_id);
  return new;
end $$;
drop trigger if exists audit_post_report on public.post_reports;
create trigger audit_post_report after insert on public.post_reports for each row execute function private.audit_post_report();

-- Reading: filters, search, sort and paging in one admin only function.
create or replace function public.admin_audit_log(
  p_search text default null, p_areas text[] default null, p_actions text[] default null,
  p_actor text default null, p_target text default null,
  p_from timestamptz default null, p_to timestamptz default null,
  p_min numeric default null, p_max numeric default null,
  p_who text default 'all', p_sort text default 'at', p_dir text default 'desc',
  p_limit integer default 50, p_offset integer default 0)
returns table (id bigint, at timestamptz, actor_id uuid, actor_label text, actor_is_admin boolean, action text, area text,
               target_id uuid, target_label text, summary text, amount numeric, meta jsonb, total bigint)
language plpgsql security definer set search_path = '' stable as $$
declare col text; dir text; lim int := greatest(1, least(coalesce(p_limit, 50), 1000)); off int := greatest(0, coalesce(p_offset, 0));
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  col := case p_sort when 'amount' then 'amount' when 'action' then 'action' when 'actor' then 'actor_label' when 'target' then 'target_label' else 'at' end;
  dir := case when lower(coalesce(p_dir, 'desc')) = 'asc' then 'asc' else 'desc' end;
  return query execute format($q$
    select a.id, a.at, a.actor_id, a.actor_label, a.actor_is_admin, a.action, a.area, a.target_id, a.target_label, a.summary, a.amount, a.meta,
           count(*) over () as total
    from public.audit_log a
    where ($1 is null or btrim($1) = '' or position(lower(btrim($1)) in lower(concat_ws(' ', a.summary, a.actor_label, a.target_label, a.action, a.meta::text))) > 0)
      and ($2 is null or cardinality($2) = 0 or a.area = any($2))
      and ($3 is null or cardinality($3) = 0 or a.action = any($3))
      and ($4 is null or btrim($4) = '' or position(lower(btrim($4)) in lower(coalesce(a.actor_label, ''))) > 0)
      and ($5 is null or btrim($5) = '' or position(lower(btrim($5)) in lower(coalesce(a.target_label, ''))) > 0)
      and ($6 is null or a.at >= $6) and ($7 is null or a.at < $7)
      and ($8 is null or a.amount >= $8) and ($9 is null or a.amount <= $9)
      and (coalesce($10, 'all') = 'all'
           or ($10 = 'admins' and a.actor_is_admin)
           or ($10 = 'players' and a.actor_id is not null and not a.actor_is_admin)
           or ($10 = 'system' and a.actor_id is null))
    order by a.%I %s nulls last, a.id desc
    limit %s offset %s
  $q$, col, dir, lim, off)
  using p_search, p_areas, p_actions, p_actor, p_target, p_from, p_to, p_min, p_max, p_who;
end $$;
revoke all on function public.admin_audit_log(text, text[], text[], text, text, timestamptz, timestamptz, numeric, numeric, text, text, text, integer, integer) from public, anon;
grant execute on function public.admin_audit_log(text, text[], text[], text, text, timestamptz, timestamptz, numeric, numeric, text, text, text, integer, integer) to authenticated;

-- History from before the log existed: coin ledger and sign ups.
insert into public.audit_log (at, actor_id, actor_label, actor_is_admin, action, area, target_id, target_label, summary, amount, meta)
select t.created_at, null, 'before the log', false, 'coins.' || t.kind, 'coins', t.user_id, u.email::text, coalesce(nullif(t.note, ''), t.kind), t.amount, jsonb_build_object('transaction', t.id, 'backfilled', true)
from public.transactions t left join auth.users u on u.id = t.user_id
where not exists (select 1 from public.audit_log);
insert into public.audit_log (at, actor_id, actor_label, actor_is_admin, action, area, target_id, target_label, summary, meta)
select p.created_at, p.id, u.email::text, false, 'player.joined', 'player', p.id, u.email::text, 'Joined as ' || coalesce(p.username, 'new player'), '{"backfilled":true}'::jsonb
from public.profiles p left join auth.users u on u.id = p.id
where not exists (select 1 from public.audit_log a where a.action = 'player.joined' and a.target_id = p.id);
