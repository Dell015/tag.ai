import { describe, expect, it } from 'vitest';
import { GAME_MODES, blendModes } from '../game-modes';

describe('blendModes', () => {
  it('returns the single mode unchanged', () => {
    expect(blendModes(['spicy'])).toBe(GAME_MODES.spicy);
  });
  it('averages pool weights of mixed decks and keeps them summing near 100', () => {
    const b = blendModes(['icebreaker', 'spicy']);
    expect(b.poolDistribution[1]).toBe(Math.round((40 + 5) / 2));
    const sum = Object.values(b.poolDistribution).reduce((a, n) => a + n, 0);
    expect(sum).toBeGreaterThanOrEqual(98);
    expect(sum).toBeLessThanOrEqual(102);
    expect(b.name).toBe('Icebreaker + Spicy');
  });
  it('drops family when mixed with others', () => {
    expect(blendModes(['family', 'chaos'])).toBe(GAME_MODES.chaos);
  });
});
