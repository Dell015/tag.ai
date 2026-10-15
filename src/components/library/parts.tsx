'use client';
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui';
import { PAINT, type Paint } from '@/components/ui/Art';
import { cn } from '@/lib/cn';

/** Five bars showing how a set of cards spreads across intensity 1 to 5. */
export function IntensityBars({ values, className, label = 'Intensity mix, level 1 to 5' }: { values: number[]; className?: string; label?: string }) {
  const max = Math.max(1, ...values);
  return (
    <span role="img" aria-label={label} className={cn('inline-flex h-7 items-end gap-[3px]', className)}>
      {values.map((v, i) => <span key={i} className="w-[7px] rounded-[2px] bg-current" style={{ height: `${Math.max(v ? 18 : 8, Math.round((v / max) * 100))}%`, opacity: v ? 1 : 0.3 }} />)}
    </span>
  );
}

/** A collapsible section with a coloured edge. Nest one inside another for sub-categories. */
export function Fold({ title, count, hint, tone, defaultOpen = false, open: controlled, level = 0, right, children }: {
  title: string; count?: number | string; hint?: string; tone?: Paint; defaultOpen?: boolean; open?: boolean; level?: 0 | 1; right?: ReactNode; children: ReactNode;
}) {
  const [own, setOwn] = useState(defaultOpen);
  const open = controlled ?? own;
  return (
    <section className={cn(level === 0 ? 'mb-3 rounded-card border-2 border-line' : 'border-t-2 border-line/60')}>
      <button onClick={() => setOwn(!open)} aria-expanded={open} className={cn('flex min-h-[4.25rem] w-full items-center gap-3 text-left', level === 0 ? 'px-4' : 'py-1 pl-3')}>
        {tone && level === 0 && <span aria-hidden className="h-10 w-2 shrink-0 rounded-full" style={{ background: PAINT[tone] }} />}
        <span className="min-w-0 flex-1">
          <span className={cn('block font-extrabold leading-tight', level === 0 ? 'text-2xl' : 'text-xl')}>{title}</span>
          {hint && <span className="mt-0.5 block text-base leading-snug text-muted">{hint}</span>}
        </span>
        {right}
        {count !== undefined && <span className="shrink-0 text-lg font-bold text-muted">{count}</span>}
        <Icon name="chevron" size={20} className={cn('shrink-0 text-muted transition-transform', open && 'rotate-90')} />
      </button>
      {open && <div className={cn(level === 0 ? 'px-4 pb-3' : 'pl-3')}>{children}</div>}
    </section>
  );
}
