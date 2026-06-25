import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import type { SessionPlayer } from '@/types/game';

const mockPlayers: SessionPlayer[] = [
  {
    id: 'player-1',
    userId: 'user-1',
    displayName: 'Alice',
    avatarUrl: '',
    turnOrder: 1,
    agreedToRules: false,
  },
  {
    id: 'player-2',
    userId: 'user-2',
    displayName: 'Bob',
    avatarUrl: '',
    turnOrder: 2,
    agreedToRules: false,
  },
  {
    id: 'player-3',
    userId: 'user-3',
    displayName: 'Charlie',
    avatarUrl: '',
    turnOrder: 3,
    agreedToRules: false,
  },
];

describe('HouseRules — store integration', () => {
  beforeEach(() => {
    useSessionStore.setState({
      players: [...mockPlayers],
      agreedPlayers: [],
      roomCode: 'ABC123',
      drinkRuleTemplate: 'Classic',
      customDrinkRules: ['Loser drinks twice', 'No phone rule'],
      nonDrinkingMode: false,
    });
  });

  describe('canStartGame logic', () => {
    it('returns false when no players have agreed', () => {
      expect(useSessionStore.getState().canStartGame()).toBe(false);
    });

    it('returns false when only some players have agreed', () => {
      useSessionStore.getState().setPlayerAgreed('user-1');
      useSessionStore.getState().setPlayerAgreed('user-2');
      expect(useSessionStore.getState().canStartGame()).toBe(false);
    });

    it('returns true when all players have agreed', () => {
      useSessionStore.getState().setPlayerAgreed('user-1');
      useSessionStore.getState().setPlayerAgreed('user-2');
      useSessionStore.getState().setPlayerAgreed('user-3');
      expect(useSessionStore.getState().canStartGame()).toBe(true);
    });

    it('returns false when fewer than 2 players exist', () => {
      useSessionStore.setState({ players: [mockPlayers[0]], agreedPlayers: ['user-1'] });
      expect(useSessionStore.getState().canStartGame()).toBe(false);
    });
  });

  describe('setPlayerAgreed', () => {
    it('adds user ID to agreedPlayers', () => {
      useSessionStore.getState().setPlayerAgreed('user-1');
      expect(useSessionStore.getState().agreedPlayers).toContain('user-1');
    });

    it('does not add duplicate entries', () => {
      useSessionStore.getState().setPlayerAgreed('user-1');
      useSessionStore.getState().setPlayerAgreed('user-1');
      const agreed = useSessionStore.getState().agreedPlayers;
      expect(agreed.filter((id) => id === 'user-1')).toHaveLength(1);
    });

    it('tracks multiple players independently', () => {
      useSessionStore.getState().setPlayerAgreed('user-1');
      useSessionStore.getState().setPlayerAgreed('user-3');
      const { agreedPlayers } = useSessionStore.getState();
      expect(agreedPlayers).toContain('user-1');
      expect(agreedPlayers).toContain('user-3');
      expect(agreedPlayers).not.toContain('user-2');
    });
  });

  describe('removePlayer cleans up agreed state', () => {
    it('removes player from agreedPlayers when they leave', () => {
      useSessionStore.getState().setPlayerAgreed('user-2');
      expect(useSessionStore.getState().agreedPlayers).toContain('user-2');

      useSessionStore.getState().removePlayer('user-2');
      expect(useSessionStore.getState().agreedPlayers).not.toContain('user-2');
    });

    it('enables start when removed player was the only one who hadnt agreed', () => {
      useSessionStore.getState().setPlayerAgreed('user-1');
      useSessionStore.getState().setPlayerAgreed('user-2');
      // user-3 hasn't agreed yet
      expect(useSessionStore.getState().canStartGame()).toBe(false);

      // remove user-3 — now only user-1 and user-2 remain, both agreed
      useSessionStore.getState().removePlayer('user-3');
      expect(useSessionStore.getState().canStartGame()).toBe(true);
    });
  });

  describe('drink rule display data', () => {
    it('stores drink rule template', () => {
      expect(useSessionStore.getState().drinkRuleTemplate).toBe('Classic');
    });

    it('stores custom drink rules', () => {
      expect(useSessionStore.getState().customDrinkRules).toEqual([
        'Loser drinks twice',
        'No phone rule',
      ]);
    });

    it('stores non-drinking mode flag', () => {
      expect(useSessionStore.getState().nonDrinkingMode).toBe(false);
      useSessionStore.getState().setSession({ nonDrinkingMode: true });
      expect(useSessionStore.getState().nonDrinkingMode).toBe(true);
    });
  });
});
