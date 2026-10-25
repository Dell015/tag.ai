import { describe, expect, it } from 'vitest';
import { mergeServer } from '@/lib/data/room-sync';
import { DEFAULT_CONFIG, type Room } from '@/lib/data/rooms';

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
