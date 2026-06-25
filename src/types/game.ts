/**
 * Core game type definitions for Tag.ai
 * These types are shared across the application for game logic,
 * state management, and API communication.
 */

export type CardCategory =
  | 'hot_takes'
  | 'relationships'
  | 'memories'
  | 'confessions'
  | 'dares'
  | 'hypotheticals'
  | 'controversial'
  | 'roasts'
  | 'deep_philosophical';

export type CardType = 'question' | 'action' | 'wild';

export type SessionStatus = 'lobby' | 'active' | 'ended';

export type GameMode = 'icebreaker' | 'barkada' | 'lovers' | 'spicy' | 'chaos' | 'family';

export type WildCardType =
  | 'role_reversal'
  | 'pick_your_target'
  | 'everyone_answers'
  | 'shuffle'
  | 'heat_spike'
  | 'act_it_out'
  | 'whisper_round'
  | 'free_drink'
  | 'crown';

export interface Card {
  id: string;
  text: string;
  cardType: CardType;
  intensity: number;
  category: CardCategory;
  topics: string[];
  isAction: boolean;
  wildCardType?: WildCardType;
}

export interface SessionPlayer {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  turnOrder: number;
  agreedToRules: boolean;
}

export interface Session {
  id: string;
  hostId: string;
  roomCode: string;
  status: SessionStatus;
  gameMode: GameMode;
  heatLevel: number;
  cardCountTarget: number;
  cardsPlayed: number;
  comfortFilters: string[];
  drinkRuleTemplate: string | null;
  customDrinkRules: string[];
  nonDrinkingMode: boolean;
}
