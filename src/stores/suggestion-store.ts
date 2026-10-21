/**
 * Suggestion store: cards players wrote and their likes. No coins are paid for suggestions.
 * Stage B: a suggestions table where every card is reviewed before it reaches a deck.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { sampleSuggestions, validateSuggestion, type Suggestion, type SuggestDeck, type SuggestKind } from '@/lib/game/suggestions';

interface SuggestionState {
  items: Suggestion[];
  add: (input: { text: string; kind: SuggestKind; deckId: SuggestDeck }, author: { id: string; name: string }) => string | null;
  toggleLike: (id: string, userId: string) => void;
}

export const useSuggestionStore = create<SuggestionState>()(
  persist(
    (set, get) => ({
      items: sampleSuggestions(Date.now()),
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
    }),
    { name: 'tagai-suggestions', version: 1, storage: safeStorage(), skipHydration: true, partialize: (s) => ({ items: s.items }) },
  ),
);
