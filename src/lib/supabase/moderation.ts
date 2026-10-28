/** Reporting players and moderating profile photos (migration 031). */
import { getBrowserClient } from '@/lib/supabase/browser';
import type { Result } from '@/lib/supabase/account';

const text = (e: { message?: string } | null | undefined): string => {
  const m = typeof e?.message === 'string' ? e.message.trim() : '';
  return !m || /^[{[]/.test(m) ? 'Something went wrong. Try again.' : m;
};
const noClient = { ok: false, error: 'Not connected' } as const;

export const REPORT_REASONS = ['Rude or hateful', 'Bullying or harassment', 'Spam or fake', 'Not a real name'] as const;

export async function reportPlayer(userId: string, kind: 'player' | 'photo', reason: string | null, postId?: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('report_player' as never, { p_user: userId, p_kind: kind, p_reason: reason, p_post: postId ?? null } as never);
  return error ? { ok: false, error: text(error) } : { ok: true };
}

export interface ReportedPlayer { userId: string; name: string; avatar: string; code: string; reports: number; photoReported: boolean; reasons: string[]; latest: string; postBody: string | null }

export async function adminPlayerReports(): Promise<Result<ReportedPlayer[]>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('admin_player_reports' as never);
  return error ? { ok: false, error: text(error) } : { ok: true, data: (data ?? []) as unknown as ReportedPlayer[] };
}

export interface PhotoPlayer { userId: string; name: string; avatar: string; createdAt: string }

export async function adminPhotos(offset = 0): Promise<Result<PhotoPlayer[]>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('admin_photos' as never, { p_limit: 60, p_offset: offset } as never);
  return error ? { ok: false, error: text(error) } : { ok: true, data: (data ?? []) as unknown as PhotoPlayer[] };
}

/** Puts the player back on a colour, then deletes their stored photo files. No message is sent to the player. */
export async function adminRemovePhoto(userId: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('admin_resolve_player' as never, { p_user: userId, p_action: 'remove_photo' } as never);
  if (error) return { ok: false, error: text(error) };
  const { data: files } = await sb.storage.from('avatars').list(userId);
  if (files?.length) await sb.storage.from('avatars').remove(files.map((f) => `${userId}/${f.name}`));
  return { ok: true };
}

export async function adminDismissReports(userId: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('admin_resolve_player' as never, { p_user: userId, p_action: 'dismiss' } as never);
  return error ? { ok: false, error: text(error) } : { ok: true };
}
