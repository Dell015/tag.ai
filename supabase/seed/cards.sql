-- ============================================================
-- Tag.ai Phase 1: Curated Card Library Seed
-- 
-- 100+ cards across all 9 categories, all 5 intensity levels.
-- Content references Filipino culture: barkada, inuman, Filipino
-- food, family dynamics, Filipino humor, and local slang.
--
-- All cards: deck_id = NULL, is_curated = true, user_id = NULL
-- At least 9 action cards (1+ per category)
-- ============================================================

-- ============================================================
-- CATEGORY: hot_takes
-- ============================================================

INSERT INTO cards (text, card_type, intensity, category, topics, audience_type, deck_id, is_curated) VALUES

-- Intensity 1 (Icebreaker / Family friendly)
('Jollibee is better than McDo. Fight me.', 'question', 1, 'hot_takes', ARRAY['food', 'opinions'], 'icebreaker', NULL, true),
('Adobo should always have soy sauce — no exceptions.', 'question', 1, 'hot_takes', ARRAY['food', 'opinions'], 'icebreaker', NULL, true),
('Jeepney or Grab? Which one is the real Filipino commute?', 'question', 1, 'hot_takes', ARRAY['lifestyle', 'opinions'], 'icebreaker', NULL, true),

-- Intensity 2
('Utang na loob is overrated — agree or disagree?', 'question', 2, 'hot_takes', ARRAY['culture', 'values'], 'barkada', NULL, true),
('Filipino time is just bad time management, not culture.', 'question', 2, 'hot_takes', ARRAY['culture', 'opinions'], 'barkada', NULL, true),

-- Intensity 3
('People who flex on socmed are just insecure. Hot take or truth?', 'question', 3, 'hot_takes', ARRAY['social_media', 'opinions'], 'barkada', NULL, true),
('Is it okay to ghost someone if they''re boring?', 'question', 3, 'hot_takes', ARRAY['relationships', 'dating'], 'spicy', NULL, true),

-- Intensity 4
('Couples who post everything are compensating. Agree?', 'question', 4, 'hot_takes', ARRAY['relationships', 'social_media'], 'spicy', NULL, true),
('Body count matters in a relationship — hot take or fact?', 'question', 4, 'hot_takes', ARRAY['relationships', 'sexual_content'], 'spicy', NULL, true),

-- Intensity 5
('Your most controversial opinion that would get you canceled?', 'question', 5, 'hot_takes', ARRAY['opinions', 'controversial'], 'chaos', NULL, true),

-- Action card
('Stand up and defend your hottest take for 30 seconds. Group votes if you''re convincing!', 'action', 2, 'hot_takes', ARRAY['opinions', 'challenge'], 'barkada', NULL, true),

-- ============================================================
-- CATEGORY: relationships
-- ============================================================

-- Intensity 1
('What''s the greenest green flag in a partner?', 'question', 1, 'relationships', ARRAY['dating', 'love'], 'icebreaker', NULL, true),
('Do you believe in "the one" or is love a choice?', 'question', 1, 'relationships', ARRAY['love', 'philosophy'], 'icebreaker', NULL, true),
('What love language do you speak most?', 'question', 1, 'relationships', ARRAY['love', 'self_awareness'], 'icebreaker', NULL, true),

-- Intensity 2
('What''s a red flag you ignored because they were cute?', 'question', 2, 'relationships', ARRAY['dating', 'past_relationships'], 'barkada', NULL, true),
('What''s the longest you''ve waited for a text back without losing it?', 'question', 2, 'relationships', ARRAY['dating', 'humor'], 'barkada', NULL, true),
('Would you date someone your barkada doesn''t approve of?', 'question', 2, 'relationships', ARRAY['dating', 'friends'], 'barkada', NULL, true),

-- Intensity 3
('Have you ever stayed in a relationship out of pity?', 'question', 3, 'relationships', ARRAY['dating', 'honesty'], 'spicy', NULL, true),
('What''s something you''d never tolerate in a partner?', 'question', 3, 'relationships', ARRAY['dating', 'boundaries'], 'barkada', NULL, true),

-- Intensity 4
('Who in this group would make the worst partner and why?', 'question', 4, 'relationships', ARRAY['friends', 'roasts'], 'spicy', NULL, true),
('What''s the pettiest reason you''ve broken up with someone?', 'question', 4, 'relationships', ARRAY['dating', 'past_relationships'], 'spicy', NULL, true),

-- Intensity 5
('Confess: what''s the most toxic thing you''ve done in a relationship?', 'question', 5, 'relationships', ARRAY['dating', 'confessions', 'past_relationships'], 'chaos', NULL, true),

-- Action card
('Call or text the last person you dated and say "I was thinking about you." Screenshot it!', 'action', 4, 'relationships', ARRAY['dating', 'dares', 'past_relationships'], 'spicy', NULL, true),

-- ============================================================
-- CATEGORY: memories
-- ============================================================

-- Intensity 1
('What''s your happiest childhood memory involving food?', 'question', 1, 'memories', ARRAY['childhood', 'food'], 'family', NULL, true),
('What Filipino fiesta memory will you never forget?', 'question', 1, 'memories', ARRAY['culture', 'celebrations'], 'icebreaker', NULL, true),
('What was your go-to merienda growing up?', 'question', 1, 'memories', ARRAY['food', 'childhood'], 'family', NULL, true),

-- Intensity 2
('What''s the most embarrassing thing that happened to you in school?', 'question', 2, 'memories', ARRAY['school', 'embarrassment'], 'barkada', NULL, true),
('What''s a Pinoy childhood game you secretly miss playing?', 'question', 2, 'memories', ARRAY['childhood', 'nostalgia'], 'barkada', NULL, true),
('What''s the funniest tito/tita moment from a family reunion?', 'question', 2, 'memories', ARRAY['family', 'humor'], 'barkada', NULL, true),

-- Intensity 3
('What''s something you did as a teen that your parents still don''t know about?', 'question', 3, 'memories', ARRAY['secrets', 'family'], 'spicy', NULL, true),
('What''s a memory from this barkada that you''ll never forget?', 'question', 3, 'memories', ARRAY['friends', 'nostalgia'], 'barkada', NULL, true),

-- Intensity 4
('What''s the worst inuman memory you have with this group?', 'question', 4, 'memories', ARRAY['drinking', 'friends'], 'spicy', NULL, true),

-- Intensity 5
('What memory still keeps you up at night with cringe?', 'question', 5, 'memories', ARRAY['embarrassment', 'vulnerability'], 'chaos', NULL, true),

-- Action card
('Recreate a pose from your most embarrassing childhood photo. Group guesses the context!', 'action', 2, 'memories', ARRAY['childhood', 'challenge', 'humor'], 'barkada', NULL, true),

-- ============================================================
-- CATEGORY: confessions
-- ============================================================

-- Intensity 1
('What small lie do you tell people all the time?', 'question', 1, 'confessions', ARRAY['honesty', 'humor'], 'icebreaker', NULL, true),
('What''s a guilty pleasure song you''d never admit to liking?', 'question', 1, 'confessions', ARRAY['music', 'guilty_pleasures'], 'icebreaker', NULL, true),

-- Intensity 2
('What''s something you pretend to like but secretly hate?', 'question', 2, 'confessions', ARRAY['honesty', 'opinions'], 'barkada', NULL, true),
('Have you ever talked bad about someone in this group? No names needed.', 'question', 2, 'confessions', ARRAY['friends', 'honesty'], 'barkada', NULL, true),
('What''s the pettiest thing you''ve ever done and gotten away with?', 'question', 2, 'confessions', ARRAY['honesty', 'humor'], 'barkada', NULL, true),

-- Intensity 3
('What''s the biggest secret you''re keeping from your family?', 'question', 3, 'confessions', ARRAY['family', 'secrets'], 'spicy', NULL, true),
('Confess something you did that you never apologized for.', 'question', 3, 'confessions', ARRAY['honesty', 'guilt'], 'spicy', NULL, true),

-- Intensity 4
('What''s the most embarrassing thing on your phone right now?', 'question', 4, 'confessions', ARRAY['secrets', 'embarrassment'], 'spicy', NULL, true),
('What have you done drunk that you''ve never told anyone?', 'question', 4, 'confessions', ARRAY['drinking', 'secrets'], 'spicy', NULL, true),

-- Intensity 5
('What''s the worst thing you''ve done that no one in this room knows about?', 'question', 5, 'confessions', ARRAY['secrets', 'vulnerability'], 'chaos', NULL, true),

-- Action card
('Open your gallery and show the group the last meme you saved. No scrolling allowed!', 'action', 2, 'confessions', ARRAY['humor', 'challenge'], 'barkada', NULL, true);

-- ============================================================
-- CATEGORY: dares
-- ============================================================

INSERT INTO cards (text, card_type, intensity, category, topics, audience_type, deck_id, is_curated) VALUES

-- Intensity 1
('Do your best impresssion of a teleserye villain. Commit to it!', 'question', 1, 'dares', ARRAY['acting', 'humor'], 'icebreaker', NULL, true),
('Speak in pure Filipino/Tagalog for the next 3 rounds — no English!', 'question', 1, 'dares', ARRAY['language', 'challenge'], 'family', NULL, true),

-- Intensity 2
('Do a TikTok dance. The group picks which one.', 'question', 2, 'dares', ARRAY['dancing', 'social_media'], 'barkada', NULL, true),
('Let the group post one story on your Instagram account.', 'question', 2, 'dares', ARRAY['social_media', 'trust'], 'barkada', NULL, true),
('Call a random contact and sing them "Torete" for 10 seconds.', 'question', 2, 'dares', ARRAY['singing', 'humor'], 'barkada', NULL, true),

-- Intensity 3
('Let someone in the group send one text from your phone to anyone.', 'question', 3, 'dares', ARRAY['trust', 'phones'], 'spicy', NULL, true),
('Post a selfie right now with no filter, no retake. Caption: "Living my best life."', 'question', 3, 'dares', ARRAY['social_media', 'confidence'], 'barkada', NULL, true),

-- Intensity 4
('DM your crush "hey" right now. Show the group.', 'question', 4, 'dares', ARRAY['dating', 'courage'], 'spicy', NULL, true),
('Read aloud the last 5 messages in your most recent chat.', 'question', 4, 'dares', ARRAY['privacy', 'trust'], 'spicy', NULL, true),

-- Intensity 5
('Let the group go through your search history for 30 seconds.', 'question', 5, 'dares', ARRAY['privacy', 'trust', 'embarrassment'], 'chaos', NULL, true),

-- Action card
('Do 10 push-ups or take a shot. Your choice, walang drama!', 'action', 3, 'dares', ARRAY['physical', 'drinking', 'challenge'], 'barkada', NULL, true),

-- ============================================================
-- CATEGORY: hypotheticals
-- ============================================================

-- Intensity 1
('If you could eat only one Filipino dish for the rest of your life, what is it?', 'question', 1, 'hypotheticals', ARRAY['food', 'choices'], 'family', NULL, true),
('If you could live anywhere in the Philippines, where would you go?', 'question', 1, 'hypotheticals', ARRAY['travel', 'lifestyle'], 'icebreaker', NULL, true),
('If you could swap lives with any Filipino celebrity for a day, who?', 'question', 1, 'hypotheticals', ARRAY['celebrities', 'fantasy'], 'icebreaker', NULL, true),

-- Intensity 2
('If you had to delete all socmed except one app, which survives?', 'question', 2, 'hypotheticals', ARRAY['social_media', 'choices'], 'barkada', NULL, true),
('If you could relive one night with this barkada, which one?', 'question', 2, 'hypotheticals', ARRAY['friends', 'nostalgia'], 'barkada', NULL, true),

-- Intensity 3
('If you had to marry someone in this room, who and why?', 'question', 3, 'hypotheticals', ARRAY['friends', 'romance'], 'spicy', NULL, true),
('If you could read one person''s mind here for 24 hours, who?', 'question', 3, 'hypotheticals', ARRAY['friends', 'curiosity'], 'barkada', NULL, true),

-- Intensity 4
('If you had to kiss one person in this room to save the world, who?', 'question', 4, 'hypotheticals', ARRAY['friends', 'romance', 'sexual_content'], 'spicy', NULL, true),
('If you could erase one person from your past completely, would you?', 'question', 4, 'hypotheticals', ARRAY['past_relationships', 'deep'], 'spicy', NULL, true),

-- Intensity 5
('If you could get away with one illegal thing, what would you do?', 'question', 5, 'hypotheticals', ARRAY['controversial', 'honesty'], 'chaos', NULL, true),

-- Action card
('The group gives you a hypothetical scenario. You have 15 seconds to act it out!', 'action', 2, 'hypotheticals', ARRAY['acting', 'challenge', 'humor'], 'barkada', NULL, true),

-- ============================================================
-- CATEGORY: controversial
-- ============================================================

-- Intensity 2
('Is it okay to check your partner''s phone if you suspect something?', 'question', 2, 'controversial', ARRAY['relationships', 'trust', 'opinions'], 'barkada', NULL, true),
('Should parents have access to their adult kids'' finances?', 'question', 2, 'controversial', ARRAY['family', 'money'], 'barkada', NULL, true),

-- Intensity 3
('Is the oldest sibling really the "sacrifice" child?', 'question', 3, 'controversial', ARRAY['family', 'opinions'], 'barkada', NULL, true),
('Is it worse to cheat emotionally or physically?', 'question', 3, 'controversial', ARRAY['relationships', 'opinions'], 'spicy', NULL, true),
('Are arranged introductions by titas actually smart?', 'question', 3, 'controversial', ARRAY['family', 'dating', 'culture'], 'barkada', NULL, true),

-- Intensity 4
('Is it okay to cut off family if they''re toxic?', 'question', 4, 'controversial', ARRAY['family', 'mental_health', 'values'], 'spicy', NULL, true),
('Should you tell a friend if their partner is cheating?', 'question', 4, 'controversial', ARRAY['friends', 'relationships', 'honesty'], 'spicy', NULL, true),

-- Intensity 5
('What''s an opinion you have that would make this group hate you?', 'question', 5, 'controversial', ARRAY['opinions', 'controversy'], 'chaos', NULL, true),
('Money or love? Be honest — no performative answers.', 'question', 5, 'controversial', ARRAY['money', 'love', 'values'], 'chaos', NULL, true),

-- Action card
('Pick the most controversial opinion you hold. The group debates you for 1 minute — you can''t back down!', 'action', 3, 'controversial', ARRAY['opinions', 'debate', 'challenge'], 'spicy', NULL, true);

-- ============================================================
-- CATEGORY: roasts
-- ============================================================

INSERT INTO cards (text, card_type, intensity, category, topics, audience_type, deck_id, is_curated) VALUES

-- Intensity 2
('What''s one thing about the person to your left that lowkey annoys you?', 'question', 2, 'roasts', ARRAY['friends', 'humor'], 'barkada', NULL, true),
('Roast someone''s fashion sense in this group — but make it funny.', 'question', 2, 'roasts', ARRAY['fashion', 'humor', 'physical_appearance'], 'barkada', NULL, true),

-- Intensity 3
('Who in this group has the most chaotic energy? Explain.', 'question', 3, 'roasts', ARRAY['friends', 'humor'], 'barkada', NULL, true),
('Give a brutally honest Grab driver rating to the person across from you. Stars and review.', 'question', 3, 'roasts', ARRAY['friends', 'humor'], 'barkada', NULL, true),
('Who here would survive the least time on a deserted island? Why?', 'question', 3, 'roasts', ARRAY['friends', 'humor'], 'barkada', NULL, true),

-- Intensity 4
('What''s one thing everyone thinks about someone here but no one says?', 'question', 4, 'roasts', ARRAY['friends', 'honesty'], 'spicy', NULL, true),
('Roast someone''s dating history in 3 sentences or less.', 'question', 4, 'roasts', ARRAY['dating', 'humor', 'past_relationships'], 'spicy', NULL, true),
('Who here gives main character energy but is actually an extra?', 'question', 4, 'roasts', ARRAY['friends', 'humor'], 'spicy', NULL, true),

-- Intensity 5
('Give your most unhinged, no-filter roast of the person to your right. They can''t respond.', 'question', 5, 'roasts', ARRAY['friends', 'roasts'], 'chaos', NULL, true),
('Who in this group peaked in high school? Defend your answer.', 'question', 5, 'roasts', ARRAY['friends', 'roasts', 'honesty'], 'chaos', NULL, true),

-- Action card
('Do your best impression of someone in this group. Everyone else guesses who!', 'action', 3, 'roasts', ARRAY['acting', 'humor', 'friends'], 'barkada', NULL, true),

-- ============================================================
-- CATEGORY: deep_philosophical
-- ============================================================

-- Intensity 1
('What makes you feel most like yourself?', 'question', 1, 'deep_philosophical', ARRAY['self_awareness', 'identity'], 'icebreaker', NULL, true),
('What''s one thing you wish people understood about you?', 'question', 1, 'deep_philosophical', ARRAY['vulnerability', 'identity'], 'icebreaker', NULL, true),

-- Intensity 2
('Do you think people can truly change, or nah?', 'question', 2, 'deep_philosophical', ARRAY['philosophy', 'growth'], 'barkada', NULL, true),
('What''s the hardest lesson your lolo or lola taught you?', 'question', 2, 'deep_philosophical', ARRAY['family', 'wisdom', 'culture'], 'barkada', NULL, true),
('What are you most afraid of that isn''t a physical thing?', 'question', 2, 'deep_philosophical', ARRAY['fears', 'vulnerability'], 'barkada', NULL, true),

-- Intensity 3
('If you died tomorrow, what would you regret not doing?', 'question', 3, 'deep_philosophical', ARRAY['death', 'purpose', 'vulnerability'], 'spicy', NULL, true),
('Do you think you''re living the life you actually want?', 'question', 3, 'deep_philosophical', ARRAY['purpose', 'self_awareness'], 'barkada', NULL, true),

-- Intensity 4
('What''s one thing about yourself you''re still trying to accept?', 'question', 4, 'deep_philosophical', ARRAY['vulnerability', 'growth', 'mental_health'], 'spicy', NULL, true),
('Who in your life do you owe an apology to? Will you ever give it?', 'question', 4, 'deep_philosophical', ARRAY['guilt', 'relationships', 'honesty'], 'spicy', NULL, true),

-- Intensity 5
('What part of you do you hide from everyone — even the people closest to you?', 'question', 5, 'deep_philosophical', ARRAY['secrets', 'vulnerability', 'identity'], 'chaos', NULL, true),

-- Action card
('Everyone closes their eyes. Say one thing you''ve never told this group out loud. No one opens their eyes until it''s done.', 'action', 4, 'deep_philosophical', ARRAY['vulnerability', 'trust', 'honesty'], 'spicy', NULL, true);

-- ============================================================
-- ADDITIONAL CARDS FOR COVERAGE
-- (Ensure 100+ total and fill intensity gaps)
-- ============================================================

INSERT INTO cards (text, card_type, intensity, category, topics, audience_type, deck_id, is_curated) VALUES

-- hot_takes extras
('Rice is not optional — it''s a human right. Agree or disagree?', 'question', 1, 'hot_takes', ARRAY['food', 'culture', 'opinions'], 'family', NULL, true),
('Long-distance relationships never work. Change my mind.', 'question', 3, 'hot_takes', ARRAY['relationships', 'opinions'], 'barkada', NULL, true),

-- relationships extras
('What''s the most romantic thing someone has done for you — Pinoy style?', 'question', 1, 'relationships', ARRAY['love', 'romance', 'culture'], 'icebreaker', NULL, true),
('Do you believe in "ligaw" (courtship) or is it outdated?', 'question', 2, 'relationships', ARRAY['dating', 'culture', 'opinions'], 'barkada', NULL, true),

-- memories extras
('What''s the scariest experience you had during a typhoon?', 'question', 2, 'memories', ARRAY['weather', 'childhood', 'culture'], 'barkada', NULL, true),
('What was your most memorable Christmas in the Philippines?', 'question', 1, 'memories', ARRAY['celebrations', 'family', 'culture'], 'family', NULL, true),

-- confessions extras
('What''s a chismis (gossip) you spread that you feel bad about?', 'question', 3, 'confessions', ARRAY['friends', 'guilt', 'honesty'], 'spicy', NULL, true),
('What rule in your bahay did you always break growing up?', 'question', 1, 'confessions', ARRAY['family', 'childhood', 'humor'], 'family', NULL, true),

-- dares extras
('Speak in a different Filipino dialect for the next 2 rounds.', 'question', 1, 'dares', ARRAY['language', 'culture', 'challenge'], 'icebreaker', NULL, true),
('Let the group choose your next profile picture. You keep it for 24 hours.', 'question', 3, 'dares', ARRAY['social_media', 'trust'], 'spicy', NULL, true),

-- hypotheticals extras
('If you could only eat one ulam forever, what is it?', 'question', 1, 'hypotheticals', ARRAY['food', 'culture', 'choices'], 'family', NULL, true),
('If this barkada had a reality TV show, what would the title be?', 'question', 2, 'hypotheticals', ARRAY['friends', 'humor'], 'barkada', NULL, true),

-- controversial extras
('Is it wrong to not give money to family if they always ask?', 'question', 3, 'controversial', ARRAY['family', 'money', 'culture'], 'barkada', NULL, true),
('Should you stay friends with an ex? Or is that just playing with fire?', 'question', 2, 'controversial', ARRAY['dating', 'past_relationships', 'opinions'], 'barkada', NULL, true),

-- roasts extras
('Who in this group has the worst taste in music? Play their top Spotify track as proof.', 'question', 2, 'roasts', ARRAY['music', 'humor', 'friends'], 'barkada', NULL, true),
('Rate everyone''s haggling skills from 1-10. Start with the worst.', 'question', 3, 'roasts', ARRAY['humor', 'culture', 'friends'], 'barkada', NULL, true),

-- deep_philosophical extras
('What Filipino value do you carry that shapes who you are?', 'question', 1, 'deep_philosophical', ARRAY['culture', 'identity', 'values'], 'family', NULL, true),
('What does "success" actually mean to you — not your parents'' definition?', 'question', 3, 'deep_philosophical', ARRAY['purpose', 'family', 'career'], 'barkada', NULL, true),

-- More family-friendly cards across categories
('What''s the best Filipino street food and why?', 'question', 1, 'hot_takes', ARRAY['food', 'culture'], 'family', NULL, true),
('Would you rather have unlimited sinigang or unlimited lechon?', 'question', 1, 'hypotheticals', ARRAY['food', 'culture', 'choices'], 'family', NULL, true),
('What''s one tradition from your family that you''ll pass on?', 'question', 1, 'deep_philosophical', ARRAY['family', 'culture', 'traditions'], 'family', NULL, true),
('What''s the funniest baon (packed lunch) you ever brought to school?', 'question', 1, 'memories', ARRAY['food', 'school', 'childhood'], 'family', NULL, true),
('What animal would each person in this group be?', 'question', 1, 'roasts', ARRAY['friends', 'humor'], 'icebreaker', NULL, true),

-- More barkada-level cards
('Who in this group would you trust with your phone unlocked for 5 minutes?', 'question', 2, 'confessions', ARRAY['friends', 'trust'], 'barkada', NULL, true),
('What''s the most maarte (high-maintenance) thing about you?', 'question', 2, 'confessions', ARRAY['self_awareness', 'humor', 'culture'], 'barkada', NULL, true),
('If you had to be stuck in traffic with one person from this group for 3 hours, who?', 'question', 2, 'hypotheticals', ARRAY['friends', 'choices'], 'barkada', NULL, true),
('Who in this group gives the best advice? Who gives the worst?', 'question', 2, 'roasts', ARRAY['friends', 'humor'], 'barkada', NULL, true),

-- More spicy/chaos cards
('Who here has the biggest gap between their online persona and real personality?', 'question', 4, 'roasts', ARRAY['social_media', 'friends', 'honesty'], 'spicy', NULL, true),
('If someone offered you ₱1 million to never talk to one person in this room again, who goes?', 'question', 4, 'hypotheticals', ARRAY['money', 'friends', 'choices'], 'spicy', NULL, true),
('What''s your biggest "almost" — something that almost happened but didn''t?', 'question', 3, 'confessions', ARRAY['regret', 'vulnerability'], 'spicy', NULL, true),
('What conversation are you avoiding with someone in this room?', 'question', 5, 'confessions', ARRAY['friends', 'honesty', 'vulnerability'], 'chaos', NULL, true),
('Rank this barkada by who you''d call first in an emergency. Be honest.', 'question', 4, 'roasts', ARRAY['friends', 'honesty', 'trust'], 'spicy', NULL, true);
