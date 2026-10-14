'use client';
import { Button } from '@/components/ui';
import { GAME_MODES } from '@/lib/game/game-modes';
import type { GameMode } from '@/types/game';

export function Recap({ mode, played, skipped, hearted, peak, onAgain, onHome }: {
  mode: GameMode; played: number; skipped: number; hearted: number; peak: number; onAgain: () => void; onHome: () => void;
}) {
  const stats = [
    { v: String(played), l: 'cards played' },
    { v: String(skipped), l: 'skipped' },
    { v: String(hearted), l: 'saved' },
    { v: peak.toFixed(1), l: 'peak heat' },
  ];
  return (
    <div data-mode={mode} className="flex min-h-dvh flex-col px-4 pb-6 safe-top safe-bottom">
      <div className="mt-6 rounded-card bg-accent p-6 text-onaccent">
        <p className="text-lg font-bold">{GAME_MODES[mode].name} deck</p>
        <h1 className="mt-3 text-[5.5rem] leading-[0.85]">That&apos;s a wrap.</h1>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
        {stats.map((s) => (
          <div key={s.l} className="border-t-2 border-line pt-3">
            <dd className="display text-7xl">{s.v}</dd>
            <dt className="text-lg text-muted">{s.l}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-muted">Saved cards are in the Saved tab. Get home safe.</p>
      <div className="mt-auto space-y-3 pt-8">
        <Button size="lg" full onClick={onAgain}>Play again</Button>
        <Button variant="secondary" full onClick={onHome}>Back home</Button>
      </div>
    </div>
  );
}
