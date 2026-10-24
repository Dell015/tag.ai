'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ListRow, Screen, Sheet, TextField } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { useStackStore } from '@/stores/stack-store';
import { libraryCards } from '@/lib/data/card-pool';
import { DECKS, deckPool } from '@/lib/game/decks';
import { useAdultOn } from '@/lib/adult';

export default function StacksPage() {
  const router = useRouter();
  const adultOn = useAdultOn();
  const liked = useProfileStore((s) => s.savedCardIds.length);
  const stacks = useStackStore((s) => s.stacks);
  const create = useStackStore((s) => s.create);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const lib = libraryCards(adultOn);
    return Object.fromEntries(DECKS.filter((d) => d.ready).map((d) => [d.id, deckPool(d, lib).length]));
  }, [adultOn]);

  const make = async () => {
    setBusy(true);
    const s = await create(name || 'New stack');
    setBusy(false);
    if (!s) return;
    setOpen(false); setName('');
    router.push(`/stacks/${s.id}`);
  };

  return (
    <Screen title="Stacks">
      <p className="text-lg text-muted">Pick a stack before each game. Build your own from cards you like.</p>

      <section className="mt-6" aria-label="Your stacks">
        <h2 className="text-3xl">Yours</h2>
        <ListRow icon="heart" label="Liked cards" hint="Cards you hearted in a game" value={liked} href="/stacks/liked" />
        {stacks.map((s) => <ListRow key={s.id} icon="cards" label={s.name} value={s.cardIds.length} href={`/stacks/${s.id}`} />)}
        <ListRow icon="plus" label="New stack" hint="Start an empty stack" onClick={() => setOpen(true)} />
      </section>

      <section className="mt-8" aria-label="In-game stacks">
        <h2 className="text-3xl">In-game stacks</h2>
        {DECKS.filter((d) => d.ready).map((d) => <ListRow key={d.id} label={d.name} hint={d.blurb} value={counts[d.id]} href={`/stacks/in-game/${d.id}`} />)}
      </section>

      <section className="mt-8" aria-label="Community stacks">
        <h2 className="text-3xl">Community</h2>
        <ListRow label="Monthly stack" hint="Still being built. The best community cards will land here." />
      </section>

      <Sheet open={open} onClose={() => setOpen(false)} title="New stack">
        <form onSubmit={(e) => { e.preventDefault(); void make(); }} className="space-y-3 pb-2">
          <TextField label="Name" placeholder="Friday barkada" value={name} maxLength={40} counter onChange={(e) => setName(e.target.value)} autoFocus />
          <Button size="lg" full type="submit" disabled={busy}>Create stack</Button>
        </form>
      </Sheet>
    </Screen>
  );
}
