/**
 * Card kinds: how a card is played. A truth is answered, a dare is done, and the rest bring
 * their own tool (dice, coin, bottle, wheel, timer, vote) so nobody has to find one.
 * Each kind has its own colour, set in globals.css through data-kind.
 */
export type CardKind = 'truth' | 'dare' | 'dice' | 'coin' | 'bottle' | 'wheel' | 'timer' | 'vote' | 'rule';

export interface CardTool {
  /** Dice: how many dice to roll. */
  dice?: 1 | 2;
  /** Wheel: what is on it. */
  labels?: string[];
  /** Timer: seconds to count down. */
  seconds?: number;
  /** Rule and wild cards: which tool they use (dice, coin, bottle or wheel). */
  via?: CardKind;
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
  rule: { label: 'Rule', tool: false, blurb: 'Holds until the next wild card' },
};

/** The kind of a card. Older cards have none: questions are truths, actions are dares. */
export function kindOf(card: { cardType: string; kind?: CardKind }): CardKind {
  return card.kind ?? (card.cardType === 'action' ? 'dare' : 'truth');
}

/**
 * Text with drink words swapped for the table's wording:
 * {drink} = drink / do a forfeit, {shot} = a shot / a forfeit, {shots} = shots / forfeits.
 */
export const fillDrink = (text: string, nonDrinking: boolean): string =>
  text.replace(/\{drink\}/g, nonDrinking ? 'do a forfeit' : 'drink').replace(/\{shots\}/g, nonDrinking ? 'forfeits' : 'shots').replace(/\{shot\}/g, nonDrinking ? 'a forfeit' : 'a shot');

/**
 * Shots for failing or refusing a card. A card can set its own; otherwise a truth costs 1,
 * a dare 1 (2 from intensity 4), and every other kind 1. Wild cards set theirs (2 or 3).
 */
export function penaltyFor(card: { cardType: string; kind?: CardKind; intensity: number; penalty?: number }): number {
  if (card.penalty) return card.penalty;
  if (kindOf(card) === 'dare' && card.intensity >= 4) return 2;
  return 1;
}

/** The consequence line at the bottom of a card. */
export const penaltyText = (shots: number, nonDrinking: boolean): string =>
  nonDrinking ? `do ${shots === 1 ? 'a forfeit' : `${shots} forfeits`}` : `take ${shots === 1 ? 'a shot' : `${shots} shots`}`;
