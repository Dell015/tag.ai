import { cn } from '@/lib/cn';

/** Flat paint colours; the avatar is a colour plus the first letter of the name. */
export const AVATAR_COLORS = [
  { bg: '#FFC72C', fg: '#181310' },
  { bg: '#E83C2E', fg: '#FFFFFF' },
  { bg: '#4274FF', fg: '#FFFFFF' },
  { bg: '#30BE70', fg: '#181310' },
  { bg: '#FF82B2', fg: '#181310' },
  { bg: '#FF7022', fg: '#181310' },
  { bg: '#9B7CFF', fg: '#181310' },
  { bg: '#35C7C7', fg: '#181310' },
  { bg: '#F4F1EC', fg: '#181310' },
  { bg: '#A4D93D', fg: '#181310' },
];

/** Avatar value is "c0".."c9". Anything else (legacy emoji, URLs) falls back to a colour from the name. */
export function avatarColor(value: string | undefined | null, name = '') {
  const m = value?.match(/^c(\d+)$/);
  if (m) return AVATAR_COLORS[Number(m[1]) % AVATAR_COLORS.length];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const frameStyle = (f: string, size: number): { wrap: React.CSSProperties; pad: number } | null => {
  const pad = Math.max(3, Math.round(size * 0.08));
  if (f === 'stripe') return { pad, wrap: { background: 'repeating-linear-gradient(45deg, rgb(var(--accent)) 0 4px, rgb(var(--bg)) 4px 8px)' } };
  if (f === 'dots') return { pad, wrap: { backgroundImage: 'radial-gradient(circle, rgb(var(--accent)) 1.8px, transparent 2.4px)', backgroundSize: '7px 7px' } };
  if (f === 'double') return { pad: pad + 2, wrap: { boxShadow: 'inset 0 0 0 2px rgb(var(--accent)), 0 0 0 2px rgb(var(--accent))', margin: 2 } };
  return null;
};

export function Avatar({ value, name = '', size = 48, className, frame }: { value?: string | null; name?: string; size?: number; className?: string; frame?: string }) {
  const c = avatarColor(value, name);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const fr = frame ? frameStyle(frame, size) : null;
  const face = (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.5, background: c.bg, color: c.fg }}
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-extrabold', className)}
    >
      {initial}
    </span>
  );
  return fr ? <span className="inline-flex shrink-0 rounded-full" style={{ padding: fr.pad, ...fr.wrap }}>{face}</span> : face;
}
