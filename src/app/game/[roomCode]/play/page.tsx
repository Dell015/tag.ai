'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Avatar, Button, toast } from '@/components/ui';
import { Splash } from '@/components/ui/Splash';
import { HeatBar } from '@/components/play/HeatBar';
import { PlayCard } from '@/components/play/PlayCard';
import { PassOverlay } from '@/components/play/PassOverlay';
import { PauseSheet } from '@/components/play/PauseSheet';
import { Recap } from '@/components/play/Recap';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { useGameStore } from '@/stores/game-store';
import { useProfileStore } from '@/stores/profile-store';
import { getCurrentPlayer, getNextPlayer } from '@/lib/game/turn-rotation';
import { rooms } from '@/lib/data/rooms';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

export default function PlayPage() {
  const params = useParams<{ roomCode: string }>();
  const code = params.roomCode.toUpperCase();
  const router = useRouter();
  const { ready, profile } = useRequireProfile(`/game/${code}/play`);
  const { status, room } = useRoom(code);
  const g = useGameStore();
  const saveCard = useProfileStore((s) => s.saveCard);
  const unsaveCard = useProfileStore((s) => s.unsaveCard);
  const trashForever = useProfileStore((s) => s.trashCard);
  const untrash = useProfileStore((s) => s.untrashCard);
  const [pause, setPause] = useState(false);
  const [hearted, setHearted] = useState<string[]>([]);
  const last = useRef<{ id: string; kind: 'dismiss' | 'skip' | 'trash' } | null>(null);

  const card = g.cardQueue[g.currentCardIndex];
  const ended = g.sessionPhase === 'end';

  // Mark the room as ended once, so the lobby doesn't offer "resume".
  useEffect(() => {
    if (ended && room && room.status === 'active') rooms.update(code, (r) => ({ ...r, status: 'ended' }));
  }, [ended, room, code]);

  if (!ready || !profile || status === 'loading') return <Splash />;

  const isHost = room?.hostId === profile.id;
  if (status === 'missing' || !room || !isHost || (g.cardQueue.length === 0 && !ended)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-6xl">🃏</div>
        <h1 className="text-3xl font-extrabold">No game running here</h1>
        <p className="text-muted">The game is played on the host&apos;s phone. Head back to the lobby to start one.</p>
        <Link href={`/game/${code}`} className="w-full max-w-xs"><Button full>Go to lobby</Button></Link>
      </div>
    );
  }

  if (ended) {
    return (
      <Recap
        mode={g.gameMode} played={g.cardsPlayed} skipped={g.skippedCount} hearted={g.heartedCount} peak={g.peakHeat}
        onHome={() => { g.resetGame(); router.replace('/'); }}
        onAgain={() => {
          g.resetGame();
          rooms.update(code, (r) => ({ ...r, status: 'lobby', agreedPlayers: [] }));
          router.replace(`/game/${code}/setup`);
        }}
      />
    );
  }

  const current = getCurrentPlayer(g.turnRotation);
  const next = getNextPlayer(g.turnRotation);
  const revealed = g.currentCardState === 'revealed';
  const isHearted = !!card && hearted.includes(card.id);

  const reveal = () => {
    g.flipCard();
    if (card?.cardType === 'wild' && card.wildCardType) g.applyWildCardEffect(card.wildCardType);
  };

  const resolve = (kind: 'dismiss' | 'skip' | 'trash') => {
    if (!card) return;
    last.current = { id: card.id, kind };
    if (kind === 'dismiss') g.dismissCard();
    else if (kind === 'skip') g.skipCard();
    else {
      trashForever(card.id);
      g.trashCard();
    }
    toast(kind === 'trash' ? 'Card trashed' : kind === 'skip' ? 'Skipped' : 'Done', {
      duration: 5000,
      action: { label: 'Undo', onClick: undo },
    });
  };

  function undo() {
    const l = last.current;
    if (l?.kind === 'trash') untrash(l.id);
    g.undoLastCard();
    haptic('warn');
  }

  const heart = () => {
    if (!card || isHearted) return;
    g.heartCard();
    saveCard(card.id);
    setHearted((h) => [...h, card.id]);
    haptic('success');
    toast('Saved to your hearts ❤️', {
      tone: 'ok',
      action: { label: 'Undo', onClick: () => { unsaveCard(card.id); setHearted((h) => h.filter((i) => i !== card.id)); } },
    });
  };

  return (
    <div data-mode={g.gameMode} className="flex h-dvh flex-col px-4 safe-top safe-bottom">
      <header className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar value={current.avatarUrl} size={52} className="shadow-glow" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted">Now playing</p>
              <p className="truncate font-display text-2xl font-extrabold leading-tight">{current.name}</p>
            </div>
          </div>
          <button onClick={() => setPause(true)} aria-label="Pause menu" className="h-tap w-tap shrink-0 rounded-2xl bg-surface text-2xl ring-1 ring-white/10">⏸</button>
        </div>
        <HeatBar level={g.heatLevel} spiking={g.heatSpikeRemaining > 0} />
        <p className="text-center text-sm font-semibold text-muted">Card {Math.min(g.cardsPlayed + 1, g.cardCountTarget)} of {g.cardCountTarget}{g.crownImmunityRemaining > 0 && ' · 👑 immune'}</p>
      </header>

      <main className="min-h-0 flex-1 [perspective:1200px]">
        {card && <PlayCard card={card} revealed={revealed} onReveal={reveal} onDone={() => resolve('dismiss')} onSkip={() => resolve('skip')} />}
      </main>

      <footer className={cn('grid grid-cols-4 gap-2 pt-3 transition-opacity', !revealed && 'pointer-events-none opacity-30')}>
        <Button variant="secondary" className="!px-0 flex-col !gap-0 !h-[4.5rem] text-sm" onClick={() => resolve('trash')} aria-label="Trash this card"><span className="text-2xl">🗑</span>Trash</Button>
        <Button variant="secondary" className="!px-0 flex-col !gap-0 !h-[4.5rem] text-sm" onClick={() => resolve('skip')} aria-label="Skip"><span className="text-2xl">⏭</span>Skip</Button>
        <Button variant="secondary" className={cn('!px-0 flex-col !gap-0 !h-[4.5rem] text-sm', isHearted && '!bg-accent/20 !text-accent')} onClick={heart} aria-label="Save card"><span className="text-2xl">{isHearted ? '❤️' : '🤍'}</span>Save</Button>
        <Button className="!px-0 flex-col !gap-0 !h-[4.5rem] text-sm" onClick={() => resolve('dismiss')} aria-label="Done"><span className="text-2xl">✓</span>Done</Button>
      </footer>

      <AnimatePresence>
        {g.showPassPrompt && !ended && <PassOverlay name={current.name} avatar={current.avatarUrl} onReady={g.dismissPassPrompt} />}
      </AnimatePresence>

      <PauseSheet
        open={pause} onClose={() => setPause(false)} room={room}
        players={g.turnRotation.players} heat={g.heatLevel} onHeat={g.adjustHeat}
        onRemovePlayer={(id) => { g.removePlayerFromTurns(id); rooms.update(code, (r) => ({ ...r, players: r.players.filter((p) => p.userId !== id) })); }}
        onEnd={() => { setPause(false); g.endGame(); }}
      />
      <span className="sr-only">Next up: {next.name}</span>
    </div>
  );
}
