import type { SVGProps } from 'react';

const PATHS = {
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  pause: 'M8 5v14M16 5v14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  skip: 'M5 5l9 7-9 7zM18 5v14',
  heart: 'M12 20S4 15 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20 12 20z',
  check: 'M4 12.5l5 5L20 6.5',
  share: 'M12 15V3M7 8l5-5 5 5M5 13v8h14v-8',
  plus: 'M12 5v14M5 12h14',
  play: 'M7 4l13 8-13 8z',
  cards: 'M7 7h10a2 2 0 0 1 2 2v11H9a2 2 0 0 1-2-2zM4 16V5a2 2 0 0 1 2-2h9',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-4',
  minus: 'M5 12h14',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  snow: 'M12 3v18M4 7.5l16 9M20 7.5l-16 9',
} as const;

export type IconName = keyof typeof PATHS;

/** Hand-picked 24px line icons, one stroke weight everywhere. Decorative unless `label` is set. */
export function Icon({ name, size = 24, label, filled, ...rest }: { name: IconName; size?: number; label?: string; filled?: boolean } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
