import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, actionLabel, activeCount, dateRange, rpcArgs, toCsv, type AuditRow } from '@/lib/audit';

describe('audit helpers', () => {
  it('names actions, with a readable fallback', () => {
    expect(actionLabel('payment.paid')).toBe('Payment confirmed');
    expect(actionLabel('thing.some_new_event')).toBe('Some new event');
  });
  it('counts switched on filters', () => {
    expect(activeCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeCount({ ...DEFAULT_FILTERS, who: 'admins', min: '5', range: '7d' })).toBe(3);
  });
  it('turns ranges into Manila day boundaries', () => {
    const now = new Date('2026-10-26T01:00:00Z'); // 9am in Manila on the 26th
    expect(dateRange({ ...DEFAULT_FILTERS, range: 'today' }, now).from).toBe('2026-10-25T16:00:00.000Z');
    expect(dateRange({ ...DEFAULT_FILTERS, range: '7d' }, now).from).toBe('2026-10-19T16:00:00.000Z');
    const c = dateRange({ ...DEFAULT_FILTERS, range: 'custom', from: '2026-10-01', to: '2026-10-02' }, now);
    expect(c).toEqual({ from: '2026-09-30T16:00:00.000Z', to: '2026-10-02T16:00:00.000Z' });
  });
  it('builds the database arguments and ignores junk numbers', () => {
    const a = rpcArgs({ ...DEFAULT_FILTERS, search: ' hi ', areas: ['coins'], min: 'x', max: '50', sort: 'amount', dir: 'asc' }, 50, 100);
    expect(a).toMatchObject({ p_search: 'hi', p_areas: ['coins'], p_actions: null, p_min: null, p_max: 50, p_sort: 'amount', p_dir: 'asc', p_limit: 50, p_offset: 100 });
  });
  it('escapes csv', () => {
    const row: AuditRow = { id: 1, at: '2026-10-26T00:00:00Z', actor_id: null, actor_label: 'a,b', actor_is_admin: true, action: 'x.y', area: 'x', target_id: null, target_label: null, summary: 'say "hi"', amount: 5, meta: {} };
    const csv = toCsv([row]).split('\n');
    expect(csv[1]).toContain('"a,b"');
    expect(csv[1]).toContain('"say ""hi"""');
  });
});
