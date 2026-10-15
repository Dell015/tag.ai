/**
 * Wild Card Definitions and Logic — Pure functions for wild card effects.
 *
 * Wild cards are special cards inserted into the queue that trigger
 * group events, modify game state, or alter card ordering.
 * All functions here are pure (no side effects).
 */

import { WildCardType } from '@/types/game';
import { QueuedCard } from './escalation-engine';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WildCardEffect {
  type: WildCardType;
  title: string;
  description: string;
  applyToQueue?: (queue: QueuedCard[], currentIndex: number) => QueuedCard[];
  heatModifier?: number;
  immunityCards?: number;
}

// ─── Shuffle Helper ──────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle applied to a sub-array in place.
 * Uses Math.random by default. Pure when a seeded random is provided.
 */
function fisherYatesShuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── Wild Card Queue Effect ──────────────────────────────────────────────────

/**
 * Applies the Shuffle wild card effect to the queue.
 * Reshuffles the next 5 cards after currentIndex (or fewer if near end of queue).
 * Returns a new queue array — does not mutate the original.
 */
export function applyShuffleWildCard(
  queue: QueuedCard[],
  currentIndex: number
): QueuedCard[] {
  const startIndex = currentIndex + 1;
  const endIndex = Math.min(startIndex + 5, queue.length);

  // If no cards remain to shuffle, return the queue unchanged
  if (startIndex >= queue.length) {
    return [...queue];
  }

  const before = queue.slice(0, startIndex);
  const toShuffle = queue.slice(startIndex, endIndex);
  const after = queue.slice(endIndex);

  const shuffled = fisherYatesShuffle(toShuffle);

  return [...before, ...shuffled, ...after];
}

// ─── Heat Spike Logic ────────────────────────────────────────────────────────

/**
 * Calculates the effective heat when a heat spike is active.
 * Increases heat by 1.0, capped at 5.0.
 */
export function applyHeatSpike(currentHeat: number): number {
  return Math.min(currentHeat + 1.0, 5.0);
}

/**
 * Determines if the heat spike should revert after a card action.
 * Returns the remaining count after decrementing.
 * When it reaches 0, the heat should revert to preSpikeHeat.
 */
export function decrementHeatSpike(heatSpikeRemaining: number): number {
  if (heatSpikeRemaining <= 0) return 0;
  return heatSpikeRemaining - 1;
}

// ─── Crown Immunity Logic ────────────────────────────────────────────────────

/**
 * Decrements crown immunity remaining count after a card action.
 * Returns the new remaining count. When 0, player is no longer immune.
 */
export function decrementCrownImmunity(crownImmunityRemaining: number): number {
  if (crownImmunityRemaining <= 0) return 0;
  return crownImmunityRemaining - 1;
}

/**
 * Checks if a player currently has crown immunity active.
 */
export function hasCrownImmunity(crownImmunityRemaining: number): boolean {
  return crownImmunityRemaining > 0;
}

// ─── Wild Card Definitions ───────────────────────────────────────────────────

/**
 * All 9 wild card type definitions with their display info and effects.
 */
export const WILD_CARD_DEFINITIONS: Record<WildCardType, WildCardEffect> = {
  role_reversal: {
    type: 'role_reversal',
    title: 'Role Reversal',
    description: 'Ask the question yourself. Pick a player to answer it.',
  },
  pick_your_target: {
    type: 'pick_your_target',
    title: 'Pick Your Target',
    description: 'Choose one player. This round is aimed at them.',
  },
  everyone_answers: {
    type: 'everyone_answers',
    title: 'Everyone Answers',
    description: 'Everyone takes a turn answering, starting with you.',
  },
  shuffle: {
    type: 'shuffle',
    title: 'Shuffle',
    description: 'The next 5 cards are shuffled.',
    applyToQueue: applyShuffleWildCard,
  },
  heat_spike: {
    type: 'heat_spike',
    title: 'Heat Spike',
    description: 'The next 3 cards turn up the heat.',
    heatModifier: 1.0,
  },
  act_it_out: {
    type: 'act_it_out',
    title: 'Act It Out',
    description: 'Answer the next card in charades. No talking.',
  },
  whisper_round: {
    type: 'whisper_round',
    title: 'Whisper Round',
    description: 'Whisper your answer to the player on your left. Nobody else hears it.',
  },
  free_drink: {
    type: 'free_drink',
    title: 'Free Drink',
    description: 'Everyone drinks. No question this time.',
  },
  crown: {
    type: 'crown',
    title: 'Crown',
    description: 'You are immune to drink assignments for the next 2 cards.',
    immunityCards: 2,
  },
};

/** Player-facing text for a wild card, adapted when the table is not drinking. */
export function wildDescription(type: WildCardType, nonDrinking: boolean): string {
  const text = WILD_CARD_DEFINITIONS[type].description;
  if (!nonDrinking) return text;
  return text
    .replace('Everyone drinks.', 'Everyone does a forfeit.')
    .replace('drink assignments', 'forfeit assignments');
}

/** Wild cards that name a player. */
export const TARGET_WILD_CARDS: WildCardType[] = ['role_reversal', 'pick_your_target'];
