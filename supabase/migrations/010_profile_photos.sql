-- Profile photos. The picture is a small JPEG in the public "avatars" bucket, one folder per player.
-- profiles.avatar keeps either a colour key ("c0".."c9") or "p:<user id>/<timestamp>.jpg".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 204800, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 204800, allowed_mime_types = array['image/jpeg'];

drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.profiles drop constraint profiles_avatar_check;
alter table public.profiles add constraint profiles_avatar_check
  check (avatar ~ '^c[0-9]$' or avatar ~ '^p:[0-9a-f-]{36}/[0-9]{10,14}\.jpg$');

create or replace function public.complete_profile(username text, avatar text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  u   text := btrim(username);
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if u is null or u !~ '^[A-Za-z0-9_]{2,16}$' then
    raise exception 'Name must be 2 to 16 letters, numbers or underscores' using errcode = '22023';
  end if;
  if avatar is null or not (avatar ~ '^c[0-9]$' or (avatar ~ '^p:[0-9a-f-]{36}/[0-9]{10,14}\.jpg$' and avatar like 'p:' || uid::text || '/%')) then
    raise exception 'Pick a colour or your own photo' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles p where lower(p.username) = lower(u) and p.id <> uid) then
    raise exception 'That name is taken' using errcode = '23505';
  end if;
  update public.profiles p set username = u, avatar = complete_profile.avatar where p.id = uid;
  if not found then
    raise exception 'No profile for this user' using errcode = 'P0002';
  end if;
end;
$$;
