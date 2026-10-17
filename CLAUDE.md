# Tag.ai — Project Context (Single Source of Truth)

> Read this file first, every session. It is meant to be enough to start working with almost no questions.
> Last updated: 2026-10-15. Owner: Randel (randelserafica1505@gmail.com, GitHub: Dell015/tag.ai).
> Where this file disagrees with older docs (`about_tagai.md`, `build_plan.md`, `design_plan.md`, `.kiro/specs/*`), **this file wins**. Those are legacy reference (see §12).

---

## 1. What Tag.ai is

A social drinking-game web app (PWA) for Filipino barkadas (ages 18–30), also couples, coworkers and strangers. **One phone is passed around the table.** Players draw cards face-down, tap to reveal, read aloud, swipe to dismiss. The goal is to get people off their phones and into real conversation; the phone is the "campfire".

Core loop: sign up → host creates room (6-char code + QR) → friends join from their own phones → host configures (card count, comfort filters, game mode, drink rules) → everyone agrees to house rules → host phone runs the game, passed around → end screen.

Core mechanics:
- **Cards:** question / action / wild. Intensity 1–5. 9 categories (hot_takes, relationships, memories, confessions, dares, hypotheticals, controversial, roasts, deep_philosophical). Tagged with `topics` for comfort-filter exclusion.
- **Gestures:** tap = flip (cards start face-down, deliberately), swipe left/right = dismiss, hold-drag to trash = permanently remove for that user, heart = save to the user's library.
- **Heat meter (1.0–5.0):** escalation engine. Dismiss +0.3, heart +0.5, wild +0.5, skip −0.2, 3 skips in a row −1.0. Heat biases which cards appear; it never hard-locks them.
- **6 game modes:** Icebreaker, Barkada, Lovers, Spicy, Chaos, Family. Each sets entry heat, intensity distribution, wild-card frequency. Family caps heat at 2.0 and only uses intensity ≤ 2.
- **4 wild cards (changed 2026-10-16, see D27, D28, D29):** Call Out, Voice Note, Lucky Roll, Double or Nothing. One-off challenges, 2 or 3 shots if failed. Rule cards hold until the next wild card.
- **Drink rules:** 4 templates (Classic, Chaos, Soft Mode, Points-Based) + up to 5 custom rules + a non-drinking mode. All players tap "I Agree".
- **Comfort filters:** 10 presets + custom text topics the group wants off the table.
- **Coins (planned, not implemented):** 1 peso = 1 coin; cards cost coins from a shared pot; new users get 10 welcome coins; PayMongo for purchases. In Phase 1 the pot is a "Free Mode" stub.
- **Business model:** no ads, no subscriptions. Coin packs (₱20/₱49/₱99/₱199), premium themed packs, host upgrade, B2B branded bar sessions. Details in `about_tagai.md` §6, §17 (still valid as product intent).

Design principles that still hold: face-down ritual; generous coins; every session has an arc; heat is a guide not a wall; comfort filters are sacred; friction is the enemy (sign-up < 60s, join < 30s); works without AI.

---

## 2. Current status (updated 2026-10-16, deck restructure Phase 1)

**Stage A frontend is built and runs entirely on a mock data layer (localStorage + BroadcastChannel). No Supabase calls are made by any page.** After the overnight run of 2026-10-15 (milestones F1 to F9 of `docs/FRONTEND_PLAN.md`), these work end to end in a browser:

- `/welcome` (intro, 18+ gate, nickname and colour, 10 welcome coins) then three tabs (since 2026-10-16): **Play** (`/`), **Shop** (`/shop`: Coins, Tools, Packs, Style), **Me** (`/me`: wallet, saved cards, leaderboard sample, invite sample, settings, help).
- Start a game, add friends by name (one phone, no room codes), then a **4-step setup** (2026-10-16): buy cards per deck (basket, with who pays), topics, drink rules, house rules. Play: coin pot charged per card, tools tray, all nine wild-card interactions, dare timers, 3 second resume, change mood, focus next cards, add and reorder players, report a card, undo. Recap: card of the night, saved tonight, share image.
- Settings (`/me/settings`) apply for real: vibration, sounds, wake lock, swipe off, undo time, confirm trash, pips, rules line, left-handed, text size, motion, contrast, game defaults prefill new rooms.
- **Not built yet:** F7 real data (Discover, leaderboard and invite are labelled Sample), jsdom component tests, Filipino strings, QR invite, payments. Next: Stage B (backend), see §6.

*Historical audit below (kept so bug numbers in commits stay meaningful). Status of each bug is in the table that follows it.*

**Original audit:**

**Phase 1 ("core game loop") was generated with Kiro and is marked complete in `.kiro/specs/core-game-loop/tasks.md`, but the owner tried it on a phone and found the UI very ugly and gave up. The code was never verified end-to-end with multiple devices.** Treat everything beyond the pure game logic as "written, not trusted".

### What is solid (keep)
- `src/lib/game/*`: pure, testable logic — game modes, escalation engine, card queue builder, turn rotation, wild-card helpers. Mostly sound (see issues below).
- `src/types/game.ts`, `src/types/supabase.ts`: types.
- Zustand stores shape (`game-store`, `session-store`) — reasonable architecture, needs fixes.
- `supabase/migrations/001_initial_schema.sql` and `supabase/seed/cards.sql` (131 cards: 122 questions + 9 actions; Filipino-flavored content, all 5 intensities, all 9 categories).
- Unit tests for pure logic and some components (Vitest).

### What is poor / must be rebuilt
- **All UI.** Generic Tailwind gray/neutral styling, no design system, emoji-as-icons, tiny tap targets, not drunk-friendly. Every page and component is to be redesigned (see §7).
- Layout/metadata still "Create Next App"; `package.json` name is `temp-next`; `README.md` is the create-next-app default.

### Known bugs / gaps (found by reading the code; NOT yet reproduced at runtime)
Numbered so they can be referenced in commits.

1. **Session never hydrated.** `src/app/game/[roomCode]/page.tsx` never loads the session/host/players/roomCode from Supabase into `useSessionStore`. So `hostId`, `sessionId`, `players` stay empty → `isHost` is always false, lobby shows no players, `EndScreen` has no `sessionId`/`roomCode`.
2. **`player_joined` is never broadcast.** The join page inserts into `session_players` then redirects; no realtime event is sent, so the lobby can't update live.
3. **Join lookup blocked by RLS.** `sessions` SELECT policy only allows users already in `session_players`; a new joiner querying by `room_code` gets nothing → "Room not found". Needs a SECURITY DEFINER RPC (e.g. `join_session(room_code)`) or a policy change.
4. **RLS on `users`** only allows reading your own row, so other players' usernames/avatars can't be read. Likewise `session_players` policy is self-referential.
5. **Broken home link:** "Join a Game" links to `/game/join`, which matches the dynamic `/game/[roomCode]` route with roomCode=`join`. Needs a real `/join` page (enter code) — the existing join page lives at `/game/[roomCode]/join` and requires a code in the URL.
6. **Comfort filter mismatch.** Preset labels ("Past Relationships", "Trauma/Mental Health", "Sexual Content", "Money/Finances", "Career/Work Stress", "Death/Loss"…) are compared case-insensitively against card `topics` that are snake_case tags (`past_relationships`, `mental_health`, `sexual_content`, `money`, `career`, `death`…). Most never match. Needs a canonical filter→tags map.
7. **`gameMode` hardcoded to `'barkada'`** in every `calculateHeat` call in `game-store.ts` → Family heat cap (2.0) never applies.
8. **Heat Spike does nothing to heat.** `applyWildCardEffect('heat_spike')` only sets `heatSpikeRemaining`/`preSpikeHeat`; it never raises heat by +1. Also heat-spike revert logic is applied in dismiss/trash/heart (heart shouldn't count as a "card").
9. **`selectCardByHeat` is unused.** The queue is built once, up front, by intensity distribution; the heat meter is cosmetic and doesn't steer upcoming cards.
10. **Trash flow is inconsistent.** `TrashZone` only supports tap/drop, not the hold-drag gesture promised in the design; trash inserts the buffer card at the *current* index then advances, which can show the wrong card; TrashZone inserts into the DB directly while a separate retry queue exists in `use-game-actions` — `use-game-actions` isn't used by the page at all.
11. **`use-game-actions` (offline retry queue) is not wired** into the game page. Heart/trash use direct inserts.
12. **Avatars:** stored as an emoji string in `users.avatar_url`, but rendered as `<img src>`/`next/image` in several components → broken images.
13. **No welcome-coin DB trigger / profile row creation.** The client upserts the `users` row with `coin_balance: 10` from the setup page (client-trusted). Email-signup flow with "confirm email" enabled will leave the user without a session at `/setup`.
14. **Wild card `id`s** are `wild-${Date.now()}-${rand}` — not UUIDs, can collide; `wild` cards have placeholder `category: 'hot_takes'`.
15. **Queue builder** doesn't guarantee wild-card gap bounds from the spec and can return fewer than `cardCountTarget` cards if the library is small (no "not enough cards" handling as specified).
16. `players.sort(...)` in the page mutates the store array. `HouseRules`/`LobbyPlayerList` call `channel.send` without subscribing (falls back to REST, works but is not the intended pattern). Each broadcast creates a throwaway channel.
17. **Join mid-game, remove/add player, pause menu, mood change, skip button, top-up, recap, decks, shop, leaderboard** — none of Phases 2–7 exist.
18. Drink-rule text is not actually applied in-game (non-drinking mode only changes labels in setup; wild card "Free Drink" always says "Everyone drinks").
19. The 7 optional property tests in the spec are unwritten, and `fast-check` is not installed.
20. Middleware only refreshes the Supabase session; there is **no route protection** (each page redirects itself).

**Status after Stage A:**

| Bug | Status |
|---|---|
| #1 session hydration | Fixed for the mock layer (`useRoom`). Re-verify in Stage B. |
| #2 `player_joined` broadcast | Mock layer syncs via BroadcastChannel; real Realtime is Stage B. |
| #3, #4, #13 RLS / join lookup / profile row | Open — Stage B (SQL + RPC). |
| #5 `/game/join` link | Fixed: real `/join` page; `/game/[code]/join` redirects to it. |
| #6 comfort filters, #7 family cap, #8 heat spike, #9 steering, #10 trash (store side), #14 wild ids, #15 small library | Fixed in `src/lib/game` + `game-store` (tests added). |
| #11 offline retry queue | Open — `use-game-actions` still unused; saved/trashed cards are local in `profile-store`. |
| #12 avatars | Fixed: avatars are emoji, rendered by `<Avatar/>`. |
| #16 | Fixed (page rewritten). |
| #17 | Partly: pause menu, recap, decks (UI), skip, undo exist. Mid-game join, shop purchases, leaderboard do not. |
| #18 drink-rule text in game | Open: rules are shown in the pause sheet only. |
| #19 property tests | Open. |
| #20 route protection | Replaced: middleware is a pass-through; pages use `useRequireProfile`. Stage B must protect `/api/*`. |
| #21 (new) old PassPrompt never dismissed | Fixed: `PassOverlay` calls `dismissPassPrompt`. |


---

## 3. Decisions made (and the reasoning)

| # | Decision | Notes |
|---|---|---|
| D1 | **Frontend first, backend later.** Build the whole UI against a mock data layer, then wire Supabase. | Owner's call 2026-10-15. |
| D2 | **Complete redesign of the UI.** Old `design_plan.md` is outdated. | See §7. |
| D3 | **Keep** `src/lib/game/*`, types, store shape, SQL schema+seed as a base; **rebuild** `src/components/*` and `src/app/**` pages. | Recommendation from the 2026-10-15 audit; revisit if logic proves unsalvageable. |
| D4 | **Migrate from Kiro to Claude Code.** ~1000 Kiro credits remain and should be spent on bulk frontend work before they expire; Claude Code is the primary tool afterwards. | See §10. |
| D5 | **New Supabase project** (the old one's free-tier slot is gone). Nothing in the old project is needed. | Keys go in `.env.local`, never committed. |
| D6 | Deploy target: **Vercel**, project `tag-ai` (https://vercel.com/dels-projects-8a034708/tag-ai). | Production URL not recorded — fill in §9. |
| D7 | PWA first, no app stores until 5k+ users. | From the original plan. |
| D8 | Gameplay is **host-phone only** (single device passed around); other phones are used for lobby/setup/house-rules agreement. Joining after start is blocked in Phase 1. | Still the plan; revisit when mid-game controls are designed. |
| D9 | **Guest players:** the host can add friends by name on their own phone, no account needed. Guests have `isGuest: true`. | Owner flow is "only my phone". |
| D10 | **Mock account.** Stage A has no auth: a local profile (`profile-store`) with 10 welcome coins, saved and trashed card ids. Login/signup/callback pages were deleted. | Stage B reintroduces Supabase auth. |
| D11 | **Repository seam.** UI talks only to `rooms` (`src/lib/data/rooms.ts`). Stage B adds a Supabase `RoomRepository` and swaps one export. | |
| D12 | **Visual direction (v2, replaces the first dark/gradient version the owner rejected as "looks AI"):** type-first and flat. One family, Archivo variable (condensed heavy for headlines via `font-stretch`, normal width for body). Warm bottle-brown dark base; each game mode is a flat printed-deck colour (jeepney-paint palette) set through `data-mode` (`--accent`/`--on-accent`). Chunky key-style buttons (thick bottom edge, no glow). Hand-drawn SVG icon set (`components/ui/Icon.tsx`). Avatars are a flat colour plus the first letter (`c0`..`c9`). | See §7. |
| D13 | **Drunk-proof rules enforced in code:** buttons ≥56px, card text ≥24px, every swipe has a button, 5s Undo toast on done/skip/trash, current player always shown, reduced-motion respected, haptics. | |

| D14 | **Coin pot is required** to start a game (minimum 3 coins). Card cost per type (`lib/game/pot.ts`), wild cards free, heat up costs 2 coins, unused pot refunded at the end. The host's wallet funds the pot, guests pay the host in cash. | Owner approval 2026-10-15. |
| D15 | **Shop catalogue** as in `docs/FRONTEND_PLAN.md` 6.3: tools, packs and cosmetics paid with coins; coin packages are real money later (Payments open soon, test purchases toggle by tapping Version five times in Settings). Pack contents are short sample sets. | Owner approval 2026-10-15. |
| D16 | **Social features are visible but labelled Sample** (Discover, leaderboard, invite) until accounts exist. | Owner approval 2026-10-15. |
| D17 | **Own decks play alone.** Choosing "My decks" as the card source uses only those cards, so a small deck makes a shorter game. `[SLOT]` blanks are filled from three words the host types, or those cards are left out. | Decided in the run. |
| D18 | Bottom tabs show only on the four top-level screens. Retired routes `/profile`, `/saved`, `/decks` stay as redirect stubs because the device tools cannot delete files. | |
| D19 | Display settings are mirrored to `<html data-text|motion|contrast|hand>` by `SettingsApplier`; CSS reads them. Equipped accent theme sets `--accent` on `<html>` outside games. | |

| D20 | **Decks replace the Library and game modes (Phase 1 built 2026-10-16).** Before a game the host buys a number of cards from each deck (the basket). Decks: Icebreaker, Family, Life, Deep, Barkada, Lovers, Spicy, Adult, Social media (coming soon, no cards yet), Chaos. Each has a price per card (`lib/game/decks.ts`): 0.1, 0.1, 0.15, 0.25, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6 coins. Social media is the second most expensive and Chaos the most. Wild cards are free. The basket total is the pot. Pot styles: I pay it all, Split it, Each buys (per-player baskets). Friends settle in cash. | Owner approval 2026-10-16. |
| D21 | **One phone runs everything.** Room codes, the join screen and invite sharing are removed from the UI (`/join` and `/game/[code]/join` redirect home). Players are names the host adds. | Owner 2026-10-16. |
| D22 | **Library and personal decks are removed.** `/library` and its sub routes redirect home. Saved cards moved to `/me/saved`. Tabs are Play, Shop, Me. Old components stay in the folder unused because the device tools cannot delete files. | Owner 2026-10-16. |
| D23 | **18+ is the Adult deck, not a filter.** The "18+ Cards" topic is retired (stripped from saved settings). The Adult deck needs a table confirmation that everyone is 18 or older before it can be bought. Chaos includes Adult cards (owner 2026-10-16), so buying Chaos also needs the 18+ confirmation, and Chaos is not offered for mid-game deck switching. | Owner 2026-10-16. |
| D24 | **Topic deck is a separate game on the Play menu (built 2026-10-16).** Debates and things to talk about, no turns, shots or pot. 0.1 coin per topic, bought by quantity (10 to 100, steps of 5), group chips and skip-topic filters before starting, tap Next, Back at any time, unused topics refunded when you end. Routes `/talk` and `/talk/play`, store `talk-store`, content `lib/data/talk-topics.ts` (48 topics, 8 groups). Names are "Drinking game" and "Topic deck". Social media deck stays Coming soon. | Owner 2026-10-16. See `about_tagai.md` 23.18 to 23.21. |

| D25 | **Card kinds with built-in tools (2026-10-16).** Every card has a kind: truth, dare, dice, coin, bottle, wheel, timer, vote (`lib/game/card-kinds.ts`). Kind sets the card colour on reveal (`data-kind` in globals.css), the card back keeps the deck colour. Tool kinds show their tool on the card (`components/play/CardTools.tsx`) and the result tells the table what to do (`outcomes`, `{drink}` adapts to non-drinking tables). Content in `lib/data/tool-cards.ts` (48 cards plus 6 adult). Tool cards are actions, so about 1 in 5 cards is a dare or tool card. Skip now means a new card for the same player (no pass), swipe either way means Next, and the old Another card button is gone. Undo lives in a reserved row above the buttons, not a toast. | Owner 2026-10-16. |

| D26 | **Turn order is the order players tap to agree** on the house rules step (owner idea 2026-10-16). Each tapped name shows its number, tapping again undoes it, the first tap plays first (`playOrder` in `start-game.ts`). | Owner 2026-10-16. |

| D27 | **Wild cards, rule cards and consequences (2026-10-16).** Removed Whisper Round, Crown, Heat Spike, Shuffle and the other lingering wild cards because they were hard to follow. Wild cards are now four one-off challenges (Call Out 3 shots, Voice Note 2, Freeze 2, Dance Off 2). New card kind **Rule** (14 cards): holds until the next wild card, shown in a lime bar at the top while it is on (`activeRule` in game-store). Every card shows a consequence line at the bottom, "Fail or refuse: take N shots" (`penaltyFor`, 1 to 3). Drink words use tokens `{drink}`, `{shot}`, `{shots}` so non-drinking tables see forfeits. The card back now wears the colour of its kind. After buying, cards are spread so there are no runs of one category (`spreadOut`). Full rules for making cards: `docs/CARD_GUIDE.md`. | Owner 2026-10-16. |

| D28 | **Heat drives the card order (2026-10-16).** Easy cards first (Icebreaker and Family at low heat), harder as the meter fills, a full meter is a completely random draw (`drawForHeat` in `steering.ts`, replaces the old window steering). Heat steps are paced by game length so the meter fills about two thirds through (`heatPace`). Cards can invent themselves with tools: dice, coin, wheel, bottle, vote and timer decide penalties, who pays, or the rule itself (rule cards with `tool.via`), wild cards Call Out, Voice Note use the bottle and Lucky Roll uses a die (now 5 wild cards). | Owner 2026-10-16. |
| D29 | **Tools play on their own full screen, no dance or freeze (2026-10-16).** Tapping a tool button on a card opens `ToolStage` (die, coin, bottle, wheel, timer, vote) that animates by itself and hands the result back to the card. The bottle stops at a random angle and does not name anyone, the players decide who it points at. Removed Freeze, Dance Off and every dance card; added Double or Nothing (coin) as a wild card. | Owner 2026-10-16. |
| D30 | **Card suggestions and weekly top contributor (2026-10-16).** `/me/suggest`: players write cards (type, deck, text), friends like them, a weekly board ranks contributors (1 point a card, 2 per like from others), and the top contributor of the finished week claims `WEEKLY_REWARD` coins (placeholder 10, owner decides). Mock only: sample cards, no moderation, no server payout until accounts. A week with no likes has no winner. | Owner 2026-10-16. |
| D31 | **Card colour follows the deck, not the card type (2026-10-17).** Supersedes the per-kind card colour in D25. An Adult-only game was mostly blue because truths are blue. Every deck now has its own colour (`data-deck`), the kind is a label on the card, and the tool screen keeps the kind colour. | Owner 2026-10-17. |
| D32 | **Adult deck is about sex, not just flirting (2026-10-17).** Real users said Adult felt like Spicy. The deck now has frank, non-graphic questions about experience and preference, never-have-I-ever, bold consensual dares and adult tool cards (about 100 cards). Hard limits: nothing graphic, no nudity or sex acts between players, no minors or force, nobody outside the table, every card skippable. The 18+ confirmation now says "agrees to play" and "any card can be skipped". Spicy stays about heat and drama. | Owner 2026-10-17. |
| D33 | **Full card read-through (2026-10-17).** Owner said some cards are hard to understand. Rewrote about 50 library cards (em dashes, exclamation marks, "Hot take or truth?" style endings, vague tools), moved 11 dares that were filed as truths, fixed tool cards (one die says "die", vote cards got consequences, the confusing "nobody drinks" coin result, two-dice teleserye card), and put drink tokens in every card. Retired the TikTok dance row in the seed instead of deleting it so card ids stay stable. New tests guard all of this. | Owner 2026-10-17. |
| D34 | **Topic deck plays, not just reads (2026-10-17).** Owner said it felt plain. Every topic has a format (agree, ab, think, story) and a "go deeper" follow-up. Agree and A or B topics count down, the table taps the split and the smaller side argues for 30 seconds. Think topics get a 60 second timer, stories spin the bottle for who tells it. Each group has its own colour (`data-group`), cards sit on a small stack, and the end screen shows the most divided and the most agreed topic. Expanded to 109 topics in D35. Guide: `docs/TOPIC_GUIDE.md`. | Owner 2026-10-17. |
| D35 | **Topic deck knows the players (2026-10-17).** Owner said yes to names and more topics. Optional names on the setup screen (max 12, kept as `roster`). With 2+ names: speaker for think and story topics, per-player agree or disagree chips, minority players named in the verdict, and "most often on the other side" on the end screen. Deck is 109 topics. | Owner 2026-10-17. |

Open / unknown (owner can't remember — decide when it comes up, then record it above):
- Whether phone-OTP login is still wanted (docs said email/Google/phone; code has email + Google only).
- Skip button and its coin cost; pot mechanics details; creator-reward economics.
- Priority order of Phases 2–7 after the frontend is done.
- Production domain.

---

## 4. Tech stack & repo facts

- **Next.js 14.2.35** (App Router, `src/` dir), **React 18**, **TypeScript 5** (strict), **Tailwind 3.4**, **Framer Motion 12**, **Zustand 5**, **Supabase** (`@supabase/ssr` 0.12, `@supabase/supabase-js` 2.x), `qrcode` + `qrcode.react`, **Vitest 4** (`npm test` → `vitest run`). ESLint 8 with `next/core-web-vitals`.
- Path alias `@/*` → `src/*`.
- Fonts today: Geist (local, `src/app/fonts`). Will change with the redesign.
- Planned, not installed: PayMongo SDK/HTTP, `fast-check`, `satori` (recap image), `next-pwa`/service worker, `lucide-react`.
- Git: `origin` = https://github.com/Dell015/tag.ai.git, branch `main`, a single clone commit so far. The owner's machine is Windows; repo path `C:\Users\Randel\CODE SHI\VSCODE IDE\tag.ai`.
- Env vars (`.env.local`; example in `.env.local.example`):
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  NEXT_PUBLIC_APP_URL=http://localhost:3000   # used by /api/sessions for join URL/QR
  # later: SUPABASE_SERVICE_ROLE_KEY, PAYMONGO_SECRET_KEY, PAYMONGO_PUBLIC_KEY, PAYMONGO_WEBHOOK_SECRET
  ```
- Commands: `npm install`, `npm run dev` (http://localhost:3000), `npm test`, `npm run lint`, `npm run build`.

### Source map (what lives where)
```
src/
  middleware.ts                  Pass-through (Stage A). Re-add Supabase refresh in Stage B.
  app/
    layout.tsx, globals.css      Fonts, metadata, tokens, StoreHydrator, ToastHost
    welcome/                     Splash + nickname/avatar -> local profile
    join/                        Enter code or paste link
    (main)/                      Layout = profile guard + BottomNav
      page.tsx                   Home (host / join)
      library/                   My decks, Saved, Discover; decks/new, decks/[id], decks/[id]/edit; discover/[id]
      shop/                      Coins, Tools, Packs, Style
      me/                        Hub; wallet/, leaderboard/, referral/, settings/, settings/trashed/
      profile/, saved/, decks/   Redirect stubs to /me, /library?tab=saved, /library
    help/, legal/terms, legal/privacy   Help, FAQ, draft legal pages    game/[roomCode]/             Lobby (+ guests)
      setup/                     5-step wizard + tap-to-agree house rules + Start
      play/                      Card game + pause sheet + recap
      join/                      Redirects to /join?code=
    api/sessions/route.ts        Stage B (Supabase), unused by UI
  components/
    ui/      Button, Sheet, Toast, Icon, Avatar (frames), AvatarPicker, Chip, Screen, Stepper, BottomNav, Logo, Splash, DeckFan, SegmentedControl, Toggle, ListRow, ConfirmSheet, EmptyState, Skeleton, TextField, NumberStepper, CoinAmount, Badge, SettingsApplier, OfflineBanner
    play/    PlayCard, HeatBar, PassOverlay, PauseSheet, Recap, TopUpSheet, ToolsSheet, WildExtras, InstallSheet, TargetPicker
    library/ MyDecks, Discover, SavedList, CardEditorSheet, AddToDeckSheet, common
    lobby/   PlayerRow
  hooks/     use-room (room <-> session-store sync), use-realtime-lobby + use-game-actions (Stage B, unused)
  lib/
    game/    game-modes, escalation-engine, card-queue-builder, steering, comfort-filters, turn-rotation, wild-cards, setup-options, pot, mid-game
    data/    cards (131 generated from the seed: scripts/seed-to-ts.mjs), rooms (repository), join, start-game (buildLibrary), shop-catalogue, discover-seed
    cn.ts, card-back.ts, share-image.ts, sound.ts, haptics.ts, hydration.ts, storage.ts, use-profile.ts, validators.ts, supabase/ (Stage B)
  stores/    game-store (persisted, includes pot), session-store, profile-store, settings-store, wallet-store, shop-store, deck-store (all persisted), toast-store
  types/
scripts/seed-to-ts.mjs          Regenerates src/lib/data/cards.ts from supabase/seed/cards.sql
supabase/                       Migration + seed (Stage B)
```

### Architecture in one paragraph
Hybrid device model. **Lobby/setup** is multi-device via Supabase Realtime *broadcast* on channel `session:{ROOMCODE}` (events: `player_joined`, `player_removed`, `setup_changed`, `rules_agreed`, `game_started`, `session_ended`). **Gameplay** is local-first on the host device: the full card queue (+20% buffer) is built once at start (`buildCardQueue`) and lives in Zustand; no network during draws. Heart/trash are meant to be fire-and-forget writes with an offline retry queue. Session end syncs `cards_played`, `heat_level`, `ended_at`.

### Database (current migration)
Enums: `card_category`, `card_type` (question/action/wild), `session_status` (lobby/active/ended), `game_mode_type`.
Tables: `users` (id, email, username, avatar_url, coin_balance default 10), `cards` (text, card_type, intensity 1–5, category, topics[], audience_type, is_curated, deck_id/user_id nullable), `sessions` (host_id, room_code unique, status, game_mode, heat_level, card_count_target, cards_played, comfort_filters[], drink_rule_template, custom_drink_rules[], non_drinking_mode, ended_at), `session_players` (session_id, user_id, display_name, turn_order, agreed_to_rules, removed_at; unique(session_id,user_id)), `user_trashed_cards`, `saved_cards` (both unique(user_id, card_id)).
Gaps: `cards.deck_id` has no FK (no `decks` table yet); no `coin_transactions`, `wild_card_events`, `session_cards`; no trigger creating `users` on `auth.users` insert; RLS issues in §2 #3–4. Seed: 131 cards (30/32/27/21/12 questions at intensity 1–5, 9 actions), topics are free-form snake_case tags.

---

## 5. Game logic reference (as implemented)

- **Heat:** `calculateHeat({currentHeat,event,consecutiveSkips,gameMode})`; deltas dismiss +0.3, heart +0.5, skip −0.2 (−1.0 at 3 consecutive), wild_card +0.5; clamp [1,5]; family min(…,2.0).
- **Mode configs** (`game-modes.ts`): entry heat — icebreaker 1, barkada 2, lovers 2, spicy 3, chaos 2, family 1. Pool weights per intensity (1–5): icebreaker 40/40/20/0/0; barkada 15/15/25/25/20; lovers 10/10/40/20/20; spicy 5/5/30/30/30; chaos 20×5; family 50/50/0/0/0. Wild frequency base±variance: 6±2 (chaos 4±2). (Note: the original product doc used slightly different splits; code is authoritative.) Mode display names/taglines in code differ from the docs (e.g. Barkada is "🤙").
- **Queue:** filter comfort topics + trashed IDs → family ≤2 → split question/action → totalNeeded = target + ceil(20%) → wild count = floor(total/base), action count ≈ total/8 → pick questions by distribution → shuffle → insert wilds at base±variance → trim → main/buffer.
- **Turn rotation:** pure modulo over players sorted by `turnOrder`. After a dismiss/trash, a 3-second "Pass to X" overlay shows, then the next face-down card.
- **Wild effects wired:** shuffle (next 5), heat_spike (partial, see bug #8), crown (2-card counter, no visible effect). Others are text-only instructions.
- **Validation:** username `/^[a-zA-Z0-9_]{3,20}$/`; room code 6 chars A–Z0–9 (crypto random); card count 5–100.

---

## 6. Roadmap

Revised plan after the 2026-10-15 decisions. Original 7 phases remain in `build_plan.md` as feature inventory.

**Stage A — Frontend rebuild with mock data. The full build spec and milestone order (F1 to F10) is `docs/FRONTEND_PLAN.md`; follow it. Owner direction 2026-10-15: focus purely on the frontend before any backend work.**
- A0. Design system: tokens, fonts, primitives (Button, Sheet, Toast, Avatar, Chip, Card), motion presets, icon set. Pick the visual direction (§7) and record it.
- A1. App shell + routing + mock data layer (`src/lib/data/` repository interface with an in-memory/mock implementation and a `localStorage` "fake multiplayer"; swappable for Supabase later).
- A2. Screens: splash/onboarding, sign-up/login, profile setup, home, join (enter code/scan QR), lobby, setup wizard (6 steps), house rules, game screen (card stack, flip, swipe, trash, heart, heat, pass prompt, wild overlay, action cards), pause menu, end/recap, profile, saved cards, shop (UI only), decks/discover (UI only).
- A3. Polish: motion, haptics (`navigator.vibrate`), sound hooks, accessibility, PWA manifest/icons, empty states, loading/error states, responsive 360–430px.
- A4. Component tests for critical flows (Vitest + Testing Library) and fix the pure-logic bugs (#7, #8, #9, #14, #15).

Stage A leftovers: QR code for the invite (low value while play is single-phone), sound hooks, component tests for the new screens (needs jsdom + Testing Library), a visual review on a real phone. Done since: target picker on wild cards, rule line during play, first-game swipe hint, Resume button on home, screen wake lock, branded 404/error pages, PNG PWA icons, single bottom toast.

**Stage B — Backend wiring (CURRENT NEXT)**
- New Supabase project; fix migration/RLS (#3, #4, #13), `join_session` RPC, profile trigger, realtime hydration (#1, #2), route protection, replace mock repository with Supabase implementation, offline sync queue wiring (#10, #11).
- Verify with 2+ real devices.

**Stage C — Original Phases 2–7:** coin pot & PayMongo, mid-game controls & escalation, deck builder, community/leaderboard/recap image, PWA polish/B2B/security/perf. Priority order TBD by owner.

**Stage D — Deferred:** AI features (cost + moderation unresolved; see `about_tagai.md` §16).

---

## 7. UI/UX direction (replaces `design_plan.md`)

Owner brief (2026-10-15): **modern, aesthetic, super easy to navigate for drunk people. It must not look "AI-made".**

### Hard rules (the owner has rejected these)
- **No emojis anywhere in the UI** (not as icons, avatars, bullets or decoration). Use `<Icon/>` or type. Data files must not carry emoji either.
- **No gradients, glows, aurora/radial backgrounds, film grain, glassmorphism**, no purple/indigo, no pink-to-orange.
- No em dashes in UI copy. Sentence case. No all-caps eyebrow labels, no accenting a single word in a headline, no numbered markers unless the content is a sequence.
- Do not wrap everything in rounded cards with the same shadow. Use rules (`border-line`), whitespace and type for grouping; flat colour blocks only where colour means something (a deck, a player).

### Visual language
- **Colour:** neutral base `--bg` warm dark brown; text near-white; accent = the current deck's flat colour (icebreaker blue, barkada yellow, lovers pink, spicy red, chaos orange, family green). Outside a game the accent is barkada yellow. Player colours come from `AVATAR_COLORS`.
- **Type:** Archivo variable only. Headlines `font-stretch: 72%`, weight 800, tight leading; body 500. Card text is 32px or larger and scales down by length, never below 28px.
- **Memorable moments (spend boldness here, keep the rest quiet):** the fanned deck on the welcome screen, the full-screen player-colour "Pass the phone" screen, the printed-card look of the play card.
- **Controls:** 56px minimum (68px for primary), chunky key buttons, a button for every gesture, 5s Undo toast, current player always visible.
- **Signboard direction (v3, owner-requested 2026-10-16, replaces the quiet v2 look):** the owner said v2 still looked AI-made and asked for researched, proper design plus animation. Reference is the jeepney signboard: black plates, blocky Bungee lettering (`.sign` class) in yellow, red and white, chevron stripe bands (`.trim`), flat colours, thick outlines. Radius is by role (cards larger than buttons, avatars round), no shadows or gradients. Home is a destination board (Drinking game, Topic deck) with a dealt card fan.
- **Motion (v3):** motion is now allowed and wanted where it carries meaning: a dealt card fan on home, springs when cards are dealt and flipped (`PlayCard`), direction-aware slides between topics (`AnimatePresence`), rolling coin numbers (`RollNumber`), staggered board rows. One orchestrated entrance per screen, no scattered fades. All motion goes through `MotionProvider`, which honours the Settings motion option and the OS `prefers-reduced-motion`.

### Research notes (2026-10-15)
Sources used when deciding the above: thefountaininstitute.com "7 signs a UI has been vibe coded" (emoji icons, purple gradients, glow on dark, nested cards are the tells); superdesign.dev "make AI UI less generic"; daisyui 2026 trends (type-first, bold borders, sticker/flat colour suit party apps).

---

## 8. Conventions for working in this repo

- Language/UI copy: English with light Taglish where natural; Philippine context (₱, barkada, inuman). Keep card content culturally relevant to the Philippines.
- TypeScript strict; no `any`; functional components; `'use client'` only where needed. Keep pure game logic in `src/lib/game` free of React and network calls and covered by Vitest.
- Components in PascalCase; folders by feature (`game`, `lobby`, `setup`, plus new `ui` for primitives). Animations with Framer Motion on `transform`/`opacity` only.
- State: Zustand for local/gameplay state; Supabase is source of truth for persistent data (after Stage B). Never trust the client for coin math (server-side only, Stage C).
- Don't commit secrets. `.env.local` is gitignored.
- Before finishing any task: `npm run lint`, `npm test`, and `npm run build` should pass. If something can't be run, say so.
- Commit small, descriptive messages. Ask before force-pushing, rewriting history or adding heavy dependencies. Owner is on Windows — avoid shell-specific scripts (use Node scripts or document PowerShell).
- Update **§2 (status), §3 (decisions) and §11 (changelog) in this file at the end of every session** so the next session starts informed.
- When a requirement is unclear, make the most reasonable product-minded call, state it, and record it in §3 — don't stall on questions the docs can answer.

---

## 9. Environment & deployment

- Vercel project: https://vercel.com/dels-projects-8a034708/tag-ai (team "del's projects"). Production URL: _unknown — fill in_. Needs env vars set in Vercel (see §4).
- Supabase: **new project to be created** (old one is unusable). After creating: run `supabase/migrations/*.sql` then `supabase/seed/cards.sql` in the SQL editor; enable Email auth (decide whether "Confirm email" is on — turn it off for development); configure Google OAuth (redirect `…/auth/callback`); add site URL + redirect URLs for localhost and the Vercel domain; Realtime is used in broadcast mode (no table replication needed). Project ref/URL: _unknown — fill in_.
- PayMongo: no account/keys yet (Stage C).

---

## 10. Kiro → Claude Code transition (burn-down plan)

Owner has **~1000 Kiro credits left (expiring)** and wants to use them fully, then switch entirely to Claude Code.

- Use Kiro for **bulk, well-specified frontend work in Stage A** (screens/components from a clear spec). It's credit-metered, so give it large, self-contained specs.
- Prepared for Kiro: `.kiro/steering/project.md` tells Kiro to read this file. Next step: create `.kiro/specs/frontend-rebuild/` (requirements → design → tasks) once the visual direction in §7 is chosen, then let Kiro execute the task list.
- Use Claude Code for design decisions, architecture, the mock data layer, logic bug fixes, tests, review of Kiro's output, and everything in Stage B onward.
- Always review Kiro's output against §7 and §8 — the last Kiro run produced an unusable UI. Don't let it overwrite `src/lib/game/*` without tests passing.
- After the credits are gone, delete `.kiro/` or archive it; this file remains the source of truth.

---

## 11. Changelog / session log

- **2026-10-16 (full-screen tools, suggestions)** — Tools animate on their own screen, bottle is random and players decide who, Freeze and Dance Off and dance cards removed, Double or Nothing added, suggest-a-card page with likes and weekly top contributor reward. Tests pass, lint clean.

- **2026-10-16 (heat order, tool-made cards)** — Cards now come easy to hard as the heat meter fills and fully random at max heat, heat is paced by game length, 17 penalty/rule cards where the dice, coin, wheel or bottle decide, rule cards that make their rule on the spot, Lucky Roll wild card, bottle on Call Out and Voice Note. 210 tests pass, lint clean, build OK.

- **2026-10-16 (wild cards, rules, penalties, shuffle)** — Removed hard-to-follow wild cards (Whisper Round, Crown, Heat Spike, Shuffle and the rest), new challenge wild cards with 2 or 3 shot penalties, Rule cards with an on-screen bar, a consequence line on every card, spread shuffle, card back in kind colour, `docs/CARD_GUIDE.md`. 205 tests pass, lint clean, build OK.

- **2026-10-16 (card kinds and play row)** — Owner: Undo covered the buttons, wanted a swipe hint, card colours were all one, and wanted truth, dare, dice, coin, bottle, wheel, timer cards that bring their own tool. Added card kinds and per-kind colours, `CardTools`, 54 tool cards, Skip = new card same turn, swipe either way, undo row. 197 tests pass, lint clean, build OK.

- **2026-10-16 (signboard redesign and motion)** — Owner: still looks AI, research proper design, add animation. Rebuilt the look as a jeepney signboard (Bungee `.sign` face, `.trim` stripes, radius by role, Archivo body 450) and added motion (`MotionProvider`, `RollNumber`, `Dealt`, spring deal and flip on `PlayCard`, directional topic transitions). Home rebuilt as a game board. 190 tests pass, lint clean, build OK.

- **2026-10-16 (Topic deck, Chaos)** — Chaos now includes Adult cards and needs the 18+ confirmation. Built the Topic deck as a separate game on the home menu (`/talk`, `/talk/play`, `talk-store`, `lib/game/talk.ts`, 48 starter topics in 8 groups, tests). Home buttons are now Drinking game and Topic deck. 190 tests pass, lint clean, build OK.

- **2026-10-16 (deck restructure, Phase 1)** — Replaced the Library and game modes with decks bought by quantity (`lib/game/decks.ts`, `buildBasketQueue`, per-deck cost via `deckId` on cards). New "Buy your cards" setup step with solo, split and each-buys, 18+ confirm for the Adult deck. Removed room codes and the join flow from the UI, redirected Library routes, moved Saved to Me, tabs are Play, Shop, Me. 184 tests pass, lint clean, build OK. Next: Topic deck (Phase 2), Social media content, Life and Deep content, seat sequence, Why? cards.

- **2026-10-15 (overnight run, F1 to F9)** — Autonomous run per `docs/OVERNIGHT_RUN.md`, files written straight into the owner's folder. F1 shell (4 tabs, 12 shared components). F2 settings store and page with every row applied, Me hub, trashed cards. F3 wallet ledger and coin pot (`lib/game/pot.ts`, pot step, per-card charge, low and empty states, top up, refund, wallet history; 20+ new tests). F4 shop (catalogue, buy and equip, avatar frames, card backs, accent themes, packs feed the Auto pool). F5 play depth (tools tray, wild-card flows, dare timers, 3 s resume, change mood, focus next cards, add and reorder players, report card; `lib/game/mid-game.ts` with tests). F6 library (deck store, editor with `[SLOT]`, saved list with search, filter and multi-select, card source step). Extras: Help and FAQ, draft legal pages, 18+ gate, Discover, leaderboard and invite samples, recap upgrades and share image, install and offline prompts, sounds (off by default), home tips. 161 tests pass, lint clean, build OK.

- **2026-10-15 (plan)** — Wrote `docs/FRONTEND_PLAN.md`: sitemap, every screen and control, settings list, shop catalogue, coin pot rules, data model, milestones F1 to F10, QA checklist, open questions.

- **2026-10-15 (polish)** — Player-facing wild card copy (`wildDescription`, non-drinking aware), `TargetPicker`, `ruleLine`, wake lock hook, not-found/error pages, PNG icons + apple-touch-icon, one toast at a time anchored above the action buttons, Resume game on home. Files are now written straight into the owner's folder (no more patches or commit instructions: owner's request).

- **2026-10-15 (redesign v2)** — Owner rejected the first look (emoji, gradients, glow). Researched and rebuilt every screen: Archivo type-first system, flat deck colours, SVG icons, colour+initial avatars, no emoji in code or data, removed the legacy `components/setup`. See §7 hard rules.

- **2026-10-15 (Stage A build)** — Fixed store/logic bugs (#6–#10, #14, #15), added comfort-filter map, heat steering, persisted game store with undo. Added design system, mock data layer (`rooms`, `profile-store`, `cards.ts`), and all screens (welcome, home, join, lobby with guests, 5-step setup, play, recap, profile, saved, decks). Removed login backend and the old Kiro-era UI components. Delivered as git patches `0001`–`0006`.

- **2026-10-15** — Full audit of repo and docs. Created this `CLAUDE.md` and `.kiro/steering/project.md`. Recorded decisions D1–D8, bug list (§2), roadmap (§6) and UI direction (§7). No application code changed.

---

## 12. Legacy documents (reference only)

| File | Still useful for | Outdated parts |
|---|---|---|
| `about_tagai.md` | Product vision, coin economy, wild/action card lists, business model, deck/community features, go-to-market | Mode pool percentages and some names (code is authoritative), AI/tech-stack details are aspirational |
| `build_plan.md` | Feature inventory for Phases 2–7, planned schema additions (decks, coin_transactions, wild_card_events, saved_cards), Realtime event list | Folder structure, Phase 1 checkboxes, time estimates |
| `design_plan.md` | Screen inventory (shop, deck builder, recap, pause menu), component ideas, animation timings | **Entire visual language** (colors/fonts/spacing) — replaced by §7 |
| `.kiro/specs/core-game-loop/*` | Detailed Phase 1 requirements & the 19 correctness properties (good test ideas) | Marked "done" but unverified; many items buggy (§2) |
| `README.md` | Nothing (default template) — to be replaced | All |
