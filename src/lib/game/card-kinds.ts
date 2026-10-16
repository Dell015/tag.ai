/**
 * Card kinds: how a card is played. A truth is answered, a dare is done, and the rest bring
 * their own tool (dice, coin, bottle, wheel, timer, vote) so nobody has to find one.
 * Each kind has its own colour, set in globals.css through data-kind.
 */
export type CardKind = 'truth' | 'dare' | 'dice' | 'coin' | 'bottle' | 'wheel' | 'timer' | 'vote';

export interface CardTool {
  /** Dice: how many dice to roll. */
  dice?: 1 | 2;
  /** Wheel: what is on it. */
  labels?: string[];
  /** Timer: seconds to count down. */
  seconds?: number;
}

export const KIND_META: Record<CardKind, { label: string; tool: boolean; blurb: string }> = {
  truth: { label: 'Truth', tool: false, blurb: 'Answer out loud' },
  dare: { label: 'Dare', tool: false, blurb: 'Do it' },
  dice: { label: 'Dice', tool: true, blurb: 'Roll and follow the number' },
  coin: { label: 'Coin', tool: true, blurb: 'Heads or tails decides' },
  bottle: { label: 'Bottle', tool: true, blurb: 'The bottle picks a player' },
  wheel: { label: 'Wheel', tool: true, blurb: 'Spin for a fate' },
  timer: { label: 'Timer', tool: true, blurb: 'Beat the clock' },
  vote: { label: 'Vote', tool: true, blurb: 'Everyone points at once' },
};

/** The kind of a card. Older cards have none: questions are truths, actions are dares. */
export function kindOf(card: { cardType: string; kind?: CardKind }): CardKind {
  return card.kind ?? (card.cardType === 'action' ? 'dare' : 'truth');
}

/** Text with {drink} swapped for the table's wording. */
export const fillDrink = (text: string, nonDrinking: boolean): string => text.replace(/\{drink\}/g, nonDrinking ? 'do a forfeit' : 'drink');
