/** Choices offered in the setup wizard. */

export const PRESET_COUNTS = [10, 20, 30, 40, 50] as const;
export const SECONDS_PER_CARD = 30;

/**
 * Calculates the estimated session duration string based on card count.
 * Assumes ~30 seconds per card.
 */
export function formatDuration(cardCount: number): string {
  const totalSeconds = cardCount * SECONDS_PER_CARD;
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `~${hours} hr`;
  }
  return `~${hours} hr ${remainingMinutes} min`;
}

export type DrinkRuleTemplateId = 'Classic' | 'Chaos' | 'Soft_Mode' | 'Points_Based';

export interface DrinkRuleTemplate {
  id: DrinkRuleTemplateId;
  name: string;
  description: string;
  summary: string;
}

export const DRINK_RULE_TEMPLATES: DrinkRuleTemplate[] = [
  {
    id: 'Classic',
    name: 'Classic',
    description: 'Traditional drink-when-you-draw rules',
    summary: 'Person who drew drinks. Group votes on skips.',
  },
  {
    id: 'Chaos',
    name: 'Chaos',
    description: 'Random targets every round',
    summary: 'Random person drinks each round. Double if wild card.',
  },
  {
    id: 'Soft_Mode',
    name: 'Soft Mode',
    description: 'Relaxed and low-pressure',
    summary: 'Only drink on dare cards. Otherwise, take a sip.',
  },
  {
    id: 'Points_Based',
    name: 'Points Based',
    description: 'Competitive scoring system',
    summary: 'Points for completing challenges. Lowest points drinks at the end.',
  },
];

export const MAX_CUSTOM_RULES = 5;
