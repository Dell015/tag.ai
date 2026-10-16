import { rooms, type Room } from '@/lib/data/rooms';
import { autoPool } from '@/lib/data/card-pool';
import { useShopStore } from '@/stores/shop-store';
import { useGameStore } from '@/stores/game-store';
import { useProfileStore } from '@/stores/profile-store';
import { useWalletStore } from '@/stores/wallet-store';
import { isPotValid, gameBasket, basketCost, basketCards } from '@/lib/game/pot';
import { buildBasketQueue, modeForBasket } from '@/lib/game/card-queue-builder';

export const LAST_ROOM_KEY = 'tagai-last-room';

/** Every card that exists for this player: the library plus the packs they own. */
export function buildLibrary() {
  return autoPool(useShopStore.getState().owned, true);
}

export function allAgreed(room: Room): boolean {
  return room.players.length >= 2 && room.players.every((p) => room.agreedPlayers.includes(p.userId));
}

/** What the table bought: cards per deck, and what they cost in coins. */
export function roomBasket(room: Room) {
  const basket = gameBasket(room.config.potStyle ?? 'solo', room.config.basket, room.config.playerBaskets);
  return { basket, cards: basketCards(basket), coins: basketCost(basket) };
}

/**
 * Builds the card queue on the host's phone from the basket, sets turn order, and flips the room
 * to `active`. Gameplay is local-first (CLAUDE.md section 3), so nothing else needs the network.
 */
export function startGame(room: Room, trashedCardIds: string[]): boolean {
  if (!allAgreed(room)) return false;
  const { basket, coins: total } = roomBasket(room);
  const wallet = useProfileStore.getState().profile?.coins ?? 0;
  if (!isPotValid(total) || wallet + 1e-9 < total) return false;

  const players = [...room.players].sort((a, b) => a.turnOrder - b.turnOrder);
  const queue = buildBasketQueue({ basket, comfortFilters: room.config.comfortFilters, trashedCardIds, playerCount: players.length, fitPlayers: true }, buildLibrary());
  if (queue.cards.length === 0) return false;

  useGameStore.getState().initializeBasket(queue, modeForBasket(basket));
  useWalletStore.getState().apply('pot', -total, 'Pot for a tag.ai game');
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
