'use client';
import { fillDrink } from '@/lib/game/card-kinds';
import { useEffect } from 'react';
import { Button, NumberStepper, toast } from '@/components/ui';
import { InstallSheet } from './InstallSheet';
import { categoryLabel } from '@/components/library/common';
import { formatPot } from '@/lib/game/pot';
import { renderShareImage, shareImage } from '@/lib/share-image';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { GameMode } from '@/types/game';

export function Recap({ mode, deckName, played, skipped, hearted, peak, potStart, potRefunded, more, saved, onAgain, onHome }: {
  mode: GameMode; deckName: string; played: number; skipped: number; hearted: number; peak: number; potStart: number; potRefunded: number; more?: { cards: number; cost: number; wallet: number; onBuy: () => void; /** Online: the money is the shared pot, not a wallet. */ pot?: boolean; onCount?: (n: number) => void; onAdd?: () => void }; saved: QueuedCard[]; onAgain: () => void; onHome: () => void;
}) {
  useEffect(() => { try { window.localStorage.setItem('tagai-games-finished', '1'); } catch { /* ignore */ } }, []);
  const stats = [
    { v: String(played), l: 'cards played' },
    { v: String(skipped), l: 'skipped' },
    { v: String(hearted), l: 'saved' },
    { v: peak.toFixed(1), l: 'peak heat' },
  ];
  const best = saved[saved.length - 1];
  const funLine = skipped === 0 ? 'Nobody skipped a card tonight. Brave table.' : skipped === 1 ? 'Someone skipped a card tonight.' : `Someone skipped ${skipped} cards tonight.`;

  const share = async () => {
    const blob = await renderShareImage({ mode, deckName, played, skipped, saved: hearted, peak, cardOfTheNight: best?.text });
    if (!blob) { toast('Could not make the image', {}); return; }
    const r = await shareImage(blob);
    if (r === 'downloaded') toast('Image saved', { tone: 'ok' });
  };

  return (
    <div data-mode={mode} className="flex min-h-dvh flex-col px-4 pb-6 safe-top safe-bottom">
      <div className="mt-6 rounded-card bg-accent p-6 text-onaccent">
        <p className="text-lg font-bold">{deckName}</p>
        <h1 className="mt-3 text-[5.5rem] leading-[0.85]">That&apos;s a wrap.</h1>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
        {stats.map((s) => (
          <div key={s.l} className="border-t-2 border-line pt-3">
            <dd className="display text-7xl">{s.v}</dd>
            <dt className="text-lg text-muted">{s.l}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xl font-bold">{funLine}</p>
      {potStart > 0 && (
        <div className="mt-3 border-t-2 border-line pt-3">
        <p className="text-lg">Pot: <b>{formatPot(Math.max(0, potStart - potRefunded))}</b> of {formatPot(potStart)} coins used.{potRefunded > 0 && <> <b>{formatPot(potRefunded)}</b> returned to your wallet.</>}</p>
        </div>
      )}

      {best && (
        <section className="mt-6 border-t-2 border-line pt-4">
          <h2 className="text-2xl text-muted">Card of the night</h2>
          <p className="display mt-2 text-4xl" style={{ lineHeight: 1.05 }}>{fillDrink(best.text, false)}</p>
          <p className="mt-1 text-base text-muted">{categoryLabel(best.category)}, intensity {best.intensity} of 5</p>
        </section>
      )}
      {saved.length > 0 && (
        <section className="mt-6 border-t-2 border-line pt-4">
          <h2 className="text-2xl">Saved tonight <span className="text-muted">{saved.length}</span></h2>
          <ul className="mt-2">{saved.map((c) => <li key={c.id} className="border-b-2 border-line/60 py-2 text-lg">{fillDrink(c.text, false)}</li>)}</ul>
        </section>
      )}

      <p className="mt-8 text-muted">Get home safe.</p>
      <div className="mt-auto space-y-3 pt-8">
        {more && more.onCount && (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-line p-3">
            <span className="text-lg font-bold">More cards</span>
            <NumberStepper label="more cards" value={more.cards} min={5} max={50} step={5} onChange={more.onCount} />
          </div>
        )}
        {more && (more.wallet >= more.cost
          ? <Button size="lg" full onClick={more.onBuy}>Keep going: {more.cards} more cards for {more.cost} coins</Button>
          : (
            <>
              <p className="text-center text-lg text-muted">{more.pot ? `${more.cards} more cards need ${more.cost} coins in the pot. It has ${formatPot(more.wallet)}.` : `Want ${more.cards} more cards? You need ${more.cost} coins, you have ${formatPot(more.wallet)}.`}</p>
              {more.onAdd && <Button size="lg" full onClick={more.onAdd}>Add coins to the pot</Button>}
            </>
          ))}
        <Button size="lg" full variant={more && more.wallet >= more.cost ? 'secondary' : 'primary'} onClick={onAgain}>Play again</Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={share}>Share recap</Button>
          <Button variant="secondary" onClick={onHome}>Back home</Button>
        </div>
      </div>
      <InstallSheet />
    </div>
  );
}
