/**
 * Deck store: the player's own decks (Library, My decks). Persisted locally.
 * Stage B: decks and deck_cards tables behind the same actions.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { CardCategory, GameMode } from '@/types/game';

export type Audience = 'Barkada' | 'Lovers' | 'Strangers' | 'Family' | 'Workmates' | 'Custom';
export const AUDIENCES: Audience[] = ['Barkada', 'Lovers', 'Strangers', 'Family', 'Workmates', 'Custom'];
export const SLOT = '[SLOT]';
export const MAX_DECK_CARDS = 200;
export const MAX_CARD_CHARS = 200;

export interface DeckCard {
  id: string;
  text: string;
  type: 'question' | 'action';
  intensity: number;
  category: CardCategory;
}

export interface Deck {
  id: string;
  name: string;
  audience: Audience;
  /** The deck colour is one of the six mode colours. */
  color: GameMode;
  cards: DeckCard[];
  visibility: 'private';
  updatedAt: number;
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

interface DeckState {
  decks: Deck[];
  create: (name?: string) => Deck;
  update: (id: string, patch: Partial<Pick<Deck, 'name' | 'audience' | 'color'>>) => void;
  remove: (id: string) => void;
  addCard: (id: string, card: Omit<DeckCard, 'id'>) => DeckCard | null;
  addCards: (id: string, cards: Omit<DeckCard, 'id'>[]) => number;
  updateCard: (id: string, cardId: string, patch: Partial<Omit<DeckCard, 'id'>>) => void;
  removeCard: (id: string, cardId: string) => DeckCard | null;
  restoreCard: (id: string, card: DeckCard, index?: number) => void;
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => {
      const patch = (id: string, fn: (d: Deck) => Deck) =>
        set({ decks: get().decks.map((d) => (d.id === id ? { ...fn(d), updatedAt: Date.now() } : d)) });
      return {
        decks: [],
        create: (name = 'New deck') => {
          const d: Deck = { id: uid('deck'), name, audience: 'Barkada', color: 'barkada', cards: [], visibility: 'private', updatedAt: Date.now() };
          set({ decks: [d, ...get().decks] });
          return d;
        },
        update: (id, p) => patch(id, (d) => ({ ...d, ...p })),
        remove: (id) => set({ decks: get().decks.filter((d) => d.id !== id) }),
        addCard: (id, card) => {
          const d = get().decks.find((x) => x.id === id);
          if (!d || d.cards.length >= MAX_DECK_CARDS) return null;
          const c: DeckCard = { ...card, id: uid('dc') };
          patch(id, (x) => ({ ...x, cards: [...x.cards, c] }));
          return c;
        },
        addCards: (id, cards) => {
          const d = get().decks.find((x) => x.id === id);
          if (!d) return 0;
          const room = MAX_DECK_CARDS - d.cards.length;
          const have = new Set(d.cards.map((c) => c.text));
          const fresh = cards.filter((c) => !have.has(c.text)).slice(0, Math.max(0, room)).map((c) => ({ ...c, id: uid('dc') }));
          if (fresh.length) patch(id, (x) => ({ ...x, cards: [...x.cards, ...fresh] }));
          return fresh.length;
        },
        updateCard: (id, cardId, p) => patch(id, (d) => ({ ...d, cards: d.cards.map((c) => (c.id === cardId ? { ...c, ...p } : c)) })),
        removeCard: (id, cardId) => {
          const c = get().decks.find((d) => d.id === id)?.cards.find((x) => x.id === cardId) ?? null;
          if (c) patch(id, (d) => ({ ...d, cards: d.cards.filter((x) => x.id !== cardId) }));
          return c;
        },
        restoreCard: (id, card, index) => patch(id, (d) => {
          const cards = [...d.cards];
          cards.splice(index ?? cards.length, 0, card);
          return { ...d, cards };
        }),
      };
    },
    {
      name: 'tagai-decks',
      version: 1,
      storage: safeStorage(),
      skipHydration: true,
      partialize: (s) => ({ decks: s.decks }),
    }
  )
);

export const hasSlot = (text: string) => text.includes(SLOT);

/** Deck cards in the shape the game engine uses. */
export function toQueuedCards(deck: Deck): QueuedCard[] {
  return deck.cards.map((c) => ({ id: c.id, text: c.text, cardType: c.type, intensity: c.intensity, category: c.category, topics: [] }));
}

/** Replaces [SLOT] with a pick from `fills`. With no fills, slot cards are left out. */
export function applySlots(cards: QueuedCard[], fills: string[]): QueuedCard[] {
  const clean = fills.map((f) => f.trim()).filter(Boolean);
  return cards.flatMap((c) => {
    if (!hasSlot(c.text)) return [c];
    if (clean.length === 0) return [];
    return [{ ...c, text: c.text.split(SLOT).reduce((acc, part, i) => (i === 0 ? part : acc + clean[(c.id.length + i) % clean.length] + part), '') }];
  });
}
