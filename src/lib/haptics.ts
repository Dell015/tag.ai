/** Tiny wrapper around the Vibration API (Android; silently ignored elsewhere). */
type Kind = 'tap' | 'success' | 'warn' | 'heavy';
const PATTERNS: Record<Kind, number | number[]> = {
  tap: 12,
  success: [14, 40, 14],
  warn: [30, 40, 30],
  heavy: 45,
};

export function haptic(kind: Kind = 'tap'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* ignore */
  }
}
