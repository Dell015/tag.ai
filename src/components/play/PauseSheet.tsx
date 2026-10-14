'use client';
import { useState } from 'react';
import { Avatar, Button, Icon, Sheet } from '@/components/ui';
import type { Room } from '@/lib/data/rooms';
import { DRINK_RULE_TEMPLATES } from '@/lib/game/setup-options';

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

      <h3 className="mb-3 mt-8 text-3xl">Heat <span className="text-xl text-muted">{heat.toFixed(1)} of 5</span></h3>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => onHeat(-0.5)} disabled={heat <= 1}>Cool down</Button>
        <Button variant="secondary" onClick={() => onHeat(0.5)} disabled={heat >= 5}>Heat up</Button>
      </div>

      <h3 className="mb-2 mt-8 text-3xl">Rules</h3>
      <ul className="space-y-1 text-lg text-muted">
        {tpl && <li><b className="text-text">{tpl.name}.</b> {tpl.summary}</li>}
        {room?.config.nonDrinkingMode && <li>Non-drinking mode is on.</li>}
        {room?.config.customDrinkRules.map((r, i) => <li key={i}>{r}</li>)}
        <li>Anyone can skip. Nobody has to answer.</li>
      </ul>

      <h3 className="mb-1 mt-8 text-3xl">Players</h3>
      <ul>
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-3 border-b-2 border-line/60 py-2">
            <Avatar value={p.avatarUrl} name={p.name} size={44} />
            <span className="flex-1 truncate text-xl font-bold">{p.name}</span>
            {players.length > 2 && <button aria-label={`Remove ${p.name}`} onClick={() => onRemovePlayer(p.id)} className="flex h-tap w-tap items-center justify-center text-muted"><Icon name="close" size={20} /></button>}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {confirmEnd ? (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setConfirmEnd(false)}>Keep playing</Button>
            <Button variant="danger" onClick={onEnd}>End it</Button>
          </div>
        ) : (
          <Button variant="danger" full onClick={() => setConfirmEnd(true)}>End game</Button>
        )}
      </div>
    </Sheet>
  );
}
