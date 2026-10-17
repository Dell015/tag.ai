import { describe, expect, it } from 'vitest';
import { TALK_GROUPS, TALK_TOPICS, formatOf } from '@/lib/data/talk-topics';
import { buildTalkQueue, cleanNames, isTalkFiltered, minorityNames, speakerFor, splitVerdict, tallyOf, talkCost, talkPool, talkRecap } from '../talk';

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

describe('topic formats', () => {
  it('every topic has a follow-up and a valid format, and every ab topic has two options', () => {
    TALK_TOPICS.forEach((t) => {
      expect(t.deeper && t.deeper.length > 8).toBe(true);
      expect(['agree', 'ab', 'think', 'story']).toContain(formatOf(t));
      if (t.format === 'ab') { expect(t.a).toBeTruthy(); expect(t.b).toBeTruthy(); expect(t.a!.length).toBeLessThanOrEqual(24); expect(t.b!.length).toBeLessThanOrEqual(24); }
      expect([t.text, t.deeper, t.a, t.b].join(' ').includes(String.fromCharCode(0x2014))).toBe(false);
      expect(t.text.includes('!')).toBe(false);
    });
  });
  it('agree topics are statements, not questions', () => {
    TALK_TOPICS.filter((t) => t.format === 'agree').forEach((t) => expect(t.text.endsWith('?')).toBe(false));
  });
  it('every group plays at least two formats overall and stories are told, not counted', () => {
    expect(new Set(TALK_TOPICS.map((t) => formatOf(t))).size).toBe(4);
    TALK_TOPICS.filter((t) => t.group === 'stories').forEach((t) => expect(formatOf(t)).toBe('story'));
  });
  it('falls back to the group format for topics saved before formats existed', () => {
    expect(formatOf({ id: 'x', group: 'dilemma', text: 'Old' })).toBe('think');
    expect(formatOf({ id: 'x', group: 'takes', text: 'Old' })).toBe('agree');
    expect(formatOf({ id: 'x', group: 'stories', text: 'Old' })).toBe('story');
  });
  it('has enough topics in every group', () => TALK_GROUPS.forEach((g) => expect(talkPool([g.id], []).length).toBeGreaterThanOrEqual(5)));
});

describe('split verdict and recap', () => {
  it('describes each kind of split', () => {
    expect(splitVerdict({ a: 0, b: 0 }, 'Agree', 'Disagree').minority).toBe(false);
    expect(splitVerdict({ a: 4, b: 0 }, 'Agree', 'Disagree').text).toBe('Everyone said agree.');
    expect(splitVerdict({ a: 3, b: 1 }, 'Agree', 'Disagree')).toEqual({ text: '3 to 1. The disagree side has 30 seconds to argue back.', minority: true });
    expect(splitVerdict({ a: 2, b: 2 }, 'A', 'B').text).toMatch(/Split 2 to 2/);
  });
  it('finds the most divided and the most agreed topic', () => {
    const q = TALK_TOPICS.slice(0, 4);
    const r = talkRecap({ [q[0].id]: { a: 3, b: 3 }, [q[1].id]: { a: 5, b: 1 }, [q[2].id]: { a: 4, b: 0 }, [q[3].id]: { a: 1, b: 0 } }, q);
    expect(r.divided?.topic.id).toBe(q[0].id);
    expect(r.agreed?.topic.id).toBe(q[2].id);
    expect(r.voted).toBe(3);
  });
  it('has nothing to report when nothing was counted', () => expect(talkRecap({}, TALK_TOPICS.slice(0, 3))).toEqual({ divided: undefined, agreed: undefined, voted: 0 }));
});

describe('player names', () => {
  it('cleans names: trims, drops blanks and duplicates, caps the list and the length', () => {
    expect(cleanNames(['  Mika ', 'mika', '', 'Jun'])).toEqual(['Mika', 'Jun']);
    expect(cleanNames(Array.from({ length: 20 }, (_, i) => `P${i}`))).toHaveLength(12);
    expect(cleanNames(['x'.repeat(40)])[0]).toHaveLength(16);
  });
  it('counts picks and finds the minority', () => {
    const picks = { Mika: 'a', Jun: 'a', Ria: 'b' } as const;
    expect(tallyOf({ ...picks })).toEqual({ a: 2, b: 1 });
    expect(minorityNames({ ...picks })).toEqual(['Ria']);
    expect(minorityNames({ Mika: 'a', Jun: 'b' })).toEqual([]);
    expect(minorityNames({ Mika: 'a', Jun: 'a' })).toEqual([]);
    expect(minorityNames(undefined)).toEqual([]);
  });
  it('passes the first answer around the table, and only with two or more names', () => {
    expect(speakerFor(['A', 'B', 'C'], 0)).toBe('A');
    expect(speakerFor(['A', 'B', 'C'], 4)).toBe('B');
    expect(speakerFor(['A'], 0)).toBeUndefined();
    expect(speakerFor([], 3)).toBeUndefined();
  });
  it('names who was on the other side most often, after at least two times', () => {
    const q = TALK_TOPICS.slice(0, 3);
    const picks = { [q[0].id]: { A: 'a', B: 'a', C: 'b' }, [q[1].id]: { A: 'a', B: 'b', C: 'b' }, [q[2].id]: { A: 'b', B: 'a', C: 'a' } } as never;
    const r = talkRecap({}, q, picks);
    expect(r.contrarian).toEqual({ name: 'A', times: 2 });
    const again = { ...(picks as object), [q[2].id]: { A: 'a', B: 'a', C: 'b' } } as never;
    expect(talkRecap({}, q, again).contrarian).toEqual({ name: 'C', times: 2 });
  });
});
