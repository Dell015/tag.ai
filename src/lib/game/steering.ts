import { QueuedCard, selectCardByHeat } from './escalation-engine';

/** How many upcoming cards are considered when steering the next draw. */
export const STEER_WINDOW = 8;

/**
 * Heat-driven draw: swaps the card at `index` for one picked from the next
 * STEER_WINDOW question cards using `selectCardByHeat` (60% current level,
 * 30% adjacent, 10% distant). Wild and action cards stay where the schedule put
 * them, so wild/action frequency is untouched. Pure — returns a new array.
 */
export function steerNextCard(
  queue: QueuedCard[],
  index: number,
  heat: number,
  random: () => number = Math.random
): QueuedCard[] {
  const current = queue[index];
  if (!current || current.cardType !== 'question') return queue;

  const candidates: { card: QueuedCard; at: number }[] = [];
  for (let i = index; i < Math.min(queue.length, index + STEER_WINDOW); i++) {
    if (queue[i].cardType === 'question') candidates.push({ card: queue[i], at: i });
  }
  if (candidates.length < 2) return queue;

  const picked = selectCardByHeat(
    candidates.map((c) => c.card),
    heat,
    random
  );
  const at = candidates.find((c) => c.card.id === picked.id)!.at;
  if (at === index) return queue;
  // Never swap in a card that starts a run of the same category.
  const before = queue[index - 1];
  if (before && picked.category === before.category && current.category !== before.category) return queue;

  const next = [...queue];
  [next[index], next[at]] = [next[at], next[index]];
  return next;
}
