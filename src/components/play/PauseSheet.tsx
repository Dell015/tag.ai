'use client';
import { useState } from 'react';
import { Avatar, Button, Sheet } from '@/components/ui';
import type { Room } from '@/lib/data/rooms';
import { DRINK_RULE_TEMPLATES } from '@/components/setup/DrinkRules';

export function PauseSheet({ open, onClose, room, players, heat, onHeat, onRemovePlayer, onEnd }: {
  open: boolean; onClose: () => void; room: Room | null;
  players: { id: string; name: string; avatarUrl: string }[];
  heat: number; onHeat: (delta: number) => void; onRemovePlayer: (id: string) => void; onEnd: () => void;
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const tpl = DRINK_RULE_TEMPLATES.find((t) => t.id === room?.config.drinkRuleTemplate);
  return (
    <Sheet open={open} onClose={() => { setConfirmEnd(false); onClose(); }} title="Paused">
      <Button size="lg" full onClick={onClose}>Resume</Button>

      <h3 className="mb-2 mt-6 text-lg font-bold">Heat <span className="text-muted">({heat.toFixed(1)})</span></h3>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => onHeat(-0.5)} disabled={heat <= 1}>🧊 Cool down</Button>
        <Button variant="secondary" onClick={() => onHeat(0.5)} disabled={heat >= 5}>🔥 Heat up</Button>
      </div>

      <h3 className="mb-2 mt-6 text-lg font-bold">Rules</h3>
      <ul className="space-y-1 text-muted">
        {tpl && <li>{tpl.emoji} <b className="text-ink">{tpl.name}:</b> {tpl.summary}</li>}
        {room?.config.nonDrinkingMode && <li>🧃 Non-drinking mode</li>}
        {room?.config.customDrinkRules.map((r, i) => <li key={i}>📌 {r}</li>)}
        <li>🙋 Anyone can skip. Nobody has to answer.</li>
      </ul>

      <h3 className="mb-2 mt-6 text-lg font-bold">Players</h3>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-elevated px-3 py-2">
            <Avatar value={p.avatarUrl} size={40} />
            <span className="flex-1 truncate font-semibold">{p.name}</span>
            {players.length > 2 && <button aria-label={`Remove ${p.name}`} onClick={() => onRemovePlayer(p.id)} className="h-tap w-tap text-muted">✕</button>}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {confirmEnd ? (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setConfirmEnd(false)}>Keep playing</Button>
            <Button variant="danger" onClick={onEnd}>Yes, end it</Button>
          </div>
        ) : (
          <Button variant="danger" full onClick={() => setConfirmEnd(true)}>End game</Button>
        )}
      </div>
    </Sheet>
  );
}
