'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, Sheet, toast } from '@/components/ui';
import { inviteFriend, listFriends, type Friend } from '@/lib/supabase/friends';
import { cn } from '@/lib/cn';

/** Pick friends to send a room invite to. They get it in their inbox with a Join button. */
export function FriendInviteSheet({ open, onClose, code, inRoom }: { open: boolean; onClose: () => void; code: string; inRoom: string[] }) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  useEffect(() => {
    if (!open) return;
    void listFriends().then((r) => setFriends(r.ok ? (r.data ?? []).filter((f) => f.relation === 'friend') : []));
  }, [open]);
  const invite = async (f: Friend) => {
    const res = await inviteFriend(code, f.id);
    if (!res.ok) { toast(res.error, { tone: 'warn' }); return; }
    setSent((s) => [...s, f.id]);
    toast(`Invite sent to ${f.username}.`, { tone: 'ok' });
  };
  const list = (friends ?? []).filter((f) => !inRoom.includes(f.id)).sort((a, b) => Number(b.online) - Number(a.online));
  return (
    <Sheet open={open} onClose={onClose} title="Invite a friend">
      {friends === null ? <p className="text-lg text-muted">Loading</p> : list.length === 0 ? (
        <>
          <p className="text-lg text-muted">{friends.length === 0 ? 'You have no friends added yet.' : 'Everyone you know is already here.'}</p>
          <Link href="/me/friends" className="mt-4 block"><Button full variant="secondary">Go to Friends</Button></Link>
        </>
      ) : (
        <ul>
          {list.map((f) => (
            <li key={f.id} className="flex items-center gap-3 border-b-2 border-line/60 py-2.5">
              <span className="relative shrink-0">
                <Avatar value={f.avatar} name={f.username} size={44} />
                <span aria-label={f.online ? 'Online' : 'Offline'} className={cn('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg', f.online ? 'bg-ok' : 'bg-muted/50')} />
              </span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xl font-bold">{f.username}</span><span className="block text-sm text-muted">{f.online ? 'Online now' : 'Offline'}</span></span>
              <Button size="md" variant={sent.includes(f.id) ? 'secondary' : 'primary'} disabled={sent.includes(f.id)} onClick={() => void invite(f)}>{sent.includes(f.id) ? 'Sent' : 'Invite'}</Button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
