'use client';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-onaccent border-b-4 border-black/35',
  secondary: 'bg-raised text-text border-b-4 border-black/40',
  ghost: 'bg-transparent text-muted',
  danger: 'bg-transparent text-danger border-2 border-danger',
};

/**
 * Chunky key-style buttons: 56px minimum (68px for `lg`). The thick bottom edge
 * collapses when pressed, which is feedback you can feel even when you can't read.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', full, className, onClick, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      onClick={(e) => {
        haptic('tap');
        onClick?.(e);
      }}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl px-6 font-extrabold transition-transform active:translate-y-[3px] active:border-b-[1px] disabled:opacity-35 disabled:active:translate-y-0 disabled:active:border-b-4',
        size === 'lg' ? 'h-cta text-xl' : 'h-tap text-lg',
        full && 'w-full',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
});
