'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, Button, Chip, Icon, NumberStepper, Screen, SegmentedControl, Splash, Stepper } from '@/components/ui';
import { MIN_POT, MAX_POT, estimateCards, formatPot, isPotValid, potTotal, suggestedPot } from '@/lib/game/pot';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { rooms, type RoomConfig } from '@/lib/data/rooms';
import { allAgreed, startGame } from '@/lib/data/start-game';
import { GAME_MODES } from '@/lib/game/game-modes';
import { PRESET_TOPICS } from '@/lib/game/comfort-filters';
import { PRESET_COUNTS, formatDuration, DRINK_RULE_TEMPLATES, MAX_CUSTOM_RULES } from '@/lib/game/setup-options';
import { useProfileStore } from '@/stores/profile-store';
import { hasSlot, useDeckStore } from '@/stores/deck-store';
import { CURATED_CARDS } from '@/lib/data/cards';
import { PACK_CARDS } from '@/lib/data/shop-catalogue';
import { useShopStore } from '@/stores/shop-store';
import { TextField } from '@/components/ui';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { IntensityBars } from '@/components/library/parts';
import { BROWSABLE } from '@/lib/data/taxonomy';
import type { GameMode } from '@/types/game';

type PotStyle = 'solo' | 'split';

const DECK_GROUPS: { label: string; hint: string; modes: GameMode[] }[] = [
  { label: 'Easy start', hint: 'Good for a first round or a mixed crowd', modes: ['icebreaker', 'family'] },
  { label: 'Your crowd', hint: 'Made for who is at the table', modes: ['barkada', 'lovers'] },
  { label: 'Turn it up', hint: 'Higher heat from the first card', modes: ['spicy', 'chaos'] },
];
/** A real card from the deck's own heaviest intensity, so the preview is honest. */
function sampleLine(k: GameMode): string {
  const w = GAME_MODES[k].poolDistribution;
  const top = Number(Object.keys(w).sort((a, b) => w[Number(b)] - w[Number(a)] || Number(b) - Number(a))[0]);
  const pool = BROWSABLE.filter((c) => c.cardType === 'question' && c.intensity === top);
  return pool.length ? pool[k.length % pool.length].text : '';
}
const poolSize = (k: GameMode) => BROWSABLE.filter((c) => (GAME_MODES[k].poolDistribution[c.intensity] ?? 0) > 0).length;

type StepKey = 'deck' | 'source' | 'length' | 'topics' | 'pot' | 'drinks' | 'house';
const STEPS: StepKey[] = ['deck', 'source', 'length', 'topics', 'pot', 'drinks', 'house'];
const TOTAL = STEPS.length;
const TITLES: Record<StepKey, string> = { deck: 'Pick a deck', source: 'Card source', length: 'How long?', topics: 'Skip these topics', pot: 'Coin pot', drinks: 'Drink rules', house: 'House rules' };

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
  const [sourceMode, setSourceMode] = useState<'auto' | 'decks' | null>(null);
  const [rule, setRule] = useState('');
  const myDecks = useDeckStore((d) => d.decks);
  const ownedPacks = useShopStore((x) => x.owned);
  const starting = useRef(false);

  useEffect(() => {
    if (room && room.hostId === profile?.id && !room.config.drinkRuleTemplate) {
      rooms.update(code, (r) => ({ ...r, config: { ...r.config, drinkRuleTemplate: 'Classic' } }));
    }
  }, [room, profile, code]);

  const suggestKey = room ? `${room.config.gameMode}|${room.config.cardCountTarget}` : '';
  useEffect(() => {
    if (!room || room.hostId !== profile?.id || STEPS[step - 1] !== 'pot' || !room.config.gameMode) return;
    if (!room.config.potCoins) {
      const style = room.config.potStyle ?? 'solo';
      const sug = suggestedPot(room.config.cardCountTarget, room.config.gameMode);
      rooms.update(code, (r) => ({ ...r, config: { ...r.config, potStyle: style, potCoins: style === 'split' ? Math.max(1, Math.ceil(sug / Math.max(1, r.players.length))) : sug } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, suggestKey]);

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
  const mode = cfg.gameMode;
  const template = DRINK_RULE_TEMPLATES.find((t) => t.id === cfg.drinkRuleTemplate);
  const pending = room.players.filter((p) => !room.agreedPlayers.includes(p.userId)).length;
  const customTopics = cfg.comfortFilters.filter((f) => !(PRESET_TOPICS as readonly string[]).includes(f));

  const toggleTopic = (t: string) => set({ comfortFilters: cfg.comfortFilters.includes(t) ? cfg.comfortFilters.filter((x) => x !== t) : [...cfg.comfortFilters, t] });
  const addWord = () => { const w = word.trim(); if (w && !cfg.comfortFilters.includes(w)) set({ comfortFilters: [...cfg.comfortFilters, w] }); setWord(''); };
  const addRule = () => { const r = rule.trim(); if (r && cfg.customDrinkRules.length < MAX_CUSTOM_RULES) set({ customDrinkRules: [...cfg.customDrinkRules, r] }); setRule(''); };
  const start = () => { starting.current = true; if (startGame(room, trashed)) router.push(`/game/${code}/play`); else starting.current = false; };

  const usingDecks = (cfg.deckIds ?? []).length > 0 || sourceMode === 'decks';
  const players = room.players.length;
  const total = potTotal(cfg.potStyle ?? 'solo', cfg.potCoins ?? 0, players);
  const wallet = profile.coins;
  const potOk = isPotValid(total) && wallet + 1e-9 >= total;
  const chosenDecks = myDecks.filter((d) => (cfg.deckIds ?? []).includes(d.id));
  const blocked = key === 'deck' && !mode ? 'Pick a deck to continue' : key === 'source' && usingDecks && chosenDecks.length === 0 ? 'Choose at least one deck' : key === 'pot' && !potOk ? (total > wallet ? 'Not enough coins' : `Pot needs at least ${MIN_POT} coins`) : null;

  const footer = view < TOTAL ? (
    <Button size="lg" full disabled={blocked !== null} onClick={() => setStep(step + 1)}>{blocked ?? 'Next'}</Button>
  ) : isHost ? (
    <Button size="lg" full disabled={!allAgreed(room) || !mode || !potOk} onClick={start}>{!potOk ? 'Fix the coin pot first' : allAgreed(room) ? 'Start game' : `Waiting for ${pending} to agree`}</Button>
  ) : (
    <p className="pb-2 text-center text-lg text-muted">Waiting for the host to start.</p>
  );

  const input = 'h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent';

  return (
    <Screen mode={mode ?? undefined} back={isHost && step > 1 ? undefined : `/game/${code}`} title={TITLES[key]} footer={footer}>
      {isHost && (
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && <button onClick={() => setStep(step - 1)} aria-label="Previous step" className="flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>}
          <div className="flex-1"><Stepper step={step} total={TOTAL} /></div>
        </div>
      )}

      {key === 'deck' && (
        <div className="space-y-7">
          {DECK_GROUPS.map((g) => (
            <section key={g.label}>
              <h3 className="text-3xl">{g.label}</h3>
              <p className="mb-3 mt-1 text-base text-muted">{g.hint}</p>
              <div className="space-y-3">
                {g.modes.map((k) => {
                  const m = GAME_MODES[k];
                  const on = mode === k;
                  const w = [1, 2, 3, 4, 5].map((n) => m.poolDistribution[n] ?? 0);
                  return (
                    <button key={k} data-mode={k} aria-pressed={on} onClick={() => { haptic('tap'); set({ gameMode: k }); }}
                      className={cn('relative block w-full rounded-card bg-accent p-4 text-left text-onaccent transition-transform active:scale-[0.98]', on ? 'ring-4 ring-text ring-offset-4 ring-offset-bg' : '')}>
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-4xl font-extrabold leading-none" style={{ fontStretch: '72%' }}>{m.name}</span>
                          <span className="mt-2 block text-base font-semibold leading-snug">{m.description}</span>
                        </span>
                        {on
                          ? <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-text text-bg"><Icon name="check" size={18} /></span>
                          : <IntensityBars values={w} className="mt-1 shrink-0" label={`Intensity mix of ${m.name}, level 1 to 5`} />}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {[m.audienceTag, `Starts at heat ${m.entryHeat}`, `Wild card about every ${m.wildCardFrequency.base}`, ...(m.maxHeat ? [`Heat stops at ${m.maxHeat}`] : []), `${poolSize(k)} cards`].map((t) => (
                          <span key={t} className="rounded-full border-2 border-current px-2.5 py-0.5 text-sm font-bold">{t}</span>
                        ))}
                      </span>
                      {on && sampleLine(k) && <span className="mt-3 block border-t-2 border-current/30 pt-3 text-lg font-bold leading-snug">Sample: {sampleLine(k)}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {key === 'source' && (
        <>
          <div className="space-y-3">
            <Row selected={!usingDecks} onClick={() => { setSourceMode('auto'); set({ deckIds: [], slotFills: [] }); }}>
              <span className="flex-1"><span className="display block text-3xl">Auto</span><span className="text-base text-muted">The tag.ai library{ownedPacks.length ? ' and your packs' : ''}, picked by heat. {CURATED_CARDS.length + ownedPacks.reduce((n, id) => n + (PACK_CARDS[id]?.length ?? 0), 0)} cards.</span></span>
            </Row>
            <Row selected={usingDecks} onClick={() => { if (myDecks.length) setSourceMode('decks'); }}>
              <span className="flex-1"><span className="display block text-3xl">My decks</span><span className="text-base text-muted">{myDecks.length ? 'Play only the decks you built.' : 'No decks yet. Build one in Library.'}</span></span>
            </Row>
          </div>
          {usingDecks && (
            <>
              <h3 className="mb-2 mt-7 text-3xl">Choose decks</h3>
              <ul>
                {myDecks.map((d) => {
                  const on = (cfg.deckIds ?? []).includes(d.id);
                  return (
                    <li key={d.id}>
                      <button aria-pressed={on} onClick={() => set({ deckIds: on ? cfg.deckIds.filter((x) => x !== d.id) : [...(cfg.deckIds ?? []), d.id] })}
                        className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 border-b-2 border-line/60 py-3 text-left">
                        <span className="min-w-0"><span className="block truncate text-xl font-bold">{d.name}</span><span className="text-base text-muted">{d.cards.length} cards</span></span>
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2', on ? 'border-accent bg-accent text-onaccent' : 'border-line')}>{on && <Icon name="check" size={16} />}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-lg"><b>{chosenDecks.reduce((n, d) => n + d.cards.length, 0)} cards</b> in your pick.{chosenDecks.reduce((n, d) => n + d.cards.length, 0) < 20 && ' A small pool makes a shorter game.'}</p>
              {chosenDecks.some((d) => d.cards.some((c) => hasSlot(c.text))) && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-3xl">Fill in the blanks</h3>
                  <p className="text-base text-muted">Some cards have a blank. Add a few words from your group. Leave empty to skip those cards.</p>
                  {['A name', 'A place', 'A memory'].map((l, i) => (
                    <TextField key={l} label={l} maxLength={24} value={cfg.slotFills?.[i] ?? ''}
                      onChange={(e) => { const f = [...(cfg.slotFills ?? ['', '', ''])]; while (f.length < 3) f.push(''); f[i] = e.target.value; set({ slotFills: f }); }} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {key === 'length' && (
        <div className="space-y-3">
          {PRESET_COUNTS.map((n) => (
            <Row key={n} selected={cfg.cardCountTarget === n} onClick={() => set({ cardCountTarget: n })}>
              <span className="flex-1"><span className="display text-4xl">{n} cards</span><span className="ml-3 text-muted">{formatDuration(n)}</span></span>
            </Row>
          ))}
        </div>
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

      {key === 'pot' && mode && (
        <>
          <p className="mb-5 text-lg text-muted">Each card uses a little from the pot. Wild cards are free. Whatever is left comes back to you when the game ends.</p>
          <SegmentedControl<PotStyle> label="Who pays" value={cfg.potStyle ?? 'solo'} onChange={(v) => set({ potStyle: v })}
            options={[{ id: 'solo', label: 'I pay it all' }, { id: 'split', label: 'Split it' }]} />
          <div className="mt-7 flex items-center justify-between gap-3">
            <div>
              <p className="text-xl font-bold">{cfg.potStyle === 'split' ? 'Coins per player' : 'Coins in the pot'}</p>
              {cfg.potStyle === 'split' && <p className="text-base text-muted">{players} players, {total} coins in all</p>}
            </div>
            <NumberStepper label="coins" value={cfg.potCoins ?? 0} min={cfg.potStyle === 'split' ? 1 : MIN_POT} max={cfg.potStyle === 'split' ? 50 : MAX_POT} onChange={(v) => set({ potCoins: v })} />
          </div>
          <p className="mt-5 border-t-2 border-line pt-4 text-2xl font-extrabold">{formatPot(total)} coins is about {estimateCards(total, mode)} cards.</p>
          {estimateCards(total, mode) < cfg.cardCountTarget && (
            <p className="mt-1 text-base text-muted">You chose {cfg.cardCountTarget} cards. You can top up from the pause menu during the game.</p>
          )}
          <p className="mt-5 text-lg">You have <b>{wallet} coins</b>.{cfg.potStyle === 'split' && ' Guests pay you in cash, your wallet covers the pot.'}</p>
          {total > wallet && (
            <p className="mt-2 text-lg font-bold text-danger">You are {formatPot(total - wallet)} coins short. <Link href="/shop" className="underline">Add coins</Link></p>
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

      {key === 'house' && (
        <>
          <section data-mode={mode ?? undefined} className="rounded-card bg-accent p-5 text-onaccent">
            <div className="display text-5xl">{mode ? GAME_MODES[mode].name : 'No deck picked'}</div>
            <div className="mt-1 text-lg font-bold">{cfg.cardCountTarget} cards, {formatDuration(cfg.cardCountTarget)}</div>
          </section>
          <ul className="mt-5 space-y-2 text-lg">
            <li><b>{template?.name ?? 'Classic'}.</b> <span className="text-muted">{template?.summary}</span></li>
            <li><b>Pot:</b> <span className="text-muted">{formatPot(total)} coins, about {mode ? estimateCards(total, mode) : 0} cards</span></li>
            {cfg.nonDrinkingMode && <li><b>Non-drinking mode</b> is on.</li>}
            {cfg.customDrinkRules.map((r, i) => <li key={i}>{r}</li>)}
            {cfg.comfortFilters.length > 0 && <li><b>Skipping:</b> <span className="text-muted">{cfg.comfortFilters.join(', ')}</span></li>}
            <li className="text-muted">Anyone can skip a card. Nobody has to answer. Nobody drives.</li>
          </ul>
          <h3 className="mb-3 mt-8 text-4xl">Tap your name to agree</h3>
          <div className="grid grid-cols-3 gap-3">
            {[...room.players].sort((a, b) => a.turnOrder - b.turnOrder).map((p) => {
              const ok = room.agreedPlayers.includes(p.userId);
              const canTap = isHost || p.userId === profile.id;
              return (
                <button key={p.userId} disabled={!canTap} onClick={() => { haptic('success'); agree(p.userId); }} aria-pressed={ok}
                  className={cn('relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors active:scale-95', ok ? 'border-ok bg-ok/15' : 'border-line', !canTap && 'opacity-50')}>
                  <Avatar value={p.avatarUrl} name={p.displayName} size={56} />
                  {ok && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ok text-bg"><Icon name="check" size={14} /></span>}
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
