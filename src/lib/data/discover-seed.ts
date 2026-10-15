/** Sample public decks for Discover (Stage A). Cards are borrowed from the curated library by category. */
import { CURATED_CARDS } from '@/lib/data/cards';
import type { Audience } from '@/stores/deck-store';
import type { CardCategory, GameMode } from '@/types/game';

export interface SampleDeck {
  id: string; name: string; creator: string; audience: Audience; color: GameMode;
  plays: number; copies: number; age: number; // age in days
  categories: CardCategory[]; size: number;
}

export const SAMPLE_DECKS: SampleDeck[] = [
  { id: 's1', name: 'Pulutan at Pagtatapat', creator: 'kuyamigs', audience: 'Barkada', color: 'barkada', plays: 1820, copies: 340, age: 12, categories: ['confessions', 'hot_takes'], size: 12 },
  { id: 's2', name: 'Date Night Deep Dive', creator: 'lovebirds_ph', audience: 'Lovers', color: 'lovers', plays: 960, copies: 410, age: 5, categories: ['relationships', 'deep_philosophical'], size: 10 },
  { id: 's3', name: 'Office Christmas Party', creator: 'hr_hindi_nakatingin', audience: 'Workmates', color: 'icebreaker', plays: 740, copies: 180, age: 30, categories: ['hypotheticals', 'roasts'], size: 10 },
  { id: 's4', name: 'Reunion Roast', creator: 'titacora', audience: 'Family', color: 'family', plays: 2210, copies: 520, age: 60, categories: ['roasts', 'memories'], size: 14 },
  { id: 's5', name: 'Walang Preno', creator: 'chaoskid', audience: 'Barkada', color: 'chaos', plays: 3100, copies: 270, age: 3, categories: ['dares', 'controversial'], size: 12 },
  { id: 's6', name: 'Strangers on a Bus', creator: 'byahero', audience: 'Strangers', color: 'icebreaker', plays: 410, copies: 95, age: 1, categories: ['hot_takes', 'hypotheticals'], size: 10 },
  { id: 's7', name: 'Mainit na Usapan', creator: 'spicygal', audience: 'Barkada', color: 'spicy', plays: 2750, copies: 610, age: 20, categories: ['controversial', 'confessions', 'dares'], size: 12 },
  { id: 's8', name: 'Throwback Thursday', creator: 'millennial_mom', audience: 'Custom', color: 'barkada', plays: 530, copies: 140, age: 8, categories: ['memories', 'relationships'], size: 10 },
];

export function sampleCards(d: SampleDeck) {
  const pool = CURATED_CARDS.filter((c) => c.cardType !== 'wild' && d.categories.includes(c.category));
  const start = d.id.charCodeAt(1) % Math.max(1, pool.length);
  return Array.from({ length: Math.min(d.size, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
}

export type DiscoverSort = 'trending' | 'plays' | 'copies' | 'new';
export function sortDecks(list: SampleDeck[], by: DiscoverSort): SampleDeck[] {
  const trend = (d: SampleDeck) => d.plays / Math.max(7, d.age);
  const key: Record<DiscoverSort, (d: SampleDeck) => number> = { trending: trend, plays: (d) => d.plays, copies: (d) => d.copies, new: (d) => -d.age };
  return [...list].sort((a, b) => key[by](b) - key[by](a));
}
