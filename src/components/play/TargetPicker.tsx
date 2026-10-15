'use client';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

/** For wild cards that name a player. Tap a name, or let the phone choose. */
export function TargetPicker({ players }: { players: { id: string; name: string }[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (id: string) => { haptic('success'); setPicked(id); };
  const random = () => pick(players[Math.floor(Math.random() * players.length)].id);
  return (
    <div className="mt-5" onPointerDownCapture={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <button key={p.id} onClick={() => pick(p.id)} aria-pressed={picked === p.id}
            className={cn('min-h-tap rounded-full border-2 px-5 text-lg font-extrabold', picked === p.id ? 'border-bg bg-bg text-text' : 'border-bg/40 text-bg')}>
            {p.name}
          </button>
        ))}
        <button onClick={random} className="min-h-tap rounded-full border-2 border-dashed border-bg/60 px-5 text-lg font-extrabold text-bg">Pick for me</button>
      </div>
    </div>
  );
}
