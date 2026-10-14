import { describe, it, expect } from 'vitest';
import { allAgreed } from '../start-game';
import { DEFAULT_CONFIG, type Room } from '../rooms';

const p = (id: string, order: number) => ({ id, userId: id, displayName: id, avatarUrl: '😎', turnOrder: order, agreedToRules: false });
const room = (ids: string[], agreed: string[]): Room => ({
  code: 'ABC123', hostId: 'a', status: 'lobby', players: ids.map(p), agreedPlayers: agreed, config: DEFAULT_CONFIG, createdAt: 0,
});

describe('allAgreed', () => {
  it('needs at least two players', () => expect(allAgreed(room(['a'], ['a']))).toBe(false));
  it('needs everyone to agree', () => expect(allAgreed(room(['a', 'b'], ['a']))).toBe(false));
  it('is true when all agreed', () => expect(allAgreed(room(['a', 'b'], ['a', 'b']))).toBe(true));
});
