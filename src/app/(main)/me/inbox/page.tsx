'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, EmptyState, Screen, Spot, toast } from '@/components/ui';
import { answerFriend, listFriends, type Friend } from '@/lib/supabase/friends';
import { supabaseConfigured } from '@/lib/supabase/config';
import { claimMessage, markInboxRead } from '@/lib/supabase/account';
import { refreshAccount } from '@/components/AuthSync';
import { useInboxStore } from '@/stores/inbox-store';
import { cn } from '@/lib/cn';

const when = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(t).toLocaleDateString('en-PH', { day: 'numeric', month: 'short' });
};

export default function InboxPage() {
  const { messages, loaded, load, patch, markAllRead } = useInboxStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [requests, setRequests] = useState<Friend[]>([]);
  const loadRequests = async () => { const r = await listFriends(); if (r.ok) setRequests((r.data ?? []).filter((f) => f.relation === 'incoming')); };
  useEffect(() => { if (supabaseConfigured) void loadRequests(); }, []);
  const answer = async (f: Friend, accept: boolean) => {
    const r = await answerFriend(f.id, accept);
    if (!r.ok) { toast(r.error, { tone: 'warn' }); return; }
    toast(accept ? `You and ${f.username} are friends now.` : 'Request declined.', { tone: 'ok' });
    void loadRequests();
  };
  // Which messages were unread when the page opened, so the dot stays while you read them.
  const fresh = useRef<Set<string>>(new Set());

  useEffect(() => {
    void (async () => {
      await load();
      fresh.current = new Set(useInboxStore.getState().messages.filter((m) => !m.read).map((m) => m.id));
      markAllRead();
      await markInboxRead();
    })();
  }, [load, markAllRead]);

  const claim = async (id: string, coins: number) => {
    setBusy(id);
    const r = await claimMessage(id);
    setBusy(null);
    if (!r.ok) { toast(r.error ?? 'Could not claim.', { tone: 'warn' }); return; }
    patch(id, { claimed: true, read: true });
    toast(`${coins} coins added`, { tone: 'ok' });
    void refreshAccount();
  };

  return (
    <Screen title="Notifications" back="/me">
      {!supabaseConfigured ? (
        <EmptyState art={<Spot name="bubble" />} title="No inbox here." body="Messages from tag.ai arrive once you are signed in with your email." />
      ) : loaded && messages.length === 0 && requests.length === 0 ? (
        <EmptyState art={<Spot name="bubble" />} title="Nothing yet." body="Friend requests, room invites and coin gifts show up here." />
      ) : (
        <>
        {requests.length > 0 && (
          <section aria-label="Friend requests" className="mt-2">
            <h2 className="mb-2 text-3xl">Friend requests</h2>
            <ul className="space-y-3">
              {requests.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-line/60 bg-panel p-3">
                  <Avatar value={f.avatar} name={f.username} size={48} />
                  <span className="min-w-0 flex-1 truncate text-xl font-bold">{f.username}</span>
                  <Button size="md" onClick={() => void answer(f, true)}>Accept</Button>
                  <Button size="md" variant="secondary" onClick={() => void answer(f, false)}>Decline</Button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <ul className="mt-5 space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-2xl border-2 border-b-4 border-line/60 bg-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex items-center gap-2 text-[1.3rem] leading-tight">
                  {fresh.current.has(m.id) && <span aria-label="New" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />}
                  {m.title}
                </h2>
                <span className="shrink-0 pt-0.5 text-xs font-bold text-muted">{when(m.at)}</span>
              </div>
              {m.body && <p className="mt-2 whitespace-pre-wrap text-base text-muted">{m.body}</p>}
              {m.link && (
                <Link href={m.link} className="mt-3 block"><Button full>Join the room</Button></Link>
              )}
              {m.coins > 0 && (
                <Button className={cn('mt-3', m.claimed && 'pointer-events-none')} full variant={m.claimed ? 'secondary' : 'primary'} disabled={m.claimed || busy === m.id} onClick={() => void claim(m.id, m.coins)}>
                  {m.claimed ? `Claimed ${m.coins} coins` : `Claim ${m.coins} coins`}
                </Button>
              )}
            </li>
          ))}
        </ul>
        </>
      )}
    </Screen>
  );
}
