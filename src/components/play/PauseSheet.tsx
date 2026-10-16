'use client';
import { useEffect, useState } from 'react';
import { Avatar, Button, Chip, Icon, Sheet } from '@/components/ui';
import { MAX_PLAYERS, type Room } from '@/lib/data/rooms';
import { DRINK_RULE_TEMPLATES } from '@/lib/game/setup-options';
import { DECKS, type DeckId } from '@/lib/game/decks';
import { HEAT_UP_COST, formatPot } from '@/lib/game/pot';
import { FOCUS_RULES, type FocusKind } from '@/lib/game/mid-game';

/** Decks you can switch to mid-game. Adult and Chaos need everyone confirmed 18+ before the game, so they are not offered here. */
const SWITCHABLE = DECKS.filter((d) => d.ready && !d.adult && !d.includesAdult);

export function PauseSheet({ open, onClose, room, players, heat, onHeat, onRemovePlayer, onEnd, pot, onTopUp, mood, onMood, onFocus, onAddPlayer, onMove, onTools, onReport }: {
  open: boolean; onClose: () => void; room: Room | null;
  players: { id: string; name: string; avatarUrl: string }[];
  heat: number; onHeat: (delta: number) => void; pot: number; onTopUp: () => void;
  mood: DeckId | undefined; onMood: (m: DeckId) => void; onFocus: (k: FocusKind) => void;
  onAddPlayer: (name: string) => void; onMove: (id: string, dir: -1 | 1) => void;
  onTools: () => void; onReport: () => void;
  onRemovePlayer: (id: string) => void; onEnd: () => void;
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [name, setName] = useState('');
  const tpl = DRINK_RULE_TEMPLATES.find((t) => t.id === room?.config.drinkRuleTemplate);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) { setCount(null); onClose(); return; }
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onClose]);

  const close = () => { setConfirmEnd(false); setCount(null); onClose(); };

  return (
    <Sheet open={open} onClose={close} title="Paused">
      {count !== null ? (
        <button onClick={() => setCount(null)} className="flex h-64 w-full flex-col items-center justify-center rounded-card border-2 border-line" aria-live="polite">
          <span className="display text-[9rem] leading-none">{count}</span>
          <span className="text-lg text-muted">Tap to stay paused</span>
        </button>
      ) : (
        <Button size="lg" full onClick={() => setCount(3)}>Resume</Button>
      )}

      <h3 className="mb-3 mt-8 text-3xl">Heat <span className="text-xl text-muted">{heat.toFixed(1)} of 5</span></h3>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => onHeat(-0.5)} disabled={heat <= 1}>Cool down</Button>
        <Button variant="secondary" onClick={() => onHeat(0.5)} disabled={heat >= 5}>Heat up, {HEAT_UP_COST} coins</Button>
      </div>

      <h3 className="mb-3 mt-8 text-3xl">Change the mood</h3>
      <p className="-mt-2 mb-3 text-base text-muted">Switch the deck for the rest of the game.</p>
      <div className="flex flex-wrap gap-2">
        {SWITCHABLE.map((d) => <Chip key={d.id} selected={mood === d.id} onClick={() => mood !== d.id && onMood(d.id)}>{d.name}</Chip>)}
      </div>
      <h3 className="mb-3 mt-6 text-2xl">Focus the next cards</h3>
      <div className="grid gap-2">
        <Button variant="secondary" onClick={() => onFocus('deep')}>{FOCUS_RULES.deep.label}</Button>
        <Button variant="secondary" onClick={() => onFocus('dares')}>{FOCUS_RULES.dares.label}</Button>
      </div>

      <h3 className="mb-3 mt-8 text-3xl">Pot <span className="text-xl text-muted">{formatPot(pot)} coins left</span></h3>
      <Button variant="secondary" full onClick={onTopUp}>Top up the pot</Button>

      <h3 className="mb-3 mt-8 text-3xl">Tools</h3>
      <Button variant="secondary" full onClick={onTools}>Timer, coin flip, dice and more</Button>

      <h3 className="mb-2 mt-8 text-3xl">Rules</h3>
      <ul className="space-y-1 text-lg text-muted">
        {tpl && <li><b className="text-text">{tpl.name}.</b> {tpl.summary}</li>}
        {room?.config.nonDrinkingMode && <li>Non-drinking mode is on.</li>}
        {room?.config.customDrinkRules.map((r, i) => <li key={i}>{r}</li>)}
        <li>Anyone can skip. Nobody has to answer.</li>
      </ul>

      <h3 className="mb-1 mt-8 text-3xl">Players</h3>
      <ul>
        {players.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2 border-b-2 border-line/60 py-2">
            <Avatar value={p.avatarUrl} name={p.name} size={44} />
            <span className="min-w-0 flex-1 truncate text-xl font-bold">{p.name}</span>
            <button aria-label={`Move ${p.name} earlier`} disabled={i === 0} onClick={() => onMove(p.id, -1)} className="flex h-tap w-11 items-center justify-center text-muted disabled:opacity-25"><Icon name="chevron" size={20} className="-rotate-90" /></button>
            <button aria-label={`Move ${p.name} later`} disabled={i === players.length - 1} onClick={() => onMove(p.id, 1)} className="flex h-tap w-11 items-center justify-center text-muted disabled:opacity-25"><Icon name="chevron" size={20} className="rotate-90" /></button>
            {players.length > 2 && <button aria-label={`Remove ${p.name}`} onClick={() => onRemovePlayer(p.id)} className="flex h-tap w-11 items-center justify-center text-muted"><Icon name="close" size={20} /></button>}
          </li>
        ))}
      </ul>
      {players.length < MAX_PLAYERS && (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onAddPlayer(name.trim()); setName(''); } }}>
          <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} placeholder="Add a guest by name" aria-label="New player name" className="h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg focus:border-accent" />
          <Button type="submit" variant="secondary" disabled={!name.trim()}>Add</Button>
        </form>
      )}

      <div className="mt-8 space-y-3">
        <Button variant="secondary" full onClick={onReport}>Report this card</Button>
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
