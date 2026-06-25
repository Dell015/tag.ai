'use client';

import { useState, useCallback } from 'react';
import { validateCardCount } from '@/lib/validators';
import { useSessionStore } from '@/stores/session-store';

export const PRESET_COUNTS = [10, 20, 30, 40, 50] as const;
export const SECONDS_PER_CARD = 30;

interface CardCountSelectorProps {
  /** Callback to broadcast the card count change to other players via Realtime */
  onBroadcastChange?: (cardCount: number) => void;
}

/**
 * Calculates the estimated session duration string based on card count.
 * Assumes ~30 seconds per card.
 */
export function formatDuration(cardCount: number): string {
  const totalSeconds = cardCount * SECONDS_PER_CARD;
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `~${hours} hr`;
  }
  return `~${hours} hr ${remainingMinutes} min`;
}

export function CardCountSelector({ onBroadcastChange }: CardCountSelectorProps) {
  const { cardCountTarget, setSession } = useSessionStore();
  const [isCustom, setIsCustom] = useState(
    !PRESET_COUNTS.includes(cardCountTarget as typeof PRESET_COUNTS[number])
  );
  const [customValue, setCustomValue] = useState(
    isCustom ? String(cardCountTarget) : ''
  );
  const [customError, setCustomError] = useState<string | null>(null);

  const handleSelect = useCallback(
    (count: number) => {
      setIsCustom(false);
      setCustomError(null);
      setSession({ cardCountTarget: count });
      onBroadcastChange?.(count);
    },
    [setSession, onBroadcastChange]
  );

  const handleCustomToggle = useCallback(() => {
    setIsCustom(true);
    // If there's a valid custom value already, apply it
    const parsed = Number(customValue);
    if (validateCardCount(parsed)) {
      setSession({ cardCountTarget: parsed });
      onBroadcastChange?.(parsed);
    }
  }, [customValue, setSession, onBroadcastChange]);

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setCustomValue(raw);

      if (raw === '') {
        setCustomError(null);
        return;
      }

      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || isNaN(parsed)) {
        setCustomError('Enter a whole number');
        return;
      }

      if (!validateCardCount(parsed)) {
        setCustomError('Must be between 5 and 100');
        return;
      }

      setCustomError(null);
      setSession({ cardCountTarget: parsed });
      onBroadcastChange?.(parsed);
    },
    [setSession, onBroadcastChange]
  );

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-white">How many cards?</h3>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COUNTS.map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => handleSelect(count)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isCustom && cardCountTarget === count
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
            aria-pressed={!isCustom && cardCountTarget === count}
          >
            {count}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCustomToggle}
          className={`self-start px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isCustom
              ? 'bg-purple-600 text-white ring-2 ring-purple-400'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
          aria-pressed={isCustom}
        >
          Custom
        </button>

        {isCustom && (
          <div className="flex flex-col gap-1">
            <input
              type="number"
              min={5}
              max={100}
              value={customValue}
              onChange={handleCustomChange}
              placeholder="5–100"
              aria-label="Custom card count"
              aria-invalid={!!customError}
              className={`w-24 px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 text-sm border ${
                customError
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-white/20 focus:ring-purple-400'
              } focus:outline-none focus:ring-2`}
            />
            {customError && (
              <p className="text-xs text-red-400" role="alert">
                {customError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Estimated duration */}
      <p className="text-sm text-white/60">
        ⏱ Estimated duration: {formatDuration(cardCountTarget)}
      </p>
    </div>
  );
}
