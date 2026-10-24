'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Chip, ConfirmSheet, EmptyState, Screen, SegmentedControl, TextField, toast } from '@/components/ui';
import { useAccountStore } from '@/stores/account-store';
import { useHydrated } from '@/lib/hydration';
import { refreshContent } from '@/lib/content-sync';
import {
  adminAddWord, adminApprove, adminPending, adminReject, adminRemoveWord, adminRetire, adminSearchCards, adminWords,
  type AdminCard, type PendingSuggestion,
} from '@/lib/supabase/account';
import { KIND_META, type CardKind } from '@/lib/game/card-kinds';
import { DECK_BY_ID, type DeckId } from '@/lib/game/decks';
import type { CardCategory } from '@/types/game';

type Tab = 'queue' | 'cards' | 'words';

const CATEGORIES: { id: CardCategory; label: string }[] = [
  { id: 'hot_takes', label: 'Hot takes' }, { id: 'hypotheticals', label: 'Hypotheticals' }, { id: 'memories', label: 'Memories' },
  { id: 'confessions', label: 'Confessions' }, { id: 'relationships', label: 'Relationships' }, { id: 'roasts', label: 'Roasts' },
  { id: 'controversial', label: 'Controversial' }, { id: 'deep_philosophical', label: 'Deep' }, { id: 'dares', label: 'Dares' },
];
const deckName = (id: string | null) => (id && DECK_BY_ID[id as DeckId]?.name) || 'No deck';
const kindLabel = (k: string) => KIND_META[k as CardKind]?.label ?? k;

function Queue() {
  const [items, setItems] = useState<PendingSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number | undefined>();
  const [category, setCategory] = useState<CardCategory | undefined>();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await adminPending();
    if (r.ok) { setItems(r.data ?? []); setError(null); } else setError(r.error ?? 'Could not load.');
  }, []);
  useEffect(() => { void load(); }, [load]);

  const pick = (id: string) => { setOpen(open === id ? null : id); setIntensity(undefined); setCategory(undefined); setReason(''); };
  const approve = async (s: PendingSuggestion) => {
    setBusy(true);
    const r = await adminApprove(s.id, intensity, category);
    setBusy(false);
    if (!r.ok) { toast(r.error ?? 'Could not approve.', { tone: 'warn' }); return; }
    toast('Approved. It is now a card.', { tone: 'ok' });
    setOpen(null); void load(); void refreshContent(true);
  };
  const reject = async (s: PendingSuggestion) => {
    setBusy(true);
    const r = await adminReject(s.id, reason);
    setBusy(false);
    if (!r.ok) { toast(r.error ?? 'Could not reject.', { tone: 'warn' }); return; }
    toast('Rejected.', { tone: 'ok' });
    setOpen(null); void load();
  };

  if (error) return <p className="py-6 text-lg font-bold text-danger">{error}</p>;
  if (!items) return <p className="py-6 text-lg text-muted">Loading...</p>;
  if (items.length === 0) return <EmptyState title="Nothing waiting" body="New suggestions from players show up here." />;
  return (
    <ul>
      {items.map((s) => (
        <li key={s.id} className="border-b-2 border-line/60 py-4">
          <button onClick={() => pick(s.id)} className="w-full text-left" aria-expanded={open === s.id}>
            <p className="text-lg">{s.text}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-base text-muted">
              <Badge tone="line">{kindLabel(s.kind)}</Badge><Badge tone="line">{deckName(s.deckId)}</Badge><span>by {s.authorName}</span>
            </p>
          </button>
          {open === s.id && (
            <div className="mt-4">
              <p className="mb-1.5 text-base font-bold text-muted">Heat (leave empty to use the deck default)</p>
              <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <Chip key={n} selected={intensity === n} onClick={() => setIntensity(intensity === n ? undefined : n)}>{n}</Chip>)}</div>
              <p className="mb-1.5 mt-4 text-base font-bold text-muted">Category (leave empty for the default)</p>
              <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c.id} selected={category === c.id} onClick={() => setCategory(category === c.id ? undefined : c.id)}>{c.label}</Chip>)}</div>
              <Button size="lg" full className="mt-4" disabled={busy} onClick={() => approve(s)}>Approve and make it a card</Button>
              <div className="mt-4"><TextField label="Reason for rejecting (optional)" value={reason} maxLength={200} counter onChange={(e) => setReason(e.target.value)} /></div>
              <Button full variant="secondary" className="mt-3" disabled={busy} onClick={() => reject(s)}>Reject</Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Cards() {
  const [q, setQ] = useState('');
  const [cards, setCards] = useState<AdminCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ask, setAsk] = useState<AdminCard | null>(null);

  const search = useCallback(async (text: string) => {
    const r = await adminSearchCards(text);
    if (r.ok) { setCards(r.data ?? []); setError(null); } else setError(r.error ?? 'Could not load.');
  }, []);
  useEffect(() => { void search(''); }, [search]);

  const retire = async (c: AdminCard) => {
    const r = await adminRetire([c.id]);
    if (!r.ok) { toast(r.error ?? 'Could not retire.', { tone: 'warn' }); return; }
    toast('Card retired. It leaves games on the next load.', { tone: 'ok' });
    void search(q); void refreshContent(true);
  };

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); void search(q); }}>
        <TextField label="Find a card" placeholder="Words from the card" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button className="mt-3" full variant="secondary" type="submit">Search</Button>
      </form>
      {error && <p className="py-4 text-lg font-bold text-danger">{error}</p>}
      {cards && cards.length === 0 && <p className="py-6 text-lg text-muted">No cards match.</p>}
      <ul className="mt-2">
        {(cards ?? []).map((c) => (
          <li key={c.id} className="border-b-2 border-line/60 py-4">
            <p className={c.status === 'retired' ? 'text-lg text-muted line-through' : 'text-lg'}>{c.text}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-base text-muted">
              <Badge tone="line">{kindLabel(c.kind)}</Badge>{c.adult && <Badge>18+</Badge>}<span>{c.id}</span>
              {c.status === 'retired' ? <Badge tone="line">Retired</Badge> : <button onClick={() => setAsk(c)} className="ml-auto font-bold text-danger">Retire</button>}
            </p>
          </li>
        ))}
      </ul>
      <ConfirmSheet open={!!ask} title="Retire this card?" body={ask?.text} confirmLabel="Retire card" danger onConfirm={() => ask && void retire(ask)} onClose={() => setAsk(null)} />
    </div>
  );
}

function Words() {
  const [words, setWords] = useState<string[] | null>(null);
  const [word, setWord] = useState('');
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await adminWords();
    if (r.ok) { setWords(r.data ?? []); setError(null); } else setError(r.error ?? 'Could not load.');
  }, []);
  useEffect(() => { void load(); }, [load]);
  const add = async () => {
    if (word.trim().length < 2) return;
    const r = await adminAddWord(word);
    if (!r.ok) { toast(r.error ?? 'Could not add.', { tone: 'warn' }); return; }
    setWord(''); void load();
  };
  const remove = async (w: string) => {
    const r = await adminRemoveWord(w);
    if (!r.ok) { toast(r.error ?? 'Could not remove.', { tone: 'warn' }); return; }
    void load();
  };
  return (
    <div>
      <p className="text-base text-muted">Suggestions that contain these words are refused when they are sent.</p>
      <form className="mt-3" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <TextField label="Add a word" value={word} maxLength={40} onChange={(e) => setWord(e.target.value)} />
        <Button className="mt-3" full type="submit" disabled={word.trim().length < 2}>Block this word</Button>
      </form>
      {error && <p className="py-4 text-lg font-bold text-danger">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {(words ?? []).map((w) => <Chip key={w} selected onClick={() => void remove(w)}>{w} ✕</Chip>)}
      </div>
      {words && words.length > 0 && <p className="mt-2 text-base text-muted">Tap a word to unblock it.</p>}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const status = useAccountStore((a) => a.status);
  const isAdmin = useAccountStore((a) => a.isAdmin);
  const [tab, setTab] = useState<Tab>('queue');

  useEffect(() => {
    if (hydrated && (status === 'signedOut' || status === 'off' || (status === 'signedIn' && !isAdmin))) router.replace('/me');
  }, [hydrated, status, isAdmin, router]);
  if (!hydrated || status !== 'signedIn' || !isAdmin) return null;

  return (
    <Screen title="Admin" back="/me">
      <p className="text-lg text-muted">Only admins see this screen. Changes go live for everyone.</p>
      <div className="mt-4">
        <SegmentedControl<Tab> label="Admin section" value={tab} onChange={setTab} options={[{ id: 'queue', label: 'Suggestions' }, { id: 'cards', label: 'Cards' }, { id: 'words', label: 'Blocked words' }]} />
      </div>
      <div className="mt-4">{tab === 'queue' ? <Queue /> : tab === 'cards' ? <Cards /> : <Words />}</div>
    </Screen>
  );
}
