'use client';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

export function Chip({ selected, className, onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      aria-pressed={selected}
      onClick={(e) => { haptic('tap'); onClick?.(e); }}
      className={cn(
        'min-h-tap rounded-lg border-2 px-4 text-base font-bold transition-[background-color,transform] active:scale-95',
        selected ? 'border-accent bg-accent text-onaccent' : 'border-line bg-transparent text-text',
        className,
      )}
      {...rest}
    />
  );
}
