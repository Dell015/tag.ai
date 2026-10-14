import { describe, it, expect } from 'vitest';
import { normalizeCode } from '../join';

describe('normalizeCode', () => {
  it('uppercases and strips junk', () => {
    expect(normalizeCode(' ab-c 123 ')).toBe('ABC123');
  });
  it('extracts the code from a pasted link', () => {
    expect(normalizeCode('https://tag-ai.vercel.app/game/k3x9pq')).toBe('K3X9PQ');
    expect(normalizeCode('https://tag-ai.vercel.app/join/K3X9PQ')).toBe('K3X9PQ');
  });
  it('caps at 6 characters', () => {
    expect(normalizeCode('abcdefghij')).toBe('ABCDEF');
  });
});
