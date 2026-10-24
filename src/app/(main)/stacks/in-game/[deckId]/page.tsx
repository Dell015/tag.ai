'use client';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, EmptyState, Icon, Screen } from '@/components/ui';
import { CardRow } from '@/components/stacks/CardRow';
import { AddToStackSheet } from '@/components/stacks/AddToStackSheet';
import { libraryCards } from '@/lib/data/card-pool';
import { DECK_BY_ID, deckPool } from '@/lib/game/decks';
import { useAdultOn } from '@/lib/adult';
import { useProfileStore } from '@/stores/profile-store';
import { cn } from '@/lib/cn';

const PAGE = 30;

export default function InGameStackPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const deck = DECK_BY_ID[deckId as keyof typeof DECK_BY_ID];
  const adultOn = useAdultOn();
  const saved = useProfileStore((s) => s.savedCardIds);
  const save = useProfileStore((s) => s.saveCard);
  const unsave = useProfileStore((s) => s.unsaveCard);
  const [shown, setShown] = useState(PAGE);
  const [adding, setAdding] = useState<string | null>(null);
  const cards = useMemo(() => (deck ? deckPool(deck, libraryCards(adultOn)) : []), [deck, adultOn]);

  if (!deck) return <Screen title="Stack" back="/stacks"><EmptyState title="No such stack." action={<Link href="/stacks"><Button>Back to Stacks</Button></Link>} /></Screen>;
  return (
    <Screen title={deck.name} back="/stacks">
      <p className="text-lg text-muted">{deck.blurb}. {cards.length} cards.</p>
      <ul className="mt-2">
        {cards.slice(0, shown).map((c) => {
          const liked = saved.includes(c.id);
          return (
            <CardRow key={c.id} card={c} actions={<>
              <button onClick={() => (liked ? unsave(c.id) : save(c.id))} aria-pressed={liked} className={cn('inline-flex h-tap items-center gap-1.5 text-base font-extrabold', liked ? 'text-accent' : 'text-muted')}>
                <Icon name="heart" size={20} filled={liked} />{liked ? 'Liked' : 'Like'}
              </button>
              <button onClick={() => setAdding(c.id)} className="inline-flex h-tap items-center gap-1.5 text-base font-extrabold text-muted"><Icon name="plus" size={20} />Add to stack</button>
            </>} />
          );
        })}
      </ul>
      {shown < cards.length && <Button full variant="secondary" className="mt-4" onClick={() => setShown(shown + PAGE)}>Show more</Button>}
      <AddToStackSheet open={!!adding} cardIds={adding ? [adding] : []} onClose={() => setAdding(null)} />
    </Screen>
  );
}
