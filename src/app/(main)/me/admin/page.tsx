'use client';
import { refreshAccount } from '@/components/AuthSync';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Chip, ConfirmSheet, EmptyState, Screen, TextField, toast } from '@/components/ui';
import { AuditLog } from '@/components/admin/AuditLog';
import { useAccountStore } from '@/stores/account-store';
import { useHydrated } from '@/lib/hydration';
import { refreshContent } from '@/lib/content-sync';
import {
  adminAddWord, adminApprove, adminGiveCoins, adminSendMessage, adminReportedPosts, adminRestorePost, deletePost, type ReportedPost, adminPending, adminReject, adminRemoveWord, adminRetire, adminSearchCards, adminWords,
  adminPaymentRequests, adminCompletePayment, adminRejectPayment, receiptUrl, type AdminPaymentRequest,
  type AdminCard, type PendingSuggestion,
} from '@/lib/supabase/account';
import { KIND_META, type CardKind } from '@/lib/game/card-kinds';
import { DECK_BY_ID, type DeckId } from '@/lib/game/decks';
import type { CardCategory } from '@/types/game';

type Tab = 'queue' | 'pay' | 'audit' | 'cards' | 'words' | 'coins' | 'mail';
const TABS: { id: Tab; label: string }[] = [{ id: 'queue', label: 'Queue' }, { id: 'pay', label: 'Payments' }, { id: 'audit', label: 'Audit log' }, { id: 'cards', label: 'Cards' }, { id: 'words', label: 'Words' }, { id: 'coins', label: 'Coins' }, { id: 'mail', label: 'Mail' }];

const CATEGORIES: { id: CardCategory; label: string }[] = [
  { id: 'hot_takes', label: 'Hot takes' }, { id: 'hypotheticals', label: 'Hypotheticals' }, { id: 'memories', label: 'Memories' },
  { id: 'confessions', label: 'Confessions' }, { id: 'relationships', label: 'Relationships' }, { id: 'roasts', label: 'Roasts' },
  { id: 'controversial', label: 'Controversial' }, { id: 'deep_philosophical', label: 'Deep' }, { id: 'dares', label: 'Dares' },
];
const deckName = (id: string | null) => (id && DECK_BY_ID[id as DeckId]?.name) || 'No stack';
const kindLabel = (k: string) => KIND_META[k as CardKind]?.label ?? k;

function ReportedPosts() {
  const [items, setItems] = useState<ReportedPost[] | null>(null);
  const load = useCallback(async () => { const r = await adminReportedPosts(); setItems(r.ok ? r.data ?? [] : []); }, []);
  useEffect(() => { void load(); }, [load]);
  if (!items || items.length === 0) return null;
  const act = async (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => {
    const r = await fn();
    if (!r.ok) { toast(r.error ?? 'Failed.', { tone: 'warn' }); return; }
    toast(done, { tone: 'ok' }); void load();
  };
  return (
    <section aria-label="Reported cards" className="mb-6">
      <h2 className="mb-2 text-2xl">Reported cards</h2>
      <ul className="space-y-3">
        {items.map((p) => (
          <li key={p.id} className="rounded-2xl border-2 border-line/60 bg-panel p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-muted">{p.authorName}, {p.kind}, {p.deckId}<Badge tone={p.hidden ? 'accent' : 'line'}>{p.hidden ? 'Hidden' : `${p.reports} report`}</Badge></p>
            <p className="mt-2 text-lg">{p.body}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => void act(() => adminRestorePost(p.id), 'Restored')}>Restore</Button>
              <Button variant="danger" onClick={() => void act(() => deletePost(p.id), 'Deleted')}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
              <p className="mb-1.5 text-base font-bold text-muted">Heat (leave empty to use the stack default)</p>
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

function Mail() {
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [gift, setGift] = useState('');
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const g = gift ? Number(gift) : 0;
  const everyone = email.trim() === '';
  const emailOk = everyone || /^\S+@\S+\.\S+$/.test(email.trim());
  const valid = emailOk && title.trim().length >= 1 && g >= 0 && g <= 10000;
  const send = async () => {
    setBusy(true);
    const r = await adminSendMessage(email, title, body, g);
    setBusy(false);
    setAsk(false);
    if (!r.ok) { toast(r.error ?? 'Could not send.', { tone: 'warn' }); return; }
    toast(r.data === 1 ? 'Sent to 1 player.' : `Sent to ${r.data} players.`, { tone: 'ok' });
    setTitle(''); setBody(''); setGift('');
  };
  return (
    <div>
      <p className="text-base text-muted">Players read it in Me, then Inbox. Leave the email empty to send to everyone. A gift is claimed by the player, once.</p>
      <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); if (valid) setAsk(true); }}>
        <TextField label="To (email, empty for everyone)" type="email" inputMode="email" autoCapitalize="none" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Title" value={title} maxLength={60} counter onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Message (optional)" value={body} maxLength={500} counter onChange={(e) => setBody(e.target.value)} />
        <TextField label="Coin gift (optional, up to 10000)" inputMode="numeric" value={gift} maxLength={5} onChange={(e) => setGift(e.target.value.replace(/\D/g, ''))} error={g > 10000 ? 'The most is 10000 coins.' : null} />
        <Button full type="submit" disabled={!valid || busy}>Send</Button>
      </form>
      <ConfirmSheet open={ask} title={everyone ? 'Send to everyone?' : 'Send this message?'} body={`${everyone ? 'Every player' : email.trim()} gets "${title.trim()}"${g ? ` with a ${g} coin gift` : ''}. It cannot be taken back.`} confirmLabel="Send" onConfirm={() => void send()} onClose={() => setAsk(false)} />
    </div>
  );
}

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

/** QR payments waiting to be checked. Done credits the coins once and sends the player a message. */
function Payments() {
  const [rows, setRows] = useState<AdminPaymentRequest[] | null>(null);
  const [ask, setAsk] = useState<AdminPaymentRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const openReceipt = async (path: string) => { const u = await receiptUrl(path); if (u) setShot(u); else toast('Could not open the receipt.', { tone: 'warn' }); };
  const load = useCallback(async () => { const r = await adminPaymentRequests(); setRows(r.ok ? r.data ?? [] : []); }, []);
  useEffect(() => { void load(); const t = setInterval(() => void load(), 20000); return () => clearInterval(t); }, [load]);
  const done = async (r: AdminPaymentRequest) => {
    setBusy(true);
    const res = await adminCompletePayment(r.id);
    setBusy(false); setAsk(null);
    if (!res.ok) { toast(res.error ?? 'Could not add the coins.', { tone: 'warn' }); void load(); return; }
    toast(`Added ${r.coins} coins for ${r.username ?? r.email}`, { tone: 'ok' });
    void load(); void refreshAccount();
  };
  const reject = async (r: AdminPaymentRequest) => {
    const res = await adminRejectPayment(r.id, '');
    if (!res.ok) toast(res.error ?? 'Could not reject.', { tone: 'warn' });
    void load();
  };
  if (!rows) return <p className="text-base text-muted">Loading.</p>;
  const pending = rows.filter((r) => r.status === 'pending');
  const handled = rows.filter((r) => r.status !== 'pending');
  return (
    <div>
      <p className="text-base text-muted">Match the code with the payment in your GCash or bank app, then tap Done. Pending: {pending.length}.</p>
      {pending.length === 0 ? <EmptyState title="No payments waiting" body="New requests show up here by themselves." /> : (
        <ul className="mt-3 space-y-3">
          {pending.map((r) => (
            <li key={r.id} className="rounded-xl border-2 border-line p-3">
              <p className="display text-3xl">{r.ref}</p>
              <p className="mt-1 text-lg font-bold">P{r.price_php} for {r.coins} coins</p>
              <p className="text-base text-muted">{r.username ?? 'No name'}, {r.email}, {ago(r.created_at)}</p>
              {r.receipt_path && <button className="mt-2 text-base font-bold underline" onClick={() => void openReceipt(r.receipt_path as string)}>View receipt</button>}
              <div className="mt-3 flex gap-2">
                <Button className="flex-1" disabled={busy} onClick={() => setAsk(r)}>Done, add coins</Button>
                <Button variant="secondary" onClick={() => void reject(r)}>No payment</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {handled.length > 0 && (
        <>
          <h3 className="mt-6 text-xl font-extrabold">Last 7 days</h3>
          <ul className="mt-2 divide-y divide-line/60">
            {handled.map((r) => <li key={r.id} className="py-2 text-base"><b>{r.ref}</b> {r.status}, P{r.price_php}, {r.username ?? r.email}, {ago(r.created_at)}</li>)}
          </ul>
        </>
      )}
      {shot && (
        <button aria-label="Close receipt" onClick={() => setShot(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot} alt="Payment receipt" className="max-h-full max-w-full rounded-xl bg-white object-contain" />
        </button>
      )}
      <ConfirmSheet open={!!ask} title={ask ? `Add ${ask.coins} coins?` : ''} body={ask ? `${ask.username ?? ask.email} paid P${ask.price_php} with code ${ask.ref}? Only tap this once the money is in your account.` : ''} confirmLabel="Add coins" onConfirm={() => { if (ask) void done(ask); }} onClose={() => setAsk(null)} />
    </div>
  );
}

function Coins() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const n = Number(amount);
  const valid = /^\S+@\S+\.\S+$/.test(email.trim()) && Number.isInteger(n) && n >= 1 && n <= 10000;
  const tooMany = Number.isFinite(n) && n > 10000;
  const give = async () => {
    setBusy(true);
    const r = await adminGiveCoins(email.trim(), n, note.trim());
    setBusy(false);
    setAsk(false);
    if (!r.ok) { toast(r.error ?? 'Could not give coins.', { tone: 'warn' }); return; }
    toast(`Gave ${n} coins to ${email.trim()}. They now have ${r.data}.`, { tone: 'ok' });
    void refreshAccount();
    setAmount(''); setNote('');
  };
  return (
    <div>
      <p className="text-base text-muted">For beta testing, before payments exist. Use the email the player signed in with. The coins are added to their ledger as a top up.</p>
      <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); if (valid) setAsk(true); }}>
        <TextField label="Player email" type="email" inputMode="email" autoCapitalize="none" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Coins" inputMode="numeric" helper="Whole number, 1 to 10000." error={tooMany ? 'Most you can give at once is 10000.' : null} value={amount} maxLength={5} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
        <TextField label="Note (optional)" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} />
        <Button full type="submit" disabled={!valid || busy}>Give coins</Button>
      </form>
      <ConfirmSheet open={ask} title={`Give ${n} coins?`} body={`${email.trim()} will get ${n} coins. This cannot be taken back from here.`} confirmLabel="Give coins" onConfirm={() => void give()} onClose={() => setAsk(false)} />
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
        <div role="tablist" aria-label="Admin section" className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              ref={(el) => { if (el && tab === t.id) el.scrollIntoView({ inline: 'center', block: 'nearest' }); }}
              className={`h-11 shrink-0 snap-start rounded-xl border-2 px-4 text-base font-extrabold ${tab === t.id ? 'border-accent bg-accent text-onaccent' : 'border-line text-muted'}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="mt-4">{tab === 'queue' ? <><ReportedPosts /><Queue /></> : tab === 'pay' ? <Payments /> : tab === 'audit' ? <AuditLog /> : tab === 'cards' ? <Cards /> : tab === 'coins' ? <Coins /> : tab === 'mail' ? <Mail /> : <Words />}</div>
    </Screen>
  );
}
