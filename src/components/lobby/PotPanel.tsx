'use client';
import { useState } from 'react';
import { Avatar, Button, CoinCount, RollNumber, toast } from '@/components/ui';
import { contributeOnline, withdrawOnline } from '@/lib/data/room-sync';
import { rooms, potFunded, type Room } from '@/lib/data/rooms';
import { MIN_POT, formatPot } from '@/lib/game/pot';
import { formatDuration } from '@/lib/game/setup-options';
import { haptic } from '@/lib/haptics';

/**
 * The shared pot of an online room: one number. Everyone adds what they want from their own wallet and can take
 * their own coins back down to zero until the host confirms. 1 coin is 1 card. After Confirm, coins can only be added.
 */
export function PotPanel({ room, myId, wallet, isHost }: { room: Room; myId: string; wallet: number; isHost: boolean }) {
  const [busy, setBusy] = useState(false);
  const funded = potFunded(room);
  const confirmed = !!room.potConfirmed;
  const mine = room.paid?.[myId] ?? 0;
  const payers = Object.entries(room.paid ?? {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const nameOf = (id: string) => room.players.find((p) => p.userId === id);

  const change = async (n: number) => {
    if (busy || n === 0) return;
    haptic('tap'); setBusy(true);
    const res = n > 0 ? await contributeOnline(room.code, n) : await withdrawOnline(room.code, -n);
    setBusy(false);
    if (!res.ok) toast(res.error, { tone: 'warn' });
  };
  const confirm = (on: boolean) => { haptic(on ? 'success' : 'tap'); rooms.update(room.code, (r) => ({ ...r, potConfirmed: on })); };

  const btn = 'flex h-14 w-14 items-center justify-center rounded-xl border-2 border-line text-3xl font-extrabold disabled:opacity-40 active:scale-95';
  return (
    <section aria-label="The pot" className="rounded-2xl border-2 border-line p-4">
      <h3 className="text-3xl">The pot</h3>
      <div className="mt-2 text-center">
        <span className="display block text-7xl leading-none tabular-nums"><RollNumber value={funded} format={formatPot} /></span>
        <span className="text-base font-semibold text-muted">{funded === 1 ? 'coin' : 'coins'}, {funded} {funded === 1 ? 'card' : 'cards'}{funded > 0 ? `, about ${formatDuration(funded)}` : ''}</span>
      </div>

      {payers.length > 0 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {payers.map(([id, n]) => {
            const p = nameOf(id);
            return (
              <li key={id} className="flex items-center gap-2 rounded-full border-2 border-line py-1 pl-1 pr-3 text-base font-bold">
                <Avatar value={p?.avatarUrl ?? 'c0'} name={p?.displayName ?? '?'} size={28} />
                <span className="max-w-[7rem] truncate">{id === myId ? 'You' : p?.displayName ?? 'Player'}</span>
                <span className="tabular-nums text-muted">{n}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 rounded-xl bg-raised p-3">
        <p className="flex items-center justify-between gap-2 text-base font-bold">
          <span>You added <span className="tabular-nums">{mine}</span></span>
          <span className="flex items-center gap-2 text-muted">Wallet <CoinCount value={wallet} /></span>
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button aria-label="Take 1 coin back" disabled={busy || mine < 1 || confirmed} onClick={() => change(-1)} className={btn}>-</button>
          <button aria-label="Add 1 coin" disabled={busy || wallet < 1} onClick={() => change(1)} className={btn}>+</button>
          {[5, 10].map((n) => <Button key={n} variant="secondary" disabled={busy || wallet < n} onClick={() => change(n)}>+{n}</Button>)}
        </div>
        {confirmed
          ? <p className="mt-2 text-center text-sm text-muted">The host confirmed the pot. You can add more, but not take coins back.</p>
          : mine > 0 && <p className="mt-2 text-center text-sm text-muted">You can take your coins back until the host confirms.</p>}
        {wallet < 1 && mine === 0 && <p className="mt-2 text-center text-sm text-muted">You have no coins. Others can fill the pot, or get coins in the Shop.</p>}
      </div>

      <div className="mt-4">
        {isHost ? (
          confirmed
            ? <div className="flex items-center justify-between gap-3"><p className="text-base font-bold text-ok">Pot confirmed</p><Button variant="secondary" onClick={() => confirm(false)}>Change the pot</Button></div>
            : <Button full size="lg" disabled={funded < MIN_POT} onClick={() => confirm(true)}>{funded < MIN_POT ? `Pot needs at least ${MIN_POT}` : `Confirm ${funded} coins`}</Button>
        ) : (
          <p className="text-center text-base text-muted">{confirmed ? 'The host confirmed the pot.' : funded < MIN_POT ? `The pot needs at least ${MIN_POT} coins.` : 'Waiting for the host to confirm the pot.'}</p>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">Once the game starts there are no refunds. Coins left in the pot at the end are lost.</p>
    </section>
  );
}
