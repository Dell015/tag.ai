import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../game-store';
import type { QueuedCard } from '@/lib/game/escalation-engine';

const lib: QueuedCard[] = Array.from({ length: 60 }, (_, i) => ({
  id: `c${i}`, text: `Card ${i}`, cardType: 'question' as const, intensity: 2, category: 'hot_takes' as never, topics: [],
}));

function begin(pot: number) {
  const g = useGameStore.getState();
  g.resetGame();
  g.initializeQueue({ gameMode: 'barkada', cardCountTarget: 10, comfortFilters: [], trashedCardIds: [], playerCount: 3 }, lib);
  useGameStore.setState({ turnRotation: { players: [
    { id: 'a', name: 'A', avatarUrl: 'c0', turnOrder: 0 }, { id: 'b', name: 'B', avatarUrl: 'c1', turnOrder: 1 },
  ], currentIndex: 0 } });
  useGameStore.getState().fundPot(pot);
}

describe('pot in the game store', () => {
  beforeEach(() => begin(5));

  it('funding sets pot and start', () => {
    const s = useGameStore.getState();
    expect(s.pot).toBe(5);
    expect(s.potStart).toBe(5);
  });

  it('each resolved card draws its cost', () => {
    const before = useGameStore.getState().pot;
    const card = useGameStore.getState().cardQueue[0];
    useGameStore.getState().flipCard();
    useGameStore.getState().dismissCard();
    const used = before - useGameStore.getState().pot;
    expect(used).toBeGreaterThan(0);
    if (card.cardType === 'question' && card.intensity >= 2 && card.intensity <= 3) expect(used).toBeCloseTo(0.1, 5);
  });

  it('undo gives the card cost back', () => {
    const before = useGameStore.getState().pot;
    useGameStore.getState().dismissCard();
    expect(useGameStore.getState().pot).toBeLessThan(before);
    useGameStore.getState().undoLastCard();
    expect(useGameStore.getState().pot).toBe(before);
  });

  it('spend refuses when the pot cannot cover it', () => {
    expect(useGameStore.getState().spendPot(2)).toBe(true);
    expect(useGameStore.getState().pot).toBe(3);
    expect(useGameStore.getState().spendPot(4)).toBe(false);
    expect(useGameStore.getState().pot).toBe(3);
  });

  it('top up raises pot and start', () => {
    useGameStore.getState().topUpPot(2);
    expect(useGameStore.getState().pot).toBe(7);
    expect(useGameStore.getState().potStart).toBe(7);
  });

  it('settle returns what is left once', () => {
    expect(useGameStore.getState().settlePot()).toBe(5);
    expect(useGameStore.getState().settlePot()).toBe(0);
    expect(useGameStore.getState().potRefunded).toBe(5);
  });
});
