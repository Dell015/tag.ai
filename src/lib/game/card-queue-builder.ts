/**
 * Card Queue Builder — Pure function for constructing the game card queue.
 *
 * Builds a shuffled card queue based on game configuration including:
 * - Comfort filter topic exclusion
 * - Trashed card exclusion
 * - Game mode intensity distribution
 * - Wild card insertion at configured frequency
 * - Action card insertion at ~1 in every 5 cards
 * - Main queue (cardCountTarget) + buffer (20% extra)
 *
 * This function is pure — no side effects, no network calls.
 */

import { GameMode, WildCardType } from '@/types/game';
import { QueuedCard } from './escalation-engine';
import { fitsPlayers } from './players-needed';
import { GAME_MODES, blendModes } from './game-modes';
import { expandComfortFilters, isCardFiltered } from './comfort-filters';
import { kindOf } from './card-kinds';
import { DECKS, deckOf, deckPool, basketCards, type Basket } from './decks';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CardQueueConfig {
  gameMode: GameMode;
  /** More decks mixed with the main one (never Family). */
  extraModes?: GameMode[];
  cardCountTarget: number;
  comfortFilters: string[];
  trashedCardIds: string[]; // current user's trashed cards
  playerCount: number;
  /** Drop cards that need more (or fewer) people than are playing. On by default; off for your own decks. */
  fitPlayers?: boolean;
  /** Leave wild cards out (the basket builder adds them once for the whole game). */
  noWild?: boolean;
}

export interface CardQueue {
  cards: QueuedCard[]; // Main queue (card_count_target items)
  buffer: QueuedCard[]; // 20% extra for trash replacements
}

// ─── Wild Card Types Pool ────────────────────────────────────────────────────

const WILD_CARD_TYPES: WildCardType[] = ['call_out', 'voice_note', 'lucky_roll', 'double_or_nothing'];

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

let wildCounter = 0;

/** Unique id for a generated wild card (UUID when available, counter fallback). */
function nextWildId(): string {
  wildCounter += 1;
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null;
  return `wild-${uuid ?? `${Date.now().toString(36)}-${wildCounter}`}`;
}

/**
 * Generates a wild card placeholder with a random type.
 */
function generateWildCard(random: () => number = Math.random): QueuedCard {
  const typeIndex = Math.floor(random() * WILD_CARD_TYPES.length);
  const wildType = WILD_CARD_TYPES[typeIndex];

  return {
    id: nextWildId(),
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
  const modeConfig = config.extraModes?.length ? blendModes([gameMode, ...config.extraModes]) : GAME_MODES[gameMode];

  // Step 1: Filter the card library
  const expandedFilters = expandComfortFilters(comfortFilters);
  const trashedIdSet = new Set(trashedCardIds);

  let filteredCards = cardLibrary.filter((card) => {
    // Remove cards matching comfort filter topics
    if (isCardFiltered(card, expandedFilters)) {
      return false;
    }
    // Remove trashed cards
    if (trashedIdSet.has(card.id)) {
      return false;
    }
    // Remove cards that do not fit the number of people at the table
    if (config.fitPlayers !== false && config.playerCount > 0 && !fitsPlayers(card, config.playerCount)) {
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
  const wildCardCount = config.noWild ? 0 : Math.max(1, Math.floor(totalNeeded / wildBase));

  // Action cards: approximately 1 in every 5 (dares and tool cards)
  const actionCardCount = Math.min(
    actionCards.length,
    Math.max(1, Math.round(totalNeeded / 5))
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


/**
 * Mixes cards so the table does not get a run of the same deck, type or category. Each pick is
 * the card least like the last two, chosen from a random window of what is left.
 */
export function spreadOut(cards: QueuedCard[], random: () => number = Math.random): QueuedCard[] {
  const left = shuffle(cards, random);
  const out: QueuedCard[] = [];
  const count: Record<string, number> = {};
  for (const c of left) count[c.category] = (count[c.category] ?? 0) + 1;
  const like = (a: QueuedCard | undefined, b: QueuedCard) => (a ? (a.deckId === b.deckId ? 2 : 0) + (kindOf(a) === kindOf(b) ? 1 : 0) + (a.category === b.category ? 2 : 0) : 0);
  while (left.length) {
    const p1 = out[out.length - 1];
    const p2 = out[out.length - 2];
    let best = 0;
    let bestScore = Infinity;
    for (let i = 0; i < left.length; i++) {
      const c = left[i];
      // Least like the last two cards; the biggest remaining group goes first so it is never stranded at the end.
      const score = like(p1, c) * 10 + like(p2, c) * 3 - count[c.category] * 0.6 + random() * 2;
      if (score < bestScore) { best = i; bestScore = score; }
    }
    const [pick] = left.splice(best, 1);
    count[pick.category] -= 1;
    out.push(pick);
  }
  return out;
}

// ─── Basket builder: cards bought per deck ───────────────────────────────────

export interface BasketQueueConfig {
  basket: Basket;
  comfortFilters: string[];
  trashedCardIds: string[];
  playerCount: number;
  fitPlayers?: boolean;
}

export interface BasketQueue extends CardQueue {
  /** Deck modes that were used, for heat and wild card pacing. */
  modes: GameMode[];
  /** Cards the basket asked for versus what the pools could give. */
  asked: number;
  /** Total length of the game including free wild cards. */
  target: number;
}

/**
 * Builds a queue from what was bought: N cards from each deck, no card twice, then free wild cards
 * mixed in. Chaos is drawn last so it only fills with cards the other decks did not take.
 */
export function buildBasketQueue(config: BasketQueueConfig, library: QueuedCard[]): BasketQueue {
  const used = new Set<string>();
  const order = [...DECKS.filter((d) => d.id !== 'chaos'), ...DECKS.filter((d) => d.id === 'chaos')];
  const cards: QueuedCard[] = [];
  const buffer: QueuedCard[] = [];
  const modes: GameMode[] = [];

  for (const deck of order) {
    const n = Math.max(0, config.basket[deck.id] ?? 0);
    if (n === 0 || !deck.ready) continue;
    const pool = deckPool(deck, library).filter((c) => !used.has(c.id));
    const built = buildCardQueue(
      { gameMode: deck.mode, cardCountTarget: n, comfortFilters: config.comfortFilters, trashedCardIds: config.trashedCardIds, playerCount: config.playerCount, fitPlayers: config.fitPlayers, noWild: true },
      pool,
    );
    if (built.cards.length === 0) continue;
    modes.push(deck.mode);
    const tag = (c: QueuedCard): QueuedCard => ({ ...c, deckId: deck.id });
    built.cards.forEach((c) => { used.add(c.id); cards.push(tag(c)); });
    built.buffer.forEach((c) => { used.add(c.id); buffer.push(tag(c)); });
  }

  const mix = blendModes(modes.length ? modes : ['barkada']);
  const base = spreadOut(cards);
  const wildCount = base.length === 0 ? 0 : Math.max(1, Math.floor(base.length / mix.wildCardFrequency.base));
  const wilds = Array.from({ length: wildCount }, () => generateWildCard());
  const queue = insertWildCards(base, wilds, mix.wildCardFrequency.base, mix.wildCardFrequency.variance);
  return { cards: queue, buffer: shuffle(buffer), modes, asked: basketCards(config.basket), target: queue.length };
}

/** The game mode that rules heat for a basket: Family only when it is the only deck. */
export function modeForBasket(basket: Basket): GameMode {
  const ids = Object.entries(basket).filter(([, n]) => (n ?? 0) > 0).map(([id]) => id);
  if (ids.length === 1 && deckOf(ids[0])) return deckOf(ids[0])!.mode;
  const first = ids.map((id) => deckOf(id)?.mode).find((m) => m && m !== 'family');
  return first ?? 'barkada';
}
