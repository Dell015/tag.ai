import type { CardCategory } from '@/types/game';
import { CURATED_CARDS } from '@/lib/data/cards';
import type { Paint } from '@/components/ui/Art';

/** Cards are filed in three groups, each holding categories. Used by Browse, Saved and the editors. */
export interface CategoryGroup { id: string; label: string; hint: string; tone: Paint; cats: CardCategory[] }

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'talk', label: 'Get talking', hint: 'Easy openers that start arguments and stories', tone: 'blue', cats: ['hot_takes', 'hypotheticals', 'memories'] },
  { id: 'personal', label: 'Get personal', hint: 'Honest answers about people and feelings', tone: 'pink', cats: ['relationships', 'confessions', 'deep_philosophical'] },
  { id: 'loud', label: 'Get loud', hint: 'Dares, roasts and topics people argue about', tone: 'orange', cats: ['dares', 'roasts', 'controversial'] },
];

export const groupOf = (cat: string) => CATEGORY_GROUPS.find((g) => (g.cats as string[]).includes(cat));

/** How many of the given cards sit at each intensity, index 0 = level 1. */
export function intensityCounts(cards: { intensity: number }[]): number[] {
  const out = [0, 0, 0, 0, 0];
  cards.forEach((c) => { if (c.intensity >= 1 && c.intensity <= 5) out[c.intensity - 1] += 1; });
  return out;
}

export const BROWSABLE = CURATED_CARDS.filter((c) => c.cardType !== 'wild');
