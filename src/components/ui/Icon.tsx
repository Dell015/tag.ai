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
  bag: 'M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0',
  chevron: 'M9 5l7 7-7 7',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5v9M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4',
  shot: 'M6 4h12l-1.6 16H7.6zM7.4 11h9.2',
  dice: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  refresh: 'M20 12a8 8 0 1 1-3-6.2M20 4v5h-5',
  timer: 'M12 8v5l3 2M9 2h6M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8h.01M11 12h1v5h1',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c.8-3.5 3.5-5 7-5s6.2 1.5 7 5M17 4.5a3.5 3.5 0 0 1 0 6.5M18 15c2 .5 3.4 2 4 5',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
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
