import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Standard page frame: safe areas, optional back link + title, optional sticky footer CTA. */
export function Screen({
  title,
  back,
  footer,
  children,
  className,
  mode,
}: {
  title?: string;
  back?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  mode?: string;
}) {
  return (
    <div data-mode={mode} className="flex min-h-dvh flex-col">
      <header className="safe-top flex items-center gap-2 px-4 pb-2">
        {back && (
          <Link href={back} aria-label="Back" className="inline-flex h-tap w-tap items-center justify-center rounded-2xl bg-surface text-2xl">
            ←
          </Link>
        )}
        {title && <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>}
      </header>
      <main className={cn('flex-1 px-4 pb-6', className)}>{children}</main>
      {footer && <footer className="safe-bottom sticky bottom-0 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pt-6">{footer}</footer>}
    </div>
  );
}
