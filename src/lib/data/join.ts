import { rooms, withPlayer, MAX_PLAYERS } from '@/lib/data/rooms';
import type { Profile } from '@/stores/profile-store';

/** Room codes are 6 chars A–Z/0–9. Accepts pasted links and sloppy input. */
export function normalizeCode(input: string): string {
  const fromLink = input.match(/\/(?:game|join)\/([A-Za-z0-9]{6})/);
  const raw = fromLink ? fromLink[1] : input;
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
}

export type JoinResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export function joinRoom(input: string, profile: Profile): JoinResult {
  const code = normalizeCode(input);
  if (code.length !== 6) return { ok: false, error: 'Codes are 6 letters/numbers.' };
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "Can't find that room. Check the code with the host." };
  if (room.status !== 'lobby' && !room.players.some((p) => p.userId === profile.id)) {
    return { ok: false, error: 'That game already started.' };
  }
  if (room.players.length >= MAX_PLAYERS && !room.players.some((p) => p.userId === profile.id)) {
    return { ok: false, error: `That room is full (${MAX_PLAYERS} players).` };
  }
  rooms.update(code, (r) =>
    withPlayer(r, { id: profile.id, userId: profile.id, displayName: profile.username, avatarUrl: profile.avatar }),
  );
  return { ok: true, code };
}
