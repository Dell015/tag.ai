import { GameMode } from '@/types/game';

/**
 * Configuration for a game mode that determines starting intensity,
 * card pool distribution, and wild card frequency.
 */
export interface GameModeConfig {
  name: string;
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
    description: 'Light and easy, perfect for new groups',
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
    description: 'For the squad, fun with a bit of heat',
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
    description: 'Intimate and revealing, for couples or close pairs',
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
    description: 'High intensity, no holding back',
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
    description: 'Fully random, anything goes',
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
    description: 'Clean and wholesome, safe for all ages',
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

/**
 * Several decks played together: pool weights are averaged, the wild card gap and entry heat
 * average too. Family never mixes (it caps heat and intensity), so a blend ignores it unless alone.
 */
export function blendModes(modes: GameMode[]): GameModeConfig {
  const list = modes.length > 1 ? modes.filter((m) => m !== 'family') : modes;
  if (list.length <= 1) return GAME_MODES[list[0] ?? 'barkada'];
  const cfgs = list.map((m) => GAME_MODES[m]);
  const avg = (f: (c: GameModeConfig) => number) => cfgs.reduce((a, c) => a + f(c), 0) / cfgs.length;
  const dist: Record<number, number> = {};
  for (let i = 1; i <= 5; i++) dist[i] = Math.round(avg((c) => c.poolDistribution[i] ?? 0));
  return {
    name: cfgs.map((c) => c.name).join(' + '),
    description: 'A mix of decks',
    audienceTag: 'Mixed',
    entryHeat: Math.round(avg((c) => c.entryHeat)),
    poolDistribution: dist,
    wildCardFrequency: { base: Math.round(avg((c) => c.wildCardFrequency.base)), variance: Math.max(...cfgs.map((c) => c.wildCardFrequency.variance)) },
  };
}
