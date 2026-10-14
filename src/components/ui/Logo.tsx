import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('font-display text-4xl font-extrabold tracking-tight', className)}>
      tag<span className="bg-accent-gradient bg-clip-text text-transparent">.ai</span>
    </span>
  );
}
