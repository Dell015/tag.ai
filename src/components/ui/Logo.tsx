import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return <span className={cn('sign text-[1.7rem]', className)}>tag.ai</span>;
}
