import { describe, expect, it } from 'vitest';
import { buildStack, dedupeCards, makeWilds } from '@/lib/game/card-queue-builder';
import type { QueuedCard } from '@/lib/game/escalation-engine';

const card = (i: number, extra: Partial<QueuedCard> = {}): QueuedCard => ({
  id: `c${i}`, text: `Tell tok${i}a about mark${i}b while unique${i}c nearby word${i}d`, cardType: 'question', intensity: 1 + (i % 5), category: 'hot_takes', topics: [], ...extra,
});
const pool = (n: number) => Array.from({ length: n }, (_, i) => card(i));
const base = { comfortFilters: [] as string[], trashedCardIds: [] as string[], playerCount: 4, fitPlayers: false };
const real = (q: QueuedCard[]) => q.filter((c) => c.cardType !== 'wild');

describe('buildStack', () => {
  it('gives exactly as many cards as the pot pays for, none twice', () => {
    const q = buildStack({ ...base, pool: pool(60), count: 40 });
    const ids = real(q.cards).map((c) => c.id);
    expect(ids).toHaveLength(40);
    expect(new Set(ids).size).toBe(40);
  });
  it('shuffles again when the pot pays for more cards than exist, and no card repeats before all have shown', () => {
    const q = buildStack({ ...base, pool: pool(10), count: 25 });
    const ids = real(q.cards).map((c) => c.id);
    expect(ids).toHaveLength(25);
    expect(new Set(ids.slice(0, 10)).size).toBe(10);
    expect(new Set(ids.slice(10, 20)).size).toBe(10);
  });
  it('leaves out filtered topics and trashed cards', () => {
    const cards = [...pool(20).slice(0, 18), card(98, { topics: ['money'] }), card(99, { topics: ['money'] })];
    const q = buildStack({ ...base, pool: cards, count: 10, comfortFilters: ['Money/Finances'], trashedCardIds: ['c0'] });
    const ids = [...q.cards, ...q.buffer].map((c) => c.id);
    expect(ids).not.toContain('c98');
    expect(ids).not.toContain('c0');
  });
  it('uses unseen cards first when asked (more cards)', () => {
    const seen = pool(30).slice(0, 20).map((c) => c.id);
    const q = buildStack({ ...base, pool: pool(30), count: 10, avoid: seen });
    real(q.cards).forEach((c) => expect(seen).not.toContain(c.id));
  });
  it('returns nothing when no card is eligible', () => {
    expect(buildStack({ ...base, pool: [], count: 10 }).cards).toHaveLength(0);
  });
});

describe('dedupeCards', () => {
  it('drops the same id, the same text and near copies', () => {
    const a = card(1, { text: 'Roll the die. Your number decides your fate.' });
    const b = card(2, { text: 'Roll the die. Your number decides.' });
    const c = card(1, { text: 'Anything else' });
    expect(dedupeCards([a, b, c]).map((x) => x.id)).toEqual(['c1']);
  });
  it('keeps cards that only look alike', () => {
    const a = card(1, { text: 'Never have I ever had sex in a car. Everyone who has must {drink}.' });
    const b = card(2, { text: 'Never have I ever had a threesome. Everyone who has must {drink}.' });
    expect(dedupeCards([a, b])).toHaveLength(2);
  });
});

describe('makeWilds', () => {
  it('never repeats a kind back to back and uses every kind before repeating', () => {
    const w = makeWilds(12).map((c) => c.wildCardType);
    for (let i = 1; i < w.length; i++) expect(w[i]).not.toBe(w[i - 1]);
    const first = new Set(w.slice(0, 4));
    expect(first.size).toBe(4);
  });
});
