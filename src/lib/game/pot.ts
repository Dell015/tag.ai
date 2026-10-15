/**
 * Coin pot maths (docs/FRONTEND_PLAN.md section 6.2). Pure functions, no state.
 * Cost per card = 1 / questions-per-coin. Wild cards are free.
 */
import { GAME_MODES } from '@/lib/game/game-modes';
import type { GameMode } from '@/types/game';

export const MIN_POT = 3;
export const MAX_POT = 200;
export const HEAT_UP_COST = 2;
export const LOW_POT_RATIO = 0.2;

interface CostCard { cardType: 'question' | 'action' | 'wild'; intensity: number }

const PER_COIN = { casual: 15, standard: 10, spicy: 6, deep: 4, dare: 5 } as const;

/** Coins one card uses from the pot. */
export function cardCost(card: CostCard): number {
  if (card.cardType === 'wild') return 0;
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

/** Total the host funds. Split mode multiplies the per-player amount. */
export function potTotal(style: 'solo' | 'split', coins: number, players: number): number {
  return style === 'split' ? coins * Math.max(1, players) : coins;
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
