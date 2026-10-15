'use client';
import { haptic } from '@/lib/haptics';
import { Icon } from './Icon';

export function NumberStepper({ value, onChange, min = 0, max = 99, step = 1, label, format }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string; format?: (v: number) => string;
}) {
  const set = (v: number) => { haptic('tap'); onChange(Math.min(max, Math.max(min, v))); };
  const btn = 'flex h-tap w-tap items-center justify-center rounded-xl border-b-4 border-black/40 bg-raised active:translate-y-[3px] active:border-b disabled:opacity-35';
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button className={btn} aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => set(value - step)}><Icon name="minus" /></button>
      <output aria-live="polite" className="display min-w-[4.5rem] text-center text-5xl tabular-nums">{format ? format(value) : value}</output>
      <button className={btn} aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => set(value + step)}><Icon name="plus" /></button>
    </div>
  );
}
