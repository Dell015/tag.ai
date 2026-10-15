import type { CSSProperties } from 'react';
import { Icon, type IconName } from './Icon';
import { cn } from '@/lib/cn';

/**
 * Flat, outlined spot illustrations in the same language as the deck fan:
 * thick ink outline, paint-flat fills, no gradients. Decorative only.
 */
export const INK = '#181310';
export const PAINT = { blue: '#4274FF', yellow: '#FFC72C', pink: '#FF82B2', red: '#E83C2E', orange: '#FF7022', green: '#30BE70' } as const;
export type Paint = keyof typeof PAINT;
const ORDER: Paint[] = ['yellow', 'blue', 'pink', 'red', 'orange', 'green'];
const LIGHT_TEXT: Paint[] = ['blue', 'red'];

/** Top-down view of a table: a ring of seats around a card, with shot glasses in reach. */
export function TableScene({ letters, className }: { letters: string[]; className?: string }) {
  const seats = ORDER.map((c, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return { c, x: 160 + 108 * Math.cos(a), y: 140 + 108 * Math.sin(a), l: letters[i] ?? '' };
  });
  const glasses = [20, 140, 260].map((deg) => ({ deg, x: 160 + 56 * Math.cos((deg * Math.PI) / 180), y: 140 + 56 * Math.sin((deg * Math.PI) / 180) }));
  return (
    <svg aria-hidden viewBox="0 0 320 280" className={className} fill="none" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="160" cy="140" r="80" fill="#2A231E" stroke="#564B40" strokeWidth="3" />
      <circle cx="160" cy="140" r="64" stroke="#564B40" strokeWidth="2" strokeDasharray="2 9" />
      {glasses.map((g) => (
        <g key={g.deg} transform={`translate(${g.x} ${g.y}) rotate(${g.deg + 90})`}>
          <path d="M-10 -12h20l-3 24h-14z" fill="#F4F1EC" stroke={INK} strokeWidth="3" />
          <path d="M-8.5 -3h17l-1.6 15h-13.8z" fill={PAINT.orange} />
        </g>
      ))}
      <g transform="rotate(-8 160 140)">
        <rect x="128" y="98" width="64" height="84" rx="10" fill={PAINT.yellow} stroke={INK} strokeWidth="3" />
        <text x="160" y="157" textAnchor="middle" fontSize="54" fontWeight="800" fill={INK} className="display">?</text>
      </g>
      {seats.map((s, i) => (
        <g key={i} className="seat-pop" style={{ animationDelay: `${i * 70}ms`, transformOrigin: `${s.x}px ${s.y}px` } as CSSProperties}>
          <circle cx={s.x} cy={s.y} r="23" fill={PAINT[s.c]} stroke={INK} strokeWidth="3" />
          <text x={s.x} y={s.y + 8} textAnchor="middle" fontSize="23" fontWeight="800" fill={LIGHT_TEXT.includes(s.c) ? '#fff' : INK}>{s.l}</text>
        </g>
      ))}
    </svg>
  );
}

/** A stack of one to five coins; taller stack means a bigger pack. */
export function CoinStack({ count = 3, size = 64, className }: { count?: number; size?: number; className?: string }) {
  const n = Math.max(1, Math.min(5, count));
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" strokeLinejoin="round">
      {Array.from({ length: n }).map((_, i) => {
        const y = 52 - i * 9;
        return (
          <g key={i} transform={i % 2 ? 'translate(2 0)' : undefined}>
            <path d={`M10 ${y - 5}v6a22 8 0 0 0 44 0v-6`} fill="#E0A410" stroke={INK} strokeWidth="3" />
            <ellipse cx="32" cy={y - 5} rx="22" ry="8" fill={PAINT.yellow} stroke={INK} strokeWidth="3" />
            <ellipse cx="32" cy={y - 5} rx="12" ry="3.5" stroke="#E0A410" strokeWidth="2.5" />
          </g>
        );
      })}
    </svg>
  );
}

type SpotName = 'cards' | 'bottle' | 'shot' | 'bubble';
/** Small illustrations for empty states. */
export function Spot({ name, size = 96, className }: { name: SpotName; size?: number; className?: string }) {
  const common = { 'aria-hidden': true as const, width: size, height: size, viewBox: '0 0 96 96', fill: 'none', strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const, className };
  if (name === 'cards') return (
    <svg {...common}>
      <g transform="rotate(-14 48 54)"><rect x="18" y="20" width="42" height="58" rx="8" fill={PAINT.blue} stroke={INK} strokeWidth="3" /></g>
      <g transform="rotate(10 48 54)"><rect x="36" y="18" width="42" height="58" rx="8" fill={PAINT.pink} stroke={INK} strokeWidth="3" /></g>
      <rect x="27" y="14" width="42" height="58" rx="8" fill={PAINT.yellow} stroke={INK} strokeWidth="3" />
      <path d="M38 36h20M38 46h14" stroke={INK} strokeWidth="4" />
    </svg>
  );
  if (name === 'bottle') return (
    <svg {...common}>
      <g transform="rotate(-18 48 48)">
        <path d="M42 8h12v14c0 6 10 10 10 22v38a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V44c0-12 10-16 10-22z" fill={PAINT.green} stroke={INK} strokeWidth="3" />
        <rect x="35" y="50" width="26" height="22" rx="3" fill="#F4F1EC" stroke={INK} strokeWidth="3" />
        <path d="M42 8h12v6H42z" fill={PAINT.yellow} stroke={INK} strokeWidth="3" />
      </g>
    </svg>
  );
  if (name === 'shot') return (
    <svg {...common}>
      <path d="M24 20h48l-7 58H31z" fill="#F4F1EC" stroke={INK} strokeWidth="3" />
      <path d="M27.5 40h41l-4 36H31.5z" fill={PAINT.orange} />
      <path d="M24 20h48" stroke={INK} strokeWidth="3" />
    </svg>
  );
  return (
    <svg {...common}>
      <path d="M14 22a8 8 0 0 1 8-8h52a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8H44l-16 16V64h-6a8 8 0 0 1-8-8z" fill={PAINT.pink} stroke={INK} strokeWidth="3" />
      <circle cx="34" cy="39" r="3.5" fill={INK} /><circle cx="48" cy="39" r="3.5" fill={INK} /><circle cx="62" cy="39" r="3.5" fill={INK} />
    </svg>
  );
}

/** A flat colour tile that carries one icon. Used to give list rows a colour anchor. */
export function IconTile({ icon, tone = 'yellow', size = 48, className }: { icon: IconName; tone?: Paint; size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-xl', className)}
      style={{ width: size, height: size, background: PAINT[tone], color: LIGHT_TEXT.includes(tone) ? '#fff' : INK }}>
      <Icon name={icon} size={Math.round(size * 0.55)} />
    </span>
  );
}
