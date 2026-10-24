/**
 * Topic deck: a conversation deck with no turns, shots or pot. Players buy a number of topics,
 * then tap through them (and can go back). Pure functions, no state.
 */
import { TALK_TOPICS, type TalkGroupId, type TalkTopic } from '@/lib/data/talk-topics';
import { getRemoteContent } from '@/lib/data/remote-content';
import { expandComfortFilters, isCardFiltered } from '@/lib/game/comfort-filters';

/** Coins one topic costs. */
export const TALK_PRICE = 1;
export const TALK_MIN = 10;
export const TALK_MAX = 100;
export const TALK_STEP = 5;

export const talkCost = (topics: number): number => Math.round(topics * TALK_PRICE * 1000) / 1000;

/** True when a filter list rules this topic out. Same matching as the drinking game's card filters. */
export const isTalkFiltered = (t: TalkTopic, filters: string[]): boolean =>
  isCardFiltered({ text: t.text, topics: t.topics ?? [] }, expandComfortFilters(filters));

/** Topics available for the chosen groups and filters. */
export function talkPool(groups: TalkGroupId[], filters: string[], all: TalkTopic[] = getRemoteContent()?.topics ?? TALK_TOPICS): TalkTopic[] {
  return all.filter((t) => groups.includes(t.group) && !isTalkFiltered(t, filters));
}

/** A shuffled queue of `count` topics. Mixes groups evenly by dealing round robin from shuffled groups. */
export function buildTalkQueue(count: number, groups: TalkGroupId[], filters: string[], random: () => number = Math.random, all: TalkTopic[] = getRemoteContent()?.topics ?? TALK_TOPICS): TalkTopic[] {
  const shuffle = <T,>(arr: T[]): T[] => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const buckets = shuffle(groups).map((g) => shuffle(talkPool([g], filters, all)));
  const out: TalkTopic[] = [];
  while (out.length < count && buckets.some((b) => b.length > 0)) {
    for (const b of buckets) { const t = b.pop(); if (t && out.length < count) out.push(t); }
  }
  return out;
}

/** What the table said on one topic: how many on each side. */
export interface TalkTally { a: number; b: number }

/** One player's answer to a topic: the first option (agree or A) or the second. */
export type TalkPick = 'a' | 'b';
export const MAX_PLAYERS = 12;
export const MAX_NAME = 16;

/** Counts the picks of a topic into a tally. */
export const tallyOf = (picks: Record<string, TalkPick> | undefined): TalkTally => {
  const v = Object.values(picks ?? {});
  return { a: v.filter((x) => x === 'a').length, b: v.filter((x) => x === 'b').length };
};

/** The players on the smaller side of a split, or none when the table is even or agreed. */
export const minorityNames = (picks: Record<string, TalkPick> | undefined): string[] => {
  const t = tallyOf(picks);
  if (t.a === 0 || t.b === 0 || t.a === t.b) return [];
  const small: TalkPick = t.a < t.b ? 'a' : 'b';
  return Object.entries(picks ?? {}).filter(([, v]) => v === small).map(([n]) => n);
};

/** Cleans a name list: trimmed, no blanks, no duplicates (ignoring case), at most MAX_PLAYERS, each at most MAX_NAME long. */
export function cleanNames(names: string[]): string[] {
  const seen = new Set<string>(); const out: string[] = [];
  for (const raw of names) {
    const n = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
    if (n && !seen.has(n.toLowerCase()) && out.length < MAX_PLAYERS) { seen.add(n.toLowerCase()); out.push(n); }
  }
  return out;
}

/** Who goes first on a topic: the roster in turn, so everyone gets their go. */
export const speakerFor = (players: string[], index: number): string | undefined => (players.length >= 2 ? players[index % players.length] : undefined);

/** One line about a tally, and whether a minority has something to argue. */
export function splitVerdict(t: TalkTally, labelA: string, labelB: string): { text: string; minority: boolean } {
  const total = t.a + t.b;
  if (total === 0) return { text: 'Tap the counts to match your table.', minority: false };
  if (t.a === 0 || t.b === 0) return { text: `Everyone said ${(t.a ? labelA : labelB).toLowerCase()}.`, minority: false };
  if (t.a === t.b) return { text: `Split ${t.a} to ${t.b}. Nobody has the majority.`, minority: true };
  const [big, small, label] = t.a > t.b ? [t.a, t.b, labelB] : [t.b, t.a, labelA];
  return { text: `${big} to ${small}. The ${label.toLowerCase()} side has 30 seconds to argue back.`, minority: true };
}

/** The most divided and the most agreed topics of a session, for the recap. */
export function talkRecap(results: Record<string, TalkTally>, queue: TalkTopic[], picks: Record<string, Record<string, TalkPick>> = {}): { divided?: { topic: TalkTopic; tally: TalkTally }; agreed?: { topic: TalkTopic; tally: TalkTally }; voted: number; contrarian?: { name: string; times: number } } {
  const seen = queue.map((topic) => ({ topic, tally: results[topic.id] })).filter((x): x is { topic: TalkTopic; tally: TalkTally } => !!x.tally && x.tally.a + x.tally.b >= 2);
  const spread = (x: { tally: TalkTally }) => Math.abs(x.tally.a - x.tally.b) / (x.tally.a + x.tally.b);
  const split = seen.filter((x) => x.tally.a > 0 && x.tally.b > 0).sort((p, q) => spread(p) - spread(q) || (q.tally.a + q.tally.b) - (p.tally.a + p.tally.b));
  const same = seen.filter((x) => (x.tally.a === 0 || x.tally.b === 0) && x.tally.a + x.tally.b >= 3).sort((p, q) => (q.tally.a + q.tally.b) - (p.tally.a + p.tally.b));
  const times = new Map<string, number>();
  for (const t of queue) for (const n of minorityNames(picks[t.id])) times.set(n, (times.get(n) ?? 0) + 1);
  const top = Array.from(times.entries()).sort((p, q) => q[1] - p[1] || p[0].localeCompare(q[0]))[0];
  return { divided: split[0], agreed: same[0], voted: seen.length, contrarian: top && top[1] >= 2 ? { name: top[0], times: top[1] } : undefined };
}
