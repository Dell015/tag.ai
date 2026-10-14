/**
 * Game Store — Zustand store for managing all gameplay state on the host device.
 *
 * During active gameplay, the host device maintains the full game state locally:
 * card queue, heat level, turn rotation, cards played, and escalation effects.
 * This ensures zero-latency card draws regardless of network conditions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { steerNextCard } from '@/lib/game/steering';
import { calculateHeat, QueuedCard } from '@/lib/game/escalation-engine';
import { advanceTurn, TurnState } from '@/lib/game/turn-rotation';
import { buildCardQueue, CardQueueConfig } from '@/lib/game/card-queue-builder';
import { GAME_MODES } from '@/lib/game/game-modes';
import { decrementHeatSpike, decrementCrownImmunity, applyShuffleWildCard } from '@/lib/game/wild-cards';
import { GameMode, WildCardType } from '@/types/game';

// ─── State Interface ─────────────────────────────────────────────────────────

/** Everything an undo needs to put the table back where it was. */
export interface UndoSnapshot {
  cardQueue: QueuedCard[];
  bufferCards: QueuedCard[];
  currentCardIndex: number;
  cardsPlayed: number;
  heatLevel: number;
  consecutiveSkips: number;
  heatSpikeRemaining: number;
  preSpikeHeat: number;
  turnRotation: TurnState;
  crownImmunityRemaining: number;
  sessionPhase: 'lobby' | 'setup' | 'play' | 'end';
  kind: 'dismiss' | 'trash' | 'skip';
}

export interface GameState {
  // Queue state
  cardQueue: QueuedCard[];
  bufferCards: QueuedCard[];
  currentCardIndex: number;

  // Session metrics
  cardsPlayed: number;
  cardCountTarget: number;
  gameMode: GameMode;
  skippedCount: number;
  heartedCount: number;
  peakHeat: number;

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

  // Undo
  undoSnapshot: UndoSnapshot | null;

  // Actions
  flipCard: () => void;
  dismissCard: () => void;
  skipCard: () => void;
  trashCard: () => void;
  heartCard: () => void;
  undoLastCard: () => void;
  advanceToNextCard: () => void;
  dismissPassPrompt: () => void;
  adjustHeat: (delta: number) => void;
  removePlayerFromTurns: (playerId: string) => void;
  endGame: () => void;
  resetGame: () => void;
  initializeQueue: (config: CardQueueConfig, library: QueuedCard[]) => void;
  applyWildCardEffect: (wildCardType: WildCardType) => void;
}

type CardAction = 'dismiss' | 'trash' | 'skip';

const INITIAL: Pick<
  GameState,
  | 'cardQueue' | 'bufferCards' | 'currentCardIndex' | 'cardsPlayed' | 'cardCountTarget'
  | 'gameMode' | 'skippedCount' | 'heartedCount' | 'peakHeat' | 'heatLevel'
  | 'consecutiveSkips' | 'heatSpikeRemaining' | 'preSpikeHeat' | 'turnRotation'
  | 'crownImmunityRemaining' | 'currentCardState' | 'showPassPrompt' | 'sessionPhase'
  | 'undoSnapshot'
> = {
  cardQueue: [],
  bufferCards: [],
  currentCardIndex: 0,
  cardsPlayed: 0,
  cardCountTarget: 20,
  gameMode: 'barkada',
  skippedCount: 0,
  heartedCount: 0,
  peakHeat: 1.0,
  heatLevel: 1.0,
  consecutiveSkips: 0,
  heatSpikeRemaining: 0,
  preSpikeHeat: 0,
  turnRotation: { players: [], currentIndex: 0 },
  crownImmunityRemaining: 0,
  currentCardState: 'face_down',
  showPassPrompt: false,
  sessionPhase: 'lobby',
  undoSnapshot: null,
};

function snapshot(state: GameState, kind: CardAction): UndoSnapshot {
  return {
    cardQueue: state.cardQueue,
    bufferCards: state.bufferCards,
    currentCardIndex: state.currentCardIndex,
    cardsPlayed: state.cardsPlayed,
    heatLevel: state.heatLevel,
    consecutiveSkips: state.consecutiveSkips,
    heatSpikeRemaining: state.heatSpikeRemaining,
    preSpikeHeat: state.preSpikeHeat,
    turnRotation: state.turnRotation,
    crownImmunityRemaining: state.crownImmunityRemaining,
    sessionPhase: state.sessionPhase,
    kind,
  };
}

/**
 * Applies the effects shared by dismissing, skipping and trashing a card:
 * heat, turn rotation, counters, heat-spike/crown countdowns, heat-driven
 * steering of the next card, and the end-of-game check.
 */
function resolveCard(state: GameState, action: CardAction): Partial<GameState> {
  const event = action === 'skip' ? 'skip' : 'dismiss';
  const consecutiveSkips = action === 'skip' ? state.consecutiveSkips + 1 : 0;

  const { newHeat } = calculateHeat({
    currentHeat: state.heatLevel,
    event,
    consecutiveSkips,
    gameMode: state.gameMode,
  });

  const newHeatSpikeRemaining = decrementHeatSpike(state.heatSpikeRemaining);
  let effectiveHeat = newHeat;
  if (state.heatSpikeRemaining > 0 && newHeatSpikeRemaining === 0) {
    effectiveHeat = state.preSpikeHeat; // spike over: back to the pre-spike level
  }

  let cardQueue = [...state.cardQueue];
  const bufferCards = [...state.bufferCards];

  if (action === 'trash' && bufferCards.length > 0) {
    // The trashed card is gone for good: top the queue up from the buffer.
    cardQueue.push(bufferCards.shift()!);
  }

  const newCardsPlayed = state.cardsPlayed + 1;
  const newCardIndex = state.currentCardIndex + 1;
  const shouldEnd = newCardsPlayed >= state.cardCountTarget;

  if (!shouldEnd) {
    cardQueue = steerNextCard(cardQueue, newCardIndex, effectiveHeat);
  }

  return {
    cardQueue,
    bufferCards,
    heatLevel: effectiveHeat,
    peakHeat: Math.max(state.peakHeat, effectiveHeat),
    turnRotation: advanceTurn(state.turnRotation),
    cardsPlayed: newCardsPlayed,
    currentCardIndex: newCardIndex,
    currentCardState: 'face_down',
    consecutiveSkips,
    skippedCount: state.skippedCount + (action === 'skip' ? 1 : 0),
    heatSpikeRemaining: newHeatSpikeRemaining,
    crownImmunityRemaining: decrementCrownImmunity(state.crownImmunityRemaining),
    sessionPhase: shouldEnd ? 'end' : state.sessionPhase,
    showPassPrompt: !shouldEnd,
    undoSnapshot: snapshot(state, action),
  };
}

// ─── Store Creation ──────────────────────────────────────────────────────────

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      flipCard: () => set({ currentCardState: 'revealed' }),

      /** Swipe / "Next": heat +0.3, advances the turn. */
      dismissCard: () => set((state) => resolveCard(state, 'dismiss')),

      /** "Skip": heat −0.2 (−1.0 on the 3rd skip in a row), advances the turn. */
      skipCard: () => set((state) => resolveCard(state, 'skip')),

      /** Trash: like a dismiss, and the buffer tops the queue back up. */
      trashCard: () => set((state) => resolveCard(state, 'trash')),

      /** Heart: heat +0.5. Does not advance the turn or count as a played card. */
      heartCard: () => {
        const state = get();
        const { newHeat } = calculateHeat({
          currentHeat: state.heatLevel,
          event: 'heart',
          consecutiveSkips: state.consecutiveSkips,
          gameMode: state.gameMode,
        });

        const newHeatSpikeRemaining = decrementHeatSpike(state.heatSpikeRemaining);
        let effectiveHeat = newHeat;
        if (state.heatSpikeRemaining > 0 && newHeatSpikeRemaining === 0) {
          effectiveHeat = state.preSpikeHeat;
        }

        set({
          heatLevel: effectiveHeat,
          peakHeat: Math.max(state.peakHeat, effectiveHeat),
          heartedCount: state.heartedCount + 1,
          heatSpikeRemaining: newHeatSpikeRemaining,
          crownImmunityRemaining: decrementCrownImmunity(state.crownImmunityRemaining),
        });
      },

      /** Puts the table back to just before the last dismiss/skip/trash. */
      undoLastCard: () => {
        const snap = get().undoSnapshot;
        if (!snap) return;
        const { kind, ...restore } = snap;
        void kind;
        set({
          ...restore,
          skippedCount: Math.max(0, get().skippedCount - (kind === 'skip' ? 1 : 0)),
          currentCardState: 'revealed',
          showPassPrompt: false,
          undoSnapshot: null,
        });
      },

      /** Legacy: moves one card forward without any scoring. */
      advanceToNextCard: () =>
        set((state) => ({
          currentCardIndex: state.currentCardIndex + 1,
          currentCardState: 'face_down',
          showPassPrompt: false,
        })),

      /** Hides the "Pass to X" prompt (the card index already advanced). */
      dismissPassPrompt: () => set({ showPassPrompt: false }),

      /** Host heat override from the pause menu. */
      adjustHeat: (delta) =>
        set((state) => {
          const cap = state.gameMode === 'family' ? 2 : 5;
          const heatLevel = Math.max(1, Math.min(cap, state.heatLevel + delta));
          return { heatLevel, peakHeat: Math.max(state.peakHeat, heatLevel) };
        }),

      removePlayerFromTurns: (playerId) =>
        set((state) => {
          const players = state.turnRotation.players.filter((p) => p.id !== playerId);
          if (players.length === 0) return {};
          const removedIndex = state.turnRotation.players.findIndex((p) => p.id === playerId);
          let currentIndex = state.turnRotation.currentIndex;
          if (removedIndex !== -1 && removedIndex < currentIndex) currentIndex -= 1;
          return { turnRotation: { players, currentIndex: currentIndex % players.length } };
        }),

      endGame: () => set({ sessionPhase: 'end', showPassPrompt: false }),

      resetGame: () => set({ ...INITIAL }),

      /**
       * Builds the queue and enters the play phase. If the library is too small
       * for the requested count, cardCountTarget shrinks to what is available.
       */
      initializeQueue: (config, library) => {
        const result = buildCardQueue(config, library);
        const modeConfig = GAME_MODES[config.gameMode];
        const target = Math.max(1, Math.min(config.cardCountTarget, result.cards.length || config.cardCountTarget));

        set({
          ...INITIAL,
          cardQueue: result.cards,
          bufferCards: result.buffer,
          cardCountTarget: result.cards.length > 0 ? target : config.cardCountTarget,
          gameMode: config.gameMode,
          heatLevel: modeConfig.entryHeat,
          peakHeat: modeConfig.entryHeat,
          turnRotation: get().turnRotation,
          sessionPhase: 'play',
        });
      },

      /**
       * Wild card effects. Every wild card is +0.5 heat; additionally:
       * - shuffle: reshuffles the next 5 cards
       * - heat_spike: +1 level for the next 3 cards, then back to the pre-spike level
       * - crown: 2-card immunity
       */
      applyWildCardEffect: (wildCardType) => {
        const state = get();
        const cap = state.gameMode === 'family' ? 2 : 5;
        const { newHeat } = calculateHeat({
          currentHeat: state.heatLevel,
          event: 'wild_card',
          consecutiveSkips: state.consecutiveSkips,
          gameMode: state.gameMode,
        });

        switch (wildCardType) {
          case 'shuffle':
            set({
              heatLevel: newHeat,
              cardQueue: applyShuffleWildCard(state.cardQueue, state.currentCardIndex),
            });
            break;
          case 'heat_spike': {
            const spiked = Math.min(newHeat + 1.0, cap);
            set({
              preSpikeHeat: newHeat,
              heatLevel: spiked,
              heatSpikeRemaining: 3,
              peakHeat: Math.max(state.peakHeat, spiked),
            });
            break;
          }
          case 'crown':
            set({ heatLevel: newHeat, crownImmunityRemaining: 2 });
            break;
          default:
            set({ heatLevel: newHeat });
        }
        set({ peakHeat: Math.max(get().peakHeat, get().heatLevel) });
      },
    }),
    {
      name: 'tagai-game',
      version: 1,
      storage: safeStorage(),
      skipHydration: true,
      partialize: (state) => ({
        cardQueue: state.cardQueue,
        bufferCards: state.bufferCards,
        currentCardIndex: state.currentCardIndex,
        cardsPlayed: state.cardsPlayed,
        cardCountTarget: state.cardCountTarget,
        gameMode: state.gameMode,
        skippedCount: state.skippedCount,
        heartedCount: state.heartedCount,
        peakHeat: state.peakHeat,
        heatLevel: state.heatLevel,
        consecutiveSkips: state.consecutiveSkips,
        heatSpikeRemaining: state.heatSpikeRemaining,
        preSpikeHeat: state.preSpikeHeat,
        turnRotation: state.turnRotation,
        crownImmunityRemaining: state.crownImmunityRemaining,
        currentCardState: state.currentCardState,
        showPassPrompt: state.showPassPrompt,
        sessionPhase: state.sessionPhase,
        undoSnapshot: state.undoSnapshot,
      }),
    }
  )
);
