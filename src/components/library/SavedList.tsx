'use client';
import { fillDrink } from '@/lib/game/card-kinds';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Chip, EmptyState, Spot } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { findCard } from '@/lib/data/card-pool';
import { useAdultOn } from '@/lib/adult';
import { CATEGORIES, categoryLabel } from './common';
import { Fold, IntensityBars } from './parts';
import { CATEGORY_GROUPS, intensityCounts } from '@/lib/data/taxonomy';

export function SavedList() {
  const ids = useProfileStore((s) => s.savedCardIds);
  const unsave = useProfileStore((s) => s.unsaveCard);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);

  const adultOn = useAdultOn();
  const all = useMemo(() => ids.map((id) => findCard(id, adultOn)).filter((c) => !!c), [ids, adultOn]);
  const cards = all.filter((c) => (!cat || c!.category === cat) && c!.text.toLowerCase().includes(q.trim().toLowerCase()));
  const usedCats = CATEGORIES.filter((c) => all.some((x) => x!.category === c.id));

  if (all.length === 0) {
    return (
      <EmptyState art={<Spot name="cards" />} title="Nothing saved yet." body="Tap Save on a card during a game and it shows up here."
        action={<Link href="/" className="block"><Button size="lg" full>Start a game</Button></Link>} />
    );
  }

  const flat = q.trim().length > 0 || !!cat;

  const row = (c: (typeof cards)[number]) => {
          return (
            <li key={c!.id} className="border-b-2 border-line/60 py-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="display text-3xl" style={{ lineHeight: 1.05 }}>{fillDrink(c!.text, false)}</p>
                  <p className="mt-2 text-base text-muted">{categoryLabel(c!.category)}, intensity {c!.intensity} of 5</p>
                  <button onClick={() => unsave(c!.id)} className="mt-1 h-tap text-base font-extrabold text-muted">Remove</button>
                </div>
              </div>
            </li>
          );
  };

  return (
    <>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved cards" aria-label="Search saved cards" className="h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent" />
      </div>
      {usedCats.length > 1 && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none">
          <Chip selected={!cat} onClick={() => setCat(null)}>All</Chip>
          {usedCats.map((c) => <Chip key={c.id} selected={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)} className="shrink-0">{c.label}</Chip>)}
        </div>
      )}

      {flat ? (
        <ul className="mt-2">
          {cards.map(row)}
          {cards.length === 0 && <li className="py-8 text-lg text-muted">No saved cards match.</li>}
        </ul>
      ) : (
        <div className="mt-4">
          {CATEGORY_GROUPS.map((g) => {
            const inGroup = cards.filter((c) => (g.cats as string[]).includes(c!.category));
            if (inGroup.length === 0) return null;
            return (
              <Fold key={g.id} title={g.label} tone={g.tone} count={inGroup.length} defaultOpen>
                {g.cats.map((cat) => {
                  const list = cards.filter((c) => c!.category === cat);
                  if (list.length === 0) return null;
                  return (
                    <Fold key={cat} level={1} title={categoryLabel(cat)} count={list.length} defaultOpen right={<IntensityBars values={intensityCounts(list as { intensity: number }[])} className="text-muted" />}>
                      <ul>{list.map(row)}</ul>
                    </Fold>
                  );
                })}
              </Fold>
            );
          })}
        </div>
      )}

    </>
  );
}
