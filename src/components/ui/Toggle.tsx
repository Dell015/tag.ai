'use client';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => { haptic('tap'); onChange(!checked); }}
      className={cn('h-8 w-14 shrink-0 rounded-full p-1 transition-colors disabled:opacity-40', checked ? 'bg-accent' : 'bg-raised')}>
      <span className={cn('block h-6 w-6 rounded-full transition-transform', checked ? 'translate-x-6 bg-onaccent' : 'bg-text')} />
    </button>
  );
}
