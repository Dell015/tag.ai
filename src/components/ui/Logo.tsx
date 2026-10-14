import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return <span className={cn('display text-4xl', className)}>tag.ai</span>;
}
