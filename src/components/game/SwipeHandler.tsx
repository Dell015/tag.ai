'use client';

import { ReactNode, useState, useCallback, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import { useGameStore } from '@/stores/game-store';

export interface SwipeHandlerProps {
  children: ReactNode;
  onDismiss: () => void;
  enabled?: boolean;
}

const SWIPE_THRESHOLD = 100;
const FLY_OFF_ROTATION = 15;

/**
 * SwipeHandler — Wraps card content and handles horizontal drag/swipe gestures.
 *
 * When the user drags past a 100px threshold, the card flies off screen with
 * translateX ±150% viewport width, rotate ±15°, and a 250ms spring animation.
 * On animation complete, calls onDismiss to advance the game state.
 *
 * Displays a card counter "Card N of [target]" below the card.
 *
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4
 */
export function SwipeHandler({ children, onDismiss, enabled = true }: SwipeHandlerProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-FLY_OFF_ROTATION, 0, FLY_OFF_ROTATION]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  const [isDismissing, setIsDismissing] = useState(false);
  const flyTargetRef = useRef({ x: 0, rotate: 0 });

  const cardsPlayed = useGameStore((state) => state.cardsPlayed);
  const cardCountTarget = useGameStore((state) => state.cardCountTarget);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enabled || isDismissing) return;

      const offsetX = info.offset.x;

      if (Math.abs(offsetX) >= SWIPE_THRESHOLD) {
        const direction = offsetX > 0 ? 1 : -1;
        // 150% of viewport width
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
        flyTargetRef.current = {
          x: direction * viewportWidth * 1.5,
          rotate: direction * FLY_OFF_ROTATION,
        };
        setIsDismissing(true);
      }
    },
    [enabled, isDismissing]
  );

  const handleAnimationComplete = useCallback(() => {
    if (isDismissing) {
      setIsDismissing(false);
      x.set(0);
      onDismiss();
    }
  }, [isDismissing, onDismiss, x]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <motion.div
        className="w-full cursor-grab active:cursor-grabbing touch-none"
        style={!isDismissing ? { x, rotate, opacity } : undefined}
        drag={enabled && !isDismissing ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={
          isDismissing
            ? {
                x: flyTargetRef.current.x,
                rotate: flyTargetRef.current.rotate,
                opacity: 0,
              }
            : { x: 0, rotate: 0, opacity: 1 }
        }
        transition={{
          type: 'spring',
          duration: 0.25,
          bounce: 0.2,
        }}
        onAnimationComplete={handleAnimationComplete}
        whileDrag={{ scale: 1.02 }}
      >
        {children}
      </motion.div>

      {/* Card counter: "Card N of [target]" */}
      <p className="text-sm text-gray-400 font-medium tabular-nums">
        Card {cardsPlayed + 1} of {cardCountTarget}
      </p>
    </div>
  );
}
