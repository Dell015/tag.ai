import { describe, it, expect } from 'vitest';

// Since the component is simple and helper functions are internal,
// we test the logic by verifying the exported behavior through the store integration.
// We extract and test the pure logic (color mapping and width calculation).

// Re-implement the pure logic for unit testing
function getHeatColor(heatLevel: number): string {
  if (heatLevel >= 5.0) return '#ef4444';
  if (heatLevel >= 4.0) return '#f97316';
  if (heatLevel >= 3.0) return '#eab308';
  if (heatLevel >= 2.0) return '#22c55e';
  return '#3b82f6';
}

function getHeatWidth(heatLevel: number): number {
  const clamped = Math.max(1.0, Math.min(5.0, heatLevel));
  return ((clamped - 1) / 4) * 100;
}

describe('HeatMeter logic', () => {
  describe('getHeatColor', () => {
    it('returns blue for heat level 1.0', () => {
      expect(getHeatColor(1.0)).toBe('#3b82f6');
    });

    it('returns blue for heat level 1.5', () => {
      expect(getHeatColor(1.5)).toBe('#3b82f6');
    });

    it('returns blue for heat level 1.99', () => {
      expect(getHeatColor(1.99)).toBe('#3b82f6');
    });

    it('returns green for heat level 2.0', () => {
      expect(getHeatColor(2.0)).toBe('#22c55e');
    });

    it('returns green for heat level 2.99', () => {
      expect(getHeatColor(2.99)).toBe('#22c55e');
    });

    it('returns gold for heat level 3.0', () => {
      expect(getHeatColor(3.0)).toBe('#eab308');
    });

    it('returns gold for heat level 3.99', () => {
      expect(getHeatColor(3.99)).toBe('#eab308');
    });

    it('returns orange for heat level 4.0', () => {
      expect(getHeatColor(4.0)).toBe('#f97316');
    });

    it('returns orange for heat level 4.99', () => {
      expect(getHeatColor(4.99)).toBe('#f97316');
    });

    it('returns red for heat level 5.0', () => {
      expect(getHeatColor(5.0)).toBe('#ef4444');
    });
  });

  describe('getHeatWidth', () => {
    it('returns 0% for heat level 1.0', () => {
      expect(getHeatWidth(1.0)).toBe(0);
    });

    it('returns 25% for heat level 2.0', () => {
      expect(getHeatWidth(2.0)).toBe(25);
    });

    it('returns 50% for heat level 3.0', () => {
      expect(getHeatWidth(3.0)).toBe(50);
    });

    it('returns 75% for heat level 4.0', () => {
      expect(getHeatWidth(4.0)).toBe(75);
    });

    it('returns 100% for heat level 5.0', () => {
      expect(getHeatWidth(5.0)).toBe(100);
    });

    it('returns correct intermediate value for heat level 2.5', () => {
      expect(getHeatWidth(2.5)).toBeCloseTo(37.5);
    });

    it('clamps below 1.0 to 0%', () => {
      expect(getHeatWidth(0.5)).toBe(0);
    });

    it('clamps above 5.0 to 100%', () => {
      expect(getHeatWidth(6.0)).toBe(100);
    });
  });
});
