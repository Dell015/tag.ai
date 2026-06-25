'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeLobby } from '@/hooks/use-realtime-lobby';
import { useSessionStore } from '@/stores/session-store';
import { useGameStore } from '@/stores/game-store';
import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { CardQueueConfig } from '@/lib/game/card-queue-builder';

// Lobby components
import { RoomCodeDisplay } from '@/components/lobby/RoomCodeDisplay';
import { LobbyPlayerList } from '@/components/lobby/LobbyPlayerList';

// Setup components
import { CardCountSelector } from '@/components/setup/CardCountSelector';
import { ComfortFilters } from '@/components/setup/ComfortFilters';
import { GameModeSelector } from '@/components/setup/GameModeSelector';
import { DrinkRules } from '@/components/setup/DrinkRules';
import { HouseRules } from '@/components/setup/HouseRules';
import { PreGameSummary } from '@/components/setup/PreGameSummary';

// Gameplay components
import { HeatMeter } from '@/components/game/HeatMeter';
import { CardStack } from '@/components/game/CardStack';
import { CardFlip } from '@/components/game/CardFlip';
import { SwipeHandler } from '@/components/game/SwipeHandler';
import { HeartButton } from '@/components/game/HeartButton';
import { TrashZone } from '@/components/game/TrashZone';
import { TurnIndicator } from '@/components/game/TurnIndicator';
import { PassPrompt } from '@/components/game/PassPrompt';
import { WildCardOverlay } from '@/components/game/WildCardOverlay';

// End component
import { EndScreen } from '@/components/game/EndScreen';

/**
 * Main game page orchestrating four phases: lobby → setup → play → end.
 *
 * Phase transitions are driven by:
 * - session store `status` field (lobby / active / ended)
 * - game store `sessionPhase` field (lobby / setup / play / end)
 *
 * On game start:
 * 1. Fetch card library from Supabase (curated cards)
 * 2. Fetch user's trashed cards
 * 3. Call initializeQueue on game store
 * 4. Set turn rotation from session players
 *
 * Validates: Requirements 13.3, 14.1, 27.1
 */

type SetupStep = 'cards' | 'filters' | 'mode' | 'drinks' | 'rules' | 'summary';

const SETUP_STEPS: SetupStep[] = ['cards', 'filters', 'mode', 'drinks', 'rules', 'summary'];

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string) || '';

  // Realtime lobby subscription
  const { isConnected, error: realtimeError } = useRealtimeLobby(roomCode);

  // Session store state
  const sessionStatus = useSessionStore((s) => s.status);
  const sessionId = useSessionStore((s) => s.sessionId);
  const hostId = useSessionStore((s) => s.hostId);
  const players = useSessionStore((s) => s.players);
  const gameMode = useSessionStore((s) => s.gameMode);
  const cardCountTarget = useSessionStore((s) => s.cardCountTarget);
  const comfortFilters = useSessionStore((s) => s.comfortFilters);

  // Game store state
  const sessionPhase = useGameStore((s) => s.sessionPhase);
  const cardQueue = useGameStore((s) => s.cardQueue);
  const currentCardIndex = useGameStore((s) => s.currentCardIndex);
  const currentCardState = useGameStore((s) => s.currentCardState);
  const initializeQueue = useGameStore((s) => s.initializeQueue);
  const dismissCard = useGameStore((s) => s.dismissCard);
  const trashCard = useGameStore((s) => s.trashCard);

  // Local state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>('cards');
  const [isStarting, setIsStarting] = useState(false);

  // Determine if current user is the host
  const isHost = currentUserId !== null && currentUserId === hostId;

  // Determine effective phase: use game store sessionPhase during play/end,
  // otherwise derive from session status
  const effectivePhase = (() => {
    if (sessionPhase === 'play' || sessionPhase === 'end') return sessionPhase;
    if (sessionStatus === 'active') return 'play' as const;
    if (sessionStatus === 'ended') return 'end' as const;
    return sessionPhase; // 'lobby' or 'setup'
  })();

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // Broadcast setup changes helper
  const broadcastSetupChange = useCallback(
    (payload: Record<string, unknown>) => {
      if (!roomCode) return;
      const supabase = createClient();
      const channel = supabase.channel(`session:${roomCode}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'setup_changed',
            payload,
          });
          setTimeout(() => supabase.removeChannel(channel), 500);
        }
      });
    },
    [roomCode]
  );

  // Handle "Start Game" — fetches cards, builds queue, transitions to play
  const handleStartGame = useCallback(async () => {
    if (isStarting || !gameMode || !currentUserId) return;
    setIsStarting(true);

    try {
      const supabase = createClient();

      // 1. Fetch curated card library from Supabase
      const { data: cardLibrary, error: cardsError } = await supabase
        .from('cards')
        .select('id, text, card_type, intensity, category, topics')
        .eq('is_curated', true);

      if (cardsError) {
        console.error('[GamePage] Failed to fetch card library:', cardsError.message);
        setIsStarting(false);
        return;
      }

      // 2. Fetch user's trashed card IDs
      const { data: trashedCards, error: trashError } = await supabase
        .from('user_trashed_cards')
        .select('card_id')
        .eq('user_id', currentUserId);

      if (trashError) {
        console.error('[GamePage] Failed to fetch trashed cards:', trashError.message);
      }

      const trashedCardIds = (trashedCards || []).map((t) => t.card_id);

      // 3. Transform Supabase card data to QueuedCard format
      // Note: wild cards are generated by the card-queue-builder with random types,
      // not stored with a specific wild_card_type in the DB
      const library: QueuedCard[] = (cardLibrary || []).map((card) => ({
        id: card.id,
        text: card.text,
        cardType: card.card_type as 'question' | 'action' | 'wild',
        intensity: card.intensity,
        category: card.category,
        topics: card.topics || [],
      }));

      // 4. Build queue config
      const config: CardQueueConfig = {
        gameMode,
        cardCountTarget,
        comfortFilters,
        trashedCardIds,
        playerCount: players.length,
      };

      // 5. Initialize game queue (sets sessionPhase to 'play')
      initializeQueue(config, library);

      // 6. Set turn rotation from session players
      const turnPlayers = players
        .sort((a, b) => a.turnOrder - b.turnOrder)
        .map((p) => ({
          id: p.userId,
          name: p.displayName,
          avatarUrl: p.avatarUrl,
          turnOrder: p.turnOrder,
        }));

      useGameStore.setState({
        turnRotation: { players: turnPlayers, currentIndex: 0 },
      });

      // 7. Update session status to 'active' in Supabase
      if (sessionId) {
        await supabase
          .from('sessions')
          .update({ status: 'active' })
          .eq('id', sessionId);
      }

      // 8. Broadcast game_started event
      const channel = supabase.channel(`session:${roomCode}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'game_started',
            payload: { sessionId },
          });
          setTimeout(() => supabase.removeChannel(channel), 500);
        }
      });

      // Update session store status
      useSessionStore.getState().setSession({ status: 'active' });
    } catch (err) {
      console.error('[GamePage] Error starting game:', err);
    } finally {
      setIsStarting(false);
    }
  }, [
    isStarting,
    gameMode,
    currentUserId,
    cardCountTarget,
    comfortFilters,
    players,
    sessionId,
    roomCode,
    initializeQueue,
  ]);

  // Handle moving to setup phase (host only)
  const handleGoToSetup = useCallback(() => {
    useGameStore.setState({ sessionPhase: 'setup' });
  }, []);

  // Handle "Play Again" from end screen
  const handlePlayAgain = useCallback(() => {
    router.push('/');
  }, [router]);

  // Handle card dismiss in play phase
  const handleDismiss = useCallback(() => {
    dismissCard();
  }, [dismissCard]);

  // Handle card trash in play phase
  const handleTrash = useCallback(() => {
    trashCard();
  }, [trashCard]);

  // Setup step navigation
  const handleNextStep = useCallback(() => {
    const currentIndex = SETUP_STEPS.indexOf(setupStep);
    if (currentIndex < SETUP_STEPS.length - 1) {
      setSetupStep(SETUP_STEPS[currentIndex + 1]);
    }
  }, [setupStep]);

  const handlePrevStep = useCallback(() => {
    const currentIndex = SETUP_STEPS.indexOf(setupStep);
    if (currentIndex > 0) {
      setSetupStep(SETUP_STEPS[currentIndex - 1]);
    }
  }, [setupStep]);

  // Get current card for play phase
  const currentCard = cardQueue[currentCardIndex] || null;

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Connection status indicator */}
      {realtimeError && (
        <div className="fixed top-2 right-2 z-[100] px-3 py-1.5 rounded-full bg-red-500/80 text-xs text-white">
          Connection error
        </div>
      )}
      {!isConnected && !realtimeError && effectivePhase !== 'play' && (
        <div className="fixed top-2 right-2 z-[100] px-3 py-1.5 rounded-full bg-yellow-500/80 text-xs text-black">
          Connecting...
        </div>
      )}

      {/* ── PHASE 1: LOBBY ─────────────────────────────────────────── */}
      {effectivePhase === 'lobby' && (
        <div className="flex flex-col items-center gap-8 px-6 py-12">
          <h1 className="text-2xl font-bold">Game Lobby</h1>

          <RoomCodeDisplay roomCode={roomCode} />

          <LobbyPlayerList isHost={isHost} />

          {/* Host: Go to Setup */}
          {isHost && players.length >= 2 && (
            <button
              type="button"
              onClick={handleGoToSetup}
              className="w-full max-w-sm py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold text-lg transition-colors"
            >
              Configure Game
            </button>
          )}

          {!isHost && (
            <p className="text-sm text-white/60 text-center">
              Waiting for the host to configure the game...
            </p>
          )}
        </div>
      )}

      {/* ── PHASE 2: SETUP ─────────────────────────────────────────── */}
      {effectivePhase === 'setup' && (
        <div className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Game Setup</h2>
            <span className="text-sm text-white/50">
              Step {SETUP_STEPS.indexOf(setupStep) + 1} of {SETUP_STEPS.length}
            </span>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {SETUP_STEPS.map((step, i) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= SETUP_STEPS.indexOf(setupStep)
                    ? 'bg-purple-500'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Setup content based on current step */}
          {isHost ? (
            <>
              {setupStep === 'cards' && (
                <CardCountSelector
                  onBroadcastChange={(count) =>
                    broadcastSetupChange({ cardCount: count })
                  }
                />
              )}
              {setupStep === 'filters' && (
                <ComfortFilters
                  onBroadcastChange={(filters) =>
                    broadcastSetupChange({ comfortFilters: filters })
                  }
                />
              )}
              {setupStep === 'mode' && (
                <GameModeSelector
                  onBroadcastChange={(mode) =>
                    broadcastSetupChange({ gameMode: mode })
                  }
                />
              )}
              {setupStep === 'drinks' && <DrinkRules />}
              {setupStep === 'rules' && currentUserId && (
                <HouseRules
                  isHost={isHost}
                  currentUserId={currentUserId}
                  onStartGame={handleStartGame}
                />
              )}
              {setupStep === 'summary' && (
                <PreGameSummary isHost={isHost} onStartGame={handleStartGame} />
              )}
            </>
          ) : (
            // Non-host: read-only view of setup
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-sm text-white/60 mb-2">Card Count</p>
                <p className="text-lg font-medium">{cardCountTarget} cards</p>
              </div>
              {gameMode && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-sm text-white/60 mb-2">Game Mode</p>
                  <p className="text-lg font-medium capitalize">{gameMode}</p>
                </div>
              )}
              {comfortFilters.length > 0 && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-sm text-white/60 mb-2">Comfort Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {comfortFilters.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {setupStep === 'rules' && currentUserId && (
                <HouseRules
                  isHost={false}
                  currentUserId={currentUserId}
                  onStartGame={handleStartGame}
                />
              )}
              <p className="text-center text-sm text-white/50">
                The host is configuring the game...
              </p>
            </div>
          )}

          {/* Navigation buttons (host only) */}
          {isHost && (
            <div className="flex gap-3 mt-4">
              {setupStep !== 'cards' && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Back
                </button>
              )}
              {setupStep !== 'summary' && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PHASE 3: PLAY ──────────────────────────────────────────── */}
      {effectivePhase === 'play' && (
        <div className="relative min-h-screen flex flex-col">
          {/* Heat meter at top */}
          <HeatMeter />

          {/* Main gameplay area */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
            {currentCard && (
              <CardStack>
                <SwipeHandler
                  onDismiss={handleDismiss}
                  enabled={currentCardState === 'revealed'}
                >
                  <CardFlip card={currentCard} />
                </SwipeHandler>
              </CardStack>
            )}

            {/* Heart button — visible when card is revealed */}
            {currentCard && currentCardState === 'revealed' && currentUserId && (
              <div className="mt-6">
                <HeartButton cardId={currentCard.id} userId={currentUserId} />
              </div>
            )}
          </div>

          {/* Trash zone — active when card is revealed */}
          {currentCard && currentUserId && (
            <TrashZone
              cardId={currentCard.id}
              userId={currentUserId}
              onTrash={handleTrash}
              isActive={currentCardState === 'revealed'}
            />
          )}

          {/* Turn indicator at bottom */}
          <TurnIndicator />

          {/* Pass prompt overlay */}
          <PassPrompt />

          {/* Wild card overlay */}
          <WildCardOverlay />
        </div>
      )}

      {/* ── PHASE 4: END ───────────────────────────────────────────── */}
      {effectivePhase === 'end' && <EndScreen onPlayAgain={handlePlayAgain} />}
    </div>
  );
}
