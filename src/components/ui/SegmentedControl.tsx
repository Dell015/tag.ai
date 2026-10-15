'use client';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

/** Flat tab switcher. Active segment is solid accent; labels are always text. */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: {
  options: { id: T; label: string }[]; value: T; onChange: (id: T) => void; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-xl border-2 border-line p-1">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button key={o.id} role="tab" aria-selected={on} onClick={() => { haptic('tap'); onChange(o.id); }}
            className={cn('h-12 min-w-0 flex-1 truncate rounded-lg px-2 text-base font-extrabold transition-colors', on ? 'bg-accent text-onaccent' : 'text-muted')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
