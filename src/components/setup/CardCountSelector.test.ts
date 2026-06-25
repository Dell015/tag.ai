import { describe, it, expect, beforeEach } from 'vitest';
import { formatDuration, PRESET_COUNTS, SECONDS_PER_CARD } from './CardCountSelector';
import { useSessionStore } from '@/stores/session-store';
import { validateCardCount } from '@/lib/validators';

describe('CardCountSelector', () => {
  beforeEach(() => {
    useSessionStore.setState({ cardCountTarget: 20 });
  });

  describe('formatDuration', () => {
    it('returns ~5 min for 10 cards', () => {
      expect(formatDuration(10)).toBe('~5 min');
    });

    it('returns ~10 min for 20 cards', () => {
      expect(formatDuration(20)).toBe('~10 min');
    });

    it('returns ~15 min for 30 cards', () => {
      expect(formatDuration(30)).toBe('~15 min');
    });

    it('returns ~20 min for 40 cards', () => {
      expect(formatDuration(40)).toBe('~20 min');
    });

    it('returns ~25 min for 50 cards', () => {
      expect(formatDuration(50)).toBe('~25 min');
    });

    it('returns ~50 min for 100 cards', () => {
      expect(formatDuration(100)).toBe('~50 min');
    });

    it('returns ~3 min for 5 cards (minimum)', () => {
      expect(formatDuration(5)).toBe('~3 min');
    });
  });

  describe('PRESET_COUNTS', () => {
    it('contains 10, 20, 30, 40, 50', () => {
      expect([...PRESET_COUNTS]).toEqual([10, 20, 30, 40, 50]);
    });

    it('all presets pass card count validation', () => {
      for (const count of PRESET_COUNTS) {
        expect(validateCardCount(count)).toBe(true);
      }
    });
  });

  describe('SECONDS_PER_CARD', () => {
    it('is 30 seconds', () => {
      expect(SECONDS_PER_CARD).toBe(30);
    });
  });

  describe('session store integration', () => {
    it('updates cardCountTarget via setSession', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ cardCountTarget: 40 });
      expect(useSessionStore.getState().cardCountTarget).toBe(40);
    });

    it('accepts valid custom values in range 5-100', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ cardCountTarget: 5 });
      expect(useSessionStore.getState().cardCountTarget).toBe(5);

      setSession({ cardCountTarget: 100 });
      expect(useSessionStore.getState().cardCountTarget).toBe(100);

      setSession({ cardCountTarget: 42 });
      expect(useSessionStore.getState().cardCountTarget).toBe(42);
    });
  });
});
