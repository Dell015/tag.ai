'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { QueuedCard } from '@/lib/game/escalation-engine';
import { CardBack } from './CardBack';
import { CardFace } from './CardFace';

export interface CardFlipProps {
  card: QueuedCard;
}

/**
 * Card flip component with 3D rotateY animation.
 * Shows CardBack when face_down, flips to CardFace on tap.
 * Displays "Tap to flip" hint for the first 3 cards of a session.
 */
export function CardFlip({ card }: CardFlipProps) {
  const currentCardState = useGameStore((s) => s.currentCardState);
  const flipCard = useGameStore((s) => s.flipCard);
  const cardsPlayed = useGameStore((s) => s.cardsPlayed);

  const isRevealed = currentCardState === 'revealed';
  const showHint = !isRevealed && cardsPlayed < 3;

  const handleTap = () => {
    if (!isRevealed) {
      flipCard();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Card container with perspective for 3D effect */}
      <div
        className="relative w-full aspect-[3/4]"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{
            type: 'spring',
            duration: 0.3,
            bounce: 0.2,
          }}
          onTap={handleTap}
        >
          {/* Front side — Card Back (visible when face_down) */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardBack isWild={card.cardType === 'wild'} />
          </div>

          {/* Back side — Card Face (visible when revealed, pre-rotated 180°) */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardFace
              text={card.text}
              category={card.category}
              intensity={card.intensity}
              cardType={card.cardType}
            />
          </div>
        </motion.div>
      </div>

      {/* "Tap to flip" hint — shown for first 3 cards only */}
      {showHint && (
        <motion.p
          className="text-sm text-gray-400 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          Tap to flip
        </motion.p>
      )}
    </div>
  );
}
