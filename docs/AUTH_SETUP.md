# Sign in setup (Supabase dashboard)

The app signs players in with an **email code** (no passwords). The code is written, but three dashboard settings are needed before it works for real. Project: tag.ai (`mqdwmrokvtvtexaecqdv`).

## 1. Make the email show a code (required)
Dashboard, Authentication, Email Templates. Edit **Magic Link** and **Confirm signup** so the body contains the code:

```
<h2>Your tag.ai code</h2>
<p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
```
Without `{{ .Token }}` the email only has a link and the app's code screen has nothing to type. The code is 6 digits by default (the app accepts 6 to 8).

## 2. Use your own email sender (required before friends test)
Supabase's built-in sender is for trying things out and allows only a couple of emails per hour. Authentication, Emails, SMTP Settings: connect a sender such as Resend (free plan is enough). Then raise the email rate limit under Authentication, Rate Limits.

## 3. Site URL
Authentication, URL Configuration: Site URL = your Vercel address (or `http://localhost:3000` while testing). Add `http://localhost:3000` to the redirect list too.

## Also
- Leaked password protection (advisor warning) does not matter while there are no passwords.
- Never put the `service_role` key in `.env.local` or any `NEXT_PUBLIC_` variable.

## What happens on first sign in
1. Player enters email, gets a code, enters it.
2. The database creates the profile and the 10 coin welcome gift (trigger).
3. The app asks for a nickname and colour and saves them with `complete_profile`.
4. After that, coins, shop items, saved and trashed cards come from the server. Players who used the app before accounts start fresh (their old local coins are not imported).
