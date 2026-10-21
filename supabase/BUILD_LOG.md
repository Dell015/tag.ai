# Database build log

Built 2026-10-22 by Claude through the Supabase connector, in project **tag.ai** (ref `mqdwmrokvtvtexaecqdv`). The earlier project (acoiufjazugecoikegmy) is not used.

## What was applied (in order)
| Migration | File | Content |
|---|---|---|
| 002a_core_tables | `migrations/002_stage_b_core.sql` (part 1) | tables, triggers, weekly view, shop tables |
| 002b_functions | same file (part 2) | spend_coins, refund_coins, buy_shop_item, equip_item, complete_profile, confirm_adult, approve_suggestion, reject_suggestion, retire_cards |
| 002c_rls_and_grants | same file (part 3) | RLS on every table, column grants, function privileges |
| 002d_indexes_and_shop_policy | `migrations/003_indexes_and_shop_policy.sql` | FK indexes, shop policy without is_admin for signed-out users |

Data (run through the SQL tool from `seed/002_stage_b_seed.sql`, plus a starter `blocked_words` list of 17 words): 10 decks, 353 cards (143 adult, 1 retired), 109 topics, 21 shop items. Counts checked after loading.

## Fixes made to Kiro's draft before applying
Username check letters, numbers, underscore only; `public_profiles` and the private helper only for signed-in users; wider phone number rule; suggestion kinds limited to truth and dare; profiles update only the `settings` column; new tables, sequences and functions closed by default; added `complete_profile` and `confirm_adult`.

## Checks (tests/spec_checks.sql, run 2026-10-22): 13 of 13 pass
Welcome gift, coins not writable, ledger not writable, settings writable, pending suggestions private, no self approval, adult cards hidden until confirmed, overspend fails and changes nothing, refund cap, shop buy once, suggestion rules, 5 a day limit, no self like. Concurrency check 6 (two connections at once) is not run yet.

## Advisors
Security: no errors. Warnings are the app functions that signed-in users are meant to call, and leaked password protection (not relevant while sign in is a one-time email code; turn it on if passwords are ever added). Performance: FK indexes added; unused index notices are normal on an empty database.

## Open
- Two fake test users (`check-a@example.test`, `check-b@example.test`) remain until `manual/delete_test_users.sql` is run.
- Admin row: `manual/insert_admin.sql` after the owner signs in once.
- Auth settings in the dashboard (email provider, redirect URLs) are not set yet.
- The two real accounts that existed before got profiles and the 10 coin welcome row by hand.
- Payments are the last milestone (owner 2026-10-22).
