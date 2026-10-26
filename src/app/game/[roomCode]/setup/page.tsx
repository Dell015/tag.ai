'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, Button, Chip, Icon, RollNumber, Screen, Splash, Stepper, toast } from '@/components/ui';
import { MIN_POT, formatPot } from '@/lib/game/pot';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { agreeOnline, setSkipsOnline } from '@/lib/data/room-sync';
import { startGameOnline } from '@/lib/data/game-sync';
import { PotPanel } from '@/components/lobby/PotPanel';
import { SeatCircle } from '@/components/lobby/SeatCircle';
import { rooms, potFunded, skipTopics, type RoomConfig } from '@/lib/data/rooms';
import { MAX_CARDS, MIN_OWN_CARDS, allAgreed, roomPlan, startGame } from '@/lib/data/start-game';
import { availableSources } from '@/lib/data/game-source';
import { picksHaveAdult, picksPool } from '@/lib/data/game-pool';
import { DECKS, DECK_GROUPS, DECK_BY_ID, deckPool, type DeckId } from '@/lib/game/decks';
import { PRESET_TOPICS } from '@/lib/game/comfort-filters';
import { formatDuration, DRINK_RULE_TEMPLATES, MAX_CUSTOM_RULES } from '@/lib/game/setup-options';
import { useProfileStore } from '@/stores/profile-store';
import { buildLibrary } from '@/lib/data/start-game';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';


type StepKey = 'basket' | 'pot' | 'seats' | 'drinks' | 'house';
const STEPS: StepKey[] = ['basket', 'pot', 'seats', 'house'];
const TOTAL = STEPS.length;
const TITLES: Record<StepKey, string> = { basket: 'Pick your decks', pot: 'The pot', seats: 'Who sits where', drinks: 'Drink rules', house: 'House rules' };

function Row({ selected, onClick, children }: { selected?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-pressed={selected} onClick={() => { haptic('tap'); onClick(); }}
      className={cn('flex min-h-[4.5rem] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors active:scale-[0.99]',
        selected ? 'border-accent bg-accent/15' : 'border-line')}>
      {children}
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-accent bg-accent text-onaccent' : 'border-line')}>
        {selected && <Icon name="check" size={16} />}
      </span>
    </button>
  );
}

export default function SetupPage() {
  const params = useParams<{ roomCode: string }>();
  const code = params.roomCode.toUpperCase();
  const router = useRouter();
  const { ready, profile } = useRequireProfile(`/game/${code}/setup`);
  const { status, room } = useRoom(code);
  const trashed = useProfileStore((s) => s.trashedCardIds);
  const [step, setStep] = useState(1);
  const [seatOrder, setSeatOrder] = useState<string[]>([]);
  const [word, setWord] = useState('');
  const [rule, setRule] = useState('');
  const [adultOk, setAdultOk] = useState(false);
  const starting = useRef(false);
  const [busy, setBusy] = useState(false);
  /** Online: the account whose phone runs the game. Defaults to the host. */
  const [phone, setPhone] = useState('');
  const library = useMemo(() => buildLibrary(), []);
  const pools = useMemo(() => Object.fromEntries(DECKS.map((d) => [d.id, deckPool(d, library).length])) as Record<DeckId, number>, [library]);

  useEffect(() => {
    if (room && room.hostId === profile?.id && !room.config.drinkRuleTemplate) {
      rooms.update(code, (r) => ({ ...r, config: { ...r.config, drinkRuleTemplate: 'Classic' } }));
    }
  }, [room, profile, code]);

  if (!ready || !profile || status === 'loading') return <Splash />;
  if (status === 'missing' || !room) { router.replace('/'); return <Splash />; }
  if (room.status === 'active' && !starting.current) { router.replace(`/game/${code}`); return <Splash />; }

  const isHost = room.hostId === profile.id;
  const cfg = room.config;
  const set = (patch: Partial<RoomConfig>) => rooms.update(code, (r) => ({ ...r, config: { ...r.config, ...patch } }));
  const agree = (userId: string) => {
    // On your own phone in an online room, the server records your tap so the host sees it at once.
    if (room.online && !isHost) { void agreeOnline(code); return; }
    rooms.update(code, (r) => ({ ...r, agreedPlayers: r.agreedPlayers.includes(userId) ? r.agreedPlayers.filter((i) => i !== userId) : [...r.agreedPlayers, userId] }));
  };

  const view = isHost ? step : TOTAL;
  const key = STEPS[view - 1];
  const template = DRINK_RULE_TEMPLATES.find((t) => t.id === cfg.drinkRuleTemplate);
  const pending = room.players.filter((p) => !room.agreedPlayers.includes(p.userId)).length;

  // Online, everyone keeps their own list on the server and the game skips all of them. Offline there is one list.
  const myTopics = room.online ? room.skips?.[profile.id] ?? [] : cfg.comfortFilters;
  const saveTopics = (next: string[]) => {
    if (room.online) { rooms.update(code, (r) => ({ ...r, skips: { ...(r.skips ?? {}), [profile.id]: next } })); void setSkipsOnline(code, next); }
    else set({ comfortFilters: next });
  };
  const toggleTopic = (t: string) => saveTopics(myTopics.includes(t) ? myTopics.filter((x) => x !== t) : [...myTopics, t]);
  const addWord = () => { const w = word.trim(); if (w && !myTopics.includes(w)) saveTopics([...myTopics, w]); setWord(''); };
  const allTopics = skipTopics(room);
  const customTopics = myTopics.filter((f) => !(PRESET_TOPICS as readonly string[]).includes(f));
  const addRule = () => { const r = rule.trim(); if (r && cfg.customDrinkRules.length < MAX_CUSTOM_RULES) set({ customDrinkRules: [...cfg.customDrinkRules, r] }); setRule(''); };
  const accountPlayers = room.players.filter((p) => !p.isGuest);
  const phoneId = accountPlayers.some((p) => p.userId === phone) ? phone : profile.id;
  const start = async () => {
    starting.current = true;
    if (room.online) {
      setBusy(true);
      const res = await startGameOnline(room, trashed, phoneId);
      setBusy(false);
      if (!res.ok) { starting.current = false; toast(res.error, { tone: 'warn' }); return; }
      // The host phone plays unless the host handed the game to someone else.
      router.push(phoneId === profile.id ? `/game/${code}/play` : `/game/${code}`);
      return;
    }
    if (startGame(room, trashed)) router.push(`/game/${code}/play`); else starting.current = false;
  };

  const library2 = library;
  const picks = cfg.picks ?? { decks: [], sources: [] };
  const sources = availableSources();
  const pool = picksPool(picks, library2);
  const poolSize = pool.length;
  const hasAdult = picksHaveAdult(picks, pool);
  const funded = potFunded(room);
  const online = !!room.online;
  const setPicks = (next: typeof picks) => {
    set({ picks: next, potStyle: 'solo', source: undefined, basket: {}, playerBaskets: {}, pot: cfg.pot ?? MIN_POT });
  };
  const allDecks = DECKS.filter((d) => d.ready && d.id !== 'chaos').map((d) => d.id);
  const toggleDeck = (id: DeckId) => {
    haptic('tap');
    // Shuffle everything ticks every deck (and unticks them all); changing one deck afterwards drops it again.
    if (id === 'chaos') { setPicks({ ...picks, decks: picks.decks.includes('chaos') ? picks.decks.filter((x) => x !== 'chaos' && !allDecks.includes(x)) : ['chaos', ...allDecks] }); return; }
    const on = picks.decks.includes(id);
    setPicks({ ...picks, decks: (on ? picks.decks.filter((x) => x !== id) : [...picks.decks, id]).filter((x) => x !== 'chaos') });
  };
  const toggleSource = (x: (typeof sources)[number]) => {
    haptic('tap');
    const on = picks.sources.some((p) => p.kind === x.kind && p.id === x.id);
    setPicks({ ...picks, sources: on ? picks.sources.filter((p) => !(p.kind === x.kind && p.id === x.id)) : [...picks.sources, { kind: x.kind, id: x.id, name: x.name }] });
  };
  const setPot = (n: number) => { haptic('tap'); set({ pot: Math.max(MIN_POT, Math.min(MAX_CARDS, n)) }); };
  const plan = roomPlan(room);
  const cards = plan.cards;
  const total = plan.coins;
  const wallet = profile.coins;
  // Online rooms are paid by everyone from their own wallets, so the pot must be full instead of the host's wallet being big enough.
  const potOk = cards >= MIN_OWN_CARDS && (online ? !!room.potConfirmed && funded >= MIN_POT : wallet + 1e-9 >= total);
  const adultBlocked = hasAdult && !adultOk;
  const accentDeck = picks.decks.length === 1 && picks.sources.length === 0 ? DECKS.find((d) => d.id === picks.decks[0]) : undefined;
  const seated = seatOrder.filter((id) => room.players.some((p) => p.userId === id));
  const commitSeats = () => rooms.update(code, (r) => ({ ...r, players: r.players.map((p) => ({ ...p, turnOrder: seated.indexOf(p.userId) })) }));
  const next = () => { if (key === 'seats') commitSeats(); setStep(step + 1); };
  const blocked = key === 'seats' ? (seated.length < room.players.length ? 'Give everyone a seat' : null) : key === 'basket'
    ? (poolSize === 0 ? 'Pick a deck' : adultBlocked ? 'Confirm everyone is 18 or older' : null)
    : key === 'pot' ? (online ? (room.potConfirmed ? null : 'Confirm the pot to go on') : total > wallet ? 'Not enough coins' : null)
    : null;

  const footer = view < TOTAL ? (
    <Button size="lg" full disabled={blocked !== null} onClick={next}>{blocked ?? 'Next'}</Button>
  ) : isHost ? (
    <Button size="lg" full disabled={busy || !allAgreed(room) || !potOk || adultBlocked} onClick={() => void start()}>{!potOk ? (online ? (room.potConfirmed ? `The pot needs at least ${MIN_POT} coins` : 'Confirm the pot first') : 'Fix your cards first') : adultBlocked ? 'Confirm everyone is 18 or older' : allAgreed(room) ? 'Start game' : `Waiting for ${pending} to agree`}</Button>
  ) : (
    <p className="pb-2 text-center text-lg text-muted">Waiting for the host to start.</p>
  );

  const input = 'h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent';

  return (
    <Screen mode={accentDeck?.mode} back={isHost && step > 1 ? undefined : `/game/${code}`} title={TITLES[key]} footer={footer}>
      {isHost && (
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && <button onClick={() => setStep(step - 1)} aria-label="Previous step" className="flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>}
          <div className="flex-1"><Stepper step={step} total={TOTAL} /></div>
        </div>
      )}

      {key === 'basket' && (
        <>
          <p className="-mt-2 mb-5 text-base text-muted">Tick every deck you want in the game. Cards that appear in more than one are only used once. Next you set the pot: 1 coin is 1 card.</p>

          <div className="space-y-7">
            <section>
              <h3 className="text-3xl">Your cards</h3>
              <p className="mb-1 mt-1 text-base text-muted">Your own decks, liked cards and packs you own.</p>
              {sources.length === 0 ? (
                <div className="mt-3 rounded-xl border-2 border-dashed border-line p-4">
                  <p className="text-base font-semibold">Nothing here yet.</p>
                  <p className="mt-1 text-base text-muted">Tap the heart on a card during a game, or make a deck of your own, and it shows up here.</p>
                  <Link href="/stacks" className="mt-3 inline-flex h-tap items-center rounded-xl border-2 border-line px-4 font-bold">Open Decks</Link>
                </div>
              ) : (
                <ul>
                  {sources.map((x) => {
                    const on = picks.sources.some((p) => p.kind === x.kind && p.id === x.id);
                    return (
                      <li key={`${x.kind}-${x.id}`} className="border-b-2 border-line/60 py-3">
                        <button role="checkbox" aria-checked={on} onClick={() => toggleSource(x)}
                          className={cn('flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors', on ? 'border-accent bg-accent/10' : 'border-line')}>
                          <span className="min-w-0 flex-1">
                            <span className="sign block text-[1.15rem] leading-tight">{x.name}</span>
                            <span className="block text-base font-semibold text-muted">{x.count} cards{x.kind === 'pack' ? ', shop pack' : x.kind === 'stack' ? ', your deck' : ''}</span>
                          </span>
                          <span aria-hidden className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-accent bg-accent text-onaccent' : 'border-line')}>{on && <Icon name="check" size={16} />}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {DECK_GROUPS.map((g) => (
              <section key={g.label}>
                <h3 className="text-3xl">{g.label}</h3>
                <p className="mb-1 mt-1 text-base text-muted">{g.hint}</p>
                <ul>
                  {g.ids.map((id) => {
                    const d = DECK_BY_ID[id];
                    const on = picks.decks.includes(id);
                    return (
                      <li key={id} className="border-b-2 border-line/60 py-3">
                        <button disabled={!d.ready} role="checkbox" aria-checked={on} onClick={() => toggleDeck(id)}
                          className={cn('flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors', on ? 'border-accent bg-accent/10' : 'border-line', !d.ready && 'opacity-50')}>
                          <span aria-hidden data-deck={id} style={{ transform: `rotate(${(id.length % 3 - 1) * 4}deg)` }} className="sign mt-0.5 flex h-[3.4rem] w-11 shrink-0 items-end justify-end rounded-md border-[3px] border-[#0c0a08] bg-accent p-1 text-xl leading-none text-onaccent">{id === 'adult' ? '18+' : '?'}</span>
                          <span className="min-w-0 flex-1">
                            <span className="sign block text-[1.15rem] leading-tight">{d.name}</span>
                            <span className="block text-base text-muted">{d.blurb}</span>
                            <span className="mt-1 block text-base font-semibold text-muted">{d.ready ? `${pools[id]} cards` : 'Coming soon'}</span>
                          </span>
                          <span aria-hidden className={cn('mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-accent bg-accent text-onaccent' : 'border-line')}>{on && <Icon name="check" size={16} />}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          {hasAdult && (
            <button role="switch" aria-checked={adultOk} onClick={() => setAdultOk(!adultOk)}
              className="mt-6 flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-xl border-2 border-line px-4 py-3 text-left">
              <span className="text-base font-bold">Everyone at the table is 18 or older and agrees to play. Any card can be skipped.</span>
              <span className={cn('h-8 w-14 shrink-0 rounded-full p-1 transition-colors', adultOk ? 'bg-accent' : 'bg-raised')}>
                <span className={cn('block h-6 w-6 rounded-full bg-text transition-transform', adultOk && 'translate-x-6 bg-onaccent')} />
              </span>
            </button>
          )}

        </>
      )}

      {key === 'pot' && (
        <>
          <p className="mb-4 text-base text-muted">{poolSize} different cards to play from, no repeats. {cards > poolSize && poolSize > 0 ? `The pot is bigger, so the stack is shuffled again after ${poolSize} cards. ` : ''}Wild cards are free on top.</p>
          {online ? (
            <PotPanel room={room} myId={profile.id} wallet={wallet} isHost={isHost} />
          ) : (
            <section className="rounded-2xl border-2 border-line p-4">
              <div className="flex items-center justify-center gap-4">
                <button aria-label="Fewer coins" disabled={cards <= MIN_POT} onClick={() => setPot(cards - 5)} className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-line text-3xl font-extrabold disabled:opacity-40">-</button>
                <div className="min-w-[7rem] text-center"><span className="display block text-6xl leading-none tabular-nums"><RollNumber value={cards} format={formatPot} /></span><span className="text-base font-semibold text-muted">coins, {cards} cards</span></div>
                <button aria-label="More coins" disabled={cards >= MAX_CARDS} onClick={() => setPot(cards + 5)} className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-line text-3xl font-extrabold disabled:opacity-40">+</button>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[10, 20, 30, 50, 100].map((n) => <Chip key={n} selected={cards === n} onClick={() => setPot(n)}>{n}</Chip>)}
              </div>
              {cards > 0 && <p className="mt-4 text-center text-lg font-bold">About {formatDuration(cards)} of play.</p>}
              <p className="mt-3 rounded-xl bg-raised px-3 py-2 text-base font-semibold">Coins in the pot are not refunded. Cards you do not get to play are lost, so pick the pot you really want.</p>
              <p className="mt-4 text-lg">You have <b>{formatPot(wallet)} coins</b>. When the cards run out you can add more.</p>
              {total > wallet && <p className="mt-2 text-lg font-bold text-danger">You are {formatPot(total - wallet)} coins short. <Link href="/shop" className="underline">Add coins</Link></p>}
            </section>
          )}
        </>
      )}

      {key === 'drinks' && (
        <>
          <div className="space-y-3">
            {DRINK_RULE_TEMPLATES.map((t) => (
              <Row key={t.id} selected={cfg.drinkRuleTemplate === t.id} onClick={() => set({ drinkRuleTemplate: t.id })}>
                <span className="flex-1"><span className="display block text-3xl">{t.name}</span><span className="text-base text-muted">{t.summary}</span></span>
              </Row>
            ))}
          </div>
          <button onClick={() => set({ nonDrinkingMode: !cfg.nonDrinkingMode })} role="switch" aria-checked={cfg.nonDrinkingMode}
            className="mt-4 flex min-h-[4.5rem] w-full items-center justify-between gap-3 rounded-xl border-2 border-line px-4 text-left">
            <span><span className="block text-xl font-extrabold">Non-drinking mode</span><span className="text-base text-muted">Dares and forfeits instead of drinks</span></span>
            <span className={cn('h-8 w-14 shrink-0 rounded-full p-1 transition-colors', cfg.nonDrinkingMode ? 'bg-accent' : 'bg-raised')}>
              <span className={cn('block h-6 w-6 rounded-full bg-text transition-transform', cfg.nonDrinkingMode && 'translate-x-6 bg-onaccent')} />
            </span>
          </button>
          <h3 className="mb-2 mt-8 text-3xl">Your own rules <span className="text-xl text-muted">{cfg.customDrinkRules.length} of {MAX_CUSTOM_RULES}</span></h3>
          <ul>
            {cfg.customDrinkRules.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-2 border-b-2 border-line/60 py-1 pl-1 text-lg"><span>{r}</span>
                <button aria-label="Remove rule" className="flex h-tap w-tap items-center justify-center text-muted" onClick={() => set({ customDrinkRules: cfg.customDrinkRules.filter((_, j) => j !== i) })}><Icon name="close" size={20} /></button></li>
            ))}
          </ul>
          {cfg.customDrinkRules.length < MAX_CUSTOM_RULES && (
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addRule(); }}>
              <input value={rule} onChange={(e) => setRule(e.target.value)} maxLength={80} placeholder="Last to touch their nose drinks" aria-label="Custom rule" className={input} />
              <Button type="submit" variant="secondary" disabled={!rule.trim()}>Add</Button>
            </form>
          )}
        </>
      )}

      {key === 'seats' && (
        <>
          <p className="-mt-2 mb-5 text-base text-muted">Tap names in the order people sit around the table, going clockwise. The first seat plays first.</p>
          <SeatCircle players={room.players} order={seated} onChange={setSeatOrder} />
        </>
      )}

      {key === 'house' && (
        <>
          <section data-mode={accentDeck?.mode} className="rounded-card bg-accent p-5 text-onaccent">
            <div className="text-lg font-bold">{cards} cards, about {formatDuration(cards)}</div>
            <ul aria-label="Decks in this game" className="-mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
              {[...picks.decks.filter((id) => id !== 'chaos' || picks.decks.length === 1).filter((id) => !(picks.decks.includes('chaos') && id !== 'chaos')).map((id) => ({ key: id, name: DECK_BY_ID[id]?.name ?? id, mark: id === 'adult' ? '18+' : '?' })),
                ...picks.sources.map((x) => ({ key: `${x.kind}-${x.id}`, name: x.name, mark: '?' }))].map((c, i) => (
                <li key={c.key} className="w-24 shrink-0 snap-start">
                  <div style={{ transform: `rotate(${(i % 3 - 1) * 3}deg)` }} className="sign flex h-32 w-full items-end justify-end rounded-lg border-[3px] border-[#0c0a08] bg-onaccent/15 p-2 text-3xl leading-none">{c.mark}</div>
                  <div className="mt-1 truncate text-sm font-bold">{c.name}</div>
                </li>
              ))}
            </ul>
            {picks.decks.includes('chaos') && <p className="text-base font-bold">Every deck is in</p>}
          </section>
          <ul className="mt-5 space-y-2 text-lg">
            <li><b>{template?.name ?? 'Classic'}.</b> <span className="text-muted">{template?.summary}</span></li>
            <li><b>Pot:</b> <span className="text-muted">{formatPot(total)} coins for {cards} cards, plus free wild cards{online ? '. Paid by everyone.' : ''}</span></li>
            {cfg.nonDrinkingMode && <li><b>Non-drinking mode</b> is on.</li>}
            {cfg.customDrinkRules.map((r, i) => <li key={i}>{r}</li>)}
            <li className="text-muted">Anyone can skip a card. Nobody has to answer. Nobody drives.</li>
          </ul>

          <section className="mt-7" aria-label="Play order">
            <h3 className="text-3xl">Who plays when</h3>
            <ol className="mt-3 flex flex-wrap gap-3">
              {[...room.players].sort((a, b) => a.turnOrder - b.turnOrder).map((p, i) => (
                <li key={p.userId} className="flex w-16 flex-col items-center gap-1">
                  <span className="relative"><Avatar value={p.avatarUrl} name={p.displayName} size={48} /><span className="sign absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-onaccent">{i + 1}</span></span>
                  <span className="w-full truncate text-center text-sm font-bold">{p.userId === profile.id ? 'You' : p.displayName}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-7" aria-label="Skip these topics">
            <h3 className="text-3xl">Skip these topics</h3>
            <p className="mb-3 mt-1 text-base text-muted">Cards about these are left out for everyone. Nobody has to explain why.{online ? ' Everyone picks on their own phone.' : ''}</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS.map((t) => <Chip key={t} selected={myTopics.includes(t)} onClick={() => toggleTopic(t)}>{t}</Chip>)}
              {customTopics.map((w) => <Chip key={w} selected onClick={() => toggleTopic(w)}>{w}<Icon name="close" size={16} /></Chip>)}
            </div>
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); addWord(); }}>
              <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={24} placeholder="Add a word, like ex" aria-label="Custom word" className={input} />
              <Button type="submit" variant="secondary" disabled={!word.trim()}>Add</Button>
            </form>
            {online && allTopics.length > 0 && <p className="mt-3 text-base"><b>Left out in this game:</b> <span className="text-muted">{allTopics.join(', ')}</span></p>}
          </section>

          {online && !isHost && <div className="mt-7"><PotPanel room={room} myId={profile.id} wallet={wallet} isHost={false} /></div>}
          {online && isHost && accountPlayers.length > 1 && (
            <section className="mt-8" aria-label="Which phone runs the game">
              <h3 className="text-4xl">Which phone runs the game?</h3>
              <p className="mb-3 mt-1 text-base text-muted">Cards show on that phone. The other phones can watch live or close the app. You can pass the game on later from the pause menu.</p>
              <div className="grid grid-cols-3 gap-3">
                {accountPlayers.map((p) => (
                  <button key={p.userId} onClick={() => { haptic('tap'); setPhone(p.userId); }} aria-pressed={p.userId === phoneId}
                    className={cn('flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors active:scale-95', p.userId === phoneId ? 'border-accent bg-accent/15' : 'border-line')}>
                    <Avatar value={p.avatarUrl} name={p.displayName} size={56} />
                    <span className="w-full truncate text-center text-base font-bold">{p.userId === profile.id ? 'This phone' : p.displayName}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <h3 className="mt-8 text-4xl">Tap your name to agree</h3>
          <p className="mb-3 mt-1 text-base text-muted">Everyone taps their own name to say yes to the rules. Tap again to undo.</p>
          <div className="grid grid-cols-3 gap-3">
            {[...room.players].sort((a, b) => a.turnOrder - b.turnOrder).map((p) => {
              const ok = room.agreedPlayers.includes(p.userId);
              const canTap = isHost || p.userId === profile.id;
              return (
                <button key={p.userId} disabled={!canTap} onClick={() => { haptic('success'); agree(p.userId); }} aria-pressed={ok}
                  className={cn('relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors active:scale-95', ok ? 'border-ok bg-ok/15' : 'border-line', !canTap && 'opacity-50')}>
                  <Avatar value={p.avatarUrl} name={p.displayName} size={56} />
                  {ok && <span className="sign absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ok text-bg" aria-label="Agreed"><Icon name="check" size={16} /></span>}
                  <span className="w-full truncate text-center text-base font-bold">{p.displayName}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Screen>
  );
}
