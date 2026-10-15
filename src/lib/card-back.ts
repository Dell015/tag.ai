import type { CSSProperties } from 'react';

/** Face-down card styles. `plate` = the text sits on a solid label so it stays readable. */
export function cardBack(value: string | undefined): { style: CSSProperties; plate: boolean; ink: boolean } {
  switch (value) {
    case 'jeepney':
      return { style: { background: 'repeating-linear-gradient(135deg, rgb(var(--accent)) 0 22px, rgb(var(--bg)) 22px 44px)' }, plate: true, ink: false };
    case 'checker':
      return { style: { backgroundColor: 'rgb(var(--accent))', backgroundImage: 'conic-gradient(rgb(var(--bg)) 25%, transparent 25% 50%, rgb(var(--bg)) 50% 75%, transparent 75%)', backgroundSize: '56px 56px' }, plate: true, ink: false };
    case 'sunburst':
      return { style: { backgroundColor: 'rgb(var(--accent))', backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 62%, rgb(var(--bg) / 0.28) 0 7.5deg, transparent 7.5deg 15deg)' }, plate: false, ink: false };
    case 'ink':
      return { style: { background: 'rgb(var(--raised))' }, plate: false, ink: true };
    default:
      return { style: {}, plate: false, ink: false };
  }
}
