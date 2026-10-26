'use client';
import { useEffect, useState } from 'react';
import { Avatar, Button, Icon, Sheet } from '@/components/ui';
import { MAX_PLAYERS, type Room } from '@/lib/data/rooms';
import { DRINK_RULE_TEMPLATES } from '@/lib/game/setup-options';
import { formatPot } from '@/lib/game/pot';
import { InviteCode } from '@/components/lobby/InviteCode';
import { FOCUS_RULES, type FocusKind } from '@/lib/game/mid-game';

export function PauseSheet({ open, onClose, room, players, onRemovePlayer, onEnd, pot, onTopUp, onFocus, onAddPlayer, onMove, onTools, onReport, others = [], onPass, currentIndex = 0, newIds = [] }: {
  open: boolean; onClose: () => void; room: Room | null;
  players: { id: string; name: string; avatarUrl: string }[];
  pot: number; onTopUp: () => void;
  onFocus: (k: FocusKind) => void;
  onAddPlayer: (name: string) => void; onMove: (id: string, dir: -1 | 1) => void;
  onTools: () => void; onReport: () => void;
  onRemovePlayer: (id: string) => void; onEnd: () => void;
  /** Online rooms: other accounts the game can be handed to. */
  others?: { id: string; name: string; avatarUrl: string }[];
  onPass?: (id: string) => void;
  /** Whose turn it is now (index in `players`), and who joined after the game began. */
  currentIndex?: number; newIds?: string[];
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

      <h3 className="mb-3 mt-8 text-3xl">Focus the next cards</h3>
      <div className="grid gap-2">
        <Button variant="secondary" onClick={() => onFocus('deep')}>{FOCUS_RULES.deep.label}</Button>
        <Button variant="secondary" onClick={() => onFocus('dares')}>{FOCUS_RULES.dares.label}</Button>
      </div>

      <h3 className="mb-3 mt-8 text-3xl">Pot <span className="text-xl text-muted">{formatPot(pot)} coins left</span></h3>
      <Button variant="secondary" full onClick={onTopUp}>Top up the pot</Button>

      {others.length > 0 && onPass && (
        <>
          <h3 className="mb-1 mt-8 text-3xl">Pass the game phone</h3>
          <p className="mb-3 text-base text-muted">The game moves to their phone, right where you stopped. This phone then watches.</p>
          <ul>
            {others.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b-2 border-line/60 py-2">
                <Avatar value={p.avatarUrl} name={p.name} size={44} />
                <span className="min-w-0 flex-1 truncate text-xl font-bold">{p.name}</span>
                <Button variant="secondary" size="md" onClick={() => onPass(p.id)}>Pass</Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="mb-3 mt-8 text-3xl">Tools</h3>
      <Button variant="secondary" full onClick={onTools}>Timer, coin flip, dice and more</Button>

      <h3 className="mb-2 mt-8 text-3xl">Rules</h3>
      <ul className="space-y-1 text-lg text-muted">
        {tpl && <li><b className="text-text">{tpl.name}.</b> {tpl.summary}</li>}
        {room?.config.nonDrinkingMode && <li>Non-drinking mode is on.</li>}
        {room?.config.customDrinkRules.map((r, i) => <li key={i}>{r}</li>)}
        <li>Anyone can skip. Nobody has to answer.</li>
      </ul>

      {room?.online && (
        <section className="mt-8" aria-label="Invite someone">
          <h3 className="mb-3 text-3xl">Someone wants to join?</h3>
          <InviteCode code={room.code} size={104} />
          <p className="mt-2 text-sm text-muted">They can add to the pot but cannot change the rules. They play last, and you can move them below.</p>
        </section>
      )}

      <h3 className="mb-1 mt-8 text-3xl">Play order</h3>
      <p className="mb-2 text-base text-muted">Use the arrows to move someone earlier or later.</p>
      <ul>
        {players.map((p, i) => {
          const tag = i === currentIndex ? 'Plays now' : i === (currentIndex + 1) % players.length ? 'Plays next' : null;
          return (
          <li key={p.id} className={`flex items-center gap-2 border-b-2 border-line/60 py-2 ${i === currentIndex ? 'rounded-lg bg-accent/10' : ''}`}>
            <span className="sign flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-line text-sm">{i + 1}</span>
            <Avatar value={p.avatarUrl} name={p.name} size={44} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xl font-bold">{p.name}</span>
              <span className="flex gap-2 text-sm font-bold">{tag && <span className="text-accent">{tag}</span>}{newIds.includes(p.id) && <span className="text-ok">New</span>}</span>
            </span>
            <button aria-label={`Move ${p.name} earlier`} disabled={i === 0} onClick={() => onMove(p.id, -1)} className="flex h-tap w-11 items-center justify-center text-muted disabled:opacity-25"><Icon name="chevron" size={20} className="-rotate-90" /></button>
            <button aria-label={`Move ${p.name} later`} disabled={i === players.length - 1} onClick={() => onMove(p.id, 1)} className="flex h-tap w-11 items-center justify-center text-muted disabled:opacity-25"><Icon name="chevron" size={20} className="rotate-90" /></button>
            {players.length > 2 && <button aria-label={`Remove ${p.name}`} onClick={() => onRemovePlayer(p.id)} className="flex h-tap w-11 items-center justify-center text-muted"><Icon name="close" size={20} /></button>}
          </li>
          );
        })}
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
