'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, Button, Chip, Icon, Screen, Splash, Stepper } from '@/components/ui';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { rooms, type RoomConfig } from '@/lib/data/rooms';
import { allAgreed, startGame } from '@/lib/data/start-game';
import { GAME_MODES } from '@/lib/game/game-modes';
import { PRESET_TOPICS } from '@/lib/game/comfort-filters';
import { PRESET_COUNTS, formatDuration, DRINK_RULE_TEMPLATES, MAX_CUSTOM_RULES } from '@/lib/game/setup-options';
import { useProfileStore } from '@/stores/profile-store';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import type { GameMode } from '@/types/game';

const MODE_KEYS: GameMode[] = ['icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family'];
const TOTAL = 5;
const TITLES = ['', 'Pick a deck', 'How long?', 'Skip these topics', 'Drink rules', 'House rules'];

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
  const starting = useRef(false);

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
  const mode = cfg.gameMode;
  const template = DRINK_RULE_TEMPLATES.find((t) => t.id === cfg.drinkRuleTemplate);
  const pending = room.players.filter((p) => !room.agreedPlayers.includes(p.userId)).length;
  const customTopics = cfg.comfortFilters.filter((f) => !(PRESET_TOPICS as readonly string[]).includes(f));

  const toggleTopic = (t: string) => set({ comfortFilters: cfg.comfortFilters.includes(t) ? cfg.comfortFilters.filter((x) => x !== t) : [...cfg.comfortFilters, t] });
  const addWord = () => { const w = word.trim(); if (w && !cfg.comfortFilters.includes(w)) set({ comfortFilters: [...cfg.comfortFilters, w] }); setWord(''); };
  const addRule = () => { const r = rule.trim(); if (r && cfg.customDrinkRules.length < MAX_CUSTOM_RULES) set({ customDrinkRules: [...cfg.customDrinkRules, r] }); setRule(''); };
  const start = () => { starting.current = true; if (startGame(room, trashed)) router.push(`/game/${code}/play`); else starting.current = false; };

  const footer = view < TOTAL ? (
    <Button size="lg" full disabled={view === 1 && !mode} onClick={() => setStep(step + 1)}>{view === 1 && !mode ? 'Pick a deck to continue' : 'Next'}</Button>
  ) : isHost ? (
    <Button size="lg" full disabled={!allAgreed(room) || !mode} onClick={start}>{allAgreed(room) ? 'Start game' : `Waiting for ${pending} to agree`}</Button>
  ) : (
    <p className="pb-2 text-center text-lg text-muted">Waiting for the host to start.</p>
  );

  const input = 'h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg placeholder:text-muted/60 focus:border-accent';

  return (
    <Screen mode={mode ?? undefined} back={isHost && step > 1 ? undefined : `/game/${code}`} title={TITLES[view]} footer={footer}>
      {isHost && (
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && <button onClick={() => setStep(step - 1)} aria-label="Previous step" className="flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>}
          <div className="flex-1"><Stepper step={step} total={TOTAL} /></div>
        </div>
      )}

      {view === 1 && (
        <div className="grid grid-cols-2 gap-3">
          {MODE_KEYS.map((k) => {
            const m = GAME_MODES[k];
            const on = mode === k;
            return (
              <button key={k} data-mode={k} aria-pressed={on} onClick={() => { haptic('tap'); set({ gameMode: k }); }}
                className={cn('relative flex min-h-[10.5rem] flex-col justify-between rounded-card bg-accent p-4 text-left text-onaccent transition-transform active:scale-[0.97]',
                  on ? 'ring-4 ring-text ring-offset-4 ring-offset-bg' : '')}>
                <span className="text-4xl font-extrabold" style={{ fontStretch: '72%' }}>{m.name}</span>
                <span className="text-base font-semibold leading-snug">{m.description}</span>
                {on && <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-text text-bg"><Icon name="check" size={18} /></span>}
              </button>
            );
          })}
        </div>
      )}

      {view === 2 && (
        <div className="space-y-3">
          {PRESET_COUNTS.map((n) => (
            <Row key={n} selected={cfg.cardCountTarget === n} onClick={() => set({ cardCountTarget: n })}>
              <span className="flex-1"><span className="display text-4xl">{n} cards</span><span className="ml-3 text-muted">{formatDuration(n)}</span></span>
            </Row>
          ))}
        </div>
      )}

      {view === 3 && (
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

      {view === 4 && (
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

      {view === 5 && (
        <>
          <section data-mode={mode ?? undefined} className="rounded-card bg-accent p-5 text-onaccent">
            <div className="display text-5xl">{mode ? GAME_MODES[mode].name : 'No deck picked'}</div>
            <div className="mt-1 text-lg font-bold">{cfg.cardCountTarget} cards, {formatDuration(cfg.cardCountTarget)}</div>
          </section>
          <ul className="mt-5 space-y-2 text-lg">
            <li><b>{template?.name ?? 'Classic'}.</b> <span className="text-muted">{template?.summary}</span></li>
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
