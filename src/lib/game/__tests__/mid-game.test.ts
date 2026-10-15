import { describe, it, expect } from 'vitest';
import { focusUpcoming, addToTurns, movePlayer } from '../mid-game';
import type { QueuedCard } from '../escalation-engine';

const c = (id: string, cardType: QueuedCard['cardType'], intensity: number, category = 'hot_takes'): QueuedCard => ({ id, text: id, cardType, intensity, category: category as never, topics: [] });

describe('focusUpcoming', () => {
  const queue = [c('a', 'question', 2), c('b', 'question', 2), c('d1', 'action', 2), c('c', 'question', 3), c('d2', 'action', 3)];
  const buffer = [c('d3', 'action', 2), c('q', 'question', 2)];

  it('pulls dares forward and keeps length', () => {
    const r = focusUpcoming(queue, buffer, 0, 'dares');
    expect(r.queue.map((x) => x.id).slice(0, 4)).toEqual(['a', 'd1', 'd2', 'd3']);
    expect(r.queue).toHaveLength(5);
    expect(r.buffer.map((x) => x.id)).toEqual(['q']);
  });
  it('never touches played cards', () => {
    const r = focusUpcoming(queue, buffer, 2, 'dares');
    expect(r.queue.slice(0, 3).map((x) => x.id)).toEqual(['a', 'b', 'd1']);
  });
  it('deep matches intensity 4 and up', () => {
    const q = [c('a', 'question', 1), c('x', 'question', 5), c('y', 'question', 2)];
    expect(focusUpcoming(q, [], 0, 'deep').queue.map((z) => z.id)).toEqual(['a', 'x', 'y']);
  });
});

describe('turn order', () => {
  const turn = { players: [{ id: 'a', name: 'A', avatarUrl: 'c0', turnOrder: 0 }, { id: 'b', name: 'B', avatarUrl: 'c1', turnOrder: 1 }], currentIndex: 1 };
  it('adds to the end once', () => {
    const t = addToTurns(turn, { id: 'z', name: 'Z', avatarUrl: 'c2' });
    expect(t.players.map((p) => p.id)).toEqual(['a', 'b', 'z']);
    expect(addToTurns(t, { id: 'z', name: 'Z', avatarUrl: 'c2' })).toBe(t);
  });
  it('moving keeps the current player current', () => {
    const t = movePlayer(turn, 'a', 1);
    expect(t.players.map((p) => p.id)).toEqual(['b', 'a']);
    expect(t.players[t.currentIndex].id).toBe('b');
  });
  it('ignores moves off the ends', () => {
    expect(movePlayer(turn, 'a', -1)).toBe(turn);
  });
});
