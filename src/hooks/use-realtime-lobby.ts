'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session-store';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameMode, SessionPlayer } from '@/types/game';

interface PlayerJoinedPayload {
  userId: string;
  displayName: string;
  avatarUrl: string;
  turnOrder: number;
}

interface PlayerRemovedPayload {
  userId: string;
}

interface SetupChangedPayload {
  cardCount?: number;
  gameMode?: GameMode;
  comfortFilters?: string[];
}

interface RulesAgreedPayload {
  userId: string;
}

interface GameStartedPayload {
  sessionId: string;
}

/**
 * Subscribes to Supabase Realtime channel for lobby events.
 * Handles: player_joined, player_removed, setup_changed,
 *           rules_agreed, game_started, session_ended
 */
export function useRealtimeLobby(roomCode: string): {
  isConnected: boolean;
  error: Error | null;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const supabase = createClient();
    const channelName = `session:${roomCode}`;
    const { setSession, addPlayer, removePlayer, setPlayerAgreed } =
      useSessionStore.getState();

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
        const data = payload as PlayerJoinedPayload;
        const player: SessionPlayer = {
          id: data.userId,
          userId: data.userId,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          turnOrder: data.turnOrder,
          agreedToRules: false,
        };
        addPlayer(player);
      })
      .on('broadcast', { event: 'player_removed' }, ({ payload }) => {
        const data = payload as PlayerRemovedPayload;
        removePlayer(data.userId);
      })
      .on('broadcast', { event: 'setup_changed' }, ({ payload }) => {
        const data = payload as SetupChangedPayload;
        const update: Partial<Record<string, unknown>> = {};
        if (data.cardCount !== undefined) {
          update.cardCountTarget = data.cardCount;
        }
        if (data.gameMode !== undefined) {
          update.gameMode = data.gameMode;
        }
        if (data.comfortFilters !== undefined) {
          update.comfortFilters = data.comfortFilters;
        }
        setSession(update);
      })
      .on('broadcast', { event: 'rules_agreed' }, ({ payload }) => {
        const data = payload as RulesAgreedPayload;
        setPlayerAgreed(data.userId);
      })
      .on('broadcast', { event: 'game_started' }, ({ payload }) => {
        const data = payload as GameStartedPayload;
        setSession({ sessionId: data.sessionId, status: 'active' });
      })
      .on('broadcast', { event: 'session_ended' }, () => {
        setSession({ status: 'ended' });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError(new Error(`Failed to subscribe to channel: ${channelName}`));
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError(new Error(`Subscription timed out for channel: ${channelName}`));
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [roomCode]);

  return { isConnected, error };
}
