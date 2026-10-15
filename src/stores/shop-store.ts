/**
 * Shop store: what the player owns and has equipped. Purchases debit the
 * wallet through wallet-store. Stage B: server-side entitlements.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { COIN_PACKAGES, itemById, type ShopItem } from '@/lib/data/shop-catalogue';
import { useWalletStore } from '@/stores/wallet-store';

type Slot = 'frame' | 'back' | 'theme';

interface ShopState {
  owned: string[];
  equipped: Partial<Record<Slot, string>>;
  buy: (itemId: string) => 'ok' | 'owned' | 'short' | 'missing';
  equip: (itemId: string) => void;
  unequip: (slot: Slot) => void;
  /** Test purchase: credits the wallet with a package's coins (developer toggle only). */
  testBuyCoins: (packageId: string) => boolean;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      owned: [],
      equipped: {},
      buy: (itemId) => {
        const item = itemById(itemId);
        if (!item) return 'missing';
        if (get().owned.includes(itemId)) return 'owned';
        if (!useWalletStore.getState().apply('shop', -item.price, `Bought ${item.name}`)) return 'short';
        set({ owned: [...get().owned, itemId] });
        if (item.kind === 'frame' || item.kind === 'back' || item.kind === 'theme') get().equip(itemId);
        return 'ok';
      },
      equip: (itemId) => {
        const item = itemById(itemId);
        if (!item || !get().owned.includes(itemId)) return;
        if (item.kind === 'frame' || item.kind === 'back' || item.kind === 'theme') set({ equipped: { ...get().equipped, [item.kind]: itemId } });
      },
      unequip: (slot) => { const e = { ...get().equipped }; delete e[slot]; set({ equipped: e }); },
      testBuyCoins: (packageId) => {
        const p = COIN_PACKAGES.find((x) => x.id === packageId);
        return !!p && useWalletStore.getState().apply('purchase', p.coins, `${p.name} (test purchase)`);
      },
    }),
    {
      name: 'tagai-shop',
      version: 1,
      storage: safeStorage(),
      skipHydration: true,
      partialize: (s) => ({ owned: s.owned, equipped: s.equipped }),
    }
  )
);

export const equippedItem = (slot: Slot): ShopItem | undefined => {
  const id = useShopStore.getState().equipped[slot];
  return id ? itemById(id) : undefined;
};
