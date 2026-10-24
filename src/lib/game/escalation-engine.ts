/**
 * Escalation Engine — Pure functions for heat calculation and card selection.
 *
 * The heat level represents session intensity (1.0–5.0) and influences
 * which cards are drawn next via weighted random selection.
 */

import type { CardKind, CardTool } from '@/lib/game/card-kinds';
import { CardCategory, GameMode, WildCardType } from '@/types/game';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EscalationEvent = 'dismiss' | 'heart' | 'skip' | 'wild_card';

export interface EscalationInput {
  currentHeat: number; // 1.0 - 5.0
  event: EscalationEvent;
  consecutiveSkips: number;
  gameMode: GameMode;
  /** Scales every step (see heatPace). Defaults to 1. */
  pace?: number;
}

export interface EscalationOutput {
  newHeat: number; // 1.0 - 5.0, clamped
}

export interface QueuedCard {
  id: string;
  text: string;
  cardType: 'question' | 'action' | 'wild';
  intensity: number; // 1-5
  category: CardCategory;
  wildCardType?: WildCardType;
  topics: string[];
  /** 18+ card. Only drawn when the 18+ cards setting is on. */
  adult?: boolean;
  /** Set to override the group size worked out from the wording. */
  people?: { min: number; max: number | null };
  /** The deck this card was bought from. Sets what it costs from the pot. */
  deckId?: string;
  /** How it is played. Missing on older cards: questions are truths, actions are dares. */
  kind?: CardKind;
  /** Settings for the card's built-in tool (dice count, wheel labels, timer seconds). */
  tool?: CardTool;
  /** What each result means. Dice: six lines for 1 to 6. Coin: heads, then tails. {drink} adapts to non-drinking tables. */
  outcomes?: string[];
  /** Shots for failing or refusing this card. Missing means the default for its kind (penaltyFor). */
  penalty?: number;
  /** Rule cards: the short line shown while the rule is on, until the next wild card. */
  rule?: string;
}

// ─── Heat Adjustment Constants ───────────────────────────────────────────────

const HEAT_ADJUSTMENTS: Record<EscalationEvent, number> = {
  dismiss: 0.3,
  heart: 0.5,
  skip: -0.2,
  wild_card: 0.5,
};

const CONSECUTIVE_SKIP_THRESHOLD = 3;
const CONSECUTIVE_SKIP_PENALTY = -1.0;

const HEAT_MIN = 1.0;
const HEAT_MAX = 5.0;
const FAMILY_MODE_MAX_HEAT = 2.0;

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Pure function. Calculates new heat based on event.
 * Family mode caps at 2.0.
 * Heat is always clamped between 1.0 and 5.0.
 */
/**
 * How fast heat moves for a game of this length. Short games (10 cards) move twice as fast; longer ones
 * are slowed so the meter fills about two thirds of the way through, not in the first 12 cards.
 */
export const heatPace = (cardCountTarget: number): number => Math.max(0.15, Math.min(2, 20.5 / Math.max(1, cardCountTarget)));

export function calculateHeat(input: EscalationInput): EscalationOutput {
  const { currentHeat, event, consecutiveSkips, gameMode, pace = 1 } = input;

  let delta: number;

  if (event === 'skip' && consecutiveSkips >= CONSECUTIVE_SKIP_THRESHOLD) {
    // 3 consecutive skips triggers a full level drop
    delta = CONSECUTIVE_SKIP_PENALTY;
  } else {
    delta = HEAT_ADJUSTMENTS[event];
  }

  let newHeat = currentHeat + delta * pace;

  // Apply Family mode cap
  if (gameMode === 'family') {
    newHeat = Math.min(newHeat, FAMILY_MODE_MAX_HEAT);
  }

  // Clamp between 1.0 and 5.0
  newHeat = Math.max(HEAT_MIN, Math.min(HEAT_MAX, newHeat));

  return { newHeat };
}

/**
 * Maps a heat value (1.0–5.0) to a card intensity level (1–5).
 * Uses Math.floor, clamped to [1, 5].
 */
export function heatToIntensityLevel(heat: number): number {
  const level = Math.floor(heat);
  return Math.max(1, Math.min(5, level));
}

/**
 * Selects the next card from available pool based on current heat.
 * Weighted random: 60% current level, 30% adjacent, 10% distant.
 * Pure function given a deterministic random source.
 *
 * If no cards exist in the weighted selection, falls back to any available card.
 */
export function selectCardByHeat(
  availableCards: QueuedCard[],
  currentHeat: number,
  random: () => number
): QueuedCard {
  if (availableCards.length === 0) {
    throw new Error('No available cards to select from');
  }

  if (availableCards.length === 1) {
    return availableCards[0];
  }

  const currentLevel = heatToIntensityLevel(currentHeat);

  // Categorize cards by proximity to current heat level
  const currentLevelCards: QueuedCard[] = [];
  const adjacentCards: QueuedCard[] = [];
  const distantCards: QueuedCard[] = [];

  for (const card of availableCards) {
    const distance = Math.abs(card.intensity - currentLevel);
    if (distance === 0) {
      currentLevelCards.push(card);
    } else if (distance === 1) {
      adjacentCards.push(card);
    } else {
      distantCards.push(card);
    }
  }

  // Determine which bucket to pick from using weighted random
  const roll = random();

  let selectedPool: QueuedCard[];

  if (roll < 0.6) {
    // 60% chance: pick from current level
    selectedPool = currentLevelCards;
  } else if (roll < 0.9) {
    // 30% chance: pick from adjacent levels (±1)
    selectedPool = adjacentCards;
  } else {
    // 10% chance: pick from distant levels (±2 or more)
    selectedPool = distantCards;
  }

  // Fallback: if the selected pool is empty, try in priority order
  if (selectedPool.length === 0) {
    if (currentLevelCards.length > 0) {
      selectedPool = currentLevelCards;
    } else if (adjacentCards.length > 0) {
      selectedPool = adjacentCards;
    } else {
      selectedPool = distantCards;
    }
  }

  // Final fallback: use all available cards if somehow all pools are empty
  if (selectedPool.length === 0) {
    selectedPool = availableCards;
  }

  // Pick a random card from the selected pool
  const index = Math.floor(random() * selectedPool.length);
  return selectedPool[index];
}
