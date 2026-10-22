/**
 * Everything the app asks of the real database, in one place. All calls use the signed-in
 * player's session and the public key; row-level security and the RPC functions decide what is allowed.
 */
import { getBrowserClient } from '@/lib/supabase/browser';

export interface Result<T = unknown> { ok: boolean; error?: string; data?: T }

interface ProfileRow { id: string; username: string | null; avatar: string; coins: number | string; is_adult_confirmed: boolean; created_at: string }
interface TxRow { id: string; kind: string; amount: number | string; note: string | null; created_at: string }
interface OwnedRow { item_id: string; equipped: boolean }
interface CardIdRow { card_id: string }

export interface AccountData {
  userId: string;
  email: string | null;
  profile: { username: string | null; avatar: string; coins: number; adultConfirmed: boolean; createdAt: number };
  transactions: { id: string; kind: string; amount: number; note: string; at: number }[];
  owned: string[];
  equippedIds: string[];
  saved: string[];
  trashed: string[];
  isAdmin: boolean;
}

const num = (v: number | string): number => (typeof v === 'number' ? v : parseFloat(v));
const msg = (e: { message?: string } | null | undefined): string => e?.message ?? 'Something went wrong. Try again.';
/** Friendly text for the errors the database raises on purpose. */
export const friendly = (m: string): string => {
  if (/Not enough coins/i.test(m)) return 'Not enough coins.';
  if (/name is taken/i.test(m)) return 'That name is taken. Try another.';
  if (/Name must be/i.test(m)) return 'Use 2 to 16 letters, numbers or underscores.';
  if (/rate limit|too many/i.test(m)) return 'Too many tries. Wait a minute and try again.';
  return m;
};

const noClient = { ok: false, error: 'Not connected' } as const;

export async function sendEmailCode(email: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
  return error ? { ok: false, error: friendly(msg(error)) } : { ok: true };
}

export async function verifyEmailCode(email: string, token: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
  return error ? { ok: false, error: 'That code did not work. Check it or ask for a new one.' } : { ok: true };
}

export async function signOutServer(): Promise<void> {
  await getBrowserClient()?.auth.signOut();
}

/** Loads the signed-in player's account, or null when there is no session. */
export async function loadAccount(): Promise<AccountData | null> {
  const sb = getBrowserClient();
  if (!sb) return null;
  const { data: sess } = await sb.auth.getSession();
  const user = sess.session?.user;
  if (!user) return null;

  const [p, t, o, s, tr, a] = await Promise.all([
    sb.from('profiles').select('id, username, avatar, coins, is_adult_confirmed, created_at').eq('id', user.id).maybeSingle(),
    sb.from('transactions').select('id, kind, amount, note, created_at').order('created_at', { ascending: false }).limit(200),
    sb.from('owned_items').select('item_id, equipped'),
    sb.from('saved_cards').select('card_id'),
    sb.from('trashed_cards').select('card_id'),
    sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  const profile = p.data as ProfileRow | null;
  if (!profile) return null;
  const owned = (o.data ?? []) as OwnedRow[];
  return {
    userId: user.id,
    email: user.email ?? null,
    profile: {
      username: profile.username,
      avatar: profile.avatar,
      coins: num(profile.coins),
      adultConfirmed: profile.is_adult_confirmed,
      createdAt: Date.parse(profile.created_at) || Date.now(),
    },
    transactions: ((t.data ?? []) as TxRow[]).map((r) => ({ id: r.id, kind: r.kind, amount: num(r.amount), note: r.note ?? '', at: Date.parse(r.created_at) || Date.now() })),
    owned: owned.map((r) => r.item_id),
    equippedIds: owned.filter((r) => r.equipped).map((r) => r.item_id),
    saved: ((s.data ?? []) as CardIdRow[]).map((r) => r.card_id),
    trashed: ((tr.data ?? []) as CardIdRow[]).map((r) => r.card_id),
    isAdmin: !!a.data,
  };
}

export async function completeProfile(username: string, avatar: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('complete_profile', { username, avatar });
  return error ? { ok: false, error: friendly(msg(error)) } : { ok: true };
}

export async function confirmAdult(): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('confirm_adult');
  return error ? { ok: false, error: friendly(msg(error)) } : { ok: true };
}

export async function rpcSpend(kind: 'pot' | 'shop' | 'purchase', amount: number, note: string): Promise<Result<number>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('spend_coins', { kind, amount, note });
  return error ? { ok: false, error: friendly(msg(error)) } : { ok: true, data: num(data as number | string) };
}

export async function rpcRefund(amount: number, note: string): Promise<Result<number>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('refund_coins', { amount, note });
  return error ? { ok: false, error: friendly(msg(error)) } : { ok: true, data: num(data as number | string) };
}

export async function rpcBuyItem(itemId: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('buy_shop_item', { item_id: itemId });
  return error ? { ok: false, error: friendly(msg(error)) } : { ok: true };
}

export async function rpcEquip(itemId: string, on: boolean): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('equip_item', { item_id: itemId, on_off: on });
  return error ? { ok: false, error: friendly(msg(error)) } : { ok: true };
}

/** Saved and trashed cards. Own rows only; the user id comes from the session by default. */
export async function setCardMark(table: 'saved_cards' | 'trashed_cards', cardId: string, on: boolean): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = on
    ? await sb.from(table).upsert({ card_id: cardId }, { onConflict: 'user_id,card_id', ignoreDuplicates: true })
    : await sb.from(table).delete().eq('card_id', cardId);
  return error ? { ok: false, error: msg(error) } : { ok: true };
}

export async function saveSettings(settings: Record<string, unknown>, userId: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.from('profiles').update({ settings }).eq('id', userId);
  return error ? { ok: false, error: msg(error) } : { ok: true };
}
