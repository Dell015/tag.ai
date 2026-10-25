/**
 * Keeps a phone's copy of an online room in step with the server.
 *  - The host owns the room: local changes are pushed (debounced), and players who joined or tapped
 *    "agree" on their own phones are pulled in.
 *  - Everyone else only reads: the server copy replaces the local one.
 * Polls every few seconds while the page is visible, and again the moment the page comes back to the front.
 */
import { rooms, type Room } from '@/lib/data/rooms';
import { refreshAccount } from '@/components/AuthSync';
import { apiAgreeRoom, apiContribute, apiGetRoom, apiJoinRoom, apiLeaveRoom, apiPublishRoom, type RoomReply, type RoomResult } from '@/lib/supabase/rooms';

const POLL_MS = 3000;
const PUSH_MS = 350;

const known = new Map<string, number>();
const active = new Map<string, () => void>();

const sig = (r: Room) => JSON.stringify([r.status, r.players, r.agreedPlayers, r.config]);

/** The host's room with the server's view of who joined and who agreed folded in. */
export function mergeServer(local: Room, server: Room): Room {
  const guests = local.players.filter((p) => p.isGuest);
  const accounts = server.players.filter((p) => !p.isGuest);
  const agreed = Array.from(new Set([...server.agreedPlayers, ...local.agreedPlayers]));
  return { ...local, paid: server.paid ?? local.paid, players: [...accounts, ...guests], agreedPlayers: agreed.filter((id) => [...accounts, ...guests].some((p) => p.userId === id)) };
}

function take(reply: RoomReply, code: string) {
  known.set(code, reply.version);
}

/** Puts the room on the server (the host) so friends can join by code. */
export async function goOnline(code: string): Promise<RoomResult> {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: 'That room is not on this phone.' };
  const res = await apiPublishRoom(code, { ...room, online: true }, known.get(code) ?? null);
  if (res.ok && !res.reply.stale) {
    take(res.reply, code);
    rooms.update(code, (r) => ({ ...r, online: true }));
  }
  return res;
}

/** Join someone else's room by code. Stores it on this phone and returns its code. */
export async function joinOnline(raw: string): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const code = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  if (code.length !== 6) return { ok: false, error: 'Codes are 6 letters or numbers.' };
  const res = await apiJoinRoom(code);
  if (!res.ok) return res;
  take(res.reply, code);
  rooms.put({ ...res.reply.data, code, online: true });
  return { ok: true, code };
}

/** Put coins in the pot from your own wallet. The server takes them and caps the amount at what is left. */
export async function contributeOnline(code: string, amount: number): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  const res = await apiContribute(code, amount);
  if (!res.ok) return res;
  take(res.reply, code);
  rooms.update(code, (r) => ({ ...r, paid: res.reply.data.paid }));
  void refreshAccount();
  return { ok: true, added: res.reply.added ?? amount };
}

/** Tap "I agree" for yourself from your own phone. */
export async function agreeOnline(code: string): Promise<void> {
  const res = await apiAgreeRoom(code);
  if (res.ok) {
    take(res.reply, code);
    const mine = res.reply.data;
    rooms.update(code, (r) => ({ ...r, players: mine.players, agreedPlayers: mine.agreedPlayers }));
  }
}

export async function leaveOnline(code: string): Promise<void> {
  stopSync(code);
  await apiLeaveRoom(code);
  known.delete(code);
}

export function stopSync(code: string) {
  active.get(code)?.();
}

/** Starts the loop for one room. Safe to call twice: the second call does nothing. */
export function startSync(code: string, myId: string): () => void {
  if (active.has(code)) return () => {};
  let stopped = false;
  let pushing = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pushTimer: ReturnType<typeof setTimeout> | undefined;
  let lastPushed = '';
  const isHost = () => rooms.get(code)?.hostId === myId;

  const push = async () => {
    const room = rooms.get(code);
    if (stopped || pushing || !room || room.hostId !== myId || !room.online || sig(room) === lastPushed) return;
    pushing = true;
    try {
      const res = await apiPublishRoom(code, room, known.get(code) ?? null);
      if (res.ok && res.reply.stale) {
        // Someone joined or agreed since we last looked. Fold it in and send again once.
        known.set(code, res.reply.version);
        const merged = mergeServer(room, res.reply.data);
        rooms.update(code, () => merged);
        const again = await apiPublishRoom(code, merged, res.reply.version);
        if (again.ok && !again.reply.stale) { take(again.reply, code); lastPushed = sig(merged); }
      } else if (res.ok) {
        take(res.reply, code);
        lastPushed = sig(room);
      }
    } finally { pushing = false; }
  };

  const poll = async () => {
    if (stopped) return;
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      const { reply, error } = await apiGetRoom(code);
      if (!stopped && !error) {
        if (!reply) {
          // Closed by the host, or you were removed.
          if (!isHost()) { rooms.remove(code); }
        } else if (reply.version !== known.get(code)) {
          const local = rooms.get(code);
          if (!local || !isHost()) {
            known.set(code, reply.version);
            rooms.put({ ...reply.data, code, online: true });
          } else if (!pushing) {
            known.set(code, reply.version);
            const merged = mergeServer(local, reply.data);
            lastPushed = sig(reply.data);
            if (sig(merged) !== sig(local) || JSON.stringify(merged.paid) !== JSON.stringify(local.paid)) rooms.update(code, () => merged);
          }
        }
      }
    }
    timer = setTimeout(poll, POLL_MS);
  };

  const unsub = rooms.subscribe(code, () => {
    if (!isHost()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, PUSH_MS);
  });
  const onVisible = () => { if (document.visibilityState === 'visible') { clearTimeout(timer); void poll(); } };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
  const initial = rooms.get(code);
  if (initial) lastPushed = isHost() ? '' : sig(initial);
  void poll();

  const stop = () => {
    stopped = true;
    clearTimeout(timer); clearTimeout(pushTimer);
    unsub();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    active.delete(code);
  };
  active.set(code, stop);
  return stop;
}
