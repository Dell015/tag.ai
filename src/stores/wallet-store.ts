/**
 * Wallet store: the coin history. The balance itself lives on the profile
 * (`profile.coins`); every change goes through here so it has a ledger row.
 * Stage B: replaced by the transactions table plus server-side balance.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { useProfileStore } from '@/stores/profile-store';

export type TxKind = 'welcome' | 'purchase' | 'pot' | 'refund' | 'topup' | 'referral' | 'shop';

export interface Transaction {
  id: string;
  kind: TxKind;
  amount: number; // signed
  note: string;
  at: number;
}

interface WalletState {
  transactions: Transaction[];
  /** Adds a row and changes the profile balance. Returns false when a debit cannot be covered. */
  apply: (kind: TxKind, amount: number, note: string) => boolean;
  clear: () => void;
}

const id = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      transactions: [],
      apply: (kind, amount, note) => {
        const profile = useProfileStore.getState().profile;
        if (!profile || amount === 0) return false;
        if (profile.coins + amount < -1e-9) return false;
        useProfileStore.getState().updateProfile({ coins: r2(profile.coins + amount) });
        set({ transactions: [{ id: id(), kind, amount: r2(amount), note, at: Date.now() }, ...get().transactions].slice(0, 200) });
        return true;
      },
      clear: () => set({ transactions: [] }),
    }),
    {
      name: 'tagai-wallet',
      version: 1,
      storage: safeStorage(),
      skipHydration: true,
      partialize: (s) => ({ transactions: s.transactions }),
    }
  )
);
