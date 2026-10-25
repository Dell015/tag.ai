/** Online rooms: thin wrappers over the room functions in the database (migration 019). */
import { getBrowserClient } from '@/lib/supabase/browser';
import type { Room } from '@/lib/data/rooms';

export interface RoomReply { version: number; data: Room; stale?: boolean; balance?: number; added?: number }
export type RoomResult = { ok: true; reply: RoomReply } | { ok: false; error: string };

const text = (e: { message?: string } | null | undefined): string => {
  const m = typeof e?.message === 'string' ? e.message.trim() : '';
  return !m || /^[{[]/.test(m) ? 'Something went wrong. Check your connection and try again.' : m;
};

async function call(fn: string, args: Record<string, unknown>): Promise<RoomResult> {
  const sb = getBrowserClient();
  if (!sb) return { ok: false, error: 'Online rooms need an account.' };
  const { data, error } = await sb.rpc(fn as never, args as never);
  if (error) return { ok: false, error: text(error) };
  return { ok: true, reply: data as unknown as RoomReply };
}

export const apiPublishRoom = (code: string, data: Room, version: number | null) =>
  call('publish_room', { p_code: code, p_data: data, p_version: version });
export const apiJoinRoom = (code: string) => call('join_room', { p_code: code });
export const apiContribute = (code: string, amount: number) => call('contribute_room', { p_code: code, p_amount: amount });
export const apiAgreeRoom = (code: string) => call('agree_room', { p_code: code });

/** Null when the room is gone or you are not in it. `error` is set when the call itself failed (offline). */
export async function apiGetRoom(code: string): Promise<{ reply: RoomReply | null; error?: string }> {
  const sb = getBrowserClient();
  if (!sb) return { reply: null, error: 'offline' };
  const { data, error } = await sb.rpc('get_room' as never, { p_code: code } as never);
  if (error) return { reply: null, error: text(error) };
  return { reply: (data as unknown as RoomReply | null) ?? null };
}

export async function apiLeaveRoom(code: string): Promise<void> {
  const sb = getBrowserClient();
  if (!sb) return;
  await sb.rpc('leave_room' as never, { p_code: code } as never);
}
