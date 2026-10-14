import { cn } from '@/lib/cn';

/** Avatar is an emoji (default) or an image URL. */
export function Avatar({ value, size = 48, className }: { value?: string | null; size?: number; className?: string }) {
  const isUrl = !!value && /^(https?:|data:|\/)/.test(value);
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated ring-1 ring-white/10', className)}
    >
      {isUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value!} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{value || '🙂'}</span>
      )}
    </span>
  );
}
