'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';
import { getNextPlayer } from '@/lib/game/turn-rotation';

/**
 * PassPrompt — Full-screen overlay displayed between turns that shows
 * "Pass to [next_player_name]" with their avatar.
 *
 * Shown when showPassPrompt is true in the game store.
 * Auto-hides after 3 seconds, then calls advanceToNextCard.
 *
 * Validates: Requirements 19.3
 */
export function PassPrompt() {
  const showPassPrompt = useGameStore((state) => state.showPassPrompt);
  const turnRotation = useGameStore((state) => state.turnRotation);
  const advanceToNextCard = useGameStore((state) => state.advanceToNextCard);

  useEffect(() => {
    if (!showPassPrompt) return;

    const timer = setTimeout(() => {
      advanceToNextCard();
    }, 3000);

    return () => clearTimeout(timer);
  }, [showPassPrompt, advanceToNextCard]);

  if (!showPassPrompt) {
    return null;
  }

  // Don't render if there are no players
  if (!turnRotation.players || turnRotation.players.length === 0) {
    return null;
  }

  const nextPlayer = getNextPlayer(turnRotation);

  if (!nextPlayer) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-900/95 backdrop-blur-md"
      role="alert"
      aria-live="assertive"
      aria-label={`Pass to ${nextPlayer.name}`}
    >
      {/* Avatar */}
      <div className="mb-6">
        {nextPlayer.avatarUrl ? (
          <img
            src={nextPlayer.avatarUrl}
            alt={`${nextPlayer.name}'s avatar`}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center text-4xl border-2 border-white/20">
            🎮
          </div>
        )}
      </div>

      {/* Pass message */}
      <h2 className="text-white text-2xl font-bold mb-2">
        Pass to
      </h2>
      <p className="text-white text-3xl font-bold">
        {nextPlayer.name}
      </p>

      {/* Subtle countdown hint */}
      <p className="text-neutral-400 text-sm mt-6 animate-pulse">
        Next card loading...
      </p>
    </div>
  );
}
