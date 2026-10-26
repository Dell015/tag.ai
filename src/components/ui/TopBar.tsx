'use client';
import Link from 'next/link';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { useProfileStore } from '@/stores/profile-store';
import { useNotifications } from '@/hooks/use-notifications';

/** Profile on the left, notifications on the right. A red dot on the bell when something needs you. */
export function TopBar() {
  const profile = useProfileStore((s) => s.profile);
  const { signedIn, total } = useNotifications();
  return (
    <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),12px)]">
      <Link href="/me" aria-label="Your profile" className="flex h-tap items-center gap-2">
        <Avatar value={profile?.avatar ?? 'c0'} name={profile?.username ?? 'You'} size={40} />
      </Link>
      {signedIn && (
        <Link href="/me/inbox" aria-label={total > 0 ? `Notifications, ${total} new` : 'Notifications'} className="relative flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line">
          <Icon name="bell" />
          {total > 0 && <span aria-hidden className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-danger" />}
        </Link>
      )}
    </div>
  );
}
