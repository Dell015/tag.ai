# 🍻 Drinking Game Webapp — Game Design & Strategy Document

> A social drinking game webapp designed to bring people off their phones and into real conversation. A curated card library, wildcard system, coin economy, and customizable decks make every session unique.

---

## Table of Contents

1. [The Problem & Vision](#1-the-problem--vision)
2. [Core Concept](#2-core-concept)
3. [Target Audience](#3-target-audience)
4. [Onboarding & Account Setup](#4-onboarding--account-setup)
5. [Pre-Game Setup Flow](#5-pre-game-setup-flow)
6. [The Coin Economy](#6-the-coin-economy)
7. [Question & Card System](#7-question--card-system)
8. [Card Interaction Mechanics](#8-card-interaction-mechanics)
9. [Drink Assignment Rules](#9-drink-assignment-rules)
10. [Game Modes](#10-game-modes)
11. [The Escalation Engine](#11-the-escalation-engine)
12. [Mid-Game Controls](#12-mid-game-controls)
13. [Wild Cards & Action Cards](#13-wild-cards--action-cards)
14. [Deck Builder & Community](#14-deck-builder--community)
15. [Social & Leaderboard Features](#15-social--leaderboard-features)
16. [AI Integration (Deferred)](#16-ai-integration-deferred)
17. [Business Model](#17-business-model)
18. [Go-to-Market Strategy](#18-go-to-market-strategy)
19. [Tech Stack](#19-tech-stack)
20. [MVP Build Order](#20-mvp-build-order)
21. [Full Feature Map](#21-full-feature-map)
22. [Design Principles](#22-design-principles)
23. [Design Decisions Log (running)](#23-design-decisions-log-running)

---

## 1. The Problem & Vision

### The Problem

Modern drinking hangouts are broken in two ways:

- **Too much phone use** — people scroll instead of connecting, even mid-conversation
- **No conversation fuel** — groups run out of topics, sit in awkward silence, or rely on the same tired games

Existing drinking game apps fail because:
- Most are **paywalled or subscription-based**, creating friction at exactly the wrong moment
- The questions are **generic and corny** — not adapted to the group's dynamic or comfort zones
- There's **no progression** — game feels the same at minute 5 as it does at minute 90
- They don't solve the phone problem — they just give people another reason to look at their screens individually

### The Vision

A single phone, passed around the table. One screen at a time. Eye contact enforced.

The game should feel like the best version of a night you've already had — where conversation got real, where people laughed until it hurt, where someone said something you still think about. The app is just the spark.

---

## 2. Core Concept

**One phone. Everyone plays.**

- Every player signs up and has their own coin wallet
- A host creates a session and configures it (card count, comfort filters, game mode, drink rules)
- Cards are drawn one at a time — tap to reveal, swipe to dismiss, hold-drag to trash permanently
- Wild cards interrupt the flow randomly to shake things up
- The host can pause mid-game to change the mood, add or remove players, or top up the pot
- Coins fund the session — players chip in or one person sponsors

The phone is passed physically between players. Between turns, it rests face-down on the table. This enforces the eye-contact-first philosophy of the app.

---

## 3. Target Audience

### Primary

- **Barkadas (friend groups), ages 18–30** — the core Filipino social drinking demographic
- People who already do game nights but want something smarter than Truth or Dare
- Groups who feel like their hangouts have gotten boring or routine

### Secondary

- **Couples** — date nights, anniversary games, deeper connection
- **Coworkers** — team building, office parties, onboarding icebreakers
- **Strangers** — speed-friending events, bar nights, hostel common rooms

### The Host Persona

Every group has one — the person who organizes everything, buys the drinks, keeps the energy up. This person is your power user. Design for them. They're the ones who will sponsor sessions, build custom decks, and evangelize the app to their group.

---

## 4. Onboarding & Account Setup

### Why Everyone Signs Up

Unlike most drinking games where only the host has an account, **every player creates an account before joining or starting a game.** This is intentional:

- Each person has their own coin wallet to contribute to the pot
- Liked cards are saved to their personal deck automatically
- Play history, leaderboard stats, and creator rewards are tied to the account
- Encourages return visits — their saved cards are waiting for them next time

### Sign-Up Flow

1. Open the app for the first time
2. Sign up via: **Email, Google, or phone number (OTP)**
3. Choose a username and avatar
4. **Welcome coins granted** — new users receive a small starting balance (e.g., 10 free coins) so they can immediately join or chip into a session without buying first
5. Brief tooltip walkthrough: what coins are, how cards work, how to join a game

### Account Profile Includes

- Username and avatar
- Coin wallet (balance + transaction history)
- Play stats: sessions played, cards liked, decks built
- Creator stats: cards copied by others, coins earned from plays
- Saved card library
- My Decks

### Returning User

- Open app → straight to Home
- Home shows: quick-join button, recent sessions, coin balance, trending public decks

---

## 5. Pre-Game Setup Flow

The host configures everything before the game starts. Players who have joined the room can see the setup in real time but only the host can change settings.

### Step 1 — Create Room

- Host taps "Host a Game"
- A room code + QR code is instantly generated
- Other players scan or enter the code to join
- Lobby screen shows all players as they join (names + avatars)
- Host can kick players from lobby if needed

### Step 2 — Set Card Count

- Host selects how many cards to play: **10 / 20 / 30 / 40 / 50 / Custom**
- The app shows estimated session time and estimated coin cost based on selection
- This determines how long the night goes — short for a warmup, long for a full night

### Step 3 — Comfort Filters

A checklist of topics the group agrees to avoid. Host manages this, but players can privately flag a topic they don't want (shown to host only, not to the group — protects privacy).

**Pre-set filter options (toggle on = OFF LIMITS):**

- 🚫 Politics
- 🚫 Religion
- 🚫 Trauma / Mental Health
- 🚫 Money & Finances
- 🚫 Family Drama
- 🚫 Sexual Content
- 🚫 Past Relationships
- 🚫 Physical Appearance
- 🚫 Career / Work Stress
- 🚫 Death & Loss

**Custom filter:** Host can type in any specific topic to exclude (e.g., "don't mention the ex", "no work talk", "nothing about the election")

Comfort filters apply to the entire session. Any card in the curated library tagged with a filtered topic is excluded from the draw pool.

### Step 4 — Choose Game Mode

| Mode | Emoji | Description | Best For |
|---|---|---|---|
| Icebreaker | 🧊 | Light, funny, zero vulnerability | Strangers, first meetings, coworkers |
| Barkada Mode | 🍻 | Roast-heavy, inside jokes, escalating energy | Close friend groups |
| Lovers | 💕 | Intimate, vulnerable, romantic or spicy | Couples |
| Spicy | 🌶️ | High intensity, controversial takes, hot questions | Groups who know each other well |
| Chaos Mode | 🌀 | Fully randomized, any category, any intensity | Groups who want to be surprised |
| Family Mode | 👨‍👩‍👧 | Safe, nostalgic, funny — no drinking required | Mixed ages, family gatherings |

**Game mode sets the starting card pool and default heat level.** It does not permanently lock the session — the host can shift the mood mid-game (see Section 12).

### Step 5 — Drink Assignment Rules

Before the game starts, the host sets the drink rules. These are displayed on a "House Rules" screen that all players confirm before the game begins.

See Section 9 for full drink rule details.

### Step 6 — Coin Pot Setup

- Each player contributes coins from their own wallet
- App suggests a recommended contribution per player based on card count selected
- Players confirm their chip-in amount
- Alternatively, one player can select **"I'll sponsor the night"** and pay the full pot
- Game cannot start until minimum pot is met

### Step 7 — Launch

- Host reviews summary: players, card count, mode, filters, drink rules, pot size
- Taps "Start Game"
- All players see a countdown and then the first card appears

---

## 6. The Coin Economy

### Philosophy

Coins should never feel like they're draining fast. The moment someone feels nickel-and-dimed, they quit. Revenue comes from volume and from people wanting to play again — not from squeezing a single session.

**1 peso = 1 coin**

### How Coins Work

- Coins are the **fuel** for a session — not a paywall to features
- Each card drawn costs coins, deducted from the shared pot
- The group collectively chips in before the game starts
- One player can be the **sole sponsor** (pays the full pot)
- Future in-game items (dice, spinning bottles, special overlays, etc.) will also be purchasable with coins

### Card Cost by Type

| Card Type | Questions per Coin |
|---|---|
| Icebreaker / Casual | 15 questions |
| Standard | 10 questions |
| Spicy / Controversial | 6 questions |
| Deep / Vulnerable | 4 questions |
| Dare / Action Card | 5 questions |
| Wild Card | Free (random trigger, no pot deduction) |

> A mixed session naturally averages ~7–8 questions per coin. Players perceive 10 but the blend of card types brings the real average down — that's the margin.

### Session Pot Examples

| Setup | Coins in Pot | Estimated Cards |
|---|---|---|
| 3 players × 2 coins each | 6 coins | ~45–50 cards |
| 4 players × 3 coins each | 12 coins | ~85–95 cards |
| 1 sponsor × 10 coins | 10 coins | ~70–80 cards |
| 6 players × 2 coins each | 12 coins | ~85–95 cards |

### Coin Packages

| Package | Price | Coins | Approx. Cards | Bonus |
|---|---|---|---|---|
| Starter | ₱20 | 20 coins | ~160 cards | — |
| Night Out ⭐ | ₱49 | 55 coins | ~440 cards | +5 bonus coins |
| Party Pack | ₱99 | 120 coins | ~960 cards | +20 bonus coins |
| Treasurer | ₱199 | 260 coins | ~2,000 cards | +60 bonus coins |

> ⭐ **Night Out (₱49)** is the projected most-purchased — below the ₱50 psychological ceiling, covers multiple sessions, feels like a good deal.

### Coin Rules

- **Coins never expire** — no FOMO, no pressure to spend fast
- **Coins are non-transferable between accounts** — prevents farming
- **Minimum pot to start: 3 coins** — ensures at least ~20 cards
- **Pot top-up mid-game** — host can add coins from their wallet during a paused session
- **New user welcome bonus: 10 free coins** — enough to play their first session as a chippin contributor, removes the "pay before you try" barrier

### Future Coin Uses (Roadmap)

- 🎲 In-game dice (virtual dice roll mechanic)
- 🍾 Spinning bottle overlay (randomizes who answers)
- 🎴 Special card packs (themed nights, seasonal events)
- 🏆 Leaderboard boosts
- 🎨 Custom avatar frames and profile themes

---

## 7. Question & Card System

### Card Anatomy

Every card has:

- **Content** — the question, prompt, dare, or action
- **Card type** — Question, Action, Wild Card
- **Intensity level** (1–5)
- **Category tag(s)** — e.g., Relationships, Opinions, Memories, Dares, Hypotheticals
- **Audience type** — Friends, Strangers, Lovers, Family, All
- **Creator** — who wrote it (or "Curated" for library cards)
- **Copy count** — how many accounts have saved this card
- **Play count** — how many times it has been drawn in sessions

### Intensity Scale

| Level | Name | Example |
|---|---|---|
| 1 | Chill | "What's a movie you've seen more than 5 times?" |
| 2 | Warmed Up | "What's a lie you've told that you never corrected?" |
| 3 | Getting Real | "What's something you pretend to be okay with but aren't?" |
| 4 | Spicy | "What's an opinion you have that would genuinely surprise this group?" |
| 5 | Full Send | "What's something you've never told anyone in this room?" |

### Card Categories

- 🧠 Hot Takes & Opinions
- ❤️ Relationships & Love
- 🕰️ Memories & Nostalgia
- 😬 Confessions & Secrets
- 🎲 Dares & Actions
- 🌀 Hypotheticals & Would You Rather
- 🔥 Controversial Topics (filtered by comfort settings)
- 🤣 Roasts & Inside Jokes (Barkada mode)
- 💭 Deep & Philosophical (late-night, high-heat)
- ⚡ Wild Cards (see Section 13)

### Card Sources

1. **Curated Library** — hand-written, tested questions across all categories and intensities. The quality baseline. This is the primary source for MVP.
2. **Community Cards** — user-created cards that have been published publicly, played enough times, and rated well
3. **AI-Generated** *(deferred — see Section 16)*

---

## 8. Card Interaction Mechanics

The card is the centerpiece of the screen. All interactions are gesture-based and feel tactile.

### Primary Gestures

| Gesture | Action |
|---|---|
| **Tap** | Reveal the card (card starts face-down, tap flips it) |
| **Swipe left or right** | Dismiss the card — move to the next one, card is spent from the pot |
| **Hold + drag to trash icon** | "Not for me": hides this card from you. It never lands on your turn again, but the rest of the group can still get it (see 23.2) |
| **Tap ❤️ (heart icon)** | Save this card to your Saved Cards library for future use |

### Card States

1. **Face-down** — card appears as the back of a card, no text visible (builds anticipation)
2. **Revealed** — tap flips the card, question/action is shown
3. **Dismissed** — swipe animation, card flies off screen, next card queues
4. **Trashed** — drag-to-trash animation with a small confirmation toast: "Card removed. You won't see this again."
5. **Hearted** — heart animates, card is saved, subtle toast: "Added to your saved cards"

### UI Layout During Gameplay

```
┌─────────────────────────────┐
│  🔥 Heat: Level 3   Pot: 8  │  ← top bar
│  Player: Miguel   Card 14/30 │
├─────────────────────────────┤
│                             │
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │   [CARD FACE DOWN]  │   │  ← tap to flip
│   │                     │   │
│   └─────────────────────┘   │
│                             │
│   ❤️  ←  swipe  →  🗑️     │  ← gesture hints
│                             │
├─────────────────────────────┤
│  ⏸️ Pause    👥 Players     │  ← bottom controls
└─────────────────────────────┘
```

### Face-Down Ritual

Cards always start face-down. This is deliberate:
- Builds anticipation before the answer
- Prevents people from reading ahead
- Creates a physical moment — the person holding the phone taps to reveal, then reads aloud
- Group's attention is on the reader, not the screen

---

## 9. Drink Assignment Rules

### Philosophy

Drink rules are set **before the game starts**, shown on a House Rules confirmation screen, and agreed to by all players. The app suggests them — the group enforces them. The app never mandates alcohol; all rules can be adapted to non-alcoholic drinks.

### Pre-Set Drink Rule Templates

Host picks one template as the base ruleset, then can customize from there.

**Template A — Classic**
- Person who refuses to answer: drinks 2
- Person who gives a one-word answer: drinks 1
- Everyone who agrees with the answer: drinks 1
- Person who makes the group laugh hardest: gives out 2 drinks

**Template B — Chaos**
- Everyone drinks at the start of each card
- Person answering can assign drinks to anyone for any reason
- Skip a card = drink 3
- Wild card = everyone drinks

**Template C — Soft Mode**
- Only the person who answers decides if they drink
- No forced drinks — purely voluntary
- Better for groups with non-drinkers or mixed comfort levels

**Template D — Points-Based**
- No drinks tied to individual cards
- Points are assigned throughout the night
- End of game: player with fewest points drinks per point difference

### Custom Rules

Host can write up to **5 custom rules** in free text before the game starts. These are displayed on the House Rules screen alongside the template. Examples:

- "If you say 'um' or 'like', drink 1"
- "If your answer makes someone cry, give out 5"
- "The person to your left decides if you answered honestly"

### House Rules Screen

All players must tap **"I Agree"** before the game begins. Rules are accessible any time via the pause menu mid-game.

### Non-Drinking Mode

Any game can be played without alcohol. Drink assignments become "truth penalties" or "dare assignments" instead. Host toggles this in setup — the language in the app adjusts automatically (no drink icons, no alcohol references).

---

## 10. Game Modes

Game mode sets the starting card pool composition and the default heat entry level. It is not a permanent lock — the host can shift the mood mid-game.

### Mode Details

**🧊 Icebreaker**
- Card pool: 80% Level 1–2, 20% Level 3
- Entry heat: Level 1
- Categories: Light opinions, fun memories, hypotheticals, would-you-rather
- Best for: First meetings, strangers, team building, warming up before deeper modes

**🍻 Barkada Mode**
- Card pool: 30% Level 1–2, 50% Level 3–4, 20% Level 5
- Entry heat: Level 2
- Categories: Roasts, confessions, inside-joke-adjacent prompts, relationship tea
- Special: Inside Joke Slots — host fills in 3–5 names/places/memories before the game; cards reference them dynamically
- Best for: Close friend groups who want to go deep fast

**💕 Lovers**
- Card pool: 20% Level 1–2, 40% Level 3, 40% Level 4–5
- Entry heat: Level 2
- Categories: Intimacy, vulnerability, romance, relationship history, future dreams
- Best for: Couples, anniversaries, first serious date

**🌶️ Spicy**
- Card pool: 10% Level 1–2, 30% Level 3, 60% Level 4–5
- Entry heat: Level 3
- Categories: Controversial opinions, confessions, hot takes, dares
- Best for: Groups who have already warmed up and want to go deeper

**🌀 Chaos Mode**
- Card pool: Fully randomized — any category, any intensity, no restrictions
- Entry heat: Level 2 (random escalation)
- Wild cards appear more frequently (every 4th card instead of every 6th)
- Best for: Groups who want maximum unpredictability

**👨‍👩‍👧 Family Mode**
- Card pool: 100% Level 1–2
- Entry heat: Level 1, escalation capped at Level 2
- Categories: Nostalgia, fun memories, light hypotheticals, wholesome opinions
- Drink assignments replaced with "dare/challenge" assignments
- Best for: Mixed-age family gatherings, no alcohol required

---

## 11. The Escalation Engine

### Concept

The Escalation Engine monitors session heat and adjusts which cards are drawn next. It ensures every session has an arc — not a flat random shuffle.

### Heat Meter

- Displayed as a subtle visual indicator at the top of the screen (visible to all players)
- Starts at the entry heat level defined by the chosen game mode
- Adjusts dynamically based on group behavior

### Heat Adjustment Rules

| Event | Heat Change |
|---|---|
| Card answered + swiped (no skip) | +0.3 |
| Card hearted by anyone | +0.5 |
| Card skipped | -0.2 |
| 3 skips in a row | -1 full level |
| Wild card played | +0.5 |
| Host manually turns up heat | +1 level (costs 2 coins from pot) |
| Host manually cools down heat | -1 level (free) |

### Heat Levels & Unlocks

| Level | Name | Card Pool Available |
|---|---|---|
| 1 | Cold Start | Icebreakers, light opinions, fun hypotheticals |
| 2 | Warming Up | Memories, light confessions, mild opinions, easy dares |
| 3 | Getting Spicy | Relationship questions, stronger opinions, action cards |
| 4 | Full Send | Deep confessions, vulnerable questions, bold dares |
| 5 | No Going Back | Maximum intensity — all card types, no holds barred |

### Heat is Open, Not Gatekept

Heat levels **do not lock players out**. They shape the probability of what card appears next — not a hard wall:

- At Level 2, there's still a 10% chance a Level 4 card appears (surprises are good)
- At Level 4, Level 1 cards still appear occasionally (pacing relief)
- The engine biases toward the current heat level but never becomes fully predictable

**Players should never feel like they're being held back from the good stuff.** The escalation exists to create a natural arc, not to make people wait.

### Manual Heat Override

Host can turn up or cool down heat at any time from the pause menu. Turning up costs 2 coins from the pot (creates a social "dare the group" moment). Cooling down is always free.

---

## 12. Mid-Game Controls

The host can pause the game at any point. Pausing freezes the current card and opens a control panel.

### Pause Menu Options

**Change Mood / Category**
- Switch the active game mode entirely (e.g., from Icebreaker to Barkada Mode)
- Or narrow the card pool to a specific category for the next N cards:
  - "Next 5 cards: Philosophical only"
  - "Next 10 cards: Dares only"
  - "Back to full mix"
- This lets the group follow a vibe — if someone brings up a deep topic and everyone leans in, the host can lock the next cards to that category

**Manage Players**
- **Add a player** — generate a new QR / share link; new player joins mid-session
  - Late joiners start from the next card; they don't backtrack
  - Their turn is inserted into the rotation at the host's chosen position
- **Remove a player** — tap their name → remove. Their name disappears from the rotation.
  - Coins they contributed to the pot stay in the pot (no refund mid-game)
- **Reorder turn rotation** — drag to rearrange who goes next

**Top Up the Pot**
- Host (or any player) can add coins to the pot from their wallet mid-game
- Shows current remaining cards vs. cards in pot — easy to see if they need more

**View House Rules**
- Quick reference for drink assignments in case anyone forgot

**End Session Early**
- Ends the game and goes straight to the post-game recap
- Remaining coins in the pot are split back to contributors proportionally

**Resume**
- Returns to the current card with a 3-second countdown

---

## 13. Wild Cards & Action Cards

### Wild Cards

Wild cards are surprise interruptions that appear randomly during the session. They cost nothing from the pot (free events).

**Frequency:**
- Standard modes: every 6th card on average (±2 random variance)
- Chaos Mode: every 4th card

**Wild Card Types:**

| Wild Card | Description |
|---|---|
| 🔄 Role Reversal | The person who drew the card gets to ask the question TO anyone else in the group |
| 🎯 Pick Your Target | Card is directed at one specific player — drawer chooses who |
| 👥 Everyone Answers | All players answer the same question, going around the circle |
| 🔀 Shuffle | Skip this card, reshuffle the top 5 upcoming cards |
| 🌡️ Heat Spike | Heat jumps +1 level for the next 3 cards only, then returns |
| 🎭 Act It Out | Next card's question must be answered through charades or acting, no words |
| 🤫 Whisper Round | Current player whispers their answer only to the person on their left |
| 🍺 Free Drink | Everyone drinks — no question, just vibes |
| 🏆 Crown | Current player is immune to drink assignments for the next 2 cards |

Wild cards are visually distinct — a different card back design so the reveal feels special.

### Action Cards

Action cards are part of the regular draw pool, not random. They replace a question with a physical activity or group challenge. They cost coins like normal cards.

**Action Card Examples:**

- "Everyone shows the last photo they took on their phone"
- "The group votes: who in this room would survive a zombie apocalypse first?"
- "Host picks two people. Those two must debate: [random topic]. Group votes the winner."
- "Go around the circle — each person completes the sentence: 'The most unexpected thing about [player to your left] is...'"
- "Everyone writes down one assumption they have about the person to their right. Read them out."
- "The person who has been the quietest tonight has to answer the next card twice."

Action cards appear at roughly 1 in every 8 cards in standard modes, more frequently in Chaos Mode.

---

## 14. Deck Builder & Community

### Saving Cards Mid-Game

- Tap ❤️ on any card during a session
- Card is instantly added to your **Saved Cards** library
- At end of game, you see a summary of everything you saved that night
- From Saved Cards, add any card to a custom deck you own

### Building a Deck

1. Go to **My Decks** → Create New Deck
2. Name the deck and choose an audience type (Barkada, Lovers, Strangers, Family, etc.)
3. Add cards from:
   - Your Saved Cards library
   - The public card browser (search and add)
   - Write a new card from scratch
4. Set the deck's default intensity distribution (optional)
5. Set visibility: **Private** / **Friends Only** / **Public**

### Inside Joke Slots (Barkada Decks)

A unique feature for Barkada-type decks:

- Before the game, the host fills in name/place/memory slots
- Cards with `[SLOT]` placeholders render with the filled-in value
- Example: "Tell the group your most embarrassing memory involving `[Miguel]`"
- Makes every session feel personal and unrepeatable

### Using a Deck in a Session

- During setup, host selects which deck(s) to draw from
- Multiple decks can be combined into one draw pool
- Or host enables **Auto** — the system selects from the curated library based on mode and filters

### Publishing a Deck

- Set to Public → deck appears in the Discovery feed
- Other users can preview the first 5 cards before copying
- Copy a deck = all cards added to your library (you can edit your copy freely)
- Original creator is credited on each card

### Creator Rewards

- Every time another user copies your card: **+1 coin**
- Every time your card is drawn in someone else's session: **+0.5 coins** (paid in batches daily)
- Monthly top 10 creators: bonus coin pack
- Platform takes a 30% cut of earned coins (invisible to creator — they just see net earnings)

---

## 15. Social & Leaderboard Features

### Leaderboard

- **Most Copied Card** — the single card saved most across all sessions (all-time + weekly)
- **Most Copied Deck Builder** — creator whose cards have been saved the most
- **Most Played Card This Week** — trending regardless of copy count
- **Top Hosts** — players who have hosted the most sessions

Weekly rankings reset every Monday. All-time rankings are permanent.

### Discovery Feed

- Browse public decks sorted by: Most Played, Most Copied, Trending, Newest
- Filter by audience type, mood, card count
- Preview first 5 cards before copying
- Follow creators to see their new decks

### Post-Game Recap

After every session, an auto-generated recap screen shows:

- Total cards played
- Heat level reached
- Card of the Night (most hearted during the session)
- Anonymous fun stats ("Someone refused to answer 3 times tonight")
- Coin summary: who contributed what
- Shareable image card — styled for Instagram Stories or Viber

The shareable recap is free marketing. Every post is a soft ad for the app.

### Referral System

- Share your referral link → friend signs up → both get 5 bonus coins
- Host a session where 3+ players create new accounts: host gets 10 bonus coins

---

## 16. AI Integration (Deferred)

### Status: Planned — Not in MVP

AI integration and real-time social/controversial topic sourcing require more planning before implementation. These are intentionally deferred to avoid over-engineering the MVP and to solve the cost problem properly before building.

### Known Challenges to Solve First

**Cost Management**
- Using the Claude API for every card draw in every session would become expensive at scale
- Need to determine: when exactly does AI add the most value vs. the curated library being sufficient?
- Likely approach: AI is used sparingly (e.g., once per session for a personalized mid-game card, or only in a premium "AI Mode" that costs extra coins)

**Real-Time Controversial / Reddit-Style Topics**
- Sourcing live internet controversy has legal, moderation, and quality risks
- Needs a content pipeline design: how are topics fetched, filtered, sanitized, and formatted?
- Cannot be a raw API-to-card pipeline — needs human or automated review layer

### Planned (Future Phase)

- AI-generated question as a mid-session "surprise card" (once per game, costs 3 coins from pot)
- AI-powered deck suggestions when building a new deck ("Based on your saved cards, here are 10 cards you might like")
- AI session recap: a witty, personalized summary of the night's highlights
- Escalation logic assist: AI recommends next card category based on session history

### Not Planned

- Replacing the curated library with AI entirely — human-crafted cards will always be the backbone
- Real-time news/controversy injection without a proper moderation and curation layer

---

## 17. Business Model

### Core Principle: No Ads, No Subscriptions

Ads break the atmosphere. Subscriptions feel wrong for a game people play once a month. Revenue comes from coins and one-time unlocks.

### Revenue Streams

**1. Coin Purchases (Primary)**

| Package | Price | Coins | Bonus |
|---|---|---|---|
| Starter | ₱20 | 20 | — |
| Night Out ⭐ | ₱49 | 55 | +5 |
| Party Pack | ₱99 | 120 | +20 |
| Treasurer | ₱199 | 260 | +60 |

**2. Premium Question Packs (One-Time)**

Themed packs of 50–100 curated cards:

| Pack | Price | Theme |
|---|---|---|
| 🌙 3AM Depth Pack | ₱49 | Deep, vulnerable, existential |
| 💕 Date Night Pack | ₱49 | Couples, intimacy, romance |
| 🏢 Office Party Pack | ₱39 | Team building, HR-safe fun |
| 🌍 Gen Z Culture Pack | ₱49 | Internet culture, memes |
| 🍺 Barkada Deluxe Pack | ₱59 | Ultimate Filipino friend group |

**3. Host Mode Upgrade (One-Time, ₱149)**

- Session analytics (most liked cards, engagement per player)
- Advanced room controls (password-protect session, spectator mode)
- Export session recap as PDF or image pack
- Priority card queue customization

**4. Custom Branded Sessions (B2B)**

For bars, events, and corporate clients:
- Bar nights → QR standees, branded sessions with bar's logo
- Corporate → custom deck with company-relevant questions
- Birthday / debut packages → personalized deck for the celebrant
- Pricing: ₱500–₱1,500 per branded session

**5. Future In-Game Items (Coin Spend)**

- 🎲 Virtual dice (₱5 coins)
- 🍾 Spinning bottle overlay (₱3 coins per session)
- 🎴 Seasonal card packs (limited-time events)
- 🎨 Profile themes and avatar frames

### Revenue Projections (Conservative)

| User Type | Monthly Spend | % of Active Users |
|---|---|---|
| Casual (chips in only) | ₱10–₱20 | 50% |
| Regular buyer | ₱49–₱99 | 35% |
| Party organizer / Host | ₱199+ | 10% |
| B2B / Event client | ₱500–₱1,500 | 5% |

---

## 18. Go-to-Market Strategy

### Phase 1: Launch as PWA First

Do not launch on the App Store first.

- Launch as a Progressive Web App — zero install friction
- Someone at a bar can open it from a QR code in 10 seconds
- No App Store review delays, no 30% Apple/Google cut on web purchases
- PWA can be added to home screen for repeat users

### Phase 2: Seeding

- Post in r/phtech, r/manila, r/Philippines: "I built a free drinking game for barkadas"
- Share in large Facebook barkada groups, PH gaming groups, university org chats
- Seed with 5–10 influencer barkadas — give them free coins in exchange for honest content

### Phase 3: Bar & Resto Partnerships

- Partner with bars and restos in BGC, Makati, Tomas Morato
- QR code standees on every table: "Scan to play tonight's game"
- Bars get a branded version (their logo, their drink specials as dare rewards)
- Revenue share: 20% of coins spent in sessions started from their QR goes to the bar

### Phase 4: App Store

- Launch on iOS and Android once the PWA has 5,000+ active users
- App Store for discoverability — not the primary channel
- Note: In-app purchases on App Store incur 30% Apple cut — price coin packs accordingly or push users to buy via web

### Growth Loops

- **Session → Recap Share → New User** — every shared recap is a new user acquisition funnel
- **Card copying** — when someone copies a creator's card, the creator shares it
- **Referral coins** — built-in word of mouth with incentive

---

## 19. Tech Stack

### Frontend

- **Next.js** — React framework, works as PWA, SEO-friendly for landing page
- **Tailwind CSS** — utility-first styling for fast UI iteration
- **Framer Motion** — card flip, swipe, and drag-to-trash animations (makes the game feel alive)

### Backend & Database

- **Supabase** — authentication, PostgreSQL database, real-time subscriptions
- Supabase Realtime handles: player joining/leaving mid-game, pot updates, card draws, heat changes

### Payments

- **PayMongo** — Philippine payment gateway: GCash, Maya, credit/debit, over-the-counter

### Hosting

- **Vercel** — Next.js deployment, global CDN, automatic scaling

### Real-Time Events (Supabase Realtime Channels)

Each session = one channel. Events:
- `card_drawn` — new card shown
- `card_skipped` — skip registered, heat adjusted
- `card_hearted` — player saved a card
- `card_trashed` — permanently removed from user's pool
- `heat_updated` — heat level changed
- `coin_spent` — pot decremented
- `player_joined` — late player added mid-game
- `player_removed` — player left mid-game
- `wild_card_triggered` — wild card event fired
- `game_paused` / `game_resumed`
- `session_ended`

### Database Schema (Key Tables)

```
users
  id, username, email, avatar_url, coin_balance, created_at

decks
  id, user_id, name, audience_type, visibility, play_count, copy_count, created_at

cards
  id, deck_id, user_id, text, card_type (question/action/wild),
  intensity (1–5), category, audience_type, copy_count, play_count, created_at

user_trashed_cards
  id, user_id, card_id, trashed_at

sessions
  id, host_id, room_code, status, game_mode, heat_level,
  coin_pot, card_count_target, created_at

session_players
  id, session_id, user_id, display_name, coins_contributed,
  turn_order, joined_at, removed_at

session_cards
  id, session_id, card_id, drawn_at, skipped (bool),
  hearted_by (array of user_ids)

drink_rules
  id, session_id, template_used, custom_rules (json array)

coin_transactions
  id, user_id, amount, type (purchase/spend/earn/bonus/refund),
  reference, created_at

wild_card_events
  id, session_id, wild_card_type, triggered_at, target_player_id
```

---

## 20. MVP Build Order

Build in this order — each phase is independently playable and testable.

### Phase 1 — The Core Loop (Week 1–2)

- [ ] User sign-up (email + Google)
- [ ] Welcome coin bonus on sign-up
- [ ] Room creation with code + QR
- [ ] Player join via link (requires account)
- [ ] Pre-game setup: card count, comfort filters, game mode
- [ ] Basic card draw from curated library
- [ ] Tap to flip, swipe to dismiss card interactions
- [ ] Turn rotation (pass the phone)
- [ ] Session ends when card count reached

**Goal: A real, playable game from end to end.**

### Phase 2 — Coin Economy (Week 3)

- [ ] Coin wallet on all accounts
- [ ] Coin pot setup + chip-in screen
- [ ] Cards deduct coins per draw
- [ ] PayMongo integration for coin purchase
- [ ] Pot depleted = game ends (or prompt to top up)
- [ ] Pot refund on early exit (proportional)

**Goal: Revenue can be collected.**

### Phase 3 — Card Interactions & Wild Cards (Week 4)

- [ ] Hold + drag to trash (permanent removal per user)
- [ ] Heart card → saved cards library
- [ ] Wild card system (random frequency, all wild card types)
- [ ] Action cards in draw pool
- [ ] Drink assignment rules setup + House Rules screen

**Goal: The game feels alive and interactive.**

### Phase 4 — Mid-Game Controls (Week 5)

- [ ] Pause menu
- [ ] Change mood / category mid-game
- [ ] Add / remove players mid-session
- [ ] Pot top-up during pause
- [ ] Heat meter UI + manual override
- [ ] Escalation engine logic

**Goal: Host has full control. Sessions are flexible.**

### Phase 5 — Deck Builder (Week 6–7)

- [ ] Card creation UI
- [ ] Deck creation and management
- [ ] Deck selection in session setup
- [ ] Inside joke slots for Barkada decks
- [ ] Saved cards → add to deck

**Goal: Users can create and own content.**

### Phase 6 — Community & Social (Week 8–9)

- [ ] Public deck discovery
- [ ] Copy deck / card
- [ ] Creator coin rewards
- [ ] Leaderboard
- [ ] Post-game recap screen + shareable image

**Goal: Organic growth engine is live.**

### Phase 7 — Polish & Launch

- [ ] PWA configuration (installable, offline-safe)
- [ ] Onboarding flow (first-time user tutorial)
- [ ] Push notifications (session invites, copy notifications)
- [ ] Bar/resto branded session mode
- [ ] Performance testing with 20+ concurrent sessions
- [ ] Content audit of curated library (minimum 300 quality cards across all categories)

---

## 21. Full Feature Map

```
USER
├── Account
│   ├── Sign up (email / Google / phone OTP)
│   ├── Welcome bonus: 10 free coins
│   ├── Profile (username, avatar, play stats)
│   ├── Coin wallet (balance, transaction history)
│   ├── Creator stats (cards copied, coins earned, top card)
│   └── Referral link

├── Saved Cards
│   ├── Cards hearted during sessions
│   ├── Filter by category / intensity
│   └── Add to any owned deck

├── My Decks
│   ├── Create deck (name, audience type, visibility)
│   ├── Add cards (from saved, public library, or write new)
│   ├── Set inside joke slots (Barkada mode)
│   ├── Set intensity distribution
│   └── Publish to public

└── Discovery
    ├── Browse public decks
    ├── Filter by audience, mood, play count
    ├── Preview deck (first 5 cards)
    ├── Copy full deck
    └── Follow creators

PRE-GAME SETUP (Host)
├── Step 1: Create room → QR code + link
├── Step 2: Set card count (10 / 20 / 30 / 40 / 50 / custom)
├── Step 3: Comfort filters (preset list + custom text)
├── Step 4: Choose game mode
├── Step 5: Set drink rules (template + custom rules)
└── Step 6: Coin pot (chip-in or solo sponsor)

GAMEPLAY
├── Card revealed (tap to flip from face-down)
├── Swipe to dismiss
├── Hold + drag to trash (permanent per account)
├── Heart to save
├── Wild card interrupts (random, free)
├── Action card drawn (from pool)
├── Heat meter updates in real time

MID-GAME PAUSE
├── Change mood / lock category for next N cards
├── Add player (new QR / link)
├── Remove player (from rotation)
├── Reorder turn rotation
├── Top up pot
├── View house rules
├── Manual heat up / cool down
└── End session early

POST-GAME
├── Session recap screen
├── Card of the Night (most hearted)
├── Heat level reached
├── Coin summary (contributions + spend)
├── Shareable recap image
└── "Play Again" with same group

COMMUNITY
├── Leaderboard
│   ├── Most Copied Card (weekly + all-time)
│   ├── Most Copied Deck Builder
│   ├── Most Played Card This Week
│   └── Top Hosts
├── Creator Rewards
│   ├── +1 coin per card copy
│   ├── +0.5 coins per card played elsewhere
│   └── Monthly top creator bonus
└── Sharing
    ├── Recap image → Stories / Viber
    ├── Deck sharing link
    └── Referral link (both get 5 coins)

BUSINESS
├── Coin Packages (₱20 / ₱49 / ₱99 / ₱199)
├── Premium Question Packs (₱39–₱69 one-time)
├── Host Mode Upgrade (₱149 one-time)
├── Future In-Game Items (dice, bottle, overlays)
└── B2B Branded Sessions (₱500–₱1,500)
```

---

## 22. Design Principles

1. **The phone is a campfire, not a screen** — it draws the group in, not each person individually. One screen. Everyone faces each other.

2. **Face-down by default** — cards always start hidden. The tap-to-reveal is a ritual. It creates anticipation and forces the group to look at the person holding the phone, not their own devices.

3. **Generous by design** — coins feel abundant. Players should never feel squeezed. Revenue comes from people wanting to come back, not from squeezing a single session.

4. **Every session has an arc** — beginning (light), middle (momentum), climax (depth). The escalation engine ensures this without gatekeeping.

5. **Heat is a guide, not a wall** — levels shape probability, not access. The best card of the night can come at any heat level. Surprises make the game memorable.

6. **Embarrassment is opt-in** — comfort filters are sacred. No card should ever make someone feel ambushed or unsafe. The game's edge comes from willing vulnerability, not pressure.

7. **Flexibility mid-game** — real social dynamics are messy. People show up late. Someone has to leave. The mood shifts. The host needs full control to adapt without restarting.

8. **The creator economy is real** — people will write better questions if there's a reward for quality. The community card system and coin rewards make every contributed card an investment.

9. **Friction is the enemy** — sign-up should take under 60 seconds. Joining a session under 30. If anything feels like work, people skip it.

10. **It works without AI** — the curated library is the foundation. AI is an enhancement, not a dependency. A session with 300 quality human-written cards is already a great product.

---

*Document version 2.0 — updated to reflect confirmed game mechanics, gesture interactions, onboarding flow, mid-game controls, wild card system, drink rules structure, relaxed escalation engine, deferred AI planning, and revised coin economy. Built for the Philippine social market.*

---

## 23. Design Decisions Log (running)

This section records every mechanic decision as it is made, newest last. Items marked **Built** exist in the prototype; **Designed** are agreed but not built yet. When the project is finished this log becomes the source for the full explanation.

### 23.1 How the card pool is mixed for a game (Designed, 2026-10-16)

- Today the cards are a **pre-made curated library** (about 120 cards). No AI runs inside the app. Auto mode picks by rules: vibe, intensity, length, topics.
- Each account has **saved cards**, sorted by category.
- When a game starts, the deck is built from two sources:
  - **Personal share:** each player contributes cards from their own saved cards in the selected category. Example: 100-card game, 4 players, 20 cards per player (80 cards).
  - **Fresh share:** the remaining cards (20 in the example) come from the **unused pool**, cards nobody in the room has saved. Part of the fresh share is weighted toward **popular** cards, the rest is "explore" so new cards get tested.
- **Shortfall rule:** if a player has fewer saved cards in the chosen category than their quota, the missing amount is added to the fresh share. Example: one player has 12 of 20, so the fresh share becomes 28.
- A card saved by two players is used once; the freed slot also goes to the fresh share.
- Saved cards are not "owned" by the player who saved them. They go into the shared draw and can land on anyone's turn. Trashed cards are excluded (see 23.2).
- Cards carry an **ID** and **stats** (shown, finished, skipped, saved, reported). Popularity is a **rate with smoothing**, not a raw count, so new cards are not buried. Roughly 80% of fresh picks go to proven cards and 20% to untested ones.
- Pool size: do not pre-make a million cards. Start with a few thousand good cards and grow only where players run out. Storage cost is not the concern for text; generation and moderation are.

### 23.2 Trashed cards (Designed, 2026-10-16)

- Problem: if one player trashes a card everyone else likes, a global trash would remove it for the whole group.
- Rule: **trash is personal.** It hides the card **for that player only**.
  - It is never drawn for that player's own turn and never counted in that player's personal share.
  - If it comes up on their turn, it is swapped for another card of the same category and intensity.
  - Everyone else can still get it.
- Trash is a weak signal for popularity. **Report** is the strong one: reports retire a card for everyone after review.
- Group-level "off limits" stays with **comfort filters** (topic level, host-controlled, private flagging).
- Current prototype behaviour: trashing removes the card for the rest of that game and saves it to that account's trash list. The per-player swap above is **not built yet**.

### 23.3 Handling new card requests, topics and mechanics (Designed, 2026-10-16)

We do not read every card by hand. The pipeline is:
1. **Intake:** a submitted card or request is cleaned (trim, lowercase for comparison).
2. **Duplicate check, automatic:** exact match by hash, near match by text embedding similarity (pgvector). Near duplicates are rejected or merged.
3. **Safety check, automatic:** a moderation pass. Spicy, deep and dare tiers go to a **human approval queue**; casual and standard tiers can auto-approve.
4. **Trial:** new cards start as "pending" and are shown to a small share of games first.
5. **Retire:** cards with high skip or report rates are retired.
- **New topic:** add it to the topic list, then label existing cards in a batch (model-assisted), review a sample.
- **New mechanic:** a mechanic is a **card type or card field**, not a card. It gets a spec in this document first, then a schema change, then cards that use it.

### 23.4 The "Why?" follow-up (Designed, 2026-10-16)

- Applies to **yes/no style questions**, for example "If you could erase one person from your past completely, would you?" Each such card gets a "Why?" follow-up.
- Drink rule for these cards:
  - Answers yes or no and **explains why**: no drink (assumed, to confirm).
  - Answers **yes or no only**: **1 shot**.
  - **Cannot answer** the why: **2 shots**.
  - **Skipping** the card means taking a shot. This is "common knowledge" at the table, so the app does not need to enforce it (reading of the owner's note, to confirm).
- Implementation idea: a `followUp: 'why'` field on the card, shown as a second line on the card with the penalty line under it.

### 23.5 Seat sequence (Designed, partly built, 2026-10-16)

- Drinking sessions sit in a circle with a fixed order. The turn order **is** the seating order.
- **Before the game:** the host arranges players in a circle on a seat screen (drag to reorder) and picks direction (clockwise or counter-clockwise).
- **During the game:** the pause menu lets the host move players. When someone **joins**, the host picks where they sit (between two named people). When someone **leaves**, the gap closes and the "next up" pointer is kept.
- **Built:** turn order exists, and the pause menu can add, reorder and remove players mid-game.
- **Not built:** the pre-game seat screen, the circle view, direction, and "sits between" placement.

### 23.6 Player limit (Decided, 2026-10-16)

- The old cap of 12 players was an arbitrary default, not a technical limit.
- Real reasons to have any limit: waiting time between turns grows with every player, and the screen has to show everyone.
- Decision: **soft cap of 20**. Above 12, the app shows a note that turns will be far apart. A host-set cap is a later option.
- Built: the cap constant is now 20.

### 23.7 Players who do not drink (Designed, 2026-10-16)

- The existing **Non-Drinking Mode** is a whole-room switch.
- Per-player option: each player can be marked **not drinking** in the lobby, privately, without the group seeing why.
- Their penalties change instead of disappearing, so the game stays fair:
  - A shot becomes a **sip of any drink** (water counts) or an **alternative** chosen by the group: a short dare or an extra question.
  - Optional: they **give** the drink to someone else instead.
- Penalty wording uses neutral units ("1 penalty") in rooms with mixed players.
- **Not built.** Today the setting applies to the whole room only.

### 23.8 Card filing: groups and categories (Built, 2026-10-16)

- Cards are filed in three groups, each holding three categories. This is the nested structure used in Library.
  - **Get talking:** Hot takes, Hypotheticals, Memories
  - **Get personal:** Relationships, Confessions, Deep
  - **Get loud:** Dares, Roasts, Controversial
- Library now has four tabs: **Decks** (grouped by audience), **Browse** (every card, by group then category, with a heat filter and search), **Saved** (the player's own cards, same nesting), **Discover** (sample public decks, grouped by audience, filter by card group).
- Each category row shows an intensity bar chart (how many cards at levels 1 to 5).

### 23.9 Deck picker (Built, 2026-10-16)

- The six game modes are grouped by who they suit: **Easy start** (Icebreaker, Family), **Your crowd** (Barkada, Lovers), **Turn it up** (Spicy, Chaos).
- Each deck shows its intensity mix, who it is for, starting heat, wild card frequency, any heat cap, how many cards it can draw on, and (when selected) a real sample card.

### 23.10 Interface size (Built, 2026-10-16)

- The owner found the interface too large. Base text size is now 15px, buttons are 48px (primary 56px), page titles and list rows are smaller. Card text during play keeps its own size setting.

### 23.11 Mixing decks (Built, 2026-10-16)

- The host can tick **several decks** in setup, for example Barkada + Spicy.
- The first deck picked is the main one: it sets the colour and the heat rules. Pool weights of all picked decks are **averaged**, and entry heat and wild card gap are averaged too.
- **Family plays alone** because it caps heat at 2.0 and only uses intensity 1 to 2. Picking Family clears other decks, and picking another deck clears Family.
- The mid-game "change mood" control still switches to one deck at a time.

### 23.12 18+ cards (Built, 2026-10-16)

- 18+ cards are the most asked-for content at drinking sessions, so they exist, but **off by default and hidden**.
- **Where the switch is:** Settings, tap **Version** five times to unlock hidden options, then the **18+ cards** toggle appears. Turning it on shows a confirmation ("everyone playing must be 18 or older and comfortable"). Turning it off needs no confirmation.
- **When on:** 25 flirty and bold cards join the Auto pool and the Browse tab (a separate "After dark" group), saved 18+ cards show up again, and two 18+ packs appear in the Shop ("After dark", "No shame dares").
- **When off:** all of that is filtered out. 18+ cards cannot be drawn, browsed, searched or shown, and 18+ packs vanish from the Shop. A pack bought earlier stays owned but is not drawn while the setting is off.
- **Tagging:** every 18+ card carries the "sexual_content" topic, so the group can still switch them off for one game with the existing topic filter. Cards show "18+" on the card face.
- **Content rule:** flirty and suggestive only, never graphic, and never about a person who has not agreed to play.
- **Not built:** a per-room override (host turns 18+ on for one game only), and asking each player to confirm they are 18 or older.

### 23.13 How many people a card is for (Built, 2026-10-16)

- Every card has a **group size**: the minimum number of people it needs, and for a few cards a maximum (for example "Just 2 people").
- It is worked out from the wording ("in this room" needs 3 or more, "which two people here" needs 4 or more, "the person on your left" needs 2). A card can also set its size by hand.
- **In games:** the Auto pool drops cards that do not fit the number of players. Your own decks are never filtered this way.
- **In Browse:** a People filter (Any group size, 2 people, 3 to 4, 5 or more), and cards that need a bigger group are labelled, for example "3+ people".
- The wording rules are a first pass. The seed cards should get explicit sizes over time.

### 23.14 Category reference (2026-10-16)

- `docs/CATEGORIES.md` documents every category: groups, intensity scale, counts per level, how decks weight intensity, the topic tags behind the skip list, wild and action cards, group size, 18+ cards, packs, the gaps found in the current categories, and open proposals.
- Decision: **no more cards for now.** The categories get fixed first (balance per level, tag clean-up, Dares as a category or a type), then cards are added.

### 23.15 Pot modes, no length step, cash settling (Built, 2026-10-16)

- The **How long?** step is gone. The coin pot sets the length: the app shows "N coins is about X cards, ~Y min" and plays that many (5 to 100). The Default length setting is removed.
- Three ways to fill the pot: **I pay it all**, **Split it** (same amount per person), **Chip in** (each person puts in their own amount, set by the host per player).
- **Cash settling:** the host's wallet pays the whole pot. Friends settle with the host in cash, and the app lists what each person owes (1 coin is P1). At the end the recap lists what to hand back from any leftover pot, by share. Friends do not open their own phones to pay.
- **Next card, same turn:** a new button gives the current player another card without passing the phone.
- **Wild cards** glow around the edge in the deck colours. **Free Drink** shows a large "Take a drink" banner ("Do a forfeit" when the table is not drinking).
- **18+ cards** are now a normal skip topic called "18+ Cards", skipped by default. The hidden toggle is gone (this replaces 23.12's switch).

### 23.16 Heavy topics, consent and terms (Proposed, 2026-10-16)

- **Principle (owner):** the heart of an inuman is the interaction between the drinkers. It can be a distraction, but often it is closer to therapy. Opening up about hard things is welcome **when everyone has agreed to it**.
- **Hard times** (trauma-adjacent) cards live in a **Deep** deck, never in Icebreaker, Family or Chaos, and are opt-in.
- **Layers of consent:**
  1. **Terms and Privacy** accepted at sign-up (18 or older, drink responsibly, the app is a game and not therapy or medical advice, limits of the owner's responsibility).
  2. **House rules** "I Agree" screen before each game, with a short responsibility line.
  3. **Heavy deck opt-in:** Deep, Adult and Social media each ask every player to confirm before the deck can be used in that game.
  4. **In-game safety:** skipping is always free (no drink, no coin cost), a pause and "I need a break" option, and a short list of support resources.
- **Drink responsibly copy:** never required to drink, non-drinking mode, do not drive, no pressure on anyone.
- **Privacy:** the app does not record conversations, only game stats.
- **Needs a lawyer:** the Terms and Privacy drafts must be reviewed by Philippine counsel before launch. A terms page limits risk but cannot remove all liability, and the Data Privacy Act applies once accounts exist.

### 23.17 Adult deck structure (Proposed, rules agreed by owner, 2026-10-16)

The Adult deck is the topic people love most at an inuman. It uses five levels: **1 Flirty, 2 Suggestive, 3 Bold, 4 Frank, 5 Unfiltered**. The host sets a ceiling per game.

**Agreed rules:** frank talk between consenting adults, not pornographic scenes. A dare is never nudity or touching someone who has not agreed, and anyone can refuse without a drink. Nothing non-consensual and nothing involving minors, at any level. Every player confirms they are 18 or older before the deck is used.

**Sub-categories (22):**

| Group | Sub-category | Levels |
|---|---|---|
| Attraction | Flirting and attraction | 1 to 3 |
| Attraction | Rizz and pickup lines | 1 to 3 |
| Attraction | Kisses and chemistry | 1 to 4 |
| Attraction | Confidence and compliments | 1 to 2 |
| Dating life | Dates and flings | 2 to 4 |
| Dating life | Dating apps and ghosting | 1 to 3 |
| Dating life | DMs and social media crushes | 1 to 3 |
| Dating life | Firsts (first kiss, first love, first heartbreak) | 1 to 3 |
| Dating life | Hotel, trip and holiday flings | 2 to 4 |
| Dating life | Office romance | 2 to 3 |
| Past | Exes and old flames | 2 to 4 |
| Past | Breakups and revenge | 2 to 4 |
| Past | Drunk confessions | 2 to 4 |
| Past | Almost got caught (risky moments) | 3 to 5 |
| Opinions | Turn-ons and turn-offs | 2 to 4 |
| Opinions | Red flags and green flags | 1 to 3 |
| Opinions | Loyalty and jealousy | 3 to 4 |
| Opinions | Relationship hot takes (open relationships, who pays, before marriage) | 2 to 4 |
| Group | Who in this room (rankings, matchmaking, most likely to) | 2 to 4 |
| Group | Flirty dares | 2 to 4 |
| Frank | Fantasies and what-ifs | 3 to 5 |
| Frank | Bedroom talk (experience and preferences, frank wording) | 4 to 5 |

- **Existing cards:** the 25 adult cards are re-filed into these sub-categories, mostly at levels 1 to 3.
- **Content order:** levels 4 and 5 are written last and kept small.
- **Care points:** "Who in this room" cards tease, never humiliate, and never target body or appearance. Cards never ask anyone to describe harm or something done to them.

### 23.18 Talk topics are separate from the card game (Owner decision, 2026-10-16)

Philosophical debates, discussion prompts and "things to talk about" do not belong in the card game. They live in a separate topic deck with no game mechanics (no turns, shots or pot). The card game stays focused on cards that make people answer, dare or drink.

**Open points (not yet decided):** where the topic deck sits in the app, whether it costs coins, what content it holds beyond debates (see the list in the chat reply, to be logged once chosen), and whether the host can switch from the game into talk topics mid-session.

### 23.19 Two products in one app, one phone (Owner decisions, 2026-10-16)

**Names:** the app has two things to play, called **Drinking game** and **Topic deck**.

**Decisions**
- **Entry:** the Play tab offers the two as separate choices. The player picks which one to play before starting. There is no switching from one to the other mid-session (chosen: owner said "can only choose which deck to play"). Placement is the owner's delegated call: two large entries at the top of Play, so no extra tab.
- **Cost:** the Topic deck costs coins, like the game decks.
- **One phone only:** a single phone runs the whole session, for both the Drinking game and the Topic deck. Guests do not need the app, an account or a room code. Players are just names the host enters. This supersedes the room-code and guest-join idea for play (impact listed below).
- **Filters:** the Topic deck has topic filters before it starts, the same as the Drinking game (for example skipping religion or politics).
- **Topic deck flow:** players tap to see the next question, and can go back to earlier questions. No turns, shots or pot.
- **Social media deck content:** each topic is judged by context. A story or experience prompt stays in the Drinking game. A debate or discussion topic goes to the Topic deck. Each card carries a tag for which one it fits.
- **Topic deck content:** no extra topics beyond the list in 23.18 yet.

**Impact on what is built (to review, nothing changed yet)**
- Room code and guest join screens become unused or hidden.
- Seat sequence and rearranging (23.4) become a host-only screen.
- Per-player shot rules still work, because the host marks who drinks.
- "Collect in cash" already assumes one host phone, so it stays.


### 23.20 Phase 1 built: decks, baskets and one phone (2026-10-16)

**What a game looks like now**
1. Tap **Start a game** on home. There is no room code and no join screen.
2. Add the people at the table by name (2 or more).
3. **Buy your cards.** Pick who pays: *I pay it all*, *Split it* (equal shares) or *Each buys* (you set what each player buys). For each deck use the stepper (steps of 5) to choose how many cards to buy. Each deck shows its price per card and how many cards it holds.
4. **Skip these topics**, then **Drink rules**, then **House rules** where everyone taps their name to agree. Start.

**Decks and prices (coins per card)**

| Deck | Price | Contents today |
|---|---|---|
| Icebreaker | 0.1 | Light, intensity 1 to 3 (hot takes, hypotheticals, memories, dares) |
| Family | 0.1 | Clean, intensity 1 to 2, no risky topics |
| Life | 0.15 | Memories, hypotheticals and deep, up to intensity 4 (needs its own content later) |
| Barkada | 0.2 | Roasts, hot takes, dares, controversial, confessions, intensity 2 up |
| Deep | 0.25 | Deep, confessions and memories, intensity 2 up (needs its own content later) |
| Lovers | 0.25 | Relationships, confessions, memories, intensity 2 up |
| Spicy | 0.3 | Anything at intensity 3 or higher |
| Adult | 0.4 | The 18+ cards. Needs the table to confirm everyone is 18 or older |
| Social media | 0.5 | Coming soon (no cards yet) |
| Chaos | 0.6 | Every non-adult card |

**Mechanics**
- The total of the basket is the pot, taken from the host's wallet. Each card drawn uses its deck's price. Wild cards are free and come on top of the bought cards (about one in every six). What is left in the pot comes back at the end.
- A card is never drawn twice. Decks that share cards (Chaos shares with all) are filled specific decks first, Chaos last.
- Topic filters still apply on top of every deck. Heat still guides intensity within a deck.
- Family rules heat (cap 2.0) only when it is the only deck bought. Mixing it with others uses the other decks' heat.
- Friends settle in cash at 1 coin = P1: split charges everyone an equal share, each-buys charges each player their own basket.
- During a game you can switch the remaining cards to another deck (Adult is not offered there).
- Saved cards live under Me. The Library, personal decks and Discover are gone.

**Defaults I chose, to confirm with the owner:** Chaos excludes Adult cards; Life and Deep reuse existing cards until they get their own; Social media stays "Coming soon" until content is written; the minimum basket is 3 coins.


### 23.21 Chaos includes Adult, and the Topic deck is built (2026-10-16)

**Owner answers:** Chaos includes Adult cards. The Topic deck is a separate game in the menu. Social media stays "Coming soon" and will be added later. Prices were approved to adjust; they live in one list (`lib/game/decks.ts`) and are open to change.

**Chaos with Adult**
- Chaos draws from every card, adult ones included, after the other decks have taken theirs. Topic filters still apply, so a table that skips Sexual Content gets no adult cards even in Chaos.
- Buying Chaos needs the same "everyone is 18 or older" confirmation as the Adult deck. Chaos and Adult are not offered for switching mid-game, because the table has not confirmed at that point.

**Topic deck (separate from the Drinking game)**
- The Play menu has two entries: **Drinking game** and **Topic deck**. You pick one before starting and cannot switch inside a session.
- What it is: things to talk about, such as moral questions, fate and choice, mind and self, society and the future, life reflections, everyday hot takes, dilemmas and stories. No turns, no shots, no pot, no player names, one phone.
- Setup is one screen: pick the groups to include (all on by default), how many topics (10 to 100, steps of 5, 0.1 coin each), and topics to skip (same filters as the Drinking game, prefilled from your settings).
- Play: one topic at a time, Next and Back with no limit. Going back never changes what was used. Ending early refunds the topics you never reached. The session is saved, so the phone can close and you can resume from home.
- Content today: 48 topics across 8 groups, written original. A few carry filter tags (politics, religion, death, money, career). More topics come later, and Social media debates will move here or into the Drinking game depending on their context.

**Open for later:** a loose timer or turn order for talks (owner chose none for now), more groups, and whether Topic deck packs belong in the Shop.


### 23.22 Look and motion (signboard direction)

The owner felt the app still looked AI-made, so the look now follows the Philippine jeepney signboard: black plates, chunky Bungee lettering in yellow, red and white, striped chevron bands, flat deck colours, thick outlines. Motion was added on purpose: the home card fan is dealt in, cards fly in and flip with a spring, topics slide in the direction you move, coin numbers roll, and menu rows stagger in. Everything respects the Motion setting and the phone's reduce-motion option.


### 23.23 Card kinds and tools

Every card now has a kind: Truth, Dare, Dice, Coin, Bottle, Wheel, Timer or Vote. The card back shows the deck colour, and when you tap it the card turns into the colour of its kind. Dice, coin, bottle, wheel, timer and vote cards carry their own tool on the card, so nobody has to open the tools menu: roll the die and the card tells you what your number means, flip the coin and it shows heads or tails with the action, spin the bottle for a player, spin the wheel, start a timer, or run a 3-2-1 point-at-someone vote. Drink wording switches to forfeits at non-drinking tables. About one card in five is now a dare or a tool card.

Play row: the buttons are Trash, Skip, Save and Next. Skip gives the same player a new card. Swipe the card either way for Next. Undo sits in its own row above the buttons for a few seconds after each move, and the same row shows the swipe hint the rest of the time.
