/** Redeem codes: friend codes and vouchers (migration 030). */
import { getBrowserClient } from '@/lib/supabase/browser';
import type { Result } from '@/lib/supabase/account';

export type RedeemResult = { type: 'voucher'; coins: number } | { type: 'friend'; name: string | null };

const text = (e: { message?: string } | null | undefined): string => {
  const m = typeof e?.message === 'string' ? e.message.trim() : '';
  return !m || /^[{[]/.test(m) ? 'Something went wrong. Try again.' : m;
};
const noClient = { ok: false, error: 'Sign in to redeem a code.' } as const;

/** Tries the text as a voucher first, then as another player's code. */
export async function redeemCode(code: string): Promise<Result<RedeemResult>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('redeem_code' as never, { p_code: code } as never);
  return error ? { ok: false, error: text(error) } : { ok: true, data: data as unknown as RedeemResult };
}

export interface AdminCode { code: string; kind: string; value: number; maxUses: number | null; used: number; expiresAt: string | null; active: boolean; note: string | null; createdAt: string }

export async function adminCodes(): Promise<Result<AdminCode[]>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('admin_codes' as never);
  return error ? { ok: false, error: text(error) } : { ok: true, data: (data ?? []) as unknown as AdminCode[] };
}

export async function adminCreateCode(a: { code: string; value: number; maxUses: number | null; days: number | null; note: string }): Promise<Result<string>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('admin_create_code' as never, { p_code: a.code, p_value: a.value, p_max_uses: a.maxUses, p_days: a.days, p_note: a.note } as never);
  return error ? { ok: false, error: text(error) } : { ok: true, data: data as unknown as string };
}

export async function adminSetCodeActive(code: string, active: boolean): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('admin_set_code_active' as never, { p_code: code, p_active: active } as never);
  return error ? { ok: false, error: text(error) } : { ok: true };
}
