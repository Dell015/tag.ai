import { describe, it, expect } from 'vitest';
import { wildDescription, WILD_CARD_DEFINITIONS } from '../wild-cards';
import { ruleLine } from '../setup-options';
import { fillDrink, penaltyText } from '../card-kinds';

describe('wild card copy', () => {
  it('swaps drinks for forfeits in non-drinking mode', () => {
    expect(fillDrink('Take {shot}. All {shots} double.', false)).toBe('Take a shot. All shots double.');
    expect(fillDrink('Take {shot}. All {shots} double.', true)).toBe('Take a forfeit. All forfeits double.');
    expect(penaltyText(3, false)).toBe('take 3 shots');
    expect(penaltyText(1, true)).toBe('do a forfeit');
  });
  it('every wild card is a one-off challenge with a penalty of 2 or 3 shots', () => {
    const defs = Object.values(WILD_CARD_DEFINITIONS);
    expect(defs).toHaveLength(5);
    defs.forEach((d) => { expect([2, 3]).toContain(d.penalty); expect(wildDescription(d.type, false)).not.toMatch(/\{(?!drink)|next \d+ cards|immun/i); });
  });
  it('has no em dashes or exclamation marks in any description', () => {
    Object.values(WILD_CARD_DEFINITIONS).forEach((d) => {
      expect(d.description).not.toMatch(/[—!]/);
    });
  });
});

describe('ruleLine', () => {
  it('names the template', () => expect(ruleLine('Chaos', false)).toBe('Chaos rules'));
  it('falls back to classic', () => expect(ruleLine(null, false)).toBe('Classic rules'));
  it('says forfeits when not drinking', () => expect(ruleLine('Chaos', true)).toBe('Forfeits instead of drinks'));
});
