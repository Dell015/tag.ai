'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Chip } from '@/components/ui';
import { AUDIENCES, type Audience } from '@/stores/deck-store';
import { SAMPLE_DECKS, sortDecks, type DiscoverSort } from '@/lib/data/discover-seed';
import { CATEGORY_GROUPS } from '@/lib/data/taxonomy';
import { Fold } from './parts';
import { categoryLabel } from './common';

const SORTS: { id: DiscoverSort; label: string }[] = [{ id: 'trending', label: 'Trending' }, { id: 'plays', label: 'Most played' }, { id: 'copies', label: 'Most copied' }, { id: 'new', label: 'Newest' }];

export function Discover() {
  const [sort, setSort] = useState<DiscoverSort>('trending');
  const [aud, setAud] = useState<Audience | null>(null);
  const [grp, setGrp] = useState<string | null>(null);
  const gcats = CATEGORY_GROUPS.find((g) => g.id === grp)?.cats as string[] | undefined;
  const list = sortDecks(SAMPLE_DECKS.filter((d) => (!aud || d.audience === aud) && (!gcats || d.categories.some((c) => gcats.includes(c)))), sort);
  const audiences = AUDIENCES.filter((a) => list.some((d) => d.audience === a));
  return (
    <>
      <p className="mb-3 flex items-center gap-2 text-base text-muted"><Badge tone="line">Sample decks</Badge> Real decks from other players arrive with accounts.</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
        {SORTS.map((s) => <Chip key={s.id} selected={sort === s.id} onClick={() => setSort(s.id)} className="shrink-0">{s.label}</Chip>)}
      </div>
      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 scrollbar-none">
        {AUDIENCES.filter((a) => SAMPLE_DECKS.some((d) => d.audience === a)).map((a) => <Chip key={a} selected={aud === a} onClick={() => setAud(aud === a ? null : a)} className="shrink-0">{a}</Chip>)}
      </div>
      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 scrollbar-none">
        {CATEGORY_GROUPS.map((g) => <Chip key={g.id} selected={grp === g.id} onClick={() => setGrp(grp === g.id ? null : g.id)} className="shrink-0">{g.label}</Chip>)}
      </div>
      <div className="mt-4">
        {audiences.map((a) => {
          const group = list.filter((d) => d.audience === a);
          return (
            <Fold key={a} title={a} count={group.length === 1 ? '1 deck' : `${group.length} decks`} defaultOpen>
              <ul className="grid gap-3 pt-1">
                {group.map((d) => (
                  <li key={d.id}>
                    <Link href={`/library/discover/${d.id}`} data-mode={d.color} className="flex min-h-[7.5rem] flex-col justify-between gap-3 rounded-card bg-accent p-4 text-onaccent">
                      <span className="display text-4xl" style={{ lineHeight: 1 }}>{d.name}</span>
                      <span className="flex flex-wrap gap-1.5">{d.categories.map((c) => <span key={c} className="rounded-full border-2 border-current px-2.5 py-0.5 text-sm font-bold">{categoryLabel(c)}</span>)}</span>
                      <span className="text-base font-bold">by {d.creator}, {d.size} cards, {d.copies} copies</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Fold>
          );
        })}
        {list.length === 0 && <p className="py-6 text-lg text-muted">No decks match.</p>}
      </div>
    </>
  );
}
