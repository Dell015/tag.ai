'use client';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string; error?: string | null; counter?: boolean }>(
  function TextField({ label, helper, error, counter, className, maxLength, value, ...rest }, ref) {
    const id = useId();
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 flex justify-between text-base font-bold text-muted">
          <span>{label}</span>
          {counter && maxLength && <span>{String(value ?? '').length}/{maxLength}</span>}
        </label>
        <input id={id} ref={ref} value={value} maxLength={maxLength} aria-invalid={!!error} aria-describedby={error || helper ? `${id}-h` : undefined}
          className={cn('h-tap w-full rounded-xl border-2 bg-transparent px-4 text-lg placeholder:text-muted/50 focus:border-accent', error ? 'border-danger' : 'border-line', className)} {...rest} />
        {(error || helper) && <p id={`${id}-h`} className={cn('mt-1.5 text-base', error ? 'font-bold text-danger' : 'text-muted')}>{error || helper}</p>}
      </div>
    );
  },
);
