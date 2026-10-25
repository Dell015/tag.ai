'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useProfileStore } from '@/stores/profile-store';
import { useShopStore } from '@/stores/shop-store';
import { itemById } from '@/lib/data/shop-catalogue';
import { Avatar } from './Avatar';
import { CoinCount } from './CoinAmount';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { useNavItems } from './BottomNav';

/** Desktop navigation: a fixed sidebar with labels, shown from 1024px up. The phone uses the floating tab bar instead. */
export function SideNav() {
  const path = usePathname();
  const items = useNavItems();
  const profile = useProfileStore((s) => s.profile);
  const frameId = useShopStore((s) => s.equipped.frame);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-2 border-line bg-bg px-4 py-6 lg:flex">
      <Link href="/" className="px-3"><Logo /></Link>
      <nav aria-label="Main" className="mt-8 flex flex-col gap-1.5">
        {items.map((i) => {
          const active = i.href === '/' ? path === '/' : i.href === '/me' ? path.startsWith('/me') && !path.startsWith('/me/admin') : path.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined}
              className={cn('flex h-12 items-center gap-3 rounded-xl px-3 text-base font-extrabold transition-colors', active ? 'bg-accent text-onaccent' : 'text-muted hover:bg-panel hover:text-text')}>
              <Icon name={i.icon} size={22} />
              {i.label}
            </Link>
          );
        })}
      </nav>
      {profile && (
        <Link href="/me" className="mt-auto flex items-center gap-3 rounded-xl border-2 border-line p-2.5 hover:bg-panel">
          <Avatar value={profile.avatar} name={profile.username} size={40} frame={frameId ? itemById(frameId)?.value : undefined} />
          <span className="min-w-0">
            <span className="block truncate text-base font-extrabold leading-tight">{profile.username}</span>
            <CoinCount value={profile.coins} className="text-sm text-muted" />
          </span>
        </Link>
      )}
    </aside>
  );
}
