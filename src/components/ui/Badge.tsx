import { cn } from '@/lib/cn';

export function Badge({ children, tone = 'accent' }: { children: React.ReactNode; tone?: 'accent' | 'line' | 'ok' }) {
  return <span className={cn('inline-block shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-sm font-extrabold', tone === 'accent' && 'bg-accent text-onaccent', tone === 'ok' && 'bg-ok text-bg', tone === 'line' && 'border-2 border-line text-muted')}>{children}</span>;
}
