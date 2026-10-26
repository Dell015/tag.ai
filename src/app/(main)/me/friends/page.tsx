'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, ConfirmSheet, EmptyState, Icon, Screen, Spot, toast } from '@/components/ui';
import { answerFriend, listFriends, removeFriend, requestFriend, type Friend } from '@/lib/supabase/friends';
import { useAccountStore } from '@/stores/account-store';
import { cn } from '@/lib/cn';

export default function FriendsPage() {
  const signedIn = useAccountStore((a) => a.status === 'signedIn');
  const [list, setList] = useState<Friend[] | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [drop, setDrop] = useState<Friend | null>(null);

  const load = useCallback(async () => {
    const res = await listFriends();
    if (res.ok) setList(res.data ?? []);
  }, []);
  useEffect(() => {
    if (!signedIn) return;
    void load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 30000);
    return () => clearInterval(t);
  }, [signedIn, load]);

  if (!signedIn) {
    return (
      <Screen title="Friends" back="/me">
        <EmptyState art={<Spot name="bubble" />} title="Friends need an account." body="Sign in to add friends, see who is online and invite them to a room." />
        <Link href="/welcome?next=/me/friends" className="mt-4 block"><Button full>Sign in</Button></Link>
      </Screen>
    );
  }

  const add = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    const res = await requestFriend(n);
    setBusy(false);
    if (!res.ok) { toast(res.error, { tone: 'warn' }); return; }
    toast(res.data === 'accepted' ? `You and ${n} are friends now.` : `Request sent to ${n}.`, { tone: 'ok' });
    setName('');
    void load();
  };
  const answer = async (f: Friend, accept: boolean) => {
    const res = await answerFriend(f.id, accept);
    if (!res.ok) toast(res.error, { tone: 'warn' });
    void load();
  };
  const drop2 = async () => {
    if (!drop) return;
    const res = await removeFriend(drop.id);
    setDrop(null);
    if (!res.ok) toast(res.error, { tone: 'warn' });
    void load();
  };

  const incoming = (list ?? []).filter((f) => f.relation === 'incoming');
  const friends = (list ?? []).filter((f) => f.relation === 'friend');
  const outgoing = (list ?? []).filter((f) => f.relation === 'outgoing');

  const row = (f: Friend, actions: React.ReactNode, sub?: string) => (
    <li key={f.id} className="flex items-center gap-3 border-b-2 border-line/60 py-2.5 last:border-b-0">
      <span className="relative shrink-0">
        <Avatar value={f.avatar} name={f.username} size={48} />
        {f.relation === 'friend' && <span aria-label={f.online ? 'Online' : 'Offline'} className={cn('absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-bg', f.online ? 'bg-ok' : 'bg-muted/50')} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xl font-bold">{f.username}</span>
        {(sub || f.relation === 'friend') && <span className="block text-sm text-muted">{sub ?? (f.online ? 'Online now' : 'Offline')}</span>}
      </span>
      {actions}
    </li>
  );

  return (
    <Screen title="Friends" back="/me">
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <input value={name} maxLength={17} onChange={(e) => setName(e.target.value)} placeholder="Add by player name" aria-label="Player name" autoCapitalize="none" autoCorrect="off"
          className="h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent" />
        <Button type="submit" disabled={busy || !name.trim()}><Icon name="plus" size={20} />Add</Button>
      </form>
      <p className="mt-2 text-sm text-muted">Ask your friend for the name on their Me screen.</p>

      {incoming.length > 0 && (
        <section className="mt-6" aria-label="Requests">
          <h2 className="text-3xl">Requests</h2>
          <ul>{incoming.map((f) => row(f, (
            <span className="flex gap-2">
              <Button size="md" onClick={() => void answer(f, true)}>Accept</Button>
              <button aria-label={`Decline ${f.username}`} onClick={() => void answer(f, false)} className="flex h-tap w-11 items-center justify-center text-muted"><Icon name="close" size={20} /></button>
            </span>
          ), 'Wants to be friends'))}</ul>
        </section>
      )}

      <section className="mt-6" aria-label="Friends">
        <h2 className="text-3xl">Friends {friends.length > 0 && <span className="text-xl text-muted">{friends.filter((f) => f.online).length} online</span>}</h2>
        {list === null ? <p className="mt-2 text-muted">Loading</p> : friends.length === 0 ? (
          <p className="mt-2 text-lg text-muted">No friends yet. Add someone by name above.</p>
        ) : (
          <ul>{friends.map((f) => row(f, <button aria-label={`Remove ${f.username}`} onClick={() => setDrop(f)} className="flex h-tap w-11 items-center justify-center text-muted"><Icon name="close" size={20} /></button>))}</ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="mt-6" aria-label="Waiting for an answer">
          <h2 className="text-3xl">Waiting</h2>
          <ul>{outgoing.map((f) => row(f, <Button size="md" variant="secondary" onClick={() => void removeFriend(f.id).then(load)}>Cancel</Button>, 'Request sent'))}</ul>
        </section>
      )}

      <ConfirmSheet open={!!drop} title={`Remove ${drop?.username ?? ''}?`} body="You will no longer see when they are online, and you cannot invite each other. You can add them again later." confirmLabel="Remove" danger onConfirm={() => void drop2()} onClose={() => setDrop(null)} />
    </Screen>
  );
}
