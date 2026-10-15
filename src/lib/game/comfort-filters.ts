/**
 * Comfort filters — canonical mapping from the host-facing preset labels to the
 * snake_case `topics` tags used on cards (see supabase/seed/cards.sql).
 *
 * Custom (free-text) filters are normalised to snake_case and also matched as a
 * whole-word search against the card text, so "ex" or "work talk" still work.
 */

export const PRESET_TOPICS = [
  'Politics',
  'Religion',
  'Trauma/Mental Health',
  'Money/Finances',
  'Family Drama',
  'Sexual Content',
  'Past Relationships',
  'Physical Appearance',
  'Career/Work Stress',
  'Death/Loss',
  '18+ Cards',
] as const;

export type PresetTopic = (typeof PRESET_TOPICS)[number];

export const PRESET_TOPIC_TAGS: Record<PresetTopic, string[]> = {
  Politics: ['politics', 'political', 'election', 'government'],
  Religion: ['religion', 'faith', 'church'],
  'Trauma/Mental Health': ['trauma', 'mental_health', 'fears'],
  'Money/Finances': ['money', 'finances', 'debt'],
  'Family Drama': ['family_drama', 'family'],
  'Sexual Content': ['sexual_content', 'sex'],
  'Past Relationships': ['past_relationships', 'ex'],
  'Physical Appearance': ['physical_appearance', 'physical', 'body'],
  'Career/Work Stress': ['career', 'work'],
  'Death/Loss': ['death', 'grief', 'loss'],
  '18+ Cards': ['adult'],
};

/** "Past Relationships" -> "past_relationships" */
export function normalizeTopic(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function isPresetTopic(value: string): value is PresetTopic {
  return (PRESET_TOPICS as readonly string[]).includes(value);
}

export interface ExpandedFilters {
  /** Card `topics` tags that must not appear on a drawn card. */
  tags: Set<string>;
  /** Lower-cased free-text words that must not appear in a card's text. */
  words: string[];
}

export function expandComfortFilters(filters: string[]): ExpandedFilters {
  const tags = new Set<string>();
  const words: string[] = [];

  for (const filter of filters) {
    if (isPresetTopic(filter)) {
      PRESET_TOPIC_TAGS[filter].forEach((t) => tags.add(t));
      continue;
    }
    const normalized = normalizeTopic(filter);
    if (!normalized) continue;
    tags.add(normalized);
    // Also add each word of a multi-word custom filter ("work talk" -> work, talk).
    const lower = filter.trim().toLowerCase();
    if (lower.length >= 2) words.push(lower);
  }

  return { tags, words };
}

/** True if the card should be excluded by the active comfort filters. */
export function isCardFiltered(
  card: { text: string; topics: string[] },
  expanded: ExpandedFilters
): boolean {
  if (card.topics.some((t) => expanded.tags.has(normalizeTopic(t)))) return true;
  if (expanded.words.length === 0) return false;
  const text = card.text.toLowerCase();
  return expanded.words.some((w) => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text);
  });
}
