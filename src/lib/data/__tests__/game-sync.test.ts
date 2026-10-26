import { beforeEach, describe, expect, it } from 'vitest';
import { makeView, snapshot } from '@/lib/data/game-sync';
import { useGameStore } from '@/stores/game-store';

const card = { id: 'c1', text: 'Who here would {drink} first?', cardType: 'question' as const, intensity: 2, category: 'hot_takes' as const, topics: [] };

describe('game view for watchers', () => {
  beforeEach(() => {
    useGameStore.setState({
      cardQueue: [card], bufferCards: [], currentCardIndex: 0, cardsPlayed: 3, cardCountTarget: 10, heatLevel: 2.5, pot: 7,
      turnRotation: { players: [{ id: 'a', name: 'Ana', avatarUrl: 'c0', turnOrder: 0 }, { id: 'b', name: 'Ben', avatarUrl: 'c1', turnOrder: 1 }], currentIndex: 0 },
      currentCardState: 'face_down', sessionPhase: 'play', activeRule: null,
    });
  });
  it('shows no card text while the card is face down', () => {
    const v = makeView();
    expect(v.card).toBeNull();
    expect(v.revealed).toBe(false);
    expect(v.player).toBe('Ana');
    expect(v.next).toBe('Ben');
  });
  it('shows the card once it is revealed, with drink words adapted', () => {
    useGameStore.setState({ currentCardState: 'revealed' });
    expect(makeView(false).card?.text).toMatch(/drink/);
    expect(makeView(true).card?.text).not.toMatch(/\{drink\}/);
  });
  it('keeps the cards out of the state snapshot and in the queue part', () => {
    const { state, queue } = snapshot();
    expect('cardQueue' in state).toBe(false);
    expect(queue.cardQueue).toHaveLength(1);
    expect(state).toMatchObject({ pot: 7, cardsPlayed: 3 });
  });
});
