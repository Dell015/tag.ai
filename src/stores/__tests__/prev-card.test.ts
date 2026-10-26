import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/stores/game-store';

const card = (i: number) => ({ id: `c${i}`, text: `Card ${i}`, cardType: 'question' as const, intensity: 2, category: 'hot_takes' as const, topics: [] });
const players = [0, 1, 2].map((i) => ({ id: `p${i}`, name: `P${i}`, avatarUrl: 'c0', turnOrder: i }));
const g = () => useGameStore.getState();

describe('previous card', () => {
  beforeEach(() => {
    g().resetGame();
    useGameStore.setState({
      cardQueue: [0, 1, 2, 3, 4, 5].map(card), bufferCards: [], currentCardIndex: 0, cardsPlayed: 0, cardCountTarget: 6,
      pot: 6, potStart: 6, turnRotation: { players, currentIndex: 0 }, currentCardState: 'revealed', sessionPhase: 'play', heatLevel: 2,
    });
  });

  it('brings back the previous card, its player and its coin', () => {
    g().dismissCard();
    g().dismissCard();
    expect(g().currentCardIndex).toBe(2);
    expect(g().pot).toBe(4);
    expect(g().prevCard()).toBe(true);
    expect(g().currentCardIndex).toBe(1);
    expect(g().cardsPlayed).toBe(1);
    expect(g().pot).toBe(5);
    expect(g().turnRotation.currentIndex).toBe(1);
    expect(g().currentCardState).toBe('revealed');
  });

  it('goes back at most 5 cards and then says no', () => {
    for (let i = 0; i < 6; i++) { g().dismissCard(); if (g().sessionPhase === 'end') break; }
    let back = 0;
    while (g().prevCard()) back++;
    expect(back).toBeLessThanOrEqual(5);
    expect(g().prevCard()).toBe(false);
  });

  it('keeps a player added in the meantime', () => {
    g().dismissCard();
    g().addPlayerToTurns({ id: 'new', name: 'New', avatarUrl: 'c1' });
    g().prevCard();
    expect(g().turnRotation.players.some((p) => p.id === 'new')).toBe(true);
    expect(g().turnRotation.currentIndex).toBe(0);
  });
});
