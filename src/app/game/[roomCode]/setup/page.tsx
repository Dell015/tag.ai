'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, Button, Chip, Screen, Stepper } from '@/components/ui';
import { Splash } from '@/components/ui/Splash';
import { useRoom } from '@/hooks/use-room';
import { useRequireProfile } from '@/lib/use-profile';
import { rooms, type RoomConfig } from '@/lib/data/rooms';
import { allAgreed, startGame } from '@/lib/data/start-game';
import { GAME_MODES } from '@/lib/game/game-modes';
import { PRESET_TOPICS } from '@/lib/game/comfort-filters';
import { PRESET_COUNTS, formatDuration } from '@/components/setup/CardCountSelector';
import { DRINK_RULE_TEMPLATES, MAX_CUSTOM_RULES } from '@/components/setup/DrinkRules';
import { useProfileStore } from '@/stores/profile-store';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import type { GameMode } from '@/types/game';

const MODE_KEYS: GameMode[] = ['icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family'];
const TOTAL = 5;

function Card({ selected, onClick, children }: { selected?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-pressed={selected}
      onClick={() => { haptic('tap'); onClick(); }}
      className={cn('w-full rounded-card p-4 text-left transition active:scale-[0.98]',
        selected ? 'bg-elevated ring-2 ring-accent shadow-glow' : 'bg-surface ring-1 ring-white/10')}
    >
      {children}
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

  // Default drink rule so the summary is never empty.
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
    rooms.update(code, (r) => ({
      ...r,
      agreedPlayers: r.agreedPlayers.includes(userId) ? r.agreedPlayers.filter((i) => i !== userId) : [...r.agreedPlayers, userId],
    }));

  // Non-hosts only see the house-rules screen.
  const view = isHost ? step : TOTAL;
  const mode = cfg.gameMode;
  const canNext = view === 1 ? !!mode : true;
  const template = DRINK_RULE_TEMPLATES.find((t) => t.id === cfg.drinkRuleTemplate);

  const toggleTopic = (t: string) =>
    set({ comfortFilters: cfg.comfortFilters.includes(t) ? cfg.comfortFilters.filter((x) => x !== t) : [...cfg.comfortFilters, t] });
  const addWord = () => {
    const w = word.trim();
    if (w && !cfg.comfortFilters.includes(w)) set({ comfortFilters: [...cfg.comfortFilters, w] });
    setWord('');
  };
  const addRule = () => {
    const r = rule.trim();
    if (r && cfg.customDrinkRules.length < MAX_CUSTOM_RULES) set({ customDrinkRules: [...cfg.customDrinkRules, r] });
    setRule('');
  };

  const start = () => {
    starting.current = true;
    if (startGame(room, trashed)) router.push(`/game/${code}/play`);
    else starting.current = false;
  };

  const footer = view < TOTAL ? (
    <Button size="lg" full disabled={!canNext} onClick={() => setStep(step + 1)}>{view === 1 && !mode ? 'Pick a vibe' : 'Next'}</Button>
  ) : isHost ? (
    <Button size="lg" full disabled={!allAgreed(room) || !mode} onClick={start}>
      {allAgreed(room) ? 'Start game 🍻' : `Waiting for ${room.players.filter((p) => !room.agreedPlayers.includes(p.userId)).length} to agree`}
    </Button>
  ) : (
    <p className="pb-2 text-center text-lg text-muted">Waiting for the host to start…</p>
  );

  return (
    <Screen
      mode={mode ?? undefined}
      back={isHost && step > 1 ? undefined : `/game/${code}`}
      title={['', 'Pick the vibe', 'How long?', 'Off-limits topics', 'Drink rules', 'House rules'][view]}
      footer={footer}
    >
      {isHost && (
        <div className="mb-5 flex items-center gap-3">
          {step > 1 && <button onClick={() => setStep(step - 1)} aria-label="Previous step" className="h-tap w-tap shrink-0 rounded-2xl bg-surface text-2xl">←</button>}
          <div className="flex-1"><Stepper step={step} total={TOTAL} /></div>
        </div>
      )}

      {view === 1 && (
        <div className="grid grid-cols-2 gap-3">
          {MODE_KEYS.map((k) => {
            const m = GAME_MODES[k];
            return (
              <div key={k} data-mode={k}>
                <Card selected={mode === k} onClick={() => set({ gameMode: k })}>
                  <div className="text-4xl">{m.emoji}</div>
                  <div className="mt-2 font-display text-xl font-extrabold">{m.name}</div>
                  <div className="text-sm text-muted">{m.description}</div>
                  <div className="mt-2 inline-block rounded-full bg-accent-gradient px-2.5 py-0.5 text-xs font-bold text-white">{m.audienceTag}</div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {view === 2 && (
        <div className="space-y-3">
          {PRESET_COUNTS.map((n) => (
            <Card key={n} selected={cfg.cardCountTarget === n} onClick={() => set({ cardCountTarget: n })}>
              <div className="flex items-baseline justify-between"><span className="font-display text-3xl font-extrabold">{n} cards</span><span className="text-muted">{formatDuration(n)}</span></div>
            </Card>
          ))}
        </div>
      )}

      {view === 3 && (
        <>
          <p className="mb-4 text-lg text-muted">Cards touching these get left out. Nobody needs to explain.</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map((t) => <Chip key={t} selected={cfg.comfortFilters.includes(t)} onClick={() => toggleTopic(t)}>{t}</Chip>)}
            {cfg.comfortFilters.filter((f) => !(PRESET_TOPICS as readonly string[]).includes(f)).map((w) => (
              <Chip key={w} selected onClick={() => toggleTopic(w)}>{w} ✕</Chip>
            ))}
          </div>
          <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); addWord(); }}>
            <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={24} placeholder="Add your own word (e.g. ex)" aria-label="Custom word"
              className="h-tap min-w-0 flex-1 rounded-2xl bg-surface px-4 text-lg ring-1 ring-white/10 placeholder:text-muted/60" />
            <Button type="submit" variant="secondary" disabled={!word.trim()}>Add</Button>
          </form>
        </>
      )}

      {view === 4 && (
        <>
          <div className="space-y-3">
            {DRINK_RULE_TEMPLATES.map((t) => (
              <Card key={t.id} selected={cfg.drinkRuleTemplate === t.id} onClick={() => set({ drinkRuleTemplate: t.id })}>
                <div className="flex items-center gap-3"><span className="text-3xl">{t.emoji}</span><div><div className="text-xl font-extrabold">{t.name}</div><div className="text-sm text-muted">{t.summary}</div></div></div>
              </Card>
            ))}
          </div>
          <button onClick={() => set({ nonDrinkingMode: !cfg.nonDrinkingMode })} aria-pressed={cfg.nonDrinkingMode}
            className="mt-4 flex min-h-[4.5rem] w-full items-center justify-between rounded-card bg-surface px-4 text-left ring-1 ring-white/10">
            <span><span className="block text-lg font-bold">🧃 Non-drinking mode</span><span className="text-sm text-muted">Dares and forfeits instead of drinks</span></span>
            <span className={cn('h-8 w-14 shrink-0 rounded-full p-1 transition', cfg.nonDrinkingMode ? 'bg-accent' : 'bg-white/15')}>
              <span className={cn('block h-6 w-6 rounded-full bg-white transition', cfg.nonDrinkingMode && 'translate-x-6')} />
            </span>
          </button>
          <h3 className="mb-2 mt-6 text-lg font-bold">Your own rules <span className="text-muted">({cfg.customDrinkRules.length}/{MAX_CUSTOM_RULES})</span></h3>
          <ul className="space-y-2">
            {cfg.customDrinkRules.map((r, i) => (
              <li key={i} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-2 ring-1 ring-white/10"><span>{r}</span>
                <button aria-label="Remove rule" className="h-tap w-tap text-muted" onClick={() => set({ customDrinkRules: cfg.customDrinkRules.filter((_, j) => j !== i) })}>✕</button></li>
            ))}
          </ul>
          {cfg.customDrinkRules.length < MAX_CUSTOM_RULES && (
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addRule(); }}>
              <input value={rule} onChange={(e) => setRule(e.target.value)} maxLength={80} placeholder="e.g. Last to touch nose drinks" aria-label="Custom rule"
                className="h-tap min-w-0 flex-1 rounded-2xl bg-surface px-4 text-lg ring-1 ring-white/10 placeholder:text-muted/60" />
              <Button type="submit" variant="secondary" disabled={!rule.trim()}>Add</Button>
            </form>
          )}
        </>
      )}

      {view === 5 && (
        <>
          <section className="rounded-card bg-surface p-5 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{mode ? GAME_MODES[mode].emoji : '❔'}</span>
              <div><div className="font-display text-2xl font-extrabold">{mode ? GAME_MODES[mode].name : 'No vibe picked yet'}</div>
                <div className="text-muted">{cfg.cardCountTarget} cards · {formatDuration(cfg.cardCountTarget)}</div></div>
            </div>
            <ul className="mt-4 space-y-2 text-base">
              <li>{template?.emoji} <b>{template?.name ?? 'Classic'}:</b> <span className="text-muted">{template?.summary}</span></li>
              {cfg.nonDrinkingMode && <li>🧃 Non-drinking mode on</li>}
              {cfg.customDrinkRules.map((r, i) => <li key={i}>📌 {r}</li>)}
              {cfg.comfortFilters.length > 0 && <li>🚫 Skipping: <span className="text-muted">{cfg.comfortFilters.join(', ')}</span></li>}
              <li>🙋 Anyone can skip a card. Nobody has to answer anything.</li>
              <li>🚕 Drink responsibly. Nobody drives.</li>
            </ul>
          </section>
          <h3 className="mb-3 mt-6 text-xl font-extrabold">Tap your face to agree</h3>
          <div className="grid grid-cols-3 gap-3">
            {[...room.players].sort((a, b) => a.turnOrder - b.turnOrder).map((p) => {
              const ok = room.agreedPlayers.includes(p.userId);
              const canTap = isHost ? true : p.userId === profile.id;
              return (
                <button key={p.userId} disabled={!canTap} onClick={() => { haptic('success'); agree(p.userId); }} aria-pressed={ok}
                  className={cn('flex flex-col items-center gap-1 rounded-card p-3 transition active:scale-95', ok ? 'bg-ok/15 ring-2 ring-ok' : 'bg-surface ring-1 ring-white/10', !canTap && 'opacity-60')}>
                  <span className="relative"><Avatar value={p.avatarUrl} size={56} />{ok && <span className="absolute -bottom-1 -right-1 rounded-full bg-ok px-1.5 text-sm text-black">✓</span>}</span>
                  <span className="w-full truncate text-center text-sm font-bold">{p.displayName}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Screen>
  );
}
