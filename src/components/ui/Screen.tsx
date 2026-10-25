import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/** Standard page frame: safe areas, optional back link and title, optional pinned footer action. */
export function Screen({ title, back, onBack, footer, children, className, mode, action, wide }: {
  title?: string; back?: string; onBack?: () => void; action?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string; mode?: string; wide?: boolean;
}) {
  return (
    <div data-mode={mode} className="flex min-h-dvh flex-col">
      {/* On a phone this is the full width. On a desktop the content sits in a centred column (wide pages get a wider one). */}
      {(back || onBack || title) && (
        <header className={cn('safe-top mx-auto flex w-full items-center gap-3 px-4 pb-2 lg:px-8 lg:pt-8', wide ? 'max-w-5xl' : 'max-w-2xl')}>
          {onBack && (
            <button onClick={onBack} aria-label="Back" className="inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
          )}
          {back && !onBack && (
            <Link href={back} aria-label="Back" className="inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line">
              <Icon name="back" />
            </Link>
          )}
          {title && <h1 className="sign min-w-0 flex-1 truncate text-[1.75rem] leading-tight">{title}</h1>}
          {action}
        </header>
      )}
      <main className={cn('mx-auto w-full flex-1 px-4 pb-6 lg:px-8', wide ? 'max-w-5xl' : 'max-w-2xl', !(back || onBack || title) && 'safe-top', className)}>{children}</main>
      {footer && <footer className="safe-bottom sticky bottom-0 border-t-2 border-line bg-bg px-4 pt-4"><div className="mx-auto w-full max-w-2xl">{footer}</div></footer>}
    </div>
  );
}
