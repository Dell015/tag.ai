import { cn } from '@/lib/cn';

export function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < step ? 'bg-accent-gradient' : 'bg-white/10')} />
      ))}
    </div>
  );
}
