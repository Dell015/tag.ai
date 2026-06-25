import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore } from '@/stores/session-store';

// ─── Mocks ───────────────────────────────────────────────────────────────────

type BroadcastHandler = (msg: { payload: unknown }) => void;

let eventHandlers: Record<string, BroadcastHandler> = {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let subscribeCallback: ((status: string) => void) | null = null;
const mockRemoveChannel = vi.fn();

const mockChannel = {
  on: vi.fn((_type: string, opts: { event: string }, handler: BroadcastHandler) => {
    eventHandlers[opts.event] = handler;
    return mockChannel;
  }),
  subscribe: vi.fn((cb: (status: string) => void) => {
    subscribeCallback = cb;
    return mockChannel;
  }),
  unsubscribe: vi.fn(),
};

const mockChannelFn = vi.fn(() => mockChannel);

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: mockChannelFn,
    removeChannel: mockRemoveChannel,
  }),
}));

// Mock React hooks to test the effect logic directly
let cleanupFn: (() => void) | undefined;
let effectFn: (() => void) | undefined;
const mockSetState = vi.fn();

vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const value = initial;
    return [value, mockSetState];
  },
  useEffect: (fn: () => (() => void) | void) => {
    effectFn = fn as () => void;
  },
  useRef: (initial: unknown) => ({ current: initial }),
}));

// ─── Import after mocks ─────────────────────────────────────────────────────

import { useRealtimeLobby } from '../use-realtime-lobby';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useRealtimeLobby', () => {
  beforeEach(() => {
    eventHandlers = {};
    subscribeCallback = null;
    mockChannel.on.mockClear();
    mockChannel.subscribe.mockClear();
    mockChannelFn.mockClear();
    mockRemoveChannel.mockClear();
    mockSetState.mockClear();
    effectFn = undefined;
    cleanupFn = undefined;

    // Reset mock channel chaining
    mockChannel.on.mockImplementation((_type: string, opts: { event: string }, handler: BroadcastHandler) => {
      eventHandlers[opts.event] = handler;
      return mockChannel;
    });

    mockChannel.subscribe.mockImplementation((cb: (status: string) => void) => {
      subscribeCallback = cb;
      return mockChannel;
    });

    // Reset session store
    useSessionStore.setState({
      sessionId: null,
      roomCode: null,
      hostId: null,
      status: 'lobby',
      players: [],
      cardCountTarget: 20,
      gameMode: null,
      comfortFilters: [],
      drinkRuleTemplate: null,
      customDrinkRules: [],
      nonDrinkingMode: false,
      agreedPlayers: [],
    });
  });

  function runHook(roomCode: string) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRealtimeLobby(roomCode);
    if (effectFn) {
      cleanupFn = effectFn() as (() => void) | undefined;
    }
  }

  it('does not subscribe when roomCode is empty', () => {
    runHook('');
    expect(mockChannelFn).not.toHaveBeenCalled();
  });

  it('subscribes to the correct channel name', () => {
    runHook('ABC123');
    expect(mockChannelFn).toHaveBeenCalledWith('session:ABC123');
  });

  it('registers all 6 event handlers', () => {
    runHook('ABC123');
    expect(eventHandlers['player_joined']).toBeDefined();
    expect(eventHandlers['player_removed']).toBeDefined();
    expect(eventHandlers['setup_changed']).toBeDefined();
    expect(eventHandlers['rules_agreed']).toBeDefined();
    expect(eventHandlers['game_started']).toBeDefined();
    expect(eventHandlers['session_ended']).toBeDefined();
  });

  it('calls subscribe on the channel', () => {
    runHook('ABC123');
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('removes channel on cleanup', () => {
    runHook('ABC123');
    if (cleanupFn) cleanupFn();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  describe('event: player_joined', () => {
    it('adds player to session store', () => {
      runHook('ABC123');
      eventHandlers['player_joined']({
        payload: {
          userId: 'user-1',
          displayName: 'Alice',
          avatarUrl: 'https://example.com/alice.png',
          turnOrder: 1,
        },
      });

      const players = useSessionStore.getState().players;
      expect(players).toHaveLength(1);
      expect(players[0].userId).toBe('user-1');
      expect(players[0].displayName).toBe('Alice');
      expect(players[0].avatarUrl).toBe('https://example.com/alice.png');
      expect(players[0].turnOrder).toBe(1);
      expect(players[0].agreedToRules).toBe(false);
    });

    it('does not add duplicate player', () => {
      useSessionStore.setState({
        players: [
          {
            id: 'user-1',
            userId: 'user-1',
            displayName: 'Alice',
            avatarUrl: '',
            turnOrder: 0,
            agreedToRules: false,
          },
        ],
      });

      runHook('ABC123');
      eventHandlers['player_joined']({
        payload: {
          userId: 'user-1',
          displayName: 'Alice',
          avatarUrl: '',
          turnOrder: 0,
        },
      });

      expect(useSessionStore.getState().players).toHaveLength(1);
    });
  });

  describe('event: player_removed', () => {
    it('removes player from session store', () => {
      useSessionStore.setState({
        players: [
          {
            id: 'user-1',
            userId: 'user-1',
            displayName: 'Alice',
            avatarUrl: '',
            turnOrder: 0,
            agreedToRules: true,
          },
        ],
        agreedPlayers: ['user-1'],
      });

      runHook('ABC123');
      eventHandlers['player_removed']({ payload: { userId: 'user-1' } });

      expect(useSessionStore.getState().players).toHaveLength(0);
      expect(useSessionStore.getState().agreedPlayers).not.toContain('user-1');
    });
  });

  describe('event: setup_changed', () => {
    it('updates cardCountTarget when cardCount is provided', () => {
      runHook('ABC123');
      eventHandlers['setup_changed']({ payload: { cardCount: 50 } });
      expect(useSessionStore.getState().cardCountTarget).toBe(50);
    });

    it('updates gameMode when provided', () => {
      runHook('ABC123');
      eventHandlers['setup_changed']({ payload: { gameMode: 'lovers' } });
      expect(useSessionStore.getState().gameMode).toBe('lovers');
    });

    it('updates comfortFilters when provided', () => {
      runHook('ABC123');
      eventHandlers['setup_changed']({
        payload: { comfortFilters: ['politics', 'religion'] },
      });
      expect(useSessionStore.getState().comfortFilters).toEqual([
        'politics',
        'religion',
      ]);
    });

    it('handles multiple fields at once', () => {
      runHook('ABC123');
      eventHandlers['setup_changed']({
        payload: { cardCount: 30, gameMode: 'spicy' },
      });
      const state = useSessionStore.getState();
      expect(state.cardCountTarget).toBe(30);
      expect(state.gameMode).toBe('spicy');
    });

    it('does not change fields when not included in payload', () => {
      useSessionStore.setState({ cardCountTarget: 25, gameMode: 'chaos' });
      runHook('ABC123');
      eventHandlers['setup_changed']({ payload: { comfortFilters: ['money'] } });
      const state = useSessionStore.getState();
      expect(state.cardCountTarget).toBe(25);
      expect(state.gameMode).toBe('chaos');
      expect(state.comfortFilters).toEqual(['money']);
    });
  });

  describe('event: rules_agreed', () => {
    it('marks user as agreed in session store', () => {
      runHook('ABC123');
      eventHandlers['rules_agreed']({ payload: { userId: 'user-2' } });
      expect(useSessionStore.getState().agreedPlayers).toContain('user-2');
    });

    it('does not duplicate agreements', () => {
      useSessionStore.setState({ agreedPlayers: ['user-2'] });
      runHook('ABC123');
      eventHandlers['rules_agreed']({ payload: { userId: 'user-2' } });
      const agreed = useSessionStore.getState().agreedPlayers;
      expect(agreed.filter((id) => id === 'user-2')).toHaveLength(1);
    });
  });

  describe('event: game_started', () => {
    it('sets session status to active with sessionId', () => {
      runHook('ABC123');
      eventHandlers['game_started']({ payload: { sessionId: 'session-xyz' } });
      const state = useSessionStore.getState();
      expect(state.status).toBe('active');
      expect(state.sessionId).toBe('session-xyz');
    });
  });

  describe('event: session_ended', () => {
    it('sets session status to ended', () => {
      useSessionStore.setState({ status: 'active' });
      runHook('ABC123');
      eventHandlers['session_ended']({
        payload: { cardsPlayed: 20, heatLevel: 3.5 },
      });
      expect(useSessionStore.getState().status).toBe('ended');
    });
  });
});
