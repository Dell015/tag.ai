import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/supabase/account', () => ({
  rpcSpend: vi.fn(),
  rpcRefund: vi.fn(),
  rpcBuyItem: vi.fn(),
  rpcEquip: vi.fn(),
  setCardMark: vi.fn(),
  loadAccount: vi.fn(),
}));

import * as remote from '@/lib/supabase/account';
import { useAccountStore } from '../account-store';
import { useProfileStore } from '../profile-store';
import { useWalletStore } from '../wallet-store';
import { useShopStore } from '../shop-store';
import { useToastStore } from '../toast-store';
import { applyAccount } from '@/components/AuthSync';

const m = vi.mocked(remote);
const flush = () => new Promise((r) => setTimeout(r, 0));

function signIn(coins = 10) {
  useAccountStore.setState({ status: 'signedIn', userId: 'u1', email: 'a@b.test', needsProfile: false, isAdmin: false });
  useProfileStore.setState({ profile: { id: 'u1', username: 'Ana', avatar: 'c1', coins, createdAt: 1 }, savedCardIds: [], trashedCardIds: [] });
  useWalletStore.setState({ transactions: [] });
  useShopStore.setState({ owned: [], equipped: {} });
  useToastStore.setState({ toasts: [] });
}
const coins = () => useProfileStore.getState().profile?.coins;

beforeEach(() => {
  vi.clearAllMocks();
  signIn();
});

describe('signed in: coins go through the server', () => {
  it('a pot spend calls spend_coins and takes the server balance', async () => {
    m.rpcSpend.mockResolvedValue({ ok: true, data: 7.5 });
    expect(useWalletStore.getState().apply('pot', -2.5, 'Pot')).toBe(true);
    expect(coins()).toBe(7.5);
    await flush();
    expect(m.rpcSpend).toHaveBeenCalledWith('pot', 2.5, 'Pot');
    expect(coins()).toBe(7.5);
  });

  it('when the server refuses, the local change is undone and the player is told', async () => {
    m.rpcSpend.mockResolvedValue({ ok: false, error: 'Not enough coins.' });
    useWalletStore.getState().apply('pot', -4, 'Pot');
    expect(coins()).toBe(6);
    await flush();
    expect(coins()).toBe(10);
    expect(useWalletStore.getState().transactions).toHaveLength(0);
    expect(useToastStore.getState().toasts[0]?.message).toBe('Not enough coins.');
  });

  it('a refund calls refund_coins', async () => {
    m.rpcRefund.mockResolvedValue({ ok: true, data: 10 });
    useProfileStore.setState({ profile: { id: 'u1', username: 'Ana', avatar: 'c1', coins: 8, createdAt: 1 } });
    useWalletStore.getState().apply('refund', 2, 'Unused pot returned');
    await flush();
    expect(m.rpcRefund).toHaveBeenCalledWith(2, 'Unused pot returned');
    expect(coins()).toBe(10);
  });

  it('coins cannot be added from the app (test purchases are off)', () => {
    expect(useWalletStore.getState().apply('purchase', 50, 'test')).toBe(false);
    expect(coins()).toBe(10);
    expect(m.rpcSpend).not.toHaveBeenCalled();
  });

  it('a shop buy uses buy_shop_item once, not spend_coins', async () => {
    m.rpcBuyItem.mockResolvedValue({ ok: true });
    useProfileStore.setState({ profile: { id: 'u1', username: 'Ana', avatar: 'c1', coins: 50, createdAt: 1 } });
    expect(useShopStore.getState().buy('frame-stripe')).toBe('ok');
    await flush();
    expect(m.rpcBuyItem).toHaveBeenCalledWith('frame-stripe');
    expect(m.rpcSpend).not.toHaveBeenCalled();
    expect(useShopStore.getState().owned).toContain('frame-stripe');
  });

  it('a refused shop buy is undone', async () => {
    m.rpcBuyItem.mockResolvedValue({ ok: false, error: 'You already own this' });
    useProfileStore.setState({ profile: { id: 'u1', username: 'Ana', avatar: 'c1', coins: 50, createdAt: 1 } });
    useShopStore.getState().buy('frame-stripe');
    await flush();
    expect(useShopStore.getState().owned).not.toContain('frame-stripe');
    expect(coins()).toBe(50);
  });

  it('saved and trashed cards are written to the server', () => {
    useProfileStore.getState().saveCard('card-001');
    useProfileStore.getState().trashCard('card-002');
    useProfileStore.getState().unsaveCard('card-001');
    expect(m.setCardMark).toHaveBeenCalledWith('saved_cards', 'card-001', true);
    expect(m.setCardMark).toHaveBeenCalledWith('trashed_cards', 'card-002', true);
    expect(m.setCardMark).toHaveBeenCalledWith('saved_cards', 'card-001', false);
  });
});

describe('not signed in: nothing goes to the server', () => {
  it('works on the local mock', () => {
    useAccountStore.setState({ status: 'off' });
    useWalletStore.getState().apply('pot', -2, 'Pot');
    useWalletStore.getState().apply('purchase', 20, 'test');
    useProfileStore.getState().saveCard('x');
    expect(coins()).toBe(28);
    expect(m.rpcSpend).not.toHaveBeenCalled();
    expect(m.setCardMark).not.toHaveBeenCalled();
  });
});

describe('applyAccount', () => {
  it('loads the server account into the stores', () => {
    applyAccount({
      userId: 'u9', email: 'x@y.test',
      profile: { username: 'Bea', avatar: 'c4', coins: 12.5, adultConfirmed: false, createdAt: 5 },
      transactions: [{ id: 't1', kind: 'welcome', amount: 10, note: 'Welcome gift', at: 1 }],
      owned: ['frame-stripe'], equippedIds: ['frame-stripe'], saved: ['card-001'], trashed: ['card-002'], isAdmin: true,
    });
    expect(useAccountStore.getState()).toMatchObject({ status: 'signedIn', needsProfile: false, isAdmin: true });
    expect(useProfileStore.getState().profile).toMatchObject({ id: 'u9', username: 'Bea', coins: 12.5 });
    expect(useProfileStore.getState().savedCardIds).toEqual(['card-001']);
    expect(useWalletStore.getState().transactions[0].kind).toBe('welcome');
    expect(useShopStore.getState().equipped.frame).toBe('frame-stripe');
  });

  it('a new account without a nickname has no profile yet', () => {
    applyAccount({
      userId: 'u9', email: null,
      profile: { username: null, avatar: 'c0', coins: 10, adultConfirmed: false, createdAt: 5 },
      transactions: [], owned: [], equippedIds: [], saved: [], trashed: [], isAdmin: false,
    });
    expect(useAccountStore.getState().needsProfile).toBe(true);
    expect(useProfileStore.getState().profile).toBeNull();
  });

  it('no session clears the local account', () => {
    applyAccount(null);
    expect(useAccountStore.getState().status).toBe('signedOut');
    expect(useProfileStore.getState().profile).toBeNull();
  });
});
