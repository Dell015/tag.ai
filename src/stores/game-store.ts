/**
 * Game Store — Zustand store for managing all gameplay state on the host device.
 *
 * During active gameplay, the host device maintains the full game state locally:
 * card queue, heat level, turn rotation, cards played, and escalation effects.
 * This ensures zero-latency card draws regardless of network conditions.
 */

import { create } from 'zustand';
import { calculateHeat, QueuedCard } from '@/lib/game/escalation-engine';
import { advanceTurn, TurnState } from '@/lib/game/turn-rotation';
import { buildCardQueue, CardQueueConfig } from '@/lib/game/card-queue-builder';
import { GAME_MODES } from '@/lib/game/game-modes';
import { decrementHeatSpike, decrementCrownImmunity, applyShuffleWildCard } from '@/lib/game/wild-cards';
import { WildCardType } from '@/types/game';

// ─── State Interface ─────────────────────────────────────────────────────────

export interface GameState {
  // Queue state
  cardQueue: QueuedCard[];
  bufferCards: QueuedCard[];
  currentCardIndex: number;

  // Session metrics
  cardsPlayed: number;
  cardCountTarget: number;

  // Escalation
  heatLevel: number;
  consecutiveSkips: number;
  heatSpikeRemaining: number;
  preSpikeHeat: number;

  // Turn management
  turnRotation: TurnState;
  crownImmunityRemaining: number;

  // UI state
  currentCardState: 'face_down' | 'revealed' | 'dismissing';
  showPassPrompt: boolean;
  sessionPhase: 'lobby' | 'setup' | 'play' | 'end';

  // Actions
  flipCard: () => void;
  dismissCard: () => void;
  trashCard: () => void;
  heartCard: () => void;
  advanceToNextCard: () => void;
  initializeQueue: (config: CardQueueConfig, library: QueuedCard[]) => void;
  applyWildCardEffect: (wildCardType: WildCardType) => void;
}

// ─── Store Creation ──────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  // Queue state
  cardQueue: [],
  bufferCards: [],
  currentCardIndex: 0,

  // Session metrics
  cardsPlayed: 0,
  cardCountTarget: 20,

  // Escalation
  heatLevel: 1.0,
  consecutiveSkips: 0,
  heatSpikeRemaining: 0,
  preSpikeHeat: 0,

  // Turn management
  turnRotation: { players: [], currentIndex: 0 },
  crownImmunityRemaining: 0,

  // UI state
  currentCardState: 'face_down',
  showPassPrompt: false,
  sessionPhase: 'lobby',

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Flips the current card from face_down to revealed.
   */
  flipCard: () => {
    set({ currentCardState: 'revealed' });
  },

  /**
   * Dismisses the current card (swipe left/right).
   * - Calculates new heat via escalation engine ('dismiss' event)
   * - Advances turn rotation
   * - Increments cardsPlayed and currentCardIndex
   * - Resets consecutiveSkips to 0
   * - Handles heat spike decrement
   * - Handles crown immunity decrement
   * - Ends session if cardCountTarget is reached
   */
  dismissCard: () => {
    const state = get();

    // Calculate new heat
    const { newHeat } = calculateHeat({
      currentHeat: state.heatLevel,
      event: 'dismiss',
      consecutiveSkips: state.consecutiveSkips,
      gameMode: 'barkada', // Will be pulled from session store in production
    });

    // Advance turn rotation
    const newTurnRotation = advanceTurn(state.turnRotation);

    // Handle heat spike decrement
    const newHeatSpikeRemaining = decrementHeatSpike(state.heatSpikeRemaining);

    // If heat spike just expired, revert to pre-spike heat
    let effectiveHeat = newHeat;
    if (state.heatSpikeRemaining > 0 && newHeatSpikeRemaining === 0) {
      effectiveHeat = state.preSpikeHeat;
    }

    // Handle crown immunity decrement
    const newCrownImmunity = decrementCrownImmunity(state.crownImmunityRemaining);

    const newCardsPlayed = state.cardsPlayed + 1;
    const newCardIndex = state.currentCardIndex + 1;

    // Check if session should end
    const shouldEnd = newCardsPlayed >= state.cardCountTarget;

    set({
      heatLevel: effectiveHeat,
      turnRotation: newTurnRotation,
      cardsPlayed: newCardsPlayed,
      currentCardIndex: newCardIndex,
      currentCardState: 'face_down',
      consecutiveSkips: 0,
      heatSpikeRemaining: newHeatSpikeRemaining,
      crownImmunityRemaining: newCrownImmunity,
      sessionPhase: shouldEnd ? 'end' : state.sessionPhase,
      showPassPrompt: !shouldEnd,
    });
  },

  /**
   * Trashes the current card.
   * - Replaces current card from buffer (shift buffer)
   * - Calls calculateHeat with 'dismiss' event (same escalation as dismiss)
   * - Advances turn rotation
   * - Increments cardsPlayed and currentCardIndex
   * - Resets consecutiveSkips to 0
   * - Handles heat spike and crown immunity decrement
   * - Ends session if cardCountTarget is reached
   */
  trashCard: () => {
    const state = get();

    // Replace current card from buffer
    const newCardQueue = [...state.cardQueue];
    const newBuffer = [...state.bufferCards];

    if (newBuffer.length > 0) {
      // Shift first buffer card into the queue at current position
      const replacementCard = newBuffer.shift()!;
      newCardQueue.splice(state.currentCardIndex, 0, replacementCard);
    }

    // Calculate new heat (trash uses 'dismiss' event)
    const { newHeat } = calculateHeat({
      currentHeat: state.heatLevel,
      event: 'dismiss',
      consecutiveSkips: state.consecutiveSkips,
      gameMode: 'barkada',
    });

    // Advance turn rotation
    const newTurnRotation = advanceTurn(state.turnRotation);

    // Handle heat spike decrement
    const newHeatSpikeRemaining = decrementHeatSpike(state.heatSpikeRemaining);

    // If heat spike just expired, revert to pre-spike heat
    let effectiveHeat = newHeat;
    if (state.heatSpikeRemaining > 0 && newHeatSpikeRemaining === 0) {
      effectiveHeat = state.preSpikeHeat;
    }

    // Handle crown immunity decrement
    const newCrownImmunity = decrementCrownImmunity(state.crownImmunityRemaining);

    const newCardsPlayed = state.cardsPlayed + 1;
    const newCardIndex = state.currentCardIndex + 1;

    // Check if session should end
    const shouldEnd = newCardsPlayed >= state.cardCountTarget;

    set({
      cardQueue: newCardQueue,
      bufferCards: newBuffer,
      heatLevel: effectiveHeat,
      turnRotation: newTurnRotation,
      cardsPlayed: newCardsPlayed,
      currentCardIndex: newCardIndex,
      currentCardState: 'face_down',
      consecutiveSkips: 0,
      heatSpikeRemaining: newHeatSpikeRemaining,
      crownImmunityRemaining: newCrownImmunity,
      sessionPhase: shouldEnd ? 'end' : state.sessionPhase,
      showPassPrompt: !shouldEnd,
    });
  },

  /**
   * Hearts (saves) the current card.
   * - Calls calculateHeat with 'heart' event
   * - Increments heat
   * - Does NOT advance turn or increment cardsPlayed (heart is supplementary)
   * - Handles heat spike decrement
   * - Handles crown immunity decrement
   */
  heartCard: () => {
    const state = get();

    // Calculate new heat
    const { newHeat } = calculateHeat({
      currentHeat: state.heatLevel,
      event: 'heart',
      consecutiveSkips: state.consecutiveSkips,
      gameMode: 'barkada',
    });

    // Handle heat spike decrement
    const newHeatSpikeRemaining = decrementHeatSpike(state.heatSpikeRemaining);

    // If heat spike just expired, revert to pre-spike heat
    let effectiveHeat = newHeat;
    if (state.heatSpikeRemaining > 0 && newHeatSpikeRemaining === 0) {
      effectiveHeat = state.preSpikeHeat;
    }

    // Handle crown immunity decrement
    const newCrownImmunity = decrementCrownImmunity(state.crownImmunityRemaining);

    set({
      heatLevel: effectiveHeat,
      heatSpikeRemaining: newHeatSpikeRemaining,
      crownImmunityRemaining: newCrownImmunity,
    });
  },

  /**
   * Advances to the next card in the queue.
   * Sets currentCardState to face_down.
   */
  advanceToNextCard: () => {
    set((state) => ({
      currentCardIndex: state.currentCardIndex + 1,
      currentCardState: 'face_down',
      showPassPrompt: false,
    }));
  },

  /**
   * Initializes the card queue from configuration and library.
   * - Calls buildCardQueue to construct the queue
   * - Stores result in cardQueue/bufferCards
   * - Sets cardCountTarget
   * - Initializes heat from GAME_MODES[gameMode].entryHeat
   * - Sets sessionPhase to 'play'
   */
  initializeQueue: (config: CardQueueConfig, library: QueuedCard[]) => {
    const result = buildCardQueue(config, library);
    const modeConfig = GAME_MODES[config.gameMode];

    set({
      cardQueue: result.cards,
      bufferCards: result.buffer,
      cardCountTarget: config.cardCountTarget,
      heatLevel: modeConfig.entryHeat,
      currentCardIndex: 0,
      cardsPlayed: 0,
      consecutiveSkips: 0,
      heatSpikeRemaining: 0,
      preSpikeHeat: 0,
      crownImmunityRemaining: 0,
      currentCardState: 'face_down',
      showPassPrompt: false,
      sessionPhase: 'play',
    });
  },

  /**
   * Applies the effect of a wild card based on its type.
   * - 'shuffle': reshuffles the next 5 cards in the queue
   * - 'heat_spike': sets heatSpikeRemaining to 3 and stores current heat as preSpikeHeat
   * - 'crown': sets crownImmunityRemaining to 2
   * - Other types: no state mutation (display-only effects)
   */
  applyWildCardEffect: (wildCardType: WildCardType) => {
    const state = get();

    switch (wildCardType) {
      case 'shuffle': {
        const newQueue = applyShuffleWildCard(state.cardQueue, state.currentCardIndex);
        set({ cardQueue: newQueue });
        break;
      }
      case 'heat_spike': {
        set({
          heatSpikeRemaining: 3,
          preSpikeHeat: state.heatLevel,
        });
        break;
      }
      case 'crown': {
        set({ crownImmunityRemaining: 2 });
        break;
      }
      default:
        // Other wild card types are display-only (role_reversal, pick_your_target, etc.)
        break;
    }
  },
}));
