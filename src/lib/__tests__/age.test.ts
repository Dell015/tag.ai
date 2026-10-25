import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ageOn, isAdultBirth, setAgeLock, ageLockLeft, AGE_LOCK_MS } from '../age';

const now = new Date(2026, 9, 25); // 25 Oct 2026

describe('ageOn', () => {
  it('counts whole years and turns 18 on the birthday', () => {
    expect(ageOn(25, 10, 2008, now)).toBe(18);
    expect(ageOn(26, 10, 2008, now)).toBe(17);
    expect(ageOn(24, 10, 2008, now)).toBe(18);
    expect(ageOn(1, 1, 1990, now)).toBe(36);
  });
  it('refuses dates that do not exist or are in the future', () => {
    expect(ageOn(31, 2, 2000, now)).toBeNull();
    expect(ageOn(0, 5, 2000, now)).toBeNull();
    expect(ageOn(5, 13, 2000, now)).toBeNull();
    expect(ageOn(1, 1, 2027, now)).toBeNull();
    expect(ageOn(1, 1, 1800, now)).toBeNull();
    expect(ageOn(NaN, 1, 2000, now)).toBeNull();
  });
  it('knows leap days', () => {
    expect(ageOn(29, 2, 2008, now)).toBe(18);
    expect(ageOn(29, 2, 2007, now)).toBeNull();
  });
});

describe('isAdultBirth', () => {
  it('is true from 18, false under, null when invalid', () => {
    expect(isAdultBirth(25, 10, 2008, now)).toBe(true);
    expect(isAdultBirth(26, 10, 2008, now)).toBe(false);
    expect(isAdultBirth(30, 2, 2000, now)).toBeNull();
  });
});

describe('age lock', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('window', { localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } } });
  });
  it('holds for 24 hours then clears', () => {
    setAgeLock(1000);
    expect(ageLockLeft(1000 + 3600000)).toBe(AGE_LOCK_MS - 3600000);
    expect(ageLockLeft(1005)).toBeGreaterThan(0);
    expect(ageLockLeft(1000 + AGE_LOCK_MS + 1)).toBe(0);
    expect(ageLockLeft(1000 + AGE_LOCK_MS + 2)).toBe(0);
  });
  it('is 0 when never set', () => expect(ageLockLeft(5)).toBe(0));
});
