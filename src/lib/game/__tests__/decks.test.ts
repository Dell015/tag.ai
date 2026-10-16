import { describe, expect, it } from 'vitest';
import { DECKS, DECK_BY_ID, basketHasAdult, basketCards, basketCost, basketNames, deckPool, sumBaskets } from '../decks';
import { buildBasketQueue, modeForBasket } from '../card-queue-builder';
import { cardCost, gameBasket, owedForBasket } from '../pot';
import { autoPool } from '@/lib/data/card-pool';

const library = autoPool([], true);
const opts = { comfortFilters: [], trashedCardIds: [], playerCount: 4 };

describe('deck prices', () => {
  const byPrice = [...DECKS].sort((a, b) => b.price - a.price);
  it('Chaos is the most expensive and Social media the second', () => {
    expect(byPrice[0].id).toBe('chaos');
    expect(byPrice[1].id).toBe('social');
  });
  it('every deck has a positive price', () => DECKS.forEach((d) => expect(d.price).toBeGreaterThan(0)));
});

describe('deck pools', () => {
  it('only Adult and Chaos hold adult cards, and Adult holds nothing else', () => {
    for (const d of DECKS) {
      const pool = deckPool(d, library);
      if (d.id === 'adult') expect(pool.every((c) => c.adult)).toBe(true);
      else if (d.id === 'chaos') expect(pool.some((c) => c.adult)).toBe(true);
      else expect(pool.some((c) => c.adult)).toBe(false);
    }
  });
  it('decks marked ready have cards, and the empty one is not ready', () => {
    DECKS.forEach((d) => expect(deckPool(d, library).length > 0).toBe(d.ready));
  });
  it('Family never holds anything above level 2', () => {
    expect(deckPool(DECK_BY_ID.family, library).every((c) => c.intensity <= 2)).toBe(true);
  });
});

describe('basket maths', () => {
  it('prices a basket per deck', () => {
    expect(basketCost({ icebreaker: 20, barkada: 10 })).toBeCloseTo(20 * 0.1 + 10 * 0.2, 5);
    expect(basketCards({ icebreaker: 20, barkada: 10 })).toBe(30);
  });
  it('adds baskets and names the biggest deck first', () => {
    expect(sumBaskets({ spicy: 5 }, { spicy: 10, adult: 5 })).toEqual({ spicy: 15, adult: 5 });
    expect(basketNames({ spicy: 5, adult: 10 })).toBe('Adult + Spicy');
  });
  it('chip in adds every personal basket, solo uses the shared one', () => {
    expect(gameBasket('solo', { barkada: 10 }, { a: { spicy: 5 } })).toEqual({ barkada: 10 });
    expect(gameBasket('chipin', { barkada: 10 }, { a: { spicy: 5 }, b: { spicy: 5, adult: 5 } })).toEqual({ spicy: 10, adult: 5 });
  });
  it('splits equally, or charges each player their own basket', () => {
    const players = [{ userId: 'h' }, { userId: 'a' }, { userId: 'b' }];
    expect(owedForBasket('solo', 6, players, 'h')).toEqual([]);
    expect(owedForBasket('split', 6, players, 'h')).toEqual([{ userId: 'a', pesos: 2 }, { userId: 'b', pesos: 2 }]);
    expect(owedForBasket('chipin', 0, players, 'h', { a: { barkada: 10 }, b: { spicy: 10 } })).toEqual([{ userId: 'a', pesos: 2 }, { userId: 'b', pesos: 3 }]);
  });
  it('a card costs its deck price, a wild card is free', () => {
    expect(cardCost({ cardType: 'question', intensity: 5, deckId: 'icebreaker' })).toBe(0.1);
    expect(cardCost({ cardType: 'question', intensity: 1, deckId: 'chaos' })).toBe(0.6);
    expect(cardCost({ cardType: 'wild', intensity: 0, deckId: 'chaos' })).toBe(0);
  });
});

describe('buildBasketQueue', () => {
  it('draws the bought cards from each deck, tags them and never repeats a card', () => {
    const q = buildBasketQueue({ ...opts, basket: { icebreaker: 10, barkada: 10, spicy: 10 } }, library);
    const real = q.cards.filter((c) => c.cardType !== 'wild');
    expect(new Set(real.map((c) => c.id)).size).toBe(real.length);
    expect(real.every((c) => !!c.deckId)).toBe(true);
    for (const id of ['icebreaker', 'barkada', 'spicy'] as const) {
      const got = real.filter((c) => c.deckId === id).length;
      expect(got).toBeGreaterThan(0);
      expect(got).toBeLessThanOrEqual(10);
    }
    expect(q.cards.some((c) => c.cardType === 'wild')).toBe(true);
    expect(q.cards.filter((c) => c.cardType === 'wild').every((c) => cardCost(c) === 0)).toBe(true);
  });
  it('keeps adult cards out unless Adult or Chaos is bought, and Chaos can draw them', () => {
    const plain = buildBasketQueue({ ...opts, basket: { barkada: 30, spicy: 20 } }, library);
    expect(plain.cards.some((c) => c.adult)).toBe(false);
    const chaos = buildBasketQueue({ ...opts, basket: { chaos: 150 } }, library);
    expect(chaos.cards.some((c) => c.adult)).toBe(true);
    expect(basketHasAdult({ chaos: 5 })).toBe(true);
    expect(basketHasAdult({ spicy: 5 })).toBe(false);
    const adult = buildBasketQueue({ ...opts, basket: { adult: 10 } }, library);
    const real = adult.cards.filter((c) => c.cardType !== 'wild');
    expect(real.length).toBeGreaterThan(0);
    expect(real.every((c) => c.adult && c.deckId === 'adult')).toBe(true);
  });
  it('skips filtered topics and never builds a deck that is not ready', () => {
    const q = buildBasketQueue({ ...opts, comfortFilters: ['Sexual Content'], basket: { adult: 10, social: 10 } }, library);
    expect(q.cards.filter((c) => c.cardType !== 'wild').some((c) => c.deckId === 'social')).toBe(false);
  });
  it('Family rules heat only when it is the only deck', () => {
    expect(modeForBasket({ family: 10 })).toBe('family');
    expect(modeForBasket({ family: 10, spicy: 10 })).toBe('spicy');
  });
});
