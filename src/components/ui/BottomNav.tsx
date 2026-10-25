'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
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

/**
 * Floating tab bar. After 5 seconds with no touch or scroll it slides to the left and shrinks to a
 * circle that shows the current tab; tap the circle (or touch the screen again after scrolling up) to open it.
 */
export function BottomNav() {
  const path = usePathname();
  const [small, setSmall] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const arm = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setSmall(true), IDLE_MS); };
    let last = window.scrollY;
    const onScroll = () => { const y = window.scrollY; if (y - last > 24) { setSmall(true); last = y; } else if (last - y > 12) { setSmall(false); arm(); last = y; } };
    const onTouch = () => { if (!small) arm(); };
    arm();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onTouch, { passive: true });
    return () => { clearTimeout(timer.current); window.removeEventListener('scroll', onScroll); window.removeEventListener('pointerdown', onTouch); };
  }, [small, path]);

  // A new screen always opens the bar.
  useEffect(() => { setSmall(false); }, [path]);

  if (!isTabPath(path)) return null;
  const current = NAV_ITEMS.find((i) => i.href === path) ?? NAV_ITEMS[0];

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 w-full lg:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 14px)' }}>
      {/* Same centred column as the page content, so the bar lines up with it on tablets. */}
      <div className="mx-auto w-full max-w-2xl px-4">
      <motion.nav
        aria-label="Main"
        initial={false}
        animate={{ width: small ? 60 : '100%', height: small ? 60 : 68 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="pointer-events-auto overflow-hidden rounded-full border-2 border-line bg-panel shadow-[0_6px_0_0_rgba(0,0,0,0.35)]"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {small ? (
            <motion.button key="dot" aria-label={`${current.label}. Open menu`} onClick={() => setSmall(false)}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
              className="flex h-full w-full items-center justify-center bg-accent text-onaccent">
              <Icon name={current.icon} size={26} />
            </motion.button>
          ) : (
            <motion.ul key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full grid-cols-5 items-center px-1.5">
              {NAV_ITEMS.map((i) => {
                const active = path === i.href;
                return (
                  <li key={i.href} className="flex justify-center">
                    <Link href={i.href} aria-label={i.label} aria-current={active ? 'page' : undefined}
                      className={cn('relative flex h-[3.25rem] w-full max-w-[4.4rem] items-center justify-center rounded-full transition-colors', active ? 'text-onaccent' : 'text-muted')}>
                      {active && <motion.span layoutId="nav-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-full bg-accent" />}
                      <Icon name={i.icon} size={24} className="relative" />
                    </Link>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.nav>
      </div>
    </div>
  );
}
