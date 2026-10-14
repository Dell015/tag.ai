import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../game-store';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import { steerNextCard } from '@/lib/game/steering';

const q = (id: string, intensity = 2, cardType: QueuedCard['cardType'] = 'question'): QueuedCard => ({
  id, text: id, intensity, cardType, category: 'hot_takes', topics: [],
});

const players = [
  { id: 'a', name: 'Ana', avatarUrl: '', turnOrder: 0 },
  { id: 'b', name: 'Ben', avatarUrl: '', turnOrder: 1 },
];

function start(mode: 'barkada' | 'family' = 'barkada', n = 10) {
  const library = Array.from({ length: 60 }, (_, i) => q(`c${i}`, (i % 2) + 1));
  useGameStore.getState().resetGame();
  useGameStore.setState({ turnRotation: { players, currentIndex: 0 } });
  useGameStore.getState().initializeQueue(
    { gameMode: mode, cardCountTarget: n, comfortFilters: [], trashedCardIds: [], playerCount: 2 },
    library
  );
}

describe('game store fixes', () => {
  beforeEach(() => start());

  it('family mode caps heat at 2.0 (bug #7)', () => {
    start('family', 30);
    for (let i = 0; i < 12; i++) useGameStore.getState().dismissCard();
    expect(useGameStore.getState().heatLevel).toBeLessThanOrEqual(2.0);
  });

  it('heat spike raises heat by 1 and reverts after 3 cards (bug #8)', () => {
    useGameStore.setState({ heatLevel: 2.0 });
    useGameStore.getState().applyWildCardEffect('heat_spike');
    const s = useGameStore.getState();
    expect(s.preSpikeHeat).toBeCloseTo(2.5); // +0.5 wild
    expect(s.heatLevel).toBeCloseTo(3.5); // +1 spike
    expect(s.heatSpikeRemaining).toBe(3);
    for (let i = 0; i < 3; i++) useGameStore.getState().dismissCard();
    expect(useGameStore.getState().heatLevel).toBeCloseTo(2.5);
  });

  it('skip lowers heat, counts as played, and 3 in a row drop a full level', () => {
    useGameStore.setState({ heatLevel: 3.0 });
    useGameStore.getState().skipCard();
    expect(useGameStore.getState().heatLevel).toBeCloseTo(2.8);
    expect(useGameStore.getState().cardsPlayed).toBe(1);
    useGameStore.getState().skipCard();
    useGameStore.getState().skipCard();
    expect(useGameStore.getState().heatLevel).toBeCloseTo(1.6); // 2.8 -0.2, then 3rd skip -1.0
    expect(useGameStore.getState().skippedCount).toBe(3);
  });

  it('a trashed card is never shown again (bug #10)', () => {
    const trashed = useGameStore.getState().cardQueue[0].id;
    useGameStore.getState().trashCard();
    const s = useGameStore.getState();
    expect(s.cardQueue[s.currentCardIndex].id).not.toBe(trashed);
  });

  it('undo restores the previous card, heat and turn', () => {
    const before = useGameStore.getState();
    const firstId = before.cardQueue[0].id;
    useGameStore.getState().dismissCard();
    useGameStore.getState().undoLastCard();
    const s = useGameStore.getState();
    expect(s.cardQueue[s.currentCardIndex].id).toBe(firstId);
    expect(s.cardsPlayed).toBe(0);
    expect(s.heatLevel).toBeCloseTo(before.heatLevel);
    expect(s.turnRotation.currentIndex).toBe(0);
    expect(s.undoSnapshot).toBeNull();
  });

  it('shrinks the target when the library is too small', () => {
    useGameStore.getState().resetGame();
    useGameStore.getState().initializeQueue(
      { gameMode: 'chaos', cardCountTarget: 50, comfortFilters: [], trashedCardIds: [], playerCount: 2 },
      Array.from({ length: 12 }, (_, i) => q(`s${i}`, 2))
    );
    const s = useGameStore.getState();
    expect(s.cardCountTarget).toBe(s.cardQueue.length);
    expect(s.cardCountTarget).toBeLessThan(50);
  });

  it('steerNextCard biases draws toward the current heat (bug #9)', () => {
    const queue = [
      q('x', 1),
      ...Array.from({ length: 7 }, (_, i) => q(`h${i}`, i % 2 === 0 ? 5 : 1)),
    ];
    let hot = 0;
    for (let i = 0; i < 300; i++) {
      const out = steerNextCard(queue, 0, 5.0);
      if (out[0].intensity >= 4) hot++;
    }
    expect(hot).toBeGreaterThan(150);
  });

  it('steering leaves wild and action cards where they are', () => {
    const queue = [q('w', 0, 'wild'), q('a', 2), q('b', 5)];
    expect(steerNextCard(queue, 0, 5)).toBe(queue);
    const q2 = [q('act', 2, 'action'), q('b', 5)];
    expect(steerNextCard(q2, 0, 5)).toBe(q2);
  });
});
