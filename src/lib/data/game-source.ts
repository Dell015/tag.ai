import type { GameSource } from '@/lib/data/rooms';
import { findCard, ownedPackCards } from '@/lib/data/card-pool';
import { SHOP_ITEMS } from '@/lib/data/shop-catalogue';
import { useProfileStore } from '@/stores/profile-store';
import { useShopStore } from '@/stores/shop-store';
import { useStackStore } from '@/stores/stack-store';
import type { QueuedCard } from '@/lib/game/escalation-engine';

/** Cards a source holds right now (18+ cards included: the table confirms 18+ before they play). */
export function sourceCards(src: GameSource): QueuedCard[] {
  if (src.kind === 'liked') return useProfileStore.getState().savedCardIds.map((id) => findCard(id, true)).filter((c): c is QueuedCard => !!c && c.cardType !== 'wild');
  if (src.kind === 'stack') {
    const st = useStackStore.getState().stacks.find((s) => s.id === src.id);
    return (st?.cardIds ?? []).map((id) => findCard(id, true)).filter((c): c is QueuedCard => !!c && c.cardType !== 'wild');
  }
  return ownedPackCards([src.id], true);
}

export const sourceHasAdult = (src: GameSource): boolean => sourceCards(src).some((c) => c.adult);

/** Everything the player can pick besides the built-in decks. Empty ones are left out. */
export function availableSources(): (GameSource & { count: number })[] {
  const out: GameSource[] = [{ kind: 'liked', id: 'liked', name: 'Liked cards' }];
  for (const s of useStackStore.getState().stacks) out.push({ kind: 'stack', id: s.id, name: s.name });
  for (const id of useShopStore.getState().owned) {
    const item = SHOP_ITEMS.find((i) => i.id === id && i.kind === 'pack');
    if (item) out.push({ kind: 'pack', id, name: item.name });
  }
  return out.map((s) => ({ ...s, count: sourceCards(s).length })).filter((s) => s.count > 0);
}
