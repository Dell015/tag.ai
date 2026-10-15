'use client';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, EmptyState, Screen, toast } from '@/components/ui';
import { categoryLabel } from '@/components/library/common';
import { SAMPLE_DECKS, sampleCards } from '@/lib/data/discover-seed';
import { useDeckStore } from '@/stores/deck-store';

export default function DiscoverDeckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const d = SAMPLE_DECKS.find((x) => x.id === id);
  const create = useDeckStore((s) => s.create);
  const update = useDeckStore((s) => s.update);
  const addCards = useDeckStore((s) => s.addCards);

  if (!d) return <Screen title="Deck" back="/library?tab=discover"><EmptyState title="Deck not found." /></Screen>;
  const cards = sampleCards(d);

  const copy = () => {
    const deck = create(d.name.slice(0, 30));
    update(deck.id, { audience: d.audience, color: d.color });
    addCards(deck.id, cards.map((c) => ({ text: c.text, type: c.cardType === 'action' ? 'action' : 'question', intensity: c.intensity, category: c.category })));
    toast('Copied to My decks', { tone: 'ok' });
    router.push(`/library/decks/${deck.id}`);
  };

  return (
    <Screen title="" back="/library?tab=discover">
      <section data-mode={d.color} className="-mt-2 rounded-card bg-accent p-5 text-onaccent">
        <h1 className="display text-5xl" style={{ lineHeight: 1 }}>{d.name}</h1>
        <p className="mt-2 text-lg font-bold">by {d.creator}, {d.audience}, {cards.length} cards</p>
      </section>
      <p className="mt-3 flex items-center gap-2 text-base text-muted"><Badge tone="line">Sample</Badge>{d.plays} plays, {d.copies} copies</p>
      <Button size="lg" full className="mt-4" onClick={copy}>Copy to my decks</Button>
      <p className="mt-2 text-sm text-muted">Your copy is private to you. Original by {d.creator}.</p>
      <h2 className="mb-1 mt-7 text-3xl">First 5 cards</h2>
      <ul>
        {cards.slice(0, 5).map((c) => (
          <li key={c.id} className="border-b-2 border-line/60 py-4">
            <p className="display text-2xl" style={{ lineHeight: 1.1 }}>{c.text}</p>
            <p className="mt-1 text-base text-muted">{c.cardType === 'action' ? 'Dare' : categoryLabel(c.category)}, intensity {c.intensity} of 5</p>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
