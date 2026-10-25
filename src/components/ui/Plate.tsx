import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A titled group of related rows. The title is one line, sentence case, with an optional hint under it. */
export function Section({ title, hint, action, children, className }: { title?: string; hint?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn('mt-7', className)}>
      {(title || action) && (
        <div className="mb-2.5 flex items-end justify-between gap-3 px-0.5">
          <div className="min-w-0">
            {title && <h2 className="text-[1.65rem] leading-none">{title}</h2>}
            {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** One solid panel that holds rows. Rows are separated by thin rules inside it; the panel has the same chunky lower edge as a key. */
export function Plate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('divide-y-2 divide-line/40 overflow-hidden rounded-2xl border-2 border-b-4 border-line/60 bg-panel', className)}>
      {children}
    </div>
  );
}
