'use client';
import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

/** Flat tab switcher. The active plate slides between segments; labels are always text. */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: {
  options: { id: T; label: string }[]; value: T; onChange: (id: T) => void; label: string;
}) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-xl border-2 border-line p-1">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button key={o.id} role="tab" aria-selected={on} onClick={() => { haptic('tap'); onChange(o.id); }}
            className={cn('relative h-12 min-w-0 flex-1 truncate rounded-lg px-1 text-[0.95rem] font-extrabold transition-colors', on ? 'text-onaccent' : 'text-muted')}>
            {on && <motion.span layoutId={`seg-${id}`} transition={{ type: 'spring', stiffness: 520, damping: 40 }} className="absolute inset-0 rounded-lg bg-accent" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
