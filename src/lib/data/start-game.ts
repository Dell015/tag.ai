import { rooms, potFunded, type Room } from '@/lib/data/rooms';
import { autoPool } from '@/lib/data/card-pool';
import { sourceCards } from '@/lib/data/game-source';
import { picksPool } from '@/lib/data/game-pool';
import { DECK_BY_ID, SESSIONS } from '@/lib/game/decks';
import { useShopStore } from '@/stores/shop-store';
import { useGameStore } from '@/stores/game-store';
import { useProfileStore } from '@/stores/profile-store';
import { useWalletStore } from '@/stores/wallet-store';
import { MIN_POT, isPotValid, gameBasket, basketCost, basketCards } from '@/lib/game/pot';
import { basketNames, type Basket } from '@/lib/game/decks';
import { buildBasketQueue, buildPoolQueue, modeForBasket } from '@/lib/game/card-queue-builder';

/** A stack needs at least this many cards to be played. */
export const MIN_OWN_CARDS = 5;

export const LAST_ROOM_KEY = 'tagai-last-room';

/** Every card that exists for this player: the library plus the packs they own. */
export function buildLibrary() {
  return autoPool(useShopStore.getState().owned, true);
}

export function allAgreed(room: Room): boolean {
  return room.players.length >= 2 && room.players.every((p) => room.agreedPlayers.includes(p.userId));
}

/** Players in the seat order the host arranged (turnOrder), numbered from 0. */
export function playOrder(room: Room) {
  return [...room.players].sort((a, b) => a.turnOrder - b.turnOrder).map((p, i) => ({ ...p, turnOrder: i }));
}

/** What the table bought: cards per deck, and what they cost in coins. */
export function roomBasket(room: Room) {
  const basket = gameBasket(room.config.potStyle ?? 'solo', room.config.basket, room.config.playerBaskets);
  return { basket, cards: basketCards(basket), coins: basketCost(basket) };
}

/** What the table plays: cards, coins and a name for the recap, from a built-in deck or the player's own source. */
export function roomPlan(room: Room) {
  const picks = room.config.picks;
  if (picks) {
    const pool = picksPool(picks, buildLibrary());
    const cards = Math.min(room.config.pot ?? MIN_POT, pool.length);
    const label = [...picks.decks.map((id) => DECK_BY_ID[id]?.name ?? id), ...picks.sources.map((s) => s.name)].join(' + ');
    return { picks, pool, source: undefined, basket: {} as Basket, cards, coins: cards, label };
  }
  const src = room.config.source;
  if (src) {
    const cards = Math.min(SESSIONS[room.config.session ?? 'short'], sourceCards(src).length);
    return { picks: undefined, pool: [] as ReturnType<typeof buildLibrary>, source: src, basket: {} as Basket, cards, coins: cards, label: src.name };
  }
  const { basket, cards, coins } = roomBasket(room);
  return { picks: undefined, pool: [] as ReturnType<typeof buildLibrary>, source: undefined, basket, cards, coins, label: basketNames(basket) };
}

/**
 * Builds the card queue on the host's phone from the basket, sets turn order, and flips the room
 * to `active`. Gameplay is local-first (CLAUDE.md section 3), so nothing else needs the network.
 */
export function startGame(room: Room, trashedCardIds: string[]): boolean {
  if (!allAgreed(room)) return false;
  const plan = roomPlan(room);
  const { basket, coins: total } = plan;
  const wallet = useProfileStore.getState().profile?.coins ?? 0;
  // Online rooms are paid by everyone from their own phones before the host can start, so the host's wallet is not touched.
  const funded = room.online ? potFunded(room) : 0;
  if (!(plan.picks || plan.source ? plan.cards >= MIN_OWN_CARDS : isPotValid(total))) return false;
  if (room.online ? funded < plan.cards : wallet + 1e-9 < total) return false;

  // The order players tapped to agree is the order they play.
  const players = playOrder(room);
  const opts = { comfortFilters: room.config.comfortFilters, trashedCardIds, playerCount: players.length, fitPlayers: true };
  const queue = plan.picks
    ? buildPoolQueue({ pool: plan.pool, count: plan.cards, ...opts })
    : plan.source
    ? buildPoolQueue({ pool: sourceCards(plan.source), count: plan.cards, ...opts })
    : buildBasketQueue({ basket, ...opts }, buildLibrary());
  if (queue.cards.length === 0) return false;
  // The pot is what the cards really cost, so a small stack never over-charges.
  const paid = room.online ? funded : plan.source || plan.picks ? queue.cards.filter((c) => c.cardType !== 'wild').length : total;

  useGameStore.getState().initializeBasket(queue, plan.source || plan.picks ? 'barkada' : modeForBasket(basket));
  if (!room.online) useWalletStore.getState().apply('pot', -paid, 'Pot for a tag.ai game');
  useGameStore.getState().fundPot(paid);
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
