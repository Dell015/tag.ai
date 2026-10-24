-- Applied as 005_stacks. A stack is a named list of cards a player puts together (like a playlist).
-- Liked cards are the existing saved_cards. A stack holds card ids only, never copies or edits.
-- Only cards the player can already see (row-level security on cards) can be added.
create table public.stacks (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);
create index stacks_owner_idx on public.stacks (owner_id);

create table public.stack_cards (
  stack_id uuid not null references public.stacks (id) on delete cascade,
  card_id  text not null references public.cards (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (stack_id, card_id)
);

alter table public.stacks      enable row level security;
alter table public.stack_cards enable row level security;

grant select, insert, delete on public.stacks to authenticated;
grant update (name) on public.stacks to authenticated;
grant select, insert, delete on public.stack_cards to authenticated;

create policy stacks_select on public.stacks for select to authenticated using (owner_id = (select auth.uid()));
create policy stacks_insert on public.stacks for insert to authenticated with check (owner_id = (select auth.uid()));
create policy stacks_update on public.stacks for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy stacks_delete on public.stacks for delete to authenticated using (owner_id = (select auth.uid()));

create policy stack_cards_select on public.stack_cards for select to authenticated
  using (exists (select 1 from public.stacks s where s.id = stack_id and s.owner_id = (select auth.uid())));
-- The card must be one this player can see, so adult cards stay out until 18+ is confirmed.
create policy stack_cards_insert on public.stack_cards for insert to authenticated
  with check (exists (select 1 from public.stacks s where s.id = stack_id and s.owner_id = (select auth.uid()))
              and exists (select 1 from public.cards c where c.id = card_id));
create policy stack_cards_delete on public.stack_cards for delete to authenticated
  using (exists (select 1 from public.stacks s where s.id = stack_id and s.owner_id = (select auth.uid())));

-- Limits: 20 stacks per player, 200 cards per stack.
create or replace function private.stacks_limit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.stacks s where s.owner_id = new.owner_id) >= 20 then
    raise exception 'You can have up to 20 stacks.';
  end if;
  new.name := btrim(new.name);
  return new;
end;
$$;
create trigger stacks_limit before insert on public.stacks for each row execute function private.stacks_limit();

create or replace function private.stack_cards_limit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.stack_cards c where c.stack_id = new.stack_id) >= 200 then
    raise exception 'A stack can hold up to 200 cards.';
  end if;
  return new;
end;
$$;
create trigger stack_cards_limit before insert on public.stack_cards for each row execute function private.stack_cards_limit();
