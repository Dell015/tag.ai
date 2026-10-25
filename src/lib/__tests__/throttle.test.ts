import { beforeEach, describe, expect, it } from 'vitest';
import { clearFailures, lockSeconds, recordFailure } from '@/lib/throttle';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) } };
});

describe('sign in throttle', () => {
  it('locks after five wrong tries and unlocks after a minute', () => {
    const t = 1_000_000;
    for (let i = 0; i < 4; i++) recordFailure(t + i);
    expect(lockSeconds(t + 10)).toBe(0);
    recordFailure(t + 5);
    expect(lockSeconds(t + 10)).toBeGreaterThan(0);
    expect(lockSeconds(t + 61_000)).toBe(0);
  });
  it('clears after a good sign in', () => {
    for (let i = 0; i < 5; i++) recordFailure(1000);
    clearFailures();
    expect(lockSeconds(1001)).toBe(0);
  });
});
