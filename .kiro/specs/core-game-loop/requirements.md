# Requirements Document

## Introduction

This document defines the requirements for Phase 1 of Tag.ai — a social drinking game webapp where one phone is passed around a table. Phase 1 establishes the core game loop: user authentication, real-time lobby creation, pre-game configuration, and the card-draw gameplay experience on a single shared device. The coin economy is displayed but non-functional (free mode). The goal is a fully playable end-to-end session from room creation to game completion.

## Glossary

- **Host**: The authenticated user who creates a game session, configures settings, and controls the passed device during gameplay
- **Player**: Any authenticated user who joins a session via room code or QR code
- **Session**: A single game instance from lobby creation through card draws to the end screen
- **Room_Code**: A unique 6-character alphanumeric identifier for a session lobby
- **Card**: A content unit displayed during gameplay containing a question, action prompt, or wild card event
- **Card_Queue**: An ordered list of cards to be drawn during a session, built from filters and shuffle logic
- **Wild_Card**: A special card type that triggers a group event, inserted randomly into the Card_Queue at no cost
- **Action_Card**: A card type requiring physical activity or group challenge, drawn from the regular pool
- **Heat_Meter**: A visual indicator (levels 1–5) representing session intensity, influencing card draw probability
- **Escalation_Engine**: The logic system that adjusts Heat_Meter based on player interactions and biases card selection
- **Comfort_Filter**: A topic exclusion tag applied during setup to remove matching cards from the draw pool
- **Game_Mode**: One of six preset configurations (Icebreaker, Barkada, Lovers, Spicy, Chaos, Family) that determines starting card pool composition and entry heat level
- **Turn_Rotation**: The ordered sequence of Players whose turn it is to hold the device and draw cards
- **Lobby**: The real-time waiting room where Players gather before gameplay begins
- **Supabase_Realtime**: The WebSocket-based service used for live lobby synchronization across devices
- **Zustand_Store**: The client-side state manager running locally on the Host device during gameplay
- **Trashed_Card**: A card permanently removed from a specific user's future draw pools
- **Saved_Card**: A card added to a user's personal library via the heart action
- **Coin_Wallet**: A user's coin balance display (non-functional in Phase 1, shows welcome bonus only)
- **House_Rules**: The drink assignment configuration all Players must agree to before gameplay starts
- **Drink_Rule_Template**: One of four preset drink rule configurations (Classic, Chaos, Soft_Mode, Points_Based)

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to sign up with my email or Google account, so that I can create a persistent identity for hosting and joining games.

#### Acceptance Criteria

1. WHEN a user selects email sign-up, THE Auth_System SHALL create a new account using Supabase email authentication and redirect the user to the Username_Setup screen
2. WHEN a user selects Google OAuth sign-up, THE Auth_System SHALL authenticate via Google, create a new account in Supabase, and redirect the user to the Username_Setup screen
3. IF authentication fails due to invalid credentials or network error, THEN THE Auth_System SHALL display a descriptive error message and remain on the login screen
4. WHEN a user with an existing account selects login, THE Auth_System SHALL authenticate the user and redirect to the Home screen

### Requirement 2: Username and Avatar Selection

**User Story:** As a new user, I want to choose a unique username and avatar during onboarding, so that other players can identify me in lobbies and during gameplay.

#### Acceptance Criteria

1. WHEN a new user reaches the Username_Setup screen, THE System SHALL display a text input for username and a grid of 8 preset avatar options
2. WHEN a user types a username, THE System SHALL perform a real-time availability check against existing usernames and display a green checkmark for available or a red indicator for taken
3. THE System SHALL enforce usernames to be between 3 and 20 characters, containing only alphanumeric characters and underscores
4. WHEN a user confirms a valid, available username and selected avatar, THE System SHALL save the profile and credit 10 welcome coins to the user's Coin_Wallet
5. IF a user submits a username that is already taken, THEN THE System SHALL display an error indicating the username is unavailable and prevent submission

### Requirement 3: User Profile Display

**User Story:** As a returning user, I want to view my profile with my username, avatar, and coin balance, so that I can confirm my identity and see my welcome coins.

#### Acceptance Criteria

1. THE Profile_Screen SHALL display the authenticated user's username, selected avatar, and current Coin_Wallet balance
2. WHEN a user navigates to the Profile_Screen, THE System SHALL fetch the latest coin balance from Supabase and display it with the gold coin icon

### Requirement 4: Session Creation and Room Code Generation

**User Story:** As a Host, I want to create a game session that generates a room code and QR code, so that other players can join my lobby from their own devices.

#### Acceptance Criteria

1. WHEN the Host taps "Host a Game," THE System SHALL create a new session record in Supabase with status "lobby" and generate a unique 6-character alphanumeric Room_Code
2. THE System SHALL generate a QR code encoding the session join URL containing the Room_Code
3. THE System SHALL display the Room_Code in large monospace text and the QR code below it on the Lobby screen
4. THE System SHALL provide a "Share link" button that copies the join URL to the device clipboard
5. THE Room_Code SHALL remain unique across all active sessions (status "lobby" or "active")

### Requirement 5: Player Joins Lobby

**User Story:** As a Player, I want to join a game lobby by entering a room code or scanning a QR code, so that I can participate in the session.

#### Acceptance Criteria

1. WHEN a Player enters a valid Room_Code or scans a valid QR code, THE System SHALL add the Player to the session's player list and display the Lobby screen
2. WHEN a Player joins, THE System SHALL broadcast a Supabase_Realtime event so all connected clients see the new Player's avatar and username appear in the Lobby
3. IF a Player enters an invalid or expired Room_Code, THEN THE System SHALL display an error message indicating the room was not found
4. IF a Player attempts to join a session that has already started (status "active"), THEN THE System SHALL display a message indicating the game is already in progress

### Requirement 6: Real-Time Lobby Display

**User Story:** As a Player or Host in the lobby, I want to see all joined players update in real time, so that I know who is ready to play.

#### Acceptance Criteria

1. WHILE the session status is "lobby," THE Lobby_Screen SHALL display all joined Players' avatars and usernames in a live-updating list via Supabase_Realtime
2. WHEN a Player leaves or is removed from the Lobby, THE Lobby_Screen SHALL remove that Player's entry from the list within 2 seconds for all connected clients
3. WHEN a Player joins the Lobby, THE Lobby_Screen SHALL add that Player's entry to the list within 2 seconds for all connected clients

### Requirement 7: Host Kicks Player from Lobby

**User Story:** As a Host, I want to remove a player from the lobby before the game starts, so that I can control who participates.

#### Acceptance Criteria

1. WHILE the session status is "lobby," THE Lobby_Screen SHALL display a remove option next to each Player (excluding the Host)
2. WHEN the Host taps remove on a Player, THE System SHALL remove that Player from the session and broadcast a Supabase_Realtime event to update all clients
3. WHEN a Player is removed, THE System SHALL redirect that Player's device to the Home screen with a notification that they were removed from the session

### Requirement 8: Card Count Selection

**User Story:** As a Host, I want to choose how many cards to play in the session, so that I can control the game length.

#### Acceptance Criteria

1. WHEN the Host reaches the Card_Count setup step, THE System SHALL display options for 10, 20, 30, 40, 50, and a custom numeric input
2. WHEN the Host selects a card count, THE System SHALL display an estimated session duration based on the selection
3. THE System SHALL enforce the custom card count input to accept values between 5 and 100
4. THE System SHALL store the selected card count as the session's card_count_target

### Requirement 9: Comfort Filter Configuration

**User Story:** As a Host, I want to select topics to exclude from the card pool, so that the group avoids uncomfortable subjects.

#### Acceptance Criteria

1. WHEN the Host reaches the Comfort_Filter setup step, THE System SHALL display 10 preset topic toggles (Politics, Religion, Trauma/Mental Health, Money/Finances, Family Drama, Sexual Content, Past Relationships, Physical Appearance, Career/Work Stress, Death/Loss)
2. WHEN the Host toggles a topic on, THE System SHALL add that topic to the session's comfort_filters array
3. THE System SHALL provide a text input allowing the Host to add custom filter topics as free-text entries
4. WHEN a custom filter is added, THE System SHALL display it as a deletable chip and include it in the comfort_filters array
5. THE System SHALL exclude all cards tagged with any active Comfort_Filter topic from the Card_Queue during queue building

### Requirement 10: Game Mode Selection

**User Story:** As a Host, I want to choose a game mode, so that the card pool and starting intensity match the group's vibe.

#### Acceptance Criteria

1. WHEN the Host reaches the Game_Mode setup step, THE System SHALL display 6 mode options: Icebreaker, Barkada, Lovers, Spicy, Chaos, and Family
2. WHEN the Host selects a Game_Mode, THE System SHALL store the selection and use it to configure the starting card pool composition and entry Heat_Meter level
3. THE System SHALL display each mode with its emoji, name, one-line description, and recommended audience tag
4. WHEN Icebreaker is selected, THE Escalation_Engine SHALL set entry heat to Level 1 and bias the card pool to 80% Level 1–2 and 20% Level 3 cards
5. WHEN Barkada is selected, THE Escalation_Engine SHALL set entry heat to Level 2 and bias the card pool to 30% Level 1–2, 50% Level 3–4, and 20% Level 5 cards
6. WHEN Lovers is selected, THE Escalation_Engine SHALL set entry heat to Level 2 and bias the card pool to 20% Level 1–2, 40% Level 3, and 40% Level 4–5 cards
7. WHEN Spicy is selected, THE Escalation_Engine SHALL set entry heat to Level 3 and bias the card pool to 10% Level 1–2, 30% Level 3, and 60% Level 4–5 cards
8. WHEN Chaos is selected, THE Escalation_Engine SHALL set entry heat to Level 2, use fully randomized card selection across all intensities, and increase Wild_Card frequency to every 4th card (±2)
9. WHEN Family is selected, THE Escalation_Engine SHALL set entry heat to Level 1, restrict the card pool to Level 1–2 cards only, and cap escalation at Level 2

### Requirement 11: Drink Assignment Rules Configuration

**User Story:** As a Host, I want to set drink rules from a template or custom text, so that the group has clear drinking guidelines during the game.

#### Acceptance Criteria

1. WHEN the Host reaches the Drink_Rules setup step, THE System SHALL display 4 Drink_Rule_Template options: Classic, Chaos, Soft_Mode, and Points_Based
2. WHEN the Host selects a template, THE System SHALL display the template's rule summary and store the selection
3. THE System SHALL provide a text input allowing the Host to add up to 5 custom drink rules as free text
4. THE System SHALL provide a "Non-drinking mode" toggle that replaces all drink-related language with dare/challenge alternatives throughout the session
5. WHEN non-drinking mode is active, THE System SHALL remove all alcohol references and drink icons from the game UI

### Requirement 12: House Rules Confirmation

**User Story:** As a Player, I want to review and agree to the house rules before the game starts, so that everyone is on the same page about drink assignments.

#### Acceptance Criteria

1. WHEN all setup steps are complete, THE System SHALL display a House_Rules confirmation screen showing the selected template rules and any custom rules to all Players via Supabase_Realtime
2. THE House_Rules screen SHALL require each Player to tap "I Agree" before the game can start
3. WHILE any Player has not agreed, THE System SHALL display a waiting indicator showing which Players have not yet confirmed
4. WHEN all Players have agreed, THE System SHALL enable the Host's "Start Game" button

### Requirement 13: Pre-Game Summary and Launch

**User Story:** As a Host, I want to review all session settings on a summary screen before launching, so that I can confirm everything is correct.

#### Acceptance Criteria

1. WHEN the Host reaches the Summary screen, THE System SHALL display: player list, card count target, selected Game_Mode, active Comfort_Filters, selected Drink_Rule_Template, custom rules, and stubbed pot amount
2. THE Summary_Screen SHALL display the coin pot section as a non-functional stub showing "Free Mode" or a placeholder value
3. WHEN the Host taps "Start Game," THE System SHALL update the session status to "active," broadcast a game-start event via Supabase_Realtime, and transition the Host device to the Game_Screen
4. WHEN a game-start event is received, THE Player devices SHALL display a "Game has started — pass the phone!" message

### Requirement 14: Card Queue Construction

**User Story:** As the system, I want to build an ordered card queue based on game mode, comfort filters, and user trash history, so that gameplay presents relevant, non-repeated content.

#### Acceptance Criteria

1. WHEN the session starts, THE Card_Queue_Builder SHALL select cards from the curated library matching the selected Game_Mode's category and intensity distribution
2. THE Card_Queue_Builder SHALL exclude all cards tagged with any topic present in the session's comfort_filters array
3. THE Card_Queue_Builder SHALL exclude all cards present in the current turn Player's Trashed_Card list
4. THE Card_Queue_Builder SHALL insert Wild_Cards at random intervals averaging every 6th card (±2 variance) for standard modes
5. WHEN Game_Mode is Chaos, THE Card_Queue_Builder SHALL insert Wild_Cards at random intervals averaging every 4th card (±2 variance)
6. THE Card_Queue_Builder SHALL insert Action_Cards at approximately 1 in every 8 cards in the draw pool
7. THE Card_Queue_Builder SHALL build a queue of at least card_count_target cards plus a 20% buffer to account for potential trashes during gameplay
8. THE Card_Queue_Builder SHALL shuffle the final queue to prevent predictable ordering while respecting wild card and action card insertion frequency

### Requirement 15: Card Display and Flip Interaction

**User Story:** As the current turn Player, I want to see a face-down card and tap to reveal it, so that I experience the anticipation of discovery.

#### Acceptance Criteria

1. THE Game_Screen SHALL display the current card face-down with the card back design (surface color, subtle pattern, 20px corner radius)
2. WHEN the current turn Player taps the face-down card, THE System SHALL play a 3D flip animation (rotateY, 300ms, spring physics) revealing the card content
3. THE revealed card SHALL display: the card text (20–26px), category tag (top-left pill), and intensity indicator (1–5 dots, top-right)
4. THE Game_Screen SHALL show a card stack effect with the next 2 cards visible behind the current card (scaled at 96% and 92%, offset 6px and 12px down)
5. WHILE the card is face-down, THE Game_Screen SHALL display "Tap to flip" hint text below the card for the first 3 cards of the session

### Requirement 16: Card Swipe Dismissal

**User Story:** As the current turn Player, I want to swipe a card left or right to dismiss it, so that gameplay advances to the next card.

#### Acceptance Criteria

1. WHEN the Player swipes the revealed card left or right past a 100px threshold, THE System SHALL dismiss the card with a fly-off animation (translateX ±150%, rotate ±15°, 250ms spring)
2. WHEN a card is dismissed, THE System SHALL advance the Card_Queue and display the next card face-down
3. WHEN a card is dismissed, THE System SHALL increment the session's cards_played counter
4. THE Game_Screen SHALL display the updated cards played counter in the format "Card N of [card_count_target]"

### Requirement 17: Card Trash Interaction

**User Story:** As the current turn Player, I want to hold and drag a card to a trash icon to permanently remove it from my future games, so that I never see cards I dislike again.

#### Acceptance Criteria

1. WHEN the Player holds and drags a revealed card, THE System SHALL display a trash icon target area
2. WHEN the card is dragged over the trash icon, THE trash icon SHALL scale up to 1.2× and pulse red to indicate the drop zone is active
3. WHEN the Player releases the card over the trash icon, THE System SHALL animate the card disappearing (scale to 0, opacity to 0, slight rotation) and create a Trashed_Card record for that user and card in Supabase
4. WHEN a card is trashed, THE System SHALL display a toast notification: "Card removed. You won't see this again."
5. THE Trashed_Card record SHALL persist across sessions, permanently excluding that card from the user's future Card_Queues

### Requirement 18: Card Save (Heart) Interaction

**User Story:** As the current turn Player, I want to tap a heart button to save a card to my library, so that I can revisit favorite cards later.

#### Acceptance Criteria

1. THE Game_Screen SHALL display a heart button (❤️) accessible while a card is revealed
2. WHEN the Player taps the heart button, THE System SHALL create a Saved_Card record for that user and card in Supabase
3. WHEN a card is saved, THE System SHALL play a heart animation and display a toast notification: "Added to your saved cards"
4. IF a card has already been saved by the current Player, THEN THE heart button SHALL appear filled and tapping it SHALL have no additional effect

### Requirement 19: Turn Rotation and Pass Prompt

**User Story:** As a Player, I want to see whose turn it is and when to pass the phone, so that the game flows smoothly around the table.

#### Acceptance Criteria

1. THE Game_Screen SHALL display the current turn Player's username and avatar in the bottom bar
2. WHEN a card is dismissed or trashed, THE System SHALL advance the Turn_Rotation to the next Player in sequence
3. WHEN the turn advances, THE System SHALL display a "Pass to [next_player_name]" prompt screen for 3 seconds before showing the next face-down card
4. THE Turn_Rotation SHALL cycle through all active Players in the order established during lobby (by turn_order field)
5. WHEN the Turn_Rotation reaches the end of the player list, THE System SHALL loop back to the first Player

### Requirement 20: Wild Card System

**User Story:** As a Player, I want to encounter surprise wild cards during the game, so that the session has spontaneous, unpredictable moments.

#### Acceptance Criteria

1. WHEN a Wild_Card position is reached in the Card_Queue, THE System SHALL display the Wild_Card with a distinct purple card back design and purple glow animation on reveal
2. THE System SHALL implement all 9 Wild_Card types: Role_Reversal, Pick_Your_Target, Everyone_Answers, Shuffle, Heat_Spike, Act_It_Out, Whisper_Round, Free_Drink, and Crown
3. WHEN Role_Reversal is drawn, THE System SHALL display instructions that the drawer asks the question to a player of their choice
4. WHEN Pick_Your_Target is drawn, THE System SHALL display instructions for the drawer to direct the card at one specific player
5. WHEN Everyone_Answers is drawn, THE System SHALL display instructions that all Players answer the same question in turn order
6. WHEN Shuffle is drawn, THE System SHALL reshuffle the next 5 cards in the Card_Queue and display a shuffle confirmation
7. WHEN Heat_Spike is drawn, THE Escalation_Engine SHALL increase the Heat_Meter by 1 level for the next 3 cards, then revert to the previous level
8. WHEN Act_It_Out is drawn, THE System SHALL display instructions that the next card must be answered through charades
9. WHEN Whisper_Round is drawn, THE System SHALL display instructions that the current Player whispers their answer to the person on their left only
10. WHEN Free_Drink is drawn, THE System SHALL display a "Everyone drinks" prompt with no associated question
11. WHEN Crown is drawn, THE System SHALL mark the current Player as immune to drink assignments for the next 2 cards and display a crown indicator

### Requirement 21: Action Card Display

**User Story:** As a Player, I want to encounter action cards that require physical activities or group challenges, so that gameplay has variety beyond questions.

#### Acceptance Criteria

1. WHEN an Action_Card is drawn, THE System SHALL display it with a visually distinct style (warm dark teal gradient background, action emoji, energetic text formatting)
2. THE Action_Card text SHALL be displayed at 20–24px and clearly instruct the group on the required physical activity or challenge
3. THE System SHALL treat Action_Card dismissal identically to question card dismissal (swipe to advance, increment cards_played counter)

### Requirement 22: Heat Meter and Escalation Engine

**User Story:** As a Player, I want the game intensity to build naturally over time, so that the session has a satisfying emotional arc.

#### Acceptance Criteria

1. THE Game_Screen SHALL display the Heat_Meter as a 4px-high full-width bar at the top, filled with a color gradient corresponding to the current heat level (Level 1: blue, Level 2: green, Level 3: gold, Level 4: orange, Level 5: red)
2. WHEN a card is dismissed without skipping, THE Escalation_Engine SHALL increase the heat value by 0.3
3. WHEN a card is hearted, THE Escalation_Engine SHALL increase the heat value by 0.5
4. WHEN a card is skipped, THE Escalation_Engine SHALL decrease the heat value by 0.2
5. WHEN 3 consecutive cards are skipped, THE Escalation_Engine SHALL decrease the heat value by 1.0 (full level)
6. WHEN a Wild_Card is played, THE Escalation_Engine SHALL increase the heat value by 0.5
7. THE Escalation_Engine SHALL bias card selection probability toward the current heat level's intensity range without hard-locking (cards from other levels still appear at reduced probability)
8. WHILE Game_Mode is Family, THE Escalation_Engine SHALL cap the Heat_Meter at Level 2 regardless of player interactions
9. THE Heat_Meter value SHALL remain within the range of 1.0 to 5.0, clamping at the boundaries

### Requirement 23: Session End and Results

**User Story:** As a Player, I want to see a summary when the game ends, so that I know the session is complete and can review highlights.

#### Acceptance Criteria

1. WHEN the cards_played counter reaches the card_count_target, THE System SHALL transition to the End_Screen
2. THE End_Screen SHALL display: total cards played, final Heat_Meter level reached, and a "Play Again" option
3. WHEN the session ends, THE System SHALL update the session status to "ended" and sync final session data (cards_played, heat_level, ended_at) to Supabase
4. WHEN the session ends, THE System SHALL broadcast a Supabase_Realtime event notifying Player devices that the session has concluded

### Requirement 24: Curated Card Library Seeding

**User Story:** As a developer, I want a pre-seeded card library with categorized content, so that the game has sufficient content for testing and initial gameplay.

#### Acceptance Criteria

1. THE System SHALL include a seeded curated card library of at least 100 cards distributed across all defined categories (Hot Takes, Relationships, Memories, Confessions, Dares, Hypotheticals, Controversial, Roasts, Deep/Philosophical)
2. THE curated cards SHALL span all 5 intensity levels with representation in each Game_Mode's target audience
3. THE System SHALL store card category as an enum value, not free text
4. THE curated cards SHALL have deck_id set to null and is_curated set to true
5. THE System SHALL include at least 9 Action_Cards in the curated library (minimum 1 per category)
6. THE System SHALL include card content appropriate to Filipino social context and culture

### Requirement 25: Coin Wallet Stub Display

**User Story:** As a user, I want to see my coin balance in the UI, so that the wallet is visible even though spending is not yet functional.

#### Acceptance Criteria

1. THE Home_Screen SHALL display the user's Coin_Wallet balance with a gold coin icon and monospace-formatted number
2. THE Profile_Screen SHALL display the user's Coin_Wallet balance
3. WHEN a new user completes registration, THE System SHALL credit 10 coins to their Coin_Wallet and display a celebratory animation with the message "You got 10 welcome coins!"
4. THE coin pot UI in pre-game setup SHALL be visible but non-functional, displaying "Free Mode" to indicate no coins are deducted during Phase 1

### Requirement 26: Real-Time Setup Broadcast

**User Story:** As a Player in the lobby, I want to see the Host's setup choices update in real time, so that I know what kind of session is being configured.

#### Acceptance Criteria

1. WHILE the session status is "lobby" and the Host is configuring setup, THE System SHALL broadcast setup changes (card count, game mode, comfort filters) to all connected Player devices via Supabase_Realtime
2. WHEN a setup change is received, THE Player's Lobby_Screen SHALL display the updated configuration within 2 seconds
3. THE System SHALL restrict setup modification controls to the Host only — Player devices SHALL display setup choices as read-only

### Requirement 27: Gameplay State Management

**User Story:** As the system, I want the Host device to manage all gameplay state locally during an active session, so that card draws are fast and do not depend on network connectivity.

#### Acceptance Criteria

1. WHILE session status is "active," THE Host device SHALL maintain the full gameplay state (Card_Queue, Heat_Meter, Turn_Rotation, cards_played) in the local Zustand_Store
2. WHEN a Player performs a heart or trash action on a card, THE System SHALL sync that record to Supabase via an API call using the current turn Player's identity
3. WHEN the session ends, THE System SHALL sync the complete session results (cards_played, final heat_level, session duration, ended_at timestamp) to Supabase
4. IF the Host device loses network connectivity during gameplay, THEN THE System SHALL continue gameplay from the local Zustand_Store without interruption and queue pending syncs for retry when connectivity is restored
