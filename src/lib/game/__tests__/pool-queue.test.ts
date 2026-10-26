import { describe, it, expect } from 'vitest';
import { buildPoolQueue } from '../card-queue-builder';
import { cardCost } from '../pot';
import type { QueuedCard } from '../escalation-engine';

const card = (i: number): QueuedCard => ({ id: `own-${i}`, text: `Question ${i}`, cardType: 'question', intensity: 2, category: 'hot_takes', topics: [] } as QueuedCard);
const opts = { comfortFilters: [], trashedCardIds: [], playerCount: 3 };

describe('buildPoolQueue (own stacks, liked cards, packs)', () => {
  it('uses only cards from the pool, never twice, plus free wild cards', () => {
    const pool = Array.from({ length: 12 }, (_, i) => card(i));
    const q = buildPoolQueue({ pool, count: 10, ...opts });
    const real = q.cards.filter((c) => c.cardType !== 'wild');
    expect(real.length).toBe(10);
    expect(new Set(real.map((c) => c.id)).size).toBe(10);
    expect(real.every((c) => c.id.startsWith('own-'))).toBe(true);
    expect(q.cards.some((c) => c.cardType === 'wild')).toBe(true);
    expect(real.reduce((a, c) => a + cardCost(c), 0)).toBe(10);
  });
  it('a small stack is shuffled again, so the pot still pays for every card', () => {
    const q = buildPoolQueue({ pool: Array.from({ length: 6 }, (_, i) => card(i)), count: 30, ...opts });
    expect(q.cards.filter((c) => c.cardType !== 'wild').length).toBe(30);
  });
  it('leaves trashed cards out', () => {
    const pool = Array.from({ length: 12 }, (_, i) => card(i));
    const q = buildPoolQueue({ pool, count: 10, ...opts, trashedCardIds: ['own-0', 'own-1'] });
    expect([...q.cards, ...q.buffer].some((c) => c.id === 'own-0' || c.id === 'own-1')).toBe(false);
  });
});
