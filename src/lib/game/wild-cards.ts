/**
 * Wild Card Definitions and Logic — Pure functions for wild card effects.
 *
 * Wild cards are special cards inserted into the queue that trigger
 * group events, modify game state, or alter card ordering.
 * All functions here are pure (no side effects).
 */

import { WildCardType } from '@/types/game';
import { QueuedCard } from './escalation-engine';
import { fillDrink } from './card-kinds';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WildCardEffect {
  type: WildCardType;
  title: string;
  description: string;
  applyToQueue?: (queue: QueuedCard[], currentIndex: number) => QueuedCard[];
  heatModifier?: number;
  immunityCards?: number;
  /** Shots for failing the challenge (2 or 3). */
  penalty?: number;
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
 * The wild cards. Each is a one-off challenge that gets everyone out of their seat, with a
 * penalty in shots for failing it. Nothing lingers after the card, so nothing is hard to follow.
 * {shot}, {shots} and {drink} adapt to non-drinking tables (see card-kinds).
 */
export const WILD_CARD_DEFINITIONS: Record<WildCardType, WildCardEffect> = {
  call_out: {
    type: 'call_out',
    title: 'Call Out',
    description: 'Call someone who is not in this group. When they answer, shout anything, then hang up.',
    penalty: 3,
  },
  voice_note: {
    type: 'voice_note',
    title: 'Voice Note',
    description: 'Send a 10 second voice note to a friend who is not here. Sing it, shout it or whisper it.',
    penalty: 2,
  },
  group_pose: {
    type: 'group_pose',
    title: 'Freeze',
    description: 'Everyone strikes a pose on the count of three and holds it for 5 seconds. The first to move takes the penalty.',
    penalty: 2,
  },
  dance_off: {
    type: 'dance_off',
    title: 'Dance Off',
    description: 'Everyone dances for 15 seconds. The group votes for the worst dancer, who takes the penalty.',
    penalty: 2,
  },
};

/** Player-facing text for a wild card, adapted when the table is not drinking. */
export function wildDescription(type: WildCardType, nonDrinking: boolean): string {
  return fillDrink(WILD_CARD_DEFINITIONS[type].description, nonDrinking);
}
