'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Icon, Screen, Section, Sheet, TextField } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { useStackStore } from '@/stores/stack-store';
import { libraryCards } from '@/lib/data/card-pool';
import { DECKS, deckPool } from '@/lib/game/decks';
import { useAdultOn } from '@/lib/adult';
import { cn } from '@/lib/cn';

// A stack is drawn as a small printed card, the same look as the cards in play.
const card = 'relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-xl border-[3px] border-[#181310] p-2 text-left transition-transform active:scale-95';

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

  const decks = DECKS.filter((d) => d.ready);

  return (
    <Screen title="Stacks" wide>
      <p className="text-base text-muted">Pick a stack before each game, or build your own from cards you like.</p>

      <Section title="Yours">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4">
          <Link href="/stacks/liked" data-deck="lovers" className={cn(card, 'bg-accent text-onaccent')}>
            <Icon name="heart" size={22} filled />
            <span><span className="sign block text-[0.78rem] leading-tight">Liked</span><span className="mt-0.5 block text-xs font-extrabold opacity-80">{liked} {liked === 1 ? 'card' : 'cards'}</span></span>
          </Link>
          {stacks.map((s) => (
            <Link key={s.id} href={`/stacks/${s.id}`} className={cn(card, 'bg-raised')}>
              <Icon name="cards" size={22} className="text-accent" />
              <span><span className="sign block break-words text-[0.78rem] leading-tight">{s.name}</span><span className="mt-0.5 block text-xs font-extrabold text-muted">{s.cardIds.length} {s.cardIds.length === 1 ? 'card' : 'cards'}</span></span>
            </Link>
          ))}
          <button onClick={() => setOpen(true)} aria-label="New stack" className={cn(card, 'border-dashed border-line/80 text-muted')}>
            <Icon name="plus" size={22} className="text-accent" />
            <span className="text-sm font-extrabold text-text">New stack</span>
          </button>
        </div>
      </Section>

      <Section title="In-game stacks" hint="The stacks that come with the game. Tap one to see its cards.">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4">
          {decks.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28, delay: Math.min(i, 9) * 0.035 }}>
              <Link href={`/stacks/in-game/${d.id}`} data-deck={d.id} aria-label={`${d.name}, ${counts[d.id]} cards`} className={cn(card, 'bg-accent text-onaccent')}>
                <span className="sign text-[0.6rem] opacity-70">tag.ai</span>
                <span className="display pointer-events-none absolute right-1.5 top-1 text-[2.6rem] leading-none opacity-20">?</span>
                <span><span className="sign block break-words text-[0.74rem] leading-tight">{d.name}</span><span className="mt-1 block text-xs font-extrabold opacity-80">{counts[d.id]} cards</span></span>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section title="Community">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-line/80 p-4">
          <Icon name="users" size={26} className="shrink-0 text-muted" />
          <p className="text-sm text-muted"><b className="block text-base text-text">Monthly stack</b>Still being built. The best community cards will land here.</p>
        </div>
      </Section>

      <Sheet open={open} onClose={() => setOpen(false)} title="New stack">
        <form onSubmit={(e) => { e.preventDefault(); void make(); }} className="space-y-3 pb-2">
          <TextField label="Name" placeholder="Friday barkada" value={name} maxLength={40} counter onChange={(e) => setName(e.target.value)} autoFocus />
          <Button size="lg" full type="submit" disabled={busy}>Create stack</Button>
        </form>
      </Sheet>
    </Screen>
  );
}
