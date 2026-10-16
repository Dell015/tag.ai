'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';
import type { Paint } from './Art';

/** One row of a settings-style list: label, optional hint, value or control on the right. */
export function ListRow({ label, hint, value, right, href, onClick, danger, disabled, icon }: {
  icon?: IconName; /** Kept so old call sites compile. Icons are plain now. */ tone?: Paint; label: string; hint?: string; value?: ReactNode; right?: ReactNode; href?: string; onClick?: () => void; danger?: boolean; disabled?: boolean;
}) {
  const body = (
    <>
      {icon && <Icon name={icon} size={24} className="shrink-0 text-accent" />}
      <span className="min-w-0 flex-1">
        <span className={cn('block text-lg font-bold leading-tight', danger && 'text-danger')}>{label}</span>
        {hint && <span className="mt-0.5 block text-sm leading-snug text-muted">{hint}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-lg font-bold text-muted">{value}</span>}
      {right}
      {(href || onClick) && !right && <Icon name="chevron" size={20} className="shrink-0 text-muted" />}
    </>
  );
  const cls = 'flex min-h-[4.25rem] w-full items-center gap-3 border-b-2 border-line/60 py-3 text-left disabled:opacity-40';
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button onClick={onClick} disabled={disabled} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
