'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import { WILD_CARD_DEFINITIONS, TARGET_WILD_CARDS, wildDescription } from '@/lib/game/wild-cards';
import { TargetPicker } from './TargetPicker';
import { WildExtras, TimerChip, dareSeconds } from './WildExtras';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useSettingsStore } from '@/stores/settings-store';
import { useShopStore } from '@/stores/shop-store';
import { itemById } from '@/lib/data/shop-catalogue';
import { cardBack } from '@/lib/card-back';
import { CardToolView } from './CardTools';
import { KIND_META, fillDrink, kindOf } from '@/lib/game/card-kinds';
import { deckOf } from '@/lib/game/decks';

const SWIPE = 110;

/** Card text scales down for long prompts but never below 28px. */
const sizeFor = (n: number) => (n < 55 ? 3.4 : n < 100 ? 2.9 : n < 150 ? 2.2 : 1.8);

/** Scrolling body for long cards, with a cue when there is more below. */
function CardBody({ children, watch }: { children: React.ReactNode; watch: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const check = () => { const el = ref.current; if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8); };
  useEffect(() => { check(); }, [watch]);
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={ref} onScroll={check} className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none"><div className="my-auto py-2">{children}</div></div>
      {more && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-current/0 to-transparent pt-8 text-center text-sm font-extrabold"><span className="rounded-full bg-bg px-3 py-1 text-text">Scroll for more</span></div>}
    </div>
  );
}

/**
 * A printed card. Face-down it wears its deck colour; tap to reveal and it turns into its kind's
 * colour (truth, dare, dice and so on). Swipe either way for the next card. The buttons underneath
 * do the same, always.
 */
export function PlayCard({ card, revealed, onReveal, onDone, others, nonDrinking, order, nextName, crown, spike }: {
  card: QueuedCard; revealed: boolean; onReveal: () => void; onDone: () => void;
  others: { id: string; name: string }[]; nonDrinking: boolean; order: string[]; nextName: string; crown: number; spike: number;
}) {
  const swipe = useSettingsStore((st) => st.swipe);
  const showPips = useSettingsStore((st) => st.showPips);
  const backId = useShopStore((st) => st.equipped.back);
  const back = cardBack(backId ? itemById(backId)?.value : undefined);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-7, 7]);
  const doneOpacity = useTransform(x, [20, SWIPE], [0, 1]);
  const nextOpacity = useTransform(x, [-SWIPE, -20], [1, 0]);
  const wild = card.cardType === 'wild' && card.wildCardType ? WILD_CARD_DEFINITIONS[card.wildCardType] : null;
  const kind = kindOf(card);
  const meta = KIND_META[kind];
  const text = fillDrink(card.text, nonDrinking);
  const deckMode = card.deckId ? deckOf(card.deckId)?.mode : undefined;

  if (!revealed) {
    return (
      <motion.button key={`back-${card.id}`} data-mode={deckMode} onClick={() => { haptic('tap'); onReveal(); }} aria-label="Reveal card"
        initial={{ opacity: 0, x: 150, y: -50, rotate: 9 }} animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }} whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 210, damping: 22 }}
        style={{ ...back.style, '--trim-a': 'var(--on-accent)', '--trim-b': 'var(--accent)' } as React.CSSProperties}
        className={cn('relative flex h-full w-full flex-col justify-between overflow-hidden rounded-card p-6 text-left no-select', back.ink ? 'border-2 border-accent text-accent' : 'bg-accent text-onaccent')}>
        <span aria-hidden className="trim absolute inset-x-0 top-0 h-4" />
        <span aria-hidden className="trim absolute inset-x-0 bottom-0 h-4" />
        <span className={cn('sign mt-5 self-start text-[1.9rem]', back.plate && 'rounded-lg bg-bg px-3 py-1 text-text')}>tag.ai</span>
        <span className={cn('display mb-5 self-start text-[5.5rem] leading-[0.85]', back.plate && 'rounded-xl bg-bg px-4 py-2 text-text')}>Tap to<br />reveal</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      key={card.id} data-kind={wild ? undefined : kind} initial={{ rotateY: -88, opacity: 0.4 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{ x, rotate, touchAction: 'pan-y', transformPerspective: 1100 }} drag={swipe ? 'x' : false} dragSnapToOrigin dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE) { haptic('success'); onDone(); }
        else if (info.offset.x < -SWIPE) { haptic('success'); onDone(); }
      }}
      className={cn('relative flex h-full w-full flex-col overflow-hidden rounded-card no-select', wild ? 'wild-glow bg-text text-bg' : 'bg-accent text-onaccent')}
    >
 <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-lg border-2 border-current opacity-20" />
      {wild && <div aria-hidden className="h-5 w-full shrink-0" style={{ background: 'repeating-linear-gradient(135deg, rgb(var(--accent)) 0 14px, rgb(var(--bg)) 14px 28px)' }} />}
      <motion.span style={{ opacity: doneOpacity }} className="sign pointer-events-none absolute right-5 top-8 rounded-lg border-4 border-current px-3 py-1 text-xl">Next</motion.span>
      <motion.span style={{ opacity: nextOpacity }} className="sign pointer-events-none absolute left-5 top-8 rounded-lg border-4 border-current px-3 py-1 text-xl">Next</motion.span>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between text-base font-bold">
          {wild ? <span className="sign text-xl">Wild card</span> : <span className="flex min-w-0 flex-col"><span className="sign text-xl">{meta.label}</span><span className="mt-1 text-sm font-bold opacity-75">{card.category.replace(/_/g, ' ')}{card.adult ? ', 18+' : ''}</span></span>}
          {!wild && showPips && (
            <span className="flex gap-1" role="img" aria-label={`Intensity ${card.intensity} of 5`}>
              {[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn('h-3 w-3 rounded-sm border-2 border-current', i <= card.intensity ? 'bg-current' : 'opacity-40')} />)}
            </span>
          )}
        </div>
        {wild ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto scrollbar-none">
            <h2 className="display text-[4.2rem] leading-[0.9]">{wild.title}</h2>
            <p className="mt-4 text-balance text-2xl font-bold leading-snug">{wildDescription(card.wildCardType!, nonDrinking)}</p>
            {TARGET_WILD_CARDS.includes(card.wildCardType!) && <TargetPicker key={card.id} players={others} />}
            <WildExtras key={card.id} type={card.wildCardType!} order={order} nextName={nextName} crown={crown} spike={spike} nonDrinking={nonDrinking} />
          </div>
        ) : (
          <CardBody watch={card.id}>
            <p className="display text-balance" style={{ lineHeight: 1.02, fontSize: `calc(${meta.tool ? Math.min(sizeFor(text.length), 2.6) : sizeFor(text.length)}rem * var(--card-scale, 1))` }}>{text}</p>
            {meta.tool && <CardToolView key={card.id} kind={kind} tool={card.tool} outcomes={card.outcomes} players={others.map((p) => p.name)} nonDrinking={nonDrinking} />}
            {kind === 'dare' && dareSeconds(text) && <TimerChip key={card.id} seconds={dareSeconds(text)!} />}
          </CardBody>
        )}
        {!wild && <span className="sign mt-3 text-[0.7rem] opacity-60">tag.ai</span>}
      </div>
    </motion.div>
  );
}
