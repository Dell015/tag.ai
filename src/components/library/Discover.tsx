'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Chip } from '@/components/ui';
import { AUDIENCES, type Audience } from '@/stores/deck-store';
import { SAMPLE_DECKS, sortDecks, type DiscoverSort } from '@/lib/data/discover-seed';

const SORTS: { id: DiscoverSort; label: string }[] = [{ id: 'trending', label: 'Trending' }, { id: 'plays', label: 'Most played' }, { id: 'copies', label: 'Most copied' }, { id: 'new', label: 'Newest' }];

export function Discover() {
  const [sort, setSort] = useState<DiscoverSort>('trending');
  const [aud, setAud] = useState<Audience | null>(null);
  const list = sortDecks(SAMPLE_DECKS.filter((d) => !aud || d.audience === aud), sort);
  return (
    <>
      <p className="mb-3 flex items-center gap-2 text-base text-muted"><Badge tone="line">Sample decks</Badge> Real decks from other players arrive with accounts.</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
        {SORTS.map((s) => <Chip key={s.id} selected={sort === s.id} onClick={() => setSort(s.id)} className="shrink-0">{s.label}</Chip>)}
      </div>
      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 scrollbar-none">
        {AUDIENCES.filter((a) => SAMPLE_DECKS.some((d) => d.audience === a)).map((a) => <Chip key={a} selected={aud === a} onClick={() => setAud(aud === a ? null : a)} className="shrink-0">{a}</Chip>)}
      </div>
      <ul className="mt-4 grid gap-3">
        {list.map((d) => (
          <li key={d.id}>
            <Link href={`/library/discover/${d.id}`} data-mode={d.color} className="flex min-h-[7rem] flex-col justify-between rounded-card bg-accent p-4 text-onaccent">
              <span className="display text-4xl" style={{ lineHeight: 1 }}>{d.name}</span>
              <span className="text-base font-bold">by {d.creator}, {d.audience}, {d.size} cards, {d.copies} copies</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
