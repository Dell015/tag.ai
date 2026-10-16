# tag.ai card guide

How every kind of card works, the rules each one must follow, and how to make a new one. Read this before adding cards. The older `docs/CATEGORIES.md` covers the nine topic categories and the topic filter; this file covers card kinds, wild cards, rules, penalties and the writing constraints. Where they disagree, this file wins for anything about kinds, wild cards, rules and penalties.

Last updated 2026-10-16.

## 1. The three ideas that are easy to mix up

| Idea | What it is | Where it lives |
|---|---|---|
| Deck | What you buy. A mood with a price per card (Icebreaker, Barkada, Spicy, Adult, Chaos...). A deck is a filter over the card library by category and intensity. | `src/lib/game/decks.ts` |
| Kind | How a card is played: truth, dare, dice, coin, bottle, wheel, timer, vote, rule. Sets the card colour and the tool on the card. | `src/lib/game/card-kinds.ts` |
| Wild card | A free, one-off challenge for the whole table, inserted between cards. Not part of any deck, never costs coins. | `src/lib/game/wild-cards.ts` |

A card belongs to a deck because of its category and intensity, and has a kind because of how it is played. You never tag a card with a deck.

## 2. Fields on a card

A card is a `QueuedCard` (`src/lib/game/escalation-engine.ts`).

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique. Library `card-001`, adult `adult-001`, tool and rule cards `play-001`, adult tool cards `play-adult-001`, packs `<pack>-<n>`. Never reuse or renumber an id: saved and trashed cards point at it. |
| `text` | yes | What the table reads. See section 8 for the writing rules. |
| `cardType` | yes | `question` or `action`. Wild cards are generated, never written by hand. |
| `intensity` | yes | 1 to 5 (section 4). |
| `category` | yes | One of the nine: `hot_takes`, `relationships`, `memories`, `confessions`, `dares`, `hypotheticals`, `controversial`, `roasts`, `deep_philosophical`. |
| `topics` | yes | Snake_case tags the comfort filter matches (`money`, `ex`, `politics`...). Use `[]` if none apply. Adult cards use `['adult']`. |
| `kind` | no | Missing means truth for a question and dare for an action. Set it for dice, coin, bottle, wheel, timer, vote and rule. |
| `tool` | per kind | Settings for the tool: `dice` (1 or 2), `labels` (wheel), `seconds` (timer, vote). |
| `outcomes` | per kind | What each result means. Dice with one die: six lines. Coin: two lines (heads, tails). |
| `rule` | rule kind | The short line shown at the top of the screen while the rule is on. |
| `penalty` | no | Shots for failing or refusing. Missing means the default (section 6). |
| `people` | no | `{ min, max }` players the card needs. Missing means it is worked out from the wording (section 9). |
| `adult` | no | `true` for 18+ cards (section 10). |

## 3. The nine kinds

Each kind has its own colour (`data-kind` in `src/app/globals.css`). The card back wears the colour of its kind too, so the back already tells the table what kind of card is coming.

| Kind | Colour | `cardType` | Tool on the card | How it is played |
|---|---|---|---|---|
| Truth | blue | question | none | Read it, answer out loud. |
| Dare | red | action | a timer button if the text names a time ("30 seconds") | Do it. |
| Dice | yellow | action | Roll button, big dice. One die with `outcomes` shows what the number means. | Roll, follow the result. |
| Coin | orange | action | Flip button. `outcomes` shows what heads or tails means. | Flip, follow the side. |
| Bottle | green | action | Spinner that names a player from the others at the table. | The named player does what the text says. |
| Wheel | pink | action | A wheel that lands on one of `tool.labels` (2 to 8 labels, 6 is the standard). | Spin, do the result. |
| Timer | teal | action | Big countdown with Start, Pause, Reset. | Beat the clock. |
| Vote | cream | action | A 3, 2, 1, "Point!" countdown. | Everyone points at once. |
| Rule | lime | action | none. The rule line stays on screen. | Holds until the next wild card (section 7). |

Constraints per kind:

- **Truth and dare** are the original cards. Do not set `kind` on them.
- **Dice.** One die needs exactly six `outcomes`, or none (then the text itself says what the number means, like "count that many players clockwise"). Two dice never have `outcomes`; the text uses the total. Keep each outcome short, one action.
- **Coin.** Exactly two `outcomes`, heads first. Write them as "Heads: ..." and "Tails: ...". Both sides should be a real choice, not one good and one nothing.
- **Bottle.** Needs three or more players, so set `people: { min: 3, max: null }`. The text starts with "Spin the bottle." and says what the picked player does.
- **Wheel.** `tool.labels` are short (under about 28 characters), written as actions. Mix mild and bold labels, and always include a "Free pass" or a "Pass" at higher intensity.
- **Timer.** `tool.seconds` matches the number in the text. 20 to 60 seconds is the useful range. Say what happens when time runs out ("Stuck means {drink}") or leave it to the penalty line.
- **Vote.** Three or more players (`people: { min: 3, max: null }`). The text is "Who here is most likely to ...". Say what the most-voted player does.
- **Rule.** Needs `rule` and must say "until the next wild card" in the text. Section 7.

## 4. Intensity

| Level | Name | Feels like |
|---|---|---|
| 1 | Chill | Safe for anyone, a good opener. |
| 2 | Warmed up | A little personal. |
| 3 | Getting real | Honest answers needed. |
| 4 | Spicy | Could embarrass someone. |
| 5 | Full send | Only for groups that trust each other. |

Family-safe cards are level 1 or 2 only. A deck sets how likely each level is, and the heat meter nudges the next card up or down; it never locks a level.

## 5. Which deck a card lands in

Decks pick cards by filter (`has` in `decks.ts`), so a new card reaches the right decks by its category and intensity alone. Check `src/lib/game/decks.ts` for the exact filters; the short version:

| Deck | Takes |
|---|---|
| Icebreaker | Intensity 1 to 3 in hot takes, hypotheticals, memories, dares |
| Family | Intensity 1 to 2, no risky topics, not roasts, confessions or relationships |
| Life | Intensity up to 4 in memories, hypotheticals, deep |
| Deep | Intensity 2+ in deep, confessions, memories |
| Barkada | Intensity 2+ in roasts, hot takes, dares, controversial, confessions |
| Lovers | Intensity 2+ in relationships, confessions, memories |
| Spicy | Intensity 3+ |
| Adult | Cards with the 18+ flag |
| Chaos | Every non-wild card, 18+ included |

So a clean level 1 dare is in Icebreaker, Family and Chaos. A level 5 dice card is in Spicy, Barkada (if category fits) and Chaos. If you write a card and want it in a specific deck, check that its category and intensity pass that deck's filter. Tests in `decks.test.ts` and `card-kinds.test.ts` guard the important ones.

## 6. Penalties: the line at the bottom of every card

Every card shows "Fail or refuse: take a shot" at the bottom (or "do a forfeit" at non-drinking tables). It is the consequence for not doing what the card says.

| Card | Shots |
|---|---|
| Truth | 1 |
| Dare, intensity 1 to 3 | 1 |
| Dare, intensity 4 to 5 | 2 |
| Dice, coin, bottle, wheel, timer, vote | 1 |
| Rule | 1, or what the rule text says |
| Wild card | 2 or 3, set on the wild card |

Set `penalty` on a card only when it is not the default. Allowed range is 1 to 3. Never write more than 3: it stops being fun and starts being a risk. Skip is always free (it gives the same player a new card and uses a card from the pot), so the penalty only applies to a card someone accepts and then does not do.

## 7. Wild cards and rules

### Wild cards

Wild cards are free, one-off challenges for the whole table. There are five, defined in `WILD_CARD_DEFINITIONS`:

| Wild card | What happens | Shots if failed |
|---|---|---|
| Call Out | Spin the bottle. The player it lands on calls someone who is not in this group, shouts anything when they answer, then hangs up. | 3 |
| Voice Note | Spin the bottle. The player it lands on sends a 10 second voice note to a friend who is not here. | 2 |
| Freeze | Everyone strikes a pose on three and holds it for 5 seconds. First to move pays. | 2 |
| Dance Off | Everyone dances for 15 seconds. The group votes the worst dancer, who pays. | 2 |
| Lucky Roll | Roll the die. That many players must drink. You choose who. | 2 |

A wild card must be:

- **One-off.** It starts and ends on that card. No counters, no "for the next 3 cards", no hidden effects. The owner removed Crown, Heat Spike, Shuffle and Whisper Round because the table could not follow them.
- **Doable by a table that has been drinking.** One clear action, one sentence, no maths.
- **About the real world.** Calls, voice notes and bodies in a room, not things the app tracks.
- **Penalised with 2 or 3 shots**, set in `penalty`.
- **Self-inventing where it helps.** A wild card can bring a tool (`via` on its definition: a bottle to pick who, a die to pick how many) so the table does not decide anything by arguing.
- **Safe.** Never ask someone to contact a person who has not agreed to be part of a joke, never about appearance, never anything that could be recorded to shame someone.

Wild cards are inserted about every 4 to 8 cards (a mix of the decks' wild gaps). A wild card also clears any rule that is on.

To add a wild card: add its id to `WildCardType` in `src/types/game.ts`, add it to `WILD_CARD_DEFINITIONS` and to `WILD_CARD_TYPES` in `card-queue-builder.ts`, add its optional extra (a timer, say) in `WildExtras.tsx`, (the game-store `migrate` reads the known list from `WILD_CARD_DEFINITIONS`, so saved games keep it). The tests in `wild-copy.test.ts` check the count, the 2 or 3 shots and the wording.

### Rule cards

A rule card changes how the table plays until the next wild card. The app shows a lime "Rule on" bar at the top of the screen while it holds, and the wild card clears it. Only one rule is on at a time; a new rule card replaces the old one.

A rule must be:

- **Short and checkable.** The table can see at once whether someone broke it: a word, a hand, a language, a phone.
- **Free of the app.** The app never enforces it. People catch each other.
- **Written with its penalty.** "Whoever slips takes {shot}." Use 1 shot, or 2 for something hard like phones down. The `rule` field is the line on the bar and should repeat the penalty when it helps ("No swearing. Swear and take {shot}").
- **Ended by the text.** The text must contain "until the next wild card".
- **Safe for the deck.** Level 1 or 2 rules can go into Family. Do not write a rule that forces anyone to touch, reveal or say something about another person's body.

### Cards that invent themselves with a tool

A tool can decide the penalty, the person or the rule, so nobody has to make something up. Use this whenever a card would otherwise say "someone decides".

| Tool | What it can decide | Example |
|---|---|---|
| Dice (one die, six `outcomes`) | A penalty size, a rule, a task | "Roll the die. Your number is your penalty." 1 is a shot, 3 is 3 shots, a 5 is safe. |
| Dice (two dice, text uses the total or the two numbers) | How many, who gives and who takes | "The lower number is how many shots you take, the higher is how many you give." |
| Coin (two `outcomes`) | Give or take, double or nothing, a rule | "Heads: give 2 shots. Tails: take 2 shots." |
| Wheel (`tool.labels`) | A penalty or a rule from a list of six | "Spin the wheel for your penalty." |
| Bottle | Who takes it, who does it | "The player it lands on takes 2 shots." |
| Vote | Who takes it | "Most votes takes 2 shots." |
| Timer | How long, what counts as failing | "30 seconds. Every miss is a shot." |

**Rule cards that make their rule with a tool.** Give the rule card `tool: { via: 'dice' | 'coin' | 'wheel', ... }` and write the rule lines as the `outcomes` (six for a die, two for a coin) or `tool.labels` (wheel). Do not set `rule`: the result becomes the rule bar. Every outcome must be a complete rule with its own penalty ("No names. Say one and take {shot}.") because that exact line is what stays on screen. A coin outcome may start with "Heads: " or "Tails: "; the prefix is dropped on the bar.

Keep penalties from tools to 1 to 3 shots. A die can map 4, 5 and 6 to safe results or to a repeat of 3 shots; never to 4, 5 or 6 shots.

## 8. Writing rules for the text

These are hard rules, checked by tests where noted.

1. **No emoji** anywhere (test).
2. **No em dash** (test). Use a full stop or a comma.
3. **Sentence case.** No all caps, no exclamation marks in wild card copy (test).
4. **Plain words, short.** One idea per card. If it needs two sentences, the second is the consequence or the instruction.
5. **Say what to do.** "Do 10 jumping jacks", not "Time to get moving".
6. **Filipino context where natural.** Jollibee, jeepney, videoke, Pasko, "po", teleserye, barkada. Light Taglish is fine. Do not force it.
7. **Tease, never humiliate.** "Who in this room" cards pick a funny winner; they never target body, appearance, race, religion, disability, money problems or trauma.
8. **No real people** by name, and no celebrity cards that mock a person.
9. **Drink words use tokens**, so non-drinking tables work:
   - `{drink}` becomes "drink" or "do a forfeit": "You {drink}."
   - `{shot}` becomes "a shot" or "a forfeit": "Whoever slips takes {shot}."
   - `{shots}` becomes "shots" or "forfeits": "All {shots} are doubled."
   Never write "drink" or "shot" directly in a card that could appear at a non-drinking table. Do not write "an extra {shot}" or "{drink}s"; they break.
10. **Length.** Aim for under 100 characters. Card text shrinks with length (3.4rem under 55 characters, 2.9rem under 100, 2.2rem under 150, 1.8rem after that), and tool cards cap at 2.6rem so the tool fits. Over 150 characters scrolls on small phones.
11. **No time limits you cannot see.** If a dare has a time ("for 30 seconds"), the app adds a timer button by itself. Write the number as digits and the unit as a word: "30 seconds".
12. **No heavy topics in decks that are not for them.** Family and Icebreaker cards avoid sex, death, trauma, money trouble, politics, religion and exes. Tag topics honestly so the comfort filter can remove them.

## 9. How many players a card needs

The app reads the wording to decide, unless you set `people`:

| Wording | Needs |
|---|---|
| "your partner", "you two", "just the two of you" | exactly 2 |
| "which two people", "two people here" | 4 or more |
| "in this room", "who here", "everyone", "each person", "the group", "across from you" | 3 or more |
| "the person on your left or right", "next person", "someone here" | 2 or more |
| anything else | 2 or more |

Cards that need a minimum are dropped from games with fewer players. Bottle and vote cards set `people: { min: 3, max: null }` explicitly.

## 10. 18+ cards

- Flag them `adult: true` and put them in `src/lib/data/adult-cards.ts` (questions and dares) or as adult rows in `tool-cards.ts` (tool cards).
- They are drawn only from the Adult deck and from Chaos. Both need the table to confirm everyone is 18 or older before the cards can be bought.
- **Flirty, never graphic.** Suggestive questions, compliments, flirting, dating stories. No explicit sexual acts, no nudity, no pressure to touch anyone, no cards about a person who has not agreed to play.
- Use the `sexual_content` topic where it fits so a group can switch it off.
- Intensity is 3 to 5.

## 11. Making a new card, step by step

1. **Pick the kind.** What does the table do: answer, do something, or use a tool?
2. **Pick the category and intensity** so it lands in the decks you want (section 5).
3. **Write the text** following section 8. Use tokens for drink words.
4. **Fill the kind's fields** (section 3): `tool`, `outcomes`, `rule`, `people`.
5. **Check the penalty.** The default is fine for most. Set `penalty` only if the card needs 2 or 3.
6. **Add it to the right file:**
   - Truths and dares for the library: add to `supabase/seed/cards.sql`, then run `node scripts/seed-to-ts.mjs` to regenerate `src/lib/data/cards.ts` (do not edit that file by hand).
   - 18+ questions and dares: `src/lib/data/adult-cards.ts`.
   - Dice, coin, bottle, wheel, timer, vote and rule cards: a row in `ROWS` in `src/lib/data/tool-cards.ts`.
   - Shop packs: `src/lib/data/shop-catalogue.ts`.
7. **Run `npm test` and `npm run lint`.** The tests check unique ids, six outcomes on one-die dice cards, two on coin cards, labels on wheels, seconds on timers, `rule` on rule cards, no em dash, no emoji, Family cards at level 2 or below, and penalties between 1 and 3.
8. **Play it once.** Reveal it, use the tool, read the bottom line. If you cannot explain it in one breath, simplify it.

### Examples

A dice card with outcomes (a row in `tool-cards.ts`):

```ts
{ kind: 'dice', intensity: 3, text: 'Roll the dice. Do what your number says.', tool: { dice: 1 },
  outcomes: ['Do your best impression of someone here.', 'Sing the chorus of any song.', 'Read your last sent message out loud, or {drink}.', 'Say something nice about every player.', 'Do 10 jumping jacks.', 'Pass the dice to the next player. You are free.'] },
```

A coin card:

```ts
{ kind: 'coin', intensity: 4, text: 'Flip the coin. Truth or dare, but you do not choose.',
  outcomes: ['Heads: truth. Answer anything the group asks.', 'Tails: dare. The group picks it.'] },
```

A rule card:

```ts
{ kind: 'rule', intensity: 2, text: 'No swearing until the next wild card. Whoever swears takes {shot}.', rule: 'No swearing. Swear and take {shot}' },
```

## 12. Things the app does with cards that you should know

- **Heat decides the order.** The heat meter (1 to 5) picks what is drawn next. At heat 1 the draw prefers the easiest cards (intensity 1, Icebreaker and Family first), and it climbs: at heat 4 it prefers the hardest cards (intensity 4 to 5, Adult last). Cards between wild cards are reordered this way each draw; wild cards keep their places. A card of the same category or deck as the one before is pushed down so there are no runs. When the meter is full (4.95 or more) the draw is completely random from everything left, and the heat bar says "Anything goes". If skips bring the heat back down, the draw goes back to climbing.
- **Heat pace.** In games of about 20 cards or fewer, heat moves in full steps (dismiss +0.3, wild +0.5, heart +0.5, skip -0.2). In longer games the steps shrink (`heatPace`: 20.5 divided by the number of cards, never below 0.15), so the meter fills about two thirds of the way through the game and the climb from easy to hard is slow enough to feel. Family mode is capped at heat 2.0 and never goes random.
- **Shuffle.** After buying, all cards are mixed so the table does not get runs of one deck, kind or category (`spreadOut`), then the heat draw takes over. Wild cards are added after.
- **Skip** gives the same player a new card. It lowers heat a little, uses a card from the pot and does not pass the phone.
- **Pot.** Each card costs its deck's price. Wild cards are free.
- **Saved and trashed cards** are remembered by id.
- **Non-drinking tables** see forfeits wherever drinks were written with tokens.
