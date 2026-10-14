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
- **9 wild cards:** Role Reversal, Pick Your Target, Everyone Answers, Shuffle, Heat Spike, Act It Out, Whisper Round, Free Drink, Crown.
- **Drink rules:** 4 templates (Classic, Chaos, Soft Mode, Points-Based) + up to 5 custom rules + a non-drinking mode. All players tap "I Agree".
- **Comfort filters:** 10 presets + custom text topics the group wants off the table.
- **Coins (planned, not implemented):** 1 peso = 1 coin; cards cost coins from a shared pot; new users get 10 welcome coins; PayMongo for purchases. In Phase 1 the pot is a "Free Mode" stub.
- **Business model:** no ads, no subscriptions. Coin packs (₱20/₱49/₱99/₱199), premium themed packs, host upgrade, B2B branded bar sessions. Details in `about_tagai.md` §6, §17 (still valid as product intent).

Design principles that still hold: face-down ritual; generous coins; every session has an arc; heat is a guide not a wall; comfort filters are sacred; friction is the enemy (sign-up < 60s, join < 30s); works without AI.

---

## 2. Current status — honest recap (as of 2026-10-15)

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

Do not assume any of the above are fixed unless §11 (Changelog) says so.

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
  middleware.ts                  Supabase session refresh only (no route guard)
  app/
    layout.tsx, globals.css      Root layout (metadata still default), Tailwind base
    (auth)/login|signup|setup    Email+Google auth; /setup = username + 8 emoji avatars
    (auth)/auth/callback/route   OAuth code exchange; redirects to /setup if no username
    (main)/page.tsx              Home: coin balance, Host / Join buttons
    (main)/profile/page.tsx      Username, avatar, coins
    api/sessions/route.ts        POST: create session + host row, returns roomCode/joinUrl/QR
    game/[roomCode]/page.tsx     The orchestrator: lobby → setup → play → end
    game/[roomCode]/join/page    Enter code & join
  components/
    game/    CardBack, CardFace, CardFlip, CardStack, SwipeHandler, TrashZone, HeartButton,
             HeatMeter, TurnIndicator, PassPrompt, WildCardOverlay, ActionCard, EndScreen
    lobby/   RoomCodeDisplay, LobbyPlayerList
    setup/   CardCountSelector, ComfortFilters, GameModeSelector, DrinkRules, HouseRules, PreGameSummary
  hooks/     use-realtime-lobby (broadcast subscriptions), use-game-actions (offline sync queue — unused)
  lib/
    game/    game-modes, escalation-engine, card-queue-builder, turn-rotation, wild-cards
    supabase/client.ts, server.ts   Browser / server clients
    validators.ts                   validateUsername, generateRoomCode, validateCardCount
  stores/    game-store (gameplay state on host device), session-store (lobby/setup state)
  types/     game.ts, supabase.ts (hand-written DB types), index.ts
supabase/migrations/001_initial_schema.sql   users, cards, sessions, session_players,
                                             user_trashed_cards, saved_cards + RLS
supabase/seed/cards.sql                      131 curated cards
.kiro/specs/core-game-loop/                  Legacy Kiro spec (requirements/design/tasks)
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

**Stage A — Frontend rebuild with mock data (CURRENT)**
- A0. Design system: tokens, fonts, primitives (Button, Sheet, Toast, Avatar, Chip, Card), motion presets, icon set. Pick the visual direction (§7) and record it.
- A1. App shell + routing + mock data layer (`src/lib/data/` repository interface with an in-memory/mock implementation and a `localStorage` "fake multiplayer"; swappable for Supabase later).
- A2. Screens: splash/onboarding, sign-up/login, profile setup, home, join (enter code/scan QR), lobby, setup wizard (6 steps), house rules, game screen (card stack, flip, swipe, trash, heart, heat, pass prompt, wild overlay, action cards), pause menu, end/recap, profile, saved cards, shop (UI only), decks/discover (UI only).
- A3. Polish: motion, haptics (`navigator.vibrate`), sound hooks, accessibility, PWA manifest/icons, empty states, loading/error states, responsive 360–430px.
- A4. Component tests for critical flows (Vitest + Testing Library) and fix the pure-logic bugs (#7, #8, #9, #14, #15).

**Stage B — Backend wiring (after A)**
- New Supabase project; fix migration/RLS (#3, #4, #13), `join_session` RPC, profile trigger, realtime hydration (#1, #2), route protection, replace mock repository with Supabase implementation, offline sync queue wiring (#10, #11).
- Verify with 2+ real devices.

**Stage C — Original Phases 2–7:** coin pot & PayMongo, mid-game controls & escalation, deck builder, community/leaderboard/recap image, PWA polish/B2B/security/perf. Priority order TBD by owner.

**Stage D — Deferred:** AI features (cost + moderation unresolved; see `about_tagai.md` §16).

---

## 7. UI/UX direction (replaces `design_plan.md`)

Owner brief (2026-10-15): **modern, aesthetic, super easy to navigate for drunk people.** The old look was rejected as ugly.

**Drunk-proof UX rules (non-negotiable):**
1. One primary action per screen; giant, obvious. Thumb-reachable, bottom-anchored. Tap targets ≥ 56px, spacing ≥ 12px.
2. No small text in-game: card text ≥ 24px, UI labels ≥ 16px. High contrast (WCAG AA minimum, aim AAA for card text).
3. No precision gestures required: every swipe/drag has a big button alternative (Next, Skip, Trash, Save).
4. Forgiving: undo toast for trash/skip/remove-player (5s), confirm only for truly destructive actions, never auto-advance without a clear signal.
5. Minimal reading: icons + one short line; plain Taglish-friendly copy; no jargon ("heat" shown as 🔥 bars with a word).
6. Always show *whose turn it is* and *what to do next* in plain words ("Pass the phone to Ana").
7. Dark by default for dim bars, glare-safe; no pure white backgrounds; no flashing/strobing.
8. Fast: no spinners longer than 1s without feedback, optimistic UI, skeletons.
9. Persist everything locally so an accidental refresh/closed tab never loses a game.
10. Respect `prefers-reduced-motion`; haptic feedback on key actions.

**Visual direction (proposal, owner to approve/change in the next session — record the final choice here):** dark "nightlife" theme with a vivid gradient accent (hot pink → orange for heat, violet for wild cards), glassy elevated surfaces, big rounded cards (28px radius), bold display font for headings and card text (e.g. *Bricolage Grotesque* or *Space Grotesk*; *Inter* for UI), subtle grain/noise and glow, each game mode has its own accent palette. Cards feel like physical objects (3D flip, spring swipes, shadows). Navigation = a single bottom bar on home (Play / Decks / Shop / Me) and zero nav chrome during the game.

Status: **not started.** Use the `frontend-design` skill and generate 2–3 style options for the owner to pick from before building A0.

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
