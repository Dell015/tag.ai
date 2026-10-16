import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/** Standard page frame: safe areas, optional back link and title, optional pinned footer action. */
export function Screen({ title, back, onBack, footer, children, className, mode }: {
  title?: string; back?: string; onBack?: () => void; footer?: ReactNode; children: ReactNode; className?: string; mode?: string;
}) {
  return (
    <div data-mode={mode} className="flex min-h-dvh flex-col">
      {(back || onBack || title) && (
        <header className="safe-top flex items-center gap-3 px-4 pb-3">
          {onBack && (
            <button onClick={onBack} aria-label="Back" className="inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
          )}
          {back && !onBack && (
            <Link href={back} aria-label="Back" className="inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line">
              <Icon name="back" />
            </Link>
          )}
          {title && <h1 className="sign text-[1.55rem] leading-tight">{title}</h1>}
        </header>
      )}
      <main className={cn('flex-1 px-4 pb-6', !(back || onBack || title) && 'safe-top', className)}>{children}</main>
      {footer && <footer className="safe-bottom sticky bottom-0 border-t-2 border-line bg-bg px-4 pt-4">{footer}</footer>}
    </div>
  );
}
