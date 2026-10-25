import { cn } from '@/lib/cn';
import { CoinStack, stackFor } from './Art';

/** Coins are always written as a number plus the word "coins". */
export function CoinAmount({ value, className, signed }: { value: number; className?: string; signed?: boolean }) {
  const n = Number.isInteger(value) ? String(Math.abs(value)) : Math.abs(value).toFixed(1);
  const sign = signed ? (value > 0 ? '+' : value < 0 ? '-' : '') : value < 0 ? '-' : '';
  return <span className={cn('tabular-nums', className)}>{sign}{n} {Math.abs(value) === 1 ? 'coin' : 'coins'}</span>;
}

/** Balance for headers: a coin icon and the number, no word. */
export function CoinCount({ value, className }: { value: number; className?: string }) {
  const n = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <span aria-label={`${n} coins`} className={cn('inline-flex items-center gap-1.5 font-extrabold tabular-nums', className)}>
      <CoinStack count={stackFor(value)} size={26} />
      {n}
    </span>
  );
}
