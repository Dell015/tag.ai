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

// ─── Heat-driven draw: easy first, wilder as the meter fills, random at the top ──

/** At this heat the meter is full and the draw is completely random. */
export const MAX_HEAT_AT = 4.95;

/** Easier decks first. Used to break ties between cards of the same intensity. */
const DECK_EASE: Record<string, number> = { icebreaker: 0, family: 0, life: 0.2, barkada: 0.4, deep: 0.4, lovers: 0.4, spicy: 0.7, social: 0.7, adult: 0.9, chaos: 0.5 };

const ease = (c: QueuedCard) => c.intensity + (c.deckId ? DECK_EASE[c.deckId] ?? 0.4 : 0.4);

/**
 * Picks what comes next. The meter decides how hard: heat 1 draws the easiest cards (Icebreaker
 * and Family first), heat 4 draws the hardest, and a full meter draws anything at all. Wild cards
 * keep their places, so only cards between them move. Same-category and same-deck repeats are
 * pushed down so the table still gets variety. Pure, returns a new array.
 */
export function drawForHeat(queue: QueuedCard[], index: number, heat: number, random: () => number = Math.random): QueuedCard[] {
  const current = queue[index];
  if (!current || current.cardType === 'wild') return queue;
  const slots: number[] = [];
  for (let i = index; i < queue.length; i++) if (queue[i].cardType !== 'wild') slots.push(i);
  if (slots.length < 2) return queue;

  let pick = slots[0];
  if (heat >= MAX_HEAT_AT) {
    pick = slots[Math.floor(random() * slots.length)];
  } else {
    const before = queue[index - 1];
    let best = Infinity;
    for (const i of slots) {
      const c = queue[i];
      let score = Math.abs(ease(c) - (heat + 0.2)) + random() * 0.7;
      if (before && before.cardType !== 'wild') {
        if (c.category === before.category) score += 1.5;
        if (c.deckId && c.deckId === before.deckId) score += 0.3;
      }
      if (score < best) { best = score; pick = i; }
    }
  }
  if (pick === index) return queue;
  const next = [...queue];
  [next[index], next[pick]] = [next[pick], next[index]];
  return next;
}
