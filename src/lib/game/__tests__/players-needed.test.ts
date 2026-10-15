import { describe, expect, it } from 'vitest';
import { fitsPlayers, peopleLabel, playersNeeded } from '../players-needed';
import { autoPool, findCard, ownedPackCards } from '@/lib/data/card-pool';

describe('players needed', () => {
  it('reads group size from wording', () => {
    expect(playersNeeded({ text: 'Who in this room is the worst driver?' }).min).toBe(3);
    expect(playersNeeded({ text: 'Which two people here would make the best couple?' }).min).toBe(4);
    expect(playersNeeded({ text: 'Tell the person on your left a secret.' }).min).toBe(2);
    expect(playersNeeded({ text: 'What is your favourite food?' })).toEqual({ min: 2, max: null });
  });
  it('lets a card set its own size', () => {
    const c = { text: 'Anything', people: { min: 2, max: 2 } };
    expect(fitsPlayers(c, 2)).toBe(true);
    expect(fitsPlayers(c, 3)).toBe(false);
    expect(peopleLabel(c)).toBe('Just 2 people');
  });
  it('only labels cards that need a bigger group', () => {
    expect(peopleLabel({ text: 'Who here snores?' })).toBe('3+ people');
    expect(peopleLabel({ text: 'Favourite song?' })).toBeNull();
  });
});

describe('18+ cards stay out when the setting is off', () => {
  it('hides adult cards and adult packs', () => {
    expect(autoPool([], false).some((c) => c.adult)).toBe(false);
    expect(autoPool([], true).some((c) => c.adult)).toBe(true);
    expect(ownedPackCards(['pack-afterdark'], false)).toHaveLength(0);
    expect(ownedPackCards(['pack-afterdark'], true).length).toBeGreaterThan(0);
    expect(findCard('adult-001', false)).toBeUndefined();
    expect(findCard('adult-001', true)).toBeDefined();
  });
});
