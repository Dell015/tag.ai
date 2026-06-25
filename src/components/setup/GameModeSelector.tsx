'use client';

import { useCallback } from 'react';
import { GameMode } from '@/types/game';
import { GAME_MODES } from '@/lib/game/game-modes';
import { useSessionStore } from '@/stores/session-store';

const MODE_KEYS: GameMode[] = [
  'icebreaker',
  'barkada',
  'lovers',
  'spicy',
  'chaos',
  'family',
];

interface GameModeSelectorProps {
  /** Callback to broadcast the game mode change to other players via Realtime */
  onBroadcastChange?: (gameMode: GameMode) => void;
}

export function GameModeSelector({ onBroadcastChange }: GameModeSelectorProps) {
  const { gameMode, setSession } = useSessionStore();

  const handleSelect = useCallback(
    (mode: GameMode) => {
      setSession({ gameMode: mode });
      onBroadcastChange?.(mode);
    },
    [setSession, onBroadcastChange]
  );

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-white">Choose a mode</h3>

      <div className="grid grid-cols-2 gap-3">
        {MODE_KEYS.map((key) => {
          const mode = GAME_MODES[key];
          const isSelected = gameMode === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              aria-pressed={isSelected}
              className={`flex flex-col items-start gap-1 p-4 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-purple-600/30 ring-2 ring-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {mode.emoji}
              </span>
              <span className="text-sm font-semibold text-white">
                {mode.name}
              </span>
              <span className="text-xs text-white/60 leading-tight">
                {mode.description}
              </span>
              <span className="mt-1 text-[10px] font-medium text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                {mode.audienceTag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
