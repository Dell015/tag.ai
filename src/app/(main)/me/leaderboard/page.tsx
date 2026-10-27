'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, EmptyState, Screen, SegmentedControl, Spot } from '@/components/ui';
import { fetchFeed, type FeedPost } from '@/lib/supabase/account';
import { useAccountStore } from '@/stores/account-store';

type Range = 'week' | 'all';

/** Rankings built from the real Cards feed: the most cheered cards, and the players whose cards got the most cheers. */
export default function LeaderboardPage() {
  const signedIn = useAccountStore((a) => a.status === 'signedIn');
  const [range, setRange] = useState<Range>('week');
  const [posts, setPosts] = useState<FeedPost[] | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    setPosts(null);
    void fetchFeed({ sort: 'top', dir: 'desc', period: range === 'week' ? 'week' : 'all', kind: null, deck: null, adult: false }).then((r) => setPosts(r.ok ? r.data ?? [] : []));
  }, [signedIn, range]);

  const cards = useMemo(() => (posts ?? []).filter((p) => p.cheers > 0).slice(0, 5), [posts]);
  const people = useMemo(() => {
    const m = new Map<string, { name: string; avatar: string; cheers: number }>();
    for (const p of posts ?? []) {
      const cur = m.get(p.authorId) ?? { name: p.authorName, avatar: p.authorAvatar, cheers: 0 };
      cur.cheers += p.cheers;
      m.set(p.authorId, cur);
    }
    return Array.from(m.values()).filter((x) => x.cheers > 0).sort((a, b) => b.cheers - a.cheers).slice(0, 5);
  }, [posts]);

  if (!signedIn) {
    return (
      <Screen title="Leaderboard" back="/me">
        <EmptyState art={<Spot name="bubble" />} title="Sign in to see rankings." body="Rankings come from cards players post and cheer in the Cards tab." />
      </Screen>
    );
  }

  return (
    <Screen title="Leaderboard" back="/me">
      <SegmentedControl<Range> label="Time range" value={range} onChange={setRange} options={[{ id: 'week', label: 'This week' }, { id: 'all', label: 'All time' }]} />
      {posts && cards.length === 0 ? (
        <div className="mt-6">
          <EmptyState art={<Spot name="bubble" />} title="No rankings yet." body="Post a card and cheer the ones you like in the Cards tab. The most cheered show up here." />
          <Link href="/cards" className="mt-4 block text-center font-bold underline">Open Cards</Link>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="mb-1 text-3xl">Most cheered cards</h2>
            <ol>
              {cards.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 border-b-2 border-line/60 py-3">
                  <span className="display w-8 text-3xl text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-lg font-bold leading-snug">{p.body}<span className="block text-sm font-semibold text-muted">by {p.authorName}</span></span>
                  <span className="shrink-0 text-lg font-extrabold tabular-nums">{p.cheers}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="mt-8">
            <h2 className="mb-1 text-3xl">Top card makers</h2>
            <ol>
              {people.map((x, i) => (
                <li key={x.name} className="flex items-center gap-3 border-b-2 border-line/60 py-3">
                  <span className="display w-8 text-3xl text-muted">{i + 1}</span>
                  <Avatar value={x.avatar} name={x.name} size={36} />
                  <span className="min-w-0 flex-1 truncate text-lg font-bold">{x.name}</span>
                  <span className="shrink-0 text-lg font-extrabold tabular-nums">{x.cheers}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </Screen>
  );
}
