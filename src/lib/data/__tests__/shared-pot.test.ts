import { describe, expect, it } from 'vitest';
import { codeFromScan } from '@/components/lobby/QrScanner';
import { DEFAULT_CONFIG, potFunded, skipTopics, type Room } from '@/lib/data/rooms';
import { roomPlan } from '@/lib/data/start-game';

const room = (over: Partial<Room> = {}): Room => ({
  code: 'ABC123', hostId: 'h', status: 'lobby', players: [], agreedPlayers: [], createdAt: 0, online: true,
  config: { ...DEFAULT_CONFIG, picks: { decks: ['icebreaker'], sources: [] }, pot: 10 }, ...over,
});

describe('shared pot', () => {
  it('online cards are whatever everyone put in', () => {
    const r = room({ paid: { a: 12, b: 8 } });
    expect(potFunded(r)).toBe(20);
    expect(roomPlan(r).cards).toBe(20);
  });
  it('skip topics are everyone\'s picks together', () => {
    const r = room({ skips: { a: ['ex', 'money'], b: ['ex', 'work'] } });
    expect(skipTopics(r).sort()).toEqual(['ex', 'money', 'work']);
  });
  it('reads a room code from a scanned link or a bare code', () => {
    expect(codeFromScan('https://tag.ai/join?code=abc123')).toBe('ABC123');
    expect(codeFromScan(' xy7k2m ')).toBe('XY7K2M');
    expect(codeFromScan('https://example.com/')).toBeNull();
  });
});
