import { CURATED_CARDS } from '@/lib/data/cards';
import { ADULT_CARDS } from '@/lib/data/adult-cards';
import { TOOL_CARDS, ADULT_TOOL_CARDS } from '@/lib/data/tool-cards';
import { PACK_CARDS, SHOP_ITEMS } from '@/lib/data/shop-catalogue';
import type { QueuedCard } from '@/lib/game/escalation-engine';

/** Single place that decides which cards exist for a player, so 18+ content can never leak when it is off. */
export const adultPackIds = new Set(SHOP_ITEMS.filter((i) => i.adult).map((i) => i.id));

export function libraryCards(adult: boolean): QueuedCard[] {
  return adult ? [...CURATED_CARDS, ...TOOL_CARDS, ...ADULT_CARDS, ...ADULT_TOOL_CARDS] : [...CURATED_CARDS, ...TOOL_CARDS];
}

export function ownedPackCards(owned: string[], adult: boolean): QueuedCard[] {
  return owned.filter((id) => adult || !adultPackIds.has(id)).flatMap((id) => PACK_CARDS[id] ?? []);
}

/** The Auto pool: library plus owned packs. */
export function autoPool(owned: string[], adult: boolean): QueuedCard[] {
  return [...libraryCards(adult), ...ownedPackCards(owned, adult)];
}

/** Finds a library card by id. 18+ cards are not found while the setting is off. */
export function findCard(id: string, adult: boolean): QueuedCard | undefined {
  return libraryCards(adult).find((c) => c.id === id);
}
