'use client';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

export function Chip({
  selected,
  className,
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      aria-pressed={selected}
      onClick={(e) => {
        haptic('tap');
        onClick?.(e);
      }}
      className={cn(
        'min-h-tap rounded-full border px-5 text-base font-semibold transition active:scale-95',
        selected ? 'border-transparent bg-accent-gradient text-white shadow-glow' : 'border-white/10 bg-surface text-muted',
        className,
      )}
      {...rest}
    />
  );
}
