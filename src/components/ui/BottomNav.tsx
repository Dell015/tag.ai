'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useScrollHidden } from '@/lib/use-scroll-dir';
import { Icon, type IconName } from './Icon';

export const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Play', icon: 'play' },
  { href: '/cards', label: 'Cards', icon: 'users' },
  { href: '/stacks', label: 'Stacks', icon: 'cards' },
  { href: '/shop', label: 'Shop', icon: 'bag' },
  { href: '/me', label: 'Me', icon: 'user' },
];

/** True on the five top-level screens, where the tab bar lives. */
export const isTabPath = (path: string) => NAV_ITEMS.some((i) => i.href === path);

/**
 * Tab bar. It slides off the bottom while you scroll down and comes back the moment you scroll up,
 * so lists get the whole screen and the way to every other tab is always one flick away.
 */
export function BottomNav() {
  const path = usePathname();
  const hidden = useScrollHidden();
  if (!isTabPath(path)) return null;
  return (
    <motion.nav
      aria-label="Main"
      initial={false}
      animate={{ y: hidden ? '110%' : 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 40 }}
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-bg"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV_ITEMS.map((i) => {
          const active = path === i.href;
          return (
            <li key={i.href} className="relative">
              <Link href={i.href} aria-current={active ? 'page' : undefined}
                className={cn('flex h-[4.25rem] flex-col items-center justify-center gap-1 text-[0.8rem] font-extrabold transition-colors', active ? 'text-text' : 'text-muted')}>
                <span className="relative flex h-8 w-14 items-center justify-center">
                  {active && <motion.span layoutId="nav-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-lg bg-accent" />}
                  <Icon name={i.icon} size={24} className={cn('relative', active && 'text-onaccent')} />
                </span>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
