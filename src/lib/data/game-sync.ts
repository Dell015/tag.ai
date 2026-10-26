/**
 * Online games: the phone that runs the game reports a small view (for the phones that only watch)
 * and a full snapshot (so another phone can carry on). See migration 021.
 */
import { useGameStore } from '@/stores/game-store';
import { getCurrentPlayer, getNextPlayer } from '@/lib/game/turn-rotation';
import { fillDrink, kindOf } from '@/lib/game/card-kinds';
import { apiClaimGame, apiGetGameState, apiPushGame, apiStartGame, apiTransferGame, apiFinishGame, type RoomResult } from '@/lib/supabase/rooms';
import { rooms, type GameView } from '@/lib/data/rooms';
import { startGame } from '@/lib/data/start-game';
import type { Room } from '@/lib/data/rooms';

/** The game state without the cards (cards travel separately because they are big and rarely change). */
export function snapshot() {
  const s = useGameStore.getState();
  const { cardQueue, bufferCards, ...rest } = pickState(s);
  return { state: rest, queue: { cardQueue, bufferCards } };
}

function pickState(s: ReturnType<typeof useGameStore.getState>) {
  return {
    cardQueue: s.cardQueue, bufferCards: s.bufferCards, currentCardIndex: s.currentCardIndex, cardsPlayed: s.cardsPlayed,
    cardCountTarget: s.cardCountTarget, gameMode: s.gameMode, skippedCount: s.skippedCount, heartedCount: s.heartedCount,
    peakHeat: s.peakHeat, heatLevel: s.heatLevel, consecutiveSkips: s.consecutiveSkips, heatSpikeRemaining: s.heatSpikeRemaining,
    preSpikeHeat: s.preSpikeHeat, turnRotation: s.turnRotation, crownImmunityRemaining: s.crownImmunityRemaining,
    currentCardState: s.currentCardState, showPassPrompt: s.showPassPrompt, sessionPhase: s.sessionPhase, undoSnapshot: s.undoSnapshot,
    pot: s.pot, potStart: s.potStart, potRefunded: s.potRefunded, activeRule: s.activeRule,
  };
}

/** What watchers see. A face-down card shows no text, so nobody sees it early. */
export function makeView(nonDrinking = false): GameView {
  const s = useGameStore.getState();
  const card = s.cardQueue[s.currentCardIndex];
  const hasPlayers = s.turnRotation.players.length > 0;
  const revealed = s.currentCardState === 'revealed';
  return {
    card: card && revealed ? { text: fillDrink(card.text, nonDrinking), kind: kindOf(card), deck: card.deckId, wild: card.cardType === 'wild' } : null,
    revealed,
    player: hasPlayers ? getCurrentPlayer(s.turnRotation).name : '',
    next: hasPlayers ? getNextPlayer(s.turnRotation).name : '',
    played: s.cardsPlayed,
    total: s.cardCountTarget,
    heat: s.heatLevel,
    pot: s.pot,
    rule: s.activeRule ? fillDrink(s.activeRule, nonDrinking) : null,
    phase: s.sessionPhase === 'end' ? 'end' : 'playing',
    mode: s.gameMode,
    ahead: aheadOf(s),
  };
}

/** Who is up next, by deck and heat only, so nobody sees the words early. */
function aheadOf(s: ReturnType<typeof useGameStore.getState>): GameView['ahead'] {
  const next = s.cardQueue.slice(s.currentCardIndex + 1, s.currentCardIndex + 6).filter((c) => c.cardType !== 'wild');
  if (next.length === 0) return undefined;
  const levels = next.map((c) => c.intensity);
  return { decks: Array.from(new Set(next.map((c) => c.deckId).filter((d): d is string => !!d))).slice(0, 6), low: Math.min(...levels), high: Math.max(...levels), count: next.length };
}

/** Starts the game from the host's phone: builds the cards here, then the server records them and names the game phone. */
export async function startGameOnline(room: Room, trashed: string[], phone: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!startGame(room, trashed, { keepStatus: true })) return { ok: false, error: 'The game could not start. Check the pot and the agreements.' };
  const { state, queue } = snapshot();
  const res = await apiStartGame(room.code, phone, queue, state, makeView(room.config.nonDrinkingMode));
  if (!res.ok) { useGameStore.getState().resetGame(); return res; }
  rooms.update(room.code, (r) => ({ ...r, status: 'active', gamePhone: res.reply.data.gamePhone, gameView: res.reply.data.gameView ?? null }));
  return { ok: true };
}

/** This phone is now the game phone: load the saved snapshot into the local game. */
export async function takeOverGame(code: string): Promise<boolean> {
  const got = await apiGetGameState(code);
  if (!got) return false;
  useGameStore.setState({ ...(got.state as object), ...(got.queue as object) });
  return true;
}

export const transferGame = async (code: string, to: string): Promise<RoomResult> => {
  // One last full snapshot so the next phone starts exactly here.
  const { state, queue } = snapshot();
  await apiPushGame(code, makeView(), state, queue);
  const res = await apiTransferGame(code, to);
  if (res.ok) useGameStore.getState().resetGame();
  return res;
};

export const claimGame = (code: string) => apiClaimGame(code);
export const finishGame = (code: string, status: 'ended' | 'lobby') => apiFinishGame(code, status);

/**
 * Runs on the game phone: sends the view after every change (at most every 400 ms), the full snapshot
 * with it, the cards only when they change, and a heartbeat every 15 seconds. Calls `onLost` if the
 * server says someone else runs the game now.
 */
export function startPublisher(code: string, nonDrinking: boolean, onLost: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let busy = false;
  let stopped = false;
  let sentQueue = '';
  const queueSig = () => { const s = useGameStore.getState(); return `${s.cardQueue.length}:${s.bufferCards.length}:${s.cardQueue[s.cardQueue.length - 1]?.id ?? ''}`; };
  sentQueue = queueSig();

  const send = async () => {
    if (stopped || busy) return;
    const s = useGameStore.getState();
    if (s.cardQueue.length === 0) return;
    busy = true;
    const sig = queueSig();
    const { state, queue } = snapshot();
    const res = await apiPushGame(code, makeView(nonDrinking), state, sig !== sentQueue ? queue : undefined);
    busy = false;
    if (stopped) return;
    if (res.ok) sentQueue = sig;
    else if (res.refused) { stopped = true; onLost(); return; }
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => void send(), 400); };
  const unsub = useGameStore.subscribe(() => schedule());
  const beat = setInterval(() => void send(), 15000);
  schedule();
  return () => { stopped = true; clearTimeout(timer); clearInterval(beat); unsub(); };
}
