'use client';
import { useEffect, useState } from 'react';

/**
 * True while the person is scrolling down the page, false when they scroll up or sit near either end.
 * The tab bar uses it to slide away and leave the whole screen to the content.
 */
export function useScrollHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let acc = 0;
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const dy = y - last;
      last = y;
      if (y <= 24 || y >= max - 8) { acc = 0; setHidden(false); return; }
      if (dy * acc < 0) acc = 0;
      acc += dy;
      if (acc > 28) setHidden(true);
      else if (acc < -12) setHidden(false);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return hidden;
}
