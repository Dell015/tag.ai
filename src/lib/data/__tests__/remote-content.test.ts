import { describe, it, expect, afterEach } from 'vitest';
import { libraryCards, findCard } from '@/lib/data/card-pool';
import { setRemoteContent } from '@/lib/data/remote-content';
import { talkPool } from '@/lib/game/talk';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { TalkTopic } from '@/lib/data/talk-topics';

const card = (id: string, adult = false): QueuedCard => ({ id, text: id, cardType: 'question', intensity: 1, category: 'hot_takes', topics: [], ...(adult ? { adult: true } : {}) });
const topic: TalkTopic = { id: 'db-topic', group: 'takes', text: 'From the database', format: 'agree' };

afterEach(() => setRemoteContent(null));

describe('content from the database', () => {
  it('uses the bundled cards until the database content is loaded', () => {
    expect(libraryCards(false).length).toBeGreaterThan(100);
  });
  it('replaces the library once loaded, and keeps 18+ cards out while the setting is off', () => {
    setRemoteContent({ cards: [card('a'), card('b', true)], topics: [topic] });
    expect(libraryCards(false).map((c) => c.id)).toEqual(['a']);
    expect(libraryCards(true).map((c) => c.id)).toEqual(['a', 'b']);
    expect(findCard('b', false)).toBeUndefined();
    expect(findCard('b', true)?.id).toBe('b');
  });
  it('talk topics come from the database when loaded', () => {
    setRemoteContent({ cards: [card('a')], topics: [topic] });
    expect(talkPool(['takes'], []).map((t) => t.id)).toEqual(['db-topic']);
  });
  it('goes back to the bundled copies when cleared', () => {
    setRemoteContent({ cards: [card('a')], topics: [topic] });
    setRemoteContent(null);
    expect(talkPool(['takes'], []).length).toBeGreaterThan(1);
  });
});
