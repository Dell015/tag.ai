'use client';
import { useEffect, useState } from 'react';
import { Button, toast } from '@/components/ui';
import type { Room } from '@/lib/data/rooms';
import { DECK_BY_ID, type DeckId } from '@/lib/game/decks';
import { claimGame, finishGame } from '@/lib/data/game-sync';
import { addToPotOnline } from '@/lib/data/room-sync';
import { useProfileStore } from '@/stores/profile-store';
import { rooms } from '@/lib/data/rooms';

/** A read-only look at the game that another phone is running. */
export function LiveView({ room, myId, onClaimed }: { room: Room; myId: string; onClaimed: () => void }) {
  const v = room.gameView;
  const runner = room.players.find((p) => p.userId === room.gamePhone);
  // The server tells us how old the last report was when we read the room; keep counting between reads.
  const [since, setSince] = useState(0);
  useEffect(() => { setSince(0); const t = setInterval(() => setSince((n) => n + 1), 1000); return () => clearInterval(t); }, [room.gameAge, v]);
  const quiet = (room.gameAge ?? 0) + since;
  const stale = quiet >= 45;
  const [busy, setBusy] = useState(false);
  const claim = async () => {
    setBusy(true);
    const res = await claimGame(room.code);
    setBusy(false);
    if (!res.ok) { toast(res.error, { tone: 'warn' }); return; }
    rooms.update(room.code, (r) => ({ ...r, gamePhone: myId }));
    onClaimed();
  };
  const wallet = Math.floor(useProfileStore((p) => p.profile?.coins ?? 0));
  const [adding, setAdding] = useState(false);
  const addCoins = async (n: number) => {
    setAdding(true);
    const res = await addToPotOnline(room.code, n);
    setAdding(false);
    toast(res.ok ? `Added ${res.added} to the pot.` : res.error, { tone: res.ok ? 'ok' : 'warn' });
  };
  const isHost = room.hostId === myId;
  const deck = v?.card?.deck ? DECK_BY_ID[v.card.deck as DeckId] : undefined;

  return (
    <div data-mode={v?.mode} className="mt-2">
      <p className="text-base font-bold text-muted">{runner ? `${runner.displayName} is running the game` : 'The game is running'}</p>
      {v ? (
        <>
          <section data-deck={deck?.id} className="mt-3 rounded-card bg-accent p-5 text-onaccent">
            <p className="text-sm font-extrabold opacity-80">{v.phase === 'end' ? 'Game over' : `${v.player}'s turn`}</p>
            <p className="display mt-2 min-h-[6rem] text-3xl leading-tight">
              {v.phase === 'end' ? 'That was the last card.' : v.card ? v.card.text : 'Face down'}
            </p>
          </section>
          {v.rule && <p className="mt-3 rounded-lg bg-[rgb(190_222_58)] px-3 py-2 text-base font-extrabold text-[rgb(24_19_16)]">Rule on: {v.rule}</p>}
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border-2 border-line p-3"><dt className="text-sm text-muted">Card</dt><dd className="text-xl font-extrabold">{Math.min(v.played + 1, v.total)}/{v.total}</dd></div>
            <div className="rounded-xl border-2 border-line p-3"><dt className="text-sm text-muted">Heat</dt><dd className="text-xl font-extrabold">{v.heat.toFixed(1)}</dd></div>
            <div className="rounded-xl border-2 border-line p-3"><dt className="text-sm text-muted">Next up</dt><dd className="truncate text-xl font-extrabold">{v.next}</dd></div>
          </dl>
        </>
      ) : (
        <p className="mt-3 text-lg text-muted">Waiting for the first card.</p>
      )}
      {v && v.phase !== 'end' && (
        <section className="mt-6 rounded-xl border-2 border-line p-4" aria-label="Add coins to the pot">
          <p className="text-lg font-bold">Pot <span className="tabular-nums text-muted">{v.pot} coins left</span></p>
          <p className="mb-3 mt-1 text-base text-muted">Anyone can add coins to keep the cards coming. You have {wallet}.</p>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20].map((n) => <Button key={n} variant="secondary" disabled={adding || wallet < n} onClick={() => void addCoins(n)}>+{n}</Button>)}
          </div>
        </section>
      )}
      {isHost && (
        <div className="mt-4">
          <Button full variant="secondary" onClick={() => void finishGame(room.code, v?.phase === 'end' ? 'lobby' : 'ended').then((r) => { if (!r.ok) toast(r.error, { tone: 'warn' }); })}>
            {v?.phase === 'end' ? 'Back to the lobby' : 'End the game for everyone'}
          </Button>
        </div>
      )}
      {stale && room.gamePhone !== myId && (
        <div className="mt-6 rounded-xl border-2 border-line p-4">
          <p className="text-lg font-bold">The game phone went quiet.</p>
          <p className="mb-3 mt-1 text-base text-muted">It may have lost signal or closed the app. You can carry on from the last saved card on this phone.</p>
          <Button full size="lg" onClick={claim} disabled={busy}>{busy ? 'Taking over' : 'Run the game on this phone'}</Button>
        </div>
      )}
    </div>
  );
}
