import { describe, it, expect, vi } from 'vitest';

const rpc = vi.fn();
const from = vi.fn();
vi.mock('@/lib/supabase/browser', () => ({ getBrowserClient: () => ({ rpc, from }) }));

import { adminApprove, adminReject, adminRetire, adminAddWord } from '@/lib/supabase/account';

describe('admin calls', () => {
  it('approve passes the heat and category, or nulls for the defaults', async () => {
    rpc.mockResolvedValue({ data: 'sugg-1', error: null });
    expect(await adminApprove('s1', 3, 'roasts')).toEqual({ ok: true, data: 'sugg-1' });
    expect(rpc).toHaveBeenLastCalledWith('approve_suggestion', { id: 's1', intensity: 3, category: 'roasts' });
    await adminApprove('s1');
    expect(rpc).toHaveBeenLastCalledWith('approve_suggestion', { id: 's1', intensity: null, category: null });
  });
  it('reject trims the reason and sends null when empty', async () => {
    rpc.mockResolvedValue({ error: null });
    await adminReject('s1', '  too long  ');
    expect(rpc).toHaveBeenLastCalledWith('reject_suggestion', { id: 's1', reason: 'too long' });
    await adminReject('s1', '   ');
    expect(rpc).toHaveBeenLastCalledWith('reject_suggestion', { id: 's1', reason: null });
  });
  it('shows the server refusal when a non-admin tries', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Admins only' } });
    expect(await adminRetire(['c1'])).toEqual({ ok: false, error: 'Admins only' });
  });
  it('blocked words are stored lower case', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });
    await adminAddWord('  BadWord ');
    expect(upsert).toHaveBeenCalledWith({ word: 'badword' }, { onConflict: 'word' });
  });
});
