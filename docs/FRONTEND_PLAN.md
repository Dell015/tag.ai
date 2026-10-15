# tag.ai Frontend Plan (follow this file)

Owner direction (2026-10-15): focus purely on the frontend. Every screen, button, shop item and setting is specified here so that work can proceed without asking. `CLAUDE.md` stays the source of truth for project status and decisions; this file is the build spec. When this file and `CLAUDE.md` disagree, fix both in the same change.

---

## 0. How to use this file

1. Work top to bottom through section 9 (milestones). One milestone at a time, each ending in a working app.
2. Before writing UI, re-read section 3 (design rules). The owner has rejected the "AI look" once already.
3. A milestone is done only when: `npm run lint`, `npm test`, `npm run build` pass, the flow was clicked through in a real browser at 390x800 (screenshots reviewed), and `CLAUDE.md` section 11 has a line for it.
4. Delivery: write changed files straight into the owner's project folder. Do not give git commands, commits or patches unless asked.
5. Everything backend is mocked behind repositories in `src/lib/data/` (see section 8). No page may import Supabase.
6. Status tags used below: `[built]` exists and works, `[todo]` to build, `[later]` out of scope for the frontend phase.

---

## 1. Product rules the UI must respect

- Audience: Filipino barkadas, 18+, playing one phone passed around a table, usually drinking, often in dim light. Assume imprecise taps, glare, noise, and low attention.
- Primary mode is single-phone: the host holds the phone, friends can be added by name as guests. Multi-phone lobby is an extra, not the default.
- Coins are fuel for a session, never a paywall to features. 1 peso = 1 coin. Coins never expire and are not transferable. New users get 10 coins. (Source: `about_tagai.md` section 6.)
- No alcohol is mandated. Non-drinking mode swaps all drink language for forfeits and dares.
- Heat is a gentle arc, never a lock. Players are never blocked from the good cards.
- Wild cards are free events. Action cards are regular cards in the draw pool.
- No ads, no subscriptions. Revenue is coin packs, themed packs and cosmetics.

---

## 2. Sitemap and navigation

### 2.1 Bottom navigation (4 tabs, visible on top-level screens only)

| Tab | Route | Contains |
|---|---|---|
| Play | `/` | Host, join, resume |
| Library | `/library` | Segmented control: My decks, Saved cards, Discover |
| Shop | `/shop` | Coin packs, tools, card packs, cosmetics |
| Me | `/me` | Profile, wallet, leaderboard, referral, settings, help |

The current nav (Play, Decks, Saved, Me) is replaced by this. `/decks` and `/saved` redirect into the Library segments.

### 2.2 Full route list

| Route | Screen | Status |
|---|---|---|
| `/welcome` | Splash, age gate, nickname and colour | built (age gate todo) |
| `/` | Home | built (wallet pill, tips todo) |
| `/join` | Enter code or paste link | built |
| `/game/[code]` | Lobby | built |
| `/game/[code]/setup` | Setup wizard (now 7 steps, see 4.5) | built (5 steps) |
| `/game/[code]/play` | Gameplay, pause menu, recap | built (pot, tools, categories todo) |
| `/library` | My decks, Saved, Discover segments | todo |
| `/library/decks/new` | Create deck | todo |
| `/library/decks/[id]` | Deck detail (view, play with, edit, publish) | todo |
| `/library/decks/[id]/edit` | Deck editor, card editor, slots | todo |
| `/library/discover/[id]` | Public deck preview and copy | todo |
| `/shop` | Shop | todo (decks page has placeholder) |
| `/me` | Profile hub | todo (profile page exists) |
| `/me/wallet` | Balance, history | todo |
| `/me/leaderboard` | Weekly and all-time boards | todo |
| `/me/referral` | Referral link and rewards | todo |
| `/me/settings` | All settings (section 5) | todo |
| `/me/settings/trashed` | Trashed cards, restore | todo |
| `/help` | How to play, FAQ, rules glossary | todo |
| `/legal/terms`, `/legal/privacy` | Static text pages | todo |

### 2.3 Navigation rules

- Every non-top-level screen has a 56px back button top left. No gesture-only navigation.
- Leaving a game (browser back, nav) always shows a "Leave game?" sheet with Resume as the primary action. Games persist, so leaving never loses progress.
- Deep links: `/join?code=ABC123` and `/game/ABC123` work for new visitors (they pass through `/welcome` first and return).
- Bottom nav hides during gameplay, setup and any full-screen flow.

---

## 3. Design rules (hard)

Details and rationale live in `CLAUDE.md` section 7. Summary that every screen must satisfy:

1. No emojis anywhere (UI, data, copy). Icons come from `components/ui/Icon.tsx`; add new icons there, same 2.5 stroke weight.
2. No gradients, glows, glassmorphism, grain, purple or indigo. Flat colour only.
3. One type family, Archivo variable. Headlines condensed heavy (`font-stretch: 72%`, weight 800), body weight 500. Card text at least 28px.
4. Accent colour is the current deck colour (`data-mode`), yellow outside games. Colour is never the only signal: every state also has text or an icon.
5. Hit targets 56px minimum, 68px for the main action on a screen. Primary action sits at the bottom, within thumb reach.
6. Every gesture has a visible button. Swipe is a shortcut, never the only way.
7. Undo for any destructive in-game action, 5 seconds by default (setting).
8. The current player is always visible during play.
9. Copy: sentence case, plain verbs, no em dashes, no exclamation spam, no filler. Name actions what they do ("Save", "Skip", "Done").
10. Motion only responds to input. Honour `prefers-reduced-motion` and the in-app Reduce motion setting.
11. Do not wrap everything in cards. Group with rules, whitespace and type. Use colour blocks only where colour carries meaning (deck, player).
12. Layout works from 360px to 430px wide; test at 360x640 and 430x932 as well as 390x800. Respect safe areas.

### 3.1 Component inventory

Existing `[built]`: Button (primary, secondary, ghost, danger; md, lg), Avatar, AvatarPicker, Chip, Sheet, Screen, Stepper, Toast (one at a time), BottomNav, Logo, Splash, DeckFan, Icon.

To add `[todo]`:

| Component | Purpose | States |
|---|---|---|
| `SegmentedControl` | Library tabs, shop sections | selected, focus, disabled |
| `ListRow` | Settings and wallet rows: label, value, chevron or control | default, pressed, disabled |
| `Toggle` | Settings switches (extract from setup page) | on, off, disabled |
| `Slider` | Volume, text size (stepped) | value, focus |
| `NumberStepper` | Pot contribution, card count | min, max, disabled |
| `ConfirmSheet` | Destructive confirmations (leave, delete, reset) | default |
| `EmptyState` | Title, one line, one action | n/a |
| `Skeleton` | Loading placeholders for lists | n/a |
| `CoinAmount` | Coin number with the word "coins", right-aligned, tabular | default, negative, insufficient |
| `PriceTag` | Shop price chip | owned, affordable, too expensive |
| `Badge` | "New", "Owned", "Most picked" (text only) | n/a |
| `TextField` | Label, input, helper, error | focus, error, disabled |
| `SearchField` | Discover and saved search | empty, filled |
| `CardPreview` | Static render of a card in any deck colour | question, dare, wild |
| `ShareImage` | Recap image generator (canvas) | n/a |
| `Countdown` | 3-2-1 on resume | n/a |

### 3.2 Global patterns

- **Sheets** for choices and confirmations; full pages for creation flows.
- **Toasts**: one at a time, above the bottom action area, 3s info, 5s with Undo.
- **Loading**: skeletons for lists; never a bare spinner. Local data is instant, so loading states exist mainly for Stage B but must be built now with a `useAsync` helper.
- **Errors**: say what happened and what to do. No apologies. Example: "Couldn't find that room. Check the code with the host."
- **Empty states**: one line plus one action ("No saved cards yet. Tap Save on a card during a game.").
- **Haptics**: tap 12ms, success, warn, heavy (built in `lib/haptics.ts`); toggle in settings.
- **Sound** `[todo]`: very short UI sounds (reveal, done, skip, pass, wild, end). Off by default until the owner opts in; asset budget under 200KB total. Wrapper `lib/sound.ts` with `play(name)`.

---

## 4. Screen specifications

Format: purpose, layout, every control and what it does, states and copy notes. "Mock" means it works against local storage only.

### 4.1 Welcome and onboarding `[built, extend]`

Steps: (1) splash with fanned deck and promise, (2) age gate, (3) nickname and colour.

- **Get started** (primary): next step.
- **Age gate** `[todo]`: "Are you 18 or older?" Two big buttons: "Yes, I'm 18 or older" / "No". "No" shows a closed screen: "tag.ai is for adults. Come back when you're 18." with no way forward. Choice stored in profile (`ageConfirmed`). Not a legal check, a soft gate.
- **Nickname field**: 2 to 16 characters, trims whitespace, error text if too short. Live avatar preview.
- **Colour picker**: 10 colours (existing).
- **Start playing**: creates mock profile with 10 welcome coins, goes home. First time only: a "Welcome bonus: 10 coins" toast.
- Returning users never see this screen.

### 4.2 Home `[built, extend]`

Layout: header (wordmark, wallet pill, avatar), big question headline, bottom action stack.

| Control | Action |
|---|---|
| Wallet pill (coins + avatar) | Opens `/me` |
| Resume your game (only if a game is in progress) | `/game/[code]/play` |
| Host a game | Creates room, opens lobby |
| Join with a code | `/join` |
| Tip line (rotating, text only) `[todo]` | One tip per visit: "Add friends by name, no account needed." Tap goes to Help |

States: first visit shows one coach line above the buttons ("Start here. Host a game, then add your friends by name."), dismissed permanently after first game.

### 4.3 Join `[built]`

Code field (6 chars, auto-uppercase, accepts pasted links), Join button, error text. Add `[todo]`: "Scan QR" button opening the camera scanner (feature-detect `BarcodeDetector`; hide if unsupported).

### 4.4 Lobby `[built, extend]`

| Control | Action |
|---|---|
| Back | Leave-room confirmation if host and other players present |
| Room code tiles | Tap copies the code (toast "Code copied") |
| Share invite link | Native share sheet, else copy |
| Show QR `[todo]` | Sheet with a large QR of the invite link |
| Player rows | Name, colour, role (Host, Guest, Joined). Host sees remove (X) on others |
| Add a friend by name + Add | Guest player, no account |
| Reorder players `[todo]` | Drag handles (and Move up / Move down buttons) to set turn order |
| Next: pick a deck | Setup (needs 2 or more players) |

Non-host view: sees players, waits. Max 12 players, field disables with a note at the limit.

### 4.5 Setup wizard `[built 5 steps, extend to 7]`

Steps (stepper shows N of 7). Back button on every step returns to the previous step, never leaves the wizard silently.

1. **Pick a deck** `[built]`: six mode decks as flat colour blocks (Icebreaker, Barkada, Lovers, Spicy, Chaos, Family). Selected shows a check and ring. Primary button disabled until one is chosen.
2. **Card source** `[todo]`: "Auto" (curated library, default) or "My decks" (choose one or more from Library, shows card counts). Combined pool preview: "132 cards available". If the chosen decks have fewer cards than the requested count, show a warning and offer to top up from Auto.
3. **How long?** `[built]`: 10, 20, 30, 40, 50 cards with time estimate; custom number stepper `[todo]` (5 to 100).
4. **Skip these topics** `[built]`: preset topic chips plus custom words. Defaults come from Settings.
5. **Coin pot** `[todo]`: see 4.5.1.
6. **Drink rules** `[built]`: four templates, non-drinking toggle, up to five custom rules. Template detail sheet shows the full rules from `about_tagai.md` section 9.
7. **House rules** `[built]`: summary, then everyone taps their name to agree; host can tap for all. Start game enabled when everyone agreed and the pot is valid.

Inside-joke slots `[todo]`: if the chosen pool contains cards with `[SLOT]` placeholders, an extra sheet appears before step 7: "Fill in the blanks" with fields (a name, a place, a memory). Skipping removes those cards from the pool.

#### 4.5.1 Coin pot step

Purpose: decide who pays for the session's cards.

- Choice: "I'll pay it all" (default, host is sponsor) or "Split it" (each player contributes).
- Number stepper for coins per player (split) or total (sponsor). Minimum total 3 coins.
- Live estimate: "6 coins is about 45 cards." Uses the per-type cost table in section 6.
- Wallet line: "You have 10 coins." If the host cannot cover their share, show "Add coins" linking to the Shop (returns to this step).
- Guests have no wallet: in Split mode the host sees "Mark as paid in cash" per guest, which tops the pot from the host's wallet and records it as the host's contribution.
- Free play `[owner decision pending]`: see open questions. Default is that the pot is required.

### 4.6 Gameplay `[built, extend]`

#### Layout (top to bottom)

1. Header: player avatar and name ("Your turn"), Pause button.
2. Heat bar with level word. During a spike it reads "Heat spike".
3. Meta row: "Card 7 of 20" left; rules line right ("Classic rules"). Add `[todo]` "Pot: 6.5" in the meta row, tap opens Top up.
4. The card.
5. Four buttons: Trash, Skip, Save, Done.
6. First-game hint line about swiping.

#### Card states

| State | What the player sees | Actions |
|---|---|---|
| Face down | Deck-colour card, "Tap to reveal" | Tap card |
| Question | Category, five intensity pips, text | Done, Skip, Save, Trash, swipe |
| Dare | "Dare" label, text | Same |
| Wild | White card, striped top, title, instruction; target picker for Role Reversal and Pick Your Target | Same |
| Pass | Full-screen next-player colour and name | Tap anywhere or "Tap when you have it" |

#### Buttons

| Button | Result | Heat | Turn | Pot |
|---|---|---|---|---|
| Done (or swipe right) | Card played | +0.3 | Advances | Charges card cost |
| Skip (or swipe left) | Card skipped | -0.2, three in a row -1.0 | Advances | Charges card cost |
| Save | Card saved to Saved cards, button fills | +0.5 | Stays | None |
| Trash | Card removed from your pool forever, buffer card fills in | as Done | Advances | Charges card cost |
| Pause | Opens pause sheet | none | none | none |

Undo appears for 5 seconds after Done, Skip or Trash and restores the previous state, including un-trashing.

#### Pass screen
Full-screen colour of the next player, giant name, small avatar, "Tap when you have it". Tapping anywhere dismisses. Setting "Skip pass screen" is not offered (it is a core mechanic).

#### Wild cards (all nine)
Each shows title and a plain instruction. Interactions to build `[todo]`:

| Wild card | Interaction |
|---|---|
| Role Reversal | Target picker (built) |
| Pick Your Target | Target picker (built) |
| Everyone Answers | "Start with you, then [left player]" and a Next-speaker button that steps through all players |
| Shuffle | Brief confirmation line "Next 5 cards reshuffled" |
| Heat Spike | Heat bar flashes the spike label; text states "3 cards" and counts down |
| Act It Out | 30 second charades timer button (start, pause) |
| Whisper Round | Names the player on the left |
| Free Drink | Single large "Everyone drinks" (or forfeit) |
| Crown | Shows "Crown immunity: 2 cards left", counter in meta row |

#### Action cards
Dare label, plus optional timer chip when the text contains a duration ("30 seconds"). `[todo]`

#### Pause sheet `[built partially]`

| Section | Controls | Status |
|---|---|---|
| Resume | Resume (3 second Countdown `[todo]`) | built without countdown |
| Heat | Cool down (free), Heat up (costs 2 coins from pot) | built, cost todo |
| Mood or category | "Change mood" (pick a different deck for the rest of the game) and "Focus next cards" (next 5 philosophical only, next 10 dares only, back to full mix) | todo |
| Players | List with remove; Add player (guest by name; QR for phone join); Reorder turn order | remove built, add and reorder todo |
| Top up the pot | Number stepper, "Add coins", shows remaining cards versus pot | todo |
| Tools | Timer and Coin flip (free), Dice and Spin the bottle (owned from Shop) | todo |
| Rules | House rules summary | built |
| End game | Confirm, then Recap; unspent pot returns to the contributors proportionally | confirm built, refund todo |

Heat up with an insufficient pot shows "Not enough coins in the pot. Top up first." with a button.

#### Pot behaviour (mock)
- Cost per card follows the per-type table (section 6.2). Wild cards are free.
- The meta row shows remaining pot. At 20% left a toast says "Pot is running low. Top up from the pause menu."
- At zero, the game pauses automatically on a "Pot is empty" sheet: Top up or End game.
- Top up draws from the host's wallet. If the wallet is empty the sheet links to the Shop.

### 4.7 Recap `[built, extend]`

Built: deck block, cards played, skipped, saved, peak heat, Play again, Back home.

Add `[todo]`:
- **Card of the night**: most saved card shown as a CardPreview.
- **Fun stat**: one anonymous line generated from skip counts ("Someone skipped 3 cards tonight").
- **Coin summary**: contributions per player and what was spent, refund line if ended early.
- **Saved tonight**: list with "Add to a deck" action.
- **Share**: generates a 1080x1920 image (canvas) with deck colour, wordmark, key stats and the card of the night; Share button uses the native share sheet, fallback Download. No player names unless the host toggles "Include names".
- **Play again**: returns to Setup with the same players and a fresh agree step.

### 4.8 Library `[todo]`

`/library` with `SegmentedControl`: My decks, Saved, Discover. Last segment is remembered.

#### My decks
- List: deck name, audience, card count, visibility badge (text), last edited.
- "New deck" primary button.
- Empty state: "No decks yet. Save cards during a game, then build your own."
- Row tap opens deck detail.

#### Deck detail `/library/decks/[id]`
- Header block in the deck's colour with name, audience, count.
- Buttons: Play with this deck (starts Host flow with the deck preselected), Edit, Publish or Unpublish, Delete (confirm sheet).
- Card list (CardPreview rows) with a search field.
- Visibility selector: Private, Friends only, Public (Friends only is disabled with "Needs accounts" until Stage B).

#### Deck editor `/library/decks/[id]/edit` and `/new`
- Name (max 30), audience chips (Barkada, Lovers, Strangers, Family, Workmates, Custom), colour (six deck colours).
- Add cards: from Saved, from the public card browser, or write a new card.
- Card editor sheet: text (max 200 chars, live counter), type (Question, Dare), intensity 1 to 5 stepper, category chips, `[SLOT]` insert button with a helper line, preview.
- Reorder is not needed; cards are drawn by heat. Remove card: swipe or button with Undo.
- Default intensity distribution: optional, three presets (Mild, Balanced, Hot).
- Save button disabled with fewer than 10 cards for publishing, none for private.

#### Saved cards
- List of saved cards with category and intensity text; search field; filter chips by category.
- Row actions: Remove, Add to deck (sheet listing decks plus "New deck").
- Multi-select mode: select several, then "Add to deck".

#### Discover
- Sort chips: Trending, Most played, Most copied, Newest. Filter chips: audience.
- Deck rows: name, creator, audience, card count, copies. Mock data, labelled "Sample decks" until Stage B.
- Deck preview `/library/discover/[id]`: first 5 cards visible, Copy deck button ("Copy to my decks", credits original creator), creator name tap shows their decks, Follow button `[later]`.

### 4.9 Shop `[todo]`

`/shop` with `SegmentedControl`: Coins, Tools, Packs, Style. Wallet balance always pinned at the top ("You have 10 coins"). Prices and items are in section 6. Behaviour:

- **Coins**: four package rows. Tapping Buy opens a sheet: package detail, price in pesos, payment methods shown as plain text (GCash, Maya, card), button "Pay P49". In Stage A the pay button shows "Payments open soon" and does nothing. A hidden developer toggle in Settings ("Test purchases") lets a purchase credit the mock wallet for UI testing.
- **Tools, Packs, Style**: item rows with a flat preview, one line description, price tag. Buy opens a confirm sheet ("Buy Dice for 12 coins? You will have 3 left."). Success toast, item marked Owned. Insufficient coins: button becomes "Need 7 more coins" linking to the Coins tab.
- Owned items show "Owned" and, for cosmetics, an Equip toggle.
- Packs show a preview of 3 sample cards (never spoilers of the full deck) and card count.

### 4.10 Me hub `[todo]`

`/me`: avatar, nickname, coin balance, rows linking to Wallet, Leaderboard, Referral, Settings, Help. Edit nickname and colour inline (existing profile page content moves here).

#### Wallet `/me/wallet`
- Balance large. Rows: history (welcome bonus, purchases, pot contributions, refunds, referral rewards), each with date and signed amount. Empty state until first transaction.
- Button "Buy coins" goes to Shop.

#### Leaderboard `/me/leaderboard`
- Segments: This week, All time. Boards: Most copied card, Top deck creators, Most played card, Top hosts. Mock sample data, labelled clearly. Rows show rank, name, count; your own row is pinned if present.

#### Referral `/me/referral`
- Your link, Copy and Share buttons, explanation: "You and your friend each get 5 coins when they sign up." Count of friends joined (mock 0). Rules text.

### 4.11 Help and legal `[todo]`

- **How to play**: four short steps, plus a "Glossary" (Deck, Heat, Wild card, Pot, Dare, Forfeit), plus "Drinking responsibly" with tips (water, rides, never drive).
- **FAQ**: 8 questions (Do friends need the app? What do coins do? Can I play without alcohol? How do I remove a card? Does the game work offline? What is heat? Who sees my saved cards? How do I report a card?).
- **Report a card** `[todo]`: available on any card (overflow in pause sheet): reason chips (Offensive, Unclear, Duplicate, Other), Send. Mock stores locally.
- **Terms and Privacy**: static pages with placeholder legal text clearly marked "Draft".

### 4.12 Global overlays and states

- **Leave game sheet**, **End game sheet**, **Remove player sheet**, **Delete deck sheet**, **Reset profile sheet**: ConfirmSheet with a specific verb button ("End game", "Remove Mark"), never "OK".
- **Offline banner** `[todo]`: small bar "You're offline. Your game is saved on this phone." shown when `navigator.onLine` is false.
- **Install prompt** `[todo]`: after the first finished game, a sheet explains "Add to Home Screen" with platform-specific steps; dismissible and never repeated more than twice.
- **Update available** `[later]`.
- **404 and error pages** `[built]`.

---

## 5. Settings (complete list) `[todo]`

`/me/settings`, a single page with grouped `ListRow`s. Every setting persists to localStorage (`tagai-settings`) via `settings-store`.

### Account
| Setting | Control | Default |
|---|---|---|
| Nickname | Text field | set at onboarding |
| Colour | Picker | chosen |
| Avatar frame | Picker of owned frames | none |
| Reset profile | Danger button + ConfirmSheet | n/a |

### Game defaults (prefill the setup wizard)
| Setting | Control | Default |
|---|---|---|
| Default deck | Deck picker | Barkada |
| Default length | 10/20/30/40/50 | 20 |
| Topics to skip | Chips + custom words | none |
| Default drink rules | Template picker | Classic |
| Non-drinking by default | Toggle | off |
| Saved custom rules | List, add, remove (max 5) | none |
| Default pot style | I pay it all / Split | I pay it all |

### Playing
| Setting | Control | Default |
|---|---|---|
| Vibration | Toggle | on |
| Sounds | Toggle + volume slider | off |
| Keep screen awake | Toggle | on |
| Swipe gestures | Toggle (off means buttons only) | on |
| Undo time | 3s, 5s, 8s | 5s |
| Confirm before trashing | Toggle | off (undo covers it) |
| Show intensity pips | Toggle | on |
| Show rules line | Toggle | on |
| Left-handed layout | Toggle (mirrors action buttons order) | off |

### Display and access
| Setting | Control | Default |
|---|---|---|
| Card text size | Normal, Large, Extra large (28/34/40px minimum scale) | Normal |
| Reduce motion | Toggle | follows system |
| High contrast | Toggle (stronger borders, no muted text below AA) | off |
| Language | English, Filipino, Taglish (UI labels; card content is Taglish already) | English |

### Content
| Setting | Control |
|---|---|
| Trashed cards | Link to list with Restore per card and "Restore all" |
| Saved cards | Link to Saved |
| Report a problem card | Link to the report form |

### Data and about
| Setting | Control |
|---|---|
| Export my data | Downloads a JSON of profile, saved ids, trashed ids, decks |
| Clear game in progress | Danger + ConfirmSheet |
| Clear all local data | Danger + ConfirmSheet, returns to Welcome |
| Test purchases (developer) | Toggle, hidden until the version label is tapped 5 times |
| Version | Read-only, with build id |
| Terms, Privacy, Help, Send feedback | Links (feedback opens mail compose to a placeholder address) |

---

## 6. Economy, shop catalogue and costs (all mock in Stage A)

### 6.1 Coin packages (source: `about_tagai.md`)
| Name | Price | Coins | Notes |
|---|---|---|---|
| Starter | P20 | 20 | |
| Night Out | P49 | 55 | Badge "Most picked", +5 bonus |
| Party Pack | P99 | 120 | +20 bonus |
| Treasurer | P199 | 260 | +60 bonus |

### 6.2 Card cost in the pot
Cost per card in coins = 1 divided by questions per coin.
| Card type | Questions per coin | Cost per card |
|---|---|---|
| Icebreaker or casual | 15 | 0.067 |
| Standard | 10 | 0.1 |
| Spicy or controversial | 6 | 0.167 |
| Deep or vulnerable | 4 | 0.25 |
| Dare | 5 | 0.2 |
| Wild | free | 0 |

Mapping from card data: intensity 1 = casual, 2 to 3 = standard, 4 = spicy, 5 = deep; `cardType: action` = dare; `wild` = free. Implement in `lib/game/pot.ts` with tests. Minimum pot to start: 3 coins. Heat up from the pause menu costs 2 coins from the pot.

### 6.3 Shop items (proposed, owner can change)
**Tools** (one-time unlock, used from the pause menu Tools tray)
| Item | Price | What it does |
|---|---|---|
| Dice | 12 | Roll one or two dice, big result, shake to roll |
| Spin the bottle | 12 | Spinner picks a player from the current list |
| Wheel | 15 | Spinner with custom labels for dares |

Timer and Coin flip are free built-ins.

**Card packs** (adds cards to the Auto pool and appears as a selectable deck)
| Pack | Price | Cards | Description |
|---|---|---|---|
| Videoke night | 25 | 40 | Sing-or-drink dares and music confessions |
| Outing edition | 25 | 40 | Beach, road trip and overnight cards |
| Office party | 40 | 50 | Safe-for-HR chaos for workmates |
| Pasko and reunion | 30 | 40 | Family-friendly, tita-proof |
| Late night deep | 30 | 40 | Slow, honest, vulnerable cards |
| Pulutan dares | 20 | 30 | Dares only, short and physical |

**Style** (cosmetic)
| Item | Price | Notes |
|---|---|---|
| Avatar frames: Stripe, Dots, Double | 10 each | Ring around the avatar |
| Card backs: Jeepney stripes, Checker, Sunburst, Plain ink | 15 each | Replaces the face-down card design |
| Accent theme: Blue, Pink, Green | 20 each | Changes the accent outside games |

Every item has: id, name, price, kind, description, preview, owned flag in `shop-store`. Card pack contents for Stage A are 6 to 10 sample cards each written in the existing voice; the rest are placeholders marked so the pool never lies about counts.

### 6.4 Rewards (mock, shown in UI copy only)
- Welcome bonus 10 coins (built).
- Referral: 5 coins each (section 4.10).
- Host with 3 or more new accounts: 10 coins.
- Creator rewards: +1 per copy of your card, +0.5 per draw `[later]`. Shown as "Earnings" on the Me hub once decks are published.

---

## 7. Content and voice

- Voice: friendly, direct, a bit playful, never sarcastic at the user's expense. Light Taglish is fine ("Kumusta") where natural; do not overdo it.
- Buttons: verbs. "Host a game", "Join", "Start game", "Save", "Done", "Skip", "Resume", "Top up".
- Names stay the same everywhere: Deck (not mode, in UI), Heat, Wild card, Pot, Dare, Forfeit, Coins.
- Errors: what happened, what to do. Empty: one line, one action.
- Avoid: emojis, em dashes, exclamation marks, "oops", "awesome", "unlock", all-caps labels.
- Card content is data in `src/lib/data/cards.ts` (generated from the seed). Any new card must follow the existing tone, be 200 characters or fewer, and be tagged with topics for comfort filters.

---

## 8. Frontend data model (mock repositories)

Everything below lives behind interfaces in `src/lib/data/` so Stage B swaps implementations.

| Store or repo | Contents | Status |
|---|---|---|
| `profile-store` | profile, savedCardIds, trashedCardIds, hasSeenHints | built; add ageConfirmed, ownedItems? (no, see shop-store) |
| `settings-store` `[todo]` | all settings in section 5 | |
| `wallet-store` `[todo]` | balance (move out of profile), transactions[] with type, amount, label, date | |
| `shop-store` `[todo]` | catalogue (static), ownedIds, equipped{frame, cardBack, theme} | |
| `deck-repo` `[todo]` | user decks (CRUD), card edits, visibility | |
| `discover-repo` `[todo]` | sample public decks, sort and filter | mock seed |
| `leaderboard-repo` `[todo]` | sample boards | mock seed |
| `rooms` | rooms repository | built |
| `game-store` | queue, heat, turn, undo; add pot and categoryFocus | built; add pot, focus |
| `pot` helpers `[todo]` | card cost, estimate, contribution split | `lib/game/pot.ts` |

Types to add in `src/types/`: `Deck`, `DeckCard`, `ShopItem`, `Transaction`, `Settings`, `LeaderboardEntry`, `Pot`.

Persistence keys: `tagai-profile`, `tagai-game`, `tagai-settings`, `tagai-wallet`, `tagai-shop`, `tagai-decks`, `tagai-room:CODE`, `tagai-last-room`. Every persisted store uses `skipHydration` and the shared `useHydrated()`.

Seeds: `scripts/` generates sample decks and leaderboard data into `src/lib/data/` so they are plain typed files.

---

## 9. Milestones (build order)

Each milestone lists scope and acceptance. Do not start the next before the current passes the checklist in section 0.

**F1. Shell and navigation**
Scope: new 4-tab BottomNav (Play, Library, Shop, Me), route stubs, redirects from `/decks` and `/saved`, `SegmentedControl`, `ListRow`, `Toggle`, `ConfirmSheet`, `EmptyState`, `Skeleton`, `TextField`, `NumberStepper`, `CoinAmount`, `Badge`. Leave-game sheet.
Accept: every nav target loads, no dead links, components have a visual test page at `/dev/components` (not linked, excluded from prod).

**F2. Settings and Me hub**
Scope: `settings-store`, Me hub, Settings page with every row in section 5, Trashed cards page, apply settings in the app (haptics, sound stub, wake lock, swipe off, text size, left-handed, undo time, reduce motion, high contrast).
Accept: each setting visibly changes behaviour; reload keeps values; unit tests for the store.

**F3. Wallet, pot and economy**
Scope: `wallet-store`, `lib/game/pot.ts` with tests, Coin pot setup step, pot in the meta row, charge per card, low and empty states, Top up sheet, heat-up cost, end-early refund, wallet page with history.
Accept: a 20-card game consumes the pot predictably; empty pot pauses; refunds correct; all pot math covered by tests.

**F4. Shop**
Scope: `shop-store`, catalogue, four segments, buy flows, owned and equip, cosmetics applied (frames, card backs, theme), Test purchases toggle, tools unlocked state.
Accept: buying deducts coins and persists; insufficient coins path works; cosmetics render in game and profile.

**F5. Tools and play depth**
Scope: Tools tray (Timer, Coin flip, Dice, Spin the bottle, Wheel), wild card interactions (all nine), dare timers, Resume countdown, Change mood, Focus next cards, add and reorder players mid-game, Report a card.
Accept: every pause menu row works; each wild card has a distinct, tested flow.

**F6. Library: Saved and My decks**
Scope: Library shell, Saved list with search, filters, multi-select add to deck, deck CRUD, deck editor, card editor with `[SLOT]`, deck detail, Play with this deck, setup "Card source" step, inside-joke slot sheet, queue builder accepts custom decks.
Accept: create a deck, play it, slots render in cards; pool-size warning works.

**F7. Discover and community (mock)**
Scope: Discover list, sort and filters, preview, copy deck, leaderboard, referral page.
Accept: copying adds a deck to My decks with credit; all mock data clearly labelled.

**F8. Recap upgrade and sharing**
Scope: card of the night, fun stat, coin summary, saved tonight, share image generator, Play again.
Accept: image renders correctly at 1080x1920 and shares or downloads.

**F9. Onboarding, help and legal**
Scope: age gate, first-run coach lines, tips, How to play, FAQ, glossary, drinking responsibly, Terms and Privacy drafts, install prompt, offline banner.
Accept: a new user can complete a first game guided only by the UI.

**F10. Polish and QA**
Scope: sound assets (optional), motion pass, empty and error states everywhere, accessibility pass (labels, focus order, contrast with high contrast on, screen reader names), performance check, 360px and 430px layouts, component tests with Testing Library (add jsdom), end-to-end script that plays a full game.
Accept: section 10 checklist all green.

After F10 the frontend is complete and Stage B (backend) begins per `CLAUDE.md` section 6.

---

## 10. QA checklist (run at the end of every milestone, in full at F10)

Functional
- New profile to finished game, end to end, with 2, 4 and 12 players.
- Reload mid-game at every phase (lobby, each setup step, face-down, revealed, pass screen, paused, recap): state restores.
- Undo after Done, Skip, Trash; undo of a trash restores the card to the pool.
- Non-drinking mode: no drink wording appears anywhere (cards, wild cards, rules, shop copy).
- Empty pot, empty wallet, insufficient coins, tiny deck, no saved cards, no decks.
- Two tabs on one room: lobby stays in sync.

Visual
- 360x640, 390x800, 430x932; every screen has no clipped text or horizontal scroll.
- No emoji, gradient, glow or em dash in the UI (a grep check script runs in lint: `scripts/check-style.mjs`, to be added in F1).
- Every deck colour shows readable text (AA contrast, verified with a script).

Accessibility
- All controls reachable and labelled; focus ring visible; tap targets 56px or more.
- Text size Extra large does not break layouts.
- Reduce motion and High contrast verified.

Performance
- First load under 150KB JS per route (current routes are 100 to 160KB shared). Report sizes at every build.
- No layout shift on the play screen during card flip.

---

## 11. Open questions (owner can answer any time; defaults apply meanwhile)

1. Free play: should the first game (or every game while coins are low) be playable without a pot? Default: pot is required, 10 welcome coins covers about 70 cards.
2. Pot with guests: confirm that the host pays for guests (cash settled outside the app). Default: yes.
3. Shop catalogue: are the items and prices in 6.3 right, and are Tools meant to be paid unlocks? Default: as listed.
4. Languages: do you want a Filipino UI translation now or later? Default: English first, Filipino strings in F10 if time allows.
5. Sound: any reference you like for the UI sounds (clicks, bottle clink)? Default: no sounds shipped until you opt in.
6. Social features (Discover, leaderboard, referral) are mock until accounts exist. Keep them visible in the app now, or hide until the backend is ready? Default: visible, labelled "Sample".
7. Terms and Privacy text: do you have legal wording, or should placeholders stay until later?
8. Do you want a web "Add to Home Screen" prompt, or app-store only later? Default: prompt after the first finished game.
