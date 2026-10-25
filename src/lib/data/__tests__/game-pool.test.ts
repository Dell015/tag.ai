import { describe, expect, it } from 'vitest';
import { picksPool } from '@/lib/data/game-pool';
import { buildLibrary } from '@/lib/data/start-game';

describe('picksPool', () => {
  it('keeps a card once when two decks hold it', () => {
    const lib = buildLibrary();
    const both = picksPool({ decks: ['barkada', 'spicy', 'chaos'], sources: [] }, lib);
    expect(new Set(both.map((c) => c.id)).size).toBe(both.length);
    expect(both.length).toBeGreaterThan(picksPool({ decks: ['barkada'], sources: [] }, lib).length);
  });
});
