import type { QueuedCard } from '@/lib/game/escalation-engine';

/** How many people a card needs. `max` is null when there is no upper limit. */
export interface PeopleFit { min: number; max: number | null }

const FOR_TWO = /\b(your partner|you two|between the two of you|just the two of you)\b/i;
const NEEDS_FOUR = /\bwhich two (people|players|friends)\b|\btwo (people|players) (here|in this)\b/i;
const NEEDS_THREE = /\b(in this room|in this group|in this circle|here|everyone|everybody|each person|who in|who here|which person|which one of you|the group|your group|across from you)\b/i;
const NEEDS_TWO = /\b(person on your (left|right)|player on your (left|right)|to your (left|right)|next person|someone here|another player)\b/i;

/**
 * Reads how many people a card needs. A card can set `people` itself; otherwise it is
 * worked out from the wording ("in this room" needs at least three, "the person on your left" two).
 */
export function playersNeeded(card: Pick<QueuedCard, 'text'> & { people?: PeopleFit }): PeopleFit {
  if (card.people) return card.people;
  if (FOR_TWO.test(card.text)) return { min: 2, max: 2 };
  if (NEEDS_FOUR.test(card.text)) return { min: 4, max: null };
  if (NEEDS_THREE.test(card.text)) return { min: 3, max: null };
  if (NEEDS_TWO.test(card.text)) return { min: 2, max: null };
  return { min: 2, max: null };
}

export const fitsPlayers = (card: Pick<QueuedCard, 'text'> & { people?: PeopleFit }, n: number): boolean => {
  const f = playersNeeded(card);
  return n >= f.min && (f.max === null || n <= f.max);
};

/** Short label for a card, or null when it works for any group so there is nothing to say. */
export function peopleLabel(card: Pick<QueuedCard, 'text'> & { people?: PeopleFit }): string | null {
  const f = playersNeeded(card);
  if (f.max === 2) return 'Just 2 people';
  if (f.min > 2) return `${f.min}+ people`;
  return null;
}

/** Filter bands shown in Browse. A card matches a band when it works for any group size inside it. */
export const PEOPLE_BANDS = [
  { id: 'any', label: 'Any group size', sizes: [] as number[] },
  { id: 'two', label: '2 people', sizes: [2] },
  { id: 'few', label: '3 to 4', sizes: [3, 4] },
  { id: 'many', label: '5 or more', sizes: [5, 6, 8, 12] },
];
