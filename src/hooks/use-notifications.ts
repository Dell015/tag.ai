'use client';
import { useEffect, useState } from 'react';
import { listFriends } from '@/lib/supabase/friends';
import { useAccountStore } from '@/stores/account-store';
import { useInboxStore } from '@/stores/inbox-store';
import { supabaseConfigured } from '@/lib/supabase/config';

/** What wants the player's attention: unread inbox messages and friend requests. Drives the red dots. */
export function useNotifications() {
  const signedIn = useAccountStore((a) => a.status === 'signedIn');
  const unread = useInboxStore((i) => i.unread);
  const load = useInboxStore((i) => i.load);
  const [requests, setRequests] = useState(0);

  useEffect(() => {
    if (!supabaseConfigured || !signedIn) return;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      void load();
      const res = await listFriends();
      if (res.ok) setRequests((res.data ?? []).filter((f) => f.relation === 'incoming').length);
    };
    void tick();
    const t = setInterval(() => void tick(), 20000);
    const onVis = () => { if (document.visibilityState === 'visible') void tick(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [signedIn, load]);

  return { signedIn, unread, requests, total: unread + requests };
}
