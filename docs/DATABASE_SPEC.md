# Database spec (Stage B, first slice)

Audience: whoever builds the Supabase database (Kiro or Claude). The frontend is finished against a mock layer; this file says what the real database must provide so the stores in `src/stores/` can be swapped over without changing the screens. Written 2026-10-22.

Do **not** run `supabase/migrations/001_initial_schema.sql` as it is. It predates decks, the coin pot, the shop and suggestions. Replace it with the migrations below.

## Scope: database only

The builder touches `supabase/**` and adds a short "Built" note at the bottom of this file. **Nothing in `src/`, `public/`, config files or the other docs may be changed.** If something outside seems to need a change, write it down in the "Built" note instead.

## Ground rules

1. Postgres on Supabase. Every table in `public` has **row-level security (RLS) on**. No exceptions.
2. **Coins are server-owned.** The app can never write `profiles.coins` or insert into `transactions` directly. All coin changes go through SQL functions (RPC) that run as `security definer`, check the balance, and write the ledger row and the balance in one transaction. The balance can never go below 0.
3. **Nothing suggested goes live without review.** Suggested cards start as `pending`. Only an admin can set `approved`, and only `approved` cards can be added to a deck.
4. **Adult content is gated.** Cards with `adult = true` are only returned to profiles with `is_adult_confirmed = true` (the 18+ switch and the "everyone is 18 and agrees" confirmation are enforced in the app too).
5. Never put the `service_role` key in the frontend or in a `NEXT_PUBLIC_` variable.
6. Prices and amounts are in coins with up to two decimals: `numeric(10,2)`, not float.

## Sign in

Email sign in first (one-time code or magic link, Supabase Auth). Google and phone later. On first sign in create a `profiles` row automatically with a trigger on `auth.users`. The welcome gift is 10 coins, written as a `welcome` transaction.

The admin is decided by a row in `admins` (user id), not by an email check in the app. The first admin row is inserted by hand in the SQL editor: `ADMIN_EMAIL` (owner to fill in).

## Tables

### profiles
| column | type | notes |
|---|---|---|
| id | uuid pk | = `auth.users.id` |
| username | text unique | 2 to 16 chars, trimmed |
| avatar | text | colour key "c0".."c9" |
| coins | numeric(10,2) | default 0, check >= 0, **not writable by the app** |
| is_adult_confirmed | boolean | default false |
| settings | jsonb | the settings store (drink rules, skip topics, sounds, motion) |
| created_at | timestamptz | |

RLS: a user reads and updates only their own row, and only `username`, `avatar`, `is_adult_confirmed`, `settings` (use column privileges or an update function). Usernames are readable by everyone through a view `public_profiles (id, username, avatar)`.

### transactions (the coin ledger)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk profiles | |
| kind | text | `welcome`, `purchase`, `pot`, `refund`, `topup`, `referral`, `shop` |
| amount | numeric(10,2) | signed |
| note | text | |
| created_at | timestamptz | |

RLS: a user can **read** their own rows only. Nobody inserts from the app. There is no `reward` kind: suggestions earn no coins (decision D36).

### RPC functions (security definer, called by the app)
- `spend_coins(kind text, amount numeric, note text) returns numeric`: debits, fails with a clear error when the balance is too low, returns the new balance.
- `complete_profile(username text, avatar text) returns void`: sets the username (2 to 16 characters, letters, numbers and underscore, unique, case-insensitive) and avatar for the signed in user. The trigger creates the profile with a temporary username like `player_ab12cd`; the app calls this at onboarding.
- `confirm_adult() returns void`: sets `is_adult_confirmed = true` for the signed in user (the column is not directly writable).
- `refund_coins(amount numeric, note text) returns numeric`: used when unused cards or topics are returned at the end of a game. Cap: a refund can never exceed what the same user spent in the last 24 hours on `pot` rows.
- `buy_shop_item(item_id text) returns void`: debits the price from `shop_items`, inserts into `owned_items`.
- `top_up` is **not** an RPC. Real coin purchases (GCash, cards) will be added by a payment webhook running on the server in a later stage. For now `topup` rows are inserted by hand during testing only.

### decks and cards
`decks` (seeded, read only to the app):
| column | type |
|---|---|
| id | text pk (`icebreaker`, `family`, `life`, `deep`, `barkada`, `lovers`, `spicy`, `adult`, `social`, `chaos`) |
| name, blurb | text |
| price | numeric(10,2): 0.1, 0.1, 0.1, 0.2, 0.2, 0.2, 0.3 (spicy), 0.5 (adult), 0.3 (social), 0.5 (chaos) |
| ready | boolean (false for `social`) |
| adult | boolean (true for `adult`), `includes_adult` (true for `chaos`) |

`cards`:
| column | type | notes |
|---|---|---|
| id | text pk | keep the existing ids: `card-001`, `play-001`, `adult-001`, `talk-001` |
| text | text | for tool cards the text contains the bracketed or braced options, as in `tool-cards.ts` |
| kind | text | `truth`, `dare`, `dice`, `coin`, `bottle`, `wheel`, `timer`, `vote`, `rule` |
| card_type | text | `question`, `action`, `wild` |
| intensity | smallint 1 to 5 | |
| category | text | the 9 existing categories |
| topics | text[] | sensitive-topic tags used by the skip filters |
| deck_id | text fk decks | null for cards that belong to a category pool only |
| adult | boolean | |
| wild_type | text null | `call_out`, `voice_note`, `lucky_roll`, `double_or_nothing` |
| status | text | `approved`, `pending`, `rejected`, `retired`; default `approved` for seeded cards |
| source | text | `seed` or `suggestion` |
| created_at | timestamptz | |

RLS: everyone signed in reads rows where `status = 'approved'` and (`adult = false` or the user's `is_adult_confirmed`). Admins read and write all rows. Retiring a card means `status = 'retired'` (the app already treats retired seeded cards this way, see the seed notes in `CLAUDE.md`).

Seed data is in `supabase/seed/cards.sql` (131 curated) plus the TypeScript card files `src/lib/data/play-cards.ts`, `tool-cards.ts`, `adult-cards.ts` and `talk-topics.ts`. A one-off script should read those and produce SQL inserts so the ids match what players already have saved.

`talk_topics`: same idea for the Topic deck: `id`, `group` (8 ids), `format` (`agree`, `ab`, `think`, `story`), `text`, `deeper`, `a`, `b`, `topics text[]`, `status`.

### Personal card data
- `saved_cards (user_id, card_id, created_at)`, primary key on both.
- `trashed_cards (user_id, card_id, created_at)`, primary key on both.
- `custom_cards (id, user_id, text, kind, created_at)`: the player's own private cards from the editor. Visible only to the owner.

RLS on all three: the owner only.

### Suggestions
`suggestions`:
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| author_id | uuid fk profiles | |
| text | text | 15 to 160 chars, check constraint |
| kind | text | one of the 7 suggest kinds: `truth`, `dare`, `dice`, `coin`, `bottle`, `wheel`, `rule` |
| deck_id | text fk decks | not `social`, not `chaos` |
| status | text | `pending` (default), `approved`, `rejected` |
| reviewer_id, reviewed_at, reject_reason | | set by admin |
| created_at | timestamptz | |

`suggestion_likes (suggestion_id, user_id, created_at)`, primary key on both; the author cannot like their own card (check in the insert policy).

RLS and rules:
- Anyone signed in can insert with `author_id = auth.uid()`, at most 5 per rolling 24 hours (enforce in a trigger, not only in the app).
- The author can read their own rows in any status. Everyone else reads only `approved` rows plus the like counts.
- Only admins can update `status`.
- When an admin approves a suggestion, a function `approve_suggestion(id)` copies it into `cards` with `source = 'suggestion'` and `status = 'approved'`.
- A view `weekly_contributors(week_start, author_id, username, cards, likes, points)` ranks by points (1 per approved card, 2 per like from another user), weeks starting Monday 00:00 Asia/Manila. No coin payout. Decision D36.
- Light server-side checks on insert: reject text with a blocklist word (table `blocked_words`, admin editable), reject text with a phone number or link, reject exact duplicates (case and spacing insensitive).

### Reports
`card_reports (id, card_id, reporter_id, reason text, created_at, resolved boolean)`: any signed in user can insert one per card; admins read all; the reporter reads their own. This feeds the admin screen.

### Shop
- `shop_items (id text pk, kind, name, price numeric(10,2), description, value, adult boolean, active boolean)`: seeded from `src/lib/data/shop-catalogue.ts` (coin packages are separate and handled by the payment stage).
- `owned_items (user_id, item_id, equipped boolean, created_at)`: written only by `buy_shop_item` and an `equip_item` function.

### Admin
- `admins (user_id uuid pk)`.
- A helper `is_admin()` (security definer, stable) used by policies.
- The admin screen (to be built in the app) needs: list pending suggestions with approve and reject, list reported cards, list and edit any card, mass-retire cards (the Adult review file the owner has), edit `blocked_words`.

### Not in this slice
Game sessions, rooms, realtime broadcast and the leaderboard stay on the mock layer for now. The old `sessions` and `session_players` tables can be dropped or left unused. Topic deck sessions and the coin pot for a game stay on the device; only the **coin spend and refund** are written to the server, through the RPC functions.

## How the app will use it
- `profile-store`, `wallet-store`, `settings-store`: read and write through Supabase; coin changes only through the RPC functions above.
- `suggestion-store`: insert and likes go to the tables; the board reads the `weekly_contributors` view.
- Card files in `src/lib/data` stay as an offline copy; the live source becomes the `cards` table, read once per session and cached.
- The ids of cards and topics must not change, because saved and trashed cards refer to them.

## Checks before you call it done
1. `get_advisors` (Supabase security advisor) shows no "RLS disabled" and no "security definer view" warnings.
2. As a normal signed in user, `update profiles set coins = 1000` fails; so does inserting into `transactions`.
3. As a normal user, a `pending` suggestion by someone else is not readable, and `update suggestions set status = 'approved'` fails.
4. A profile without `is_adult_confirmed` gets zero cards where `adult = true`.
5. `spend_coins` with more than the balance fails and changes nothing.
6. Two phones calling `spend_coins` at the same moment cannot take the balance below zero (use `select ... for update` or a single `update ... where coins >= amount`).
