'use client';

import { useGameStore } from '@/stores/game-store';
import { WILD_CARD_DEFINITIONS } from '@/lib/game/wild-cards';

/**
 * WildCardOverlay — Full-screen overlay displayed when a wild card is revealed.
 *
 * Shows:
 * - Purple gradient background with glow animation
 * - Wild card emoji, title, and type-specific description
 * - "Continue" button that applies the wild card effect and dismisses
 *
 * Effects wired:
 * - Shuffle: reshuffles next 5 cards in the queue
 * - Heat Spike: increases heat by 1.0 for next 3 cards, then reverts
 * - Crown: sets immunity for 2 card actions
 * - Others: display-only (instructions shown, then dismiss normally)
 *
 * Validates: Requirements 20.1–20.11
 */
export function WildCardOverlay() {
  const cardQueue = useGameStore((state) => state.cardQueue);
  const currentCardIndex = useGameStore((state) => state.currentCardIndex);
  const currentCardState = useGameStore((state) => state.currentCardState);
  const applyWildCardEffect = useGameStore((state) => state.applyWildCardEffect);
  const dismissCard = useGameStore((state) => state.dismissCard);

  // Get current card
  const currentCard = cardQueue[currentCardIndex];

  // Only show when the current card is a wild card and is revealed
  if (
    !currentCard ||
    currentCard.cardType !== 'wild' ||
    !currentCard.wildCardType ||
    currentCardState !== 'revealed'
  ) {
    return null;
  }

  const wildDef = WILD_CARD_DEFINITIONS[currentCard.wildCardType];

  if (!wildDef) {
    return null;
  }

  const handleContinue = () => {
    // Apply the wild card's mechanical effect
    applyWildCardEffect(currentCard.wildCardType!);
    // Dismiss the card to advance the game
    dismissCard();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950"
      role="dialog"
      aria-modal="true"
      aria-label={`Wild Card: ${wildDef.title}`}
    >
      {/* Purple glow animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/30 blur-[80px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-purple-400/20 blur-[40px] animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm">
        {/* Wild card badge */}
        <div className="mb-4 px-4 py-1.5 rounded-full bg-purple-500/30 border border-purple-400/40">
          <span className="text-purple-200 text-xs font-semibold uppercase tracking-wider">
            Wild Card
          </span>
        </div>

        {/* Emoji */}
        <div className="mb-6">
          <span className="text-7xl" role="img" aria-label={wildDef.title}>
            {wildDef.emoji}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-white text-3xl font-bold mb-3">
          {wildDef.title}
        </h2>

        {/* Description / Instructions */}
        <p className="text-purple-100/90 text-lg leading-relaxed mb-10">
          {wildDef.description}
        </p>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="px-10 py-3.5 rounded-full bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-white font-semibold text-lg shadow-lg shadow-purple-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-purple-900"
          aria-label="Continue to next card"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
