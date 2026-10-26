-- A room invite lives as long as the room is open. When the room is deleted (closed, ended by the host, idle or swept), its invites go too.
create or replace function private.drop_room_invites() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.messages where link = '/join?code=' || old.code;
  return old;
end $$;

drop trigger if exists rooms_drop_invites on public.rooms;
create trigger rooms_drop_invites after delete on public.rooms for each row execute function private.drop_room_invites();
