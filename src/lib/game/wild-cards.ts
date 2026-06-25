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
  emoji: string;
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
    description: 'The drawer asks the question to a player of their choice',
    emoji: '🔄',
  },
  pick_your_target: {
    type: 'pick_your_target',
    title: 'Pick Your Target',
    description: 'The drawer directs the card at one specific player',
    emoji: '🎯',
  },
  everyone_answers: {
    type: 'everyone_answers',
    title: 'Everyone Answers',
    description: 'All players answer the same question in turn order',
    emoji: '👥',
  },
  shuffle: {
    type: 'shuffle',
    title: 'Shuffle',
    description: 'Reshuffle the next 5 cards in the queue',
    emoji: '🔀',
    applyToQueue: applyShuffleWildCard,
  },
  heat_spike: {
    type: 'heat_spike',
    title: 'Heat Spike',
    description: 'Increases heat by 1 level for the next 3 cards, then reverts',
    emoji: '🔥',
    heatModifier: 1.0,
  },
  act_it_out: {
    type: 'act_it_out',
    title: 'Act It Out',
    description: 'The next card must be answered through charades',
    emoji: '🎭',
  },
  whisper_round: {
    type: 'whisper_round',
    title: 'Whisper Round',
    description: 'Current player whispers their answer to the person on their left only',
    emoji: '🤫',
  },
  free_drink: {
    type: 'free_drink',
    title: 'Free Drink',
    description: 'Everyone drinks! No question — just vibes',
    emoji: '🍺',
  },
  crown: {
    type: 'crown',
    title: 'Crown',
    description: 'You are immune to drink assignments for the next 2 cards',
    emoji: '👑',
    immunityCards: 2,
  },
};
