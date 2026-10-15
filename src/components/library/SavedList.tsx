'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Chip, EmptyState, Icon } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { CURATED_CARDS } from '@/lib/data/cards';
import { CATEGORIES, categoryLabel } from './common';
import { AddToDeckSheet } from './AddToDeckSheet';
import { cn } from '@/lib/cn';

export function SavedList() {
  const ids = useProfileStore((s) => s.savedCardIds);
  const unsave = useProfileStore((s) => s.unsaveCard);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [select, setSelect] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [sheet, setSheet] = useState<string[] | null>(null);

  const all = useMemo(() => ids.map((id) => CURATED_CARDS.find((c) => c.id === id)).filter((c) => !!c), [ids]);
  const cards = all.filter((c) => (!cat || c!.category === cat) && c!.text.toLowerCase().includes(q.trim().toLowerCase()));
  const usedCats = CATEGORIES.filter((c) => all.some((x) => x!.category === c.id));

  if (all.length === 0) {
    return (
      <EmptyState title="Nothing saved yet." body="Tap Save on a card during a game and it shows up here."
        action={<Link href="/" className="block"><Button size="lg" full>Start a game</Button></Link>} />
    );
  }

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const sheetCards = (sheet ?? []).map((id) => all.find((c) => c!.id === id)!).filter(Boolean);

  return (
    <>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved cards" aria-label="Search saved cards" className="h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent" />
        <Button variant={select ? 'primary' : 'secondary'} onClick={() => { setSelect(!select); setPicked([]); }}>{select ? 'Cancel' : 'Select'}</Button>
      </div>
      {usedCats.length > 1 && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none">
          <Chip selected={!cat} onClick={() => setCat(null)}>All</Chip>
          {usedCats.map((c) => <Chip key={c.id} selected={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)} className="shrink-0">{c.label}</Chip>)}
        </div>
      )}

      <ul className="mt-2">
        {cards.map((c) => {
          const on = picked.includes(c!.id);
          return (
            <li key={c!.id} className="border-b-2 border-line/60 py-5">
              <div className="flex items-start gap-3">
                {select && (
                  <button aria-label={on ? 'Deselect card' : 'Select card'} aria-pressed={on} onClick={() => toggle(c!.id)}
                    className={cn('mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2', on ? 'border-accent bg-accent text-onaccent' : 'border-line')}>{on && <Icon name="check" size={16} />}</button>
                )}
                <div className="min-w-0 flex-1">
                  <p className="display text-3xl" style={{ lineHeight: 1.05 }}>{c!.text}</p>
                  <p className="mt-2 text-base text-muted">{categoryLabel(c!.category)}, intensity {c!.intensity} of 5</p>
                  {!select && (
                    <div className="mt-1 flex items-center gap-4">
                      <button onClick={() => setSheet([c!.id])} className="h-tap text-base font-extrabold text-accent">Add to deck</button>
                      <button onClick={() => unsave(c!.id)} className="h-tap text-base font-extrabold text-muted">Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {cards.length === 0 && <li className="py-8 text-lg text-muted">No saved cards match.</li>}
      </ul>

      {select && (
        <div className="safe-bottom sticky bottom-[4.5rem] mt-3 bg-bg pb-3 pt-2">
          <Button size="lg" full disabled={picked.length === 0} onClick={() => setSheet(picked)}>{picked.length ? `Add ${picked.length} to a deck` : 'Pick cards to add'}</Button>
        </div>
      )}

      <AddToDeckSheet open={!!sheet} cards={sheetCards as never} onClose={() => setSheet(null)} onDone={() => { setSelect(false); setPicked([]); }} />
    </>
  );
}
