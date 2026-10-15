'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SegmentedControl } from '@/components/ui';
import { SavedList } from '@/components/library/SavedList';
import { Discover } from '@/components/library/Discover';
import { MyDecks } from '@/components/library/MyDecks';
import { Browse } from '@/components/library/Browse';

type Tab = 'decks' | 'browse' | 'saved' | 'discover';
const TABS: { id: Tab; label: string }[] = [
  { id: 'decks', label: 'Decks' },
  { id: 'browse', label: 'Browse' },
  { id: 'saved', label: 'Saved' },
  { id: 'discover', label: 'Discover' },
];
const KEY = 'tagai-library-tab';

function LibraryInner() {
  const param = useSearchParams().get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(param ?? 'decks');

  useEffect(() => {
    if (param) return;
    try { const v = window.localStorage.getItem(KEY) as Tab | null; if (v) setTab(v); } catch { /* ignore */ }
  }, [param]);
  const change = (t: Tab) => { setTab(t); try { window.localStorage.setItem(KEY, t); } catch { /* ignore */ } };

  return (
    <div className="px-4 safe-top">
      <h1 className="mb-4 text-5xl">Library</h1>
      <SegmentedControl label="Library sections" options={TABS} value={tab} onChange={change} />
      <div className="mt-5">
        {tab === 'decks' && <MyDecks />}
        {tab === 'browse' && <Browse />}
        {tab === 'saved' && <SavedList />}
        {tab === 'discover' && <Discover />}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return <Suspense fallback={null}><LibraryInner /></Suspense>;
}
