/**
 * Shop store: what the player owns and has equipped. Purchases debit the
 * wallet through wallet-store. Stage B: server-side entitlements.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { COIN_PACKAGES, itemById, type ShopItem } from '@/lib/data/shop-catalogue';
import { useWalletStore } from '@/stores/wallet-store';
import { isConnected } from '@/stores/account-store';
import { rpcBuyItem, rpcEquip } from '@/lib/supabase/account';
import { toast } from '@/stores/toast-store';

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
        const remote = isConnected();
        // Signed in: buy_shop_item on the server writes the ledger row and the ownership, so the wallet does not call it again.
        if (!useWalletStore.getState().apply('shop', -item.price, `Bought ${item.name}`, { remote: false })) return 'short';
        set({ owned: [...get().owned, itemId] });
        if (remote) {
          void rpcBuyItem(itemId).then((res) => {
            if (res.ok) return;
            // The server said no: undo the purchase here.
            set({ owned: get().owned.filter((x) => x !== itemId) });
            const e = { ...get().equipped };
            for (const k of Object.keys(e) as Slot[]) if (e[k] === itemId) delete e[k];
            set({ equipped: e });
            useWalletStore.getState().apply('refund', item.price, `Undo ${item.name}`, { remote: false });
            toast(res.error ?? 'Could not buy this.', { tone: 'warn' });
          });
        }
        if (item.kind === 'frame' || item.kind === 'back' || item.kind === 'theme') get().equip(itemId);
        return 'ok';
      },
      equip: (itemId) => {
        const item = itemById(itemId);
        if (!item || !get().owned.includes(itemId)) return;
        if (item.kind === 'frame' || item.kind === 'back' || item.kind === 'theme') {
          set({ equipped: { ...get().equipped, [item.kind]: itemId } });
          if (isConnected()) void rpcEquip(itemId, true);
        }
      },
      unequip: (slot) => {
        const e = { ...get().equipped };
        const was = e[slot];
        delete e[slot];
        set({ equipped: e });
        if (was && isConnected()) void rpcEquip(was, false);
      },
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
