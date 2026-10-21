-- Applied as 002d_indexes_and_shop_policy. Indexes for foreign keys; signed-out visitors read shop items
-- without calling is_admin().
create index if not exists card_reports_reporter_idx on public.card_reports (reporter_id);
create index if not exists owned_items_item_idx on public.owned_items (item_id);
create index if not exists suggestions_card_idx on public.suggestions (card_id);
create index if not exists suggestions_deck_idx on public.suggestions (deck_id);
create index if not exists suggestions_reviewer_idx on public.suggestions (reviewer_id);
alter policy shop_items_select on public.shop_items using (active);
create policy shop_items_select_admin on public.shop_items for select to authenticated using ((select public.is_admin()));
revoke execute on function public.is_admin() from anon;
