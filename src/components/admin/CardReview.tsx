'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Badge, Button, EmptyState, toast } from '@/components/ui';
import { refreshContent } from '@/lib/content-sync';
import {
  adminApprove, adminApproveCards, adminRestoreCard, adminReviewedCards, adminPending, adminReject, adminRetire, adminReviewQueue, adminUndoReview,
  type PendingSuggestion, type ReviewCard,
} from '@/lib/supabase/account';
import { KIND_META, type CardKind } from '@/lib/game/card-kinds';
import { DECK_BY_ID, type DeckId } from '@/lib/game/decks';
import { cardTextClass } from '@/lib/card-text';
import { cn } from '@/lib/cn';

/** One card to decide on: a player suggestion (not a card yet) or a card that is waiting for its first review. */
interface Item { id: string; text: string; kind: string; deckId: string | null; adult: boolean; by?: string; suggestion: boolean; heat?: number }
interface Done { item: Item; action: 'approve' | 'remove' }

const fromSuggestion = (s: PendingSuggestion): Item => ({ id: s.id, text: s.text, kind: s.kind, deckId: s.deckId, adult: s.deckId === 'adult', by: s.authorName, suggestion: true });
const fromCard = (c: ReviewCard): Item => ({ id: c.id, text: c.text, kind: c.kind, deckId: c.deckId, adult: c.adult, suggestion: false, heat: c.intensity });
const deckName = (id: string | null) => (id && DECK_BY_ID[id as DeckId]?.name) || 'No deck';

function ReviewCards() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [left, setLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<Done | null>(null);
  const [count, setCount] = useState({ approved: 0, removed: 0 });
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    const [p, q] = await Promise.all([adminPending(), adminReviewQueue(10)]);
    if (!p.ok || !q.ok) { setError((!p.ok ? p.error : !q.ok ? q.error : null) ?? 'Could not load.'); return; }
    const sug = (p.data ?? []).map(fromSuggestion);
    setItems([...sug, ...q.data!.cards.map(fromCard)]);
    setLeft(sug.length + q.data!.total);
    setError(null);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const current = items?.[0];

  const decide = useCallback(async (action: 'approve' | 'remove') => {
    if (!current || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    const r = current.suggestion
      ? action === 'approve' ? await adminApprove(current.id) : await adminReject(current.id, '')
      : action === 'approve' ? await adminApproveCards([current.id]) : await adminRetire([current.id]);
    busyRef.current = false; setBusy(false);
    if (!r.ok) { toast(r.error ?? 'Could not save. Try again.', { tone: 'warn' }); return; }
    setLast({ item: current, action });
    setCount((c) => ({ approved: c.approved + (action === 'approve' ? 1 : 0), removed: c.removed + (action === 'remove' ? 1 : 0) }));
    setLeft((n) => Math.max(0, n - 1));
    const rest = (items ?? []).slice(1);
    setItems(rest);
    if (rest.length < 3) void load();
    if (action === 'remove' && !current.suggestion) void refreshContent(true);
    if (action === 'approve' && current.suggestion) void refreshContent(true);
  }, [current, items, load]);

  const undo = async () => {
    if (!last || last.item.suggestion || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    const r = await adminUndoReview(last.item.id);
    busyRef.current = false; setBusy(false);
    if (!r.ok) { toast(r.error ?? 'Could not undo.', { tone: 'warn' }); return; }
    setItems((list) => [last.item, ...(list ?? [])]);
    setLeft((n) => n + 1);
    setCount((c) => ({ approved: c.approved - (last.action === 'approve' ? 1 : 0), removed: c.removed - (last.action === 'remove' ? 1 : 0) }));
    setLast(null);
    void refreshContent(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowRight') void decide('approve');
      else if (e.key === 'ArrowLeft') void decide('remove');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide]);

  const x = useMotionValue(0);
  const tilt = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const okOpacity = useTransform(x, [20, 120], [0, 1]);
  const noOpacity = useTransform(x, [-120, -20], [1, 0]);

  if (error) return <p className="py-6 text-lg font-bold text-danger">{error}</p>;
  if (!items) return <p className="py-6 text-lg text-muted">Loading...</p>;
  if (!current) {
    return (
      <div>
        <EmptyState title="Every card is reviewed" body={`${count.approved} approved and ${count.removed} removed this time. New cards and player suggestions will show up here first.`} />
        {last && !last.item.suggestion && <Button full variant="secondary" disabled={busy} onClick={() => void undo()}>Undo the last one</Button>}
      </div>
    );
  }

  const meta = KIND_META[current.kind as CardKind];
  
  return (
    <div>
      <p className="flex items-center justify-between text-base font-bold text-muted">
        <span>{left} left to review</span>
        <span>{count.approved} approved, {count.removed} removed</span>
      </p>

      <div className="relative mt-3">
        <motion.div
          key={current.id}
          data-deck={current.deckId ?? undefined}
          drag={busy ? false : 'x'}
          dragSnapToOrigin
          dragElastic={0.6}
          style={{ x, rotate: tilt }}
          onDragEnd={(_, info) => { if (info.offset.x > 110) void decide('approve'); else if (info.offset.x < -110) void decide('remove'); }}
          className="relative flex min-h-[18rem] touch-pan-y flex-col justify-between rounded-card bg-accent p-5 text-onaccent"
        >
          <motion.span style={{ opacity: okOpacity }} className="absolute right-4 top-4 rounded-lg border-4 border-current px-3 py-1 text-xl font-extrabold">Keep</motion.span>
          <motion.span style={{ opacity: noOpacity }} className="absolute left-4 top-4 rounded-lg border-4 border-current px-3 py-1 text-xl font-extrabold">Remove</motion.span>
          <div className="pt-8">
            <p className={cn('display break-words leading-tight', cardTextClass(current.text.length, true))}>{current.text}</p>
          </div>
          <p className="mt-4 text-base font-bold opacity-80">{meta?.label ?? current.kind}, {deckName(current.deckId)}{current.heat ? `, heat ${current.heat}` : ''}</p>
        </motion.div>
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-2 text-base text-muted">
        {current.suggestion ? <Badge tone="accent">New suggestion{current.by ? ` from ${current.by}` : ''}</Badge> : <Badge tone="line">In play now</Badge>}
        {current.adult && <Badge tone="line">18+</Badge>}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button size="lg" variant="danger" disabled={busy} onClick={() => void decide('remove')}>Remove</Button>
        <Button size="lg" disabled={busy} onClick={() => void decide('approve')}>{current.suggestion ? 'Approve' : 'Keep'}</Button>
      </div>
      <Button full variant="secondary" className="mt-3" disabled={busy || !last || last.item.suggestion} onClick={() => void undo()}>Undo the last one</Button>
      <p className="mt-3 text-sm text-muted">Swipe the card, or use the left and right arrow keys. Remove takes the card out of every game. Cards you have not reviewed yet stay in play.</p>
    </div>
  );
}

function History({ which }: { which: 'removed' | 'approved' }) {
  const [data, setData] = useState<{ total: number; cards: ReviewCard[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await adminReviewedCards(which, 100);
    if (r.ok) { setData(r.data!); setError(null); } else setError(r.error ?? 'Could not load.');
  }, [which]);
  useEffect(() => { setData(null); void load(); }, [load]);
  const act = async (c: ReviewCard) => {
    const r = which === 'removed' ? await adminRestoreCard(c.id) : await adminRetire([c.id]);
    if (!r.ok) { toast(r.error ?? 'Could not save.', { tone: 'warn' }); return; }
    toast(which === 'removed' ? 'Back in play.' : 'Removed.', { tone: 'ok' });
    void load(); void refreshContent(true);
  };
  if (error) return <p className="py-6 text-lg font-bold text-danger">{error}</p>;
  if (!data) return <p className="py-6 text-lg text-muted">Loading...</p>;
  if (data.cards.length === 0) return <EmptyState title={which === 'removed' ? 'No removed cards' : 'Nothing approved yet'} body={which === 'removed' ? 'Cards you remove are kept here, out of every game, until you put them back.' : 'Cards you approve stay in the decks and show here.'} />;
  return (
    <div>
      <p className="mb-2 text-base font-bold text-muted">{data.total} {which === 'removed' ? 'removed' : 'approved'}{data.total > data.cards.length ? `, showing the latest ${data.cards.length}` : ''}</p>
      <ul>
        {data.cards.map((c) => (
          <li key={c.id} data-deck={c.deckId ?? undefined} className="flex items-start gap-3 border-b-2 border-line/60 py-3">
            <span aria-hidden className="mt-1.5 h-4 w-4 shrink-0 rounded-sm bg-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-lg">{c.text}</p>
              <p className="mt-1 text-base text-muted">{KIND_META[c.kind as CardKind]?.label ?? c.kind}, {deckName(c.deckId)}</p>
            </div>
            <Button variant={which === 'removed' ? 'secondary' : 'danger'} onClick={() => void act(c)}>{which === 'removed' ? 'Put back' : 'Remove'}</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Admin card review: go through cards one by one, then look back at what was approved or removed. */
export function CardReview() {
  const [view, setView] = useState<'review' | 'approved' | 'removed'>('review');
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {([['review', 'Review'], ['approved', 'Approved'], ['removed', 'Removed']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} aria-pressed={view === id} className={cn('rounded-full border-2 px-4 py-2 text-base font-extrabold', view === id ? 'border-transparent bg-accent text-onaccent' : 'border-line text-muted')}>{label}</button>
        ))}
      </div>
      {view === 'review' ? <ReviewCards /> : <History which={view} />}
    </div>
  );
}
