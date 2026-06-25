import { GameMode, SessionPlayer } from '@/types/game';
import { create } from 'zustand';

export interface SessionState {
  // Session info
  sessionId: string | null;
  roomCode: string | null;
  hostId: string | null;
  status: 'lobby' | 'active' | 'ended';

  // Players
  players: SessionPlayer[];

  // Setup config
  cardCountTarget: number;
  gameMode: GameMode | null;
  comfortFilters: string[];
  drinkRuleTemplate: string | null;
  customDrinkRules: string[];
  nonDrinkingMode: boolean;

  // House rules
  agreedPlayers: string[]; // user IDs who tapped "I Agree"

  // Actions
  setSession: (session: Partial<SessionState>) => void;
  addPlayer: (player: SessionPlayer) => void;
  removePlayer: (userId: string) => void;
  setPlayerAgreed: (userId: string) => void;

  // Derived
  canStartGame: () => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Session info
  sessionId: null,
  roomCode: null,
  hostId: null,
  status: 'lobby',

  // Players
  players: [],

  // Setup config
  cardCountTarget: 20,
  gameMode: null,
  comfortFilters: [],
  drinkRuleTemplate: null,
  customDrinkRules: [],
  nonDrinkingMode: false,

  // House rules
  agreedPlayers: [],

  // Actions
  setSession: (session) =>
    set((state) => ({ ...state, ...session })),

  addPlayer: (player) =>
    set((state) => {
      // Prevent duplicate players
      if (state.players.some((p) => p.userId === player.userId)) {
        return state;
      }
      return { players: [...state.players, player] };
    }),

  removePlayer: (userId) =>
    set((state) => ({
      players: state.players.filter((p) => p.userId !== userId),
      // Also remove from agreedPlayers if they had agreed
      agreedPlayers: state.agreedPlayers.filter((id) => id !== userId),
    })),

  setPlayerAgreed: (userId) =>
    set((state) => {
      // Prevent duplicate entries
      if (state.agreedPlayers.includes(userId)) {
        return state;
      }
      return { agreedPlayers: [...state.agreedPlayers, userId] };
    }),

  // Derived check: all players agreed and at least 2 players
  canStartGame: () => {
    const { players, agreedPlayers } = get();
    if (players.length < 2) return false;
    return players.every((p) => agreedPlayers.includes(p.userId));
  },
}));
