'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge, Button, ConfirmSheet, EmptyState, ListRow, Screen, toast } from '@/components/ui';
import { categoryLabel } from '@/components/library/common';
import { useDeckStore } from '@/stores/deck-store';
import { rooms } from '@/lib/data/rooms';
import { useProfileStore } from '@/stores/profile-store';
import { useSettingsStore } from '@/stores/settings-store';

export default function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === id));
  const remove = useDeckStore((s) => s.remove);
  const profile = useProfileStore((s) => s.profile)!;
  const [q, setQ] = useState('');
  const [del, setDel] = useState(false);

  if (!deck) {
    return (
      <Screen title="Deck" back="/library">
        <EmptyState title="That deck is gone." body="It may have been deleted on this phone." />
      </Screen>
    );
  }

  const cards = deck.cards.filter((c) => c.text.toLowerCase().includes(q.trim().toLowerCase()));
  const play = () => {
    const room = rooms.create({ id: profile.id, name: profile.username, avatar: profile.avatar });
    const d = useSettingsStore.getState();
    rooms.update(room.code, (r) => ({
      ...r,
      config: { ...r.config, gameMode: deck.color, deckIds: [deck.id], cardCountTarget: Math.min(d.defaultLength, Math.max(5, deck.cards.length)), comfortFilters: d.skipTopics, drinkRuleTemplate: d.defaultDrinkRule, nonDrinkingMode: d.nonDrinkingDefault, customDrinkRules: d.customRules },
    }));
    router.push(`/game/${room.code}`);
  };

  return (
    <Screen title="" back="/library">
      <section data-mode={deck.color} className="-mt-2 rounded-card bg-accent p-5 text-onaccent">
        <h1 className="display text-5xl" style={{ lineHeight: 1 }}>{deck.name}</h1>
        <p className="mt-2 text-lg font-bold">{deck.audience}, {deck.cards.length} {deck.cards.length === 1 ? 'card' : 'cards'}</p>
      </section>

      <div className="mt-4 grid gap-3">
        <Button size="lg" full disabled={deck.cards.length < 5} onClick={play}>{deck.cards.length < 5 ? 'Add 5 cards to play' : 'Play with this deck'}</Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => router.push(`/library/decks/${deck.id}/edit`)}>Edit</Button>
          <Button variant="danger" onClick={() => setDel(true)}>Delete</Button>
        </div>
      </div>

      <div className="mt-4">
        <ListRow label="Who can see it" hint="Public and friends-only decks need accounts." right={<Badge tone="line">Private</Badge>} />
      </div>

      <h2 className="mb-3 mt-6 text-3xl">Cards</h2>
      {deck.cards.length > 6 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cards" aria-label="Search cards" className="mb-3 h-tap w-full rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent" />}
      {deck.cards.length === 0 ? (
        <EmptyState title="No cards yet." body="Open Edit to write cards or add ones you saved." />
      ) : (
        <ul>
          {cards.map((c) => (
            <li key={c.id} className="border-b-2 border-line/60 py-4">
              <p className="display text-2xl" style={{ lineHeight: 1.1 }}>{c.text}</p>
              <p className="mt-1 text-base text-muted">{c.type === 'action' ? 'Dare' : categoryLabel(c.category)}, intensity {c.intensity} of 5</p>
            </li>
          ))}
          {cards.length === 0 && <li className="py-6 text-lg text-muted">No cards match.</li>}
        </ul>
      )}

      <ConfirmSheet open={del} title={`Delete ${deck.name}?`} body="The deck and its cards are removed from this phone." confirmLabel="Delete deck" danger
        onConfirm={() => { remove(deck.id); toast('Deck deleted', {}); router.replace('/library'); }} onClose={() => setDel(false)} />
    </Screen>
  );
}
