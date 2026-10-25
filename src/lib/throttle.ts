/**
 * Slows down repeated wrong passwords on this device. This is a courtesy and a first barrier only:
 * the real limit is Supabase Auth's own rate limiting, which an attacker cannot skip by clearing storage.
 */
const KEY = 'tagai-signin-fails';
const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const LOCK_MS = 60 * 1000;

interface State { fails: number; first: number; lockedUntil: number }
const read = (): State => {
  try { return { fails: 0, first: 0, lockedUntil: 0, ...(JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Partial<State>) }; } catch { return { fails: 0, first: 0, lockedUntil: 0 }; }
};
const write = (s: State) => { try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ } };

/** Seconds left on the lock, or 0 when sign in is allowed. */
export function lockSeconds(now = Date.now()): number {
  const s = read();
  return s.lockedUntil > now ? Math.ceil((s.lockedUntil - now) / 1000) : 0;
}

export function recordFailure(now = Date.now()): void {
  const s = read();
  const fresh = now - s.first > WINDOW_MS;
  const fails = (fresh ? 0 : s.fails) + 1;
  write({ fails, first: fresh ? now : s.first, lockedUntil: fails >= MAX_FAILS ? now + LOCK_MS : 0 });
}

export function clearFailures(): void { write({ fails: 0, first: 0, lockedUntil: 0 }); }
