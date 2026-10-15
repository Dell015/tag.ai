'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, EmptyState, Spot } from '@/components/ui';
import { useDeckStore } from '@/stores/deck-store';
import { ago, categoryLabel } from './common';
import { Fold, IntensityBars } from './parts';
import { intensityCounts } from '@/lib/data/taxonomy';
import { AUDIENCES } from '@/stores/deck-store';

export function MyDecks() {
  const decks = useDeckStore((s) => s.decks);
  const create = useDeckStore((s) => s.create);
  const router = useRouter();
  const make = () => { const d = create(); router.push(`/library/decks/${d.id}/edit`); };

  return (
    <>
      <Button size="lg" full onClick={make}>New deck</Button>
      {decks.length === 0 ? (
        <EmptyState art={<Spot name="cards" />} title="No decks yet." body="Save cards during a game, then build your own deck here." />
      ) : (
        <div className="mt-5">
          {AUDIENCES.filter((a) => decks.some((d) => d.audience === a)).map((a) => {
            const list = decks.filter((d) => d.audience === a);
            return (
              <Fold key={a} title={a} count={list.length === 1 ? '1 deck' : `${list.length} decks`} defaultOpen>
                <ul className="grid gap-3 pt-1">
                  {list.map((d) => {
                    const cats = Array.from(new Set(d.cards.map((c) => c.category))).slice(0, 3);
                    return (
                      <li key={d.id}>
                        <Link href={`/library/decks/${d.id}`} data-mode={d.color} className="flex min-h-[8.5rem] flex-col justify-between gap-3 rounded-card bg-accent p-4 text-onaccent">
                          <span className="flex items-start justify-between gap-3">
                            <span className="display text-4xl" style={{ lineHeight: 1 }}>{d.name}</span>
                            <IntensityBars values={intensityCounts(d.cards)} className="mt-1 shrink-0" />
                          </span>
                          {cats.length > 0 && <span className="flex flex-wrap gap-1.5">{cats.map((c) => <span key={c} className="rounded-full border-2 border-current px-2.5 py-0.5 text-sm font-bold">{categoryLabel(c)}</span>)}</span>}
                          <span className="flex items-center justify-between gap-2 text-base font-bold">
                            <span>{d.cards.length} {d.cards.length === 1 ? 'card' : 'cards'}</span>
                            <span className="opacity-80">{ago(d.updatedAt)}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Fold>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-sm text-muted">Decks live on this phone. <Badge tone="line">Private</Badge></p>
    </>
  );
}
