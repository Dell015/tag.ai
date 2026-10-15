import { describe, it, expect } from 'vitest';
import { wildDescription, WILD_CARD_DEFINITIONS } from '../wild-cards';
import { ruleLine } from '../setup-options';

describe('wild card copy', () => {
  it('swaps drinks for forfeits in non-drinking mode', () => {
    expect(wildDescription('free_drink', false)).toContain('Everyone drinks');
    expect(wildDescription('free_drink', true)).toContain('forfeit');
    expect(wildDescription('crown', true)).toContain('forfeit');
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
