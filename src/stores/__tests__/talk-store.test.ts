import { describe, it, expect, beforeEach } from 'vitest';
import { useTalkStore } from '../talk-store';
import { TALK_TOPICS } from '@/lib/data/talk-topics';

beforeEach(() => useTalkStore.setState({ active: false, queue: [], index: 0, reached: 0, results: {}, picks: {}, players: [], roster: [] }));

describe('talk store with names', () => {
  it('keeps the names, then remembers them as the roster after the session', () => {
    useTalkStore.getState().start(TALK_TOPICS.slice(0, 3), ['Mika', 'Jun']);
    expect(useTalkStore.getState().players).toEqual(['Mika', 'Jun']);
    useTalkStore.getState().finish();
    expect(useTalkStore.getState().players).toEqual([]);
    expect(useTalkStore.getState().roster).toEqual(['Mika', 'Jun']);
  });
  it('records picks and derives the tally from them', () => {
    const id = TALK_TOPICS[0].id;
    useTalkStore.getState().start(TALK_TOPICS.slice(0, 3), ['Mika', 'Jun', 'Ria']);
    const { setPick } = useTalkStore.getState();
    setPick(id, 'Mika', 'a'); setPick(id, 'Jun', 'a'); setPick(id, 'Ria', 'b');
    expect(useTalkStore.getState().results[id]).toEqual({ a: 2, b: 1 });
    setPick(id, 'Ria', null);
    expect(useTalkStore.getState().results[id]).toEqual({ a: 2, b: 0 });
  });
  it('a new session clears the old answers', () => {
    useTalkStore.getState().start(TALK_TOPICS.slice(0, 3), ['Mika', 'Jun']);
    useTalkStore.getState().setPick(TALK_TOPICS[0].id, 'Mika', 'a');
    useTalkStore.getState().start(TALK_TOPICS.slice(0, 3), []);
    expect(useTalkStore.getState().picks).toEqual({});
    expect(useTalkStore.getState().results).toEqual({});
  });
});
