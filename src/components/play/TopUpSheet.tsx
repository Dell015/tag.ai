'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, NumberStepper, Sheet } from '@/components/ui';
import { formatPot } from '@/lib/game/pot';

/** Add coins from the host's wallet to the pot. */
export function TopUpSheet({ open, onClose, wallet, pot, cardsLeft, costLeft, onAdd, title = 'Top up the pot', finished = false }: {
  open: boolean; onClose: () => void; wallet: number; pot: number; cardsLeft: number; costLeft: number; onAdd: (coins: number) => void; title?: string;
  /** The game ran out of cards: the numbers describe the next batch, not the cards left. */
  finished?: boolean;
}) {
  const need = Math.max(1, Math.ceil(costLeft - pot));
  const [coins, setCoins] = useState(0);
  const amount = coins || Math.min(need, Math.max(1, Math.floor(wallet)));
  const short = wallet < 1;
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="-mt-2 text-lg text-muted">{finished
        ? `The pot has ${formatPot(pot)} coins. ${cardsLeft} more cards cost ${formatPot(costLeft)}. After adding, tap Keep going.`
        : `The pot has ${formatPot(pot)} coins. ${cardsLeft} cards are left, which needs about ${formatPot(costLeft)}.`}</p>
      <div className="my-6 flex items-center justify-between gap-3">
        <span className="text-xl font-bold">Add</span>
        <NumberStepper label="coins to add" value={amount} min={1} max={Math.max(1, Math.floor(wallet))} onChange={setCoins} />
      </div>
      <p className="text-lg">You have <b>{formatPot(wallet)} coins</b>.</p>
      <div className="mt-5 space-y-3 pb-2">
        {short ? (
          <Link href="/shop" className="block"><Button size="lg" full>Add coins in the Shop</Button></Link>
        ) : (
          <Button size="lg" full onClick={() => { onAdd(amount); setCoins(0); onClose(); }}>Add {amount} to the pot</Button>
        )}
        <Button full variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </Sheet>
  );
}
