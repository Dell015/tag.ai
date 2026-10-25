'use client';
import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/** A dropdown that uses the phone's own picker. The label sits above it. */
export function Select({ label, options, className, ...rest }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & { label: string; options: { id: string; label: string }[] }) {
  const id = useId();
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1 block truncate text-sm font-bold text-muted">{label}</label>
      <div className="relative">
        <select id={id} {...rest} className="h-tap w-full appearance-none truncate rounded-xl border-2 border-line bg-panel pl-3 pr-9 text-base font-extrabold text-text focus:border-accent">
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <Icon name="down" size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
