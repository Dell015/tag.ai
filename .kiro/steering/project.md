---
inclusion: always
---

# Tag.ai steering

Before doing anything, read `CLAUDE.md` at the repository root. It is the single source of truth for product intent, current status, known bugs, decisions, UI direction (§7) and conventions (§8). It overrides `about_tagai.md`, `build_plan.md`, `design_plan.md` and older Kiro specs.

Rules:
- Stage A (frontend on a mock data layer) is finished. **We are starting Stage B (2026-10-22): the database.** Build it exactly as `docs/DATABASE_SPEC.md` says. Do not run `supabase/migrations/001_initial_schema.sql` (outdated). Do not change the frontend stores until the owner says the database is ready; never put the service_role key in the app.
- Keep `src/lib/game/*` pure and tested. Do not change its behavior without updating tests.
- UI must follow the "drunk-proof UX rules" in CLAUDE.md §7 (huge tap targets, large text, button alternatives to gestures, undo, minimal reading).
- Finish every task with `npm run lint`, `npm test` and `npm run build` passing, and update CLAUDE.md §2/§3/§11.

## Database task: hard limits (2026-10-22)

While doing the Stage B database task, you may create or edit ONLY these paths:
- `supabase/**` (migrations, seed, config)
- `docs/DATABASE_SPEC.md` (only to add a short "Built" section at the bottom saying what you created)

You must NOT create, edit, move or delete anything else. In particular, never touch:
- `src/**` (all pages, components, stores, hooks, lib, types, styles), `public/**`
- `package.json`, `package-lock.json`, `next.config.*`, `tailwind.config.*`, `tsconfig.json`, `.env*`
- `CLAUDE.md`, `about_tagai.md`, any other file in `docs/`

If the task seems to need a change outside the allowed paths (for example regenerated types in `src/types/supabase.ts`), do not make it. Write it as a note at the bottom of `docs/DATABASE_SPEC.md` and let the owner decide.
