import { cn } from '@/lib/cn';

/** Coins are always written as a number plus the word "coins". */
export function CoinAmount({ value, className, signed }: { value: number; className?: string; signed?: boolean }) {
  const n = Number.isInteger(value) ? String(Math.abs(value)) : Math.abs(value).toFixed(1);
  const sign = signed ? (value > 0 ? '+' : value < 0 ? '-' : '') : value < 0 ? '-' : '';
  return <span className={cn('tabular-nums', className)}>{sign}{n} {Math.abs(value) === 1 ? 'coin' : 'coins'}</span>;
}
