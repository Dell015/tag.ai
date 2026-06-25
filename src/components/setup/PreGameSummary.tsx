'use client';

import { useSessionStore } from '@/stores/session-store';
import { GAME_MODES } from '@/lib/game/game-modes';

interface PreGameSummaryProps {
  /** Whether the current user is the host (controls "Start Game" visibility) */
  isHost: boolean;
  /** Callback invoked when the host taps "Start Game" */
  onStartGame: () => void;
}

/**
 * Pre-game summary screen displaying all session configuration.
 * The host sees a "Start Game" button that triggers the game launch.
 * Satisfies Requirements 13.1, 13.2, 13.3, 13.4, 25.4.
 */
export function PreGameSummary({ isHost, onStartGame }: PreGameSummaryProps) {
  const {
    players,
    cardCountTarget,
    gameMode,
    comfortFilters,
    drinkRuleTemplate,
    customDrinkRules,
  } = useSessionStore();

  const modeConfig = gameMode ? GAME_MODES[gameMode] : null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-xl font-bold text-white text-center">Game Summary</h2>

      <div className="flex flex-col gap-4 rounded-2xl bg-white/5 border border-white/10 p-5">
        {/* Players */}
        <section>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
            Players ({players.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {players.map((player) => (
              <span
                key={player.userId}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sm text-white"
              >
                {player.avatarUrl && (
                  <img
                    src={player.avatarUrl}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                )}
                {player.displayName}
              </span>
            ))}
          </div>
        </section>

        {/* Card Count */}
        <section>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-1">
            Card Count
          </h3>
          <p className="text-white text-lg font-medium">
            🃏 {cardCountTarget} cards
          </p>
        </section>

        {/* Game Mode */}
        <section>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-1">
            Game Mode
          </h3>
          {modeConfig ? (
            <p className="text-white text-lg font-medium">
              {modeConfig.emoji} {modeConfig.name}
            </p>
          ) : (
            <p className="text-white/40 text-sm italic">No mode selected</p>
          )}
        </section>

        {/* Comfort Filters */}
        <section>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
            Comfort Filters
          </h3>
          {comfortFilters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {comfortFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-medium"
                >
                  {filter}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm italic">None — all topics included</p>
          )}
        </section>

        {/* Drink Rules */}
        <section>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-1">
            Drink Rules
          </h3>
          {drinkRuleTemplate ? (
            <p className="text-white text-base font-medium">
              🍻 {drinkRuleTemplate}
            </p>
          ) : (
            <p className="text-white/40 text-sm italic">No template selected</p>
          )}
        </section>

        {/* Custom Rules */}
        {customDrinkRules.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
              Custom Rules
            </h3>
            <ul className="flex flex-col gap-1">
              {customDrinkRules.map((rule, index) => (
                <li
                  key={index}
                  className="text-white/80 text-sm pl-3 border-l-2 border-purple-500/50"
                >
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Coin Pot Stub */}
        <section>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-1">
            Coin Pot
          </h3>
          <p className="text-white text-base font-medium">
            🪙 Free Mode
          </p>
        </section>
      </div>

      {/* Start Game Button (host only) */}
      {isHost && (
        <button
          type="button"
          onClick={onStartGame}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-lg hover:from-purple-500 hover:to-pink-500 active:scale-[0.98] transition-all"
        >
          Start Game 🚀
        </button>
      )}

      {/* Non-host waiting message */}
      {!isHost && (
        <p className="text-center text-white/50 text-sm">
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );
}
