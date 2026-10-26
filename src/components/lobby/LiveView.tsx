'use client';
import { useState } from 'react';
import { Button, CoinCount, Chip, toast } from '@/components/ui';
import { HeatBar } from '@/components/play/HeatBar';
import { InviteCode } from '@/components/lobby/InviteCode';
import type { Room } from '@/lib/data/rooms';
import { DECK_BY_ID, type DeckId } from '@/lib/game/decks';
import { finishGame } from '@/lib/data/game-sync';
import { addToPotOnline } from '@/lib/data/room-sync';
import { useProfileStore } from '@/stores/profile-store';

const HEAT = ['', 'Chill', 'Warm', 'Spicy', 'Hot', 'Inferno'];

/** What a phone shows while another phone runs the game. The only way to take the game is the pause menu on the game phone. */
export function LiveView({ room, myId }: { room: Room; myId: string }) {
  const v = room.gameView;
  const runner = room.players.find((p) => p.userId === room.gamePhone);
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
  const ended = v?.phase === 'end';
  const ahead = v?.ahead;

  return (
    <div data-mode={v?.mode} className="mt-2">
      <p className="text-base font-bold text-muted">{runner ? `${runner.displayName} is running the game` : 'The game is running'}</p>
      {v ? (
        <>
          <section data-deck={deck?.id} className="mt-3 rounded-card bg-accent p-5 text-onaccent">
            <p className="text-sm font-extrabold opacity-80">{ended ? 'Out of cards' : `${v.player}'s turn`}</p>
            <p className="display mt-2 min-h-[6rem] text-3xl leading-tight">
              {ended ? 'Add coins to keep going, or the game ends.' : v.card ? v.card.text : 'Face down'}
            </p>
          </section>
          {v.rule && <p className="mt-3 rounded-lg bg-[rgb(190_222_58)] px-3 py-2 text-base font-extrabold text-[rgb(24_19_16)]">Rule on: {v.rule}</p>}

          <div className="mt-5"><HeatBar level={Math.max(1, v.heat)} /></div>
          {ahead && !ended && (
            <section className="mt-4 rounded-xl border-2 border-line p-3" aria-label="What is coming">
              <p className="text-base font-bold">Next {ahead.count} cards</p>
              <p className="mt-1 text-base text-muted">
                {ahead.low === ahead.high ? HEAT[Math.round(ahead.low)] ?? 'Mixed' : `${HEAT[Math.round(ahead.low)] ?? ''} to ${HEAT[Math.round(ahead.high)] ?? ''}`} heat. {v.next ? `${v.next} is up after this.` : ''}
              </p>
              {ahead.decks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {ahead.decks.map((d) => <Chip key={d} selected={false} onClick={() => undefined}>{DECK_BY_ID[d as DeckId]?.name ?? d}</Chip>)}
                </div>
              )}
            </section>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border-2 border-line p-3"><dt className="text-sm text-muted">Card</dt><dd className="text-xl font-extrabold">{Math.min(v.played + 1, v.total)}/{v.total}</dd></div>
            <div className="rounded-xl border-2 border-line p-3"><dt className="text-sm text-muted">Pot left</dt><dd className="text-xl font-extrabold">{v.pot}</dd></div>
          </dl>
        </>
      ) : (
        <p className="mt-3 text-lg text-muted">Waiting for the first card.</p>
      )}

      <section className="mt-6 rounded-xl border-2 border-line p-4" aria-label="Add coins to the pot">
        <p className="flex items-center justify-between gap-2 text-lg font-bold"><span>Add to the pot</span><span className="flex items-center gap-2 text-base text-muted">You have <CoinCount value={wallet} /></span></p>
        <p className="mb-3 mt-1 text-base text-muted">Anyone can add coins to keep the cards coming.</p>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 20].map((n) => <Button key={n} variant="secondary" disabled={adding || wallet < n} onClick={() => void addCoins(n)}>+{n}</Button>)}
        </div>
      </section>

      <section className="mt-4 rounded-xl border-2 border-line p-4" aria-label="Invite someone">
        <p className="mb-3 text-lg font-bold">Someone new? They can join now.</p>
        <InviteCode code={room.code} size={96} />
        <p className="mt-3 text-sm text-muted">New players can add to the pot but cannot change the rules.</p>
      </section>

      {isHost && (
        <div className="mt-4">
          <Button full variant="secondary" onClick={() => void finishGame(room.code, ended ? 'lobby' : 'ended').then((r) => { if (!r.ok) toast(r.error, { tone: 'warn' }); })}>
            {ended ? 'Back to the lobby' : 'End the game for everyone'}
          </Button>
          <p className="mt-2 text-sm text-muted">Use this only if the game phone is lost or stuck.</p>
        </div>
      )}
    </div>
  );
}
