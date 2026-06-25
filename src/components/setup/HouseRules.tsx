'use client';

import { useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { createClient } from '@/lib/supabase/client';

interface HouseRulesProps {
  /** Whether the current user is the session host */
  isHost: boolean;
  /** The authenticated user's ID */
  currentUserId: string;
  /** Callback fired when the host taps "Start Game" */
  onStartGame: () => void;
}

/**
 * Displays the house rules (drink rule template + custom rules) to all players.
 * Each player must tap "I Agree" before the host can start the game.
 * Agreement is broadcast via Supabase Realtime and tracked in the session store.
 */
export function HouseRules({ isHost, currentUserId, onStartGame }: HouseRulesProps) {
  const {
    drinkRuleTemplate,
    customDrinkRules,
    nonDrinkingMode,
    players,
    agreedPlayers,
    roomCode,
  } = useSessionStore();
  const canStartGame = useSessionStore((state) => state.canStartGame());
  const hasAgreed = agreedPlayers.includes(currentUserId);

  const handleAgree = useCallback(async () => {
    if (hasAgreed || !roomCode) return;

    // Update local state immediately
    useSessionStore.getState().setPlayerAgreed(currentUserId);

    // Broadcast agreement to all players via Realtime
    const supabase = createClient();
    const channel = supabase.channel(`session:${roomCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'rules_agreed',
      payload: { userId: currentUserId },
    });
  }, [hasAgreed, currentUserId, roomCode]);

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-white">House Rules</h3>

      {/* Rule template summary */}
      <div className="rounded-xl bg-white/10 p-4">
        {drinkRuleTemplate ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-purple-300">
              {nonDrinkingMode ? '🎯' : '🍻'} {drinkRuleTemplate}
            </p>
            <p className="text-xs text-white/60">
              {nonDrinkingMode
                ? 'Non-drinking mode: dares & challenges replace drinks'
                : 'Drink rules apply to all players'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-white/60">No drink rule template selected</p>
        )}
      </div>

      {/* Custom rules */}
      {customDrinkRules.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-white/80">Custom Rules</p>
          <ul className="flex flex-col gap-1">
            {customDrinkRules.map((rule, index) => (
              <li
                key={index}
                className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70"
              >
                <span className="text-purple-400">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Player agreement status */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-white/80">Player Agreement</p>
        <ul className="flex flex-col gap-2">
          {players.map((player) => {
            const playerAgreed = agreedPlayers.includes(player.userId);
            return (
              <li
                key={player.userId}
                className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2"
              >
                {/* Avatar */}
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                    {player.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Name */}
                <span className="flex-1 text-sm text-white">
                  {player.displayName}
                </span>

                {/* Status icon */}
                {playerAgreed ? (
                  <span
                    className="text-green-400"
                    aria-label={`${player.displayName} agreed`}
                  >
                    ✓
                  </span>
                ) : (
                  <span
                    className="text-yellow-400 animate-pulse"
                    aria-label={`Waiting for ${player.displayName}`}
                  >
                    ⏳
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* I Agree button — visible only if the current player hasn't agreed yet */}
      {!hasAgreed && (
        <button
          type="button"
          onClick={handleAgree}
          className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700"
        >
          I Agree
        </button>
      )}

      {hasAgreed && !isHost && (
        <p className="text-center text-sm text-white/60">
          ✓ You agreed — waiting for others...
        </p>
      )}

      {/* Start Game button — only visible to the host */}
      {isHost && (
        <button
          type="button"
          onClick={onStartGame}
          disabled={!canStartGame}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
            canStartGame
              ? 'bg-green-600 text-white hover:bg-green-500 active:bg-green-700'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
          aria-disabled={!canStartGame}
        >
          {canStartGame ? '🚀 Start Game' : 'Waiting for all players to agree...'}
        </button>
      )}
    </div>
  );
}
