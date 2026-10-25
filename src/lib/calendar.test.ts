import { describe, expect, it } from 'vitest';
import { monthCells } from './calendar';

describe('monthCells', () => {
  it('pads to the weekday of the 1st and counts the days', () => {
    const c = monthCells(2026, 9); // October 2026 starts on a Thursday
    expect(c.slice(0, 5)).toEqual([null, null, null, null, 1]);
    expect(c.filter((x) => x !== null)).toHaveLength(31);
  });
  it('handles leap years', () => {
    expect(monthCells(2024, 1).filter((x) => x !== null)).toHaveLength(29);
    expect(monthCells(2025, 1).filter((x) => x !== null)).toHaveLength(28);
  });
});
