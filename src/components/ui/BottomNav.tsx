'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

const ITEMS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: '/', label: 'Play', icon: 'play', match: ['/'] },
  { href: '/shop', label: 'Shop', icon: 'bag', match: ['/shop'] },
  { href: '/me', label: 'Me', icon: 'user', match: ['/me'] },
];

export function BottomNav() {
  const path = usePathname();
  // Tabs only show on the three top-level screens; detail pages and flows own the full screen.
  if (!ITEMS.some((i) => i.href === path)) return null;
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t-2 border-line bg-bg">
      <ul className="grid grid-cols-3">
        {ITEMS.map((i) => {
          const active = i.href === '/' ? path === '/' : i.match.some((m) => path.startsWith(m));
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? 'page' : undefined}
                className={cn('relative flex h-[4.25rem] flex-col items-center justify-center gap-0.5 text-sm font-bold', active ? 'text-text' : 'text-muted')}>
                <span className={cn('flex h-8 w-14 items-center justify-center rounded-full transition-colors', active && 'bg-accent text-onaccent')}>
                  <Icon name={i.icon} size={26} />
                </span>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
