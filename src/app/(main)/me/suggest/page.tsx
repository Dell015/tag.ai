'use client';
import { useMemo, useState } from 'react';
import { Badge, Chip, Icon, Screen, SegmentedControl, toast } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { useSuggestionStore } from '@/stores/suggestion-store';
import { KIND_META } from '@/lib/game/card-kinds';
import { DECK_BY_ID } from '@/lib/game/decks';
import { MAX_LEN, MAX_PER_DAY, SUGGEST_DECKS, SUGGEST_KINDS, WEEKLY_REWARD, nextWeekStart, prevWeekStart, validateSuggestion, weekKey, weekStart, weekWinner, weeklyRanking, type SuggestDeck, type SuggestKind } from '@/lib/game/suggestions';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

type Board = 'this' | 'last';

export default function SuggestPage() {
  const profile = useProfileStore((s) => s.profile)!;
  const items = useSuggestionStore((s) => s.items);
  const claimed = useSuggestionStore((s) => s.claimed);
  const { add, toggleLike, claimLastWeek } = useSuggestionStore.getState();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<SuggestKind>('truth');
  const [deck, setDeck] = useState<SuggestDeck>('barkada');
  const [board, setBoard] = useState<Board>('this');
  const [error, setError] = useState<string | null>(null);

  const now = Date.now();
  const thisStart = weekStart(now);
  const lastStart = prevWeekStart(now);
  const ranking = useMemo(() => weeklyRanking(items, board === 'this' ? thisStart : lastStart), [items, board, thisStart, lastStart]);
  const lastWinner = useMemo(() => weekWinner(items, lastStart), [items, lastStart]);
  const canClaim = !!lastWinner && lastWinner.authorId === profile.id && !claimed.includes(weekKey(lastStart));
  const daysLeft = Math.max(1, Math.ceil((nextWeekStart(now) - now) / 86_400_000));
  const sorted = useMemo(() => [...items].sort((a, b) => b.likes.length - a.likes.length || b.createdAt - a.createdAt), [items]);
  const mine = items.filter((s) => s.authorId === profile.id).length;

  const submit = () => {
    const err = validateSuggestion(text, profile.id, items, Date.now());
    setError(err);
    if (err) { haptic('warn'); return; }
    add({ text, kind, deckId: deck }, { id: profile.id, name: profile.username });
    setText(''); haptic('success'); toast('Card sent. Ask friends to like it.', { tone: 'ok' });
  };

  return (
    <Screen title="Suggest a card" back="/me">
      <p className="text-lg text-muted">Write a card for the game. Friends like the good ones. The top contributor each week gets {WEEKLY_REWARD} coins.</p>
      <p className="mt-2 flex items-center gap-2 text-base text-muted"><Badge tone="line">Sample data</Badge> Moderation and real payouts arrive with accounts.</p>

      {canClaim && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[#FFC72C] px-5 py-4 text-[#181310]">
          <div><p className="display text-3xl leading-none">You won last week</p><p className="mt-1 text-base font-bold">{WEEKLY_REWARD} free coins</p></div>
          <button onClick={() => { const n = claimLastWeek(profile.id); if (n) { haptic('success'); toast(`${n} coins added`, { tone: 'ok' }); } }} className="min-h-tap rounded-xl bg-[#181310] px-4 text-lg font-extrabold text-[#FFC72C]">Claim</button>
        </div>
      )}

      <section className="mt-6" aria-label="Write a card">
        <h2 className="mb-2 text-3xl">Your card</h2>
        <p className="mb-1.5 text-base font-bold text-muted">Card type</p>
        <div className="flex flex-wrap gap-2">{SUGGEST_KINDS.map((k) => <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>{KIND_META[k].label}</Chip>)}</div>
        <p className="mb-1.5 mt-4 text-base font-bold text-muted">Deck</p>
        <div className="flex flex-wrap gap-2">{SUGGEST_DECKS.map((d) => <Chip key={d} selected={deck === d} onClick={() => setDeck(d)}>{DECK_BY_ID[d].name}</Chip>)}</div>
        <label htmlFor="suggest-text" className="mb-1.5 mt-4 flex justify-between text-base font-bold text-muted"><span>Card text</span><span>{text.length}/{MAX_LEN}</span></label>
        <textarea id="suggest-text" value={text} maxLength={MAX_LEN} rows={4} onChange={(e) => { setText(e.target.value); setError(null); }} aria-invalid={!!error}
          placeholder={kind === 'dice' || kind === 'coin' || kind === 'bottle' || kind === 'wheel' ? 'Roll the die. Your number is how many...' : kind === 'rule' ? 'Everyone speaks only in questions until the next wild card.' : 'What is the pettiest thing you did this year?'}
          className={cn('w-full resize-none rounded-xl border-2 bg-transparent p-4 text-lg placeholder:text-muted/50 focus:border-accent', error ? 'border-danger' : 'border-line')} />
        <p className={cn('mt-1.5 text-base', error ? 'font-bold text-danger' : 'text-muted')}>{error ?? `Say it plainly, like "take a shot". ${MAX_PER_DAY} cards a day. ${deck === 'adult' ? 'Adult cards stay 18+.' : ''}`}</p>
        <button onClick={submit} className="mt-3 min-h-cta w-full rounded-xl bg-accent px-5 text-xl font-extrabold text-onaccent active:translate-y-px">Send card</button>
        {mine > 0 && <p className="mt-2 text-base text-muted">You have sent {mine} {mine === 1 ? 'card' : 'cards'}.</p>}
      </section>

      <section className="mt-8" aria-label="Top contributors">
        <h2 className="mb-1 text-3xl">Top contributors</h2>
        <SegmentedControl<Board> label="Week" value={board} onChange={setBoard} options={[{ id: 'this', label: 'This week' }, { id: 'last', label: 'Last week' }]} />
        <p className="mt-2 text-base text-muted">{board === 'this' ? `Ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}. A card is 1 point, each like is 2.` : lastWinner ? `${lastWinner.name} won ${WEEKLY_REWARD} coins.` : 'Nobody won, no cards got likes.'}</p>
        {ranking.length === 0 ? <p className="py-6 text-lg text-muted">No cards yet. Be the first.</p> : (
          <ol>
            {ranking.slice(0, 5).map((c, i) => (
              <li key={c.authorId} className="flex items-center gap-3 border-b-2 border-line/60 py-3">
                <span className="display w-8 text-3xl text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-lg font-bold">{c.name}{c.authorId === profile.id ? ' (you)' : ''}</span><span className="text-base text-muted">{c.cards} {c.cards === 1 ? 'card' : 'cards'}, {c.likes} {c.likes === 1 ? 'like' : 'likes'}</span></span>
                <span className="shrink-0 text-lg font-extrabold tabular-nums">{c.points}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8" aria-label="Suggested cards">
        <h2 className="mb-1 text-3xl">Suggested cards</h2>
        <ul>
          {sorted.map((s) => {
            const liked = s.likes.includes(profile.id); const own = s.authorId === profile.id;
            return (
              <li key={s.id} className="flex items-start gap-3 border-b-2 border-line/60 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-snug">{s.text}</p>
                  <p className="mt-1 text-base text-muted">{KIND_META[s.kind].label}, {DECK_BY_ID[s.deckId].name}, by {own ? 'you' : s.authorName}{s.sample ? ', sample' : ''}</p>
                </div>
                <button onClick={() => { haptic('tap'); toggleLike(s.id, profile.id); }} disabled={own} aria-pressed={liked} aria-label={`Like, ${s.likes.length} likes`}
                  className={cn('flex min-h-tap min-w-[4.25rem] shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-lg font-extrabold disabled:opacity-40', liked ? 'border-accent bg-accent text-onaccent' : 'border-line')}>
                  <Icon name="heart" size={20} />{s.likes.length}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </Screen>
  );
}
