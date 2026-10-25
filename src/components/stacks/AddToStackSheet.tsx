'use client';
import { Button, Sheet, toast } from '@/components/ui';
import { useStackStore } from '@/stores/stack-store';

/** Pick a stack (or start one) and put the given cards in it. */
export function AddToStackSheet({ open, cardIds, onClose }: { open: boolean; cardIds: string[]; onClose: () => void }) {
  const stacks = useStackStore((s) => s.stacks);
  const add = useStackStore((s) => s.addCards);
  const create = useStackStore((s) => s.create);

  const into = (id: string, name: string) => {
    const n = add(id, cardIds);
    toast(n === 0 ? `Already in ${name}` : `Added to ${name}`, { tone: n ? 'ok' : undefined });
    onClose();
  };
  const fresh = async () => {
    const s = await create('New deck');
    if (!s) return;
    add(s.id, cardIds);
    toast('Added to your new deck. Rename it in Decks.', { tone: 'ok' });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add to a deck">
      <ul>
        {stacks.map((s) => (
          <li key={s.id}>
            <button onClick={() => into(s.id, s.name)} className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 border-b-2 border-line/60 py-3 text-left">
              <span className="min-w-0"><span className="block truncate text-xl font-bold">{s.name}</span><span className="text-base text-muted">{s.cardIds.length} cards</span></span>
              <span className="text-base font-extrabold text-accent">Add</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-3 pb-2">
        <Button size="lg" full onClick={fresh}>New deck with this card</Button>
        <Button full variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </Sheet>
  );
}
