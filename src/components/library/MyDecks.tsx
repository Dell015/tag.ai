'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, EmptyState } from '@/components/ui';
import { useDeckStore } from '@/stores/deck-store';
import { ago } from './common';

export function MyDecks() {
  const decks = useDeckStore((s) => s.decks);
  const create = useDeckStore((s) => s.create);
  const router = useRouter();
  const make = () => { const d = create(); router.push(`/library/decks/${d.id}/edit`); };

  return (
    <>
      <Button size="lg" full onClick={make}>New deck</Button>
      {decks.length === 0 ? (
        <EmptyState title="No decks yet." body="Save cards during a game, then build your own deck here." />
      ) : (
        <ul className="mt-4 grid gap-3">
          {decks.map((d) => (
            <li key={d.id}>
              <Link href={`/library/decks/${d.id}`} data-mode={d.color} className="flex min-h-[7rem] flex-col justify-between rounded-card bg-accent p-4 text-onaccent">
                <span className="display text-4xl" style={{ lineHeight: 1 }}>{d.name}</span>
                <span className="flex items-center justify-between gap-2 text-base font-bold">
                  <span>{d.audience}, {d.cards.length} {d.cards.length === 1 ? 'card' : 'cards'}</span>
                  <span className="opacity-80">{ago(d.updatedAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-muted">Decks live on this phone. <Badge tone="line">Private</Badge></p>
    </>
  );
}
