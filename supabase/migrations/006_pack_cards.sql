-- Applied as 006_pack_cards. Shop pack cards now live in public.cards, tagged with the pack they belong to.
-- A pack card is only visible to players who own that pack (and admins), so stacks can hold owned pack cards.
alter table public.cards add column pack_id text references public.shop_items (id);
create index cards_pack_idx on public.cards (pack_id) where pack_id is not null;

alter policy cards_select on public.cards using (
  (
    status = 'approved'
    and (pack_id is null or exists (
      select 1 from public.owned_items o where o.user_id = (select auth.uid()) and o.item_id = cards.pack_id))
    and ((not adult) or exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_adult_confirmed))
  )
  or (select public.is_admin())
);

insert into public.cards (id, text, kind, card_type, intensity, category, topics, adult, status, source, pack_id)
select v.id, v.text, v.kind, v.card_type, v.intensity, v.category, v.topics, v.adult, 'approved', 'seed', v.pack_id from (values
  ('videoke-1', 'What song do you secretly sing at the top of your lungs when alone?', 'truth', 'question', 2, 'confessions', '{}'::text[], false, 'pack-videoke'),
  ('videoke-2', 'Sing the chorus of any song. The group votes if you {drink}.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-videoke'),
  ('videoke-3', 'Which ex would you dedicate a Sampaguita song to?', 'truth', 'question', 3, 'relationships', '{}'::text[], false, 'pack-videoke'),
  ('videoke-4', 'Duet with the person on your left. Pick the song together.', 'dare', 'action', 3, 'dares', '{}'::text[], false, 'pack-videoke'),
  ('videoke-5', 'Name the song that always makes you cry at 2 AM.', 'truth', 'question', 4, 'memories', '{}'::text[], false, 'pack-videoke'),
  ('videoke-6', 'Who in this group would win a videoke contest? Everyone points at once.', 'truth', 'question', 1, 'hot_takes', '{}'::text[], false, 'pack-videoke'),
  ('outing-1', 'Worst thing that has happened to you on a road trip?', 'truth', 'question', 2, 'memories', '{}'::text[], false, 'pack-outing'),
  ('outing-2', 'Who in this group would be the first to get lost in the forest?', 'truth', 'question', 1, 'roasts', '{}'::text[], false, 'pack-outing'),
  ('outing-3', 'Do ten jumping jacks as if the beach is watching.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-outing'),
  ('outing-4', 'What would you never share in a shared tent?', 'truth', 'question', 3, 'confessions', '{}'::text[], false, 'pack-outing'),
  ('outing-5', 'Describe your ideal outing in one sentence. Group rates it.', 'truth', 'question', 1, 'hypotheticals', '{}'::text[], false, 'pack-outing'),
  ('outing-6', 'Whose snoring would ruin the overnight?', 'truth', 'question', 2, 'roasts', '{}'::text[], false, 'pack-outing'),
  ('office-1', 'Which coworker would survive the longest in a zombie apocalypse?', 'truth', 'question', 1, 'hypotheticals', '{}'::text[], false, 'pack-office'),
  ('office-2', 'What is the most useless meeting you have attended?', 'truth', 'question', 1, 'hot_takes', '{}'::text[], false, 'pack-office'),
  ('office-3', 'Make up a nickname for your boss and say it out loud.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-office'),
  ('office-4', 'What small thing do you secretly judge people for at work?', 'truth', 'question', 2, 'confessions', '{}'::text[], false, 'pack-office'),
  ('office-5', 'Pitch your worst business idea in ten seconds.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-office'),
  ('office-6', 'If HR read your search history today, what would they ask first?', 'truth', 'question', 3, 'hypotheticals', '{}'::text[], false, 'pack-office'),
  ('pasko-1', 'Which relative gives the most awkward Christmas gift?', 'truth', 'question', 1, 'roasts', '{}'::text[], false, 'pack-pasko'),
  ('pasko-2', 'What do you pretend to like at family reunions?', 'truth', 'question', 1, 'confessions', '{}'::text[], false, 'pack-pasko'),
  ('pasko-3', 'Do your best impression of your tita giving advice.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-pasko'),
  ('pasko-4', 'What was your favourite Noche Buena dish growing up?', 'truth', 'question', 1, 'memories', '{}'::text[], false, 'pack-pasko'),
  ('pasko-5', 'Who in the family would win a karaoke battle?', 'truth', 'question', 1, 'hot_takes', '{}'::text[], false, 'pack-pasko'),
  ('pasko-6', 'What question from relatives do you dread most?', 'truth', 'question', 2, 'confessions', '{}'::text[], false, 'pack-pasko'),
  ('deep-1', 'What are you most afraid people will find out about you?', 'truth', 'question', 5, 'deep_philosophical', '{}'::text[], false, 'pack-deep'),
  ('deep-2', 'Who did you lose touch with that you still think about?', 'truth', 'question', 4, 'relationships', '{}'::text[], false, 'pack-deep'),
  ('deep-3', 'What would you tell your younger self at 16?', 'truth', 'question', 4, 'memories', '{}'::text[], false, 'pack-deep'),
  ('deep-4', 'What part of your life do you feel you are pretending in?', 'truth', 'question', 5, 'deep_philosophical', '{}'::text[], false, 'pack-deep'),
  ('deep-5', 'What is something you forgave but never forgot?', 'truth', 'question', 4, 'confessions', '{}'::text[], false, 'pack-deep'),
  ('deep-6', 'What do you want more of in the next five years?', 'truth', 'question', 3, 'hypotheticals', '{}'::text[], false, 'pack-deep'),
  ('pulutan-1', 'Eat the next bite of pulutan without using your hands.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-pulutan'),
  ('pulutan-2', 'Hold a plank until the next person finishes their turn.', 'dare', 'action', 3, 'dares', '{}'::text[], false, 'pack-pulutan'),
  ('pulutan-3', 'Let the group choose a sticker to put on your forehead.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-pulutan'),
  ('pulutan-4', 'Say a tongue twister three times fast. Fail and you {drink}.', 'dare', 'action', 1, 'dares', '{}'::text[], false, 'pack-pulutan'),
  ('pulutan-5', 'Swap seats with someone. They pick who.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-pulutan'),
  ('pulutan-6', 'Whisper your next sentence. Everyone else must copy you.', 'dare', 'action', 2, 'dares', '{}'::text[], false, 'pack-pulutan'),
  ('afterdark-1', 'What is the most attractive thing someone can do at a party?', 'truth', 'question', 3, 'hot_takes', array['adult'], true, 'pack-afterdark'),
  ('afterdark-2', 'Describe the best first kiss you have had, no names.', 'truth', 'question', 4, 'memories', array['adult'], true, 'pack-afterdark'),
  ('afterdark-3', 'What would you do if your crush walked in right now?', 'truth', 'question', 3, 'hypotheticals', array['adult'], true, 'pack-afterdark'),
  ('afterdark-4', 'Which text have you sent that you regretted the next morning?', 'truth', 'question', 4, 'confessions', array['adult'], true, 'pack-afterdark'),
  ('afterdark-5', 'What is something small that instantly makes you attracted to someone?', 'truth', 'question', 3, 'relationships', array['adult'], true, 'pack-afterdark'),
  ('afterdark-6', 'Who here has the most dangerous charm, and what do they do with it?', 'truth', 'question', 4, 'roasts', array['adult'], true, 'pack-afterdark'),
  ('nodares-1', 'Give the group your best bedroom eyes for five seconds.', 'dare', 'action', 3, 'dares', array['adult'], true, 'pack-nodares'),
  ('nodares-2', 'Say your best flirty line to the group. They rate it from 1 to 10.', 'dare', 'action', 4, 'dares', array['adult'], true, 'pack-nodares'),
  ('nodares-3', 'Pick a player who agrees and slow dance with them for ten seconds.', 'dare', 'action', 4, 'dares', array['adult'], true, 'pack-nodares'),
  ('nodares-4', 'Reveal the last person you searched on social media, no scrolling.', 'dare', 'action', 4, 'dares', array['adult'], true, 'pack-nodares'),
  ('nodares-5', 'Do your most dramatic love confession to the nearest pillow or bottle.', 'dare', 'action', 3, 'dares', array['adult'], true, 'pack-nodares'),
  ('nodares-6', 'Swap seats with someone of your choice and stay there for the next three cards.', 'dare', 'action', 3, 'dares', array['adult'], true, 'pack-nodares')
) as v(id, text, kind, card_type, intensity, category, topics, adult, pack_id);
