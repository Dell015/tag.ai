---
inclusion: always
---

# Tag.ai steering

Before doing anything, read `CLAUDE.md` at the repository root. It is the single source of truth for product intent, current status, known bugs, decisions, UI direction (§7) and conventions (§8). It overrides `about_tagai.md`, `build_plan.md`, `design_plan.md` and older Kiro specs.

Rules:
- We are in Stage A: rebuild the entire frontend against a mock data layer. Do not wire Supabase yet.
- Keep `src/lib/game/*` pure and tested. Do not change its behavior without updating tests.
- UI must follow the "drunk-proof UX rules" in CLAUDE.md §7 (huge tap targets, large text, button alternatives to gestures, undo, minimal reading).
- Finish every task with `npm run lint`, `npm test` and `npm run build` passing, and update CLAUDE.md §2/§3/§11.
