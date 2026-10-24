import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/account', () => ({
  createStackRemote: vi.fn(async () => ({ ok: true, data: 'server-id' })),
  renameStackRemote: vi.fn(async () => ({ ok: true })),
  deleteStackRemote: vi.fn(async () => ({ ok: true })),
  addStackCardsRemote: vi.fn(async () => ({ ok: true })),
  removeStackCardRemote: vi.fn(async () => ({ ok: true })),
  loadStacks: vi.fn(async () => ({ ok: true, data: [{ id: 's1', name: 'From server', cardIds: ['a'], updatedAt: 1 }] })),
}));

import * as account from '@/lib/supabase/account';
import { useAccountStore } from '@/stores/account-store';
import { MAX_STACKS, MAX_STACK_CARDS, cleanName, useStackStore } from '@/stores/stack-store';

const reset = (connected: boolean) => {
  useStackStore.setState({ stacks: [] });
  useAccountStore.setState({ status: connected ? 'signedIn' : 'signedOut' });
  vi.clearAllMocks();
};

describe('stacks, signed out', () => {
  beforeEach(() => reset(false));

  it('creates, renames and deletes locally without calling the server', async () => {
    const s = await useStackStore.getState().create('  Friday   barkada ');
    expect(s?.name).toBe('Friday barkada');
    useStackStore.getState().rename(s!.id, 'Saturday');
    expect(useStackStore.getState().stacks[0].name).toBe('Saturday');
    useStackStore.getState().remove(s!.id);
    expect(useStackStore.getState().stacks).toEqual([]);
    expect(account.createStackRemote).not.toHaveBeenCalled();
  });

  it('adds each card once and reports how many were new', async () => {
    const s = (await useStackStore.getState().create('x'))!;
    expect(useStackStore.getState().addCards(s.id, ['a', 'b', 'a'])).toBe(2);
    expect(useStackStore.getState().addCards(s.id, ['b', 'c'])).toBe(1);
    expect(useStackStore.getState().stacks[0].cardIds).toEqual(['a', 'b', 'c']);
    useStackStore.getState().removeCard(s.id, 'b');
    expect(useStackStore.getState().stacks[0].cardIds).toEqual(['a', 'c']);
  });

  it('stops at the card and stack limits', async () => {
    const s = (await useStackStore.getState().create('big'))!;
    const many = Array.from({ length: MAX_STACK_CARDS + 20 }, (_, i) => `c${i}`);
    expect(useStackStore.getState().addCards(s.id, many)).toBe(MAX_STACK_CARDS);
    expect(useStackStore.getState().addCards(s.id, ['extra'])).toBe(0);
    for (let i = 1; i < MAX_STACKS; i++) await useStackStore.getState().create(`s${i}`);
    expect(await useStackStore.getState().create('one too many')).toBeNull();
  });

  it('cleans names to 40 characters', () => {
    expect(cleanName('a'.repeat(60))).toHaveLength(40);
  });
});

describe('stacks, signed in', () => {
  beforeEach(() => reset(true));

  it('uses the id the server gives and writes changes through', async () => {
    const s = (await useStackStore.getState().create('Mine'))!;
    expect(s.id).toBe('server-id');
    useStackStore.getState().addCards(s.id, ['a']);
    expect(account.addStackCardsRemote).toHaveBeenCalledWith('server-id', ['a']);
    useStackStore.getState().removeCard(s.id, 'a');
    expect(account.removeStackCardRemote).toHaveBeenCalledWith('server-id', 'a');
    useStackStore.getState().remove(s.id);
    expect(account.deleteStackRemote).toHaveBeenCalledWith('server-id');
  });

  it('does not create a stack when the server refuses', async () => {
    vi.mocked(account.createStackRemote).mockResolvedValueOnce({ ok: false, error: 'You can have up to 20 stacks.' });
    expect(await useStackStore.getState().create('Nope')).toBeNull();
    expect(useStackStore.getState().stacks).toEqual([]);
  });

  it('reloads from the server when a write is refused', async () => {
    const s = (await useStackStore.getState().create('Mine'))!;
    vi.mocked(account.addStackCardsRemote).mockResolvedValueOnce({ ok: false, error: 'refused' });
    useStackStore.getState().addCards(s.id, ['a']);
    await vi.waitFor(() => expect(useStackStore.getState().stacks[0]?.name).toBe('From server'));
  });
});
