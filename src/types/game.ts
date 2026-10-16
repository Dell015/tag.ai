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

export type WildCardType = 'call_out' | 'voice_note' | 'group_pose' | 'dance_off';

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
  /** Colour key "c0".."c9" (legacy: emoji or URL). Use <Avatar/> to render it. */
  avatarUrl: string;
  turnOrder: number;
  agreedToRules: boolean;
  /** Added by name on the host's phone, without an account. */
  isGuest?: boolean;
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
