/**
 * Room repository — the seam between the UI and wherever rooms live.
 *
 * Stage A (now): `localRoomRepository` keeps rooms in localStorage and syncs
 * other tabs with BroadcastChannel/`storage` events, so "multiplayer" can be
 * tested with two browser tabs. Stage B: add a Supabase implementation of
 * `RoomRepository` and swap the export at the bottom — the UI doesn't change.
 */

import type { GameMode, SessionPlayer } from '@/types/game';
import type { Basket, DeckId } from '@/lib/game/decks';
import { generateRoomCode } from '@/lib/validators';

/** A game played from the player's own cards instead of a built-in deck. */
export interface GameSource { kind: 'liked' | 'stack' | 'pack'; id: string; name: string }

export interface RoomConfig {
  cardCountTarget: number;
  gameMode: GameMode | null;
  /** Extra decks mixed with the main one. */
  extraModes?: GameMode[];
  comfortFilters: string[];
  drinkRuleTemplate: string | null;
  customDrinkRules: string[];
  nonDrinkingMode: boolean;
  /** Coin pot: 0 means "not chosen yet" (the setup step fills in a suggestion). */
  potCoins: number;
  potStyle: 'solo' | 'split' | 'chipin';
  /** Chip in: coins (pesos) each player puts in, by user id. Collected in cash by the host. */
  shares?: Record<string, number>;
  /** Short (10 cards) or Long (30 cards). The basket holds the deck and the count. */
  session?: 'short' | 'long';
  /** Own stack, liked cards or an owned pack. When set, the basket is not used. */
  source?: GameSource;
  /** Decks and own cards chosen to play together (duplicates are removed). The pot decides how many cards are played. */
  picks?: { decks: DeckId[]; sources: GameSource[] };
  /** Coins in the pot. One coin is one card. */
  pot?: number;
  /** Cards bought per deck, shared by everyone (I pay it all, or split it). */
  basket?: Basket;
  /** Chip in: what each player buys for themselves, by user id. */
  playerBaskets?: Record<string, Basket>;
  /** Retired with the Library. Kept so older saved rooms still load. */
  deckIds: string[];
  /** Words that fill [SLOT] blanks in the chosen decks. */
  slotFills: string[];
}

export interface Room {
  code: string;
  hostId: string;
  status: 'lobby' | 'active' | 'ended';
  players: SessionPlayer[];
  agreedPlayers: string[];
  config: RoomConfig;
  createdAt: number;
}

export interface RoomRepository {
  create(host: { id: string; name: string; avatar: string }): Room;
  get(code: string): Room | null;
  update(code: string, fn: (room: Room) => Room): Room | null;
  remove(code: string): void;
  /** Called whenever the room changes anywhere (including other tabs). */
  subscribe(code: string, cb: (room: Room | null) => void): () => void;
}

export const DEFAULT_CONFIG: RoomConfig = {
  cardCountTarget: 20,
  gameMode: null,
  comfortFilters: [],
  drinkRuleTemplate: null,
  customDrinkRules: [],
  nonDrinkingMode: false,
  potCoins: 0,
  potStyle: 'solo',
  deckIds: [],
  slotFills: [],
};

const KEY = (code: string) => `tagai-room:${code}`;
const CHANNEL = 'tagai-rooms';

function read(code: string): Room | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY(code));
    return raw ? (JSON.parse(raw) as Room) : null;
  } catch {
    return null;
  }
}

function write(room: Room): void {
  try {
    window.localStorage.setItem(KEY(room.code), JSON.stringify(room));
  } catch {
    /* storage full / blocked: the in-memory store still works */
  }
}

const listeners = new Map<string, Set<(room: Room | null) => void>>();
let channel: BroadcastChannel | null = null;

function emit(code: string) {
  const room = read(code);
  listeners.get(code)?.forEach((cb) => cb(room));
}

function ensureChannel() {
  if (channel || typeof BroadcastChannel === 'undefined') return;
  channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e: MessageEvent<{ code: string }>) => emit(e.data.code);
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('tagai-room:')) emit(e.key.slice('tagai-room:'.length));
  });
}

function notify(code: string) {
  emit(code);
  channel?.postMessage({ code });
}

export const localRoomRepository: RoomRepository = {
  create(host) {
    let code = generateRoomCode();
    for (let i = 0; i < 20 && read(code); i++) code = generateRoomCode();
    const room: Room = {
      code,
      hostId: host.id,
      status: 'lobby',
      players: [
        {
          id: host.id,
          userId: host.id,
          displayName: host.name,
          avatarUrl: host.avatar,
          turnOrder: 0,
          agreedToRules: false,
        },
      ],
      agreedPlayers: [],
      config: { ...DEFAULT_CONFIG },
      createdAt: Date.now(),
    };
    write(room);
    return room;
  },

  get: read,

  update(code, fn) {
    const current = read(code);
    if (!current) return null;
    const next = fn(current);
    write(next);
    notify(code);
    return next;
  },

  remove(code) {
    try {
      window.localStorage.removeItem(KEY(code));
    } catch {
      /* ignore */
    }
    notify(code);
  },

  subscribe(code, cb) {
    ensureChannel();
    let set = listeners.get(code);
    if (!set) listeners.set(code, (set = new Set()));
    set.add(cb);
    return () => set!.delete(cb);
  },
};

/** The repository the app uses. Swap for a Supabase implementation in Stage B. */
export const rooms: RoomRepository = localRoomRepository;

// ─── Helpers shared by the UI ────────────────────────────────────────────────

export const MAX_PLAYERS = 20;

export function nextTurnOrder(room: Room): number {
  return room.players.reduce((max, p) => Math.max(max, p.turnOrder), -1) + 1;
}

/** Adds a player (account or guest) unless they are already in the room. */
export function withPlayer(room: Room, player: Omit<SessionPlayer, 'turnOrder' | 'agreedToRules'>): Room {
  if (room.players.some((p) => p.userId === player.userId)) return room;
  if (room.players.length >= MAX_PLAYERS) return room;
  return {
    ...room,
    players: [...room.players, { ...player, turnOrder: nextTurnOrder(room), agreedToRules: false }],
  };
}

export function withoutPlayer(room: Room, userId: string): Room {
  return {
    ...room,
    players: room.players.filter((p) => p.userId !== userId),
    agreedPlayers: room.agreedPlayers.filter((id) => id !== userId),
  };
}
