import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameStore } from '@/stores/game-store';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockUpsertFn: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockFromFn: any;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => mockFromFn(table),
  }),
}));

// Mock React hooks to test logic directly without DOM environment
let effectCallbacks: Array<() => (() => void) | void> = [];
let cleanups: Array<(() => void) | undefined> = [];
const refValues: Array<{ current: unknown }> = [];

// Track online/offline listeners registered through the hook (used for future integration tests)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let registeredOnlineHandler: (() => void) | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let registeredOfflineHandler: (() => void) | null = null;

const mockWindow = {
  addEventListener: vi.fn((event: string, handler: () => void) => {
    if (event === 'online') registeredOnlineHandler = handler;
    if (event === 'offline') registeredOfflineHandler = handler;
  }),
  removeEventListener: vi.fn(),
};

// We need to mock window for the hook
vi.stubGlobal('window', mockWindow);
vi.stubGlobal('navigator', { onLine: true });

// Track state updates from useState
let isOnlineState = true;

vi.mock('react', () => ({
  useState: (initial: unknown) => {
    isOnlineState = initial as boolean;
    return [isOnlineState, (val: unknown) => {
      isOnlineState = typeof val === 'function' ? (val as (prev: boolean) => boolean)(isOnlineState) : val as boolean;
    }];
  },
  useEffect: (fn: () => (() => void) | void, _deps?: unknown[]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    effectCallbacks.push(fn);
  },
  useRef: (initial: unknown) => {
    const ref = { current: initial };
    refValues.push(ref);
    return ref;
  },
  useCallback: (fn: unknown) => fn,
}));

// Mock localStorage
const localStorageData: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageData[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageData[key]; }),
});

// ─── Import after mocks ─────────────────────────────────────────────────────

import { useGameActions } from '../use-game-actions';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useGameActions', () => {
  beforeEach(() => {
    effectCallbacks = [];
    cleanups = [];
    refValues.length = 0;
    registeredOnlineHandler = null;
    registeredOfflineHandler = null;
    isOnlineState = true;

    // Reset localStorage mock data
    Object.keys(localStorageData).forEach((k) => delete localStorageData[k]);

    // Reset navigator.onLine
    vi.stubGlobal('navigator', { onLine: true });

    // Reset mocks
    mockWindow.addEventListener.mockClear();
    mockWindow.removeEventListener.mockClear();

    // Mock Supabase
    mockUpsertFn = vi.fn().mockResolvedValue({ error: null });
    mockFromFn = vi.fn(() => ({
      upsert: mockUpsertFn,
    }));

    // Reset game store
    useGameStore.setState({
      cardQueue: [],
      bufferCards: [],
      currentCardIndex: 0,
      cardsPlayed: 0,
      cardCountTarget: 20,
      heatLevel: 1.0,
      consecutiveSkips: 0,
      heatSpikeRemaining: 0,
      preSpikeHeat: 0,
      turnRotation: { players: [{ id: '1', name: 'A', avatarUrl: '', turnOrder: 0 }], currentIndex: 0 },
      crownImmunityRemaining: 0,
      currentCardState: 'face_down',
      showPassPrompt: false,
      sessionPhase: 'play',
    });
  });

  afterEach(() => {
    // Run cleanups
    cleanups.forEach((fn) => fn && fn());
  });

  function runHook() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useGameActions();
    // Execute all registered effects
    effectCallbacks.forEach((fn) => {
      const cleanup = fn();
      if (cleanup) cleanups.push(cleanup);
    });
    effectCallbacks = [];
    return result;
  }

  describe('flipCard', () => {
    it('calls game store flipCard and updates state', () => {
      const { flipCard } = runHook();
      flipCard();
      expect(useGameStore.getState().currentCardState).toBe('revealed');
    });
  });

  describe('dismissCard', () => {
    it('calls game store dismissCard and increments cardsPlayed', () => {
      const { dismissCard } = runHook();
      dismissCard('left');
      expect(useGameStore.getState().cardsPlayed).toBe(1);
      expect(useGameStore.getState().currentCardState).toBe('face_down');
    });

    it('works with right direction as well', () => {
      const { dismissCard } = runHook();
      dismissCard('right');
      expect(useGameStore.getState().cardsPlayed).toBe(1);
    });
  });

  describe('trashCard', () => {
    it('calls game store trashCard and increments cardsPlayed', () => {
      const { trashCard } = runHook();
      trashCard('card-123', 'user-456');
      expect(useGameStore.getState().cardsPlayed).toBe(1);
    });

    it('queues a Supabase upsert to user_trashed_cards', async () => {
      const { trashCard } = runHook();
      trashCard('card-123', 'user-456');

      // Allow async to resolve
      await vi.waitFor(() => {
        expect(mockFromFn).toHaveBeenCalledWith('user_trashed_cards');
      });
      expect(mockUpsertFn).toHaveBeenCalledWith(
        { user_id: 'user-456', card_id: 'card-123' },
        { onConflict: 'user_id,card_id' }
      );
    });
  });

  describe('heartCard', () => {
    it('calls game store heartCard and increases heat', () => {
      const initialHeat = useGameStore.getState().heatLevel;
      const { heartCard } = runHook();
      heartCard('card-789', 'user-456');
      expect(useGameStore.getState().heatLevel).toBeGreaterThan(initialHeat);
    });

    it('queues a Supabase upsert to saved_cards', async () => {
      const { heartCard } = runHook();
      heartCard('card-789', 'user-456');

      await vi.waitFor(() => {
        expect(mockFromFn).toHaveBeenCalledWith('saved_cards');
      });
      expect(mockUpsertFn).toHaveBeenCalledWith(
        { user_id: 'user-456', card_id: 'card-789' },
        { onConflict: 'user_id,card_id' }
      );
    });
  });

  describe('isOnline', () => {
    it('returns true when navigator.onLine is true', () => {
      const { isOnline } = runHook();
      expect(isOnline).toBe(true);
    });

    it('returns false when navigator.onLine is false', () => {
      vi.stubGlobal('navigator', { onLine: false });
      isOnlineState = false;
      const { isOnline } = runHook();
      expect(isOnline).toBe(false);
    });
  });

  describe('event listener registration', () => {
    it('registers online and offline event listeners', () => {
      runHook();
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('offline queue persistence', () => {
    it('persists sync items to localStorage when offline', () => {
      vi.stubGlobal('navigator', { onLine: false });
      isOnlineState = false;

      const { trashCard } = runHook();
      trashCard('card-offline', 'user-offline');

      const stored = localStorageData['tag_ai_pending_syncs'];
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('trash');
      expect(parsed[0].cardId).toBe('card-offline');
      expect(parsed[0].userId).toBe('user-offline');
    });

    it('does not call Supabase when offline', () => {
      vi.stubGlobal('navigator', { onLine: false });
      isOnlineState = false;

      const { heartCard } = runHook();
      heartCard('card-no-sync', 'user-no-sync');

      expect(mockFromFn).not.toHaveBeenCalled();
    });
  });

  describe('retry behavior', () => {
    it('retries failed sync items', async () => {
      // First call fails, second succeeds
      mockUpsertFn
        .mockResolvedValueOnce({ error: { message: 'network error' } })
        .mockResolvedValueOnce({ error: null });

      const { heartCard } = runHook();
      heartCard('card-retry', 'user-retry');

      await vi.waitFor(() => {
        expect(mockUpsertFn).toHaveBeenCalledTimes(2);
      }, { timeout: 2000 });
    });

    it('persists to localStorage after max retries exhausted', async () => {
      // All calls fail
      mockUpsertFn.mockResolvedValue({ error: { message: 'permanent error' } });

      const { trashCard } = runHook();
      trashCard('card-fail', 'user-fail');

      // Wait for all retries to complete (3 attempts)
      await vi.waitFor(() => {
        expect(mockUpsertFn).toHaveBeenCalledTimes(3);
      }, { timeout: 3000 });

      // Should persist to localStorage
      await vi.waitFor(() => {
        const stored = localStorageData['tag_ai_pending_syncs'];
        expect(stored).toBeDefined();
        const parsed = JSON.parse(stored);
        expect(parsed[0].retryCount).toBe(3);
      }, { timeout: 1000 });
    });
  });

  describe('localStorage recovery on mount', () => {
    it('loads persisted queue items on initialization', () => {
      const persistedItems = [
        { id: 'old-1', type: 'heart', cardId: 'card-old', userId: 'user-old', retryCount: 1, createdAt: Date.now() - 60000 },
      ];
      localStorageData['tag_ai_pending_syncs'] = JSON.stringify(persistedItems);

      runHook();

      // After running effects, the flush should attempt to sync persisted items
      // The mock is set to succeed, so it should call Supabase
      return vi.waitFor(() => {
        expect(mockFromFn).toHaveBeenCalledWith('saved_cards');
      }, { timeout: 2000 });
    });
  });
});
