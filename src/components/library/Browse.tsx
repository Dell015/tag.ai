'use client';
import { useMemo, useState } from 'react';
import { Chip, Icon } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { BROWSABLE, CATEGORY_GROUPS, intensityCounts } from '@/lib/data/taxonomy';
import { categoryLabel } from './common';
import { Fold, IntensityBars } from './parts';
import { cn } from '@/lib/cn';

const HEATS = [
  { id: 'any', label: 'Any heat', test: () => true },
  { id: 'mild', label: 'Mild, 1 to 2', test: (n: number) => n <= 2 },
  { id: 'mid', label: 'Medium, 3', test: (n: number) => n === 3 },
  { id: 'hot', label: 'Hot, 4 to 5', test: (n: number) => n >= 4 },
];

/** Every card in the app, filed by group and category, with a heat filter and search. */
export function Browse() {
  const saved = useProfileStore((s) => s.savedCardIds);
  const save = useProfileStore((s) => s.saveCard);
  const unsave = useProfileStore((s) => s.unsaveCard);
  const [q, setQ] = useState('');
  const [heat, setHeat] = useState('any');
  const test = HEATS.find((h) => h.id === heat)!.test;
  const term = q.trim().toLowerCase();
  const cards = useMemo(() => BROWSABLE.filter((c) => test(c.intensity) && (!term || c.text.toLowerCase().includes(term))), [test, term]);

  const row = (c: (typeof BROWSABLE)[number]) => {
    const on = saved.includes(c.id);
    return (
      <li key={c.id} className="flex items-start gap-3 border-t-2 border-line/50 py-4 first:border-t-0">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold leading-snug">{c.text}</p>
          <p className="mt-1 text-base text-muted">{c.cardType === 'action' ? 'Dare, ' : ''}intensity {c.intensity} of 5</p>
        </div>
        <button onClick={() => (on ? unsave(c.id) : save(c.id))} aria-pressed={on} aria-label={on ? 'Remove from saved' : 'Save card'}
          className={cn('flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2', on ? 'border-accent bg-accent text-onaccent' : 'border-line text-muted')}>
          <Icon name="heart" size={22} filled={on} />
        </button>
      </li>
    );
  };

  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all cards" aria-label="Search all cards" className="h-tap w-full rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent" />
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none">
        {HEATS.map((h) => <Chip key={h.id} selected={heat === h.id} onClick={() => setHeat(h.id)} className="shrink-0">{h.label}</Chip>)}
      </div>
      <p className="mb-3 mt-3 text-base text-muted">{cards.length} cards{term || heat !== 'any' ? ' match' : ' in the library'}</p>

      {term ? (
        <ul>{cards.map(row)}{cards.length === 0 && <li className="py-6 text-lg text-muted">No cards match.</li>}</ul>
      ) : (
        CATEGORY_GROUPS.map((g) => {
          const inGroup = cards.filter((c) => (g.cats as string[]).includes(c.category));
          return (
            <Fold key={g.id} title={g.label} hint={g.hint} tone={g.tone} count={inGroup.length} defaultOpen={g.id === 'talk'}>
              {g.cats.map((cat) => {
                const list = cards.filter((c) => c.category === cat);
                if (list.length === 0) return null;
                return (
                  <Fold key={cat} level={1} title={categoryLabel(cat)} count={list.length} right={<IntensityBars values={intensityCounts(list)} className="text-muted" />}>
                    <ul>{list.map(row)}</ul>
                  </Fold>
                );
              })}
            </Fold>
          );
        })
      )}
    </>
  );
}
