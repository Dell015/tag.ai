import { create } from 'zustand';
import type { IntroVariant } from '@/lib/brand/intro';

interface IntroState {
  variant: IntroVariant | null;
  /** When the last intro ended, so sign in right after an opening does not play a second one. */
  endedAt: number;
  show: (v: IntroVariant) => void;
  hide: () => void;
}

export const useIntroStore = create<IntroState>((set, get) => ({
  variant: null,
  endedAt: 0,
  show: (v) => {
    if (get().variant || Date.now() - get().endedAt < 45000) return;
    set({ variant: v });
  },
  hide: () => set({ variant: null, endedAt: Date.now() }),
}));
