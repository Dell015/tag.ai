'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Avatar, Button, Icon, Splash, toast } from '@/components/ui';
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
      <div className="flex min-h-dvh flex-col items-start justify-center gap-4 px-5">
        <h1 className="text-6xl">No game running here</h1>
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
    toast('Saved', {
      tone: 'ok',
      action: { label: 'Undo', onClick: () => { unsaveCard(card.id); setHearted((h) => h.filter((i) => i !== card.id)); } },
    });
  };

  return (
    <div data-mode={g.gameMode} className="flex h-dvh flex-col px-4 safe-top safe-bottom">
      <header className="space-y-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar value={current.avatarUrl} name={current.name} size={52} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-muted">Your turn</p>
              <p className="display truncate text-4xl">{current.name}</p>
            </div>
          </div>
          <button onClick={() => setPause(true)} aria-label="Pause menu" className="flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line"><Icon name="pause" /></button>
        </div>
        <HeatBar level={g.heatLevel} spiking={g.heatSpikeRemaining > 0} />
        <p className="text-sm font-bold text-muted">Card {Math.min(g.cardsPlayed + 1, g.cardCountTarget)} of {g.cardCountTarget}{g.crownImmunityRemaining > 0 && ', crown immunity on'}</p>
      </header>

      <main className="min-h-0 flex-1 [perspective:1200px]">
        {card && <PlayCard card={card} revealed={revealed} onReveal={reveal} onDone={() => resolve('dismiss')} onSkip={() => resolve('skip')} />}
      </main>

      <footer className={cn('grid grid-cols-4 gap-2 pt-3 transition-opacity', !revealed && 'pointer-events-none opacity-30')}>
        <Button variant="secondary" className="!h-[4.75rem] flex-col !gap-1 !px-0 text-sm" onClick={() => resolve('trash')} aria-label="Trash this card"><Icon name="trash" />Trash</Button>
        <Button variant="secondary" className="!h-[4.75rem] flex-col !gap-1 !px-0 text-sm" onClick={() => resolve('skip')} aria-label="Skip"><Icon name="skip" />Skip</Button>
        <Button variant="secondary" className={cn('!h-[4.75rem] flex-col !gap-1 !px-0 text-sm', isHearted && '!text-accent')} onClick={heart} aria-label="Save card"><Icon name="heart" filled={isHearted} />{isHearted ? 'Saved' : 'Save'}</Button>
        <Button className="!h-[4.75rem] flex-col !gap-1 !px-0 text-sm" onClick={() => resolve('dismiss')} aria-label="Done"><Icon name="check" />Done</Button>
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
