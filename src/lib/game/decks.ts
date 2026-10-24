/**
 * The deck catalogue. A deck is a kind of conversation with a price per card.
 * Players buy a number of cards from each deck before the game (the basket).
 * Pools are worked out from the card data, so new cards flow into decks by themselves.
 */
import type { GameMode } from '@/types/game';
import type { QueuedCard } from '@/lib/game/escalation-engine';

export type DeckId = 'icebreaker' | 'family' | 'life' | 'deep' | 'barkada' | 'lovers' | 'spicy' | 'adult' | 'social' | 'chaos';

export interface DeckDef {
  id: DeckId;
  name: string;
  blurb: string;
  /** Coins one card uses from the pot. Every deck costs the same: 1 coin a card. Wild cards are always free. */
  price: number;
  /** Base game mode: sets how likely each heat level is, entry heat and wild card gap. Its colour is the deck colour. */
  mode: GameMode;
  /** Which cards belong to the deck. */
  has: (c: QueuedCard) => boolean;
  /** False while the deck has no cards yet. It is shown as coming soon and cannot be bought. */
  ready: boolean;
  /** Needs every player to confirm they are 18 or older. */
  adult?: boolean;
  /** Can draw adult cards, so it needs the same confirmation. */
  includesAdult?: boolean;
}

const real = (c: QueuedCard) => c.cardType !== 'wild' && !c.adult;
const inCats = (c: QueuedCard, cats: string[]) => cats.includes(c.category);
const RISKY = ['sexual_content', 'past_relationships', 'death', 'trauma', 'mental_health', 'politics', 'religion'];

export const DECKS: DeckDef[] = [
  { id: 'icebreaker', name: 'Icebreaker', blurb: 'Light questions for people who just met', price: 1, mode: 'icebreaker', ready: true,
    has: (c) => real(c) && c.intensity <= 3 && inCats(c, ['hot_takes', 'hypotheticals', 'memories', 'dares']) },
  { id: 'family', name: 'Family', blurb: 'Clean and safe for all ages', price: 1, mode: 'family', ready: true,
    has: (c) => real(c) && c.intensity <= 2 && !c.topics.some((t) => RISKY.includes(t)) && !inCats(c, ['roasts', 'confessions', 'relationships']) },
  { id: 'life', name: 'Life', blurb: 'Work, money, dreams and growing up', price: 1, mode: 'icebreaker', ready: true,
    has: (c) => real(c) && c.intensity <= 4 && inCats(c, ['memories', 'hypotheticals', 'deep_philosophical']) },
  { id: 'deep', name: 'Deep', blurb: 'Honest, slow questions about what matters', price: 1, mode: 'lovers', ready: true,
    has: (c) => real(c) && c.intensity >= 2 && inCats(c, ['deep_philosophical', 'confessions', 'memories']) },
  { id: 'barkada', name: 'Barkada', blurb: 'Banter, roasts and dares for the squad', price: 1, mode: 'barkada', ready: true,
    has: (c) => real(c) && c.intensity >= 2 && inCats(c, ['roasts', 'hot_takes', 'dares', 'controversial', 'confessions']) },
  { id: 'lovers', name: 'Lovers', blurb: 'Love, trust and what you never said', price: 1, mode: 'lovers', ready: true,
    has: (c) => real(c) && c.intensity >= 2 && inCats(c, ['relationships', 'confessions', 'memories']) },
  { id: 'spicy', name: 'Spicy', blurb: 'High heat from the first card', price: 1, mode: 'spicy', ready: true,
    has: (c) => real(c) && c.intensity >= 3 },
  { id: 'adult', name: 'Adult', blurb: 'Flirty to frank, for adults only', price: 1, mode: 'spicy', ready: true, adult: true,
    has: (c) => c.cardType !== 'wild' && !!c.adult },
  { id: 'social', name: 'Social media', blurb: 'The juiciest stories and debates from the internet', price: 1, mode: 'spicy', ready: false,
    has: () => false },
  { id: 'chaos', name: 'Chaos', blurb: 'Everything shuffled together, 18+ cards included', price: 1, mode: 'chaos', ready: true, includesAdult: true,
    has: (c) => c.cardType !== 'wild' },
];

export const DECK_GROUPS: { label: string; hint: string; ids: DeckId[] }[] = [
  { label: 'Easy start', hint: 'A first round or a mixed crowd', ids: ['icebreaker', 'family'] },
  { label: 'Real life', hint: 'Things people actually go through', ids: ['life', 'deep'] },
  { label: 'Your crowd', hint: 'Made for who is at the table', ids: ['barkada', 'lovers'] },
  { label: 'Turn it up', hint: 'More heat, more stories', ids: ['spicy', 'adult', 'social'] },
  { label: 'Everything', hint: 'No rules about what comes next', ids: ['chaos'] },
];

export const DECK_BY_ID: Record<DeckId, DeckDef> = Object.fromEntries(DECKS.map((d) => [d.id, d])) as Record<DeckId, DeckDef>;
export const deckOf = (id: string): DeckDef | undefined => DECK_BY_ID[id as DeckId];

/** A session is a deck played for a set number of cards: Short or Long. */
export const SESSIONS = { short: 10, long: 30 } as const;
export type SessionLength = keyof typeof SESSIONS;
/** Cards offered when the table runs out and wants to keep going (10 coins). */
export const MORE_CARDS = 10;

export type Basket = Partial<Record<DeckId, number>>;

/** Cards available to a deck from a library. */
export function deckPool(deck: DeckDef, library: QueuedCard[]): QueuedCard[] {
  return library.filter(deck.has);
}

/** Adds baskets together (the shared basket plus each player's own). */
export function sumBaskets(...baskets: (Basket | undefined)[]): Basket {
  const out: Basket = {};
  for (const b of baskets) for (const [k, v] of Object.entries(b ?? {})) out[k as DeckId] = (out[k as DeckId] ?? 0) + Math.max(0, v ?? 0);
  return out;
}

export const basketCards = (b: Basket): number => Object.values(b).reduce((a, n) => a + Math.max(0, n ?? 0), 0);

/** Coins a basket costs. */
export function basketCost(b: Basket): number {
  const total = Object.entries(b).reduce((a, [id, n]) => a + (deckOf(id)?.price ?? 0) * Math.max(0, n ?? 0), 0);
  return Math.round(total * 1000) / 1000;
}

/** Decks with at least one card, biggest first, for the name on the recap. */
export function basketNames(b: Basket): string {
  return Object.entries(b).filter(([, n]) => (n ?? 0) > 0).sort((a, c) => (c[1] ?? 0) - (a[1] ?? 0)).map(([id]) => deckOf(id)?.name ?? id).join(' + ');
}

/** True when the basket can draw adult cards (the Adult deck or Chaos), so the table must confirm 18+. */
export const basketHasAdult = (b: Basket): boolean => Object.entries(b).some(([id, n]) => (n ?? 0) > 0 && (deckOf(id)?.adult || deckOf(id)?.includesAdult));
