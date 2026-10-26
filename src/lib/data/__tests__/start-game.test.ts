import { describe, it, expect } from 'vitest';
import { allAgreed, playOrder } from '../start-game';
import { DEFAULT_CONFIG, type Room } from '../rooms';

const p = (id: string, order: number) => ({ id, userId: id, displayName: id, avatarUrl: 'c0', turnOrder: order, agreedToRules: false });
const room = (ids: string[], agreed: string[]): Room => ({
  code: 'ABC123', hostId: 'a', status: 'lobby', players: ids.map(p), agreedPlayers: agreed, config: DEFAULT_CONFIG, createdAt: 0,
});

describe('allAgreed', () => {
  it('needs at least two players', () => expect(allAgreed(room(['a'], ['a']))).toBe(false));
  it('needs everyone to agree', () => expect(allAgreed(room(['a', 'b'], ['a']))).toBe(false));
  it('is true when all agreed', () => expect(allAgreed(room(['a', 'b'], ['a', 'b']))).toBe(true));
});

describe('playOrder', () => {
  it('follows the seats the host arranged, not who agreed first', () => {
    const r = room(['a', 'b', 'c'], ['c', 'a', 'b']);
    const seated = { ...r, players: r.players.map((x) => ({ ...x, turnOrder: { c: 0, a: 1, b: 2 }[x.userId] as number })) };
    const order = playOrder(seated);
    expect(order.map((x) => x.userId)).toEqual(['c', 'a', 'b']);
    expect(order.map((x) => x.turnOrder)).toEqual([0, 1, 2]);
  });
});
