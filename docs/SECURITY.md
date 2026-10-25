# tag.ai security notes (2026-10-26)

For the owner and anyone testing the app. Everything here was checked on the live Supabase project (`mqdwmrokvtvtexaecqdv`) unless it says otherwise.

## What protects what

| Threat | Protection |
|---|---|
| SQL injection | The app never builds SQL. It calls Supabase through the API and named database functions with typed parameters. Functions use fixed `search_path` and no dynamic SQL. |
| Changing your own coins or role | The `anon` and `authenticated` roles have no INSERT, UPDATE or DELETE on `profiles`, `transactions`, `owned_items`, `messages`, `admins`. Coins only move through functions that write the ledger. Checked: a direct update and a direct ledger insert both fail with permission denied. |
| Reading other people's data | Row level security is on for every table. Profiles, transactions, owned items, messages, stacks, saved cards: own rows only (admins excepted). Anonymous users cannot read profiles or call the coin functions. |
| Calling admin functions | Every admin function checks `is_admin()` inside. Checked: a normal player calling `admin_give_coins` and `admin_complete_payment` gets "Admins only". |
| Coin printing by refund | `refund_coins` cannot refund more than the pot the player spent in the last 24 hours. |
| Double crediting a payment | `admin_complete_payment` locks the row and only works while it is `pending`. |
| Client chooses the price | Coin package price and coins come from the `coin_packages` table, never from the browser. |
| Brute force passwords | Supabase Auth rate limits per IP (server side), plus a lock on the device after 5 wrong tries for 60 seconds. |
| XSS | React escapes all text. No `dangerouslySetInnerHTML` anywhere. Content Security Policy only allows scripts from the site itself. |
| Clickjacking, MIME sniffing, downgrade | `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, HSTS for 2 years. |
| Uploads | Profile photos: JPEG only, 200 KB, only into the player's own folder (storage rules checked). |
| Unused endpoint | `/api/sessions` now answers 410 and does nothing. |
| Receipt uploads | Private bucket, JPEG only (re-encoded in the browser), 1 MB, only into the player's own folder, readable only by admins through a 2 minute signed link. The database checks the file name belongs to that player and request. |
| Spam | Posts: 5 a day, blocked words, duplicate check. Cheers: 30 a day. Payment requests: 3 waiting, 10 a day. |

## Things only the owner can switch on (Supabase dashboard)

1. **Authentication, Attack protection:** turn on CAPTCHA (Cloudflare Turnstile is free). This stops bots making accounts and guessing passwords.
2. **Authentication, Providers, Email:** minimum password length 8 or more, and turn on **Leaked password protection** (may need the Pro plan). Supabase flags this as a warning.
3. **Authentication, Rate limits:** keep the defaults or lower sign-ups per hour.
4. **Confirm email is OFF for the closed beta.** That means anyone can sign up with someone else's email and get the welcome coins. Before public launch, verify the domain in Resend and turn Confirm email back on.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` out of the app and out of Vercel public variables. The app only uses the public anon key, which is safe to expose because of the rules above.
6. Turn on two step verification on GitHub, Vercel, Supabase, Google and the bank or GCash account that receives payments.

## Known weak spots (be honest with testers)

- **Welcome coins farming.** With Confirm email off, one person can make many accounts and collect the welcome gift each time. Fine for a friends beta. Before launch: verify email, or give the gift only after a first game.
- **Next.js 14.** `npm audit` lists advisories that are fixed only in Next 16 (image optimizer, server component DoS, rewrites). The app does not use remote images, rewrites or server actions, and Vercel sits in front of it. Plan an upgrade to the current Next major before public launch.
- **No real time abuse detection** (many failed logins across many IPs). Turnstile helps most here.
- **Terms and Privacy** are drafts. Get a lawyer to read them before launch.

## How a tester can try to break it

Sign up, copy the access token from local storage, then call the REST API with it:

- `PATCH /rest/v1/profiles?id=eq.<you>` with `{"coins":99999}` should fail (permission denied).
- `POST /rest/v1/transactions` should fail.
- `POST /rest/v1/rpc/admin_give_coins` should fail with "Admins only".
- `POST /rest/v1/rpc/spend_coins` with a negative amount should fail.
- `GET /rest/v1/profiles` as anonymous should fail.
- Upload a non JPEG, a big file, or into another user's folder: should fail.
- Put `<script>` in a nickname or a post: shown as plain text.
