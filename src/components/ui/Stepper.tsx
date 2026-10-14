import { cn } from '@/lib/cn';

export function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn('h-2 flex-1 rounded-sm', i < step ? 'bg-accent' : 'bg-raised')} />
      ))}
    </div>
  );
}
