'use client';
import { useRouter } from 'next/navigation';
import { Button, Sheet, toast } from '@/components/ui';
import { useDeckStore, type DeckCard } from '@/stores/deck-store';
import type { QueuedCard } from '@/lib/game/escalation-engine';

/** Pick a deck (or start a new one) and add the given cards to it. */
export function AddToDeckSheet({ open, cards, onClose, onDone }: { open: boolean; cards: QueuedCard[]; onClose: () => void; onDone?: () => void }) {
  const decks = useDeckStore((s) => s.decks);
  const add = useDeckStore((s) => s.addCards);
  const create = useDeckStore((s) => s.create);
  const router = useRouter();
  const toDeck = (c: QueuedCard): Omit<DeckCard, 'id'> => ({ text: c.text, type: c.cardType === 'action' ? 'action' : 'question', intensity: c.intensity, category: c.category });

  const into = (id: string, name: string) => {
    const n = add(id, cards.map(toDeck));
    toast(n === 0 ? `Already in ${name}` : `Added ${n} ${n === 1 ? 'card' : 'cards'} to ${name}`, { tone: n ? 'ok' : undefined });
    onDone?.(); onClose();
  };
  const fresh = () => {
    const d = create('New deck');
    add(d.id, cards.map(toDeck));
    onDone?.(); onClose();
    router.push(`/library/decks/${d.id}/edit`);
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Add ${cards.length} ${cards.length === 1 ? 'card' : 'cards'} to a deck`}>
      <ul>
        {decks.map((d) => (
          <li key={d.id}>
            <button onClick={() => into(d.id, d.name)} className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 border-b-2 border-line/60 py-3 text-left">
              <span className="min-w-0"><span className="block truncate text-xl font-bold">{d.name}</span><span className="text-base text-muted">{d.cards.length} cards</span></span>
              <span className="text-base font-extrabold text-accent">Add</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-3 pb-2">
        <Button size="lg" full onClick={fresh}>New deck with these cards</Button>
        <Button full variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </Sheet>
  );
}
