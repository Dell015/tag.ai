'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, EmptyState, Screen, Spot, toast } from '@/components/ui';
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
    <Screen title="Inbox" back="/me">
      {!supabaseConfigured ? (
        <EmptyState art={<Spot name="bubble" />} title="No inbox here." body="Messages from tag.ai arrive once you are signed in with your email." />
      ) : loaded && messages.length === 0 ? (
        <EmptyState art={<Spot name="bubble" />} title="Nothing yet." body="Updates and coin gifts from tag.ai show up here." />
      ) : (
        <ul className="mt-2 space-y-3">
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
      )}
    </Screen>
  );
}
