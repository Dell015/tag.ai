'use client';
import Link from 'next/link';
import { Button, Screen } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { CURATED_CARDS } from '@/lib/data/cards';

export default function SavedPage() {
  const ids = useProfileStore((s) => s.savedCardIds);
  const unsave = useProfileStore((s) => s.unsaveCard);
  const cards = ids.map((id) => CURATED_CARDS.find((c) => c.id === id)).filter((c) => !!c);

  return (
    <Screen title="Saved cards">
      {cards.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-6xl">🤍</div>
          <p className="mt-4 text-xl font-bold">Nothing saved yet</p>
          <p className="mt-1 text-muted">Tap Save on a card during a game and it lands here.</p>
          <Link href="/" className="mt-6 block"><Button full>Start a game</Button></Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {cards.map((c) => (
            <li key={c!.id} className="rounded-card bg-surface p-5 ring-1 ring-white/10">
              <p className="font-display text-xl font-bold leading-snug">{c!.text}</p>
              <div className="mt-3 flex items-center justify-between text-sm text-muted">
                <span>{c!.category.replace(/_/g, ' ')} · {'🔥'.repeat(c!.intensity)}</span>
                <button onClick={() => unsave(c!.id)} className="h-tap rounded-xl px-3 font-semibold text-accent">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
