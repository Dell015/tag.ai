'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Avatar, Button, ConfirmSheet, EmptyState, Icon, Screen, SegmentedControl, Sheet, Spot, Toggle, toast } from '@/components/ui';
import { supabaseConfigured } from '@/lib/supabase/config';
import { useAccountStore } from '@/stores/account-store';
import { cheerPost, deletePost, fetchFeed, reportPost, type FeedPost } from '@/lib/supabase/account';
import { KIND_META, type CardKind } from '@/lib/game/card-kinds';
import { DECK_BY_ID } from '@/lib/game/decks';
import { PostComposer } from '@/components/cards/PostComposer';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

type Sort = 'new' | 'top';
const ADULT_KEY = 'tagai-feed-adult';

function FeedCard({ p, i, onCheer, onMore }: { p: FeedPost; i: number; onCheer: () => void; onMore: () => void }) {
  return (
    <motion.li initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28, delay: Math.min(i, 8) * 0.04 }}
      data-kind={p.kind} className="flex flex-col rounded-2xl border-[3px] border-[#181310] bg-accent p-4 text-onaccent">
      <div className="flex items-center justify-between">
        <span className="sign text-sm">{KIND_META[p.kind as CardKind]?.label ?? p.kind}</span>
        <span className="text-xs font-extrabold opacity-75">{DECK_BY_ID[p.deckId as keyof typeof DECK_BY_ID]?.name ?? p.deckId}</span>
      </div>
      <p className="display mt-3 flex-1 text-[1.55rem] leading-[1.08]">{p.body}</p>
      <div className="mt-4 flex items-center gap-2">
        <Avatar value={p.authorAvatar} name={p.authorName} size={26} />
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{p.mine ? 'You' : p.authorName}</span>
        <button onClick={onMore} aria-label="More" className="flex h-tap w-10 items-center justify-center rounded-lg opacity-75 active:opacity-100"><Icon name="more" size={20} /></button>
        <button onClick={onCheer} disabled={p.mine} aria-pressed={p.cheered} aria-label={`Cheers, ${p.cheers}`}
          className={cn('flex h-tap items-center gap-1.5 rounded-xl border-2 border-[#181310] px-3.5 text-base font-extrabold tabular-nums transition-transform active:scale-95 disabled:opacity-60', p.cheered ? 'bg-[#181310] text-white' : 'bg-white/25')}>
          <Icon name="shot" size={18} filled={p.cheered} />{p.cheers}
        </button>
      </div>
    </motion.li>
  );
}

export default function CardsPage() {
  const signedIn = useAccountStore((a) => a.status === 'signedIn');
  const adultOk = useAccountStore((a) => a.adultConfirmed);
  const [sort, setSort] = useState<Sort>('new');
  const [adult, setAdult] = useState(false);
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState(false);
  const [more, setMore] = useState<FeedPost | null>(null);
  const [del, setDel] = useState<FeedPost | null>(null);

  useEffect(() => { try { setAdult(window.localStorage.getItem(ADULT_KEY) === '1'); } catch { /* ignore */ } }, []);

  const load = useCallback(async () => {
    if (!signedIn) return;
    const r = await fetchFeed(sort, adult && adultOk);
    if (r.ok && r.data) { setPosts(r.data); setError(''); } else setError(r.error ?? 'Could not load cards.');
  }, [signedIn, sort, adult, adultOk]);
  useEffect(() => { void load(); }, [load]);

  const cheer = async (p: FeedPost) => {
    haptic('tap');
    setPosts((cur) => cur?.map((x) => (x.id === p.id ? { ...x, cheered: !x.cheered, cheers: x.cheers + (x.cheered ? -1 : 1) } : x)) ?? cur);
    const r = await cheerPost(p.id);
    if (!r.ok || !r.data) { toast(r.error ?? 'Could not cheer.', { tone: 'warn' }); void load(); return; }
    const d = r.data;
    setPosts((cur) => cur?.map((x) => (x.id === p.id ? { ...x, cheered: d.cheered, cheers: d.cheers } : x)) ?? cur);
  };

  const report = async (p: FeedPost) => {
    setMore(null);
    const r = await reportPost(p.id);
    if (!r.ok) { toast(r.error ?? 'Could not report.', { tone: 'warn' }); return; }
    setPosts((cur) => cur?.filter((x) => x.id !== p.id) ?? cur);
    toast('Reported. It is hidden for you.', {});
  };

  const remove = async (p: FeedPost) => {
    const r = await deletePost(p.id);
    if (!r.ok) { toast(r.error ?? 'Could not delete.', { tone: 'warn' }); return; }
    setPosts((cur) => cur?.filter((x) => x.id !== p.id) ?? cur);
    toast('Deleted', {});
  };

  if (!supabaseConfigured || !signedIn) {
    return (
      <Screen title="Cards">
        <EmptyState art={<Spot name="bubble" />} title="Sign in to see cards." body="Cards posted by other players show up here once you are signed in with your email."
          action={<Link href="/me/suggest" className="block"><Button size="lg" full variant="secondary">Suggest a card</Button></Link>} />
      </Screen>
    );
  }

  return (
    <Screen title="Cards" wide action={<Button onClick={() => setCompose(true)} className="gap-1.5 px-4"><Icon name="plus" size={20} />Post</Button>}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-xs"><SegmentedControl<Sort> label="Order" value={sort} onChange={setSort} options={[{ id: 'new', label: 'New' }, { id: 'top', label: 'Top this month' }]} /></div>
        {adultOk && (
          <label className="flex items-center gap-2.5 text-sm font-bold text-muted">18+ cards
            <Toggle checked={adult} label="Show 18+ cards" onChange={(v) => { setAdult(v); try { window.localStorage.setItem(ADULT_KEY, v ? '1' : '0'); } catch { /* ignore */ } }} />
          </label>
        )}
      </div>

      {error && <p role="alert" className="mt-4 text-base font-bold text-danger">{error}</p>}
      {posts && posts.length === 0 && !error && (
        <EmptyState art={<Spot name="cards" />} title={sort === 'top' ? 'No cheers yet this month.' : 'No cards yet.'} body="Post a truth, a dare or a rule. The most cheered cards each month become a stack in the shop."
          action={<Button size="lg" onClick={() => setCompose(true)}>Post a card</Button>} />
      )}
      <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts?.map((p, i) => <FeedCard key={p.id} p={p} i={i} onCheer={() => void cheer(p)} onMore={() => setMore(p)} />)}
      </ul>

      <PostComposer open={compose} onClose={() => setCompose(false)} adultOk={adultOk} onPosted={() => { setSort('new'); void load(); }} />

      <Sheet open={!!more} onClose={() => setMore(null)}>
        {more && (
          <div className="space-y-3 pb-2">
            {more.mine
              ? <Button full variant="danger" onClick={() => { setDel(more); setMore(null); }}>Delete my card</Button>
              : <Button full variant="secondary" onClick={() => void report(more)}>Report this card</Button>}
            <Button full variant="ghost" onClick={() => setMore(null)}>Close</Button>
          </div>
        )}
      </Sheet>
      <ConfirmSheet open={!!del} title="Delete this card?" body="It disappears for everyone, along with its cheers." confirmLabel="Delete" danger onConfirm={() => { if (del) void remove(del); }} onClose={() => setDel(null)} />
    </Screen>
  );
}
