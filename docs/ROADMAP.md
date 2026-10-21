# Roadmap: from today to telling someone to try it

Written 2026-10-22. Order matters: each step unlocks the next. Update this file when a step is done.

## The short answer

- **You can let friends try it before the database and before payments.** The drinking game and the Topic deck run on one phone and need no server. Put it on Vercel, give friends a link, give them free coins. That is **Milestone 1** and it is a few days of work.
- **Payments come after the database**, because a payment must credit coins on a server that players cannot edit. They do not come last: they come before a public launch, not before friends try it.

## Milestone 1: Friends alpha (tell 5 to 10 friends)

Goal: real people on real phones at a real table, free coins, no accounts.

1. Fix the "Must fix before telling friends" list in `docs/QA_2026-10-22.md` (security upgrade, real legal text, real-phone test, recap check, feedback link). Seven small QA issues were already fixed on 2026-10-22.
2. Upgrade Next.js (`npm audit` reports a critical issue in Next 14.2.35, fix is a major upgrade) and re-run lint, tests and build.
3. Fix the small tap targets and low-contrast labels from the QA list. (Pinch zoom was unlocked on 2026-10-22.)
4. Deploy to Vercel (project `tag-ai` exists). Set the real production URL in `CLAUDE.md` section 9.
5. Add a way for testers to tell you what broke: a "Send feedback" link in Me that opens a Google Form or WhatsApp/Messenger chat.
6. Replace the draft Terms and Privacy text with a plain honest version (what stays on the phone, no data collected yet). Keep the 18+ and "drink responsibly" lines.
7. Test on three real phones: an iPhone (Safari), a mid-range Android (Chrome), and a low-end Android. Play one full 30 minute game each.

Done when: five friends played a full game and you collected their feedback.

## Milestone 2: Database and accounts

Goal: real accounts, coins nobody can edit, a shared card library, and suggestions you can review.

1. Kiro builds the database from `docs/DATABASE_SPEC.md` (only touches `supabase/`). You review the SQL and run the six checks at the bottom of the spec.
2. Claude wires the app to it: sign in (email first), profile, coins through the server functions, cards loaded from the database, suggestions and likes.
3. Admin screen in the app: approve or reject suggested cards, handle reports, retire cards, edit the blocked-word list. Also the Adult card review you wanted.
4. Move the Next.js API routes that need secrets onto the server only; confirm no secret is in the browser bundle.
5. Migrate friends from alpha: their local coins and saved cards import once on first sign in (or reset, your call).

Done when: two phones on different accounts see the same suggestions, an edited local balance does nothing, and you can approve a card from the admin screen.

## Milestone 3: Payments (PayMongo)

See "How you receive payments" below. Steps:

1. Register the business: DTI Certificate of Business Name Registration and BIR Certificate of Registration (Form 2303). Ask an accountant how to register and what taxes apply to you.
2. Open and activate a PayMongo account (government ID, DTI, BIR 2303).
3. Build checkout in test mode: a server route creates a PayMongo Checkout Session for a coin package, the player pays on PayMongo's page, a **webhook** tells your server, and the server credits the coins. The app never credits coins from the browser.
4. Make credits safe: the webhook is verified, a payment id can only credit once, failed and cancelled payments credit nothing, refunds take coins back.
5. Write a refund and support policy (what happens if coins are bought by mistake), and put it in the Terms.
6. Go through PayMongo's go-live checklist, do one small real payment per method, refund it, confirm the records match.

Done when: you pay ₱20 with GCash on your own phone and 20 coins appear, and a refund removes them.

## Milestone 4: Public beta

1. Real offline support (a service worker; today the app shows an offline banner but does not cache pages).
2. Error monitoring (Sentry or similar) and basic privacy-friendly analytics so you can see where players quit.
3. Backups on in Supabase, rate limits on sign in and suggestions.
4. Final Terms and Privacy reviewed by a lawyer who knows Philippine rules (Data Privacy Act, online content, minors and alcohol, coins and e-money; see "Legal checks").
5. Data deletion: a "Delete my account" button that really deletes.
6. Content pass: review all Adult cards with the admin screen; keep the hard limits in `docs/CARD_GUIDE.md`.
7. Your own domain, social preview image, a landing page that explains the game in one screen.
8. Support channel (an email or Messenger page) written in the app.

## Milestone 5: Launch and growth

Content (Life and Deep decks, Social media deck, "Why?" cards, new card types), a weekly suggestions highlight, referral, B2B bar sessions, optional native app wrappers. Do these after real players tell you what they want.

## How you receive payments

**Recommended: PayMongo.** A Philippine payment gateway that gives you GCash, Maya, QR Ph and cards through one integration, with a hosted checkout page (you never touch card numbers).

Fees as listed on PayMongo's site (percentages exclude VAT; check the live rate card before you commit, the card fee was listed two different ways):

| Method | Fee |
|---|---|
| QR Ph | 1.3% |
| Maya | 1.79% |
| GCash | 2.23% |
| Cards | about 3.1% to 3.5% plus a fixed ₱13 to ₱15 |

What that means for your packs (₱20, ₱49, ₱99, ₱199): on GCash the fee is about ₱0.45 on ₱20, which is fine. On a card, the fixed fee alone eats about 70% of a ₱20 pack and 30% of a ₱49 pack. **Offer GCash, Maya and QR Ph only at first, no cards.** It is also less work (no card security rules).

What you need: DTI business name registration, BIR certificate (Form 2303), a government ID, and a bank or wallet to receive payouts. You do not need a company (SEC); a sole proprietorship is enough to start.

Alternatives if PayMongo says no: Xendit and Maya Business (similar), HitPay. They need the same kind of documents.

**Not recommended:** asking people to send GCash to your personal number and adding coins by hand. It works for a test with two friends, but it is slow, easy to abuse, mixes personal and business money, and may break the wallet's rules for business use.

**Native app stores:** because this is a web app (PWA), payments go straight to you and no store takes a cut. If you later wrap it as an iPhone or Android app, Apple and Google require their own in-app purchase for digital goods like coins, with a 15% to 30% cut. That is another reason to stay a web app for now.

## Legal checks (ask a lawyer, I am not one)

- **Coins as money:** coins you sell should be non-refundable by default, not withdrawable, not transferable between players, and only spendable in the app. That keeps them closer to app credits than to e-money, which the Bangko Sentral regulates. Confirm this with a lawyer before you sell coins publicly.
- **Alcohol:** 18+ gate, drink responsibly line, and the option to play without drinking are already in the app. Keep them. Avoid wording that pushes people to drink more.
- **Suggested cards:** review before publishing, no real names, no slurs (see the suggestions notes in `CLAUDE.md` D36).
- **Privacy:** the Data Privacy Act applies as soon as you store emails and names. Tell people what you keep, why, and how to delete it.
- **Taxes:** ask an accountant about VAT or percentage tax and receipts.

