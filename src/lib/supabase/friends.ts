/** Friends: thin wrappers over the friend functions in the database (migration 022). */
import { getBrowserClient } from '@/lib/supabase/browser';

export interface Friend { id: string; username: string; avatar: string; relation: 'friend' | 'incoming' | 'outgoing'; online: boolean }
export type FriendResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const text = (e: { message?: string } | null | undefined): string => {
  const m = typeof e?.message === 'string' ? e.message.trim() : '';
  return !m || /^[{[]/.test(m) ? 'Something went wrong. Check your connection and try again.' : m;
};

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<FriendResult<T>> {
  const sb = getBrowserClient();
  if (!sb) return { ok: false, error: 'Friends need an account.' };
  const { data, error } = await sb.rpc(fn as never, args as never);
  if (error) return { ok: false, error: text(error) };
  return { ok: true, data: data as T };
}

export const listFriends = () => rpc<Friend[]>('list_friends');
/** `sent` when a request was made, `accepted` when they had already asked you. */
export const requestFriend = (name: string) => rpc<'sent' | 'accepted'>('friend_request', { p_name: name });
export const answerFriend = (id: string, accept: boolean) => rpc<null>('respond_friend', { p_id: id, p_accept: accept });
export const removeFriend = (id: string) => rpc<null>('remove_friend', { p_id: id });
export const inviteFriend = (code: string, friendId: string) => rpc<null>('invite_friend', { p_code: code, p_friend: friendId });
