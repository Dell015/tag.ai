# 🎨 Design Plan — Drinking Game Webapp
**For: Kiro**
**Version:** 1.0

---

## Overview

This document covers the visual design system, UX flows, screen-by-screen layout, interaction design, and component library for the drinking game webapp. It is intended to give the developer a complete picture of how the app should look and feel — enough to build without needing a separate design file, but detailed enough that nothing is left to guesswork.

---

## Design Philosophy

**Dark. Warm. Alive.**

This is a nighttime app. People are at a bar or someone's house, lights are low, drinks are poured. The UI needs to work in dim environments without being harsh. Think warm dark backgrounds, not cold black. Think glow and depth, not flat minimalism.

**The card is everything.** Every design decision supports the card as the hero of the screen. When a card is on screen, nothing competes with it.

**Tactile and physical.** Animations should feel like you're handling a real object — the flip has weight, the swipe has momentum, the trash has finality. Framer Motion is the tool. Use it generously.

**Readable at arm's length.** The phone gets passed around. Text needs to be large enough to read when someone holds it up across a small table. Minimum 18px for card text, 22–28px preferred.

---

## Color System

### Base Palette

```
Background (primary)   #1A1218   deep warm black with a purple undertone
Background (surface)   #251B22   card surfaces, panels, modals
Background (elevated)  #2E2229   input fields, secondary containers

Text (primary)         #F2EBF0   soft white, slightly warm
Text (secondary)       #A89AAE   muted lavender-grey
Text (disabled)        #5C4F5E   very muted

Accent (primary)       #E8446A   warm coral-red — main CTAs, hearts, key UI
Accent (glow)          #FF6B8A   lighter version for hover states and glows
Accent (secondary)     #9B5FE0   purple — used for wild cards, leaderboard
Accent (gold)          #F4C842   coins, creator badges, heat meter highlights

Success                #4CAF7D   confirmation, saved, earned coins
Warning                #F4923A   warnings, pot running low
Error                  #E84444   destructive actions, trash confirmation

Heat gradient
  Level 1              #4A90E8   cool blue
  Level 2              #6BC46A   green
  Level 3              #F4C842   gold
  Level 4              #F4923A   orange
  Level 5              #E8446A   red (same as accent)
```

### Usage Rules

- Backgrounds are always dark — never use white or light backgrounds
- Accent red (#E8446A) is used sparingly: primary buttons, hearts, critical UI only
- Purple (#9B5FE0) is reserved for wild cards and special moments — never overuse
- Gold (#F4C842) is for coins and heat only
- Every interactive element has a visible focus state (glow outline, 2px, accent color)

---

## Typography

### Font Stack

```
Primary (headings):   'Syne' — geometric, bold, personality
Body / UI:            'Inter' — clean, readable, reliable
Card text:            'Syne' or 'Inter Tight' — depends on card type
Monospace (codes):    'JetBrains Mono' — for room codes, coin amounts
```

Load all via Google Fonts.

### Type Scale

```
Display (splash, hero):   48px / 700 weight / tight tracking
H1 (page titles):         32px / 700
H2 (section headers):     24px / 600
H3 (card labels, names):  18px / 600
Body (default):           16px / 400
Body Large (card text):   20–26px / 500  ← key for readability in-game
Caption:                  13px / 400 / secondary color
Monospace:                14px / 500
```

### Line Height

- Body: 1.6
- Headings: 1.2
- Card text: 1.5 (needs room to breathe)

---

## Spacing & Layout

### Base Unit: 4px

All spacing is multiples of 4:

```
xs:   4px
sm:   8px
md:   16px
lg:   24px
xl:   32px
2xl:  48px
3xl:  64px
```

### Screen Layout

- Safe area insets respected (iOS notch, Android nav bar)
- Content max-width: 430px (centered on larger screens, full-width on mobile)
- Horizontal padding: 16px on all screens
- Bottom nav height: 64px + safe area inset
- Top bar height: 56px

---

## Component Library

### Card Component

The most important component in the app.

**Dimensions:** Full width minus 32px horizontal padding. Aspect ratio ~3:4 (portrait card).

**States:**

```
Face-Down
  Background: surface color (#251B22)
  Back design: subtle repeating pattern (logo mark, low opacity)
  Corner radius: 20px
  Shadow: 0 8px 32px rgba(0,0,0,0.5)
  Border: 1px solid rgba(255,255,255,0.06)

Revealed (Question Card)
  Background: gradient — surface to slightly lighter (#251B22 → #2E2229)
  Category tag: small pill, top-left, accent color
  Intensity dots: top-right, 1–5 filled circles
  Question text: centered, 22–26px, primary text color
  Creator attribution: bottom, small, secondary color

Revealed (Wild Card)
  Background: deep purple gradient (#1A0D2E → #2D1552)
  Wild card icon: large, centered above text
  Wild card name: bold, 24px
  Wild card description: 16px, secondary color
  Border: 1px solid rgba(155,95,224,0.3) with purple glow

Revealed (Action Card)
  Background: warm dark teal gradient
  Action icon: relevant emoji or icon, large
  Action text: 20–24px, energetic tone

Trashed (animation only)
  Card spins slightly and shrinks as it's dragged to trash
  Trash icon pulses red when card is over it
  On release: card crumples and disappears (scale 0 + opacity 0)

Dismissed (swipe)
  Card rotates slightly in swipe direction
  Flies off screen with spring physics
  Next card slides up from behind
```

**Card Stack Effect:** Next 2 cards are visible behind the current card (scaled down 96% and 92%, offset 6px and 12px down) — creates depth and implies there's more to come.

---

### Button Component

```
Primary Button
  Background: #E8446A
  Text: white, 16px, 600 weight
  Padding: 14px 24px
  Border radius: 14px
  Hover: scale(1.02), brightness +10%
  Active: scale(0.97)
  Disabled: opacity 0.4, no hover effects

Secondary Button
  Background: transparent
  Border: 1.5px solid rgba(255,255,255,0.2)
  Text: primary text color
  Same sizing as primary

Ghost Button
  No background, no border
  Text: accent color
  Used for low-priority actions

Icon Button
  48px × 48px tap target
  Icon centered, 24px
  Background: rgba(255,255,255,0.06) on hover
  Border radius: 50%

Destructive Button
  Background: #E84444 (error color)
  Same sizing as primary
  Used only for irreversible actions (trash card, remove player, end session)
```

---

### Heat Meter

Displayed at the top of the game screen. Visible to all players.

```
Container: full width, 4px height bar
Background: rgba(255,255,255,0.1)
Fill: gradient from current level's start color to end color
  Level 1: solid #4A90E8
  Level 2: #4A90E8 → #6BC46A
  Level 3: #6BC46A → #F4C842
  Level 4: #F4C842 → #F4923A
  Level 5: #F4923A → #E8446A
Fill animates width on change (spring easing, 500ms)
Level label: "🔥 Level 3 — Getting Spicy" shown above bar, fades in on change
```

---

### Coin Display

Used on profile, pot screen, and purchase screen.

```
Coin icon: gold circle with ₱ or coin SVG
Amount: monospace font, gold color (#F4C842)
Inline format: 🪙 55 (icon + number)
Large format: full card with balance + "coins" label
Animation: when coins change, number increments/decrements with count-up animation
```

---

### Player Avatar

```
Size variants: sm (32px), md (48px), lg (64px)
Shape: circle
Default: generated avatar based on username initial + accent color background
Custom: user-uploaded image
Turn indicator: ring around avatar in accent color, pulses when it's their turn
Removed player: greyed out, strikethrough on name
```

---

### Toast Notifications

Small non-blocking feedback messages. Appear at top of screen, auto-dismiss after 2.5s.

```
Success: green left border, checkmark icon
Info: accent color left border, info icon
Warning: orange left border, warning icon
Error: red left border, X icon

Position: top center, below top bar
Animation: slides down from top + fade in, slides up + fade out on dismiss
Max 2 toasts visible at once
```

---

### Modal / Bottom Sheet

Used for: pause menu, player management, House Rules, purchase flow.

```
Overlay: rgba(0,0,0,0.7) backdrop
Sheet: slides up from bottom
  Background: #1A1218
  Border radius: 24px 24px 0 0
  Drag handle: 40px × 4px rounded pill, centered, rgba(255,255,255,0.2)
  Padding: 24px
Max height: 85vh (scrollable within)
Animation: spring up on open, ease out on close
```

---

## Screen-by-Screen Design

### 1. Splash / Launch Screen

- Full-screen dark background (#1A1218)
- App logo centered (wordmark or icon TBD)
- Subtle animated background (slow-moving gradient or particle effect)
- Auto-advances to Sign Up or Home after 1.5s

---

### 2. Sign-Up / Login Screen

**Layout:**
- Top: app logo, small
- Headline: "Your nights just got better." (Display size)
- Subtext: "Sign up to save your cards, earn coins, and host unforgettable sessions."
- Buttons (stacked):
  - "Continue with Google" (Google icon, secondary button style)
  - "Continue with Email"
  - "Continue with Phone"
- Bottom: "Already have an account? Log in"
- Divider: thin line with "or" between Google and email/phone

---

### 3. Username Setup (Post Sign-Up)

- Shown once, on first sign-up only
- Headline: "What should we call you?"
- Large text input (placeholder: "username")
- Live availability check (green checkmark / red X)
- Avatar selector below: 8 preset illustrated avatars (colorful, character-style)
- "Let's go" primary button
- Success: coin animation plays, "You got 10 welcome coins!" toast appears

---

### 4. Home Screen

**Top bar:**
- App logo (left)
- Coin balance (right): 🪙 55

**Body (scrollable):**
- Large CTA card: "Start a Game" — takes up top ~40% of screen, prominent, accent color gradient background, icon of cards
- Secondary row: "Join a Game" button (enter code) + "Scan QR" button
- Section: "Your Decks" — horizontal scroll of deck cards
- Section: "Trending Packs" — horizontal scroll of public decks
- Section: "Recent Sessions" — list of last 3 sessions with date and recap link

**Bottom nav:**
- Home / Discover / My Decks / Profile (4 tabs, icon + label)

---

### 5. Pre-Game Setup Screens (Host)

**Step 1: Lobby**
- Room code displayed large (monospace, centered): e.g., `GHX-42F`
- QR code below
- "Share link" button
- Player list: avatars + names appear as they join (live via Realtime)
- "Ready to set up →" button activates once at least 1 other player joins
- Host can tap a player to kick them

**Step 2: Card Count**
- Headline: "How long tonight?"
- 6 large pill buttons: 10 / 20 / 30 / 40 / 50 / Custom
- Below selected count: "~[X] minutes · [Y] coins recommended"
- Estimated time shown as rough range

**Step 3: Comfort Filters**
- Headline: "What's off the table?"
- Subtext: "Check topics you want to skip. Your choices are private."
- List of toggles with icons and topic labels
- Custom filter text input at bottom: "+ Add a specific topic..."
- Each added custom topic appears as a deletable chip
- "Looks good →" button

**Step 4: Game Mode**
- Headline: "Pick your vibe"
- 6 mode cards in a 2-column grid
  - Each card: emoji, mode name, 1-line description, recommended audience tag
  - Selected card: glows with accent border
- "Next →" button

**Step 5: Drink Rules**
- Headline: "House rules"
- 4 template cards (horizontal scroll): Classic / Chaos / Soft Mode / Points-Based
- Each template: name + bullet list of 3 rules preview
- Tap to select (radio behavior)
- Below: "+ Add custom rule" → text input, up to 5
- Custom rules appear as editable list items
- Non-drinking mode toggle at bottom: "No alcohol tonight" (replaces drink language)

**Step 6: Coin Pot**
- Headline: "Fund the night"
- Shows each player's avatar + name + coin input (number stepper)
- Running total: "Pot total: 12 coins · ~85 cards"
- "Sponsor the whole night" toggle for solo host
- Recommended contribution shown as a hint below each player's input
- "Start Game" button (disabled until minimum 3 coins in pot)

---

### 6. Game Screen

**Top bar (always visible):**
```
[Heat bar — full width, 4px]
🔥 Level 3     |     Pot: 8 🪙     |     Card 14/30
```

**Center (card area):**
- Card stack: current card front + 2 cards visible behind
- Face-down by default
- All gesture interactions happen here

**Bottom bar:**
- Left: ❤️ heart button (save card)
- Center: 👤 player indicator ("Miguel's turn →")
- Right: 🗑️ trash button (hold to activate drag)
- Far right: ⏸ pause

**Gesture hints (first 3 cards only):**
- Subtle arrow animations showing swipe direction
- "Tap to flip" text below face-down card
- Disappear after user successfully completes each gesture once

**Wild Card Overlay:**
When wild card triggers:
- Screen dims
- Wild card slides up from bottom full-screen
- Purple glow effect radiates from card
- Wild card type + description shown large
- Dismiss by tapping anywhere
- Returns to normal game after 3 seconds or tap

---

### 7. Pause Menu (Bottom Sheet)

Sheet slides up. Contains:

```
── Change Mood ──────────────────────
  [6 mode pills, horizontal scroll, current selected]
  Category Lock:
    [dropdown: All / Opinions / Memories / Dares / Philosophy / etc.]
    For next: [5 / 10 / 15] cards

── Players ──────────────────────────
  [avatar] Miguel (host)
  [avatar] Ana        [× remove]
  [avatar] Kuya Mark  [× remove]
  [+ Add Player] → shows QR + link

── Pot ──────────────────────────────
  Current: 6 coins remaining (~42 cards)
  [+ Add coins from your wallet]
  Input: [    ] coins   [Add]

── Heat ─────────────────────────────
  [🔼 Turn Up +1 · costs 2 coins]   [🔽 Cool Down -1 · free]

── ─────────────────────────────────
  [📋 View House Rules]
  [🚪 End Session Early]

  [▶ Resume]
```

---

### 8. Post-Game Recap Screen

Full-screen celebration moment.

**Layout:**
- Top: "That's a wrap! 🎉" headline
- Cards played count (large number, animated count-up)
- Heat level reached: heat bar shown at final level with level name
- "Card of the Night": the most-hearted card displayed in full card format
- Fun stats block (grey card):
  - "X cards were skipped"
  - "Y cards were saved tonight"
  - "The night peaked at Level Z"
- Coin summary: horizontal list of player avatars + how much they contributed
- Share button: "Share Tonight's Recap" → generates and downloads image
- "Play Again" button (restarts setup with same players)
- "Go Home" text link

---

### 9. Deck Builder Screen

**Header:** "My Decks" + "+ New Deck" button

**Deck list:** Cards showing deck name, card count, audience type, visibility badge

**New Deck flow:**
- Bottom sheet: name input, audience type selector (pills), visibility toggle
- "Create Deck" → opens deck editor

**Deck Editor:**
- Header: deck name (editable inline) + visibility toggle + "Publish" button
- Card count badge
- "Add Cards" section:
  - Tab: From Saved / Browse Library / Write New
  - Search bar on Browse tab
  - Filter chips: category, intensity
- Card list: each card shows text preview, category, intensity dots, delete icon
- Inside Joke Slots section (visible only for Barkada audience type):
  - Up to 5 labeled slot inputs
  - Preview how a card looks with slots filled

---

### 10. Profile Screen

**Header:** Avatar (large), username, "Edit Profile" link

**Stats row (3 columns):**
- Sessions Played
- Cards Saved
- Cards Created

**Coin section:**
- Balance: 🪙 55
- "Buy Coins" button → goes to Shop
- "Transaction History" link

**Creator section (if user has published cards):**
- Cards Copied: X times
- Coins Earned: X
- Top Card: shows most-copied card

**My Decks:** horizontal scroll

**Saved Cards:** horizontal scroll (first 6, "See All" link)

---

### 11. Shop Screen

- Headline: "Top up your coins"
- 4 package cards (vertical stack):
  - Package name + coin amount + price
  - Best value badge on Night Out package
  - What it buys: "~440 cards worth"
- Payment method selector: GCash / Maya / Card / OTC
- "Buy [Package]" button → PayMongo flow
- Footer note: "Coins never expire. Share sessions with friends."

---

## Motion & Animation Guide

### Principles

- **Spring physics for everything interactive** — cards, buttons, modals
- **Ease-out for entries** — things that appear slow down as they arrive
- **Ease-in for exits** — things that leave accelerate as they go
- **No linear animations** — they feel mechanical and cheap

### Specific Animations

| Interaction | Animation |
|---|---|
| Card flip (face-down → revealed) | rotateY 0→180, 300ms, spring |
| Card swipe dismiss | translateX ±150% + rotate ±15°, 250ms, spring |
| Card drag to trash | follow cursor/touch, trash icon scales up 1.2× when hovering |
| Card trash confirm | scale 0 + opacity 0, 200ms ease-in, with slight rotation |
| Wild card appear | scale 0.8→1 + opacity 0→1, 400ms spring, with purple glow fade-in |
| Heat meter fill | width transition, 500ms spring |
| Toast notification | translateY -20→0 + opacity 0→1, 300ms ease-out |
| Bottom sheet open | translateY 100%→0, 350ms spring (higher stiffness) |
| Coin counter | number increments digit by digit, 600ms total |
| Player join (lobby) | slide in from right + fade, 300ms |
| Card stack depth | cards 2 and 3 scale up as card 1 is dismissed |

### Performance Rules

- All animations on GPU-composited properties only: `transform`, `opacity`
- Never animate `height`, `width`, `top`, `left` — causes layout reflow
- Use `will-change: transform` on card component
- Target 60fps on mid-range Android devices

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for all body text
- Touch targets: minimum 48px × 48px
- All icons have aria-labels
- Card text is selectable (for screen readers)
- Animations respect `prefers-reduced-motion` — fallback to fade-only
- Swipe gestures have button alternatives (← dismiss / → next) for accessibility mode

---

## Responsive Behavior

The app is mobile-first. Target viewport: 375px–430px wide.

On tablet or desktop (for the rare case):
- Max content width: 430px
- Centered with dark background filling the rest
- Game screen stays portrait-locked in layout even on landscape

The app should feel like a native mobile app at all times.

---

## Dark Mode Only

There is no light mode. The app is dark-only. This is intentional — the use case is always nighttime / dim environments. A light mode would be jarring and off-brand.

---

## Icon System

Use **Lucide Icons** (already available in the React/Next.js ecosystem). Supplement with custom SVG icons for:
- The app logo / wordmark
- Coin icon (gold circle)
- Card back pattern
- Wild card special icons (one per wild card type)

Icon size standard: 20px in UI, 24px in navigation, 32px+ for empty states.

---

## Empty States

Every list or section that can be empty needs a designed empty state.

| Screen | Empty State |
|---|---|
| Saved Cards | Illustration of empty card + "Heart cards during a game to save them here" |
| My Decks | "Build your first deck" + card illustration + CTA button |
| Discovery | "No decks found" + search suggestion |
| Leaderboard (new user) | "Play your first session to appear on the board" |

Empty states use a muted illustration (single color, low detail) + 1-line explanation + optional CTA.

---

## Naming Conventions (for Kiro)

| Element | Convention |
|---|---|
| Components | PascalCase: `CardFace`, `HeatMeter`, `WildCardOverlay` |
| CSS classes (Tailwind) | Standard utility classes, no custom class names unless necessary |
| Animation variants | camelCase object keys: `{ hidden, visible, exit }` |
| Color tokens | CSS variables: `--color-accent`, `--color-surface`, etc. |
| Spacing | Use Tailwind spacing scale only, no magic numbers |

---

## Assets Needed (To Be Created)

- [ ] App logo / wordmark (SVG)
- [ ] App icon (512×512 PNG for PWA manifest)
- [ ] Card back pattern (SVG, tileable)
- [ ] 8 default user avatars (illustrated, colorful, diverse)
- [ ] Wild card icons (9 types — SVG or emoji-style illustration)
- [ ] Coin icon (SVG)
- [ ] Empty state illustrations (4 screens)
- [ ] Favicon

---

*Design Plan v1.0 — Drinking Game Webapp*
