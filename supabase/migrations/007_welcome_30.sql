-- Welcome gift is now 30 coins (session pricing: 1 coin per card).
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  uname text := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');
  av    text := new.raw_user_meta_data ->> 'avatar';
begin
  if uname is not null and (
       uname !~ '^[A-Za-z0-9_]{2,16}$'
       or exists (select 1 from public.profiles p where lower(p.username) = lower(uname))
     ) then
    uname := null;
  end if;
  if av is null or av !~ '^c[0-9]$' then
    av := 'c0';
  end if;

  insert into public.profiles (id, username, avatar) values (new.id, uname, av);
  insert into public.transactions (user_id, kind, amount, note) values (new.id, 'welcome', 30, 'Welcome gift');
  return new;
end;
$$;
