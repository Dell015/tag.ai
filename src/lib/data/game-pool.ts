import type { GameSource, RoomConfig } from '@/lib/data/rooms';
import { sourceCards } from '@/lib/data/game-source';
import { DECK_BY_ID, deckPool, type DeckId } from '@/lib/game/decks';
import type { QueuedCard } from '@/lib/game/escalation-engine';

export interface Picks { decks: DeckId[]; sources: GameSource[] }

/** Every card the chosen decks and own cards hold. A card that sits in two of them is kept once. */
export function picksPool(picks: Picks, library: QueuedCard[]): QueuedCard[] {
  const seen = new Set<string>();
  const out: QueuedCard[] = [];
  const add = (c: QueuedCard) => { if (!seen.has(c.id)) { seen.add(c.id); out.push(c); } };
  for (const id of picks.decks) { const d = DECK_BY_ID[id]; if (d) deckPool(d, library).forEach(add); }
  for (const s of picks.sources) sourceCards(s).forEach(add);
  return out;
}

/** True when any chosen deck can draw 18+ cards, so the table must confirm everyone is an adult. */
export const picksHaveAdult = (picks: Picks, pool: QueuedCard[]): boolean =>
  picks.decks.some((id) => DECK_BY_ID[id]?.adult || DECK_BY_ID[id]?.includesAdult) || pool.some((c) => c.adult);

export const picksLabel = (picks: Picks): string =>
  [...picks.decks.map((id) => DECK_BY_ID[id]?.name ?? id), ...picks.sources.map((s) => s.name)].join(' + ');

export const roomPicks = (cfg: RoomConfig): Picks | undefined => cfg.picks;
