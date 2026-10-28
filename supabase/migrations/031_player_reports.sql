-- Reporting a player (from the Cards feed) and photo moderation.
-- Reports go to admins only. Removing a photo sends no message to the player (owner decision).

create table if not exists public.player_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_id uuid not null references auth.users (id) on delete cascade,
  post_id     uuid references public.posts (id) on delete set null,
  kind        text not null check (kind in ('player', 'photo')),
  reason      text check (reason is null or char_length(reason) <= 200),
  status      text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  created_at  timestamptz not null default now(),
  unique (reporter_id, reported_id, kind)
);
create index if not exists player_reports_reported_idx on public.player_reports (reported_id) where status = 'open';
create index if not exists player_reports_post_idx on public.player_reports (post_id);
alter table public.player_reports enable row level security;
revoke all on public.player_reports from anon, authenticated;

create or replace function public.report_player(p_user uuid, p_kind text, p_reason text default null, p_post uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_user = uid then raise exception 'You cannot report yourself.' using errcode = '22023'; end if;
  if p_kind not in ('player', 'photo') then raise exception 'Pick what to report.' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'Player not found.' using errcode = 'P0002'; end if;
  if (select count(*) from public.player_reports where reporter_id = uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Too many reports today. Try again tomorrow.' using errcode = '54000';
  end if;
  insert into public.player_reports (reporter_id, reported_id, post_id, kind, reason)
  values (uid, p_user, p_post, p_kind, left(nullif(btrim(coalesce(p_reason, '')), ''), 200))
  on conflict (reporter_id, reported_id, kind) do update set status = 'open', reason = excluded.reason, post_id = excluded.post_id, created_at = now()
    where public.player_reports.status <> 'open';
end $$;

create or replace function public.admin_player_reports() returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(q) order by q."latest" desc) from (
    select pr.id as "userId", coalesce(pr.username, 'Player') as name, pr.avatar, pr.code,
      count(*)::int as reports,
      bool_or(r.kind = 'photo') as "photoReported",
      coalesce(jsonb_agg(distinct r.reason) filter (where r.reason is not null), '[]'::jsonb) as reasons,
      max(r.created_at) as "latest",
      (select left(po.body, 120) from public.posts po where po.id = (array_agg(r.post_id order by r.created_at desc) filter (where r.post_id is not null))[1]) as "postBody"
    from public.player_reports r join public.profiles pr on pr.id = r.reported_id
    where r.status = 'open'
    group by pr.id, pr.username, pr.avatar, pr.code
    limit 50) q), '[]'::jsonb);
end $$;

-- Admins may delete stored photos (the app does it after the profile goes back to a colour).
drop policy if exists avatars_delete_admin on storage.objects;
create policy avatars_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (select public.is_admin()));

-- Resets the profile to a colour and returns the player's id so the app can delete the stored files.
create or replace function public.admin_resolve_player(p_user uuid, p_action text) returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  if p_action = 'remove_photo' then
    update public.profiles set avatar = 'c' || (abs(hashtext(p_user::text)) % 10)::text where id = p_user and avatar like 'p:%';
    update public.player_reports set status = 'actioned' where reported_id = p_user and status = 'open';
  elsif p_action = 'dismiss' then
    update public.player_reports set status = 'dismissed' where reported_id = p_user and status = 'open';
  else
    raise exception 'Unknown action.' using errcode = '22023';
  end if;
  return p_user;
end $$;

create or replace function public.admin_photos(p_limit integer default 60, p_offset integer default 0) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(q)) from (
    select id as "userId", coalesce(username, 'Player') as name, avatar, created_at as "createdAt"
    from public.profiles where avatar like 'p:%'
    order by created_at desc limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)) q), '[]'::jsonb);
end $$;

revoke all on function public.report_player(uuid, text, text, uuid), public.admin_player_reports(), public.admin_resolve_player(uuid, text), public.admin_photos(integer, integer) from public, anon;
grant execute on function public.report_player(uuid, text, text, uuid), public.admin_player_reports(), public.admin_resolve_player(uuid, text), public.admin_photos(integer, integer) to authenticated;
