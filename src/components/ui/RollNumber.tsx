'use client';
import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

const calm = () => {
  if (typeof document === 'undefined') return true;
  return document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/** A number that counts to its new value instead of jumping. Coins and totals use it. */
export function RollNumber({ value, format = (n) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (calm() || from.current === value) { setShown(value); from.current = value; return; }
    const c = animate(from.current, value, { duration: 0.55, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(v), onComplete: () => { from.current = value; setShown(value); } });
    return () => { c.stop(); from.current = value; };
  }, [value]);
  return <>{format(shown)}</>;
}
