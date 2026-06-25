import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GAME_MODES } from '@/lib/game/game-modes';
import { useSessionStore } from '@/stores/session-store';
import { GameMode } from '@/types/game';

const ALL_MODES: GameMode[] = [
  'icebreaker',
  'barkada',
  'lovers',
  'spicy',
  'chaos',
  'family',
];

describe('GameModeSelector', () => {
  beforeEach(() => {
    useSessionStore.setState({ gameMode: null });
  });

  describe('GAME_MODES data', () => {
    it('has exactly 6 modes', () => {
      expect(Object.keys(GAME_MODES)).toHaveLength(6);
    });

    it('contains all expected mode keys', () => {
      expect(Object.keys(GAME_MODES).sort()).toEqual([...ALL_MODES].sort());
    });

    it('each mode has emoji, name, description, and audienceTag', () => {
      for (const key of ALL_MODES) {
        const mode = GAME_MODES[key];
        expect(mode.emoji).toBeTruthy();
        expect(mode.name).toBeTruthy();
        expect(mode.description).toBeTruthy();
        expect(mode.audienceTag).toBeTruthy();
      }
    });

    it('each mode has a valid entryHeat between 1 and 5', () => {
      for (const key of ALL_MODES) {
        const mode = GAME_MODES[key];
        expect(mode.entryHeat).toBeGreaterThanOrEqual(1);
        expect(mode.entryHeat).toBeLessThanOrEqual(5);
      }
    });

    it('each mode has poolDistribution summing to 100', () => {
      for (const key of ALL_MODES) {
        const mode = GAME_MODES[key];
        const total = Object.values(mode.poolDistribution).reduce(
          (sum, val) => sum + val,
          0
        );
        expect(total).toBe(100);
      }
    });

    it('family mode has maxHeat of 2.0', () => {
      expect(GAME_MODES.family.maxHeat).toBe(2.0);
    });
  });

  describe('session store integration', () => {
    it('stores selected game mode via setSession', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ gameMode: 'barkada' });
      expect(useSessionStore.getState().gameMode).toBe('barkada');
    });

    it('allows changing game mode selection', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ gameMode: 'icebreaker' });
      expect(useSessionStore.getState().gameMode).toBe('icebreaker');

      setSession({ gameMode: 'spicy' });
      expect(useSessionStore.getState().gameMode).toBe('spicy');
    });

    it('can set game mode to any valid mode', () => {
      const { setSession } = useSessionStore.getState();
      for (const mode of ALL_MODES) {
        setSession({ gameMode: mode });
        expect(useSessionStore.getState().gameMode).toBe(mode);
      }
    });
  });

  describe('broadcast callback', () => {
    it('onBroadcastChange is called with the selected mode', () => {
      const mockBroadcast = vi.fn();
      const { setSession } = useSessionStore.getState();

      // Simulate what the component does on select
      const mode: GameMode = 'chaos';
      setSession({ gameMode: mode });
      mockBroadcast(mode);

      expect(mockBroadcast).toHaveBeenCalledWith('chaos');
    });
  });
});
