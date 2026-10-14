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
        <div className="mt-10">
          <p className="display text-6xl">Nothing saved yet.</p>
          <p className="mt-4 text-lg text-muted">Tap Save on a card during a game and it shows up here.</p>
          <Link href="/" className="mt-8 block"><Button size="lg" full>Start a game</Button></Link>
        </div>
      ) : (
        <ul>
          {cards.map((c) => (
            <li key={c!.id} className="border-b-2 border-line/60 py-5">
              <p className="display text-3xl" style={{ lineHeight: 1.05 }}>{c!.text}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base text-muted">{c!.category.replace(/_/g, ' ')}, intensity {c!.intensity} of 5</span>
                <button onClick={() => unsave(c!.id)} className="h-tap px-2 text-base font-extrabold text-accent">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
