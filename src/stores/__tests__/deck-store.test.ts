import { describe, it, expect, beforeEach } from 'vitest';
import { useDeckStore, applySlots, toQueuedCards, hasSlot } from '../deck-store';

const card = (text: string) => ({ text, type: 'question' as const, intensity: 2, category: 'hot_takes' as const });

describe('deck store', () => {
  beforeEach(() => useDeckStore.setState({ decks: [] }));

  it('creates, edits and deletes a deck', () => {
    const d = useDeckStore.getState().create('Test');
    useDeckStore.getState().update(d.id, { name: 'Renamed', color: 'spicy' });
    expect(useDeckStore.getState().decks[0]).toMatchObject({ name: 'Renamed', color: 'spicy' });
    useDeckStore.getState().remove(d.id);
    expect(useDeckStore.getState().decks).toHaveLength(0);
  });

  it('adds cards, skips duplicates, restores a removed card in place', () => {
    const { create, addCard, addCards, removeCard, restoreCard } = useDeckStore.getState();
    const d = create();
    addCard(d.id, card('one one one'));
    addCard(d.id, card('two two two'));
    expect(addCards(d.id, [card('two two two'), card('three three')])).toBe(1);
    const second = useDeckStore.getState().decks[0].cards[1];
    removeCard(d.id, second.id);
    restoreCard(d.id, second, 1);
    expect(useDeckStore.getState().decks[0].cards.map((c) => c.text)).toEqual(['one one one', 'two two two', 'three three']);
  });
});

describe('slots', () => {
  const q = (text: string) => toQueuedCards({ id: 'd', name: 'd', audience: 'Barkada', color: 'barkada', visibility: 'private', updatedAt: 0, cards: [{ id: 'abc', text, type: 'question', intensity: 2, category: 'hot_takes' }] });
  it('detects slots', () => { expect(hasSlot('Who is [SLOT]?')).toBe(true); expect(hasSlot('Who?')).toBe(false); });
  it('fills blanks from the group words', () => {
    const out = applySlots(q('Would [SLOT] ever go to [SLOT]?'), ['Mark', 'Baguio']);
    expect(out).toHaveLength(1);
    expect(out[0].text).not.toContain('[SLOT]');
  });
  it('drops slot cards when nothing was provided', () => {
    expect(applySlots(q('Would [SLOT] ever?'), ['', ' '])).toHaveLength(0);
    expect(applySlots(q('Plain card'), [])).toHaveLength(1);
  });
});
