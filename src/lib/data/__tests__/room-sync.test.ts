import { describe, expect, it } from 'vitest';
import { mergeServer } from '@/lib/data/room-sync';
import { DEFAULT_CONFIG, potFunded, type Room } from '@/lib/data/rooms';

const p = (id: string, extra: object = {}) => ({ id, userId: id, displayName: id, avatarUrl: 'c0', turnOrder: 0, agreedToRules: false, ...extra });
const room = (players: ReturnType<typeof p>[], agreed: string[]): Room => ({
  code: 'ABC123', hostId: 'host', status: 'lobby', players, agreedPlayers: agreed, config: { ...DEFAULT_CONFIG }, createdAt: 1, online: true,
});

describe('mergeServer', () => {
  it('keeps the host\'s guests and takes accounts that joined on the server', () => {
    const local = room([p('host'), p('guest-1', { isGuest: true })], []);
    const server = room([p('host'), p('friend')], []);
    const merged = mergeServer(local, server);
    expect(merged.players.map((x) => x.userId).sort()).toEqual(['friend', 'guest-1', 'host']);
  });
  it('unions who agreed, in server order first', () => {
    const local = room([p('host'), p('friend')], ['host']);
    const server = room([p('host'), p('friend')], ['friend']);
    expect(mergeServer(local, server).agreedPlayers).toEqual(['friend', 'host']);
  });
  it('drops agreement from people who left', () => {
    const local = room([p('host')], ['host', 'gone']);
    const server = room([p('host')], []);
    expect(mergeServer(local, server).agreedPlayers).toEqual(['host']);
  });
  it('keeps the host\'s own settings', () => {
    const local = { ...room([p('host')], []), status: 'active' as const };
    expect(mergeServer(local, room([p('host')], [])).status).toBe('active');
  });
});

describe('seats', () => {
  it('keeps the seat order the host set', () => {
    const local = room([p('host', { turnOrder: 1 }), p('friend', { turnOrder: 0 })], []);
    const server = room([p('host', { turnOrder: 0 }), p('friend', { turnOrder: 1 })], []);
    const merged = mergeServer(local, server);
    expect(merged.players.find((x) => x.userId === 'friend')?.turnOrder).toBe(0);
    expect(merged.players.find((x) => x.userId === 'host')?.turnOrder).toBe(1);
  });
});

describe('pot', () => {
  it('adds up what everyone paid', () => {
    expect(potFunded({ ...room([p('host')], []), paid: { a: 4, b: 6 } })).toBe(10);
    expect(potFunded(room([p('host')], []))).toBe(0);
  });
  it('takes the server\'s payments, never the host\'s own copy', () => {
    const local = { ...room([p('host')], []), paid: { host: 999 } };
    const server = { ...room([p('host')], []), paid: { host: 3 } };
    expect(mergeServer(local, server).paid).toEqual({ host: 3 });
  });
});
