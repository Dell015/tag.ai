'use client';

import { useGameStore } from '@/stores/game-store';
import { getCurrentPlayer } from '@/lib/game/turn-rotation';

/**
 * TurnIndicator — Displays the current player's username and avatar
 * in a fixed bottom bar during gameplay.
 *
 * Reads turnRotation from the game store and uses getCurrentPlayer()
 * to determine whose turn it is.
 *
 * Validates: Requirements 19.1
 */
export function TurnIndicator() {
  const turnRotation = useGameStore((state) => state.turnRotation);

  // Don't render if there are no players
  if (!turnRotation.players || turnRotation.players.length === 0) {
    return null;
  }

  const currentPlayer = getCurrentPlayer(turnRotation);

  if (!currentPlayer) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 w-full z-40 bg-neutral-900/90 backdrop-blur-sm border-t border-neutral-700 px-4 py-3"
      role="status"
      aria-label={`Current turn: ${currentPlayer.name}`}
    >
      <div className="flex items-center justify-center gap-3">
        {/* Avatar */}
        {currentPlayer.avatarUrl ? (
          <img
            src={currentPlayer.avatarUrl}
            alt={`${currentPlayer.name}'s avatar`}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-lg">
            🎮
          </div>
        )}

        {/* Username */}
        <span className="text-white text-sm font-medium">
          {currentPlayer.name}&apos;s turn
        </span>
      </div>
    </div>
  );
}
