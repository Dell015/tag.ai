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

export function Avatar({ value, name = '', size = 48, className }: { value?: string | null; name?: string; size?: number; className?: string }) {
  const c = avatarColor(value, name);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.5, background: c.bg, color: c.fg }}
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-extrabold', className)}
    >
      {initial}
    </span>
  );
}
