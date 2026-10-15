/** Pure helpers for changing a game that is already running. */
import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { TurnState } from '@/lib/game/turn-rotation';

export type FocusKind = 'deep' | 'dares' | 'mix';

export const FOCUS_RULES: Record<Exclude<FocusKind, 'mix'>, { count: number; label: string; test: (c: QueuedCard) => boolean }> = {
  deep: { count: 5, label: 'Next 5 cards: deep questions', test: (c) => c.cardType === 'question' && (c.category === 'deep_philosophical' || c.intensity >= 4) },
  dares: { count: 10, label: 'Next 10 cards: dares', test: (c) => c.cardType === 'action' },
};

/**
 * Brings matching cards forward so the next N upcoming cards fit the focus.
 * The queue length is unchanged; cards pulled from the buffer leave it.
 */
export function focusUpcoming(queue: QueuedCard[], buffer: QueuedCard[], currentIndex: number, kind: Exclude<FocusKind, 'mix'>): { queue: QueuedCard[]; buffer: QueuedCard[]; matched: number } {
  const rule = FOCUS_RULES[kind];
  const head = queue.slice(0, currentIndex + 1);
  const upcoming = queue.slice(currentIndex + 1);
  const pool = [...upcoming.filter((c) => c.cardType !== 'wild' && rule.test(c)), ...buffer.filter(rule.test)];
  const chosen = pool.slice(0, rule.count);
  const ids = new Set(chosen.map((c) => c.id));
  const rest = upcoming.filter((c) => !ids.has(c.id));
  return {
    queue: [...head, ...chosen, ...rest].slice(0, queue.length),
    buffer: buffer.filter((c) => !ids.has(c.id)),
    matched: chosen.length,
  };
}

/** Adds a player to the end of the turn order. */
export function addToTurns(turn: TurnState, p: { id: string; name: string; avatarUrl: string }): TurnState {
  if (turn.players.some((x) => x.id === p.id)) return turn;
  const order = Math.max(-1, ...turn.players.map((x) => x.turnOrder)) + 1;
  return { ...turn, players: [...turn.players, { ...p, turnOrder: order }] };
}

/** Moves a player one place earlier (-1) or later (+1). The current player stays current. */
export function movePlayer(turn: TurnState, id: string, dir: -1 | 1): TurnState {
  const sorted = [...turn.players].sort((a, b) => a.turnOrder - b.turnOrder);
  const currentId = sorted[turn.currentIndex]?.id;
  const i = sorted.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sorted.length) return turn;
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  const players = sorted.map((p, k) => ({ ...p, turnOrder: k }));
  return { players, currentIndex: Math.max(0, players.findIndex((p) => p.id === currentId)) };
}
