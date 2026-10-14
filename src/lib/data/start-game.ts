import { rooms, type Room } from '@/lib/data/rooms';
import { CURATED_CARDS } from '@/lib/data/cards';
import { useGameStore } from '@/stores/game-store';

export function allAgreed(room: Room): boolean {
  return room.players.length >= 2 && room.players.every((p) => room.agreedPlayers.includes(p.userId));
}

/**
 * Builds the card queue on the host's phone, sets turn order, and flips the room
 * to `active`. Gameplay itself is local-first (CLAUDE.md §3), so other devices
 * only need the status change.
 */
export function startGame(room: Room, trashedCardIds: string[]): boolean {
  if (!room.config.gameMode || !allAgreed(room)) return false;
  const players = [...room.players].sort((a, b) => a.turnOrder - b.turnOrder);

  useGameStore.getState().initializeQueue(
    {
      gameMode: room.config.gameMode,
      cardCountTarget: room.config.cardCountTarget,
      comfortFilters: room.config.comfortFilters,
      trashedCardIds,
      playerCount: players.length,
    },
    CURATED_CARDS,
  );
  useGameStore.setState({
    turnRotation: {
      players: players.map((p) => ({ id: p.userId, name: p.displayName, avatarUrl: p.avatarUrl, turnOrder: p.turnOrder })),
      currentIndex: 0,
    },
  });
  rooms.update(room.code, (r) => ({ ...r, status: 'active' }));
  return true;
}
