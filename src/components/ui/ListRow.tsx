'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';
import { IconTile, type Paint } from './Art';

/** One row inside a Plate: coloured icon tile, label with optional hint, then a value, control or chevron. */
export function ListRow({ label, hint, value, right, href, onClick, danger, disabled, icon, tone }: {
  icon?: IconName; tone?: Paint; label: string; hint?: string; value?: ReactNode; right?: ReactNode; href?: string; onClick?: () => void; danger?: boolean; disabled?: boolean;
}) {
  const body = (
    <>
      {icon && <IconTile icon={icon} tone={danger ? 'red' : tone ?? 'yellow'} size={40} />}
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[1.05rem] font-bold leading-tight', danger && 'text-danger')}>{label}</span>
        {hint && <span className="mt-0.5 block text-sm leading-snug text-muted">{hint}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-base font-bold tabular-nums text-muted">{value}</span>}
      {right}
      {(href || onClick) && !right && <Icon name="chevron" size={18} className="shrink-0 text-muted" />}
    </>
  );
  const cls = 'flex min-h-[3.75rem] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-raised disabled:opacity-40';
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button onClick={onClick} disabled={disabled} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
