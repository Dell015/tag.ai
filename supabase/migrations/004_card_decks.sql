-- Applied as 004_card_decks. A card can belong to several decks (rules in src/lib/game/decks.ts).
-- Chaos is every card and is not stored. Membership was filled from the same rules, in SQL.
create table public.card_decks (
  card_id text not null references public.cards (id) on delete cascade,
  deck_id text not null references public.decks (id) on delete cascade,
  primary key (card_id, deck_id)
);
create index card_decks_deck_idx on public.card_decks (deck_id);
alter table public.card_decks enable row level security;
grant select, insert, update, delete on public.card_decks to authenticated;
create policy card_decks_select on public.card_decks for select to authenticated
  using (exists (select 1 from public.cards c where c.id = card_id));
create policy card_decks_admin_insert on public.card_decks for insert to authenticated with check ((select public.is_admin()));
create policy card_decks_admin_update on public.card_decks for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy card_decks_admin_delete on public.card_decks for delete to authenticated using ((select public.is_admin()));

with c as (
  select id, intensity, category, topics, adult, (card_type <> 'wild' and not adult) as real
  from public.cards where status = 'approved'
)
insert into public.card_decks (card_id, deck_id)
select id, d from c, lateral (values
  ('icebreaker', real and intensity <= 3 and category in ('hot_takes','hypotheticals','memories','dares')),
  ('family',     real and intensity <= 2 and not (topics && array['sexual_content','past_relationships','death','trauma','mental_health','politics','religion'])
                  and category not in ('roasts','confessions','relationships')),
  ('life',       real and intensity <= 4 and category in ('memories','hypotheticals','deep_philosophical')),
  ('deep',       real and intensity >= 2 and category in ('deep_philosophical','confessions','memories')),
  ('barkada',    real and intensity >= 2 and category in ('roasts','hot_takes','dares','controversial','confessions')),
  ('lovers',     real and intensity >= 2 and category in ('relationships','confessions','memories')),
  ('spicy',      real and intensity >= 3),
  ('adult',      adult)
) as m(d, ok) where ok;
-- approve_suggestion was also replaced so an approved card joins its deck (see BUILD_LOG.md).
