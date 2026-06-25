'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/stores/game-store';

export interface HeartButtonProps {
  cardId: string;
  userId: string;
}

/**
 * Heart/save button displayed on a revealed card.
 * On first tap: saves card to Supabase (fire-and-forget), triggers heat escalation,
 * plays a bounce animation, and shows a toast.
 * If already saved: displays a filled heart and tapping is a no-op.
 *
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4
 */
export function HeartButton({ cardId, userId }: HeartButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const heartCard = useGameStore((state) => state.heartCard);

  const handleTap = useCallback(() => {
    // Already saved — no-op (Requirement 18.4)
    if (isSaved) return;

    // Mark as saved immediately (optimistic)
    setIsSaved(true);

    // Play heart animation (scale + bounce)
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    // Show toast "Added to your saved cards" — auto-dismiss after 2s
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    // Call game store heartCard for heat escalation
    heartCard();

    // Fire-and-forget: create saved_card record in Supabase
    const supabase = createClient();
    supabase
      .from('saved_cards')
      .insert({ user_id: userId, card_id: cardId })
      .then(({ error }) => {
        if (error) {
          // If duplicate (unique constraint), it's fine — card was already saved
          // For other errors, we could retry, but fire-and-forget is acceptable
          console.warn('Failed to save card:', error.message);
        }
      });
  }, [isSaved, cardId, userId, heartCard]);

  return (
    <div className="relative">
      {/* Heart button */}
      <button
        type="button"
        onClick={handleTap}
        aria-label={isSaved ? 'Card saved' : 'Save card'}
        aria-pressed={isSaved}
        className={`
          text-3xl transition-transform duration-150 ease-out
          ${isAnimating ? 'animate-heart-bounce' : ''}
          ${isSaved ? 'cursor-default' : 'cursor-pointer active:scale-90'}
        `}
      >
        {isSaved ? '❤️' : '🤍'}
      </button>

      {/* Toast notification */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap
                     rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg
                     animate-toast-fade-in"
        >
          Added to your saved cards
        </div>
      )}
    </div>
  );
}
