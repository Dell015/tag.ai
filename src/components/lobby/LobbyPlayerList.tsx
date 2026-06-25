'use client';

import Image from 'next/image';
import { useSessionStore } from '@/stores/session-store';
import { createClient } from '@/lib/supabase/client';

interface LobbyPlayerListProps {
  isHost: boolean;
}

export function LobbyPlayerList({ isHost }: LobbyPlayerListProps) {
  const players = useSessionStore((state) => state.players);
  const hostId = useSessionStore((state) => state.hostId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const roomCode = useSessionStore((state) => state.roomCode);
  const removePlayer = useSessionStore((state) => state.removePlayer);

  const handleRemovePlayer = async (userId: string) => {
    if (!sessionId || !roomCode) return;

    const supabase = createClient();

    // Remove from session_players table (soft delete with removed_at)
    await supabase
      .from('session_players')
      .update({ removed_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    // Broadcast player_removed event via Realtime
    const channel = supabase.channel(`session:${roomCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'player_removed',
      payload: { userId },
    });

    // Update local store
    removePlayer(userId);
  };

  return (
    <div className="w-full space-y-3">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
        Players ({players.length})
      </h3>
      <ul className="space-y-2">
        {players.map((player) => {
          const isPlayerHost = player.userId === hostId;

          return (
            <li
              key={player.userId}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 border border-white/10"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  {player.avatarUrl ? (
                    <Image
                      src={player.avatarUrl}
                      alt={`${player.displayName}'s avatar`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                      {player.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name and host badge */}
                <div className="flex flex-col">
                  <span className="text-base font-medium text-white">
                    {player.displayName}
                  </span>
                  {isPlayerHost && (
                    <span className="text-xs text-amber-400 font-medium">
                      👑 Host
                    </span>
                  )}
                </div>
              </div>

              {/* Remove button — shown only to host and not for themselves */}
              {isHost && !isPlayerHost && (
                <button
                  onClick={() => handleRemovePlayer(player.userId)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                  aria-label={`Remove ${player.displayName}`}
                  title={`Remove ${player.displayName}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {players.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-4">
          Waiting for players to join...
        </p>
      )}
    </div>
  );
}
