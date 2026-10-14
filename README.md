# tag.ai

A pass-the-phone drinking game for Filipino barkadas. Next.js 14 PWA, Tailwind, Framer Motion, Zustand.

**Read `CLAUDE.md` first** — it is the single source of truth (status, decisions, architecture, roadmap).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Vitest
npm run lint
npm run build
```

Stage A runs entirely in the browser (no backend): profile, rooms and game state live in localStorage. To try multiplayer lobby behaviour, open the room code in a second tab. Supabase wiring is Stage B (`supabase/` + `.env.local.example`).
