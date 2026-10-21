# Kiro prompt: build the tag.ai database

Paste everything below the line into Kiro as one message. Written 2026-10-22.

---

You are building the Supabase database for tag.ai, a Filipino drinking-game web app. The frontend is finished and must not be touched. Your only job is the database, and the owner must be able to read exactly what you did. Follow this prompt literally. Where it says STOP, stop and wait for the owner.

## 0. Read first, in this order

1. `docs/DATABASE_SPEC.md` is the specification. It is the source of truth for tables, columns, rules, functions and checks. Do not redesign it.
2. `CLAUDE.md` sections 3 (decisions D20, D30, D36, D37) and 8 (conventions) for context only.
3. `supabase/migrations/001_initial_schema.sql` is **outdated**. Read it to understand what is there. Never run it, never edit it, never delete it.
4. `src/lib/data/shop-catalogue.ts`, `src/lib/game/decks.ts` and the card data files (`src/lib/data/cards.ts`, `tool-cards.ts`, `adult-cards.ts`, `talk-topics.ts`) are **read only** sources for seed data.

After reading, write one short paragraph in `supabase/BUILD_LOG.md` saying what you understood the job to be. Then continue.

## 1. Hard limits (a violation means the task failed)

You may create or edit ONLY:
- `supabase/**` (migrations, seed, scripts, tests, docs, generated types)
- `docs/DATABASE_SPEC.md`, and only by appending a section named `## Built` at the very end, and only by adding to it. Never change any other line of that file.

You must NOT create, edit, move or delete anything else. Specifically never touch: `src/**`, `public/**`, `package.json`, `package-lock.json`, `next.config.*`, `tailwind.config.*`, `tsconfig.json`, any `.env*` file, `CLAUDE.md`, `about_tagai.md`, `.kiro/**`, or any other file in `docs/`.

Never do any of these:
- Put the `service_role` key, a database password, or any secret in a file, in chat, or in SQL.
- Create or edit `.env.local`. The owner does that.
- Run any SQL against a project other than the one in section 2.
- Run destructive SQL (`drop`, `truncate`, `delete` without a `where`, `alter ... drop`) on anything you did not create in this task. If a migration needs it, STOP and ask.
- Change card ids, topic ids or deck ids from the source files. Saved cards on players' phones depend on them.
- Invent product rules. If the spec does not say, see section 7.

## 2. Target project

- Supabase project URL: `https://acoiufjazugecoikegmy.supabase.co` (project ref `acoiufjazugecoikegmy`).
- Before running anything, confirm you are connected to exactly this project ref. If your tools show a different ref or several projects, STOP and tell the owner. Do not "pick the closest one".
- If you do not have direct database access, you work in **file mode**: write the SQL files and tell the owner to run them in order in the Supabase SQL Editor. In file mode you cannot verify, so you must write the verification SQL (section 5) and the owner pastes back the results.

## 3. How you work (strict process)

Work in numbered steps, in this order. Do one step at a time. After each step, do all four things before starting the next:

1. **Show** the SQL you are about to run (or the file you wrote).
2. **Run or hand over** that one file. Never combine two steps in one run.
3. **Verify** it with a query (for example list the tables, or call the function) and write the real result in `supabase/BUILD_LOG.md`.
4. **Log** the step (format in section 6).

If any step fails: do not try random fixes in a loop. Write the exact error in `BUILD_LOG.md`, fix the file once, re-run once. If it fails again, STOP and ask the owner.

Migration rules:
- Files go in `supabase/migrations/`, named `002_...sql`, `003_...sql` and so on. Never edit a migration that has already been applied; fix forward with a new numbered file.
- Each file does one job, starts with a comment block saying what it does, and is safe to read top to bottom.
- Use `numeric(10,2)` for coins, never floats. Every table has `created_at timestamptz not null default now()`.
- Every table in `public` gets `alter table ... enable row level security` **in the same file that creates it**. No exceptions.
- Every `security definer` function must have `set search_path = public` (or `''` with fully qualified names), a clear name, and `revoke all on function ... from public, anon; grant execute on function ... to authenticated;` unless it is explicitly meant for a trigger.
- Views must use `security_invoker = true`.
- Add comments (`comment on table`, `comment on function`) with one plain sentence each.

## 4. The steps

**Step 1: Inspect.** List existing tables, enums and functions in `public` and `auth` in the target project. Write the result in `BUILD_LOG.md`. If `public` already has tables, STOP and show the owner before doing anything else.

**Step 2: `002_core_tables.sql`.** Create `profiles`, `transactions`, `admins`, `decks`, `cards`, `talk_topics`, `saved_cards`, `trashed_cards`, `custom_cards`, `suggestions`, `suggestion_likes`, `card_reports`, `blocked_words`, `shop_items`, `owned_items`, exactly as in the spec: names, types, defaults, check constraints, primary and foreign keys, indexes on foreign keys and on `cards(status, deck_id)`, `suggestions(status, created_at)`, `suggestion_likes(suggestion_id)`, `transactions(user_id, created_at)`. Enable RLS on all of them in this file.

**Step 3: `003_auth_trigger.sql`.** A trigger on `auth.users` insert that creates the `profiles` row with a temporary username `player_` plus 6 random lowercase characters, `coins = 0`, and then inserts a `welcome` transaction of 10 coins and sets `profiles.coins = 10`, in the same transaction. Test it by checking the function body; do not create fake users in `auth.users` on the live project.

**Step 4: `004_rls_policies.sql`.** All policies, exactly as the spec says:
- `profiles`: own row read; own row update only through column privileges or functions (the app can never write `coins`, `is_adult_confirmed`); a `public_profiles` view (`id, username, avatar`) readable by authenticated users.
- `transactions`: own rows read only. No insert, update or delete policy for anyone.
- `decks`, `shop_items`, `talk_topics`: readable by authenticated users; writable by admins only.
- `cards`: authenticated users read rows where `status = 'approved'` and (`adult = false` or the user's `is_adult_confirmed`); admins read and write everything.
- `saved_cards`, `trashed_cards`, `custom_cards`, `owned_items`: owner only.
- `suggestions`: insert with `author_id = auth.uid()`; author reads own rows in any status; others read `approved` only; only admins update `status`.
- `suggestion_likes`: insert and delete own rows; cannot like own suggestion.
- `card_reports`: insert own; reporter reads own; admins read and update all.
- `admins`, `blocked_words`: admins only.
- Helper `is_admin()` (security definer, stable, `search_path` set).

**Step 5: `005_functions.sql`.** `spend_coins`, `refund_coins`, `buy_shop_item`, `equip_item`, `complete_profile`, `confirm_adult`, `approve_suggestion`, `reject_suggestion(id, reason)`. Rules:
- `spend_coins` uses a single `update profiles set coins = coins - amount where id = auth.uid() and coins >= amount` (so two simultaneous calls cannot overdraw), writes the ledger row with a negative amount in the same transaction, and raises a clear error `not_enough_coins` when it fails. `amount` must be greater than 0.
- `refund_coins` cannot refund more than the user spent on `pot` rows in the last 24 hours minus refunds already made in that window.
- `complete_profile` validates the username (2 to 16 chars, `^[A-Za-z0-9_]+$`, unique case-insensitive) and avatar (`^c[0-9]$`).
- `approve_suggestion` is admin only and copies the row into `cards` with `source = 'suggestion'`, `status = 'approved'`, a new id `sug-` plus a short unique string.

**Step 6: `006_triggers_and_views.sql`.** On `suggestions` insert: enforce 15 to 160 characters, at most 5 per rolling 24 hours per author, no phone number pattern, no `http` link, no word from `blocked_words` (whole word, case-insensitive), no exact duplicate (lowercase, spaces collapsed). The view `weekly_contributors` exactly as the spec says (weeks start Monday 00:00 `Asia/Manila`, 1 point per approved card, 2 per like from another user, no coin payout).

**Step 7: `007_seed_reference.sql`.** Seed `decks` (ids, names, blurbs, prices 0.1 / 0.1 / 0.1 / 0.2 / 0.2 / 0.2 / 0.3 / 0.5 / 0.3 / 0.5 in the order icebreaker, family, life, deep, barkada, lovers, spicy, adult, social, chaos; `social` has `ready = false`) taken from `src/lib/game/decks.ts`, and `shop_items` from `src/lib/data/shop-catalogue.ts`. Also a short starter list in `blocked_words` (common slurs and the words "kill yourself"; the owner will extend it). Use `insert ... on conflict do nothing` so the file can be re-run.

**Step 8: card seed.** Write a Node script `supabase/tools/generate-seed.mjs` that **reads** the card and topic data files and prints SQL inserts to `supabase/seed/010_cards.sql` and `supabase/seed/011_talk_topics.sql`. The script must not modify `src/`. Keep every id exactly. Retired cards (the seed marks them with a final `false`) get `status = 'retired'`. Adult cards get `adult = true`. Run the script, then apply the generated files, then verify counts: report the number of cards per deck and per status, and the number of topics, and compare them with the source files. They must match. If the script cannot run on your setup, write the SQL by hand in chunks and state clearly that it was by hand.

**Step 9: `manual/insert_admin.sql`.** A file with one commented template line that inserts the owner into `admins`, using a placeholder `ADMIN_EMAIL` that you do **not** fill in. The owner signs up once, then runs this file with their own email. Do not guess the email.

**Step 10: tests.** Write `supabase/tests/checks.sql` containing the six checks from the end of `docs/DATABASE_SPEC.md`, each as runnable SQL wrapped in a transaction that rolls back, impersonating a normal user (`set local role authenticated; set local request.jwt.claims ...`) and an admin where needed. Each check prints `PASS` or `FAIL: reason`. Run them (or hand them to the owner) and log the actual output. Then run the Supabase security advisor if you have access (security and performance) and log every warning; fix the ones that are real.

**Step 11: types.** If you have the tool, generate TypeScript types into `supabase/types/database.ts` (not into `src/`). Note in `BUILD_LOG.md` that the owner or Claude will copy them into the app later.

**Step 12: documentation and handover.** Finish `supabase/README.md`, `supabase/BUILD_LOG.md` and the `## Built` section of the spec (section 6). Then post the final report (section 8) and STOP.

## 5. Verification you must be able to show

For every table: that RLS is enabled (`select relname, relrowsecurity from pg_class ...`). For every policy: listed from `pg_policies`. For every function: `security definer`, `search_path`, and who can execute it. For the data: row counts. For the six spec checks: PASS/FAIL output. Paste the real output into `BUILD_LOG.md`. Do not write "should work", write what you saw.

## 6. Documentation you must produce

**`supabase/BUILD_LOG.md`** (append only, newest at the bottom). One entry per step in exactly this format:

```
### Step N: <name>   [DONE | FAILED | BLOCKED]
- Date and time:
- Files created or changed:
- What it does (one or two plain sentences):
- How it was applied: (run on project acoiufjazugecoikegmy via <tool> | handed to owner)
- Verification run and real result:
- Deviations from DATABASE_SPEC.md (or "none") and why:
- Anything the owner must do next:
```

Plus two sections at the bottom that you keep up to date: `## Deviations` (every place you did not follow the spec, with the reason; an empty section must say "none") and `## Questions for the owner` (every point you were unsure about, each with the safest default you used or "blocked").

**`supabase/README.md`**: what is in the folder, the exact order to apply files, how to re-run seeds, how to run `tests/checks.sql`, how to add an admin, and a table listing every table, view and function with one plain sentence each.

**`## Built` at the end of `docs/DATABASE_SPEC.md`**: a short list of what exists now (tables, functions, views, seeds with counts), the date, and a note of anything outside `supabase/` that needs a change by the owner or Claude (for example types to copy into `src/types/`, or environment variables). Do not do those changes yourself.

## 7. When something is unclear

Do not guess and do not invent product rules. Pick the safest option (the stricter security rule, the smaller permission, the reversible action), write it under `## Questions for the owner` in `BUILD_LOG.md`, and continue with steps that do not depend on it. If a step cannot continue without an answer, mark it `BLOCKED` and STOP.

## 8. Definition of done and final report

The task is done only when all of these are true:
- Steps 1 to 12 are logged `DONE`, or the blocked ones are listed with what is needed.
- RLS is on for every table in `public`.
- The six checks print PASS in the log (or the owner has the file and the failing ones are listed).
- The security advisor shows no "RLS disabled" and no "security definer view" warning, or each remaining warning is explained in the log.
- Row counts of decks, cards, topics and shop items match the source files and are written in the log.
- `git status` (or the owner's list of changed files) shows changes **only** under `supabase/` plus the appended `## Built` section in `docs/DATABASE_SPEC.md`.
- No secret appears in any file.

Your last message must contain exactly these parts, in this order, and nothing else:
1. **Result:** DONE, PARTLY DONE or BLOCKED, in one line.
2. **Files changed:** the complete list of paths.
3. **What now exists in the database:** tables, functions, views, with row counts.
4. **Check results:** the six PASS/FAIL lines and the advisor summary.
5. **Deviations from the spec:** the list, or "none".
6. **Questions for the owner:** the list, or "none".
7. **What the owner must do next:** for example sign up once, then run `manual/insert_admin.sql` with their email, and copy the project URL and public key into `.env.local`.

Do not say "done" unless section 8 is true. If you are unsure whether something is true, say so and show the evidence.
