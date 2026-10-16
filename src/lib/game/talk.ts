/**
 * Topic deck: a conversation deck with no turns, shots or pot. Players buy a number of topics,
 * then tap through them (and can go back). Pure functions, no state.
 */
import { TALK_TOPICS, type TalkGroupId, type TalkTopic } from '@/lib/data/talk-topics';
import { expandComfortFilters, isCardFiltered } from '@/lib/game/comfort-filters';

/** Coins one topic costs. */
export const TALK_PRICE = 0.1;
export const TALK_MIN = 10;
export const TALK_MAX = 100;
export const TALK_STEP = 5;

export const talkCost = (topics: number): number => Math.round(topics * TALK_PRICE * 1000) / 1000;

/** True when a filter list rules this topic out. Same matching as the drinking game's card filters. */
export const isTalkFiltered = (t: TalkTopic, filters: string[]): boolean =>
  isCardFiltered({ text: t.text, topics: t.topics ?? [] }, expandComfortFilters(filters));

/** Topics available for the chosen groups and filters. */
export function talkPool(groups: TalkGroupId[], filters: string[], all: TalkTopic[] = TALK_TOPICS): TalkTopic[] {
  return all.filter((t) => groups.includes(t.group) && !isTalkFiltered(t, filters));
}

/** A shuffled queue of `count` topics. Mixes groups evenly by dealing round robin from shuffled groups. */
export function buildTalkQueue(count: number, groups: TalkGroupId[], filters: string[], random: () => number = Math.random, all: TalkTopic[] = TALK_TOPICS): TalkTopic[] {
  const shuffle = <T,>(arr: T[]): T[] => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const buckets = shuffle(groups).map((g) => shuffle(talkPool([g], filters, all)));
  const out: TalkTopic[] = [];
  while (out.length < count && buckets.some((b) => b.length > 0)) {
    for (const b of buckets) { const t = b.pop(); if (t && out.length < count) out.push(t); }
  }
  return out;
}
