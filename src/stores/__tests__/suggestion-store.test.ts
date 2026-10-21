import { describe, it, expect, beforeEach } from 'vitest';
import { useSuggestionStore } from '../suggestion-store';
import { useProfileStore } from '../profile-store';
import { useWalletStore } from '../wallet-store';
import { prevWeekStart } from '@/lib/game/suggestions';

const NOW = new Date(2026, 9, 14, 12, 0).getTime();
const last = prevWeekStart(NOW) + 3_600_000;
const card = (id: string, authorId: string, likes: string[]) => ({ id, text: `A test card number ${id} here`, kind: 'truth' as const, deckId: 'barkada' as const, authorId, authorName: authorId, createdAt: last, likes });

beforeEach(() => {
  useProfileStore.setState({ profile: { id: 'me', username: 'me', avatar: 'c1', coins: 5, createdAt: 0 } as never });
  useWalletStore.setState({ transactions: [] });
  useSuggestionStore.setState({ items: [] });
});

describe('no coin prize', () => {
  it('has no claim action and leaves the wallet alone', () => {
    expect('claimLastWeek' in useSuggestionStore.getState()).toBe(false);
    expect(useProfileStore.getState().profile!.coins).toBe(5);
  });
});

describe('likes', () => {
  it('toggles a like and blocks liking your own card', () => {
    useSuggestionStore.setState({ items: [card('1', 'me', []), card('2', 'x', [])] });
    const { toggleLike } = useSuggestionStore.getState();
    toggleLike('1', 'me'); toggleLike('2', 'me');
    expect(useSuggestionStore.getState().items.map((s) => s.likes.length)).toEqual([0, 1]);
    useSuggestionStore.getState().toggleLike('2', 'me');
    expect(useSuggestionStore.getState().items[1].likes).toHaveLength(0);
  });
  it('rejects a duplicate card', () => {
    const a = { id: 'me', name: 'me' };
    expect(useSuggestionStore.getState().add({ text: 'What is your guilty pleasure song?', kind: 'truth', deckId: 'barkada' }, a)).toBeNull();
    expect(useSuggestionStore.getState().add({ text: 'what is your guilty pleasure song?', kind: 'truth', deckId: 'barkada' }, a)).toMatch(/already/);
  });
});
