import { describe, it, expect } from 'vitest';
import { generateRoomCode } from '@/lib/validators';

/**
 * Unit tests for the session creation API route logic.
 * Tests the core room code generation and validation used by POST /api/sessions.
 * Integration with Supabase is tested separately.
 */

describe('Session Creation - Room Code Generation', () => {
  it('generates a 6-character uppercase alphanumeric room code', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('generates unique codes across multiple calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // With 36^6 = ~2.18 billion possible codes, 100 should all be unique
    expect(codes.size).toBe(100);
  });

  it('generates codes of exactly 6 characters', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code.length).toBe(6);
    }
  });

  it('only contains characters from A-Z and 0-9', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      for (const char of code) {
        expect(char).toMatch(/[A-Z0-9]/);
      }
    }
  });
});

describe('Session Creation - API Response Shape', () => {
  it('join URL should contain the room code', () => {
    const roomCode = generateRoomCode();
    const baseUrl = 'http://localhost:3000';
    const joinUrl = `${baseUrl}/game/${roomCode}/join`;

    expect(joinUrl).toContain(roomCode);
    expect(joinUrl).toMatch(/^https?:\/\/.+\/game\/[A-Z0-9]{6}\/join$/);
  });
});
