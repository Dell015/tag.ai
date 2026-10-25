/**
 * Age gate helpers. The birth date is used once, on the device, to work out whether the player is 18 or older.
 * It is never stored or sent anywhere: only the yes/no result is saved (profiles.is_adult_confirmed).
 */
export const ADULT_AGE = 18;
export const AGE_LOCK_MS = 24 * 60 * 60 * 1000;
const LOCK_KEY = 'tagai-age-lock';

/** Whole years between a birth date and `now`, or null when the date does not exist or is in the future. */
export function ageOn(day: number, month: number, year: number, now: Date = new Date()): number | null {
  if (![day, month, year].every(Number.isInteger)) return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1) return null;
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (birth.getUTCFullYear() !== year || birth.getUTCMonth() !== month - 1 || birth.getUTCDate() !== day) return null;
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  if (year > y || (year === y && (month > m || (month === m && day > d)))) return null;
  let age = y - year;
  if (m < month || (m === month && d < day)) age -= 1;
  return age;
}

export const isAdultBirth = (day: number, month: number, year: number, now?: Date): boolean | null => {
  const a = ageOn(day, month, year, now);
  return a === null ? null : a >= ADULT_AGE;
};

/** Remembers an under-18 answer on this device so the date cannot simply be retyped. */
export function setAgeLock(now: number = Date.now()): void {
  try { window.localStorage.setItem(LOCK_KEY, String(now)); } catch { /* ignore */ }
}

/** Milliseconds left on the lock, 0 when there is none. */
export function ageLockLeft(now: number = Date.now()): number {
  try {
    const at = Number(window.localStorage.getItem(LOCK_KEY));
    if (!at) return 0;
    const left = at + AGE_LOCK_MS - now;
    if (left <= 0) { window.localStorage.removeItem(LOCK_KEY); return 0; }
    return left;
  } catch { return 0; }
}

export function lockText(ms: number): string {
  const h = Math.ceil(ms / 3600000);
  return h <= 1 ? 'about an hour' : `about ${h} hours`;
}
