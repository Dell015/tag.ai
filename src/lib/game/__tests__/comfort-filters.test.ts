import { describe, it, expect } from 'vitest';
import {
  expandComfortFilters,
  isCardFiltered,
  normalizeTopic,
  PRESET_TOPICS,
  PRESET_TOPIC_TAGS,
} from '../comfort-filters';
import { buildCardQueue } from '../card-queue-builder';
import type { QueuedCard } from '../escalation-engine';

const card = (id: string, text: string, topics: string[], intensity = 2): QueuedCard => ({
  id,
  text,
  topics,
  intensity,
  cardType: 'question',
  category: 'relationships',
});

describe('comfort filters', () => {
  it('normalizes labels to snake_case', () => {
    expect(normalizeTopic('Past Relationships')).toBe('past_relationships');
    expect(normalizeTopic('  Trauma/Mental Health ')).toBe('trauma_mental_health');
  });

  it('every preset maps to at least one tag', () => {
    for (const preset of PRESET_TOPICS) {
      expect(PRESET_TOPIC_TAGS[preset].length).toBeGreaterThan(0);
    }
  });

  it('preset labels exclude cards with the matching seed tags', () => {
    const f = expandComfortFilters(['Past Relationships', 'Trauma/Mental Health', 'Sexual Content']);
    expect(isCardFiltered(card('1', 'x', ['past_relationships']), f)).toBe(true);
    expect(isCardFiltered(card('2', 'x', ['mental_health']), f)).toBe(true);
    expect(isCardFiltered(card('3', 'x', ['sexual_content']), f)).toBe(true);
    expect(isCardFiltered(card('4', 'x', ['food']), f)).toBe(false);
  });

  it('custom filters match tags and whole words in card text', () => {
    const f = expandComfortFilters(['ex', 'work talk']);
    expect(isCardFiltered(card('1', 'Text your ex right now', ['dating']), f)).toBe(true);
    expect(isCardFiltered(card('2', 'Hot take on next week', ['food']), f)).toBe(false);
    expect(isCardFiltered(card('3', 'No work talk allowed', ['food']), f)).toBe(true);
  });

  it('buildCardQueue never returns a filtered card', () => {
    const library = Array.from({ length: 80 }, (_, i) =>
      card(`c${i}`, `Question ${i}`, i % 2 === 0 ? ['past_relationships'] : ['food'], (i % 5) + 1)
    );
    const { cards, buffer } = buildCardQueue(
      { gameMode: 'chaos', cardCountTarget: 20, comfortFilters: ['Past Relationships'], trashedCardIds: [], playerCount: 3 },
      library
    );
    for (const c of [...cards, ...buffer]) expect(c.topics).not.toContain('past_relationships');
  });

  it('wild card ids are unique', () => {
    const library = Array.from({ length: 200 }, (_, i) => card(`c${i}`, `Q${i}`, ['food'], (i % 5) + 1));
    const { cards, buffer } = buildCardQueue(
      { gameMode: 'chaos', cardCountTarget: 50, comfortFilters: [], trashedCardIds: [], playerCount: 3 },
      library
    );
    const ids = [...cards, ...buffer].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
