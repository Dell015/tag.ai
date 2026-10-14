'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Play', icon: 'play' },
  { href: '/decks', label: 'Decks', icon: 'cards' },
  { href: '/saved', label: 'Saved', icon: 'heart' },
  { href: '/profile', label: 'Me', icon: 'user' },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t-2 border-line bg-bg">
      <ul className="grid grid-cols-4">
        {ITEMS.map((i) => {
          const active = i.href === '/' ? path === '/' : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? 'page' : undefined}
                className={cn('relative flex h-[4.25rem] flex-col items-center justify-center gap-1 text-sm font-bold', active ? 'text-text' : 'text-muted')}>
                {active && <span className="absolute inset-x-6 top-0 h-1 rounded-b bg-accent" />}
                <Icon name={i.icon} size={26} filled={active && i.icon === 'heart'} />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
