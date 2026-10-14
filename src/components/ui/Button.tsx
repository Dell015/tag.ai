'use client';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'wild';
type Size = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-gradient text-white shadow-glow',
  secondary: 'bg-elevated text-ink border border-white/10',
  ghost: 'bg-transparent text-muted',
  danger: 'bg-danger/15 text-danger border border-danger/40',
  wild: 'bg-wild-gradient text-white shadow-wild',
};

/** Every button is at least 56px tall (64px for `lg`) — drunk thumbs are imprecise. */
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
        'inline-flex select-none items-center justify-center gap-2 rounded-2xl px-6 font-display font-bold transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100',
        size === 'lg' ? 'h-cta text-xl' : 'h-tap text-lg',
        full && 'w-full',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
});
