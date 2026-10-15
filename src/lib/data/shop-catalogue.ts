/**
 * Shop catalogue (docs/FRONTEND_PLAN.md section 6). Mock data for Stage A.
 * Pack contents are short sample sets in the existing voice; the counts shown
 * in the UI are the real counts, so the pool never lies.
 */
import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { CardCategory } from '@/types/game';

export type ShopKind = 'coins' | 'tool' | 'pack' | 'frame' | 'back' | 'theme';

export interface CoinPackage { id: string; name: string; price: number; coins: number; bonus?: number; badge?: string }
export interface ShopItem { id: string; kind: Exclude<ShopKind, 'coins'>; name: string; price: number; description: string; value?: string }

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'starter', name: 'Starter', price: 20, coins: 20 },
  { id: 'night-out', name: 'Night Out', price: 49, coins: 55, bonus: 5, badge: 'Most picked' },
  { id: 'party-pack', name: 'Party Pack', price: 99, coins: 120, bonus: 20 },
  { id: 'treasurer', name: 'Treasurer', price: 199, coins: 260, bonus: 60 },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'tool-dice', kind: 'tool', name: 'Dice', price: 12, description: 'Roll one or two dice. Big result, shake to roll.' },
  { id: 'tool-bottle', kind: 'tool', name: 'Spin the bottle', price: 12, description: 'A spinner that picks a player from the table.' },
  { id: 'tool-wheel', kind: 'tool', name: 'Wheel', price: 15, description: 'A spinner with your own labels, made for dares.' },

  { id: 'pack-videoke', kind: 'pack', name: 'Videoke night', price: 25, description: 'Sing-or-drink dares and music confessions.' },
  { id: 'pack-outing', kind: 'pack', name: 'Outing edition', price: 25, description: 'Beach, road trip and overnight cards.' },
  { id: 'pack-office', kind: 'pack', name: 'Office party', price: 40, description: 'Safe-for-HR chaos for workmates.' },
  { id: 'pack-pasko', kind: 'pack', name: 'Pasko and reunion', price: 30, description: 'Family-friendly, tita-proof.' },
  { id: 'pack-deep', kind: 'pack', name: 'Late night deep', price: 30, description: 'Slow, honest, vulnerable cards.' },
  { id: 'pack-pulutan', kind: 'pack', name: 'Pulutan dares', price: 20, description: 'Dares only, short and physical.' },

  { id: 'frame-stripe', kind: 'frame', name: 'Stripe frame', price: 10, description: 'A striped ring around your avatar.', value: 'stripe' },
  { id: 'frame-dots', kind: 'frame', name: 'Dots frame', price: 10, description: 'A dotted ring around your avatar.', value: 'dots' },
  { id: 'frame-double', kind: 'frame', name: 'Double frame', price: 10, description: 'Two thin rings around your avatar.', value: 'double' },

  { id: 'back-jeepney', kind: 'back', name: 'Jeepney stripes', price: 15, description: 'Face-down cards in loud diagonal stripes.', value: 'jeepney' },
  { id: 'back-checker', kind: 'back', name: 'Checker', price: 15, description: 'Face-down cards in a checkerboard.', value: 'checker' },
  { id: 'back-sunburst', kind: 'back', name: 'Sunburst', price: 15, description: 'Face-down cards with rays from the centre.', value: 'sunburst' },
  { id: 'back-ink', kind: 'back', name: 'Plain ink', price: 15, description: 'Face-down cards in solid dark ink.', value: 'ink' },

  { id: 'theme-blue', kind: 'theme', name: 'Blue accent', price: 20, description: 'Buttons and highlights in blue outside games.', value: '66 116 255' },
  { id: 'theme-pink', kind: 'theme', name: 'Pink accent', price: 20, description: 'Buttons and highlights in pink outside games.', value: '255 130 178' },
  { id: 'theme-green', kind: 'theme', name: 'Green accent', price: 20, description: 'Buttons and highlights in green outside games.', value: '48 190 112' },
];

export const itemById = (id: string) => SHOP_ITEMS.find((i) => i.id === id);

type P = [string, 'question' | 'action', number, CardCategory];
function pack(id: string, rows: P[]): QueuedCard[] {
  return rows.map(([text, cardType, intensity, category], i) => ({ id: `${id}-${i + 1}`, text, cardType, intensity, category, topics: [] }));
}

export const PACK_CARDS: Record<string, QueuedCard[]> = {
  'pack-videoke': pack('videoke', [
    ['What song do you secretly sing at the top of your lungs when alone?', 'question', 2, 'confessions'],
    ['Sing the chorus of any song. Group votes if you drink.', 'action', 2, 'dares'],
    ['Which ex would you dedicate a Sampaguita song to?', 'question', 3, 'relationships'],
    ['Duet with the person on your left. Pick the song together.', 'action', 3, 'dares'],
    ['Name the song that always makes you cry at 2 AM.', 'question', 4, 'memories'],
    ['Who in this group would win a videoke contest? Everyone points at once.', 'question', 1, 'hot_takes'],
  ]),
  'pack-outing': pack('outing', [
    ['Worst thing that has happened to you on a road trip?', 'question', 2, 'memories'],
    ['Who in this group would be the first to get lost in the forest?', 'question', 1, 'roasts'],
    ['Do ten jumping jacks as if the beach is watching.', 'action', 2, 'dares'],
    ['What would you never share in a shared tent?', 'question', 3, 'confessions'],
    ['Describe your ideal outing in one sentence. Group rates it.', 'question', 1, 'hypotheticals'],
    ['Whose snoring would ruin the overnight?', 'question', 2, 'roasts'],
  ]),
  'pack-office': pack('office', [
    ['Which coworker would survive the longest in a zombie apocalypse?', 'question', 1, 'hypotheticals'],
    ['What is the most useless meeting you have attended?', 'question', 1, 'hot_takes'],
    ['Give your boss a nickname, out loud.', 'action', 2, 'dares'],
    ['What small thing do you secretly judge people for at work?', 'question', 2, 'confessions'],
    ['Pitch your worst business idea in ten seconds.', 'action', 2, 'dares'],
    ['If HR read your search history today, what would they ask first?', 'question', 3, 'hypotheticals'],
  ]),
  'pack-pasko': pack('pasko', [
    ['Which relative gives the most awkward Christmas gift?', 'question', 1, 'roasts'],
    ['What do you pretend to like at family reunions?', 'question', 1, 'confessions'],
    ['Do your best impression of your tita giving advice.', 'action', 2, 'dares'],
    ['What was your favourite Noche Buena dish growing up?', 'question', 1, 'memories'],
    ['Who in the family would win a karaoke battle?', 'question', 1, 'hot_takes'],
    ['What question from relatives do you dread most?', 'question', 2, 'confessions'],
  ]),
  'pack-deep': pack('deep', [
    ['What are you most afraid people will find out about you?', 'question', 5, 'deep_philosophical'],
    ['Who did you lose touch with that you still think about?', 'question', 4, 'relationships'],
    ['What would you tell your younger self at 16?', 'question', 4, 'memories'],
    ['What part of your life do you feel you are pretending in?', 'question', 5, 'deep_philosophical'],
    ['What is something you forgave but never forgot?', 'question', 4, 'confessions'],
    ['What do you want more of in the next five years?', 'question', 3, 'hypotheticals'],
  ]),
  'pack-pulutan': pack('pulutan', [
    ['Eat the next bite of pulutan without using your hands.', 'action', 2, 'dares'],
    ['Hold a plank until the next person finishes their turn.', 'action', 3, 'dares'],
    ['Let the group choose a sticker to put on your forehead.', 'action', 2, 'dares'],
    ['Say a tongue twister three times fast. Fail and you drink.', 'action', 1, 'dares'],
    ['Swap seats with someone. They pick who.', 'action', 2, 'dares'],
    ['Whisper your next sentence. Everyone else must copy you.', 'action', 2, 'dares'],
  ]),
};

export const packCardCount = (id: string) => PACK_CARDS[id]?.length ?? 0;
export const packPreview = (id: string) => (PACK_CARDS[id] ?? []).slice(0, 3);
