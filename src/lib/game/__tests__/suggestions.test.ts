import { describe, it, expect } from 'vitest';
import { MAX_PER_DAY, POINTS_PER_LIKE, nextWeekStart, prevWeekStart, sampleSuggestions, validateSuggestion, weekStart, weekWinner, weeklyRanking, type Suggestion } from '../suggestions';

const WED = new Date(2026, 9, 14, 15, 0).getTime(); // Wed 14 Oct 2026
const mk = (id: string, authorId: string, at: number, likes: string[] = []): Suggestion => ({ id, text: `Card number ${id} for the test`, kind: 'truth', deckId: 'barkada', authorId, authorName: authorId, createdAt: at, likes });

describe('week boundaries', () => {
  it('starts on Monday at midnight', () => {
    const s = new Date(weekStart(WED));
    expect([s.getDay(), s.getHours(), s.getDate()]).toEqual([1, 0, 12]);
    expect(new Date(nextWeekStart(WED)).getDate()).toBe(19);
    expect(new Date(prevWeekStart(WED)).getDate()).toBe(5);
  });
  it('Sunday still belongs to the week that began the Monday before', () => {
    expect(weekStart(new Date(2026, 9, 18, 23, 0).getTime())).toBe(weekStart(WED));
  });
});

describe('validateSuggestion', () => {
  const none: Suggestion[] = [];
  it('rejects short, long and duplicate cards', () => {
    expect(validateSuggestion('too short', 'a', none, WED)).toMatch(/at least/);
    expect(validateSuggestion('x'.repeat(200), 'a', none, WED)).toMatch(/under/);
    expect(validateSuggestion('card number 1 for the test', 'a', [mk('1', 'b', WED)], WED)).toMatch(/already/);
  });
  it('limits a player to a few cards a day', () => {
    const many = Array.from({ length: MAX_PER_DAY }, (_, i) => mk(`d${i}`, 'a', WED - 1000));
    expect(validateSuggestion('A brand new card that is fine to send', 'a', many, WED)).toMatch(/a day/);
    expect(validateSuggestion('A brand new card that is fine to send', 'b', many, WED)).toBeNull();
  });
});

describe('weekly ranking', () => {
  const start = weekStart(WED);
  it('scores cards and likes from others, ignoring the author own like', () => {
    const items = [mk('1', 'a', start + 1000, ['b', 'c', 'a']), mk('2', 'b', start + 2000, ['a'])];
    const r = weeklyRanking(items, start);
    expect(r[0]).toMatchObject({ authorId: 'a', cards: 1, likes: 2, points: 1 + 2 * POINTS_PER_LIKE });
    expect(r[1].authorId).toBe('b');
  });
  it('only counts cards written inside the week', () => {
    const items = [mk('1', 'a', start - 1000, ['b']), mk('2', 'b', start + 1000)];
    expect(weeklyRanking(items, start).map((c) => c.authorId)).toEqual(['b']);
  });
  it('a week with no likes has no winner', () => {
    expect(weekWinner([mk('1', 'a', start + 1000)], start)).toBeNull();
    expect(weekWinner([mk('1', 'a', start + 1000, ['b'])], start)?.authorId).toBe('a');
  });
  it('sample data gives this week and last week a winner', () => {
    const items = sampleSuggestions(WED);
    expect(weekWinner(items, prevWeekStart(WED))?.name).toBe('titacora');
    expect(weeklyRanking(items, weekStart(WED)).length).toBeGreaterThan(2);
  });
});
