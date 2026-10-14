'use client';
import { Screen } from '@/components/ui';
import { GAME_MODES } from '@/lib/game/game-modes';
import { useProfileStore } from '@/stores/profile-store';
import type { GameMode } from '@/types/game';

const MODES: GameMode[] = ['icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family'];
const PACKS = [
  { n: 'Videoke night', d: 'Sing-or-drink dares', c: 25 },
  { n: 'Outing edition', d: 'Beach and road trip cards', c: 25 },
  { n: 'Office party', d: 'Safe-for-HR chaos', c: 40 },
];

export default function DecksPage() {
  const coins = useProfileStore((s) => s.profile?.coins ?? 0);
  return (
    <Screen title="Decks">
      <ul className="grid grid-cols-2 gap-3">
        {MODES.map((k) => (
          <li key={k} data-mode={k} className="flex min-h-[9rem] flex-col justify-between rounded-card bg-accent p-4 text-onaccent">
            <span className="display text-4xl">{GAME_MODES[k].name}</span>
            <span className="text-base font-semibold leading-snug">{GAME_MODES[k].audienceTag}</span>
          </li>
        ))}
      </ul>
      <h2 className="mb-1 mt-10 text-4xl">Premium packs</h2>
      <p className="mb-2 text-lg text-muted">You have {coins} coins. Packs arrive in a later update.</p>
      <ul>
        {PACKS.map((p) => (
          <li key={p.n} className="flex items-center gap-3 border-b-2 border-line/60 py-4 opacity-70">
            <div className="flex-1"><div className="display text-3xl">{p.n}</div><div className="text-base text-muted">{p.d}</div></div>
            <span className="flex items-center gap-1.5 rounded-full border-2 border-line px-3 py-1.5 text-base font-extrabold">{p.c} coins</span>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
