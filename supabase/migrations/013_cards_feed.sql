-- Cards feed: players post cards, others cheer them. Posts go live at once; reports hide them.
-- Tables are not readable directly. Everything goes through the functions below.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('truth','dare','dice','coin','bottle','wheel','rule')),
  deck_id text not null check (deck_id in ('icebreaker','family','life','deep','barkada','lovers','spicy','adult')),
  body text not null check (char_length(body) between 15 and 160),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index posts_created on public.posts (created_at desc);
create index posts_author on public.posts (author_id, created_at desc);

create table public.post_cheers (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_cheers_user on public.post_cheers (user_id, created_at desc);

create table public.post_reports (
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (post_id, reporter_id)
);

alter table public.posts enable row level security;
alter table public.post_cheers enable row level security;
alter table public.post_reports enable row level security;

-- Create a post. 5 a day, no blocked words, adult deck needs a confirmed adult.
create or replace function public.create_post(p_kind text, p_deck text, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); t text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g')); pid uuid;
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if char_length(t) < 15 then raise exception 'Write at least 15 characters'; end if;
  if char_length(t) > 160 then raise exception 'Keep it under 160 characters'; end if;
  if p_deck = 'adult' and not exists (select 1 from public.profiles p where p.id = uid and p.is_adult_confirmed) then
    raise exception 'Adult cards need a confirmed age';
  end if;
  if (select count(*) from public.posts where author_id = uid and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'You can post 5 cards a day. Come back tomorrow';
  end if;
  if exists (select 1 from public.blocked_words b where position(lower(b.word) in lower(t)) > 0) then
    raise exception 'That card has a word we do not allow';
  end if;
  if exists (select 1 from public.posts where lower(body) = lower(t) and not hidden) then
    raise exception 'Someone already posted this card';
  end if;
  insert into public.posts (author_id, kind, deck_id, body) values (uid, p_kind, p_deck, t) returning id into pid;
  return pid;
end $$;

-- The feed. Sort 'new' or 'top' (this month, cheers from accounts older than 7 days, not the author). Adult posts only on request and only for confirmed adults.
create or replace function public.list_posts(p_sort text default 'new', p_adult boolean default false, p_limit integer default 30)
returns table (id uuid, author_id uuid, author_name text, author_avatar text, kind text, deck_id text, body text, created_at timestamptz, cheers integer, mine boolean, cheered boolean)
language sql stable security definer set search_path = '' as $$
  with me as (select (select auth.uid()) as uid, coalesce((select p.is_adult_confirmed from public.profiles p where p.id = (select auth.uid())), false) as adult),
  base as (
    select po.*, pr.username, pr.avatar,
      (select count(*) from public.post_cheers c where c.post_id = po.id)::int as total,
      (select count(*) from public.post_cheers c join public.profiles cp on cp.id = c.user_id
         where c.post_id = po.id and c.user_id <> po.author_id and cp.created_at <= now() - interval '7 days')::int as weight
    from public.posts po join public.profiles pr on pr.id = po.author_id, me
    where not po.hidden
      and (po.deck_id <> 'adult' or (p_adult and me.adult))
      and not exists (select 1 from public.post_reports r where r.post_id = po.id and r.reporter_id = me.uid)
      and (p_sort <> 'top' or po.created_at >= date_trunc('month', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila')
  )
  select b.id, b.author_id, coalesce(b.username, 'Player'), b.avatar, b.kind, b.deck_id, b.body, b.created_at, b.total,
         b.author_id = me.uid, exists (select 1 from public.post_cheers c where c.post_id = b.id and c.user_id = me.uid)
  from base b, me
  order by case when p_sort = 'top' then b.weight end desc nulls last, b.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- Cheer or un-cheer. Not your own post. 30 new cheers a day.
create or replace function public.cheer_post(p_post uuid)
returns table (cheers integer, cheered boolean) language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); had boolean;
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from public.posts where id = p_post and author_id = uid) then raise exception 'You cannot cheer your own card'; end if;
  if not exists (select 1 from public.posts where id = p_post and not hidden) then raise exception 'That card is gone'; end if;
  select exists (select 1 from public.post_cheers where post_id = p_post and user_id = uid) into had;
  if had then
    delete from public.post_cheers where post_id = p_post and user_id = uid;
  else
    if (select count(*) from public.post_cheers where user_id = uid and created_at > now() - interval '24 hours') >= 30 then
      raise exception 'That is 30 cheers today. More tomorrow';
    end if;
    insert into public.post_cheers (post_id, user_id) values (p_post, uid);
  end if;
  return query select (select count(*) from public.post_cheers where post_id = p_post)::int, not had;
end $$;

-- Report. It disappears for the reporter at once and for everyone once two different people report it.
create or replace function public.report_post(p_post uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Sign in first'; end if;
  insert into public.post_reports (post_id, reporter_id, reason) values (p_post, uid, left(nullif(btrim(p_reason), ''), 200)) on conflict do nothing;
  if (select count(*) from public.post_reports where post_id = p_post) >= 2 then
    update public.posts set hidden = true where id = p_post;
  end if;
end $$;

create or replace function public.delete_post(p_post uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.posts where id = p_post and (author_id = (select auth.uid()) or public.is_admin());
end $$;

-- Admin: reported posts, and restore or remove them.
create or replace function public.admin_reported_posts()
returns table (id uuid, author_name text, kind text, deck_id text, body text, hidden boolean, reports integer, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select po.id, coalesce(pr.username, 'Player'), po.kind, po.deck_id, po.body, po.hidden, (select count(*) from public.post_reports r where r.post_id = po.id)::int, po.created_at
    from public.posts po join public.profiles pr on pr.id = po.author_id
    where exists (select 1 from public.post_reports r where r.post_id = po.id)
    order by po.hidden desc, po.created_at desc limit 50;
end $$;

create or replace function public.admin_restore_post(p_post uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  update public.posts set hidden = false where id = p_post;
  delete from public.post_reports where post_id = p_post;
end $$;

revoke execute on function public.create_post(text, text, text) from public, anon;
revoke execute on function public.list_posts(text, boolean, integer) from public, anon;
revoke execute on function public.cheer_post(uuid) from public, anon;
revoke execute on function public.report_post(uuid, text) from public, anon;
revoke execute on function public.delete_post(uuid) from public, anon;
revoke execute on function public.admin_reported_posts() from public, anon;
revoke execute on function public.admin_restore_post(uuid) from public, anon;
grant execute on function public.create_post(text, text, text) to authenticated;
grant execute on function public.list_posts(text, boolean, integer) to authenticated;
grant execute on function public.cheer_post(uuid) to authenticated;
grant execute on function public.report_post(uuid, text) to authenticated;
grant execute on function public.delete_post(uuid) to authenticated;
grant execute on function public.admin_reported_posts() to authenticated;
grant execute on function public.admin_restore_post(uuid) to authenticated;
