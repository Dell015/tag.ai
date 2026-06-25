import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import { GAME_MODES } from '@/lib/game/game-modes';

/**
 * Tests for PreGameSummary component logic.
 * We test the data-reading behavior from the session store since
 * the component reads all its display data from there.
 */
describe('PreGameSummary', () => {
  beforeEach(() => {
    useSessionStore.setState({
      players: [],
      cardCountTarget: 20,
      gameMode: null,
      comfortFilters: [],
      drinkRuleTemplate: null,
      customDrinkRules: [],
    });
  });

  describe('session store provides correct summary data', () => {
    it('reads player list from store', () => {
      useSessionStore.setState({
        players: [
          { id: '1', userId: 'u1', displayName: 'Alice', avatarUrl: '', turnOrder: 1, agreedToRules: true },
          { id: '2', userId: 'u2', displayName: 'Bob', avatarUrl: '', turnOrder: 2, agreedToRules: true },
        ],
      });
      const { players } = useSessionStore.getState();
      expect(players).toHaveLength(2);
      expect(players[0].displayName).toBe('Alice');
      expect(players[1].displayName).toBe('Bob');
    });

    it('reads card count target from store', () => {
      useSessionStore.setState({ cardCountTarget: 30 });
      expect(useSessionStore.getState().cardCountTarget).toBe(30);
    });

    it('reads game mode from store', () => {
      useSessionStore.setState({ gameMode: 'barkada' });
      const { gameMode } = useSessionStore.getState();
      expect(gameMode).toBe('barkada');
      expect(GAME_MODES[gameMode!].emoji).toBe('🤙');
      expect(GAME_MODES[gameMode!].name).toBe('Barkada');
    });

    it('reads comfort filters from store', () => {
      useSessionStore.setState({ comfortFilters: ['Politics', 'Religion'] });
      const { comfortFilters } = useSessionStore.getState();
      expect(comfortFilters).toEqual(['Politics', 'Religion']);
    });

    it('reads drink rule template from store', () => {
      useSessionStore.setState({ drinkRuleTemplate: 'Classic' });
      expect(useSessionStore.getState().drinkRuleTemplate).toBe('Classic');
    });

    it('reads custom drink rules from store', () => {
      useSessionStore.setState({ customDrinkRules: ['Loser drinks', 'No phones'] });
      const { customDrinkRules } = useSessionStore.getState();
      expect(customDrinkRules).toEqual(['Loser drinks', 'No phones']);
    });

    it('handles null game mode gracefully', () => {
      useSessionStore.setState({ gameMode: null });
      const { gameMode } = useSessionStore.getState();
      expect(gameMode).toBeNull();
    });

    it('handles empty comfort filters', () => {
      useSessionStore.setState({ comfortFilters: [] });
      expect(useSessionStore.getState().comfortFilters).toEqual([]);
    });
  });

  describe('game mode config lookup', () => {
    it('returns correct config for each mode', () => {
      const modes = ['icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family'] as const;
      for (const mode of modes) {
        const config = GAME_MODES[mode];
        expect(config.name).toBeTruthy();
        expect(config.emoji).toBeTruthy();
      }
    });
  });
});
