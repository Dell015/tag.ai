'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, Button, Icon, Splash, toast } from '@/components/ui';
import { HeatBar } from '@/components/play/HeatBar';
import { PlayCard } from '@/components/play/PlayCard';
import { PassOverlay } from '@/components/play/PassOverlay';
import { PauseSheet } from '@/components/play/PauseSheet';
import { Recap } from '@/components/play/Recap';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { useGameStore } from '@/stores/game-store';
import { useProfileStore } from '@/stores/profile-store';
import { getCurrentPlayer, getNextPlayer } from '@/lib/game/turn-rotation';
import { rooms } from '@/lib/data/rooms';
import { ruleLine } from '@/lib/game/setup-options';
import { haptic } from '@/lib/haptics';
import { play as playSound } from '@/lib/sound';
import { DECK_BY_ID, basketNames, type DeckId } from '@/lib/game/decks';
import { useToastStore } from '@/stores/toast-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ConfirmSheet, RollNumber, Sheet } from '@/components/ui';
import { TopUpSheet } from '@/components/play/TopUpSheet';
import { ToolsSheet } from '@/components/play/ToolsSheet';
import { autoPool } from '@/lib/data/card-pool';
import { owedForBasket, returnShares, cardCost } from '@/lib/game/pot';
import { roomBasket } from '@/lib/data/start-game';
import { useShopStore } from '@/stores/shop-store';
import { withPlayer } from '@/lib/data/rooms';
import { FOCUS_RULES } from '@/lib/game/mid-game';
import { HEAT_UP_COST, formatPot, isLow } from '@/lib/game/pot';
import { useWalletStore } from '@/stores/wallet-store';
import { cn } from '@/lib/cn';
import { fillDrink } from '@/lib/game/card-kinds';

export default function PlayPage() {
  const params = useParams<{ roomCode: string }>();
  const code = params.roomCode.toUpperCase();
  const router = useRouter();
  const { ready, profile } = useRequireProfile(`/game/${code}/play`);
  const { status, room } = useRoom(code);
  const g = useGameStore();
  const hasSeenHints = useProfileStore((s) => s.hasSeenHints);
  const markHintsSeen = useProfileStore((s) => s.markHintsSeen);
  const saveCard = useProfileStore((s) => s.saveCard);
  const unsaveCard = useProfileStore((s) => s.unsaveCard);
  const trashForever = useProfileStore((s) => s.trashCard);
  const untrash = useProfileStore((s) => s.untrashCard);
  const [pause, setPause] = useState(false);
  const [hearted, setHearted] = useState<string[]>([]);
  const last = useRef<{ id: string; kind: 'dismiss' | 'skip' | 'trash' | 'again' } | null>(null);
  /** One reserved row above the buttons: the swipe hint, or Undo for a few seconds after a move. */
  const [undoBar, setUndoBar] = useState<{ label: string; run: () => void } | null>(null);

  const card = g.cardQueue[g.currentCardIndex];
  const ended = g.sessionPhase === 'end';
  const st = useSettingsStore();
  const [trashAsk, setTrashAsk] = useState(false);
  const [topUp, setTopUp] = useState(false);
  const [tools, setTools] = useState(false);
  const ownedPacks = useShopStore((x) => x.owned);
  const [empty, setEmpty] = useState(false);
  const wallet = useProfileStore((p) => p.profile?.coins ?? 0);
  const applyCoins = useWalletStore((w) => w.apply);
  const lowShown = useRef(false);
  const settled = useRef(false);
  useWakeLock(st.keepAwake && !ended && g.cardQueue.length > 0);

  // The undo bar makes no sense once the recap is up.
  useEffect(() => { if (ended) { useToastStore.setState({ toasts: [] }); setUndoBar(null); playSound('end'); } }, [ended]);
  useEffect(() => {
    if (!undoBar) return;
    const t = setTimeout(() => setUndoBar(null), st.undoSeconds * 1000);
    return () => clearTimeout(t);
  }, [undoBar, st.undoSeconds]);

  // Pot: low warning, empty pause, refund at the end.
  useEffect(() => {
    if (g.potStart <= 0 || ended) return;
    if (g.pot <= 0.0005 && g.cardQueue.length > 0) setEmpty(true);
    else if (isLow(g.pot, g.potStart) && !lowShown.current) { lowShown.current = true; toast('Pot is running low. Top up from the pause menu.', {}); }
    else if (!isLow(g.pot, g.potStart)) lowShown.current = false;
  }, [g.pot, g.potStart, g.cardQueue.length, ended]);

  useEffect(() => {
    if (ended && !settled.current && g.pot > 0) {
      settled.current = true;
      const left = g.settlePot();
      if (left > 0) applyCoins('refund', left, 'Unused pot returned');
    }
  }, [ended, g, applyCoins]);

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
        potStart={g.potStart} potRefunded={g.potRefunded}
        returns={returnShares(owedForBasket(room.config.potStyle ?? 'solo', roomBasket(room).coins, room.players, room.hostId, room.config.playerBaskets ?? {}), g.potStart, g.potRefunded).map((r) => ({ name: room.players.find((p) => p.userId === r.userId)?.displayName ?? '', pesos: r.pesos }))}
        saved={hearted.map((id) => g.cardQueue.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c)}
        mode={g.gameMode} deckName={basketNames(roomBasket(room).basket)} played={g.cardsPlayed} skipped={g.skippedCount} hearted={g.heartedCount} peak={g.peakHeat}
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
    playSound(card?.cardType === 'wild' ? 'wild' : 'reveal');
    g.flipCard();
    if (card?.cardType === 'wild' && card.wildCardType) g.applyWildCardEffect(card.wildCardType);
    else if (card?.rule) g.setRule(card.rule);
  };

  const resolve = (kind: 'dismiss' | 'skip' | 'trash' | 'again') => {
    if (!card) return;
    last.current = { id: card.id, kind };
    playSound(kind === 'skip' ? 'skip' : 'done');
    if (!hasSeenHints) markHintsSeen();
    if (kind === 'dismiss') g.dismissCard();
    else if (kind === 'again') g.againCard();
    else if (kind === 'skip') g.skipCard();
    else {
      trashForever(card.id);
      g.trashCard();
    }
    setUndoBar({ label: kind === 'trash' ? 'Card trashed' : kind === 'skip' ? 'New card, same turn' : kind === 'again' ? 'Another card for you' : 'On to the next', run: undo });
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
    setUndoBar({ label: 'Saved', run: () => { unsaveCard(card.id); setHearted((h) => h.filter((i) => i !== card.id)); } });
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
        <div className="flex flex-wrap justify-between gap-x-3 text-sm font-bold text-muted [&>*]:whitespace-nowrap">
          <span>Card {Math.min(g.cardsPlayed + 1, g.cardCountTarget)} of {g.cardCountTarget}</span>
          {st.showRules && <span>{ruleLine(room.config.drinkRuleTemplate, room.config.nonDrinkingMode)}</span>}
          {g.potStart > 0 && <button onClick={() => setTopUp(true)} aria-label="Pot, tap to top up" className={cn('font-extrabold underline decoration-2 underline-offset-4', isLow(g.pot, g.potStart) ? 'text-danger' : 'text-text')}>Pot <RollNumber value={g.pot} format={formatPot} /></button>}
        </div>
        {g.activeRule && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-[rgb(190_222_58)] px-3 py-2 text-base font-extrabold text-[rgb(24_19_16)]">
            <span className="sign shrink-0 text-sm">Rule on</span>
            <span className="min-w-0">{fillDrink(g.activeRule, room.config.nonDrinkingMode)}</span>
          </p>
        )}
      </header>

      <main className="min-h-0 flex-1 [perspective:1200px]">
        {card && <PlayCard card={card} revealed={revealed} onReveal={reveal} onDone={() => resolve('dismiss')} onRule={(t) => g.setRule(t)} everyone={g.turnRotation.players.map((p) => p.name)}
          others={g.turnRotation.players.filter((p) => p.id !== current.id)} nonDrinking={room.config.nonDrinkingMode} />}
      </main>

      <div className="flex h-16 items-center py-2">
        {undoBar ? (
          <div role="status" className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border-2 border-line bg-panel pl-4 pr-1">
            <span className="min-w-0 truncate text-lg font-bold">{undoBar.label}</span>
            <button onClick={() => { undoBar.run(); setUndoBar(null); }} className="h-10 shrink-0 rounded-lg bg-accent px-5 text-lg font-extrabold text-onaccent active:translate-y-px">Undo</button>
          </div>
        ) : (
          <p className="flex w-full items-center justify-center gap-3 text-base font-extrabold text-muted">
            {revealed && st.swipe ? (
              <>
                <motion.span aria-hidden animate={{ x: [0, -7, 0] }} transition={{ duration: 1.2, repeat: Infinity }}><Icon name="chevron" size={22} className="rotate-180" /></motion.span>
                Swipe the card for next
                <motion.span aria-hidden animate={{ x: [0, 7, 0] }} transition={{ duration: 1.2, repeat: Infinity }}><Icon name="chevron" size={22} /></motion.span>
              </>
            ) : revealed ? 'Use the buttons for the next card' : 'Tap the card to reveal it'}
          </p>
        )}
      </div>

      <footer className={cn('grid grid-cols-4 gap-2 transition-opacity', st.leftHanded && '[direction:rtl] [&>*]:[direction:ltr]', !revealed && 'pointer-events-none opacity-30')}>
        <Button variant="secondary" className="!h-[4.75rem] flex-col !gap-1 !px-0 text-sm" onClick={() => (st.confirmTrash ? setTrashAsk(true) : resolve('trash'))} aria-label="Trash this card"><Icon name="trash" />Trash</Button>
        <Button variant="secondary" className="!h-[4.75rem] flex-col !gap-1 !px-0 text-sm" onClick={() => resolve('skip')} aria-label="Skip, new card for the same player"><Icon name="skip" />Skip</Button>
        <Button variant="secondary" className={cn('!h-[4.75rem] flex-col !gap-1 !px-0 text-sm', isHearted && '!text-accent')} onClick={heart} aria-label="Save card"><Icon name="heart" filled={isHearted} />{isHearted ? 'Saved' : 'Save'}</Button>
        <Button className="!h-[4.75rem] flex-col !gap-1 !px-0 text-sm" onClick={() => resolve('dismiss')} aria-label="Next card"><Icon name="check" />Next</Button>
      </footer>

      <AnimatePresence>
        {g.showPassPrompt && !ended && <PassOverlay name={current.name} avatar={current.avatarUrl} onReady={() => { playSound('pass'); g.dismissPassPrompt(); }} />}
      </AnimatePresence>

      <PauseSheet
        open={pause} onClose={() => setPause(false)} room={room}
        players={g.turnRotation.players} heat={g.heatLevel} pot={g.pot} onTopUp={() => { setPause(false); setTopUp(true); }}
        onTools={() => { setPause(false); setTools(true); }}
        mood={g.cardQueue[g.currentCardIndex]?.deckId as DeckId | undefined}
        onMood={(m) => { g.changeMood(m, autoPool(ownedPacks, true), { comfortFilters: room.config.comfortFilters, trashedCardIds: useProfileStore.getState().trashedCardIds }); toast(`Switched to ${DECK_BY_ID[m].name}`, { tone: 'ok' }); }}
        onFocus={(k) => { const n = g.focusNext(k); toast(n > 0 ? `${FOCUS_RULES[k as 'deep' | 'dares'].label}` : 'No matching cards left', {}); }}
        onAddPlayer={(name) => { const id = `guest-${Math.random().toString(36).slice(2, 10)}`; const av = `c${(g.turnRotation.players.length + 2) % 10}`; g.addPlayerToTurns({ id, name, avatarUrl: av }); rooms.update(code, (r) => withPlayer(r, { id, userId: id, displayName: name, avatarUrl: av, isGuest: true })); }}
        onMove={g.movePlayer}
        onReport={() => { if (card) { try { const k = 'tagai-reports'; const l = JSON.parse(window.localStorage.getItem(k) ?? '[]'); l.push({ id: card.id, at: Date.now() }); window.localStorage.setItem(k, JSON.stringify(l)); } catch { /* ignore */ } toast('Thanks. We will look at this card.', { tone: 'ok' }); } }}
        onHeat={(d) => {
          if (d > 0) {
            if (!g.spendPot(HEAT_UP_COST)) { toast('Not enough coins in the pot. Top up first.', {}); setPause(false); setTopUp(true); return; }
          }
          g.adjustHeat(d);
        }}
        onRemovePlayer={(id) => { g.removePlayerFromTurns(id); rooms.update(code, (r) => ({ ...r, players: r.players.filter((p) => p.userId !== id) })); }}
        onEnd={() => { setPause(false); g.endGame(); }}
      />
      <ToolsSheet open={tools} onClose={() => setTools(false)} players={g.turnRotation.players.map((p) => p.name)} />
      <TopUpSheet open={topUp} onClose={() => setTopUp(false)} wallet={wallet} pot={g.pot}
        cardsLeft={Math.max(0, g.cardCountTarget - g.cardsPlayed)}
        costLeft={g.cardQueue.slice(g.currentCardIndex).reduce((a, c) => a + cardCost(c), 0)}
        onAdd={(n) => { if (applyCoins('topup', -n, 'Added to the pot')) { g.topUpPot(n); setEmpty(false); toast(`Added ${n} to the pot`, { tone: 'ok' }); } }} />
      <Sheet open={empty && !topUp} onClose={() => undefined} title="Pot is empty">
        <p className="-mt-2 mb-6 text-lg text-muted">The game is paused. Add coins to keep going, or end it here.</p>
        <div className="space-y-3 pb-2">
          <Button size="lg" full onClick={() => setTopUp(true)}>Top up the pot</Button>
          <Button full variant="danger" onClick={() => { setEmpty(false); g.endGame(); }}>End game</Button>
        </div>
      </Sheet>
      <ConfirmSheet open={trashAsk} title="Trash this card?" body="It will not come back in your games. You can restore it in Settings." confirmLabel="Trash card" danger onConfirm={() => resolve('trash')} onClose={() => setTrashAsk(false)} />
      <span className="sr-only">Next up: {next.name}</span>
    </div>
  );
}
