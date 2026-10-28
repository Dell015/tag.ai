'use client';
import { rewardReferral } from '@/lib/supabase/referral';
import { refreshAccount } from '@/components/AuthSync';
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
import { DECK_BY_ID, MORE_CARDS, type DeckId } from '@/lib/game/decks';
import { buildBasketQueue, buildPoolQueue } from '@/lib/game/card-queue-builder';
import { buildLibrary } from '@/lib/data/start-game';
import { useToastStore } from '@/stores/toast-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ConfirmSheet, RollNumber, Sheet } from '@/components/ui';
import { TopUpSheet } from '@/components/play/TopUpSheet';
import { ToolsSheet } from '@/components/play/ToolsSheet';
import { cardCost } from '@/lib/game/pot';
import { MAX_CARDS, roomPlan } from '@/lib/data/start-game';
import { sourceCards } from '@/lib/data/game-source';
import { withPlayer, potFunded, skipTopics } from '@/lib/data/rooms';
import { addToPotOnline } from '@/lib/data/room-sync';
import { FOCUS_RULES } from '@/lib/game/mid-game';
import { formatPot, isLow } from '@/lib/game/pot';
import { useWalletStore } from '@/stores/wallet-store';
import { cn } from '@/lib/cn';
import { finishGame, startPublisher, takeOverGame, transferGame } from '@/lib/data/game-sync';
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
  /** After the last card: false while the phone offers "add to the pot or end the game"; true once the game phone chose to end. */
  const [recap, setRecap] = useState(false);
  const [tools, setTools] = useState(false);
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
    const costLeft = g.cardQueue.slice(g.currentCardIndex).reduce((a, c) => a + cardCost(c), 0);
    if (g.cardQueue.length > 0 && g.pot + 1e-6 < costLeft && g.pot <= 0.0005) setEmpty(true);
    else if (isLow(g.pot, g.potStart) && !lowShown.current) { lowShown.current = true; toast('Pot is running low. Top up from the pause menu.', {}); }
    else if (!isLow(g.pot, g.potStart)) lowShown.current = false;
  }, [g.pot, g.potStart, g.cardQueue, g.currentCardIndex, ended]);

  useEffect(() => {
    if (ended && recap && !settled.current && g.pot > 0) {
      settled.current = true;
      // Online pots belong to everyone who paid and there are no refunds after the start, so only offline games hand coins back.
      if (room?.online) return;
      const left = g.settlePot();
      if (left > 0) applyCoins('refund', left, 'Unused pot returned');
    }
  }, [ended, recap, g, applyCoins, room?.online]);

  // A player who joined through an invite link earns the invite reward once they have played a game.
  const rewardAsked = useRef(false);
  useEffect(() => {
    if (!ended || rewardAsked.current) return;
    rewardAsked.current = true;
    void rewardReferral().then((paid) => { if (paid) { toast('Invite reward: 30 coins', { tone: 'ok' }); void refreshAccount(); } });
  }, [ended]);

  // Mark the room as ended once, so the lobby doesn't offer "resume".
  useEffect(() => {
    // Online rooms stay 'active' on the server through the recap, so more cards can still be added; leaving the recap ends them.
    if (!ended || !recap || !room || room.online || room.status !== 'active') return;
    rooms.update(code, (r) => ({ ...r, status: 'ended' }));
  }, [ended, recap, room, code]);

  // Online: only the game phone plays. It reports every move so the others can watch, and carries on from the saved game when it just took over.
  const online = !!room?.online;
  const iRun = online ? room?.gamePhone === profile?.id : room?.hostId === profile?.id;
  const [loadingGame, setLoadingGame] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    if (!online || !iRun || loaded.current || !profile) return;
    loaded.current = true;
    if (useGameStore.getState().cardQueue.length > 0) return;
    setLoadingGame(true);
    void takeOverGame(code).then((ok) => { setLoadingGame(false); if (!ok) toast('Could not load the game. Check your connection.', { tone: 'warn' }); });
  }, [online, iRun, code, profile]);
  // Online: the pot is what everyone paid. Coins added by anyone (also from the watching phones) show up here.
  const funded = room ? potFunded(room) : 0;
  useEffect(() => {
    if (!online || !iRun || g.cardQueue.length === 0) return;
    const extra = funded - g.potStart;
    if (extra > 0) { g.topUpPot(extra); setEmpty(false); toast(`${extra} coins added to the pot`, { tone: 'ok' }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, iRun, funded, g.potStart, g.cardQueue.length]);
  const nonDrinking = !!room?.config.nonDrinkingMode;
  useEffect(() => {
    if (!online || !iRun) return;
    return startPublisher(code, nonDrinking, () => { g.resetGame(); toast('Another phone is running the game now.', {}); router.replace(`/game/${code}`); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, iRun, code, nonDrinking]);

  const plan = room ? roomPlan(room) : undefined;
  const moreDeck = room && !room.config.source && !plan?.picks ? Object.entries(roomPlan(room).basket).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] : undefined;
  const [moreCount, setMoreCount] = useState<number>(MORE_CARDS);
  const unitCost = moreDeck ? DECK_BY_ID[moreDeck as DeckId]?.price ?? 1 : 1;
  const moreCost = moreCount * unitCost;
  const [newIds, setNewIds] = useState<string[]>([]);
  const seenPlayers = useRef<Set<string> | null>(null);
  // Someone joined while the game runs: they take a turn after everyone else, and the pause menu shows them as new.
  useEffect(() => {
    if (!online || !iRun || !room || g.cardQueue.length === 0) return;
    if (!seenPlayers.current) { seenPlayers.current = new Set(room.players.map((p) => p.userId)); return; }
    const fresh = room.players.filter((p) => !seenPlayers.current!.has(p.userId));
    if (fresh.length === 0) return;
    fresh.forEach((p) => { seenPlayers.current!.add(p.userId); g.addPlayerToTurns({ id: p.userId, name: p.displayName, avatarUrl: p.avatarUrl }); toast(`${p.displayName} joined the game`, { tone: 'ok' }); });
    setNewIds((n) => [...n, ...fresh.map((p) => p.userId)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, iRun, room?.players, g.cardQueue.length]);
  /** Pay as you go: 10 more cards from the same stacks for 10 coins, then the game carries on. */
  const buyMore = (countArg?: number, fromPot = false) => {
    if (!room) return;
    const count = countArg ?? moreCount;
    const cost = count * unitCost;
    const src = room.config.source;
    const pool = plan?.picks ? plan.pool : undefined;
    const deck = Object.entries(roomPlan(room).basket).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as DeckId | undefined;
    if ((!deck && !src && !pool)) return;
    // Online: the cards are paid from the shared pot, so anyone can add coins first. Offline: from this wallet.
    if (room.online || fromPot ? g.pot + 1e-9 < cost : wallet < cost) { if (room.online || fromPot) { toast(`The pot needs ${cost} coins for ${count} more cards. Add coins first.`, {}); setTopUp(true); } return; }
    const seen = [...g.cardQueue, ...g.bufferCards].map((c) => c.id);
    const opts = { comfortFilters: skipTopics(room), trashedCardIds: [...useProfileStore.getState().trashedCardIds, ...(pool || src ? [] : seen)], playerCount: g.turnRotation.players.length, fitPlayers: true, avoid: seen };
    const built = pool ? buildPoolQueue({ pool, count, ...opts }) : src ? buildPoolQueue({ pool: sourceCards(src), count, ...opts }) : buildBasketQueue({ basket: { [deck as DeckId]: count }, ...opts }, buildLibrary());
    const n = built.cards.filter((c) => c.cardType !== 'wild').length;
    const price = built.cards.filter((c) => c.cardType !== 'wild').reduce((a, c) => a + cardCost(c), 0);
    if (n === 0) { toast('No new cards left in this deck. Start again with another deck.', {}); return; }
    // Online: the coins are already in the shared pot and are charged as the cards are played. Offline: this wallet pays now.
    if (!room.online && !fromPot) {
      if (!applyCoins('pot', -price, `${n} more cards`)) { toast('Not enough coins', {}); return; }
      g.topUpPot(price);
    }
    g.extendQueue(built.cards, built.buffer);
    settled.current = false;
    if (!room.online) rooms.update(code, (r) => ({ ...r, status: 'active' }));
  };

  if (!ready || !profile || status === 'loading') return <Splash />;

  if (loadingGame || (online && iRun && g.cardQueue.length === 0 && !loaded.current)) return <Splash />;
  if (status === 'missing' || !room || !iRun || (g.cardQueue.length === 0 && !ended)) {
    return (
      <div className="flex min-h-dvh flex-col items-start justify-center gap-4 px-5">
        <h1 className="text-6xl">No game running here</h1>
        <p className="text-muted">The game is played on one phone. Head back to the lobby to see where it is.</p>
        <Link href={`/game/${code}`} className="w-full max-w-xs"><Button full>Go to lobby</Button></Link>
      </div>
    );
  }

  const topUpSheet = (
  <TopUpSheet open={topUp} onClose={() => setTopUp(false)} wallet={wallet} pot={g.pot} finished={ended}
    cardsLeft={ended ? moreCount : Math.max(0, g.cardCountTarget - g.cardsPlayed)}
    costLeft={ended ? moreCost : g.cardQueue.slice(g.currentCardIndex).reduce((a, c) => a + cardCost(c), 0)}
    onAdd={(n) => {
      if (room.online) {
        // The server takes the coins; this phone's pot follows from the shared total (see the effect above).
        void addToPotOnline(code, n).then((r) => toast(r.ok ? `Added ${r.added} to the pot` : r.error, { tone: r.ok ? 'ok' : 'warn' }));
        return;
      }
      if (applyCoins('topup', -n, 'Added to the pot')) { g.topUpPot(n); setEmpty(false); toast(`Added ${n} to the pot`, { tone: 'ok' }); }
    }} />
  );

  if (ended && !recap) {
    const n = Math.max(0, Math.min(Math.floor(g.pot / unitCost), MAX_CARDS));
    return (
      <>
        <div className="flex min-h-dvh flex-col justify-center gap-5 px-5 py-8">
          <h1 className="text-6xl">That was the last card</h1>
          <p className="text-lg text-muted">{online ? 'Everyone in the room can add coins to the pot.' : 'Add coins to the pot to keep playing.'} The cards that are left get shuffled again.</p>
          <div className="rounded-2xl border-2 border-line p-4 text-center">
            <span className="display block text-7xl leading-none tabular-nums">{formatPot(g.pot)}</span>
            <span className="text-base font-semibold text-muted">coins in the pot</span>
          </div>
          {n > 0 && <Button size="lg" full onClick={() => buyMore(n, true)}>Keep going: {n} more {n === 1 ? 'card' : 'cards'}</Button>}
          <Button size="lg" full variant={n > 0 ? 'secondary' : 'primary'} onClick={() => setTopUp(true)}>Add to the pot</Button>
          <Button full variant="danger" onClick={() => setRecap(true)}>End the game</Button>
        </div>
        {topUpSheet}
      </>
    );
  }

  if (ended) {
    return (
      <>
      <Recap
        potStart={g.potStart} potRefunded={g.potRefunded}
        more={{ cards: moreCount, cost: moreCost, wallet: room.online ? g.pot : wallet, pot: room.online, onBuy: () => buyMore(), onCount: setMoreCount, onAdd: room.online ? () => setTopUp(true) : undefined }}
        saved={hearted.map((id) => g.cardQueue.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c)}
        mode={g.gameMode} deckName={roomPlan(room).label} played={g.cardsPlayed} skipped={g.skippedCount} hearted={g.heartedCount} peak={g.peakHeat}
        onHome={() => { g.resetGame(); if (room.online) void finishGame(code, 'ended'); router.replace('/'); }}
        onAgain={() => {
          g.resetGame();
          if (room.online) {
            void finishGame(code, 'lobby').then(() => router.replace(`/game/${code}${room.hostId === profile.id ? '/setup' : ''}`));
            return;
          }
          rooms.update(code, (r) => ({ ...r, status: 'lobby', agreedPlayers: [] }));
          router.replace(`/game/${code}/setup`);
        }}
      />
      {topUpSheet}
      </>
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

  /** Back to the previous card: same player, same heat. Works up to 5 cards back. */
  const goBack = () => {
    const snap = g.history[g.history.length - 1];
    if (!snap) return;
    const id = (snap.kind === 'trash' ? snap.cardQueue : g.cardQueue)[snap.currentCardIndex]?.id;
    if (snap.kind === 'trash' && id) untrash(id);
    g.prevCard();
    setUndoBar(null);
    haptic('warn');
  };

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
          <div className="flex shrink-0 gap-2">
            <button onClick={goBack} disabled={g.history.length === 0} aria-label="Previous card" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line disabled:opacity-30"><Icon name="undo" /></button>
            <button onClick={() => setPause(true)} aria-label="Pause menu" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line"><Icon name="pause" /></button>
          </div>
        </div>
        <HeatBar level={g.heatLevel} spiking={g.heatSpikeRemaining > 0} />
        <div className="flex flex-wrap justify-between gap-x-3 text-sm font-bold text-muted [&>*]:whitespace-nowrap">
          <span>Card {Math.min(g.cardsPlayed + 1, g.cardCountTarget)} of {g.cardCountTarget}</span>
          {st.showRules && <span>{ruleLine(room.config.drinkRuleTemplate, room.config.nonDrinkingMode)}</span>}
          {g.potStart > 0 && <button onClick={() => setTopUp(true)} aria-label="Pot, tap to top up" className={cn('inline-flex min-h-tap items-center px-1 font-extrabold underline decoration-2 underline-offset-4', isLow(g.pot, g.potStart) ? 'text-danger' : 'text-text')}>Pot <RollNumber value={g.pot} format={formatPot} /></button>}
        </div>
        {g.activeRule && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-[rgb(190_222_58)] px-3 py-2 text-base font-extrabold text-[rgb(24_19_16)]">
            <span className="sign shrink-0 text-sm">Rule on</span>
            <span className="min-w-0">{fillDrink(g.activeRule, room.config.nonDrinkingMode)}</span>
          </p>
        )}
      </header>

      <main className="min-h-0 flex-1 [perspective:1200px]">
        {card && <PlayCard card={card} revealed={revealed} onReveal={reveal} onDone={() => resolve('dismiss')} onRule={(t) => g.setRule(t)} nonDrinking={room.config.nonDrinkingMode} />}
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
        players={g.turnRotation.players} pot={g.pot} onTopUp={() => { setPause(false); setTopUp(true); }}
        onTools={() => { setPause(false); setTools(true); }}
        onFocus={(k) => { const n = g.focusNext(k); toast(n > 0 ? `${FOCUS_RULES[k as 'deep' | 'dares'].label}` : 'No matching cards left', {}); }}
        onAddPlayer={(name) => { const id = `guest-${Math.random().toString(36).slice(2, 10)}`; const av = `c${(g.turnRotation.players.length + 2) % 10}`; g.addPlayerToTurns({ id, name, avatarUrl: av }); rooms.update(code, (r) => withPlayer(r, { id, userId: id, displayName: name, avatarUrl: av, isGuest: true })); }}
        onMove={g.movePlayer}
        onReport={() => { if (card) { try { const k = 'tagai-reports'; const l = JSON.parse(window.localStorage.getItem(k) ?? '[]'); l.push({ id: card.id, at: Date.now() }); window.localStorage.setItem(k, JSON.stringify(l)); } catch { /* ignore */ } toast('Thanks. We will look at this card.', { tone: 'ok' }); } }}
        onRemovePlayer={(id) => { g.removePlayerFromTurns(id); rooms.update(code, (r) => ({ ...r, players: r.players.filter((p) => p.userId !== id) })); }}
        onEnd={() => { setPause(false); g.endGame(); }}
        currentIndex={g.turnRotation.currentIndex} newIds={newIds}
        others={online ? room.players.filter((p) => !p.isGuest && p.userId !== profile.id).map((p) => ({ id: p.userId, name: p.displayName, avatarUrl: p.avatarUrl })) : []}
        onPass={async (to) => {
          const res = await transferGame(code, to);
          if (!res.ok) { toast(res.error, { tone: 'warn' }); return; }
          setPause(false);
          rooms.update(code, (r) => ({ ...r, gamePhone: to, gameView: res.reply.data.gameView ?? null }));
          router.replace(`/game/${code}`);
        }}
      />
      <ToolsSheet open={tools} onClose={() => setTools(false)} players={g.turnRotation.players.map((p) => p.name)} />
      {topUpSheet}
      <Sheet open={empty && !topUp} onClose={() => undefined} title="Pot is empty">
        <p className="-mt-2 mb-6 text-lg text-muted">The game is paused. Add coins to keep going, or end it here.</p>
        <div className="space-y-3 pb-2">
          <Button size="lg" full onClick={() => setTopUp(true)}>Top up the pot</Button>
          <Button full variant="danger" onClick={() => { setEmpty(false); g.endGame(); }}>End game</Button>
        </div>
      </Sheet>
      <ConfirmSheet open={trashAsk} title="Trash this card?" body="You will not see this card again. All your trashed cards are stored in Settings, where you can undo it." confirmLabel="Trash card" danger onConfirm={() => resolve('trash')} onClose={() => setTrashAsk(false)} />
      <span className="sr-only">Next up: {next.name}</span>
    </div>
  );
}
