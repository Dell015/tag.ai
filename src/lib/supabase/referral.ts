/** Invite a friend: 30 coins each when the friend has played their first game (migration 025). */
import { getBrowserClient } from '@/lib/supabase/browser';

export const REF_KEY = 'tagai-ref';
export const REFERRAL_COINS = 30;

export async function claimReferral(code: string): Promise<boolean> {
  const sb = getBrowserClient();
  if (!sb) return false;
  const { data } = await sb.rpc('claim_referral' as never, { p_code: code } as never);
  return data === true;
}

/** Asks the server to pay the invite reward if this player was invited and has now played. Safe to call any time. */
export async function rewardReferral(): Promise<boolean> {
  const sb = getBrowserClient();
  if (!sb) return false;
  const { data } = await sb.rpc('reward_referral' as never);
  return data === true;
}

export async function myReferrals(): Promise<{ code: string; joined: number; paid: number } | null> {
  const sb = getBrowserClient();
  if (!sb) return null;
  const { data, error } = await sb.rpc('my_referrals' as never);
  return error || !data ? null : (data as unknown as { code: string; joined: number; paid: number });
}
