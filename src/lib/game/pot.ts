/**
 * Coin pot maths (docs/FRONTEND_PLAN.md section 6.2). Pure functions, no state.
 * Cost per card = 1 / questions-per-coin. Wild cards are free.
 */
import { GAME_MODES, blendModes } from '@/lib/game/game-modes';
import { deckOf, basketCost, basketCards, sumBaskets, type Basket } from '@/lib/game/decks';
import type { GameMode } from '@/types/game';

export const MIN_POT = 3;
export const MAX_POT = 200;
export const HEAT_UP_COST = 2;
export const LOW_POT_RATIO = 0.2;

interface CostCard { cardType: 'question' | 'action' | 'wild'; intensity: number; deckId?: string }

const PER_COIN = { casual: 15, standard: 10, spicy: 6, deep: 4, dare: 5 } as const;

/** Coins one card uses from the pot. */
export function cardCost(card: CostCard): number {
  if (card.cardType === 'wild') return 0;
  const deck = card.deckId ? deckOf(card.deckId) : undefined;
  if (deck) return deck.price;
  if (card.cardType === 'action') return 1 / PER_COIN.dare;
  if (card.intensity <= 1) return 1 / PER_COIN.casual;
  if (card.intensity <= 3) return 1 / PER_COIN.standard;
  if (card.intensity === 4) return 1 / PER_COIN.spicy;
  return 1 / PER_COIN.deep;
}

/** Average cost of one card in a deck, from its intensity mix. */
export function averageCardCost(mode: GameMode): number {
  const dist = GAME_MODES[mode].poolDistribution;
  let total = 0;
  let weight = 0;
  for (const [level, w] of Object.entries(dist)) {
    total += cardCost({ cardType: 'question', intensity: Number(level) }) * w;
    weight += w;
  }
  return weight ? total / weight : 0.1;
}

/** How many cards a pot of `coins` covers in this deck. */
export function estimateCards(coins: number, mode: GameMode): number {
  return Math.floor(coins / averageCardCost(mode));
}

/** Coins suggested for a game of `cards` cards (never below the minimum). */
export function suggestedPot(cards: number, mode: GameMode): number {
  return Math.max(MIN_POT, Math.ceil(cards * averageCardCost(mode)));
}

export type PotStyle = 'solo' | 'split' | 'chipin';

/**
 * Coins in the pot. Solo is one amount, split multiplies it by the players,
 * chip in adds up what each person put in (`shares`). The host's wallet covers it all;
 * everyone else settles with the host in cash (1 coin = 1 peso).
 */
export function potTotal(style: PotStyle, coins: number, players: number, shares: number[] = []): number {
  if (style === 'chipin') return round3(shares.reduce((a, n) => a + Math.max(0, n), 0));
  return style === 'split' ? coins * Math.max(1, players) : coins;
}

/** What each person owes the host in pesos, for split and chip in. The host owes nobody. */
export function owedByPlayer(style: PotStyle, coins: number, players: { userId: string; isGuest?: boolean }[], hostId: string, shares: Record<string, number> = {}): { userId: string; pesos: number }[] {
  if (style === 'solo') return [];
  return players.filter((p) => p.userId !== hostId).map((p) => ({ userId: p.userId, pesos: style === 'split' ? coins : Math.max(0, shares[p.userId] ?? 0) }));
}

/** Cards a pot covers when several decks are mixed. */
export function estimateCardsFor(coins: number, modes: GameMode[]): number {
  const dist = blendModes(modes).poolDistribution;
  let total = 0;
  let weight = 0;
  for (const [level, w] of Object.entries(dist)) {
    total += cardCost({ cardType: 'question', intensity: Number(level) }) * w;
    weight += w;
  }
  const avg = weight ? total / weight : 0.1;
  return Math.floor(coins / avg);
}

/** How many cards a game is planned for: what the pot covers, within 5 to 100. */
export const plannedCards = (coins: number, modes: GameMode[]) => Math.max(5, Math.min(100, estimateCardsFor(coins, modes)));

/** Share of the leftover pot each non-host player is owed back, in pesos. */
export function returnShares(owed: { userId: string; pesos: number }[], total: number, left: number): { userId: string; pesos: number }[] {
  if (total <= 0 || left <= 0) return [];
  return owed.filter((o) => o.pesos > 0).map((o) => ({ userId: o.userId, pesos: round3((left * o.pesos) / total) }));
}

export function isPotValid(total: number): boolean {
  return total >= MIN_POT && total <= MAX_POT;
}

/** Remove float dust so 0.1 + 0.2 style sums stay clean. */
export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function isLow(remaining: number, start: number): boolean {
  return start > 0 && remaining > 0 && remaining <= start * LOW_POT_RATIO;
}

/** Display: whole numbers plain, otherwise one decimal. */
export function formatPot(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

// ─── Baskets: cards bought per deck ──────────────────────────────────────────

/** Everything bought for the game: the shared basket plus any personal baskets (chip in). */
export function gameBasket(style: PotStyle, shared: Basket | undefined, personal: Record<string, Basket> | undefined): Basket {
  return style === 'chipin' ? sumBaskets(...Object.values(personal ?? {})) : sumBaskets(shared);
}

/**
 * What each person owes the host in pesos (1 coin = P1). Solo owes nothing, split divides the
 * total equally, chip in charges each player for their own basket. The host owes nobody.
 */
export function owedForBasket(style: PotStyle, total: number, players: { userId: string }[], hostId: string, personal: Record<string, Basket> = {}): { userId: string; pesos: number }[] {
  if (style === 'solo') return [];
  const others = players.filter((p) => p.userId !== hostId);
  if (style === 'split') return others.map((p) => ({ userId: p.userId, pesos: round3(total / Math.max(1, players.length)) }));
  return others.map((p) => ({ userId: p.userId, pesos: basketCost(personal[p.userId] ?? {}) }));
}

export { basketCost, basketCards };

/** Price of one card: up to two decimals, no trailing zeros (0.1, 0.25, 0.6). */
export function formatPrice(n: number): string {
  return String(Math.round(n * 100) / 100);
}
