/**
 * Card Queue Builder — Pure function for constructing the game card queue.
 *
 * Builds a shuffled card queue based on game configuration including:
 * - Comfort filter topic exclusion
 * - Trashed card exclusion
 * - Game mode intensity distribution
 * - Wild card insertion at configured frequency
 * - Action card insertion at ~1 in every 8 cards
 * - Main queue (cardCountTarget) + buffer (20% extra)
 *
 * This function is pure — no side effects, no network calls.
 */

import { GameMode, WildCardType } from '@/types/game';
import { QueuedCard } from './escalation-engine';
import { GAME_MODES } from './game-modes';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CardQueueConfig {
  gameMode: GameMode;
  cardCountTarget: number;
  comfortFilters: string[];
  trashedCardIds: string[]; // current user's trashed cards
  playerCount: number;
}

export interface CardQueue {
  cards: QueuedCard[]; // Main queue (card_count_target items)
  buffer: QueuedCard[]; // 20% extra for trash replacements
}

// ─── Wild Card Types Pool ────────────────────────────────────────────────────

const WILD_CARD_TYPES: WildCardType[] = [
  'role_reversal',
  'pick_your_target',
  'everyone_answers',
  'shuffle',
  'heat_spike',
  'act_it_out',
  'whisper_round',
  'free_drink',
  'crown',
];

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle. Returns a new array.
 */
function shuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a wild card placeholder with a random type.
 */
function generateWildCard(random: () => number = Math.random): QueuedCard {
  const typeIndex = Math.floor(random() * WILD_CARD_TYPES.length);
  const wildType = WILD_CARD_TYPES[typeIndex];

  return {
    id: `wild-${Date.now()}-${Math.floor(random() * 100000)}`,
    text: '',
    cardType: 'wild',
    intensity: 0,
    category: 'hot_takes', // placeholder — wild cards don't have a real category
    wildCardType: wildType,
    topics: [],
  };
}

/**
 * Selects cards from the pool using weighted random selection
 * based on the game mode's pool distribution.
 */
function selectByDistribution(
  pool: QueuedCard[],
  count: number,
  distribution: Record<number, number>,
  random: () => number = Math.random
): QueuedCard[] {
  if (pool.length === 0 || count === 0) return [];

  // Group cards by intensity
  const byIntensity: Record<number, QueuedCard[]> = {};
  for (const card of pool) {
    if (!byIntensity[card.intensity]) {
      byIntensity[card.intensity] = [];
    }
    byIntensity[card.intensity].push(card);
  }

  // Calculate cumulative distribution thresholds
  const thresholds: { level: number; cumulative: number }[] = [];
  let cumulative = 0;
  for (const [level, weight] of Object.entries(distribution)) {
    if (weight > 0) {
      cumulative += weight;
      thresholds.push({ level: Number(level), cumulative });
    }
  }

  // Normalize to 0-1 range
  const totalWeight = cumulative;
  const normalizedThresholds = thresholds.map((t) => ({
    level: t.level,
    cumulative: t.cumulative / totalWeight,
  }));

  const selected: QueuedCard[] = [];
  const usedIds = new Set<string>();

  let attempts = 0;
  const maxAttempts = count * 10; // prevent infinite loops

  while (selected.length < count && attempts < maxAttempts) {
    attempts++;

    // Pick intensity level based on distribution
    const roll = random();
    let targetLevel = normalizedThresholds[normalizedThresholds.length - 1]?.level ?? 1;
    for (const threshold of normalizedThresholds) {
      if (roll <= threshold.cumulative) {
        targetLevel = threshold.level;
        break;
      }
    }

    // Pick a card from the target level
    const levelPool = byIntensity[targetLevel];
    if (!levelPool || levelPool.length === 0) {
      // Fallback: pick from any available level
      const allAvailable = pool.filter((c) => !usedIds.has(c.id));
      if (allAvailable.length === 0) break;
      const card = allAvailable[Math.floor(random() * allAvailable.length)];
      if (!usedIds.has(card.id)) {
        selected.push(card);
        usedIds.add(card.id);
      }
      continue;
    }

    // Pick random card from level, avoiding duplicates
    const available = levelPool.filter((c) => !usedIds.has(c.id));
    if (available.length === 0) {
      // This level is exhausted, try from all remaining
      const allAvailable = pool.filter((c) => !usedIds.has(c.id));
      if (allAvailable.length === 0) break;
      const card = allAvailable[Math.floor(random() * allAvailable.length)];
      selected.push(card);
      usedIds.add(card.id);
      continue;
    }

    const card = available[Math.floor(random() * available.length)];
    selected.push(card);
    usedIds.add(card.id);
  }

  return selected;
}

// ─── Main Builder Function ───────────────────────────────────────────────────

/**
 * Builds a shuffled card queue based on game configuration.
 * Pure function — no side effects, no network calls.
 * Requires the full card library to be passed in.
 */
export function buildCardQueue(
  config: CardQueueConfig,
  cardLibrary: QueuedCard[]
): CardQueue {
  const { gameMode, cardCountTarget, comfortFilters, trashedCardIds } = config;
  const modeConfig = GAME_MODES[gameMode];

  // Step 1: Filter the card library
  const comfortFilterSet = new Set(comfortFilters.map((f) => f.toLowerCase()));
  const trashedIdSet = new Set(trashedCardIds);

  let filteredCards = cardLibrary.filter((card) => {
    // Remove cards matching comfort filter topics
    if (card.topics.some((topic) => comfortFilterSet.has(topic.toLowerCase()))) {
      return false;
    }
    // Remove trashed cards
    if (trashedIdSet.has(card.id)) {
      return false;
    }
    return true;
  });

  // Step 2: For Family mode, additionally filter to only intensity <= 2 cards
  if (gameMode === 'family') {
    filteredCards = filteredCards.filter((card) => card.intensity <= 2);
  }

  // Step 3: Separate into question cards and action cards
  const questionCards = filteredCards.filter(
    (card) => card.cardType === 'question'
  );
  const actionCards = filteredCards.filter(
    (card) => card.cardType === 'action'
  );

  // Step 4: Calculate total needed
  const bufferCount = Math.ceil(cardCountTarget * 0.2);
  const totalNeeded = cardCountTarget + bufferCount;

  // Step 5: Calculate how many wild and action cards we need
  const { base: wildBase, variance: wildVariance } = modeConfig.wildCardFrequency;

  // Estimate wild card count: one every (base) cards on average
  const wildCardCount = Math.max(1, Math.floor(totalNeeded / wildBase));

  // Action cards: approximately 1 in every 8
  const actionCardCount = Math.min(
    actionCards.length,
    Math.max(1, Math.round(totalNeeded / 8))
  );

  // Question cards fill the remainder
  const questionCardCount = totalNeeded - wildCardCount - actionCardCount;

  // Step 6: Select question cards by weighted distribution
  const selectedQuestions = selectByDistribution(
    questionCards,
    Math.max(0, questionCardCount),
    modeConfig.poolDistribution
  );

  // Step 7: Select action cards (shuffle and pick)
  const shuffledActions = shuffle(actionCards);
  const selectedActions = shuffledActions.slice(0, actionCardCount);

  // Step 8: Generate wild cards
  const wildCards: QueuedCard[] = [];
  for (let i = 0; i < wildCardCount; i++) {
    wildCards.push(generateWildCard());
  }

  // Step 9: Build the queue with proper insertion logic
  // Combine question and action cards first
  const baseCards = shuffle([...selectedQuestions, ...selectedActions]);

  // Insert wild cards at proper intervals (base ± variance)
  const assembledQueue = insertWildCards(
    baseCards,
    wildCards,
    wildBase,
    wildVariance
  );

  // Step 10: Ensure we have exactly totalNeeded cards
  // Trim or pad as necessary
  let finalQueue: QueuedCard[];
  if (assembledQueue.length >= totalNeeded) {
    finalQueue = assembledQueue.slice(0, totalNeeded);
  } else {
    // If not enough cards, use what we have
    finalQueue = assembledQueue;
  }

  // Step 11: Split into main queue and buffer
  const mainQueue = finalQueue.slice(0, cardCountTarget);
  const buffer = finalQueue.slice(cardCountTarget, cardCountTarget + bufferCount);

  return {
    cards: mainQueue,
    buffer: buffer,
  };
}

/**
 * Inserts wild cards into the base card queue at intervals
 * defined by base ± variance.
 */
function insertWildCards(
  baseCards: QueuedCard[],
  wildCards: QueuedCard[],
  base: number,
  variance: number,
  random: () => number = Math.random
): QueuedCard[] {
  if (wildCards.length === 0) return [...baseCards];

  const result: QueuedCard[] = [];
  let baseIndex = 0;
  let wildIndex = 0;

  // First wild card appears after (base ± variance) cards
  let nextWildAt = base + Math.floor(random() * (2 * variance + 1)) - variance;
  nextWildAt = Math.max(1, nextWildAt); // at least 1 card before first wild

  let cardsSinceLastWild = 0;

  while (baseIndex < baseCards.length || wildIndex < wildCards.length) {
    // Check if it's time to insert a wild card
    if (
      wildIndex < wildCards.length &&
      cardsSinceLastWild >= nextWildAt
    ) {
      result.push(wildCards[wildIndex]);
      wildIndex++;
      cardsSinceLastWild = 0;
      // Calculate next wild card interval
      nextWildAt = base + Math.floor(random() * (2 * variance + 1)) - variance;
      nextWildAt = Math.max(1, nextWildAt);
    } else if (baseIndex < baseCards.length) {
      result.push(baseCards[baseIndex]);
      baseIndex++;
      cardsSinceLastWild++;
    } else {
      // No more base cards, append remaining wilds
      if (wildIndex < wildCards.length) {
        result.push(wildCards[wildIndex]);
        wildIndex++;
      }
    }
  }

  return result;
}
