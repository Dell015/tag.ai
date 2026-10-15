import { describe, it, expect } from 'vitest';
import { cardCost, averageCardCost, estimateCards, suggestedPot, potTotal, isPotValid, isLow, formatPot, round3, MIN_POT } from '../pot';

describe('cardCost', () => {
  it('maps intensity and type to the plan table', () => {
    expect(cardCost({ cardType: 'question', intensity: 1 })).toBeCloseTo(1 / 15);
    expect(cardCost({ cardType: 'question', intensity: 2 })).toBeCloseTo(0.1);
    expect(cardCost({ cardType: 'question', intensity: 3 })).toBeCloseTo(0.1);
    expect(cardCost({ cardType: 'question', intensity: 4 })).toBeCloseTo(1 / 6);
    expect(cardCost({ cardType: 'question', intensity: 5 })).toBeCloseTo(0.25);
    expect(cardCost({ cardType: 'action', intensity: 3 })).toBeCloseTo(0.2);
  });
  it('wild cards are free', () => {
    expect(cardCost({ cardType: 'wild', intensity: 5 })).toBe(0);
  });
});

describe('estimates', () => {
  it('average cost sits between casual and deep', () => {
    for (const m of ['icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family'] as const) {
      const a = averageCardCost(m);
      expect(a).toBeGreaterThan(1 / 15 - 1e-9);
      expect(a).toBeLessThan(0.25 + 1e-9);
    }
  });
  it('spicy decks cost more than icebreaker decks', () => {
    expect(averageCardCost('spicy')).toBeGreaterThan(averageCardCost('icebreaker'));
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
  it('minimum is 3', () => {
    expect(isPotValid(2)).toBe(false);
    expect(isPotValid(3)).toBe(true);
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
