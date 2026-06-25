import { describe, it, expect } from 'vitest';
import { calculateHeat, heatToIntensityLevel, QueuedCard } from '../escalation-engine';
import { buildCardQueue, CardQueueConfig } from '../card-queue-builder';
import { advanceTurn, getCurrentPlayer, getNextPlayer, TurnState } from '../turn-rotation';
import {
  applyShuffleWildCard,
  applyHeatSpike,
  decrementHeatSpike,
  decrementCrownImmunity,
  hasCrownImmunity,
} from '../wild-cards';
import { validateUsername, generateRoomCode, validateCardCount } from '../../validators';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<QueuedCard> = {}): QueuedCard {
  return {
    id: overrides.id ?? `card-${Math.random()}`,
    text: overrides.text ?? 'Test card',
    cardType: overrides.cardType ?? 'question',
    intensity: overrides.intensity ?? 3,
    category: overrides.category ?? 'hot_takes',
    topics: overrides.topics ?? [],
    ...overrides,
  };
}

function makeCardLibrary(count: number): QueuedCard[] {
  return Array.from({ length: count }, (_, i) => makeCard({
    id: `card-${i}`,
    text: `Card ${i}`,
    intensity: (i % 5) + 1,
    cardType: i % 8 === 0 ? 'action' : 'question',
    category: 'hot_takes',
    topics: i % 10 === 0 ? ['nsfw'] : [],
  }));
}

// ─── Escalation Engine Tests ─────────────────────────────────────────────────

describe('calculateHeat', () => {
  it('increases heat by 0.3 on dismiss', () => {
    const result = calculateHeat({
      currentHeat: 2.0,
      event: 'dismiss',
      consecutiveSkips: 0,
      gameMode: 'barkada',
    });
    expect(result.newHeat).toBeCloseTo(2.3);
  });

  it('increases heat by 0.5 on heart', () => {
    const result = calculateHeat({
      currentHeat: 2.0,
      event: 'heart',
      consecutiveSkips: 0,
      gameMode: 'barkada',
    });
    expect(result.newHeat).toBeCloseTo(2.5);
  });

  it('decreases heat by 0.2 on skip (< 3 consecutive)', () => {
    const result = calculateHeat({
      currentHeat: 3.0,
      event: 'skip',
      consecutiveSkips: 1,
      gameMode: 'barkada',
    });
    expect(result.newHeat).toBeCloseTo(2.8);
  });

  it('drops heat by 1.0 on 3 consecutive skips', () => {
    const result = calculateHeat({
      currentHeat: 4.0,
      event: 'skip',
      consecutiveSkips: 3,
      gameMode: 'barkada',
    });
    expect(result.newHeat).toBeCloseTo(3.0);
  });

  it('clamps heat at 5.0 maximum', () => {
    const result = calculateHeat({
      currentHeat: 4.9,
      event: 'heart',
      consecutiveSkips: 0,
      gameMode: 'spicy',
    });
    expect(result.newHeat).toBe(5.0);
  });

  it('clamps heat at 1.0 minimum', () => {
    const result = calculateHeat({
      currentHeat: 1.0,
      event: 'skip',
      consecutiveSkips: 3,
      gameMode: 'barkada',
    });
    expect(result.newHeat).toBe(1.0);
  });

  it('caps heat at 2.0 in family mode', () => {
    const result = calculateHeat({
      currentHeat: 1.8,
      event: 'heart',
      consecutiveSkips: 0,
      gameMode: 'family',
    });
    expect(result.newHeat).toBe(2.0);
  });

  it('increases heat by 0.5 on wild_card', () => {
    const result = calculateHeat({
      currentHeat: 2.0,
      event: 'wild_card',
      consecutiveSkips: 0,
      gameMode: 'barkada',
    });
    expect(result.newHeat).toBeCloseTo(2.5);
  });
});

describe('heatToIntensityLevel', () => {
  it('maps 1.0 to level 1', () => {
    expect(heatToIntensityLevel(1.0)).toBe(1);
  });

  it('maps 2.7 to level 2', () => {
    expect(heatToIntensityLevel(2.7)).toBe(2);
  });

  it('maps 5.0 to level 5', () => {
    expect(heatToIntensityLevel(5.0)).toBe(5);
  });
});

// ─── Card Queue Builder Tests ────────────────────────────────────────────────

describe('buildCardQueue', () => {
  const config: CardQueueConfig = {
    gameMode: 'barkada',
    cardCountTarget: 20,
    comfortFilters: [],
    trashedCardIds: [],
    playerCount: 4,
  };

  it('returns main queue with cardCountTarget length', () => {
    const library = makeCardLibrary(100);
    const result = buildCardQueue(config, library);
    expect(result.cards.length).toBe(20);
  });

  it('returns buffer with ~20% of cardCountTarget', () => {
    const library = makeCardLibrary(100);
    const result = buildCardQueue(config, library);
    expect(result.buffer.length).toBe(Math.ceil(20 * 0.2));
  });

  it('excludes cards matching comfort filters', () => {
    const library = makeCardLibrary(100);
    const filteredConfig: CardQueueConfig = {
      ...config,
      comfortFilters: ['nsfw'],
    };
    const result = buildCardQueue(filteredConfig, library);
    const allCards = [...result.cards, ...result.buffer];
    const hasNsfw = allCards.some(c => c.topics.includes('nsfw'));
    expect(hasNsfw).toBe(false);
  });

  it('excludes trashed card IDs', () => {
    const library = makeCardLibrary(100);
    const trashedConfig: CardQueueConfig = {
      ...config,
      trashedCardIds: ['card-0', 'card-1', 'card-2'],
    };
    const result = buildCardQueue(trashedConfig, library);
    const allCards = [...result.cards, ...result.buffer];
    const hasTrashed = allCards.some(c => ['card-0', 'card-1', 'card-2'].includes(c.id));
    expect(hasTrashed).toBe(false);
  });
});

// ─── Turn Rotation Tests ─────────────────────────────────────────────────────

describe('advanceTurn', () => {
  const players = [
    { id: '1', name: 'Alice', avatarUrl: '', turnOrder: 0 },
    { id: '2', name: 'Bob', avatarUrl: '', turnOrder: 1 },
    { id: '3', name: 'Charlie', avatarUrl: '', turnOrder: 2 },
  ];

  it('advances from index 0 to 1', () => {
    const state: TurnState = { players, currentIndex: 0 };
    const next = advanceTurn(state);
    expect(next.currentIndex).toBe(1);
  });

  it('wraps from last player back to first', () => {
    const state: TurnState = { players, currentIndex: 2 };
    const next = advanceTurn(state);
    expect(next.currentIndex).toBe(0);
  });

  it('cycles through all players correctly', () => {
    let state: TurnState = { players, currentIndex: 0 };
    state = advanceTurn(state);
    expect(state.currentIndex).toBe(1);
    state = advanceTurn(state);
    expect(state.currentIndex).toBe(2);
    state = advanceTurn(state);
    expect(state.currentIndex).toBe(0);
  });
});

describe('getCurrentPlayer / getNextPlayer', () => {
  const players = [
    { id: '1', name: 'Alice', avatarUrl: '', turnOrder: 0 },
    { id: '2', name: 'Bob', avatarUrl: '', turnOrder: 1 },
    { id: '3', name: 'Charlie', avatarUrl: '', turnOrder: 2 },
  ];

  it('returns the current player at index', () => {
    const state: TurnState = { players, currentIndex: 1 };
    expect(getCurrentPlayer(state).name).toBe('Bob');
  });

  it('returns the next player (wrapping)', () => {
    const state: TurnState = { players, currentIndex: 2 };
    expect(getNextPlayer(state).name).toBe('Alice');
  });
});

// ─── Wild Cards Tests ────────────────────────────────────────────────────────

describe('wild card functions', () => {
  it('applyShuffleWildCard shuffles next 5 cards', () => {
    const queue: QueuedCard[] = Array.from({ length: 10 }, (_, i) =>
      makeCard({ id: `card-${i}` })
    );
    const result = applyShuffleWildCard(queue, 2);
    // Cards before and at index 2 are unchanged
    expect(result.slice(0, 3).map(c => c.id)).toEqual(['card-0', 'card-1', 'card-2']);
    // Cards after index 7 are unchanged
    expect(result.slice(8).map(c => c.id)).toEqual(['card-8', 'card-9']);
    // The shuffled section contains the same IDs (3-7)
    const shuffledIds = result.slice(3, 8).map(c => c.id).sort();
    expect(shuffledIds).toEqual(['card-3', 'card-4', 'card-5', 'card-6', 'card-7']);
  });

  it('applyHeatSpike increases heat by 1.0, capped at 5.0', () => {
    expect(applyHeatSpike(3.0)).toBe(4.0);
    expect(applyHeatSpike(4.5)).toBe(5.0);
    expect(applyHeatSpike(5.0)).toBe(5.0);
  });

  it('decrementHeatSpike decreases count correctly', () => {
    expect(decrementHeatSpike(3)).toBe(2);
    expect(decrementHeatSpike(1)).toBe(0);
    expect(decrementHeatSpike(0)).toBe(0);
  });

  it('decrementCrownImmunity decreases count correctly', () => {
    expect(decrementCrownImmunity(2)).toBe(1);
    expect(decrementCrownImmunity(1)).toBe(0);
    expect(decrementCrownImmunity(0)).toBe(0);
  });

  it('hasCrownImmunity checks immunity status', () => {
    expect(hasCrownImmunity(2)).toBe(true);
    expect(hasCrownImmunity(1)).toBe(true);
    expect(hasCrownImmunity(0)).toBe(false);
  });
});

// ─── Validators Tests ────────────────────────────────────────────────────────

describe('validateUsername', () => {
  it('accepts valid usernames', () => {
    expect(validateUsername('alice')).toBe(true);
    expect(validateUsername('Bob_123')).toBe(true);
    expect(validateUsername('abc')).toBe(true); // 3 chars min
    expect(validateUsername('a'.repeat(20))).toBe(true); // 20 chars max
  });

  it('rejects invalid usernames', () => {
    expect(validateUsername('ab')).toBe(false); // too short
    expect(validateUsername('a'.repeat(21))).toBe(false); // too long
    expect(validateUsername('hello world')).toBe(false); // spaces
    expect(validateUsername('user@name')).toBe(false); // special chars
    expect(validateUsername('')).toBe(false); // empty
  });
});

describe('validateCardCount', () => {
  it('accepts valid card counts', () => {
    expect(validateCardCount(5)).toBe(true);
    expect(validateCardCount(50)).toBe(true);
    expect(validateCardCount(100)).toBe(true);
  });

  it('rejects invalid card counts', () => {
    expect(validateCardCount(4)).toBe(false);
    expect(validateCardCount(101)).toBe(false);
    expect(validateCardCount(0)).toBe(false);
    expect(validateCardCount(-1)).toBe(false);
    expect(validateCardCount(10.5)).toBe(false); // non-integer
  });
});

describe('generateRoomCode', () => {
  it('returns a 6-character string', () => {
    const code = generateRoomCode();
    expect(code.length).toBe(6);
  });

  it('contains only uppercase letters and digits', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('generates different codes on subsequent calls', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateRoomCode()));
    // With 36^6 possibilities, 10 codes should all be unique
    expect(codes.size).toBe(10);
  });
});
