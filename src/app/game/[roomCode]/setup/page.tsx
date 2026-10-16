'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, Button, Chip, Icon, NumberStepper, RollNumber, Screen, SegmentedControl, Splash, Stepper } from '@/components/ui';
import { MIN_POT, formatPot, formatPrice, isPotValid, gameBasket, owedForBasket, type PotStyle } from '@/lib/game/pot';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { rooms, type RoomConfig } from '@/lib/data/rooms';
import { allAgreed, startGame } from '@/lib/data/start-game';
import { DECKS, DECK_GROUPS, DECK_BY_ID, basketCards, basketCost, basketHasAdult, basketNames, deckPool, type Basket, type DeckId } from '@/lib/game/decks';
import { PRESET_TOPICS } from '@/lib/game/comfort-filters';
import { formatDuration, DRINK_RULE_TEMPLATES, MAX_CUSTOM_RULES } from '@/lib/game/setup-options';
import { useProfileStore } from '@/stores/profile-store';
import { buildLibrary } from '@/lib/data/start-game';
import { PAINT, type Paint } from '@/components/ui/Art';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';


/** Tile colour per deck. Adult is plain ink with an 18+ mark so it never reads as just another colour. */
const TILE: Record<DeckId, Paint | 'ink'> = { icebreaker: 'blue', family: 'green', life: 'orange', deep: 'blue', barkada: 'yellow', lovers: 'pink', spicy: 'red', adult: 'ink', social: 'green', chaos: 'orange' };
const tileStyle = (id: DeckId) => TILE[id] === 'ink' ? { backgroundColor: '#2A231E', borderColor: '#564B40', color: '#F4F1EC' } : { backgroundColor: PAINT[TILE[id] as Paint], borderColor: '#0c0a08', color: ['blue', 'red'].includes(TILE[id]) ? '#fff' : '#181310' };

type StepKey = 'basket' | 'topics' | 'drinks' | 'house';
const STEPS: StepKey[] = ['basket', 'topics', 'drinks', 'house'];
const TOTAL = STEPS.length;
const TITLES: Record<StepKey, string> = { basket: 'Buy your cards', topics: 'Skip these topics', drinks: 'Drink rules', house: 'House rules' };

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
  const [word, setWord] = useState('');
  const [rule, setRule] = useState('');
  const [who, setWho] = useState<string | null>(null);
  const [adultOk, setAdultOk] = useState(false);
  const starting = useRef(false);
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
  const agree = (userId: string) =>
    rooms.update(code, (r) => ({ ...r, agreedPlayers: r.agreedPlayers.includes(userId) ? r.agreedPlayers.filter((i) => i !== userId) : [...r.agreedPlayers, userId] }));

  const view = isHost ? step : TOTAL;
  const key = STEPS[view - 1];
  const template = DRINK_RULE_TEMPLATES.find((t) => t.id === cfg.drinkRuleTemplate);
  const pending = room.players.filter((p) => !room.agreedPlayers.includes(p.userId)).length;
  const customTopics = cfg.comfortFilters.filter((f) => !(PRESET_TOPICS as readonly string[]).includes(f));

  const toggleTopic = (t: string) => set({ comfortFilters: cfg.comfortFilters.includes(t) ? cfg.comfortFilters.filter((x) => x !== t) : [...cfg.comfortFilters, t] });
  const addWord = () => { const w = word.trim(); if (w && !cfg.comfortFilters.includes(w)) set({ comfortFilters: [...cfg.comfortFilters, w] }); setWord(''); };
  const addRule = () => { const r = rule.trim(); if (r && cfg.customDrinkRules.length < MAX_CUSTOM_RULES) set({ customDrinkRules: [...cfg.customDrinkRules, r] }); setRule(''); };
  const start = () => { starting.current = true; if (startGame(room, trashed)) router.push(`/game/${code}/play`); else starting.current = false; };

  const style: PotStyle = cfg.potStyle ?? 'solo';
  const editing = style === 'chipin' ? (who ?? room.hostId) : null;
  const current: Basket = style === 'chipin' ? (cfg.playerBaskets?.[editing ?? ''] ?? {}) : (cfg.basket ?? {});
  const setCount = (id: DeckId, n: number) => {
    if (style === 'chipin' && editing) set({ playerBaskets: { ...(cfg.playerBaskets ?? {}), [editing]: { ...current, [id]: n } } });
    else set({ basket: { ...current, [id]: n } });
  };
  const basket = gameBasket(style, cfg.basket, cfg.playerBaskets);
  const cards = basketCards(basket);
  const total = basketCost(basket);
  const owed = owedForBasket(style, total, room.players, room.hostId, cfg.playerBaskets ?? {});
  const nameOf = (id: string) => room.players.find((p) => p.userId === id)?.displayName ?? '';
  const wallet = profile.coins;
  const potOk = isPotValid(total) && wallet + 1e-9 >= total;
  const adultBlocked = basketHasAdult(basket) && !adultOk;
  const accentDeck = DECKS.find((d) => (basket[d.id] ?? 0) > 0);
  const blocked = key === 'basket'
    ? (total < MIN_POT ? `Buy at least ${MIN_POT} coins of cards` : total > wallet ? 'Not enough coins' : adultBlocked ? 'Confirm everyone is 18 or older' : null)
    : null;

  const footer = view < TOTAL ? (
    <Button size="lg" full disabled={blocked !== null} onClick={() => setStep(step + 1)}>{blocked ?? 'Next'}</Button>
  ) : isHost ? (
    <Button size="lg" full disabled={!allAgreed(room) || !potOk || adultBlocked} onClick={start}>{!potOk ? 'Fix your cards first' : adultBlocked ? 'Confirm everyone is 18 or older' : allAgreed(room) ? 'Start game' : `Waiting for ${pending} to agree`}</Button>
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
          <p className="-mt-2 mb-5 text-base text-muted">Choose how many cards to buy from each deck. Each deck has its own price. Wild cards are free and come on top.</p>
          <SegmentedControl<PotStyle> label="Who pays" value={style} onChange={(v) => set({ potStyle: v })}
            options={[{ id: 'solo', label: 'I pay it all' }, { id: 'split', label: 'Split it' }, { id: 'chipin', label: 'Each buys' }]} />

          {style === 'chipin' && (
            <div className="mt-4">
              <p className="mb-2 text-base text-muted">Pick a player, then set what they buy. You collect the cash.</p>
              <div className="flex flex-wrap gap-2">
                {room.players.map((p) => (
                  <Chip key={p.userId} selected={editing === p.userId} onClick={() => setWho(p.userId)}>
                    {p.displayName} {formatPot(basketCost(cfg.playerBaskets?.[p.userId] ?? {}))}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-7">
            {DECK_GROUPS.map((g) => (
              <section key={g.label}>
                <h3 className="text-3xl">{g.label}</h3>
                <p className="mb-1 mt-1 text-base text-muted">{g.hint}</p>
                <ul>
                  {g.ids.map((id) => {
                    const d = DECK_BY_ID[id];
                    const n = current[id] ?? 0;
                    return (
                      <li key={id} className="border-b-2 border-line/60 py-4">
                        <div className="flex items-start gap-3">
                          <span aria-hidden style={{ ...tileStyle(id), transform: `rotate(${(id.length % 3 - 1) * 4}deg)` }} className="sign mt-0.5 flex h-[3.4rem] w-11 shrink-0 items-end justify-end rounded-md border-[3px] p-1 text-xl leading-none">{id === 'adult' ? '18+' : '?'}</span>
                          <div className="min-w-0 flex-1">
                            <p className="sign text-[1.15rem] leading-tight">{d.name}</p>
                            <p className="text-base text-muted">{d.blurb}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-base font-bold">
                            {d.ready ? <>{formatPrice(d.price)} coins a card<span className="block font-semibold text-muted">{pools[id]} cards in the deck</span></> : <span className="text-muted">Coming soon</span>}
                          </p>
                          {d.ready && <NumberStepper label={`${d.name} cards`} value={n} min={0} max={Math.min(pools[id], 100)} step={5} onChange={(v) => setCount(id, v)} />}
                        </div>
                        {(d.adult || d.includesAdult) && n > 0 && (
                          <button role="switch" aria-checked={adultOk} onClick={() => setAdultOk(!adultOk)}
                            className="mt-3 flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-xl border-2 border-line px-4 text-left">
                            <span className="text-base font-bold">Everyone at the table is 18 or older and agrees to play. Any card can be skipped.</span>
                            <span className={cn('h-8 w-14 shrink-0 rounded-full p-1 transition-colors', adultOk ? 'bg-accent' : 'bg-raised')}>
                              <span className={cn('block h-6 w-6 rounded-full bg-text transition-transform', adultOk && 'translate-x-6 bg-onaccent')} />
                            </span>
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-6 border-t-2 border-line pt-4 text-2xl font-extrabold">{cards} cards for <RollNumber value={total} format={formatPot} /> coins{cards > 0 ? `, ${formatDuration(cards)}` : ''}.</p>

          {owed.length > 0 && (
            <div className="mt-5 rounded-card border-2 border-line p-4">
              <p className="text-lg font-extrabold">Collect in cash</p>
              <p className="mb-2 text-base text-muted">1 coin is P1. Your wallet pays the whole pot, so friends settle with you.</p>
              <ul>{owed.map((o) => <li key={o.userId} className="flex justify-between py-1 text-lg"><span>{nameOf(o.userId)}</span><b>owes you P{formatPot(o.pesos)}</b></li>)}</ul>
            </div>
          )}

          <p className="mt-5 text-lg">You have <b>{formatPot(wallet)} coins</b>.</p>
          {total > wallet && (
            <p className="mt-2 text-lg font-bold text-danger">You are {formatPot(total - wallet)} coins short. <Link href="/shop" className="underline">Add coins</Link></p>
          )}
        </>
      )}

      {key === 'topics' && (
        <>
          <p className="mb-5 text-lg text-muted">Cards about these are left out. Nobody has to explain why.</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map((t) => <Chip key={t} selected={cfg.comfortFilters.includes(t)} onClick={() => toggleTopic(t)}>{t}</Chip>)}
            {customTopics.map((w) => <Chip key={w} selected onClick={() => toggleTopic(w)}>{w}<Icon name="close" size={16} /></Chip>)}
          </div>
          <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); addWord(); }}>
            <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={24} placeholder="Add a word, like ex" aria-label="Custom word" className={input} />
            <Button type="submit" variant="secondary" disabled={!word.trim()}>Add</Button>
          </form>
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

      {key === 'house' && (
        <>
          <section data-mode={accentDeck?.mode} className="rounded-card bg-accent p-5 text-onaccent">
            <div className="display text-5xl">{cards ? basketNames(basket) : 'No cards bought'}</div>
            <div className="mt-1 text-lg font-bold">{cards} cards, {formatDuration(cards)}</div>
          </section>
          <ul className="mt-5 space-y-2 text-lg">
            <li><b>{template?.name ?? 'Classic'}.</b> <span className="text-muted">{template?.summary}</span></li>
            <li><b>Pot:</b> <span className="text-muted">{formatPot(total)} coins for {cards} cards, plus free wild cards</span></li>
            {cfg.nonDrinkingMode && <li><b>Non-drinking mode</b> is on.</li>}
            {cfg.customDrinkRules.map((r, i) => <li key={i}>{r}</li>)}
            {cfg.comfortFilters.length > 0 && <li><b>Skipping:</b> <span className="text-muted">{cfg.comfortFilters.join(', ')}</span></li>}
            <li className="text-muted">Anyone can skip a card. Nobody has to answer. Nobody drives.</li>
          </ul>
          <h3 className="mt-8 text-4xl">Tap your name to agree</h3>
          <p className="mb-3 mt-1 text-base text-muted">The order you tap is the order you play. First tap goes first. Tap again to undo.</p>
          <div className="grid grid-cols-3 gap-3">
            {[...room.players].sort((a, b) => a.turnOrder - b.turnOrder).map((p) => {
              const ok = room.agreedPlayers.includes(p.userId);
              const canTap = isHost || p.userId === profile.id;
              return (
                <button key={p.userId} disabled={!canTap} onClick={() => { haptic('success'); agree(p.userId); }} aria-pressed={ok}
                  className={cn('relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors active:scale-95', ok ? 'border-ok bg-ok/15' : 'border-line', !canTap && 'opacity-50')}>
                  <Avatar value={p.avatarUrl} name={p.displayName} size={56} />
                  {ok && <span className="sign absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ok text-sm text-bg" aria-label={`Plays number ${room.agreedPlayers.indexOf(p.userId) + 1}`}>{room.agreedPlayers.indexOf(p.userId) + 1}</span>}
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
