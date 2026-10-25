'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
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

const IDLE_MS = 5000;
const SIZE = 60;
const MAX_W = 384;
const EDGE = 12;

/**
 * Floating tab bar. After 5 seconds of nothing, or when you scroll down, it slides to the left edge and
 * shrinks to a circle showing the current tab. Tap the circle, or scroll up, and it opens again.
 */
export function BottomNav() {
  const path = usePathname();
  const scrolledDown = useScrollHidden();
  const [open, setOpen] = useState(true);
  const [vw, setVw] = useState(390);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), IDLE_MS);
  }, []);
  const wake = useCallback(() => { setOpen(true); arm(); }, [arm]);

  useEffect(() => {
    const read = () => setVw(window.innerWidth);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  // A new screen opens the bar for a fresh 5 seconds.
  useEffect(() => { wake(); return () => { if (timer.current) clearTimeout(timer.current); }; }, [path, wake]);
  useEffect(() => { if (scrolledDown) setOpen(false); else wake(); }, [scrolledDown, wake]);

  if (!isTabPath(path)) return null;
  const width = Math.min(vw - EDGE * 2, MAX_W);
  const left = Math.max(EDGE, (vw - width) / 2);
  const current = NAV_ITEMS.find((i) => i.href === path) ?? NAV_ITEMS[0];

  return (
    <motion.nav
      aria-label="Main"
      initial={false}
      animate={{ width: open ? width : SIZE, left: open ? left : EDGE }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      style={{ height: SIZE, bottom: 'max(env(safe-area-inset-bottom), 14px)' }}
      className="fixed z-30 overflow-hidden rounded-full border-2 border-line bg-raised shadow-[0_4px_0_0_rgb(0_0_0/0.4)]"
    >
      <motion.ul
        animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.15 }}
        aria-hidden={!open} inert={!open}
        style={{ width }}
        className="absolute inset-y-0 left-0 grid grid-cols-5 items-center px-1.5"
      >
        {NAV_ITEMS.map((i) => {
          const active = path === i.href;
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? 'page' : undefined} onClick={() => { haptic('tap'); arm(); }}
                className={cn('relative mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-colors', active ? 'text-onaccent' : 'text-muted')}>
                {active && <motion.span layoutId="nav-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-full bg-accent" />}
                <Icon name={i.icon} size={24} className="relative" />
                <span className="sr-only">{i.label}</span>
              </Link>
            </li>
          );
        })}
      </motion.ul>
      <motion.button
        animate={{ opacity: open ? 0 : 1 }} transition={{ duration: 0.15 }}
        aria-label={`Open menu, on ${current.label}`} tabIndex={open ? -1 : 0}
        onClick={() => { haptic('tap'); wake(); }}
        className="absolute inset-0 flex items-center justify-center text-accent"
        style={{ pointerEvents: open ? 'none' : 'auto' }}
      >
        <Icon name={current.icon} size={26} />
      </motion.button>
    </motion.nav>
  );
}
