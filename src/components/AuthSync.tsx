'use client';
import { useEffect } from 'react';
import { supabaseConfigured } from '@/lib/supabase/config';
import { getBrowserClient } from '@/lib/supabase/browser';
import { loadAccount, loadStacks, type AccountData } from '@/lib/supabase/account';
import { refreshContent } from '@/lib/content-sync';
import { useStackStore } from '@/stores/stack-store';
import { useAccountStore } from '@/stores/account-store';
import { useProfileStore } from '@/stores/profile-store';
import { useWalletStore, type TxKind } from '@/stores/wallet-store';
import { useShopStore } from '@/stores/shop-store';
import { itemById } from '@/lib/data/shop-catalogue';
import { useHydrated } from '@/lib/hydration';

type Slot = 'frame' | 'back' | 'theme';

/** Puts the server's account into the local stores. The server wins: coins, owned items, saved and trashed cards. */
export function applyAccount(data: AccountData | null) {
  const account = useAccountStore.getState();
  if (!data) {
    account.set({ status: 'signedOut', userId: null, email: null, needsProfile: false, isAdmin: false, adultConfirmed: false });
    useProfileStore.setState({ profile: null, savedCardIds: [], trashedCardIds: [] });
    useWalletStore.setState({ transactions: [] });
    useShopStore.setState({ owned: [], equipped: {} });
    useStackStore.getState().setAll([]);
    return;
  }
  const needsProfile = !data.profile.username;
  account.set({ status: 'signedIn', userId: data.userId, email: data.email, needsProfile, isAdmin: data.isAdmin, adultConfirmed: data.profile.adultConfirmed });
  if (needsProfile) {
    useProfileStore.setState({ profile: null });
    return;
  }
  useProfileStore.setState({
    profile: { id: data.userId, username: data.profile.username ?? '', avatar: data.profile.avatar, coins: data.profile.coins, createdAt: data.profile.createdAt },
    savedCardIds: data.saved,
    trashedCardIds: data.trashed,
  });
  useWalletStore.setState({ transactions: data.transactions.map((t) => ({ id: t.id, kind: t.kind as TxKind, amount: t.amount, note: t.note, at: t.at })) });
  const equipped: Partial<Record<Slot, string>> = {};
  for (const id of data.equippedIds) {
    const k = itemById(id)?.kind;
    if (k === 'frame' || k === 'back' || k === 'theme') equipped[k] = id;
  }
  useShopStore.setState({ owned: data.owned, equipped });
}

/** Reloads the account from the server. Safe to call anywhere. */
export async function refreshAccount(): Promise<void> {
  if (!supabaseConfigured) return;
  const data = await loadAccount();
  applyAccount(data);
  await refreshContent(!!data);
  if (data && data.profile.username) {
    const st = await loadStacks();
    if (st.ok && st.data) useStackStore.getState().setAll(st.data);
  }
}

/** Keeps the local stores in step with the Supabase session. Renders nothing. */
export function AuthSync() {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!supabaseConfigured || !hydrated) return;
    const sb = getBrowserClient();
    if (!sb) return;
    void refreshAccount();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') void refreshAccount();
    });
    // Friends see you as online while the app is open. Supabase calls only run when awaited, so this one is awaited.
    const ping = async () => {
      if (document.visibilityState !== 'visible' || useAccountStore.getState().status !== 'signedIn') return;
      await sb.rpc('touch_presence' as never);
    };
    void ping();
    const beat = setInterval(() => void ping(), 45000);
    const unsubAccount = useAccountStore.subscribe((st, prev) => { if (st.status === 'signedIn' && prev.status !== 'signedIn') void ping(); });
    const onVisible = () => void ping();
    document.addEventListener('visibilitychange', onVisible);
    return () => { sub.subscription.unsubscribe(); clearInterval(beat); unsubAccount(); document.removeEventListener('visibilitychange', onVisible); };
  }, [hydrated]);
  return null;
}
