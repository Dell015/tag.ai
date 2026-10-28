/**
 * Game Store — Zustand store for managing all gameplay state on the host device.
 *
 * During active gameplay, the host device maintains the full game state locally:
 * card queue, heat level, turn rotation, cards played, and escalation effects.
 * This ensures zero-latency card draws regardless of network conditions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { lazyStorage } from '@/lib/storage';
import { drawForHeat } from '@/lib/game/steering';
import { calculateHeat, heatPace, QueuedCard } from '@/lib/game/escalation-engine';
import { advanceTurn, TurnState } from '@/lib/game/turn-rotation';
import { buildCardQueue, buildBasketQueue, CardQueueConfig, BasketQueue } from '@/lib/game/card-queue-builder';
import { deckOf, type DeckId } from '@/lib/game/decks';
import { GAME_MODES, blendModes } from '@/lib/game/game-modes';
import { WILD_CARD_DEFINITIONS, decrementHeatSpike, decrementCrownImmunity } from '@/lib/game/wild-cards';
import { cardCost, round3 } from '@/lib/game/pot';
import { focusUpcoming, addToTurns, movePlayer as movePlayerInTurns, type FocusKind } from '@/lib/game/mid-game';
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
  pot: number;
  /** Whose turn it was, so going back still works when players were added or moved. */
  playerId?: string;
  kind: 'dismiss' | 'trash' | 'skip' | 'again';
}

export interface GameState {
  /** The last few card moves, newest last. In memory only. */
  history: UndoSnapshot[];
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

  /** Short line of the rule card in force. Cleared by the next wild card. */
  activeRule: string | null;

  // UI state
  currentCardState: 'face_down' | 'revealed' | 'dismissing';
  showPassPrompt: boolean;
  sessionPhase: 'lobby' | 'setup' | 'play' | 'end';

  // Coin pot (remaining and starting coins; refunded is what went back at the end)
  pot: number;
  potStart: number;
  potRefunded: number;

  // Undo
  undoSnapshot: UndoSnapshot | null;

  // Actions
  flipCard: () => void;
  /** Turns a rule on (a rule card was revealed) or off (null, a wild card came up). */
  setRule: (rule: string | null) => void;
  dismissCard: () => void;
  /** Done, then another card for the same player. */
  againCard: () => void;
  skipCard: () => void;
  trashCard: () => void;
  heartCard: () => void;
  undoLastCard: () => void;
  /** Goes back to the previous card (up to 5 times): its player, heat and count come back. Not saved with the game. */
  prevCard: () => boolean;
  advanceToNextCard: () => void;
  dismissPassPrompt: () => void;
  adjustHeat: (delta: number) => void;
  removePlayerFromTurns: (playerId: string) => void;
  endGame: () => void;
  resetGame: () => void;
  initializeQueue: (config: CardQueueConfig, library: QueuedCard[]) => void;
  /** Starts a game from a queue built out of a basket (cards bought per deck). */
  initializeBasket: (queue: BasketQueue, gameMode: GameMode) => void;
  applyWildCardEffect: (wildCardType?: WildCardType) => void;
  /** Pulls deep questions or dares forward in the queue. Returns how many cards matched. */
  focusNext: (kind: FocusKind) => number;
  /** Switches to another deck for the rest of the game. */
  changeMood: (deck: DeckId, library: QueuedCard[], opts: { comfortFilters: string[]; trashedCardIds: string[] }) => void;
  addPlayerToTurns: (p: { id: string; name: string; avatarUrl: string }) => void;
  movePlayer: (id: string, dir: -1 | 1) => void;
  /** Adds more cards after the last one (pay as you go) and carries on playing. */
  extendQueue: (cards: QueuedCard[], buffer: QueuedCard[]) => void;
  /** Sets the pot at game start. */
  fundPot: (coins: number) => void;
  /** Adds coins mid-game. */
  topUpPot: (coins: number) => void;
  /** Takes coins out of the pot (heat up). Returns false when the pot cannot cover it. */
  spendPot: (coins: number) => boolean;
  /** Marks what was returned to the wallet and empties the pot. */
  settlePot: () => number;
}

/** `again` finishes this card and draws the next one for the same player (the phone is not passed). */
type CardAction = 'dismiss' | 'trash' | 'skip' | 'again';

const INITIAL: Pick<
  GameState,
  | 'history'
  | 'cardQueue' | 'bufferCards' | 'currentCardIndex' | 'cardsPlayed' | 'cardCountTarget'
  | 'gameMode' | 'skippedCount' | 'heartedCount' | 'peakHeat' | 'heatLevel'
  | 'consecutiveSkips' | 'heatSpikeRemaining' | 'preSpikeHeat' | 'turnRotation'
  | 'crownImmunityRemaining' | 'currentCardState' | 'showPassPrompt' | 'sessionPhase'
  | 'undoSnapshot' | 'pot' | 'potStart' | 'potRefunded' | 'activeRule'
> = {
  history: [],
  activeRule: null,
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
  pot: 0,
  potStart: 0,
  potRefunded: 0,
};

function currentPlayerIdOf(t: TurnState): string | undefined {
  return [...t.players].sort((a, b) => a.turnOrder - b.turnOrder)[t.currentIndex % Math.max(1, t.players.length)]?.id;
}

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
    pot: state.pot,
    playerId: currentPlayerIdOf(state.turnRotation),
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
  /** Skip and Another card both give the same player a new card. */
  const keepTurn = action === 'again' || action === 'skip';
  const consecutiveSkips = action === 'skip' ? state.consecutiveSkips + 1 : 0;

  const { newHeat } = calculateHeat({
    currentHeat: state.heatLevel,
    event,
    consecutiveSkips,
    gameMode: state.gameMode,
    pace: heatPace(state.cardCountTarget),
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
    cardQueue = drawForHeat(cardQueue, newCardIndex, effectiveHeat);
  }

  return {
    cardQueue,
    bufferCards,
    heatLevel: effectiveHeat,
    peakHeat: Math.max(state.peakHeat, effectiveHeat),
    turnRotation: keepTurn ? state.turnRotation : advanceTurn(state.turnRotation),
    cardsPlayed: newCardsPlayed,
    currentCardIndex: newCardIndex,
    currentCardState: 'face_down',
    consecutiveSkips,
    skippedCount: state.skippedCount + (action === 'skip' ? 1 : 0),
    heatSpikeRemaining: newHeatSpikeRemaining,
    crownImmunityRemaining: decrementCrownImmunity(state.crownImmunityRemaining),
    sessionPhase: shouldEnd ? 'end' : state.sessionPhase,
    showPassPrompt: !shouldEnd && !keepTurn,
    pot: round3(Math.max(0, state.pot - (state.cardQueue[state.currentCardIndex] ? cardCost(state.cardQueue[state.currentCardIndex]) : 0))),
    undoSnapshot: snapshot(state, action),
    history: [...state.history.slice(-4), snapshot(state, action)],
  };
}

// ─── Store Creation ──────────────────────────────────────────────────────────

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      flipCard: () => set({ currentCardState: 'revealed' }),
      setRule: (rule) => set({ activeRule: rule }),

      focusNext: (kind) => {
        if (kind === 'mix') return 0;
        const st = get();
        const r = focusUpcoming(st.cardQueue, st.bufferCards, st.currentCardIndex, kind);
        set({ cardQueue: r.queue, bufferCards: r.buffer });
        return r.matched;
      },
      changeMood: (deckId, library, opts) => {
        const st = get();
        const def = deckOf(deckId);
        if (!def) return;
        const seen = st.cardQueue.slice(0, st.currentCardIndex + 1).map((c) => c.id);
        const remaining = st.cardCountTarget - st.currentCardIndex - 1;
        if (remaining <= 0) { set({ gameMode: def.mode }); return; }
        const built = buildBasketQueue(
          { basket: { [deckId]: remaining }, comfortFilters: opts.comfortFilters, trashedCardIds: [...opts.trashedCardIds, ...seen], playerCount: st.turnRotation.players.length, fitPlayers: true },
          library,
        );
        if (built.cards.length === 0) return;
        set({
          gameMode: def.mode,
          cardQueue: [...st.cardQueue.slice(0, st.currentCardIndex + 1), ...built.cards.slice(0, remaining)],
          bufferCards: built.buffer,
        });
      },
      addPlayerToTurns: (p) => set((s) => ({ turnRotation: addToTurns(s.turnRotation, p) })),
      movePlayer: (id, dir) => set((s) => ({ turnRotation: movePlayerInTurns(s.turnRotation, id, dir) })),

      extendQueue: (cards, buffer) => set((s) => ({
        cardQueue: [...s.cardQueue, ...cards],
        bufferCards: buffer,
        cardCountTarget: s.cardCountTarget + cards.length,
        sessionPhase: 'play',
        currentCardState: 'face_down',
        showPassPrompt: false,
        undoSnapshot: null,
      })),
      fundPot: (coins) => set({ pot: coins, potStart: coins, potRefunded: 0 }),
      topUpPot: (coins) => set((s) => ({ pot: round3(s.pot + coins), potStart: round3(s.potStart + coins) })),
      spendPot: (coins) => {
        if (get().pot + 1e-9 < coins) return false;
        set((s) => ({ pot: round3(s.pot - coins) }));
        return true;
      },
      settlePot: () => {
        const left = get().pot;
        if (left <= 0) return 0;
        set({ pot: 0, potRefunded: left });
        return left;
      },

      /** Swipe / "Next": heat +0.3, advances the turn. */
      dismissCard: () => set((state) => resolveCard(state, 'dismiss')),

      /** "Skip": heat −0.2 (−1.0 on the 3rd skip in a row). The same player gets a new card. */
      againCard: () => set((state) => resolveCard(state, 'again')),

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
          pace: heatPace(state.cardCountTarget),
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
          history: get().history.slice(0, -1),
        });
      },

      prevCard: () => {
        const st = get();
        const snap = st.history[st.history.length - 1];
        if (!snap) return false;
        const card = (snap.kind === 'trash' ? snap.cardQueue : st.cardQueue)[snap.currentCardIndex];
        const sorted = [...st.turnRotation.players].sort((a, b) => a.turnOrder - b.turnOrder);
        const at = snap.playerId ? sorted.findIndex((p) => p.id === snap.playerId) : -1;
        set({
          ...(snap.kind === 'trash' ? { cardQueue: snap.cardQueue, bufferCards: snap.bufferCards } : {}),
          currentCardIndex: snap.currentCardIndex,
          cardsPlayed: snap.cardsPlayed,
          heatLevel: snap.heatLevel,
          consecutiveSkips: snap.consecutiveSkips,
          heatSpikeRemaining: snap.heatSpikeRemaining,
          preSpikeHeat: snap.preSpikeHeat,
          crownImmunityRemaining: snap.crownImmunityRemaining,
          skippedCount: Math.max(0, st.skippedCount - (snap.kind === 'skip' ? 1 : 0)),
          // The coin for that card goes back into the pot; replaying it charges again.
          pot: round3(st.pot + (card ? cardCost(card) : 0)),
          turnRotation: { ...st.turnRotation, players: sorted, currentIndex: at >= 0 ? at : st.turnRotation.currentIndex },
          sessionPhase: 'play',
          currentCardState: 'revealed',
          showPassPrompt: false,
          undoSnapshot: null,
          history: st.history.slice(0, -1),
        });
        return true;
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
        const modeConfig = config.extraModes?.length ? blendModes([config.gameMode, ...config.extraModes]) : GAME_MODES[config.gameMode];
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

      initializeBasket: (queue, gameMode) => {
        const entry = blendModes(queue.modes.length ? queue.modes : [gameMode]).entryHeat;
        set({
          ...INITIAL,
          cardQueue: drawForHeat(queue.cards, 0, entry),
          bufferCards: queue.buffer,
          cardCountTarget: queue.target,
          gameMode,
          heatLevel: entry,
          peakHeat: entry,
          turnRotation: get().turnRotation,
          sessionPhase: 'play',
        });
      },

      /** Every wild card is +0.5 heat. The challenge itself is played at the table, nothing lingers. */
      applyWildCardEffect: () => {
        const state = get();
        const { newHeat } = calculateHeat({
          currentHeat: state.heatLevel,
          event: 'wild_card',
          consecutiveSkips: state.consecutiveSkips,
          gameMode: state.gameMode,
          pace: heatPace(state.cardCountTarget),
        });
        set({ heatLevel: newHeat, peakHeat: Math.max(state.peakHeat, newHeat), activeRule: null });
      },
    }),
    {
      name: 'tagai-game',
      version: 3,
      // Version 3 changed the wild cards: take any old ones out of a saved game's queue.
      migrate: (persisted) => {
        const s = persisted as { cardQueue?: QueuedCard[]; bufferCards?: QueuedCard[] };
        const known = Object.keys(WILD_CARD_DEFINITIONS);
        const gone = (c: QueuedCard) => c.cardType === 'wild' && !known.includes(c.wildCardType as string);
        if (Array.isArray(s?.cardQueue)) s.cardQueue = s.cardQueue.filter((c) => !gone(c));
        if (Array.isArray(s?.bufferCards)) s.bufferCards = s.bufferCards.filter((c) => !gone(c));
        return s as never;
      },
      storage: lazyStorage(),
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
        pot: state.pot,
        potStart: state.potStart,
        potRefunded: state.potRefunded,
        activeRule: state.activeRule,
      }),
    }
  )
);
