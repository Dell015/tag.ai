'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useSessionStore } from '@/stores/session-store';
import { createClient } from '@/lib/supabase/client';

/**
 * EndScreen — Displays session results when the game ends.
 *
 * Shows:
 * - "Game Over!" heading
 * - Total cards played
 * - Final heat level with color indicator
 * - "Play Again" button
 *
 * On mount:
 * - Fire-and-forget sync to Supabase (update sessions table with
 *   status='ended', cards_played, heat_level, ended_at=now())
 * - Broadcasts 'session_ended' event via Realtime channel
 *
 * Validates: Requirements 23.1, 23.2, 23.3, 23.4
 */

interface EndScreenProps {
  onPlayAgain: () => void;
}

function getHeatColor(heatLevel: number): string {
  if (heatLevel >= 5.0) return '#ef4444'; // red
  if (heatLevel >= 4.0) return '#f97316'; // orange
  if (heatLevel >= 3.0) return '#eab308'; // gold
  if (heatLevel >= 2.0) return '#22c55e'; // green
  return '#3b82f6'; // blue
}

function getHeatLabel(heatLevel: number): string {
  if (heatLevel >= 5.0) return '🔥 Max Heat';
  if (heatLevel >= 4.0) return '🔥 High';
  if (heatLevel >= 3.0) return '🌡️ Warm';
  if (heatLevel >= 2.0) return '💚 Chill';
  return '❄️ Cool';
}

export function EndScreen({ onPlayAgain }: EndScreenProps) {
  const cardsPlayed = useGameStore((state) => state.cardsPlayed);
  const heatLevel = useGameStore((state) => state.heatLevel);
  const sessionId = useSessionStore((state) => state.sessionId);
  const roomCode = useSessionStore((state) => state.roomCode);
  const hasSyncedRef = useRef(false);

  // On mount: sync final session data to Supabase and broadcast session_ended
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const syncSessionEnd = async () => {
      const supabase = createClient();

      // Fire-and-forget: update session record in Supabase
      if (sessionId) {
        supabase
          .from('sessions')
          .update({
            status: 'ended',
            cards_played: cardsPlayed,
            heat_level: heatLevel,
            ended_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .then(({ error }) => {
            if (error) {
              console.error('[EndScreen] Failed to sync session end:', error.message);
            }
          });
      }

      // Broadcast session_ended event to player devices via Realtime
      if (roomCode) {
        const channel = supabase.channel(`session:${roomCode}`);
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'session_ended',
              payload: { cardsPlayed, heatLevel },
            });
            // Clean up channel after broadcasting
            setTimeout(() => {
              supabase.removeChannel(channel);
            }, 1000);
          }
        });
      }
    };

    syncSessionEnd();
  }, [sessionId, roomCode, cardsPlayed, heatLevel]);

  const heatColor = getHeatColor(heatLevel);
  const heatLabel = getHeatLabel(heatLevel);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-neutral-950 text-white">
      {/* Game Over heading */}
      <h1 className="text-4xl font-bold mb-8 text-center">Game Over!</h1>

      {/* Stats card */}
      <div className="w-full max-w-sm bg-neutral-900 rounded-2xl p-6 space-y-6 mb-10">
        {/* Total cards played */}
        <div className="text-center">
          <p className="text-sm text-neutral-400 uppercase tracking-wide mb-1">
            Cards Played
          </p>
          <p className="text-5xl font-bold tabular-nums">{cardsPlayed}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-800" />

        {/* Final heat level */}
        <div className="text-center">
          <p className="text-sm text-neutral-400 uppercase tracking-wide mb-1">
            Final Heat Level
          </p>
          <p
            className="text-3xl font-bold"
            style={{ color: heatColor }}
          >
            {heatLevel.toFixed(1)}
          </p>
          <p
            className="text-sm mt-1 font-medium"
            style={{ color: heatColor }}
          >
            {heatLabel}
          </p>
        </div>
      </div>

      {/* Play Again button */}
      <button
        type="button"
        onClick={onPlayAgain}
        className="w-full max-w-sm py-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold text-lg transition-colors"
      >
        Play Again
      </button>
    </div>
  );
}
