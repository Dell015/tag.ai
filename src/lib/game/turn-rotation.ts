/**
 * Turn Rotation Logic for Tag.ai
 *
 * Pure functions for managing player turn order during gameplay.
 * Players are sorted by their `turnOrder` field, and rotation
 * wraps from the last player back to the first using modulo.
 */

export interface TurnState {
  players: { id: string; name: string; avatarUrl: string; turnOrder: number }[];
  currentIndex: number;
}

/**
 * Advances to the next player in rotation, wrapping around.
 * Players are maintained in turnOrder sequence.
 * Pure function — returns a new TurnState without mutating the input.
 */
export function advanceTurn(state: TurnState): TurnState {
  const sortedPlayers = [...state.players].sort(
    (a, b) => a.turnOrder - b.turnOrder
  );
  const nextIndex = (state.currentIndex + 1) % sortedPlayers.length;

  return {
    players: sortedPlayers,
    currentIndex: nextIndex,
  };
}

/**
 * Returns the current player based on the currentIndex.
 * Players are sorted by turnOrder before accessing.
 */
export function getCurrentPlayer(
  state: TurnState
): TurnState['players'][number] {
  const sortedPlayers = [...state.players].sort(
    (a, b) => a.turnOrder - b.turnOrder
  );
  return sortedPlayers[state.currentIndex];
}

/**
 * Returns the next player in rotation (for "Pass to..." prompt).
 * Wraps around from the last player to the first.
 */
export function getNextPlayer(
  state: TurnState
): TurnState['players'][number] {
  const sortedPlayers = [...state.players].sort(
    (a, b) => a.turnOrder - b.turnOrder
  );
  const nextIndex = (state.currentIndex + 1) % sortedPlayers.length;
  return sortedPlayers[nextIndex];
}
