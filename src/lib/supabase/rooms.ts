/** Online rooms: thin wrappers over the room functions in the database (migration 019). */
import { getBrowserClient } from '@/lib/supabase/browser';
import type { Room } from '@/lib/data/rooms';

export interface RoomReply { version: number; data: Room; stale?: boolean; balance?: number; added?: number; removed?: number }
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
export const apiWithdraw = (code: string, amount: number) => call('withdraw_from_pot', { p_code: code, p_amount: amount });
export const apiSetSkips = (code: string, topics: string[]) => call('set_skips', { p_code: code, p_topics: topics });
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

export const apiStartGame = (code: string, phone: string, queue: unknown, state: unknown, view: unknown) =>
  call('start_game', { p_code: code, p_phone: phone, p_queue: queue, p_state: state, p_view: view });
export const apiTransferGame = (code: string, to: string) => call('transfer_game', { p_code: code, p_to: to });
export const apiClaimGame = (code: string) => call('claim_game', { p_code: code });
export const apiFinishGame = (code: string, status: 'ended' | 'lobby') => call('finish_game', { p_code: code, p_status: status });

/** Reports progress. `refused` is true when someone else now runs the game. */
export async function apiPushGame(code: string, view: unknown, state?: unknown, queue?: unknown): Promise<{ ok: boolean; refused?: boolean }> {
  const sb = getBrowserClient();
  if (!sb) return { ok: false };
  const { error } = await sb.rpc('push_game' as never, { p_code: code, p_view: view, p_state: state ?? null, p_queue: queue ?? null } as never);
  if (!error) return { ok: true };
  const e = error as { code?: string; message?: string };
  return { ok: false, refused: e.code === '42501' || /not running/i.test(e.message ?? '') };
}

export async function apiGetGameState(code: string): Promise<{ state: Record<string, unknown>; queue: { cardQueue: unknown[]; bufferCards: unknown[] }; seq: number } | null> {
  const sb = getBrowserClient();
  if (!sb) return null;
  const { data, error } = await sb.rpc('get_game_state' as never, { p_code: code } as never);
  if (error || !data) return null;
  return data as never;
}

/** Add coins to the pot while the game is running (any player in the room). */
export const apiAddToPot = (code: string, amount: number) => call('add_to_pot', { p_code: code, p_amount: amount });
