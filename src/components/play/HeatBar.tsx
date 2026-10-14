import { cn } from '@/lib/cn';

const LABELS = ['Chill', 'Warm', 'Spicy', 'Hot', 'Inferno'];

/** Five blocks in the deck colour. Level is 1.0 to 5.0; the last filled block shows partial fill. */
export function HeatBar({ level, spiking }: { level: number; spiking?: boolean }) {
  const label = LABELS[Math.min(4, Math.max(0, Math.round(level) - 1))];
  return (
    <div className="flex items-center gap-3" role="meter" aria-label="Heat level" aria-valuemin={1} aria-valuemax={5} aria-valuenow={Number(level.toFixed(1))}>
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, level - (i - 1)));
          return (
            <span key={i} className="relative h-3 flex-1 overflow-hidden rounded-sm bg-raised">
              <span className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500" style={{ width: `${fill * 100}%` }} />
            </span>
          );
        })}
      </div>
      <span className={cn('w-[4.5rem] text-right text-base font-extrabold', spiking && 'text-danger')}>{spiking ? 'Heat spike' : label}</span>
    </div>
  );
}
