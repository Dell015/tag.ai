/**
 * Suggestion store: cards players wrote, their likes and which weekly rewards were claimed.
 * Stage B: a suggestions table with moderation, and the weekly payout runs on the server.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { useWalletStore } from '@/stores/wallet-store';
import { WEEKLY_REWARD, prevWeekStart, sampleSuggestions, validateSuggestion, weekKey, weekWinner, type Suggestion, type SuggestDeck, type SuggestKind } from '@/lib/game/suggestions';

interface SuggestionState {
  items: Suggestion[];
  claimed: string[];
  add: (input: { text: string; kind: SuggestKind; deckId: SuggestDeck }, author: { id: string; name: string }) => string | null;
  toggleLike: (id: string, userId: string) => void;
  /** Pays out last week's reward when `userId` won it and has not claimed it. Returns the coins paid. */
  claimLastWeek: (userId: string, now?: number) => number;
}

export const useSuggestionStore = create<SuggestionState>()(
  persist(
    (set, get) => ({
      items: sampleSuggestions(Date.now()),
      claimed: [],
      add: ({ text, kind, deckId }, author) => {
        const now = Date.now();
        const clean = text.trim().replace(/\s+/g, ' ');
        const err = validateSuggestion(clean, author.id, get().items, now);
        if (err) return err;
        set({ items: [{ id: `s-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`, text: clean, kind, deckId, authorId: author.id, authorName: author.name, createdAt: now, likes: [] }, ...get().items] });
        return null;
      },
      toggleLike: (id, userId) => set({
        items: get().items.map((s) => s.id !== id || s.authorId === userId ? s : { ...s, likes: s.likes.includes(userId) ? s.likes.filter((l) => l !== userId) : [...s.likes, userId] }),
      }),
      claimLastWeek: (userId, now = Date.now()) => {
        const start = prevWeekStart(now);
        const key = weekKey(start);
        if (get().claimed.includes(key)) return 0;
        const win = weekWinner(get().items, start);
        if (!win || win.authorId !== userId) return 0;
        if (!useWalletStore.getState().apply('reward', WEEKLY_REWARD, 'Top card contributor of the week')) return 0;
        set({ claimed: [...get().claimed, key] });
        return WEEKLY_REWARD;
      },
    }),
    { name: 'tagai-suggestions', version: 1, storage: safeStorage(), skipHydration: true, partialize: (s) => ({ items: s.items, claimed: s.claimed }) },
  ),
);
