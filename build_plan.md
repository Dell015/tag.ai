# 🔨 Build Plan — Drinking Game Webapp
**For: Kiro**
**Version:** 1.0
**Stack:** Next.js · Supabase · Framer Motion · Tailwind CSS · PayMongo

---

## Overview

This document outlines the full technical build plan for the drinking game webapp. It is split into 7 phases, each independently shippable. Every phase ends with a working, testable product — nothing is built in isolation.

The app is a **Progressive Web App (PWA)** first. No App Store until Phase 7.

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend Framework | Next.js 14 (App Router) | PWA support, SSR, fast routing |
| Styling | Tailwind CSS | Fast utility-based UI |
| Animations | Framer Motion | Card flip, swipe, drag gestures |
| Auth | Supabase Auth | Email, Google OAuth, phone OTP |
| Database | Supabase (PostgreSQL) | Relational data + real-time |
| Real-Time | Supabase Realtime | Live session sync across devices |
| Payments | PayMongo | GCash, Maya, cards, OTC — PH-native |
| Hosting | Vercel | Auto-deploy from Git, global CDN |
| File Storage | Supabase Storage | Avatars, shareable recap images |

---

## Database Schema

### `users`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
email         text UNIQUE NOT NULL
username      text UNIQUE NOT NULL
avatar_url    text
coin_balance  integer DEFAULT 10        -- 10 welcome coins on sign-up
created_at    timestamptz DEFAULT now()
```

### `decks`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid REFERENCES users(id)
name          text NOT NULL
audience_type text                      -- barkada, lovers, strangers, family, all
visibility    text DEFAULT 'private'    -- private, friends, public
play_count    integer DEFAULT 0
copy_count    integer DEFAULT 0
created_at    timestamptz DEFAULT now()
```

### `cards`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
deck_id       uuid REFERENCES decks(id)
user_id       uuid REFERENCES users(id)
text          text NOT NULL
card_type     text NOT NULL             -- question, action, wild
intensity     integer CHECK (intensity BETWEEN 1 AND 5)
category      text                      -- opinions, memories, confessions, dares, etc.
audience_type text
copy_count    integer DEFAULT 0
play_count    integer DEFAULT 0
is_curated    boolean DEFAULT false     -- true = part of official library
created_at    timestamptz DEFAULT now()
```

### `user_trashed_cards`
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id    uuid REFERENCES users(id)
card_id    uuid REFERENCES cards(id)
trashed_at timestamptz DEFAULT now()
UNIQUE(user_id, card_id)
```

### `sessions`
```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
host_id            uuid REFERENCES users(id)
room_code          text UNIQUE NOT NULL    -- 6-char alphanumeric
status             text DEFAULT 'lobby'   -- lobby, active, paused, ended
game_mode          text                   -- icebreaker, barkada, lovers, spicy, chaos, family
heat_level         numeric DEFAULT 1      -- 1.0 to 5.0
coin_pot           integer DEFAULT 0
card_count_target  integer NOT NULL
cards_played       integer DEFAULT 0
comfort_filters    text[]                 -- array of filtered topic strings
drink_rule_template text
custom_drink_rules jsonb
created_at         timestamptz DEFAULT now()
ended_at           timestamptz
```

### `session_players`
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id        uuid REFERENCES sessions(id)
user_id           uuid REFERENCES users(id)
display_name      text NOT NULL
coins_contributed integer DEFAULT 0
turn_order        integer
joined_at         timestamptz DEFAULT now()
removed_at        timestamptz             -- null = still in game
```

### `session_cards`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id  uuid REFERENCES sessions(id)
card_id     uuid REFERENCES cards(id)
drawn_at    timestamptz DEFAULT now()
skipped     boolean DEFAULT false
hearted_by  uuid[]                        -- array of user_ids who hearted this card
```

### `wild_card_events`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id       uuid REFERENCES sessions(id)
wild_card_type   text NOT NULL
triggered_at     timestamptz DEFAULT now()
target_player_id uuid REFERENCES users(id)
```

### `coin_transactions`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES users(id)
amount      integer NOT NULL              -- positive = credit, negative = debit
type        text NOT NULL                 -- purchase, spend, earn, bonus, refund
reference   text                          -- PayMongo ref, session_id, card_id, etc.
created_at  timestamptz DEFAULT now()
```

### `saved_cards`
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id    uuid REFERENCES users(id)
card_id    uuid REFERENCES cards(id)
saved_at   timestamptz DEFAULT now()
UNIQUE(user_id, card_id)
```

---

## Supabase Realtime Events

Each active session subscribes to a Supabase Realtime channel: `session:{room_code}`

| Event | Payload | Trigger |
|---|---|---|
| `card_drawn` | card_id, card_type, drawn_by | Host draws next card |
| `card_skipped` | card_id, skipped_by | Skip voted |
| `card_hearted` | card_id, hearted_by | Player hearts card |
| `card_trashed` | card_id, trashed_by | Player trashes card |
| `heat_updated` | new_heat_level | Heat changes |
| `coin_spent` | amount, new_pot_total | Card drawn, pot decremented |
| `player_joined` | user_id, display_name, turn_order | Late join |
| `player_removed` | user_id | Player removed mid-game |
| `wild_card_triggered` | wild_card_type, target | Wild card fires |
| `game_paused` | paused_by | Host pauses |
| `game_resumed` | — | Host resumes |
| `session_ended` | final_stats | Game over |
| `pot_topped_up` | added_amount, new_pot_total | Coins added mid-game |
| `mood_changed` | new_mode, category_lock, card_limit | Host shifts mood |

---

## Phase 1 — Core Game Loop
**Goal: A real, playable game from end to end**
**Est. time: 1–2 weeks**

### Tasks

**Auth & Accounts**
- [ ] Supabase Auth setup (email + Google OAuth)
- [ ] Sign-up flow with username selection
- [ ] Welcome coin grant (10 coins) on first sign-up via DB trigger
- [ ] User profile page (username, avatar, coin balance)

**Lobby**
- [ ] Host creates session → generates 6-char room code + QR code
- [ ] Players join via room code or scanned QR
- [ ] Lobby screen: shows all joined players in real time (Supabase Realtime)
- [ ] Host can kick players from lobby

**Pre-Game Setup**
- [ ] Card count selector (10 / 20 / 30 / 40 / 50 / custom)
- [ ] Comfort filter checklist (preset topics + custom text input)
- [ ] Game mode selector (6 modes)
- [ ] Summary screen before launch

**Card Draw Loop**
- [ ] Seed curated card library (minimum 100 cards across all categories for testing)
- [ ] Card queue builder: filter by mode + comfort filters, exclude trashed cards for this user
- [ ] Card displayed face-down on screen
- [ ] Tap to flip (card reveal animation)
- [ ] Swipe left/right to dismiss → next card loads
- [ ] Turn indicator: whose turn it is + order
- [ ] Cards played counter (e.g., "Card 5 of 30")
- [ ] Session ends when card count reached → basic end screen

**Deliverable:** Full game loop works. Players can create a room, join, set it up, draw cards, and finish a session.

---

## Phase 2 — Coin Economy
**Goal: Revenue can be collected**
**Est. time: 1 week**

### Tasks

**Coin Wallet**
- [ ] Coin balance display on profile and home screen
- [ ] Transaction history page

**Session Pot**
- [ ] Chip-in screen during pre-game setup
  - Shows each player's username + input for how many coins to contribute
  - Total pot displayed with estimated card count
- [ ] Solo sponsor toggle ("I'll cover the whole session")
- [ ] Validate minimum pot (3 coins) before allowing game start
- [ ] Deduct coins from each player's wallet when game starts
- [ ] Per-card coin deduction from pot during session (based on card type)
- [ ] Pot counter visible during gameplay
- [ ] Game ends (or prompts to top-up) when pot reaches 0

**Pot Top-Up Mid-Game**
- [ ] Host can add coins from their wallet during pause
- [ ] Any player can contribute more coins mid-session

**Early Exit Refund**
- [ ] On early session end, calculate unspent pot
- [ ] Return coins proportionally to contributors

**PayMongo Integration**
- [ ] PayMongo account setup + API keys in env
- [ ] Coin purchase page with 4 package options
- [ ] Payment flow: select package → PayMongo checkout → webhook confirms → coins credited
- [ ] Support: GCash, Maya, credit card
- [ ] Transaction logged in `coin_transactions`

**Deliverable:** Players can buy coins, chip into a session pot, and the game is funded by real money.

---

## Phase 3 — Card Interactions & Wild Cards
**Goal: The game feels alive and tactile**
**Est. time: 1 week**

### Tasks

**Gesture Interactions (Framer Motion)**
- [ ] Card starts face-down (styled card back)
- [ ] Tap to flip: 3D flip animation reveals question
- [ ] Swipe left or right: card flies off screen, next queues
- [ ] Hold + drag to trash icon: drag gesture, trash icon appears at bottom on hold, release over icon = trashed
- [ ] Trash confirmation toast: "Card removed. You won't see this again."
- [ ] Heart button: tap → heart animation → saved card toast
- [ ] `user_trashed_cards` record created on trash
- [ ] `saved_cards` record created on heart

**Wild Card System**
- [ ] Wild card types defined in DB (or constants file)
- [ ] Wild card frequency logic: inject wild card into queue every ~6 cards (±2 random)
- [ ] Wild card has distinct visual design (different card back color/pattern)
- [ ] Wild card types implemented:
  - [ ] Role Reversal
  - [ ] Pick Your Target
  - [ ] Everyone Answers
  - [ ] Shuffle (reshuffles next 5 cards)
  - [ ] Heat Spike (+1 heat for 3 cards)
  - [ ] Act It Out
  - [ ] Whisper Round
  - [ ] Free Drink
  - [ ] Crown (immunity for 2 cards)
- [ ] Wild card event logged in `wild_card_events`
- [ ] Chaos Mode: wild card every ~4 cards

**Action Cards**
- [ ] Action cards seeded in curated library (tag: `card_type = 'action'`)
- [ ] Action cards appear at ~1 in 8 cards in standard modes
- [ ] Styled differently from question cards (subtle visual difference)

**Drink Assignment Rules**
- [ ] Drink rule template selector (4 templates: Classic, Chaos, Soft Mode, Points-Based)
- [ ] Custom rule builder: up to 5 free-text rules
- [ ] House Rules confirmation screen — all players tap "I Agree"
- [ ] House Rules accessible from pause menu during game
- [ ] Non-drinking toggle: replaces drink language with dare/challenge language

**Deliverable:** Cards feel physical and fun. Wild cards create spontaneous moments. Drink rules are set and visible.

---

## Phase 4 — Mid-Game Controls & Escalation
**Goal: Host has full control. Sessions are flexible.**
**Est. time: 1 week**

### Tasks

**Pause Menu**
- [ ] Pause button visible during gameplay (bottom bar)
- [ ] Pause freezes current card, dims screen
- [ ] Pause menu modal opens with all controls

**Change Mood / Category Lock**
- [ ] Game mode switcher in pause menu (switch to any mode)
- [ ] Category lock: "Next N cards from [category]" selector
- [ ] After N cards, reverts to full pool
- [ ] Realtime event `mood_changed` broadcast to all players

**Player Management Mid-Game**
- [ ] Add player: generate new QR or link, player joins lobby-style, inserted into turn rotation
- [ ] Remove player: tap name → confirm → removed from rotation
- [ ] Reorder turn rotation: drag-to-reorder list of players
- [ ] Realtime `player_joined` and `player_removed` events

**Escalation Engine**
- [ ] Heat meter UI: subtle visual bar at top of screen (all players see it)
- [ ] Heat stored in `sessions.heat_level` (float, 1.0–5.0)
- [ ] Heat adjustment logic:
  - Card swiped (no skip): +0.3
  - Card hearted: +0.5
  - Card skipped: -0.2
  - 3 consecutive skips: -1.0
  - Wild card played: +0.5
- [ ] Card draw weighted by heat: higher heat = higher probability of drawing high-intensity cards
- [ ] Heat never hard-locks card types — only adjusts probability
- [ ] Manual heat override in pause menu:
  - Turn up heat: +1 level, costs 2 coins from pot
  - Cool down: -1 level, free

**Skip System**
- [ ] Skip button on card screen
- [ ] Skip tracked per session
- [ ] Skipped cards cost 50% of their coin value from pot

**Deliverable:** Host can fully manage the session mid-game. Escalation shapes card draw without restricting it.

---

## Phase 5 — Deck Builder
**Goal: Users can create and own content**
**Est. time: 1.5 weeks**

### Tasks

**Saved Cards Library**
- [ ] "Saved Cards" tab on profile
- [ ] Shows all cards hearted across all sessions
- [ ] Filter by category, intensity
- [ ] "Add to Deck" action from any saved card

**Deck Creation**
- [ ] "My Decks" section on profile
- [ ] Create new deck: name, audience type, visibility
- [ ] Add cards to deck:
  - From saved cards
  - From public card browser (search by category, intensity, keyword)
  - Write a new card from scratch (form with card type, intensity, category fields)
- [ ] Edit / delete cards within your own deck
- [ ] Delete deck

**Inside Joke Slots (Barkada Decks)**
- [ ] When audience type = Barkada, option to add named slots
- [ ] Slots are labels (e.g., "Slot 1: Best Friend's Name")
- [ ] Cards can contain `{{slot_1}}`, `{{slot_2}}` placeholders
- [ ] Before session starts, host fills in slot values
- [ ] During gameplay, slot values are injected into card text at render time

**Using a Deck in a Session**
- [ ] During pre-game setup, host can select which deck(s) to draw from
- [ ] Multiple decks can be merged into one pool
- [ ] Or host uses "Auto" (curated library filtered by mode + filters)

**Publishing a Deck**
- [ ] Set deck visibility to Public
- [ ] Deck appears in Discovery feed
- [ ] Creator tagged on each card from that deck

**Deliverable:** Users can build, curate, and use their own card decks.

---

## Phase 6 — Community & Social
**Goal: Organic growth engine is live**
**Est. time: 1.5 weeks**

### Tasks

**Discovery Feed**
- [ ] Browse public decks: sorted by Most Played, Most Copied, Trending, Newest
- [ ] Filter by audience type, mood
- [ ] Preview a deck (first 5 cards visible before copying)
- [ ] Copy deck → all cards added to user's library (as a new deck they own)
- [ ] Follow creator button on deck page

**Creator Rewards**
- [ ] Background job / DB trigger: when `saved_cards` record created, credit original card creator +1 coin
- [ ] Background job: daily batch — count plays of community cards in sessions, credit +0.5 coins per play
- [ ] Creator earnings visible on profile
- [ ] 30% platform cut applied before crediting

**Leaderboard**
- [ ] Weekly + all-time views
- [ ] Most Copied Card
- [ ] Most Copied Deck Builder
- [ ] Most Played Card This Week
- [ ] Top Hosts (most sessions hosted)
- [ ] Resets weekly (cron job every Monday 00:00 PH time)

**Post-Game Recap**
- [ ] Recap screen on session end:
  - Cards played count
  - Heat level reached
  - Card of the Night (most hearted in session)
  - Fun anonymous stats
  - Coin summary (who contributed what, total spent)
- [ ] Shareable recap image: generated server-side (Next.js API route + canvas/satori)
  - Styled card with session stats
  - App name/logo watermark
  - Download as PNG

**Referral System**
- [ ] Unique referral link per user
- [ ] On new user sign-up via referral link: both users get +5 coins
- [ ] Referral tracked in DB, one reward per referred user

**Deliverable:** Community loop is live. Cards spread organically. Recap images drive new installs.

---

## Phase 7 — Polish & Launch
**Goal: Production-ready PWA**
**Est. time: 1–2 weeks**

### Tasks

**PWA Configuration**
- [ ] `manifest.json` with app name, icons, theme color
- [ ] Service worker for offline-safe behavior (static assets cached)
- [ ] "Add to Home Screen" prompt after first session
- [ ] Splash screen on launch

**Onboarding**
- [ ] First-time user tutorial (3–4 tooltip overlays explaining coins, cards, joining a game)
- [ ] Skip option on all tutorial steps
- [ ] Triggered only on first launch, never again

**Notifications**
- [ ] Web push notification setup (Supabase Edge Functions + Web Push API)
- [ ] Notify when: someone joins your session, your card is copied, you receive coins

**Branded Session Mode (B2B)**
- [ ] Admin dashboard (internal only) to create branded sessions
- [ ] Custom logo upload, custom welcome message, custom question pack selection
- [ ] Branded room generates unique link for the venue

**Content**
- [ ] Minimum 300 curated cards across all categories, intensities, and modes
- [ ] All cards reviewed for quality, cultural relevance (PH context), and comfort filter accuracy
- [ ] Wild card copy reviewed and finalized

**Performance**
- [ ] Load test: 20+ concurrent sessions, 6 players each
- [ ] Supabase connection pooling configured
- [ ] Vercel edge caching for static pages

**Security**
- [ ] Row-level security (RLS) policies on all Supabase tables
- [ ] Coin transaction validation server-side (never trust client for coin math)
- [ ] PayMongo webhook signature verification
- [ ] Rate limiting on session creation (prevent room spam)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PayMongo
PAYMONGO_SECRET_KEY=
PAYMONGO_PUBLIC_KEY=
PAYMONGO_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=
```

---

## Folder Structure

```
/app
  /auth          → sign-up, login, callback
  /home          → dashboard, coin balance, recent sessions
  /game
    /[roomCode]  → active session (lobby → game → recap)
  /decks         → my decks, deck builder
  /saved         → saved cards library
  /discover      → public deck browser
  /profile       → user profile, stats, transaction history
  /shop          → coin purchase page

/components
  /cards         → CardFace, CardBack, CardGesture, WildCard, ActionCard
  /session       → HeatMeter, PotCounter, TurnIndicator, PauseMenu
  /deck          → DeckCard, DeckBuilder, CardEditor
  /ui            → shared UI components

/lib
  /supabase      → client, server, realtime helpers
  /game          → escalation engine, card queue builder, wild card logic
  /coins         → coin math, transaction helpers
  /paymongo      → payment intent, webhook handler

/api
  /webhooks
    /paymongo    → payment confirmation → credit coins
  /recap         → generate shareable image (satori/canvas)
  /referral      → referral validation + coin reward
```

---

## Definition of Done (Per Phase)

Each phase is "done" when:
- [ ] Feature works end-to-end in a real device browser (not just desktop)
- [ ] Realtime sync tested with 2+ devices simultaneously
- [ ] No coin math bugs (tested: purchase, chip-in, deduct, refund)
- [ ] RLS policies applied to any new tables
- [ ] Deployed to Vercel preview URL and smoke-tested

---

*Build Plan v1.0 — Drinking Game Webapp*
