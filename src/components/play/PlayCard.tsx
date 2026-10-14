'use client';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import { WILD_CARD_DEFINITIONS } from '@/lib/game/wild-cards';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

const SWIPE = 110;

/** Card text scales down for long prompts but never below 28px. */
const sizeFor = (n: number) => (n < 55 ? 'text-[3.4rem]' : n < 100 ? 'text-[2.9rem]' : n < 150 ? 'text-[2.4rem]' : 'text-[2rem]');

/**
 * A printed card in the deck colour. Face-down: tap to reveal. Revealed: swipe right
 * for Done, left for Skip. The buttons underneath do the same, always.
 */
export function PlayCard({ card, revealed, onReveal, onDone, onSkip }: {
  card: QueuedCard; revealed: boolean; onReveal: () => void; onDone: () => void; onSkip: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-7, 7]);
  const doneOpacity = useTransform(x, [20, SWIPE], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE, -20], [1, 0]);
  const wild = card.cardType === 'wild' && card.wildCardType ? WILD_CARD_DEFINITIONS[card.wildCardType] : null;
  const isAction = card.cardType === 'action';

  if (!revealed) {
    return (
      <motion.button key="back" onClick={() => { haptic('tap'); onReveal(); }} whileTap={{ scale: 0.98 }} aria-label="Reveal card"
        className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-card bg-accent p-6 text-left text-onaccent no-select">
        <span className="display text-4xl">tag.ai</span>
        <span className="display text-[5.5rem] leading-[0.85]">Tap to<br />reveal</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      key={card.id} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.25 }}
      style={{ x, rotate, touchAction: 'pan-y' }} drag="x" dragSnapToOrigin dragElastic={0.6}
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
          {!wild && (
            <span className="flex gap-1" role="img" aria-label={`Intensity ${card.intensity} of 5`}>
              {[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn('h-3 w-3 rounded-sm border-2 border-current', i <= card.intensity ? 'bg-current' : 'opacity-40')} />)}
            </span>
          )}
        </div>
        {wild ? (
          <div className="flex flex-1 flex-col justify-center">
            <h2 className="display text-[4.2rem] leading-[0.9]">{wild.title}</h2>
            <p className="mt-4 text-balance text-2xl font-bold leading-snug">{wild.description}</p>
          </div>
        ) : (
          <div className="flex flex-1 items-center">
            <p className={cn('display text-balance', sizeFor(card.text.length))} style={{ lineHeight: 1.02 }}>{card.text}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
