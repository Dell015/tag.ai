'use client';
import Link from 'next/link';
import { Button, CoinAmount, EmptyState, Screen } from '@/components/ui';
import { formatPot } from '@/lib/game/pot';
import { WELCOME_COINS, useProfileStore } from '@/stores/profile-store';
import { useWalletStore } from '@/stores/wallet-store';

const WHEN = new Intl.DateTimeFormat('en-PH', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function WalletPage() {
  const profile = useProfileStore((s) => s.profile)!;
  const txs = useWalletStore((s) => s.transactions);
  const rows = [...txs, { id: 'welcome', kind: 'welcome', amount: WELCOME_COINS, note: 'Welcome bonus', at: profile.createdAt }];
  return (
    <Screen title="Wallet" back="/me">
      <p className="text-base font-bold text-muted">Balance</p>
      <CoinAmount value={Number(formatPot(profile.coins))} className="display text-7xl" />
      <Link href="/shop" className="mt-5 block"><Button size="lg" full>Buy coins</Button></Link>
      <h2 className="mb-1 mt-9 text-3xl">History</h2>
      {rows.length === 0 ? <EmptyState title="No activity yet." /> : (
        <ul>
          {rows.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 border-b-2 border-line/60 py-3">
              <span className="min-w-0"><span className="block truncate text-xl font-bold">{t.note}</span><span className="text-base text-muted">{WHEN.format(t.at)}</span></span>
              <span className={`shrink-0 text-xl font-extrabold tabular-nums ${t.amount < 0 ? 'text-muted' : 'text-ok'}`}>{t.amount > 0 ? '+' : ''}{formatPot(t.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
