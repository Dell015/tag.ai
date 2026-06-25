import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../game-store';
import { QueuedCard } from '@/lib/game/escalation-engine';
import { CardQueueConfig } from '@/lib/game/card-queue-builder';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<QueuedCard> = {}): QueuedCard {
  return {
    id: overrides.id ?? `card-${Math.random()}`,
    text: overrides.text ?? 'Test card',
    cardType: overrides.cardType ?? 'question',
    intensity: overrides.intensity ?? 3,
    category: overrides.category ?? 'hot_takes',
    topics: overrides.topics ?? [],
    ...overrides,
  };
}

function makeCardLibrary(count: number): QueuedCard[] {
  return Array.from({ length: count }, (_, i) =>
    makeCard({
      id: `card-${i}`,
      text: `Card ${i}`,
      intensity: (i % 5) + 1,
      cardType: i % 8 === 0 ? 'action' : 'question',
      category: 'hot_takes',
      topics: [],
    })
  );
}

function setupPlayState() {
  // Set up a play-ready state
  const cards = Array.from({ length: 20 }, (_, i) => makeCard({ id: `q-${i}` }));
  const buffer = Array.from({ length: 4 }, (_, i) => makeCard({ id: `buf-${i}` }));

  useGameStore.setState({
    cardQueue: cards,
    bufferCards: buffer,
    currentCardIndex: 0,
    cardsPlayed: 0,
    cardCountTarget: 20,
    heatLevel: 2.0,
    consecutiveSkips: 0,
    heatSpikeRemaining: 0,
    preSpikeHeat: 0,
    turnRotation: {
      players: [
        { id: '1', name: 'Alice', avatarUrl: '', turnOrder: 0 },
        { id: '2', name: 'Bob', avatarUrl: '', turnOrder: 1 },
        { id: '3', name: 'Charlie', avatarUrl: '', turnOrder: 2 },
      ],
      currentIndex: 0,
    },
    crownImmunityRemaining: 0,
    currentCardState: 'face_down',
    showPassPrompt: false,
    sessionPhase: 'play',
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store to initial state
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
      turnRotation: { players: [], currentIndex: 0 },
      crownImmunityRemaining: 0,
      currentCardState: 'face_down',
      showPassPrompt: false,
      sessionPhase: 'lobby',
    });
  });

  describe('flipCard', () => {
    it('sets currentCardState to revealed', () => {
      useGameStore.getState().flipCard();
      expect(useGameStore.getState().currentCardState).toBe('revealed');
    });

    it('does not change other state', () => {
      const before = useGameStore.getState();
      useGameStore.getState().flipCard();
      const after = useGameStore.getState();
      expect(after.currentCardIndex).toBe(before.currentCardIndex);
      expect(after.cardsPlayed).toBe(before.cardsPlayed);
      expect(after.heatLevel).toBe(before.heatLevel);
    });
  });

  describe('dismissCard', () => {
    beforeEach(setupPlayState);

    it('increments cardsPlayed by 1', () => {
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().cardsPlayed).toBe(1);
    });

    it('increments currentCardIndex by 1', () => {
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().currentCardIndex).toBe(1);
    });

    it('sets currentCardState to face_down', () => {
      useGameStore.setState({ currentCardState: 'revealed' });
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().currentCardState).toBe('face_down');
    });

    it('resets consecutiveSkips to 0', () => {
      useGameStore.setState({ consecutiveSkips: 2 });
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().consecutiveSkips).toBe(0);
    });

    it('increases heat by 0.3 on dismiss', () => {
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().heatLevel).toBeCloseTo(2.3);
    });

    it('advances turn rotation', () => {
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().turnRotation.currentIndex).toBe(1);
    });

    it('sets sessionPhase to end when cardsPlayed reaches cardCountTarget', () => {
      useGameStore.setState({ cardsPlayed: 19, cardCountTarget: 20 });
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().sessionPhase).toBe('end');
    });

    it('shows pass prompt when session does not end', () => {
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().showPassPrompt).toBe(true);
    });

    it('does not show pass prompt when session ends', () => {
      useGameStore.setState({ cardsPlayed: 19, cardCountTarget: 20 });
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().showPassPrompt).toBe(false);
    });

    it('decrements heatSpikeRemaining when active', () => {
      useGameStore.setState({ heatSpikeRemaining: 3, preSpikeHeat: 2.0 });
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().heatSpikeRemaining).toBe(2);
    });

    it('reverts heat to preSpikeHeat when heat spike expires', () => {
      useGameStore.setState({ heatSpikeRemaining: 1, preSpikeHeat: 1.5 });
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().heatSpikeRemaining).toBe(0);
      expect(useGameStore.getState().heatLevel).toBe(1.5);
    });

    it('decrements crownImmunityRemaining when active', () => {
      useGameStore.setState({ crownImmunityRemaining: 2 });
      useGameStore.getState().dismissCard();
      expect(useGameStore.getState().crownImmunityRemaining).toBe(1);
    });
  });

  describe('trashCard', () => {
    beforeEach(setupPlayState);

    it('increments cardsPlayed by 1', () => {
      useGameStore.getState().trashCard();
      expect(useGameStore.getState().cardsPlayed).toBe(1);
    });

    it('increments currentCardIndex by 1', () => {
      useGameStore.getState().trashCard();
      expect(useGameStore.getState().currentCardIndex).toBe(1);
    });

    it('sets currentCardState to face_down', () => {
      useGameStore.setState({ currentCardState: 'revealed' });
      useGameStore.getState().trashCard();
      expect(useGameStore.getState().currentCardState).toBe('face_down');
    });

    it('replaces trashed card from buffer', () => {
      const initialBufferLength = useGameStore.getState().bufferCards.length;
      useGameStore.getState().trashCard();
      expect(useGameStore.getState().bufferCards.length).toBe(initialBufferLength - 1);
    });

    it('inserts buffer card into queue at current position', () => {
      const bufferId = useGameStore.getState().bufferCards[0].id;
      useGameStore.getState().trashCard();
      // The buffer card should now be in the queue
      const queue = useGameStore.getState().cardQueue;
      expect(queue.some((c) => c.id === bufferId)).toBe(true);
    });

    it('advances turn rotation', () => {
      useGameStore.getState().trashCard();
      expect(useGameStore.getState().turnRotation.currentIndex).toBe(1);
    });

    it('increases heat by 0.3 (same as dismiss)', () => {
      useGameStore.getState().trashCard();
      expect(useGameStore.getState().heatLevel).toBeCloseTo(2.3);
    });

    it('sets sessionPhase to end when cardsPlayed reaches target', () => {
      useGameStore.setState({ cardsPlayed: 19, cardCountTarget: 20 });
      useGameStore.getState().trashCard();
      expect(useGameStore.getState().sessionPhase).toBe('end');
    });

    it('works when buffer is empty (no replacement)', () => {
      useGameStore.setState({ bufferCards: [] });
      const queueLength = useGameStore.getState().cardQueue.length;
      useGameStore.getState().trashCard();
      // Queue remains the same length (no insertion)
      expect(useGameStore.getState().cardQueue.length).toBe(queueLength);
    });
  });

  describe('heartCard', () => {
    beforeEach(setupPlayState);

    it('increases heat by 0.5', () => {
      useGameStore.getState().heartCard();
      expect(useGameStore.getState().heatLevel).toBeCloseTo(2.5);
    });

    it('does NOT advance turn rotation', () => {
      useGameStore.getState().heartCard();
      expect(useGameStore.getState().turnRotation.currentIndex).toBe(0);
    });

    it('does NOT increment cardsPlayed', () => {
      useGameStore.getState().heartCard();
      expect(useGameStore.getState().cardsPlayed).toBe(0);
    });

    it('does NOT increment currentCardIndex', () => {
      useGameStore.getState().heartCard();
      expect(useGameStore.getState().currentCardIndex).toBe(0);
    });

    it('decrements heatSpikeRemaining when active', () => {
      useGameStore.setState({ heatSpikeRemaining: 2, preSpikeHeat: 1.0 });
      useGameStore.getState().heartCard();
      expect(useGameStore.getState().heatSpikeRemaining).toBe(1);
    });

    it('reverts heat to preSpikeHeat when spike expires', () => {
      useGameStore.setState({ heatSpikeRemaining: 1, preSpikeHeat: 1.5 });
      useGameStore.getState().heartCard();
      expect(useGameStore.getState().heatSpikeRemaining).toBe(0);
      expect(useGameStore.getState().heatLevel).toBe(1.5);
    });

    it('decrements crownImmunityRemaining', () => {
      useGameStore.setState({ crownImmunityRemaining: 2 });
      useGameStore.getState().heartCard();
      expect(useGameStore.getState().crownImmunityRemaining).toBe(1);
    });
  });

  describe('advanceToNextCard', () => {
    beforeEach(setupPlayState);

    it('increments currentCardIndex', () => {
      useGameStore.getState().advanceToNextCard();
      expect(useGameStore.getState().currentCardIndex).toBe(1);
    });

    it('sets currentCardState to face_down', () => {
      useGameStore.setState({ currentCardState: 'revealed' });
      useGameStore.getState().advanceToNextCard();
      expect(useGameStore.getState().currentCardState).toBe('face_down');
    });

    it('hides pass prompt', () => {
      useGameStore.setState({ showPassPrompt: true });
      useGameStore.getState().advanceToNextCard();
      expect(useGameStore.getState().showPassPrompt).toBe(false);
    });
  });

  describe('initializeQueue', () => {
    it('builds card queue from config and library', () => {
      const library = makeCardLibrary(100);
      const config: CardQueueConfig = {
        gameMode: 'barkada',
        cardCountTarget: 20,
        comfortFilters: [],
        trashedCardIds: [],
        playerCount: 4,
      };

      useGameStore.getState().initializeQueue(config, library);

      const state = useGameStore.getState();
      expect(state.cardQueue.length).toBe(20);
      expect(state.bufferCards.length).toBe(Math.ceil(20 * 0.2));
    });

    it('sets heatLevel from game mode entryHeat', () => {
      const library = makeCardLibrary(100);
      const config: CardQueueConfig = {
        gameMode: 'spicy',
        cardCountTarget: 15,
        comfortFilters: [],
        trashedCardIds: [],
        playerCount: 3,
      };

      useGameStore.getState().initializeQueue(config, library);
      expect(useGameStore.getState().heatLevel).toBe(3); // spicy entryHeat
    });

    it('sets sessionPhase to play', () => {
      const library = makeCardLibrary(100);
      const config: CardQueueConfig = {
        gameMode: 'icebreaker',
        cardCountTarget: 10,
        comfortFilters: [],
        trashedCardIds: [],
        playerCount: 2,
      };

      useGameStore.getState().initializeQueue(config, library);
      expect(useGameStore.getState().sessionPhase).toBe('play');
    });

    it('resets gameplay counters', () => {
      // Set some state first
      useGameStore.setState({
        cardsPlayed: 10,
        currentCardIndex: 5,
        consecutiveSkips: 3,
        heatSpikeRemaining: 2,
        crownImmunityRemaining: 1,
      });

      const library = makeCardLibrary(100);
      const config: CardQueueConfig = {
        gameMode: 'barkada',
        cardCountTarget: 20,
        comfortFilters: [],
        trashedCardIds: [],
        playerCount: 4,
      };

      useGameStore.getState().initializeQueue(config, library);
      const state = useGameStore.getState();
      expect(state.cardsPlayed).toBe(0);
      expect(state.currentCardIndex).toBe(0);
      expect(state.consecutiveSkips).toBe(0);
      expect(state.heatSpikeRemaining).toBe(0);
      expect(state.crownImmunityRemaining).toBe(0);
    });

    it('sets cardCountTarget from config', () => {
      const library = makeCardLibrary(100);
      const config: CardQueueConfig = {
        gameMode: 'barkada',
        cardCountTarget: 35,
        comfortFilters: [],
        trashedCardIds: [],
        playerCount: 4,
      };

      useGameStore.getState().initializeQueue(config, library);
      expect(useGameStore.getState().cardCountTarget).toBe(35);
    });
  });
});
