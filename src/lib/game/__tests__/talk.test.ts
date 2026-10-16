import { describe, expect, it } from 'vitest';
import { TALK_GROUPS, TALK_TOPICS } from '@/lib/data/talk-topics';
import { buildTalkQueue, isTalkFiltered, talkCost, talkPool } from '../talk';

const all = TALK_GROUPS.map((g) => g.id);

describe('topic deck content', () => {
  it('every topic belongs to a known group, has unique id and no emoji or em dash', () => {
    const ids = new Set(TALK_TOPICS.map((t) => t.id));
    expect(ids.size).toBe(TALK_TOPICS.length);
    TALK_TOPICS.forEach((t) => {
      expect(all).toContain(t.group);
      expect(t.text.includes(String.fromCharCode(0x2014))).toBe(false);
      expect(t.text.split("").every((ch) => ch.charCodeAt(0) < 0xD800)).toBe(true);
    });
  });
  it('every group has topics', () => TALK_GROUPS.forEach((g) => expect(talkPool([g.id], []).length).toBeGreaterThan(0)));
});

describe('topic deck logic', () => {
  it('costs by quantity', () => expect(talkCost(20)).toBeCloseTo(2, 5));
  it('filters by tag and by custom word', () => {
    const rel = TALK_TOPICS.find((t) => t.topics?.includes('religion'))!;
    expect(isTalkFiltered(rel, ['Religion'])).toBe(true);
    expect(isTalkFiltered(rel, [])).toBe(false);
    expect(isTalkFiltered(TALK_TOPICS[0], ['lie'])).toBe(true);
    expect(talkPool(all, ['Religion', 'Politics']).some((t) => t.topics?.includes('religion') || t.topics?.includes('politics'))).toBe(false);
  });
  it('builds a queue of the asked size with no repeats and mixes groups', () => {
    const q = buildTalkQueue(16, all, []);
    expect(q).toHaveLength(16);
    expect(new Set(q.map((t) => t.id)).size).toBe(16);
    expect(new Set(q.slice(0, 8).map((t) => t.group)).size).toBeGreaterThan(3);
  });
  it('only uses the chosen groups and gives what exists when asked for more', () => {
    const q = buildTalkQueue(100, ['dilemma'], []);
    expect(q.every((t) => t.group === 'dilemma')).toBe(true);
    expect(q.length).toBe(talkPool(['dilemma'], []).length);
  });
});
