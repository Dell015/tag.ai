import { describe, it, expect } from 'vitest';
import { cardCost, averageCardCost, estimateCards, suggestedPot, potTotal, isPotValid, isLow, formatPot, round3, MIN_POT } from '../pot';

describe('cardCost', () => {
  it('every real card costs 1 coin', () => {
    for (const intensity of [1, 2, 3, 4, 5]) expect(cardCost({ cardType: 'question', intensity })).toBe(1);
    expect(cardCost({ cardType: 'action', intensity: 3 })).toBe(1);
  });
  it('wild cards are free', () => {
    expect(cardCost({ cardType: 'wild', intensity: 5 })).toBe(0);
  });
});

describe('estimates', () => {
  it('every deck averages 1 coin a card', () => {
    for (const m of ['icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family'] as const) expect(averageCardCost(m)).toBe(1);
  });
  it('estimate and suggestion agree', () => {
    const need = suggestedPot(20, 'barkada');
    expect(need).toBeGreaterThanOrEqual(MIN_POT);
    expect(estimateCards(need, 'barkada')).toBeGreaterThanOrEqual(20);
  });
});

describe('pot rules', () => {
  it('split multiplies by players', () => {
    expect(potTotal('solo', 6, 4)).toBe(6);
    expect(potTotal('split', 2, 4)).toBe(8);
  });
  it('minimum is 10', () => {
    expect(isPotValid(9)).toBe(false);
    expect(isPotValid(10)).toBe(true);
  });
  it('low at 20 percent', () => {
    expect(isLow(1.2, 6)).toBe(true);
    expect(isLow(1.3, 6)).toBe(false);
    expect(isLow(0, 6)).toBe(false);
  });
  it('formats cleanly', () => {
    expect(formatPot(6)).toBe('6');
    expect(formatPot(5.94)).toBe('5.9');
    expect(round3(0.1 + 0.2)).toBe(0.3);
  });
});

describe('chip in and cash owed', () => {
  it('adds up what each person puts in', () => {
    expect(potTotal('chipin', 0, 3, [5, 2, 3])).toBe(10);
    expect(potTotal('chipin', 0, 3, [])).toBe(0);
  });
  it('lists what friends owe the host, never the host', async () => {
    const { owedByPlayer, returnShares, plannedCards } = await import('../pot');
    const players = [{ userId: 'h' }, { userId: 'a', isGuest: true }, { userId: 'b', isGuest: true }];
    expect(owedByPlayer('solo', 6, players, 'h')).toEqual([]);
    expect(owedByPlayer('split', 4, players, 'h')).toEqual([{ userId: 'a', pesos: 4 }, { userId: 'b', pesos: 4 }]);
    const o = owedByPlayer('chipin', 0, players, 'h', { h: 5, a: 3, b: 2 });
    expect(o).toEqual([{ userId: 'a', pesos: 3 }, { userId: 'b', pesos: 2 }]);
    expect(returnShares(o, 10, 5)).toEqual([{ userId: 'a', pesos: 1.5 }, { userId: 'b', pesos: 1 }]);
    expect(plannedCards(0.2, ['barkada'])).toBe(5);
    expect(plannedCards(500, ['barkada'])).toBe(100);
  });
});
