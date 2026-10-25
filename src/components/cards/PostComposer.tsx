'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Icon, toast } from '@/components/ui';
import { createPost } from '@/lib/supabase/account';
import { KIND_META } from '@/lib/game/card-kinds';
import { DECK_BY_ID } from '@/lib/game/decks';
import { MAX_LEN, MIN_LEN, SUGGEST_DECKS, SUGGEST_KINDS, type SuggestDeck, type SuggestKind } from '@/lib/game/suggestions';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

const STEPS = ['Type', 'Stack', 'Text'] as const;
const HINT: Record<string, string> = {
  dice: 'Roll the die. Your number is how many...',
  coin: 'Heads, everyone drinks. Tails, you pick who.',
  bottle: 'Spin the bottle. Whoever it lands on...',
  wheel: 'Spin the wheel for a fate',
  rule: 'Everyone speaks only in questions until the next wild card.',
};

/** Posting a card, one step at a time: an empty card fills in as you choose its type, its stack, then its words. */
export function PostComposer({ open, onClose, adultOk, onPosted }: { open: boolean; onClose: () => void; adultOk: boolean; onPosted: () => void }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<SuggestKind | null>(null);
  const [deck, setDeck] = useState<SuggestDeck | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setStep(0); setKind(null); setDeck(null); setText(''); } }, [open]);

  const len = text.trim().length;
  const canNext = step === 0 ? !!kind : step === 1 ? !!deck : len >= MIN_LEN && len <= MAX_LEN;

  const next = async () => {
    haptic('tap');
    if (step < 2) { setStep(step + 1); return; }
    if (!kind || !deck) return;
    setBusy(true);
    const r = await createPost(kind, deck, text);
    setBusy(false);
    if (!r.ok) { haptic('warn'); toast(r.error ?? 'Could not post.', { tone: 'warn' }); return; }
    haptic('success'); toast('Posted', { tone: 'ok' });
    onPosted(); onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="Post a card" className="fixed inset-0 z-40 flex flex-col bg-bg"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
          <div className="mx-auto flex h-full w-full max-w-lg flex-col px-4 safe-top safe-bottom">
            <header className="flex items-center gap-3 pb-3">
              <button onClick={step === 0 ? onClose : () => setStep(step - 1)} aria-label={step === 0 ? 'Close' : 'Back'} className="flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line">
                <Icon name={step === 0 ? 'close' : 'back'} />
              </button>
              <ol className="flex flex-1 gap-1.5" aria-label="Steps">
                {STEPS.map((s, i) => (
                  <li key={s} aria-current={i === step ? 'step' : undefined} className="flex-1">
                    <span className={cn('block h-1.5 rounded-full transition-colors', i <= step ? 'bg-accent' : 'bg-line/50')} />
                    <span className={cn('mt-1 block text-center text-xs font-extrabold', i === step ? 'text-text' : 'text-muted')}>{s}</span>
                  </li>
                ))}
              </ol>
            </header>

            {/* The card that fills in as you go. */}
            <div data-kind={kind ?? undefined} className="mx-auto mt-2 flex justify-center">
              <motion.div layout className={cn('relative flex h-[38dvh] max-h-[24rem] min-h-[13rem] aspect-[5/7] flex-col rounded-2xl border-[3px] p-4 transition-colors', kind ? 'border-[#181310] bg-accent text-onaccent' : 'border-dashed border-line bg-panel text-muted')}>
                <div className="flex items-center justify-between text-base font-extrabold">
                  <span className="sign">{kind ? KIND_META[kind].label : 'Type'}</span>
                  <span className="opacity-80">{deck ? DECK_BY_ID[deck].name : 'Stack'}</span>
                </div>
                {step === 2 ? (
                  <textarea autoFocus value={text} maxLength={MAX_LEN} onChange={(e) => setText(e.target.value)} aria-label="Card text"
                    placeholder={(kind && HINT[kind]) || 'What is the pettiest thing you did this year?'}
                    className="display mt-2 w-full flex-1 resize-none bg-transparent text-[1.6rem] leading-[1.06] placeholder:opacity-45 focus:outline-none" />
                ) : (
                  <p className="display mt-3 flex-1 text-[1.6rem] leading-[1.06] opacity-45">{text || 'Your card'}</p>
                )}
                {step === 2 && <span className="absolute bottom-3 right-4 text-xs font-extrabold tabular-nums opacity-70">{len}/{MAX_LEN}</span>}
              </motion.div>
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto scrollbar-none">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.16 }}>
                  {step === 0 && (
                    <>
                      <h2 className="mb-4 text-[2.1rem]">What kind of card?</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {SUGGEST_KINDS.map((k) => (
                          <button key={k} data-kind={k} onClick={() => { haptic('tap'); setKind(k); }} aria-pressed={kind === k}
                            className={cn('rounded-2xl border-2 p-4 text-left transition-colors', kind === k ? 'border-[#181310] bg-accent text-onaccent' : 'border-line/70 bg-panel')}>
                            <span className="sign block text-base">{KIND_META[k].label}</span>
                            <span className={cn('mt-1.5 block text-sm font-bold', kind === k ? 'opacity-80' : 'text-muted')}>{KIND_META[k].blurb}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <h2 className="mb-4 text-[2.1rem]">Which stack is it for?</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {SUGGEST_DECKS.filter((d) => d !== 'adult' || adultOk).map((d) => (
                          <button key={d} data-deck={d} onClick={() => { haptic('tap'); setDeck(d); }} aria-pressed={deck === d}
                            className={cn('rounded-2xl border-2 border-b-4 p-4 text-left bg-accent text-onaccent transition-transform', deck === d ? 'border-[#181310] ring-4 ring-text/90' : 'border-black/35')}>
                            <span className="sign block text-base">{DECK_BY_ID[d].name}</span>
                            <span className="mt-1.5 line-clamp-2 block text-sm font-bold opacity-85">{DECK_BY_ID[d].blurb}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <h2 className="mb-1.5 text-[2.1rem]">Write it</h2>
                      <p className="text-base text-muted">Say it plainly, like &quot;take a shot&quot;. At least {MIN_LEN} characters. 5 cards a day, and everyone sees your name on it.</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="pt-3">
              <Button size="lg" full disabled={!canNext || busy} onClick={() => void next()}>{step < 2 ? 'Next' : busy ? 'Posting' : 'Post card'}</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
