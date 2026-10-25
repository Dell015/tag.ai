'use client';
import { useState } from 'react';
import { Avatar, Button, CoinCount, toast } from '@/components/ui';
import { contributeOnline } from '@/lib/data/room-sync';
import { potFunded, type Room } from '@/lib/data/rooms';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

/**
 * The shared pot of an online room. Everyone adds coins from their own wallet on their own phone;
 * it does not matter who pays or how much, only that the bar reaches the top.
 */
export function PotPanel({ room, myId, wallet }: { room: Room; myId: string; wallet: number }) {
  const [busy, setBusy] = useState(false);
  const target = room.config.pot ?? 0;
  const funded = potFunded(room);
  const left = Math.max(0, target - funded);
  const full = target > 0 && left === 0;
  const mine = room.paid?.[myId] ?? 0;
  const payers = Object.entries(room.paid ?? {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const nameOf = (id: string) => room.players.find((p) => p.userId === id);

  const add = async (n: number) => {
    if (busy || n < 1) return;
    haptic('tap'); setBusy(true);
    const res = await contributeOnline(room.code, n);
    setBusy(false);
    if (!res.ok) { toast(res.error, { tone: 'warn' }); return; }
    haptic('success');
    toast(`${res.added} ${res.added === 1 ? 'coin' : 'coins'} added to the pot.`, { tone: 'ok' });
  };

  return (
    <section aria-label="The pot" className="rounded-xl border-2 border-line p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-3xl">The pot</h3>
        <p className="text-lg font-extrabold tabular-nums">{funded} <span className="text-muted">of {target || '?'}</span></p>
      </div>

      {target === 0 ? (
        <p className="mt-2 text-base text-muted">The host is choosing the cards. The pot opens as soon as they pick.</p>
      ) : (
        <>
          <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-line" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={funded} aria-label="Pot filled">
            <div className={cn('h-full transition-[width] duration-500', full ? 'bg-ok' : 'bg-accent')} style={{ width: `${Math.min(100, (funded / target) * 100)}%` }} />
          </div>
          <p className="mt-2 text-base text-muted">
            {full ? 'The pot is full. The host can start.' : `${left} more ${left === 1 ? 'coin' : 'coins'} to go. 1 coin is 1 card. Anyone can add, any amount.`}
          </p>

          {payers.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
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

          {!full && (
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-2 text-base font-bold text-muted">Your wallet <CoinCount value={wallet} />{mine > 0 && <span>· you added {mine}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {[5, 10].filter((n) => n < left).map((n) => (
                  <Button key={n} variant="secondary" disabled={busy || wallet < n} onClick={() => add(n)}>+{n}</Button>
                ))}
                <Button disabled={busy || wallet < 1} onClick={() => add(Math.min(left, Math.floor(wallet)))}>
                  {wallet >= left ? `Fill the pot (${left})` : `Add all mine (${Math.floor(wallet)})`}
                </Button>
              </div>
              {wallet < 1 && <p className="mt-2 text-base text-muted">You have no coins. Someone else can fill the pot, or get coins in the Shop.</p>}
              <p className="mt-3 text-sm text-muted">Coins come back to you if the room closes before the game starts. Once it starts, there are no refunds.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
