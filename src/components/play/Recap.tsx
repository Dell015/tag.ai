'use client';
import { Button } from '@/components/ui';
import { GAME_MODES } from '@/lib/game/game-modes';
import type { GameMode } from '@/types/game';

export function Recap({ mode, played, skipped, hearted, peak, onAgain, onHome }: {
  mode: GameMode; played: number; skipped: number; hearted: number; peak: number; onAgain: () => void; onHome: () => void;
}) {
  const stats = [
    { v: played, l: 'cards played', e: '🃏' },
    { v: skipped, l: 'skipped', e: '⏭' },
    { v: hearted, l: 'saved', e: '❤️' },
    { v: peak.toFixed(1), l: 'peak heat', e: '🔥' },
  ];
  return (
    <div className="flex min-h-dvh flex-col px-4 pb-6 safe-top safe-bottom">
      <div className="mt-10 text-center">
        <div className="text-7xl">🍻</div>
        <h1 className="mt-3 font-display text-5xl font-extrabold">That&apos;s a wrap!</h1>
        <p className="mt-2 text-lg text-muted">{GAME_MODES[mode].emoji} {GAME_MODES[mode].name} mode</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.l} className="rounded-card bg-surface p-4 ring-1 ring-white/10">
            <div className="text-3xl font-extrabold">{s.e} {s.v}</div>
            <div className="text-muted">{s.l}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-muted">Saved cards are in your Saved tab. Get home safe. 🚕</p>
      <div className="mt-auto space-y-3 pt-8">
        <Button size="lg" full onClick={onAgain}>Play again</Button>
        <Button variant="secondary" full onClick={onHome}>Back home</Button>
      </div>
    </div>
  );
}
