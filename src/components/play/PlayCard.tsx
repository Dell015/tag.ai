'use client';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import { WILD_CARD_DEFINITIONS } from '@/lib/game/wild-cards';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

const SWIPE = 110;

/**
 * The big card. Face-down: tap anywhere to reveal. Revealed: swipe right = Done,
 * swipe left = Skip (buttons below do the same — swipes are never the only way).
 */
export function PlayCard({
  card, revealed, onReveal, onDone, onSkip,
}: {
  card: QueuedCard; revealed: boolean; onReveal: () => void; onDone: () => void; onSkip: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const doneOpacity = useTransform(x, [20, SWIPE], [0, 1]);
  const skipOpacity = useTransform(x, [-SWIPE, -20], [1, 0]);
  const wild = card.cardType === 'wild' && card.wildCardType ? WILD_CARD_DEFINITIONS[card.wildCardType] : null;
  const isAction = card.cardType === 'action';

  if (!revealed) {
    return (
      <motion.button
        key="back"
        onClick={() => { haptic('tap'); onReveal(); }}
        whileTap={{ scale: 0.97 }}
        aria-label="Reveal card"
        className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-card bg-accent-gradient shadow-card no-select"
      >
        <span className="font-display text-7xl font-extrabold text-white/95">tag<span className="text-white/60">.ai</span></span>
        <span className="rounded-full bg-black/25 px-5 py-2 text-lg font-bold text-white">Tap to reveal</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      key={card.id}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.28 }}
      style={{ x, rotate, touchAction: 'pan-y' }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE) { haptic('success'); onDone(); }
        else if (info.offset.x < -SWIPE) { haptic('warn'); onSkip(); }
      }}
      className={cn(
        'relative flex h-full w-full flex-col rounded-card p-6 no-select ring-1',
        wild ? 'bg-gradient-to-br from-wild/40 to-surface shadow-wild ring-wild/60' : 'bg-elevated shadow-card ring-white/10',
      )}
    >
      <motion.span style={{ opacity: doneOpacity }} className="pointer-events-none absolute right-5 top-5 rounded-xl border-2 border-ok px-3 py-1 text-xl font-extrabold text-ok">DONE</motion.span>
      <motion.span style={{ opacity: skipOpacity }} className="pointer-events-none absolute left-5 top-5 rounded-xl border-2 border-muted px-3 py-1 text-xl font-extrabold text-muted">SKIP</motion.span>

      <div className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted">
        {wild ? <span className="text-wild">✨ Wild card</span> : isAction ? <span className="text-accent-2">⚡ Dare</span> : <span>{card.category.replace(/_/g, ' ')}</span>}
        {!wild && <span aria-label={`Intensity ${card.intensity}`}>{'🔥'.repeat(Math.max(1, Math.min(5, card.intensity)))}</span>}
      </div>

      {wild ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="text-7xl">{wild.emoji}</div>
          <h2 className="mt-4 font-display text-4xl font-extrabold">{wild.title}</h2>
          <p className="mt-3 text-balance text-2xl leading-snug text-ink/90">{wild.description}</p>
        </div>
      ) : (
        <div className="flex flex-1 items-center">
          <p className="text-balance font-display text-3xl font-bold leading-tight">{card.text}</p>
        </div>
      )}
    </motion.div>
  );
}
