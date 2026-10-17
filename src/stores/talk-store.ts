import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import type { TalkTopic } from '@/lib/data/talk-topics';
import { talkCost, tallyOf, type TalkPick, type TalkTally } from '@/lib/game/talk';

/** A Topic deck session: the topics bought, and how far the table has got. */
interface TalkState {
  active: boolean;
  queue: TalkTopic[];
  index: number;
  /** Highest topic shown so far, so going back never changes what was used. */
  reached: number;
  /** What the table said on each topic that was counted, by topic id. */
  results: Record<string, TalkTally>;
  record: (topicId: string, tally: TalkTally) => void;
  /** The names playing this session. Fewer than two means the table counts by hand. */
  players: string[];
  /** The last names used, offered again next time. */
  roster: string[];
  /** Each player's answer per topic, when names are on. */
  picks: Record<string, Record<string, TalkPick>>;
  setPick: (topicId: string, name: string, value: TalkPick | null) => void;
  start: (queue: TalkTopic[], players?: string[]) => void;
  next: () => void;
  back: () => void;
  /** Ends the session. Returns the coins for topics never shown (refunded by the caller). */
  finish: () => number;
}

export const useTalkStore = create<TalkState>()(
  persist(
    (set, get) => ({
      active: false,
      queue: [],
      index: 0,
      reached: 0,
      results: {},
      players: [],
      roster: [],
      picks: {},
      setPick: (topicId, name, value) => set((s) => {
        const cur = { ...((s.picks ?? {})[topicId] ?? {}) };
        if (value) cur[name] = value; else delete cur[name];
        return { picks: { ...(s.picks ?? {}), [topicId]: cur }, results: { ...(s.results ?? {}), [topicId]: tallyOf(cur) } };
      }),
      record: (topicId, tally) => set((s) => ({ results: { ...(s.results ?? {}), [topicId]: tally } })),
      start: (queue, players = []) => set((s) => ({ active: queue.length > 0, queue, index: 0, reached: 0, results: {}, picks: {}, players, roster: players.length ? players : s.roster ?? [] })),
      next: () => set((s) => { const i = Math.min(s.queue.length, s.index + 1); return { index: i, reached: Math.max(s.reached, Math.min(i, s.queue.length - 1)) }; }),
      back: () => set((s) => ({ index: Math.max(0, s.index - 1) })),
      finish: () => {
        const s = get();
        const unused = Math.max(0, s.queue.length - (s.reached + 1));
        set({ active: false, queue: [], index: 0, reached: 0, results: {}, picks: {}, players: [] });
        return talkCost(unused);
      },
    }),
    { name: 'tagai-talk', version: 1, storage: safeStorage(), skipHydration: true,
      partialize: (s) => ({ active: s.active, queue: s.queue, index: s.index, reached: s.reached, results: s.results, players: s.players, roster: s.roster, picks: s.picks }) },
  ),
);
