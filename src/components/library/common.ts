import type { CardCategory } from '@/types/game';

export const CATEGORIES: { id: CardCategory; label: string }[] = [
  { id: 'hot_takes', label: 'Hot takes' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'memories', label: 'Memories' },
  { id: 'confessions', label: 'Confessions' },
  { id: 'dares', label: 'Dares' },
  { id: 'hypotheticals', label: 'Hypotheticals' },
  { id: 'controversial', label: 'Controversial' },
  { id: 'roasts', label: 'Roasts' },
  { id: 'deep_philosophical', label: 'Deep' },
];
export const categoryLabel = (c: string) => CATEGORIES.find((x) => x.id === c)?.label ?? c.replace(/_/g, ' ');
export const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
};
