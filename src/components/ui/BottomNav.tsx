'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

const ITEMS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: '/', label: 'Play', icon: 'play', match: ['/'] },
  { href: '/cards', label: 'Cards', icon: 'users', match: ['/cards'] },
  { href: '/stacks', label: 'Stacks', icon: 'cards', match: ['/stacks'] },
  { href: '/shop', label: 'Shop', icon: 'bag', match: ['/shop'] },
  { href: '/me', label: 'Me', icon: 'user', match: ['/me'] },
];

export function BottomNav() {
  const path = usePathname();
  // Tabs only show on the five top-level screens; detail pages and flows own the full screen.
  if (!ITEMS.some((i) => i.href === path)) return null;
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t-2 border-line bg-bg">
      <ul className="grid grid-cols-5">
        {ITEMS.map((i) => {
          const active = i.href === '/' ? path === '/' : i.match.some((m) => path.startsWith(m));
          return (
            <li key={i.href} className="relative">
              {active && <motion.span layoutId="nav-bar" transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-x-5 -top-0.5 h-1 bg-accent" />}
              <Link href={i.href} aria-current={active ? 'page' : undefined}
                className={cn('flex h-[4.25rem] flex-col items-center justify-center gap-1 text-sm font-bold transition-colors', active ? 'text-accent' : 'text-muted')}>
                <Icon name={i.icon} size={24} />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
