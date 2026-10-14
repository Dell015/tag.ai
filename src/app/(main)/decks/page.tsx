'use client';
import { Screen } from '@/components/ui';
import { GAME_MODES } from '@/lib/game/game-modes';
import { useProfileStore } from '@/stores/profile-store';
import type { GameMode } from '@/types/game';

const MODES: GameMode[] = ['icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family'];
const PACKS = [
  { e: '🎤', n: 'Videoke Night', d: 'Sing-or-drink dares', c: 25 },
  { e: '🌴', n: 'Outing Edition', d: 'Beach and roadtrip cards', c: 25 },
  { e: '💼', n: 'Office Party', d: 'Safe-for-HR chaos', c: 40 },
];

export default function DecksPage() {
  const coins = useProfileStore((s) => s.profile?.coins ?? 0);
  return (
    <Screen title="Decks">
      <h2 className="mb-3 text-xl font-bold">Included</h2>
      <ul className="space-y-3">
        {MODES.map((k) => (
          <li key={k} data-mode={k} className="flex items-center gap-4 rounded-card bg-surface p-4 ring-1 ring-white/10">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gradient text-3xl">{GAME_MODES[k].emoji}</span>
            <div><div className="text-xl font-extrabold">{GAME_MODES[k].name}</div><div className="text-sm text-muted">{GAME_MODES[k].description}</div></div>
          </li>
        ))}
      </ul>
      <h2 className="mb-1 mt-8 text-xl font-bold">Premium packs</h2>
      <p className="mb-3 text-muted">You have 🪙 {coins}. Packs arrive in a future update.</p>
      <ul className="space-y-3">
        {PACKS.map((p) => (
          <li key={p.n} className="flex items-center gap-4 rounded-card bg-surface/60 p-4 opacity-80 ring-1 ring-white/10">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wild/30 text-3xl">{p.e}</span>
            <div className="flex-1"><div className="text-xl font-extrabold">{p.n}</div><div className="text-sm text-muted">{p.d}</div></div>
            <span className="rounded-full bg-elevated px-3 py-1.5 text-sm font-bold">🔒 {p.c}</span>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
