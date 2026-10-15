# tag.ai card categories

> Reference for how cards are filed, filtered and matched to decks. Counts come from the seed library (131 cards) and the 18+ set (25 cards) as of 2026-10-16. Cards are still few on purpose: the categories come first, then more cards. Anything under "Proposals" is an idea for the owner to decide, not a decision.

## 1. How a card is described

| Field | Meaning |
|---|---|
| Text | The question, prompt or dare. |
| Card type | `question`, `action` (a dare with a task) or `wild` (a rule-changing card, see section 6). |
| Category | One of nine, see section 3. Each belongs to one of three groups. |
| Intensity | 1 to 5, see section 2. |
| Topics | Free tags used by the topic filter, see section 5. |
| People | How many people the card needs, see section 7. Worked out from the wording unless set by hand. |
| Adult flag | Marks 18+ cards, see section 8. |

## 2. Intensity scale

| Level | Name | What it feels like |
|---|---|---|
| 1 | Chill | Safe for anyone, good opener. |
| 2 | Warmed up | A little personal. |
| 3 | Getting real | Honest answers needed. |
| 4 | Spicy | Could embarrass someone. |
| 5 | Full send | Only for groups that trust each other. |

A deck does not lock intensity. It sets how likely each level is (section 4), and the heat meter nudges the next card up or down.

## 3. Groups and categories

Cards are filed in three groups of three categories. Library > Browse shows the same structure.

### Get talking
_Easy openers that start arguments and stories_

| Category | Cards | typed as action | Lv 1 | Lv 2 | Lv 3 | Lv 4 | Lv 5 |
|---|---|---|---|---|---|---|---|
| Hot takes | 14 | 1 | 5 | 3 | 3 | 2 | 1 |
| Hypotheticals | 16 | 1 | 5 | 5 | 2 | 3 | 1 |
| Memories | 14 | 1 | 5 | 5 | 2 | 1 | 1 |

- **Hot takes.** Opinions people defend. Food, commuting, culture, pop takes. Low stakes, loud answers.
- **Hypotheticals.** What-would-you-do and would-you-rather prompts. Works with any group because nobody has to reveal something real.
- **Memories.** Stories from the past: school, childhood, first times, trips. Warm and nostalgic.

### Get personal
_Honest answers about people and feelings_

| Category | Cards | typed as action | Lv 1 | Lv 2 | Lv 3 | Lv 4 | Lv 5 |
|---|---|---|---|---|---|---|---|
| Relationships | 14 | 1 | 4 | 4 | 2 | 3 | 1 |
| Confessions | 17 | 1 | 3 | 6 | 4 | 2 | 2 |
| Deep | 14 | 1 | 4 | 3 | 3 | 3 | 1 |

- **Relationships.** Dating, exes, trust, love, family ties. The most personal group topic after Confessions.
- **Confessions.** Things people have done or hidden: secrets, guilt, embarrassment. Answer or drink.
- **Deep.** Values, purpose, identity, fears. Slow, late-night cards.

### Get loud
_Dares, roasts and topics people argue about_

| Category | Cards | typed as action | Lv 1 | Lv 2 | Lv 3 | Lv 4 | Lv 5 |
|---|---|---|---|---|---|---|---|
| Dares | 13 | 1 | 3 | 3 | 4 | 2 | 1 |
| Roasts | 17 | 1 | 1 | 4 | 5 | 5 | 2 |
| Controversial | 12 | 1 | 0 | 3 | 5 | 2 | 2 |

- **Dares.** Things to do, not say: acting, singing, dancing, phone and social media dares. In the seed only one of the 13 is typed as an action card; the rest are typed as questions (see section 10).
- **Roasts.** Playful teasing about the people at the table. Needs a group that already knows each other.
- **Controversial.** Topics that split a room: money, politics-adjacent, taboo opinions. The group topic filter matters most here.

### After dark (18+)

A separate set, not a group of its own in the data. Its cards use the same categories and carry the 18+ flag (section 8).

| Category | Cards | typed as action | Lv 1 | Lv 2 | Lv 3 | Lv 4 | Lv 5 |
|---|---|---|---|---|---|---|---|
| Hot takes | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Hypotheticals | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| Memories | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Relationships | 4 | 0 | 0 | 0 | 2 | 2 | 0 |
| Confessions | 9 | 0 | 0 | 0 | 2 | 3 | 4 |
| Dares | 6 | 6 | 0 | 1 | 4 | 1 | 0 |
| Roasts | 1 | 0 | 0 | 0 | 1 | 0 | 0 |

Total: 26 cards. Two paid 18+ packs add 12 more (section 9).

## 4. How decks use intensity

| Deck | Lv 1 | Lv 2 | Lv 3 | Lv 4 | Lv 5 | Starts at heat | Wild every | Notes |
|---|---|---|---|---|---|---|---|---|
| Icebreaker | 40% | 40% | 20% | 0 | 0 | 1 | ~6 | New groups |
| Family | 50% | 50% | 0 | 0 | 0 | 1 | ~6 | Heat stops at 2, only intensity 1 to 2 |
| Barkada | 15% | 15% | 25% | 25% | 20% | 2 | ~6 | Close friends |
| Lovers | 10% | 10% | 40% | 20% | 20% | 2 | ~6 | Couples |
| Spicy | 5% | 5% | 30% | 30% | 30% | 3 | ~6 | |
| Chaos | 20% | 20% | 20% | 20% | 20% | 2 | ~4 | Flat mix |

Decks do not pick by category. Category matters in Browse, Saved, My decks, Discover and the "Focus next cards" control in the pause menu. Mixed decks average these weights.

## 5. Topics (the tags behind the skip list)

Topics are free tags on each card. The host skips topics in setup, and defaults live in Settings. The ten presets plus 18+ map to tags like this:

| Skip topic | Hides cards tagged |
|---|---|
| Politics | politics, political, election, government |
| Religion | religion, faith, church |
| Trauma/Mental Health | trauma, mental_health, fears |
| Money/Finances | money, finances, debt |
| Family Drama | family_drama, family |
| Sexual Content | sexual_content, sex |
| Past Relationships | past_relationships, ex |
| Physical Appearance | physical_appearance, physical, body |
| Career/Work Stress | career, work |
| Death/Loss | death, grief, loss |
| 18+ Cards | adult (skipped by default) |

Custom words a host types are also matched against the card text.

Tags used most in the seed: friends (31), humor (24), culture (19), opinions (17), honesty (16), dating (15), family (13), food (10), vulnerability (10), trust (9), social_media (8), relationships (8), challenge (8), past_relationships (7).

## 6. Wild cards and action cards

Wild cards are free (they cost no coins), glow around the edge, and appear about once every 6 cards (every 4 in Chaos). Nine types:

- Role Reversal
- Pick Your Target
- Everyone Answers
- Shuffle
- Heat Spike
- Act It Out
- Whisper Round
- Free Drink (shows a Take a drink banner)
- Crown (immunity for 2 cards)

Action cards are dares with a task, and they cost a little more from the pot than questions. The seed has nine, one in each category (for example one in Roasts, one in Memories), not nine in Dares.

## 7. How many people a card needs

Each card needs a minimum number of people, and a few have a maximum. It is read from the wording unless a card sets it.

| Wording | Needs |
|---|---|
| "which two people here" | 4 or more |
| "in this room", "who here", "everyone", "across from you" | 3 or more |
| "the person on your left", "next person" | 2 or more |
| "your partner", "you two" | exactly 2 |
| anything else | 2 or more |

The Auto pool drops cards that do not fit the number of players. Your own decks are not filtered. Browse has a People filter (2 people, 3 to 4, 5 or more).

## 8. 18+ cards

- Flirty and suggestive, never graphic, never about someone who has not agreed to play.
- Tagged `adult`, so they sit behind the **18+ Cards** topic, which is skipped by default. Un-skip it in Settings (for every game) or in the topics step of setup (for one game).
- Hidden in Browse, Saved and the Shop while the topic is skipped.

## 9. Card packs (Shop)

| Pack | Cards | Notes |
|---|---|---|
| Videoke night | 6 | Sample set, grows over time |
| Outing edition | 6 | Sample set, grows over time |
| Office party | 6 | Sample set, grows over time |
| Pasko and reunion | 6 | Sample set, grows over time |
| Late night deep | 6 | Sample set, grows over time |
| Pulutan dares | 6 | Sample set, grows over time |
| After dark (18+) | 6 | Sample set, grows over time |
| No shame dares (18+) | 6 | Sample set, grows over time |

Owned packs join the Auto pool. Packs are not part of the nine categories in Browse.

## 10. Gaps in the current categories

- **Uneven intensity.** Controversial has no level 1 card. Hot takes has one level 5 card. Dares has one level 5 card. Roasts is heavy on levels 3 to 4 and has one level 1 card. Icebreaker and Family draw mostly from levels 1 to 2, where Roasts and Controversial have almost nothing.
- **Card type and category disagree.** Dares is a category, but 12 of its 13 cards are typed as questions, while the nine action cards are spread across all categories. Anything that depends on the type (dare cost in the pot, the Dare label in Browse, dare timers) misses most dares. Decide whether Dares is a category or a type, then make the data match.
- **Dares are thin and mixed.** Thirteen cards cover physical, social and creative dares together, so a table cannot ask for "calm dares only".
- **Memories and Hypotheticals skew mild.** Good for openers, little for late in the night.
- **Topic tags are inconsistent.** Several tags repeat the category name (`roasts`, `dares`, `confessions`, `controversial`, `deep`), and there are near duplicates (`controversial` and `controversy`, `dating`, `romance` and `love`, `relationships` and `past_relationships`). The skip list only works as well as the tags.
- **Two filters overlap.** "Sexual Content" and "18+ Cards" are separate. Seed cards tagged `sexual_content` (2 of them) are ordinary intensity-4 cards, not 18+.
- **Categories do not show in play.** The card face shows the category name but decks do not use it, so a table cannot say "more Memories tonight" except through Focus next cards.
- **No Filipino-specific category.** Many cards carry a Filipino flavour in the wording, but nothing in the structure lets a group ask for it.

## 11. Proposals (not decided)

- **Rebalance before adding cards.** Give every category at least two cards at each level from 1 to 4, then fill level 5 only for Confessions, Relationships, Deep and Roasts.
- **Split Dares into three:** physical, social (said or done to another player) and creative (sing, act, draw). This also lets Family and Icebreaker use the calm ones.
- **Add card formats, not just categories.** Common formats at a drinking table: Never have I ever, Most likely to, This or that, Finish the sentence, Two truths and a lie. A format is a card type with its own rule, so it should be written up as a mechanic first (see about_tagai.md section 23).
- **Clean the topic tags.** One tag list, no tag that repeats a category, one word per idea. Show the list in this file.
- **Let a category be asked for.** A "Tonight I want" step in setup (more Memories, more Dares) that raises a category's chance without locking it.
- **Add a situation layer above groups.** Who is at the table (barkada, couples, workmates, strangers, family) as a filter next to the deck, using the Audience field decks already have.
