/**
 * Validation utility functions for Tag.ai
 * Pure functions for username validation, room code generation, and card count validation.
 */

/**
 * Validates a username string.
 * Returns true if 3-20 chars, alphanumeric + underscores only.
 */
export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Generates a unique 6-character uppercase alphanumeric room code.
 * Characters: A-Z, 0-9
 * Uses crypto.getRandomValues for crypto-safe randomness where available,
 * falls back to Math.random.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 6;

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint8Array(codeLength);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues)
      .map((value) => chars[value % chars.length])
      .join('');
  }

  // Fallback to Math.random
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Validates a card count value.
 * Returns true if integer between 5 and 100 inclusive.
 */
export function validateCardCount(count: number): boolean {
  return Number.isInteger(count) && count >= 5 && count <= 100;
}
