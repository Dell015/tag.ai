'use client';

import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export interface TrashZoneProps {
  cardId: string;
  userId: string;
  onTrash: () => void;
  isActive: boolean;
}

export interface TrashZoneHandle {
  /** Call this when a card is released over the trash zone */
  triggerTrash: () => void;
}

/**
 * TrashZone — A drop target area that appears when a card is being hold+dragged.
 *
 * Behavior:
 * - Appears at the bottom of the screen when `isActive` is true (card is being dragged)
 * - Scales up to 1.2× and pulses red when a card is hovering over it
 * - On release/drop over the zone (via triggerTrash or native drop):
 *   - Animates card disappearing (scale to 0, opacity to 0, slight rotation)
 *   - Calls onTrash() which handles buffer replacement and turn advancement via game store
 *   - Fire-and-forget: creates user_trashed_cards record in Supabase
 *   - Shows toast "Card removed. You won't see this again." (auto-dismiss 2.5s)
 *
 * Usage with Framer Motion drag:
 *   1. Set isActive=true when drag starts
 *   2. Use isOverTrashZone(x, y) to detect hover and set visual state
 *   3. On drag end over zone, call ref.triggerTrash()
 *
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5
 */
export const TrashZone = forwardRef<TrashZoneHandle, TrashZoneProps>(
  function TrashZone({ cardId, userId, onTrash, isActive }, ref) {
    const [isHovering, setIsHovering] = useState(false);
    const [showTrashAnimation, setShowTrashAnimation] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const executeTrash = useCallback(() => {
      setIsHovering(false);

      // Animate card disappearing (scale to 0, opacity to 0, slight rotation)
      setShowTrashAnimation(true);

      // After animation completes, proceed with game actions
      setTimeout(() => {
        setShowTrashAnimation(false);

        // Call onTrash (handles buffer replacement and turn advancement via game store)
        onTrash();

        // Show toast: "Card removed. You won't see this again." (auto-dismiss 2.5s)
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);

        // Fire-and-forget: create user_trashed_cards record in Supabase
        const supabase = createClient();
        supabase
          .from('user_trashed_cards')
          .insert({ user_id: userId, card_id: cardId })
          .then(({ error }) => {
            if (error) {
              // Fire-and-forget — log but don't block gameplay
              console.warn('Failed to record trashed card:', error.message);
            }
          });
      }, 400);
    }, [cardId, userId, onTrash]);

    // Expose triggerTrash for parent components using Framer Motion drag
    useImperativeHandle(ref, () => ({
      triggerTrash: executeTrash,
    }), [executeTrash]);

    // Native HTML drag event handlers (fallback)
    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsHovering(true);
    }, []);

    const handleDragLeave = useCallback(() => {
      setIsHovering(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        executeTrash();
      },
      [executeTrash]
    );

    // Pointer-based detection for Framer Motion drag compatibility
    const handlePointerEnter = useCallback(() => {
      if (isActive) {
        setIsHovering(true);
      }
    }, [isActive]);

    const handlePointerLeave = useCallback(() => {
      setIsHovering(false);
    }, []);

    return (
      <>
        {/* Trash zone — fixed at bottom of screen, appears when card is being dragged */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isHovering ? 1.2 : 1,
              }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
              className={`
                fixed bottom-8 left-1/2 -translate-x-1/2 z-50
                flex items-center justify-center
                w-16 h-16 rounded-full
                border-2 border-dashed
                transition-colors duration-200
                ${
                  isHovering
                    ? 'border-red-500 bg-red-500/20 animate-pulse-red shadow-lg shadow-red-500/30'
                    : 'border-gray-400 bg-gray-800/60'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              data-trash-zone="true"
              role="button"
              aria-label="Trash card — drag here to permanently remove"
            >
              <span className={`text-2xl ${isHovering ? 'scale-110' : ''} transition-transform`}>
                🗑️
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card disappearing animation overlay */}
        <AnimatePresence>
          {showTrashAnimation && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
              initial={{ scale: 1, opacity: 1, rotate: 0 }}
              animate={{ scale: 0, opacity: 0, rotate: 12 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeIn' }}
            >
              <div className="w-64 h-80 rounded-[20px] bg-gray-700 shadow-xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              role="status"
              aria-live="polite"
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70]
                         whitespace-nowrap rounded-full bg-gray-900/90 px-5 py-2.5
                         text-sm text-white shadow-lg"
            >
              Card removed. You won&apos;t see this again.
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

/**
 * Utility function to detect if a pointer position is over the trash zone element.
 * Use this during Framer Motion drag to determine hover state and drop targeting.
 *
 * @param x - clientX coordinate of the pointer
 * @param y - clientY coordinate of the pointer
 * @returns true if the pointer is within the trash zone bounding box
 */
export function isOverTrashZone(x: number, y: number): boolean {
  if (typeof document === 'undefined') return false;
  const trashEl = document.querySelector('[data-trash-zone="true"]');
  if (!trashEl) return false;

  const rect = trashEl.getBoundingClientRect();
  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}
