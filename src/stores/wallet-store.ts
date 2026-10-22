/**
 * Wallet store: the coin history. The balance itself lives on the profile
 * (`profile.coins`); every change goes through here so it has a ledger row.
 * Stage B: replaced by the transactions table plus server-side balance.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { useProfileStore } from '@/stores/profile-store';
import { isConnected } from '@/stores/account-store';
import { rpcSpend, rpcRefund } from '@/lib/supabase/account';
import { useToastStore } from '@/stores/toast-store';

export type TxKind = 'welcome' | 'purchase' | 'pot' | 'refund' | 'topup' | 'referral' | 'shop' | 'reward';

export interface Transaction {
  id: string;
  kind: TxKind;
  amount: number; // signed
  note: string;
  at: number;
}

interface WalletState {
  transactions: Transaction[];
  /**
   * Adds a row and changes the profile balance. Returns false when a debit cannot be covered.
   * When signed in, the change is also made on the server, which is the source of truth: if the server
   * says no, the local change is undone. Pass `remote: false` when another call already handled the server (shop buys).
   */
  apply: (kind: TxKind, amount: number, note: string, opts?: { remote?: boolean }) => boolean;
  clear: () => void;
}

const id = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      transactions: [],
      apply: (kind, amount, note, opts) => {
        const profile = useProfileStore.getState().profile;
        if (!profile || amount === 0) return false;
        if (profile.coins + amount < -1e-9) return false;
        const remote = isConnected() && opts?.remote !== false;
        // Coins can only be added by the server (payments come last), so no local credit when signed in.
        if (remote && (kind === 'purchase' || kind === 'topup' || kind === 'welcome' || kind === 'referral' || kind === 'reward')) return false;
        const txId = id();
        useProfileStore.getState().updateProfile({ coins: r2(profile.coins + amount) });
        set({ transactions: [{ id: txId, kind, amount: r2(amount), note, at: Date.now() }, ...get().transactions].slice(0, 200) });
        if (remote) {
          const call = amount < 0 && (kind === 'pot' || kind === 'shop' || kind === 'purchase')
            ? rpcSpend(kind, -amount, note)
            : amount > 0 && kind === 'refund' ? rpcRefund(amount, note) : null;
          if (call) {
            void call.then((res) => {
              if (res.ok && typeof res.data === 'number') {
                useProfileStore.getState().updateProfile({ coins: r2(res.data) });
              } else if (!res.ok) {
                const p = useProfileStore.getState().profile;
                if (p) useProfileStore.getState().updateProfile({ coins: r2(p.coins - amount) });
                set({ transactions: get().transactions.filter((t) => t.id !== txId) });
                useToastStore.getState().show(res.error ?? 'Could not update your coins.', { tone: 'warn' });
              }
            });
          }
        }
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
