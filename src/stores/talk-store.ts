import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import type { TalkTopic } from '@/lib/data/talk-topics';
import { talkCost } from '@/lib/game/talk';

/** A Topic deck session: the topics bought, and how far the table has got. */
interface TalkState {
  active: boolean;
  queue: TalkTopic[];
  index: number;
  /** Highest topic shown so far, so going back never changes what was used. */
  reached: number;
  start: (queue: TalkTopic[]) => void;
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
      start: (queue) => set({ active: queue.length > 0, queue, index: 0, reached: 0 }),
      next: () => set((s) => { const i = Math.min(s.queue.length, s.index + 1); return { index: i, reached: Math.max(s.reached, Math.min(i, s.queue.length - 1)) }; }),
      back: () => set((s) => ({ index: Math.max(0, s.index - 1) })),
      finish: () => {
        const s = get();
        const unused = Math.max(0, s.queue.length - (s.reached + 1));
        set({ active: false, queue: [], index: 0, reached: 0 });
        return talkCost(unused);
      },
    }),
    { name: 'tagai-talk', version: 1, storage: safeStorage(), skipHydration: true,
      partialize: (s) => ({ active: s.active, queue: s.queue, index: s.index, reached: s.reached }) },
  ),
);
