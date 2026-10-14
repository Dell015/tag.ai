'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const ITEMS = [
  { href: '/', label: 'Play', icon: '🍻' },
  { href: '/decks', label: 'Decks', icon: '🃏' },
  { href: '/saved', label: 'Saved', icon: '❤️' },
  { href: '/profile', label: 'Me', icon: '😎' },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t border-white/10 bg-bg/90 px-2 pt-2 backdrop-blur">
      <ul className="grid grid-cols-4 gap-1">
        {ITEMS.map((i) => {
          const active = i.href === '/' ? path === '/' : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? 'page' : undefined}
                className={cn('flex h-16 flex-col items-center justify-center rounded-2xl text-xs font-semibold', active ? 'bg-elevated text-ink' : 'text-muted')}
              >
                <span className="text-2xl leading-none">{i.icon}</span>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
