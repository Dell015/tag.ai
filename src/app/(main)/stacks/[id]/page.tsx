'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Chip, ConfirmSheet, EmptyState, Screen, SegmentedControl, Sheet, TextField, toast } from '@/components/ui';
import { CardRow } from '@/components/stacks/CardRow';
import { MAX_STACK_CARDS, useStackStore } from '@/stores/stack-store';
import { useProfileStore } from '@/stores/profile-store';
import { autoPool, findCard } from '@/lib/data/card-pool';
import { useShopStore } from '@/stores/shop-store';
import { useAdultOn } from '@/lib/adult';
import type { QueuedCard } from '@/lib/game/escalation-engine';

type Source = 'liked' | 'all';

function Picker({ stackId, open, onClose }: { stackId: string; open: boolean; onClose: () => void }) {
  const adultOn = useAdultOn();
  const stack = useStackStore((s) => s.stacks.find((x) => x.id === stackId));
  const add = useStackStore((s) => s.addCards);
  const removeCard = useStackStore((s) => s.removeCard);
  const savedIds = useProfileStore((s) => s.savedCardIds);
  const owned = useShopStore((s) => s.owned);
  const [source, setSource] = useState<Source>('liked');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const base: QueuedCard[] = source === 'liked'
      ? savedIds.map((id) => findCard(id, adultOn)).filter((c): c is QueuedCard => !!c)
      : autoPool(owned, adultOn);
    const t = q.trim().toLowerCase();
    return (t ? base.filter((c) => c.text.toLowerCase().includes(t)) : base).slice(0, 40);
  }, [source, q, savedIds, adultOn, owned]);
  const inStack = new Set(stack?.cardIds ?? []);

  return (
    <Sheet open={open} onClose={onClose} title="Add cards">
      <SegmentedControl<Source> label="Where from" value={source} onChange={setSource} options={[{ id: 'liked', label: 'Liked cards' }, { id: 'all', label: 'All cards' }]} />
      <div className="mt-3"><TextField label="Search" placeholder="Words from the card" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {source === 'liked' && list.length === 0 && <p className="py-6 text-lg text-muted">No liked cards yet. Like cards in a game or in a stack, then add them here.</p>}
      <ul className="mt-2">
        {list.map((c) => {
          const on = inStack.has(c.id);
          return (
            <li key={c.id} className="flex items-center gap-3 border-b-2 border-line/60 py-3">
              <p className="min-w-0 flex-1 text-lg leading-snug">{c.text}</p>
              <Chip selected={on} onClick={() => (on ? removeCard(stackId, c.id) : add(stackId, [c.id]) === 0 && toast(`A deck holds up to ${MAX_STACK_CARDS} cards.`, { tone: 'warn' }))}>{on ? 'Added' : 'Add'}</Chip>
            </li>
          );
        })}
      </ul>
      <Button full className="mt-4" onClick={onClose}>Done</Button>
    </Sheet>
  );
}

export default function StackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const adultOn = useAdultOn();
  const stack = useStackStore((s) => s.stacks.find((x) => x.id === id));
  const rename = useStackStore((s) => s.rename);
  const remove = useStackStore((s) => s.remove);
  const removeCard = useStackStore((s) => s.removeCard);
  const [name, setName] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [ask, setAsk] = useState(false);

  if (!stack) return <Screen title="Deck" back="/stacks"><EmptyState title="No such deck." action={<Link href="/stacks"><Button>Back to Decks</Button></Link>} /></Screen>;
  const cards = stack.cardIds.map((cid) => findCard(cid, adultOn)).filter((c): c is QueuedCard => !!c);
  const value = name ?? stack.name;
  const commit = () => { if (name !== null && name.trim() && name.trim() !== stack.name) { rename(stack.id, name); toast('Renamed', { tone: 'ok' }); } setName(null); };

  return (
    <Screen title="Deck" back="/stacks">
      <TextField label="Name" value={value} maxLength={40} counter onChange={(e) => setName(e.target.value)} onBlur={commit} />
      <p className="mt-2 text-lg text-muted">{stack.cardIds.length} {stack.cardIds.length === 1 ? 'card' : 'cards'}</p>
      <Button size="lg" full className="mt-3" onClick={() => setPicking(true)}>Add cards</Button>
      {cards.length === 0 ? (
        <p className="py-8 text-lg text-muted">Nothing here yet. Add cards you liked, or find some in the in-game decks.</p>
      ) : (
        <ul className="mt-2">
          {cards.map((c) => <CardRow key={c.id} card={c} actions={<button onClick={() => removeCard(stack.id, c.id)} className="h-tap text-base font-extrabold text-muted">Remove</button>} />)}
        </ul>
      )}
      <Button full variant="danger" className="mt-8" onClick={() => setAsk(true)}>Delete deck</Button>
      <Picker stackId={stack.id} open={picking} onClose={() => setPicking(false)} />
      <ConfirmSheet open={ask} title="Delete this deck?" body="The cards stay in the game. Only this list is deleted." confirmLabel="Delete deck" danger onConfirm={() => { remove(stack.id); router.replace('/stacks'); }} onClose={() => setAsk(false)} />
    </Screen>
  );
}
