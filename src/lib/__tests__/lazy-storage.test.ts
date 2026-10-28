import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lazyStorage } from '../storage';

function fakeBrowser() {
  const data = new Map<string, string>();
  const handlers: Record<string, () => void> = {};
  const writes: string[] = [];
  const win = {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => { writes.push(k); data.set(k, v); },
      removeItem: (k: string) => { data.delete(k); },
    },
    addEventListener: (e: string, fn: () => void) => { handlers[e] = fn; },
  };
  const doc = { visibilityState: 'visible', addEventListener: (e: string, fn: () => void) => { handlers[`doc:${e}`] = fn; } };
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', doc);
  return { data, handlers, writes, doc };
}

describe('lazyStorage', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('writes once after a burst of changes, with the newest state', () => {
    const b = fakeBrowser();
    const s = lazyStorage<{ n: number }>(500)!;
    for (let i = 1; i <= 5; i += 1) s.setItem('k', { state: { n: i }, version: 1 });
    expect(b.writes).toHaveLength(0);
    vi.advanceTimersByTime(499);
    expect(b.writes).toHaveLength(0);
    vi.advanceTimersByTime(2);
    expect(b.writes).toEqual(['k']);
    expect(JSON.parse(b.data.get('k')!).state.n).toBe(5);
  });

  it('reads back the waiting state before it is written', () => {
    fakeBrowser();
    const s = lazyStorage<{ n: number }>(500)!;
    s.setItem('k', { state: { n: 7 }, version: 1 });
    expect((s.getItem('k') as { state: { n: number } }).state.n).toBe(7);
  });

  it('writes straight away when the page is hidden or closed', () => {
    const b = fakeBrowser();
    const s = lazyStorage<{ n: number }>(500)!;
    s.setItem('k', { state: { n: 3 }, version: 1 });
    b.doc.visibilityState = 'hidden';
    b.handlers['doc:visibilitychange']();
    expect(b.writes).toEqual(['k']);
    s.setItem('k', { state: { n: 4 }, version: 1 });
    b.handlers.pagehide();
    expect(JSON.parse(b.data.get('k')!).state.n).toBe(4);
  });

  it('removing drops a waiting write', () => {
    const b = fakeBrowser();
    const s = lazyStorage<{ n: number }>(500)!;
    s.setItem('k', { state: { n: 1 }, version: 1 });
    s.removeItem('k');
    vi.advanceTimersByTime(600);
    expect(b.writes).toHaveLength(0);
  });
});
