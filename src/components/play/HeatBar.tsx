import { cn } from '@/lib/cn';

const LABELS = ['Chill', 'Warm', 'Spicy', 'Hot', 'Inferno'];

/** Five-segment heat bar. Level is 1.0–5.0 and may be fractional. */
export function HeatBar({ level, spiking }: { level: number; spiking?: boolean }) {
  const label = LABELS[Math.min(4, Math.max(0, Math.round(level) - 1))];
  return (
    <div className="flex items-center gap-3" role="meter" aria-label="Heat level" aria-valuemin={1} aria-valuemax={5} aria-valuenow={Number(level.toFixed(1))}>
      <div className="flex flex-1 gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, level - (i - 1)));
          return (
            <span key={i} className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span className="absolute inset-y-0 left-0 rounded-full bg-heat-gradient transition-all duration-500" style={{ width: `${fill * 100}%`, backgroundSize: `${100 / Math.max(fill, 0.01)}% 100%` }} />
            </span>
          );
        })}
      </div>
      <span className={cn('w-20 text-right text-sm font-bold', spiking && 'text-danger')}>{spiking ? '🔥 Spike' : label}</span>
    </div>
  );
}
