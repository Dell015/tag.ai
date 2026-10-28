'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Chip, EmptyState, Screen, Spot, toast } from '@/components/ui';
import { useAccountStore } from '@/stores/account-store';
import { mySuggestions, submitSuggestion, type MySuggestion } from '@/lib/supabase/account';
import { DECK_BY_ID } from '@/lib/game/decks';
import { MAX_LEN, MAX_PER_DAY, MIN_LEN, SUGGEST_DECKS, type SuggestDeck } from '@/lib/game/suggestions';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

type Kind = 'truth' | 'dare';
const STATUS = { pending: { label: 'Waiting for review', tone: 'line' }, approved: { label: 'In the game', tone: 'ok' }, rejected: { label: 'Not used', tone: 'line' } } as const;

/** Players write a card and send it. An admin reads every one before it can reach a deck. */
export default function SuggestPage() {
  const signedIn = useAccountStore((a) => a.status === 'signedIn');
  const [text, setText] = useState('');
  const [kind, setKind] = useState<Kind>('truth');
  const [deck, setDeck] = useState<SuggestDeck>('barkada');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<MySuggestion[] | null>(null);

  const load = useCallback(async () => { const r = await mySuggestions(); if (r.ok) setMine(r.data ?? []); }, []);
  useEffect(() => { if (signedIn) void load(); }, [signedIn, load]);

  if (!signedIn) {
    return (
      <Screen title="Suggest a card" back="/me">
        <EmptyState art={<Spot name="bubble" />} title="Sign in to suggest cards." body="Every suggested card is read by a person before it reaches a deck." />
        <Link href="/welcome?next=/me/suggest" className="mt-4 block"><Button full>Sign in</Button></Link>
      </Screen>
    );
  }

  const submit = async () => {
    const t = text.trim().replace(/\s+/g, ' ');
    if (t.length < MIN_LEN) { setError(`Write at least ${MIN_LEN} characters.`); haptic('warn'); return; }
    setBusy(true);
    const r = await submitSuggestion(t, kind, deck);
    setBusy(false);
    if (!r.ok) { setError(r.error ?? 'Could not send the card.'); haptic('warn'); return; }
    setText(''); setError(null); haptic('success');
    toast('Card sent. We will review it.', { tone: 'ok' });
    void load();
  };

  const left = mine ? Math.max(0, MAX_PER_DAY - mine.filter((s) => Date.now() - s.createdAt < 86_400_000).length) : MAX_PER_DAY;

  return (
    <Screen title="Suggest a card" back="/me">
      <p className="text-lg text-muted">Write a card for the game. We read every card before it goes into a deck, and you can see here what happened to yours.</p>

      <section className="mt-6" aria-label="Write a card">
        <p className="mb-1.5 text-base font-bold text-muted">Is it a truth or a dare?</p>
        <div className="flex flex-wrap gap-2">
          <Chip selected={kind === 'truth'} onClick={() => setKind('truth')}>Truth</Chip>
          <Chip selected={kind === 'dare'} onClick={() => setKind('dare')}>Dare</Chip>
        </div>
        <p className="mb-1.5 mt-4 text-base font-bold text-muted">Which deck?</p>
        <div className="flex flex-wrap gap-2">{SUGGEST_DECKS.map((d) => <Chip key={d} selected={deck === d} onClick={() => setDeck(d)}>{DECK_BY_ID[d].name}</Chip>)}</div>
        <label htmlFor="suggest-text" className="mb-1.5 mt-4 flex justify-between text-base font-bold text-muted"><span>Card text</span><span>{text.length}/{MAX_LEN}</span></label>
        <textarea id="suggest-text" value={text} maxLength={MAX_LEN} rows={4} onChange={(e) => { setText(e.target.value); setError(null); }} aria-invalid={!!error}
          placeholder={kind === 'dare' ? 'Call your last ex and say hi. Or take a shot.' : 'What is the pettiest thing you have ever done?'}
          className={cn('w-full resize-none rounded-xl border-2 bg-transparent p-4 text-lg placeholder:text-muted/50 focus:border-accent', error ? 'border-danger' : 'border-line')} />
        <p className={cn('mt-1.5 text-base', error ? 'font-bold text-danger' : 'text-muted')}>{error ?? `Say it plainly, like "take a shot". No names, phone numbers or links. ${left} of ${MAX_PER_DAY} cards left today.${deck === 'adult' ? ' Adult cards stay 18+.' : ''}`}</p>
        <Button size="lg" full className="mt-3" onClick={() => void submit()} disabled={busy}>{busy ? 'Sending' : 'Send card'}</Button>
      </section>

      <section className="mt-8" aria-label="Your suggestions">
        <h2 className="mb-1 text-3xl">Your cards</h2>
        {mine === null ? <p className="py-4 text-muted">Loading</p> : mine.length === 0 ? (
          <p className="py-4 text-lg text-muted">Nothing sent yet. Cards that get in show up as In the game.</p>
        ) : (
          <ul>
            {mine.map((s) => (
              <li key={s.id} className="border-b-2 border-line/60 py-4">
                <p className="text-lg font-bold leading-snug">{s.text}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-base text-muted">
                  <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
                  <span>{s.kind === 'dare' ? 'Dare' : 'Truth'}, {DECK_BY_ID[s.deckId as SuggestDeck]?.name ?? s.deckId}</span>
                </p>
                {s.status === 'rejected' && s.reason && <p className="mt-1 text-base text-muted">Reason: {s.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}
