# Implementation Plan: Core Game Loop

## Overview

This plan implements Phase 1 of Tag.ai — the full core game loop from authentication through lobby, pre-game setup, card-draw gameplay, and session end. The architecture is a Next.js 14 PWA with Supabase (auth, DB, Realtime) and Zustand for local gameplay state on the host device. Tasks are ordered to build foundational types and pure logic first, then layer on state management, UI components, and finally integration wiring.

## Tasks

- [x] 1. Set up project foundation, types, and database schema
  - [x] 1.1 Create TypeScript type definitions and enums
    - Create `/src/types/game.ts` with all shared types: `CardCategory`, `CardType`, `SessionStatus`, `GameMode`, `WildCardType`, `Card`, `SessionPlayer`, `Session`
    - Create `/src/types/supabase.ts` with Supabase-generated database types
    - _Requirements: 24.3, 24.4_

  - [x] 1.2 Set up Supabase database schema and RLS policies
    - Create SQL migration file with all tables: `users`, `cards`, `sessions`, `session_players`, `user_trashed_cards`, `saved_cards`
    - Create enum types: `card_category`, `card_type`, `session_status`, `game_mode_type`
    - Implement RLS policies for all tables as specified in design
    - _Requirements: 4.5, 17.5, 18.2_

  - [x] 1.3 Create Supabase client configuration
    - Set up Supabase client in `/src/lib/supabase/client.ts` (browser)
    - Set up Supabase server client in `/src/lib/supabase/server.ts` (server components)
    - Configure auth helpers for Next.js App Router
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement authentication and user onboarding
  - [x] 2.1 Implement email and Google OAuth sign-up/login
    - Create `/src/app/(auth)/login/page.tsx` with email login form and Google OAuth button
    - Create `/src/app/(auth)/signup/page.tsx` with email registration form and Google OAuth button
    - Create `/src/app/(auth)/auth/callback/route.ts` for OAuth callback handling
    - Handle auth errors with descriptive messages per spec
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Implement username and avatar setup screen
    - Create `/src/app/(auth)/setup/page.tsx` with username text input and 8 preset avatar grid
    - Implement real-time username availability check against Supabase
    - Enforce username validation (3-20 chars, alphanumeric + underscores)
    - Show green checkmark for available, red indicator for taken
    - On submit: save profile, credit 10 welcome coins, show celebratory animation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 25.3_

  - [ ]* 2.3 Write property test for username validation
    - **Property 1: Username Validation**
    - Test that validator accepts strings matching `/^[a-zA-Z0-9_]{3,20}$/` and rejects all others
    - **Validates: Requirements 2.3**

  - [x] 2.4 Implement user profile display
    - Create `/src/app/(main)/profile/page.tsx` showing username, avatar, and coin balance
    - Fetch latest coin balance from Supabase on navigation
    - Display coin balance with gold coin icon
    - _Requirements: 3.1, 3.2, 25.2_

- [x] 3. Implement pure game logic functions
  - [x] 3.1 Implement game mode configurations
    - Create `/src/lib/game/game-modes.ts` with `GAME_MODES` constant record
    - Define all 6 modes (Icebreaker, Barkada, Lovers, Spicy, Chaos, Family) with emoji, description, audienceTag, entryHeat, poolDistribution, wildCardFrequency, and maxHeat
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [x] 3.2 Implement escalation engine
    - Create `/src/lib/game/escalation-engine.ts` with `calculateHeat` pure function
    - Implement heat adjustments: dismiss (+0.3), heart (+0.5), skip (-0.2), 3 consecutive skips (-1.0), wild_card (+0.5)
    - Implement Family mode cap at 2.0
    - Clamp heat between 1.0 and 5.0
    - Implement `selectCardByHeat` with weighted random selection (60% current level, 30% adjacent, 10% distant)
    - _Requirements: 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9_

  - [ ]* 3.3 Write property tests for escalation engine
    - **Property 17: Escalation Engine Heat Adjustments** — verify correct delta per event type
    - **Property 18: Heat Always Clamped** — verify heat stays in [1.0, 5.0] for any event sequence
    - **Property 9 (heat portion): Family Mode Heat Cap** — verify heat never exceeds 2.0 in Family mode
    - **Validates: Requirements 22.2, 22.3, 22.4, 22.5, 22.6, 22.8, 22.9**

  - [x] 3.4 Implement card queue builder
    - Create `/src/lib/game/card-queue-builder.ts` with `buildCardQueue` pure function
    - Filter out cards matching comfort filter topics
    - Filter out user's trashed card IDs
    - Apply game mode intensity distribution for card selection
    - Insert wild cards at correct frequency (every 6±2 for standard, every 4±2 for Chaos)
    - Insert action cards at approximately 1 in every 8 cards
    - Build main queue of `cardCountTarget` cards plus `ceil(cardCountTarget * 0.2)` buffer cards
    - Shuffle final queue while respecting insertion frequencies
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [ ]* 3.5 Write property tests for card queue builder
    - **Property 4: Comfort Filter Exclusion** — no card in queue has a topic in active comfort filters
    - **Property 5: Trashed Card Exclusion** — no trashed card ID appears in queue or buffer
    - **Property 6: Wild Card Insertion Frequency** — gaps between wilds are 4-8 (standard) or 2-6 (Chaos)
    - **Property 7: Action Card Frequency** — action count is between floor(len/10) and ceil(len/6)
    - **Property 8: Queue Size Equals Target Plus Buffer** — main queue has cardCountTarget cards, buffer has ceil(target*0.2)
    - **Property 9 (intensity portion): Family Mode Intensity** — all cards in Family mode queue have intensity <= 2
    - **Validates: Requirements 9.5, 10.9, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7**

  - [x] 3.6 Implement turn rotation logic
    - Create `/src/lib/game/turn-rotation.ts` with `advanceTurn`, `getCurrentPlayer`, `getNextPlayer` functions
    - Cycling wraps from last player back to first
    - Maintain order by `turnOrder` field
    - _Requirements: 19.2, 19.4, 19.5_

  - [ ]* 3.7 Write property test for turn rotation
    - **Property 13: Turn Rotation Cycling** — advancing from index i moves to (i+1) % N, cycles through all players
    - **Validates: Requirements 19.2, 19.4, 19.5**

  - [x] 3.8 Implement wild card definitions and logic
    - Create `/src/lib/game/wild-cards.ts` with `WILD_CARD_DEFINITIONS` record for all 9 types
    - Implement `applyShuffleWildCard` — reshuffles next 5 cards in queue
    - Implement heat spike logic — increase heat by 1.0 for 3 cards then revert
    - Implement crown immunity — mark player immune for 2 card actions
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10, 20.11_

  - [ ]* 3.9 Write property tests for wild card effects
    - **Property 14: Shuffle Preserves Card Set** — shuffled 5 cards contain same IDs as before
    - **Property 15: Heat Spike Temporal Behavior** — heat increases for exactly 3 actions then reverts
    - **Property 16: Crown Immunity Duration** — immunity decrements by 1 per action, reaches 0 after 2 actions
    - **Validates: Requirements 20.6, 20.7, 20.11**

  - [x] 3.10 Implement validation utility functions
    - Create `/src/lib/validators.ts` with `validateUsername`, `generateRoomCode`, `validateCardCount`
    - Username: `/^[a-zA-Z0-9_]{3,20}$/`
    - Room code: 6-character uppercase alphanumeric generation
    - Card count: integer between 5 and 100 inclusive
    - _Requirements: 2.3, 4.1, 8.3_

  - [ ]* 3.11 Write property tests for validators
    - **Property 2: Room Code Format** — generated codes match `/^[A-Z0-9]{6}$/`
    - **Property 3: Card Count Range Validation** — accepts 5-100, rejects outside
    - **Validates: Requirements 4.1, 8.3**

- [x] 4. Checkpoint - Ensure all pure logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Zustand stores and state management
  - [x] 5.1 Implement session store
    - Create `/src/stores/session-store.ts` with session state: sessionId, roomCode, hostId, status, players, setup config, agreedPlayers
    - Implement actions: setSession, addPlayer, removePlayer, setPlayerAgreed
    - Include `canStartGame` derived check (all players agreed)
    - _Requirements: 4.1, 5.1, 6.1, 7.2, 12.2, 12.4_

  - [ ]* 5.2 Write property test for all-agreed-enables-start
    - **Property 10: All Players Agreed Enables Start** — Start button enabled iff all N players have agreedToRules = true
    - **Validates: Requirements 12.4**

  - [x] 5.3 Implement game store
    - Create `/src/stores/game-store.ts` with full gameplay state: cardQueue, bufferCards, currentCardIndex, cardsPlayed, cardCountTarget, heatLevel, consecutiveSkips, heatSpikeRemaining, preSpikeHeat, turnRotation, crownImmunityRemaining, currentCardState, showPassPrompt, sessionPhase
    - Implement actions: flipCard, dismissCard, trashCard, heartCard, advanceToNextCard, initializeQueue
    - Wire escalation engine into dismiss/heart/trash actions
    - Wire turn rotation advancement into dismiss/trash
    - Handle buffer card replacement on trash
    - _Requirements: 15.1, 16.1, 16.2, 16.3, 17.3, 18.2, 19.2, 22.2, 22.3, 22.4, 27.1_

  - [ ]* 5.4 Write property tests for game store actions
    - **Property 11: Dismiss Advances Game State** — dismiss increments currentCardIndex and cardsPlayed by 1, sets currentCardState to 'face_down'
    - **Property 12: Heart Save Idempotence** — saving an already-saved card is a no-op
    - **Validates: Requirements 16.2, 16.3, 18.4**

- [x] 6. Implement lobby and real-time features
  - [x] 6.1 Implement session creation and room code API
    - Create API route or server action for session creation
    - Generate unique 6-character Room_Code, ensure uniqueness across active sessions
    - Create session record in Supabase with status "lobby"
    - Generate QR code encoding the session join URL
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 6.2 Implement player join flow
    - Create `/src/app/game/[roomCode]/join/page.tsx` with room code input field
    - Validate room code, handle invalid/expired codes with error messages
    - Handle "already active" sessions with appropriate message
    - Add player to session_players table with next turn_order
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 6.3 Implement Supabase Realtime lobby hook
    - Create `/src/hooks/use-realtime-lobby.ts` subscribing to `session:{room_code}` channel
    - Handle events: player_joined, player_removed, setup_changed, rules_agreed, game_started, session_ended
    - Update session store on each event
    - _Requirements: 5.2, 6.1, 6.2, 6.3, 26.1, 26.2_

  - [x] 6.4 Implement lobby UI components
    - Create `/src/components/lobby/LobbyPlayerList.tsx` — live-updating player list with avatars and names
    - Create `/src/components/lobby/RoomCodeDisplay.tsx` — large monospace room code, QR code, share button (copy to clipboard)
    - Host sees remove/kick button next to each player (not self)
    - _Requirements: 4.3, 4.4, 6.1, 7.1, 7.2, 7.3_

- [x] 7. Implement pre-game setup flow
  - [x] 7.1 Implement card count selection UI
    - Create setup step with options: 10, 20, 30, 40, 50, and custom input (5-100)
    - Display estimated session duration based on selection
    - Store selection as session's card_count_target
    - Broadcast changes to player devices via Realtime
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 26.1_

  - [x] 7.2 Implement comfort filter configuration UI
    - Create `/src/components/setup/ComfortFilters.tsx` with 10 preset topic toggles
    - Implement custom filter text input with deletable chip display
    - Store active filters in session's comfort_filters array
    - Broadcast changes to player devices via Realtime
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 26.1_

  - [x] 7.3 Implement game mode selector UI
    - Create `/src/components/setup/GameModeSelector.tsx` with 6 mode cards in 2-column grid
    - Display emoji, name, one-line description, and recommended audience tag per mode
    - Store selection, broadcast via Realtime
    - _Requirements: 10.1, 10.2, 10.3, 26.1_

  - [x] 7.4 Implement drink rules configuration UI
    - Create drink rules setup step with 4 template options (Classic, Chaos, Soft_Mode, Points_Based)
    - Display selected template's rule summary
    - Allow up to 5 custom free-text drink rules
    - Implement "Non-drinking mode" toggle that replaces drink language with dare/challenge alternatives
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 7.5 Implement house rules confirmation
    - Create `/src/components/setup/HouseRules.tsx` showing rules to all players via Realtime
    - Each player taps "I Agree" — tracked per player
    - Show waiting indicator for players who haven't confirmed
    - Enable Host's "Start Game" button when all agree
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 7.6 Implement pre-game summary and launch
    - Create summary screen displaying: player list, card count, game mode, comfort filters, drink rule template, custom rules, coin pot stub ("Free Mode")
    - "Start Game" button updates session status to "active", broadcasts game-start event, transitions to Game_Screen
    - Player devices show "Game has started — pass the phone!" message
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 25.4_

- [x] 8. Checkpoint - Ensure lobby and setup flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement card gameplay UI components
  - [x] 9.1 Implement card display components
    - Create `/src/components/game/CardBack.tsx` — face-down card with surface color, subtle pattern, 20px corner radius; purple variant for wild cards
    - Create `/src/components/game/CardFace.tsx` — revealed card showing text (20-26px), category tag pill (top-left), intensity dots 1-5 (top-right)
    - Create `/src/components/game/CardStack.tsx` — current card + 2 behind at 96%/92% scale, offset 6px/12px down
    - _Requirements: 15.1, 15.3, 15.4_

  - [x] 9.2 Implement card flip animation and interaction
    - Implement 3D flip animation (rotateY, 300ms, spring physics) on tap
    - Show "Tap to flip" hint text below card for first 3 cards of session
    - Wire tap handler to game store's `flipCard` action
    - _Requirements: 15.2, 15.5_

  - [x] 9.3 Implement card swipe dismissal
    - Create `/src/components/game/SwipeHandler.tsx` with Framer Motion drag/swipe gesture
    - Trigger dismiss at 100px threshold with fly-off animation (translateX ±150%, rotate ±15°, 250ms spring)
    - On dismiss: advance card queue, increment cards_played, show counter "Card N of [target]"
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 9.4 Implement card trash interaction
    - Create `/src/components/game/TrashZone.tsx` — appears on hold+drag, scales 1.2× and pulses red on hover
    - On drop: animate card disappearing (scale to 0, opacity to 0, slight rotation)
    - Create trashed_card record in Supabase via fire-and-forget API call
    - Show toast: "Card removed. You won't see this again."
    - Replace trashed card from buffer
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 9.5 Implement heart/save interaction
    - Create `/src/components/game/HeartButton.tsx` — heart button visible on revealed card
    - On tap: create saved_card record in Supabase, play heart animation, show toast "Added to your saved cards"
    - Already-saved cards show filled heart; tapping again is a no-op
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 9.6 Implement turn rotation and pass prompt UI
    - Create `/src/components/game/TurnIndicator.tsx` — current player's username and avatar in bottom bar
    - Create `/src/components/game/PassPrompt.tsx` — "Pass to [next_player_name]" screen shown for 3 seconds between turns
    - Wire turn advancement to dismiss/trash actions
    - _Requirements: 19.1, 19.2, 19.3_

  - [x] 9.7 Implement heat meter UI
    - Create `/src/components/game/HeatMeter.tsx` — 4px full-width bar at top with color gradient
    - Color mapping: Level 1 blue, Level 2 green, Level 3 gold, Level 4 orange, Level 5 red
    - Bind to game store's heatLevel state
    - _Requirements: 22.1_

  - [x] 9.8 Implement wild card overlay and effects
    - Create `/src/components/game/WildCardOverlay.tsx` — full-screen reveal with purple glow animation
    - Distinct purple card back design for wild cards in queue
    - Display type-specific instructions for all 9 wild card types
    - Wire shuffle effect to reshuffle next 5 cards in queue
    - Wire heat spike to escalation engine (increase by 1.0 for 3 cards, then revert)
    - Wire crown to set immunity for 2 cards
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10, 20.11_

  - [x] 9.9 Implement action card display
    - Style action cards with warm dark teal gradient, action emoji, energetic text (20-24px)
    - Dismissal behavior identical to question cards (swipe to advance, increment counter)
    - _Requirements: 21.1, 21.2, 21.3_

- [x] 10. Implement session end and results
  - [x] 10.1 Implement end screen and session wrap-up
    - Create `/src/components/game/EndScreen.tsx` showing total cards played, final heat level, "Play Again" option
    - Trigger transition when cards_played reaches card_count_target
    - Update session status to "ended", sync final data (cards_played, heat_level, ended_at) to Supabase
    - Broadcast session_ended event to player devices via Realtime
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

- [x] 11. Implement game actions hook and offline sync
  - [x] 11.1 Implement fire-and-forget sync and offline handling
    - Create `/src/hooks/use-game-actions.ts` providing flipCard, dismissCard, trashCard, heartCard handlers
    - Implement fire-and-forget API calls for heart/trash with local retry queue
    - On network loss: continue gameplay from Zustand, show offline indicator (grey dot), queue syncs
    - On reconnect: flush pending sync queue in order
    - On session end failure: persist to localStorage, retry on next app open
    - _Requirements: 27.2, 27.3, 27.4_

- [x] 12. Checkpoint - Ensure gameplay loop works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement curated card library and home screen
  - [x] 13.1 Seed curated card library
    - Create seed script/migration with 100+ cards across all 9 categories
    - Cards span all 5 intensity levels with representation per game mode audience
    - Store category as enum, deck_id = null, is_curated = true
    - Include at least 9 action cards (minimum 1 per category)
    - Content appropriate to Filipino social context and culture
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6_

  - [x] 13.2 Implement home screen with coin wallet display
    - Create `/src/app/(main)/page.tsx` with Host/Join CTAs and coin balance display
    - Show coin balance with gold coin icon and monospace-formatted number
    - _Requirements: 25.1_

- [x] 14. Implement main game page orchestration
  - [x] 14.1 Wire game page with phase management
    - Create `/src/app/game/[roomCode]/page.tsx` managing four phases: lobby → setup → play → end
    - Phase transitions driven by session status and game store state
    - Initialize card queue on game start using card library fetched from Supabase
    - Connect all sub-components (lobby, setup, gameplay, end) to their respective phases
    - _Requirements: 13.3, 14.1, 27.1_

  - [ ]* 14.2 Write property test for card selection weighting
    - **Property 19: Card Selection Weighted by Heat Level** — over 100+ selections, cards at current heat level appear ~60% (±15%), adjacent ~30%, distant ~10%
    - **Validates: Requirements 22.7**

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design specifies TypeScript with Next.js 14, Supabase, Zustand, and Framer Motion
- All gameplay state runs locally on the host device via Zustand — no network calls during card draws
- Fire-and-forget syncing ensures heart/trash actions don't block gameplay

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2", "3.6", "3.8", "3.10"] },
    { "id": 2, "tasks": ["2.2", "3.3", "3.4", "3.7", "3.9", "3.11"] },
    { "id": 3, "tasks": ["2.3", "2.4", "3.5"] },
    { "id": 4, "tasks": ["5.1", "5.3"] },
    { "id": 5, "tasks": ["5.2", "5.4", "6.1", "6.2"] },
    { "id": 6, "tasks": ["6.3", "6.4"] },
    { "id": 7, "tasks": ["7.1", "7.2", "7.3", "7.4"] },
    { "id": 8, "tasks": ["7.5", "7.6"] },
    { "id": 9, "tasks": ["9.1", "9.7"] },
    { "id": 10, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6", "9.8", "9.9"] },
    { "id": 11, "tasks": ["10.1", "11.1"] },
    { "id": 12, "tasks": ["13.1", "13.2"] },
    { "id": 13, "tasks": ["14.1", "14.2"] }
  ]
}
```
