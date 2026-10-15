import { rooms, type Room } from '@/lib/data/rooms';
import { autoPool } from '@/lib/data/card-pool';
import { useSettingsStore } from '@/stores/settings-store';
import { useShopStore } from '@/stores/shop-store';
import { applySlots, toQueuedCards, useDeckStore } from '@/stores/deck-store';
import { useGameStore } from '@/stores/game-store';
import { useProfileStore } from '@/stores/profile-store';
import { useWalletStore } from '@/stores/wallet-store';
import { isPotValid, potTotal } from '@/lib/game/pot';

export const LAST_ROOM_KEY = 'tagai-last-room';

/** The cards a game draws from: the Auto pool, or only the chosen decks (a small deck makes a shorter game). */
export function buildLibrary(room: Room) {
  const auto = autoPool(useShopStore.getState().owned, useSettingsStore.getState().adultContent);
  const ids = room.config.deckIds ?? [];
  if (ids.length === 0) return auto;
  const decks = useDeckStore.getState().decks.filter((d) => ids.includes(d.id));
  const own = applySlots(decks.flatMap(toQueuedCards), room.config.slotFills ?? []);
  return own.length > 0 ? own : auto;
}

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
  const total = potTotal(room.config.potStyle ?? 'solo', room.config.potCoins ?? 0, players.length);
  const coins = useProfileStore.getState().profile?.coins ?? 0;
  if (!isPotValid(total) || coins + 1e-9 < total) return false;

  useGameStore.getState().initializeQueue(
    {
      gameMode: room.config.gameMode,
      extraModes: room.config.extraModes ?? [],
      cardCountTarget: room.config.cardCountTarget,
      comfortFilters: room.config.comfortFilters,
      trashedCardIds,
      playerCount: players.length,
      fitPlayers: (room.config.deckIds ?? []).length === 0,
    },
    buildLibrary(room),
  );
  useWalletStore.getState().apply('pot', -total, `Pot for a ${room.config.gameMode} game`);
  useGameStore.getState().fundPot(total);
  useGameStore.setState({
    turnRotation: {
      players: players.map((p) => ({ id: p.userId, name: p.displayName, avatarUrl: p.avatarUrl, turnOrder: p.turnOrder })),
      currentIndex: 0,
    },
  });
  rooms.update(room.code, (r) => ({ ...r, status: 'active' }));
  try { window.localStorage.setItem(LAST_ROOM_KEY, room.code); } catch { /* ignore */ }
  return true;
}
