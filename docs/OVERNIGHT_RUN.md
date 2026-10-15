# Overnight run: frontend, 03:40 to 05:00 (Asia/Manila)

Authority: the owner approved this run in one prompt (see "Approval" at the bottom). Work autonomously until 05:00 without asking questions. This file plus `docs/FRONTEND_PLAN.md` is the whole brief.

## Operating rules

1. Check the time with the current-time tool at the start of each milestone. Do not start a new milestone after 04:45. At 04:50 stop building, verify, sync, and write the summary. Finish by 05:00.
2. One task list, one item per milestone. Mark complete only after the milestone checklist passes (lint, tests, build, browser walkthrough with screenshots reviewed at 390x800, no emoji or em dash in UI).
3. Deliver by writing changed files directly into the owner's folder (`C:\Users\Randel\CODE SHI\VSCODE IDE\tag.ai`) after each milestone, so the owner can watch progress. No git or patch instructions to the owner. Local commits in the scratch repo are fine; never push.
4. Never touch `package.json` or `package-lock.json` unless a milestone truly needs a dependency. Prefer no new dependencies (use WebAudio, canvas, the platform share API).
5. Design rules in `docs/FRONTEND_PLAN.md` section 3 and `CLAUDE.md` section 7 are non-negotiable.
6. If a milestone is running long, cut scope in this order: polish, tests beyond pure logic, secondary screens. Always leave the app working and never half-wired.
7. Update `CLAUDE.md` section 11 and section 2 status at the end. Record every decision below in `CLAUDE.md` section 3.
8. If something is ambiguous and not covered, choose the option that is simplest, reversible and consistent with the plan, and note it in the final summary.

## Order and time boxes (roughly 10 to 12 minutes each)

| Time | Milestone | Why this order |
|---|---|---|
| 03:40 | F1 Shell, nav, shared components | Everything else needs them |
| 03:52 | F2 Settings and Me hub | Settings change behaviour used by later screens |
| 04:04 | F3 Wallet and coin pot | Shop and play depend on coins |
| 04:15 | F4 Shop and cosmetics | Largest visible owner ask |
| 04:26 | F5 Play depth: tools, wild interactions, pause menu rows | Core game feel |
| 04:36 | F6 Library: Saved and My decks, deck editor | Needed for decks in setup |
| 04:45 | Stop starting new milestones. Cheap wins only: F9 help/FAQ/legal/age gate, F8 recap upgrades, in that order, whatever fits |
| 04:50 | Final verification, full-game browser run, sync, summary |

Expected: F1 to F6 done, parts of F9 and F8. F7 (Discover, leaderboard, referral) and F10 (polish, jsdom tests, sound) are the next session if time runs out.

## Decisions already made (obvious parts)

- UI language English. Filipino strings later.
- Sound: build the `lib/sound.ts` wrapper with WebAudio-generated blips (no asset files), off by default.
- Terms and Privacy: clearly marked draft placeholders.
- "Add to Home Screen" prompt after the first finished game, max twice.
- Guests have no wallet; the host pays for them and can mark a guest as "paid in cash" (host's wallet funds the pot either way).
- Discover, leaderboard and referral use clearly labelled sample data (F7, only if time allows).
- Deck colours, shop item art: flat colour blocks and type only, no illustrations.
- Heat up costs 2 coins from the pot, cool down is free.
- Minimum pot 3 coins, wild cards free, card costs per `FRONTEND_PLAN.md` 6.2.
- Settings defaults per `FRONTEND_PLAN.md` section 5.
- Tabs: Play, Library, Shop, Me.
- Test purchases toggle exists (hidden, tap version 5 times) so the shop can be exercised.

## Decisions taken from the owner at approval

Filled in when the owner answers (see CLAUDE.md section 3 afterwards):

- Pot required or free play: Pot required.
- Shop tools and packs paid with coins: Yes, the proposed catalogue.
- Social features visible as "Sample" or hidden: Visible, labelled Sample.
- Scope: Full run until 05:00. Result: F1 to F6 plus most of F7 to F9 done by 04:20.

## Final deliverable at 05:00

A short message to the owner: what was built per milestone, what was cut, anything that needs their decision, how to run it (`npm install` only if dependencies changed, otherwise `npm run dev`). No git instructions.

## Sync rule (learned during the run)
The device tools can write files but cannot delete or move them. Never delete or relocate a file that already exists in the owner's folder. If a route or file is retired, overwrite it in place with a small redirect or stub so the folder never keeps a conflicting stale copy.
