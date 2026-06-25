import { GameMode } from '@/types/game';

/**
 * Configuration for a game mode that determines starting intensity,
 * card pool distribution, and wild card frequency.
 */
export interface GameModeConfig {
  name: string;
  emoji: string;
  description: string;
  audienceTag: string;
  entryHeat: number;
  poolDistribution: Record<number, number>; // intensity level → percentage weight
  wildCardFrequency: { base: number; variance: number };
  maxHeat?: number; // e.g., 2.0 for Family mode
}

/**
 * All 6 game mode configurations for Tag.ai.
 *
 * Each mode defines the starting heat level, card pool intensity distribution,
 * wild card insertion frequency, and optional heat cap.
 *
 * Pool distribution values represent percentage weights (summing to 100)
 * for each intensity level (1-5).
 */
export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  icebreaker: {
    name: 'Icebreaker',
    emoji: '🧊',
    description: 'Light and easy — perfect for new groups',
    audienceTag: 'New friends',
    entryHeat: 1,
    poolDistribution: {
      1: 40,
      2: 40,
      3: 20,
      4: 0,
      5: 0,
    },
    wildCardFrequency: { base: 6, variance: 2 },
  },
  barkada: {
    name: 'Barkada',
    emoji: '🤙',
    description: 'For the squad — fun with a bit of heat',
    audienceTag: 'Close friends',
    entryHeat: 2,
    poolDistribution: {
      1: 15,
      2: 15,
      3: 25,
      4: 25,
      5: 20,
    },
    wildCardFrequency: { base: 6, variance: 2 },
  },
  lovers: {
    name: 'Lovers',
    emoji: '💕',
    description: 'Intimate and revealing — for couples or close pairs',
    audienceTag: 'Couples',
    entryHeat: 2,
    poolDistribution: {
      1: 10,
      2: 10,
      3: 40,
      4: 20,
      5: 20,
    },
    wildCardFrequency: { base: 6, variance: 2 },
  },
  spicy: {
    name: 'Spicy',
    emoji: '🌶️',
    description: 'High intensity — no holding back',
    audienceTag: 'Adventurous groups',
    entryHeat: 3,
    poolDistribution: {
      1: 5,
      2: 5,
      3: 30,
      4: 30,
      5: 30,
    },
    wildCardFrequency: { base: 6, variance: 2 },
  },
  chaos: {
    name: 'Chaos',
    emoji: '🎲',
    description: 'Fully random — anything goes',
    audienceTag: 'Thrill seekers',
    entryHeat: 2,
    poolDistribution: {
      1: 20,
      2: 20,
      3: 20,
      4: 20,
      5: 20,
    },
    wildCardFrequency: { base: 4, variance: 2 },
  },
  family: {
    name: 'Family',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Clean and wholesome — safe for all ages',
    audienceTag: 'All ages',
    entryHeat: 1,
    poolDistribution: {
      1: 50,
      2: 50,
      3: 0,
      4: 0,
      5: 0,
    },
    wildCardFrequency: { base: 6, variance: 2 },
    maxHeat: 2.0,
  },
};
