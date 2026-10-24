/**
 * Everything the app asks of the real database, in one place. All calls use the signed-in
 * player's session and the public key; row-level security and the RPC functions decide what is allowed.
 */
import { getBrowserClient } from '@/lib/supabase/browser';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { TalkTopic } from '@/lib/data/talk-topics';
import type { Remote } from '@/lib/data/remote-content';

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

// ─── Cards and topics ────────────────────────────────────────────────────────

interface CardRow {
  id: string; text: string; kind: string; card_type: 'question' | 'action' | 'wild'; intensity: number; category: string;
  topics: string[] | null; adult: boolean; wild_type: string | null; extra: Record<string, unknown> | null; pack_id: string | null;
}
interface TopicRow { id: string; group: string; format: string | null; text: string; deeper: string | null; a: string | null; b: string | null; topics: string[] | null }

export type RemoteContent = Remote;

/** Cards and talk topics the database says are approved. Row-level security hides retired cards and, until 18+ is confirmed, adult ones. */
export async function loadContent(): Promise<Result<RemoteContent>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const [c, t] = await Promise.all([
    sb.from('cards').select('id,text,kind,card_type,intensity,category,topics,adult,wild_type,extra,pack_id').eq('status', 'approved').order('id').limit(2000),
    sb.from('talk_topics').select('id,group,format,text,deeper,a,b,topics').eq('status', 'approved').order('id').limit(2000),
  ]);
  if (c.error) return { ok: false, error: msg(c.error) };
  if (t.error) return { ok: false, error: msg(t.error) };
  const cards: QueuedCard[] = [];
  const packs: Record<string, QueuedCard[]> = {};
  for (const r of (c.data ?? []) as unknown as CardRow[]) {
    const card: QueuedCard = {
      ...(r.extra ?? {}),
      id: r.id, text: r.text, cardType: r.card_type, intensity: r.intensity, category: r.category as QueuedCard['category'],
      topics: r.topics ?? [], kind: r.kind as QueuedCard['kind'],
      ...(r.adult ? { adult: true } : {}),
      ...(r.wild_type ? { wildCardType: r.wild_type as QueuedCard['wildCardType'] } : {}),
    };
    if (r.pack_id) (packs[r.pack_id] ??= []).push(card);
    else cards.push(card);
  }
  const topics = ((t.data ?? []) as unknown as TopicRow[]).map((r): TalkTopic => ({
    id: r.id, group: r.group as TalkTopic['group'], text: r.text, topics: r.topics ?? [],
    ...(r.format ? { format: r.format as TalkTopic['format'] } : {}),
    ...(r.deeper ? { deeper: r.deeper } : {}),
    ...(r.a ? { a: r.a } : {}), ...(r.b ? { b: r.b } : {}),
  }));
  return { ok: true, data: { cards, topics, packs } };
}

// ─── Admin ───────────────────────────────────────────────────────────────────
// These only work for admins: row-level security and the RPC functions refuse everyone else.

export interface PendingSuggestion { id: string; text: string; kind: string; deckId: string; authorName: string; createdAt: number }
export interface AdminCard { id: string; text: string; kind: string; deckId: string | null; adult: boolean; status: string; source: string }

export async function adminPending(): Promise<Result<PendingSuggestion[]>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.from('suggestions').select('id,text,kind,deck_id,author_id,created_at').eq('status', 'pending').order('created_at').limit(100);
  if (error) return { ok: false, error: msg(error) };
  const rows = (data ?? []) as { id: string; text: string; kind: string; deck_id: string; author_id: string; created_at: string }[];
  const ids = Array.from(new Set(rows.map((r) => r.author_id)));
  const names = new Map<string, string>();
  if (ids.length) {
    const p = await sb.from('public_profiles').select('id,username').in('id', ids);
    for (const r of (p.data ?? []) as { id: string; username: string | null }[]) names.set(r.id, r.username ?? 'Someone');
  }
  return { ok: true, data: rows.map((r) => ({ id: r.id, text: r.text, kind: r.kind, deckId: r.deck_id, authorName: names.get(r.author_id) ?? 'Someone', createdAt: Date.parse(r.created_at) })) };
}

export async function adminApprove(id: string, intensity?: number, category?: string): Promise<Result<string>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('approve_suggestion', { id, intensity: intensity ?? null, category: category ?? null });
  return error ? { ok: false, error: msg(error) } : { ok: true, data: data as string };
}

export async function adminReject(id: string, reason: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.rpc('reject_suggestion', { id, reason: reason.trim() || null });
  return error ? { ok: false, error: msg(error) } : { ok: true };
}

/** Finds cards by words in their text (approved and retired), newest first. */
export async function adminSearchCards(query: string): Promise<Result<AdminCard[]>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const q = query.trim().replace(/[%_,()]/g, ' ').slice(0, 60);
  let req = sb.from('cards').select('id,text,kind,deck_id,adult,status,source').order('created_at', { ascending: false }).limit(30);
  if (q) req = req.ilike('text', `%${q}%`);
  const { data, error } = await req;
  if (error) return { ok: false, error: msg(error) };
  return { ok: true, data: ((data ?? []) as { id: string; text: string; kind: string; deck_id: string | null; adult: boolean; status: string; source: string }[]).map((r) => ({ id: r.id, text: r.text, kind: r.kind, deckId: r.deck_id, adult: r.adult, status: r.status, source: r.source })) };
}

export async function adminRetire(ids: string[]): Promise<Result<number>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.rpc('retire_cards', { card_ids: ids });
  return error ? { ok: false, error: msg(error) } : { ok: true, data: data as number };
}

export async function adminWords(): Promise<Result<string[]>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.from('blocked_words').select('word').order('word');
  return error ? { ok: false, error: msg(error) } : { ok: true, data: ((data ?? []) as { word: string }[]).map((r) => r.word) };
}

export async function adminAddWord(word: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.from('blocked_words').upsert({ word: word.trim().toLowerCase() }, { onConflict: 'word' });
  return error ? { ok: false, error: msg(error) } : { ok: true };
}

export async function adminRemoveWord(word: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.from('blocked_words').delete().eq('word', word);
  return error ? { ok: false, error: msg(error) } : { ok: true };
}

// ─── Stacks ──────────────────────────────────────────────────────────────────

export interface StackData { id: string; name: string; cardIds: string[]; updatedAt: number }

export async function loadStacks(): Promise<Result<StackData[]>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const [s, c] = await Promise.all([
    sb.from('stacks').select('id,name,created_at').order('created_at', { ascending: false }).limit(50),
    sb.from('stack_cards').select('stack_id,card_id').order('added_at').limit(5000),
  ]);
  if (s.error) return { ok: false, error: msg(s.error) };
  if (c.error) return { ok: false, error: msg(c.error) };
  const byStack = new Map<string, string[]>();
  for (const r of (c.data ?? []) as { stack_id: string; card_id: string }[]) byStack.set(r.stack_id, [...(byStack.get(r.stack_id) ?? []), r.card_id]);
  return { ok: true, data: ((s.data ?? []) as { id: string; name: string; created_at: string }[]).map((r) => ({ id: r.id, name: r.name, cardIds: byStack.get(r.id) ?? [], updatedAt: Date.parse(r.created_at) })) };
}

export async function createStackRemote(name: string): Promise<Result<string>> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { data, error } = await sb.from('stacks').insert({ name }).select('id').single();
  return error || !data ? { ok: false, error: msg(error) } : { ok: true, data: (data as { id: string }).id };
}

export async function renameStackRemote(id: string, name: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.from('stacks').update({ name }).eq('id', id);
  return error ? { ok: false, error: msg(error) } : { ok: true };
}

export async function deleteStackRemote(id: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.from('stacks').delete().eq('id', id);
  return error ? { ok: false, error: msg(error) } : { ok: true };
}

export async function addStackCardsRemote(id: string, cardIds: string[]): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.from('stack_cards').upsert(cardIds.map((card_id) => ({ stack_id: id, card_id })), { onConflict: 'stack_id,card_id', ignoreDuplicates: true });
  return error ? { ok: false, error: msg(error) } : { ok: true };
}

export async function removeStackCardRemote(id: string, cardId: string): Promise<Result> {
  const sb = getBrowserClient();
  if (!sb) return noClient;
  const { error } = await sb.from('stack_cards').delete().eq('stack_id', id).eq('card_id', cardId);
  return error ? { ok: false, error: msg(error) } : { ok: true };
}
