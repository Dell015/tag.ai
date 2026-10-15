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
 * A printed card in the deck colour. Face-down: tap to reveal. Revealed: swipe right
 * for Done, left for Skip. The buttons underneath do the same, always.
 */
export function PlayCard({ card, revealed, onReveal, onDone, onSkip, others, nonDrinking, order, nextName, crown, spike }: {
  card: QueuedCard; revealed: boolean; onReveal: () => void; onDone: () => void; onSkip: () => void;
  others: { id: string; name: string }[]; nonDrinking: boolean; order: string[]; nextName: string; crown: number; spike: number;
}) {
  const swipe = useSettingsStore((st) => st.swipe);
  const showPips = useSettingsStore((st) => st.showPips);
  const backId = useShopStore((st) => st.equipped.back);
  const back = cardBack(backId ? itemById(backId)?.value : undefined);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-7, 7]);
  const doneOpacity = useTransform(x, [20, SWIPE], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE, -20], [1, 0]);
  const wild = card.cardType === 'wild' && card.wildCardType ? WILD_CARD_DEFINITIONS[card.wildCardType] : null;
  const isAction = card.cardType === 'action';

  if (!revealed) {
    return (
      <motion.button key="back" onClick={() => { haptic('tap'); onReveal(); }} whileTap={{ scale: 0.98 }} aria-label="Reveal card" style={back.style}
        className={cn('relative flex h-full w-full flex-col justify-between overflow-hidden rounded-card p-6 text-left no-select', back.ink ? 'border-2 border-accent text-accent' : 'bg-accent text-onaccent')}>
        <span className={cn('display self-start text-4xl', back.plate && 'rounded-lg bg-bg px-3 py-1 text-text')}>tag.ai</span>
        <span className={cn('display self-start text-[5.5rem] leading-[0.85]', back.plate && 'rounded-xl bg-bg px-4 py-2 text-text')}>Tap to<br />reveal</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      key={card.id} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.25 }}
      style={{ x, rotate, touchAction: 'pan-y' }} drag={swipe ? 'x' : false} dragSnapToOrigin dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE) { haptic('success'); onDone(); }
        else if (info.offset.x < -SWIPE) { haptic('warn'); onSkip(); }
      }}
      className={cn('relative flex h-full w-full flex-col overflow-hidden rounded-card no-select', wild ? 'bg-text text-bg' : 'bg-accent text-onaccent')}
    >
      {wild && <div aria-hidden className="h-5 w-full shrink-0" style={{ background: 'repeating-linear-gradient(135deg, rgb(var(--accent)) 0 14px, rgb(var(--bg)) 14px 28px)' }} />}
      <motion.span style={{ opacity: doneOpacity }} className="pointer-events-none absolute right-5 top-8 rounded-lg border-4 border-current px-3 py-1 text-2xl font-extrabold">Done</motion.span>
      <motion.span style={{ opacity: skipOpacity }} className="pointer-events-none absolute left-5 top-8 rounded-lg border-4 border-current px-3 py-1 text-2xl font-extrabold">Skip</motion.span>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between text-base font-bold">
          <span>{wild ? 'Wild card' : isAction ? 'Dare' : card.category.replace(/_/g, ' ')}</span>
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
            <p className="display text-balance" style={{ lineHeight: 1.02, fontSize: `calc(${sizeFor(card.text.length)}rem * var(--card-scale, 1))` }}>{card.text}</p>
            {isAction && dareSeconds(card.text) && <TimerChip key={card.id} seconds={dareSeconds(card.text)!} />}
          </CardBody>
        )}
      </div>
    </motion.div>
  );
}
