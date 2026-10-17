'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ToolStage } from '@/components/play/ToolStage';
import { formatOf, type TalkTopic } from '@/lib/data/talk-topics';
import { minorityNames, splitVerdict, type TalkPick, type TalkTally } from '@/lib/game/talk';
import { useTalkStore } from '@/stores/talk-store';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

const Btn = ({ onClick, children, ghost }: { onClick: () => void; children: React.ReactNode; ghost?: boolean }) => (
  <button onClick={() => { haptic('tap'); onClick(); }} className={cn('min-h-tap w-full rounded-xl px-4 text-lg font-extrabold active:translate-y-px', ghost ? 'border-[3px] border-current' : 'bg-onaccent text-accent')}>{children}</button>
);

type Stage = { kind: 'vote' | 'timer' | 'bottle'; seconds?: number; endWord?: string; endText?: string; then?: () => void } | null;

/** Two counters the table taps to match what everyone chose, with a bar showing the split. */
function Tally({ topic, labels, tally }: { topic: TalkTopic; labels: [string, string]; tally: TalkTally }) {
  const record = useTalkStore((s) => s.record);
  const set = (a: number, b: number) => { haptic('tap'); record(topic.id, { a: Math.max(0, Math.min(30, a)), b: Math.max(0, Math.min(30, b)) }); };
  const total = tally.a + tally.b;
  const col = (side: 'a' | 'b', label: string) => (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-xl border-[3px] border-current px-2 py-2">
      <span className="w-full truncate text-center text-base font-extrabold">{label}</span>
      <span className="display text-5xl leading-none tabular-nums" aria-live="polite">{tally[side]}</span>
      <span className="mt-1 flex gap-2">
        <button aria-label={`One less ${label}`} onClick={() => set(side === 'a' ? tally.a - 1 : tally.a, side === 'b' ? tally.b - 1 : tally.b)} className="h-11 w-11 rounded-lg bg-onaccent text-2xl font-extrabold text-accent">-</button>
        <button aria-label={`One more ${label}`} onClick={() => set(side === 'a' ? tally.a + 1 : tally.a, side === 'b' ? tally.b + 1 : tally.b)} className="h-11 w-11 rounded-lg bg-onaccent text-2xl font-extrabold text-accent">+</button>
      </span>
    </div>
  );
  return (
    <div>
      <div className="flex gap-3">{col('a', labels[0])}{col('b', labels[1])}</div>
      <div aria-hidden className="mt-3 flex h-3 overflow-hidden rounded-full bg-onaccent/25">
        <motion.span className="bg-onaccent" animate={{ width: total ? `${(tally.a / total) * 100}%` : '50%' }} transition={{ type: 'spring', stiffness: 220, damping: 24 }} />
      </div>
    </div>
  );
}

/** With names on: tap a name to set that player's answer. Tap again to switch, and once more to clear. */
function NameTally({ topic, labels, players, picks }: { topic: TalkTopic; labels: [string, string]; players: string[]; picks: Record<string, TalkPick> }) {
  const setPick = useTalkStore((s) => s.setPick);
  const tap = (name: string) => { haptic('tap'); const cur = picks[name]; setPick(topic.id, name, !cur ? 'a' : cur === 'a' ? 'b' : null); };
  const tally = { a: Object.values(picks).filter((v) => v === 'a').length, b: Object.values(picks).filter((v) => v === 'b').length };
  const total = tally.a + tally.b;
  const short = (i: 0 | 1) => (topic.format === 'ab' ? (i ? 'B' : 'A') : labels[i]);
  return (
    <div>
      <p className="mb-2 text-base font-bold opacity-80">Tap a name to set its answer: {short(0)}, then {short(1)}, then clear.</p>
      <div className="flex flex-wrap gap-2">
        {players.map((n) => {
          const v = picks[n];
          return (
            <button key={n} onClick={() => tap(n)} aria-label={`${n}: ${v ? short(v === 'a' ? 0 : 1) : 'no answer yet'}`}
              className={cn('min-h-tap rounded-xl border-[3px] border-current px-3 text-base font-extrabold', v === 'a' && 'bg-onaccent text-accent', v === 'b' && 'bg-onaccent/25')}>
              {n}{v ? `: ${short(v === 'a' ? 0 : 1)}` : ''}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-lg font-extrabold"><span>{labels[0]} {tally.a}</span><span>{labels[1]} {tally.b}</span></div>
      <div aria-hidden className="mt-1 flex h-3 overflow-hidden rounded-full bg-onaccent/25">
        <motion.span className="bg-onaccent" animate={{ width: total ? `${(tally.a / total) * 100}%` : '50%' }} transition={{ type: 'spring', stiffness: 220, damping: 24 }} />
      </div>
    </div>
  );
}

/** What the table does with a topic, by format: count and argue, think, or tell a story. */
export function TopicPanel({ topic, speaker }: { topic: TalkTopic; speaker?: string }) {
  const format = formatOf(topic);
  const tally = useTalkStore((s) => s.results?.[topic.id]);
  const record = useTalkStore((s) => s.record);
  const players = useTalkStore((s) => s.players ?? []);
  const picks = useTalkStore((s) => s.picks?.[topic.id]) ?? {};
  const named = players.length >= 2;
  const [stage, setStage] = useState<Stage>(null);
  const [deeper, setDeeper] = useState(false);
  const labels: [string, string] = format === 'ab' ? [topic.a ?? 'A', topic.b ?? 'B'] : ['Agree', 'Disagree'];
  const verdict = tally ? splitVerdict(tally, labels[0], labels[1]) : null;

  const open = (s: NonNullable<Stage>) => setStage(s);
  const close = () => { stage?.then?.(); setStage(null); };

  return (
    <div className="mt-5 space-y-3">
      {(format === 'agree' || format === 'ab') && (!tally
        ? <Btn onClick={() => open({ kind: 'vote', seconds: 3, endWord: 'Now', endText: format === 'agree' ? 'Everyone shows thumbs up to agree or thumbs down to disagree, all at once.' : `Everyone says A or B out loud, all at once. A is ${labels[0]}. B is ${labels[1]}.`, then: () => record(topic.id, { a: 0, b: 0 }) })}>Count down and choose</Btn>
        : (
          <>
            {named ? <NameTally topic={topic} labels={labels} players={players} picks={picks} /> : <Tally topic={topic} labels={labels} tally={tally} />}
            <p className="text-balance text-lg font-extrabold leading-snug">{verdict!.text}{named && minorityNames(picks).length > 0 ? ` ${minorityNames(picks).join(', ')} argue${minorityNames(picks).length === 1 ? 's' : ''}.` : ''}</p>
            {verdict!.minority && <Btn ghost onClick={() => open({ kind: 'timer', seconds: 30 })}>Start the 30 second argument</Btn>}
          </>
        ))}
      {format === 'think' && (
        <>
          {speaker && <p className="text-lg font-extrabold">{speaker} answers first.</p>}
          <Btn onClick={() => open({ kind: 'timer', seconds: 60 })}>Think for 60 seconds</Btn>
        </>
      )}
      {format === 'story' && (
        <>
          {speaker && <p className="text-lg font-extrabold">{speaker} tells this one.</p>}
          <div className="grid grid-cols-2 gap-3">
            <Btn onClick={() => open({ kind: 'bottle' })}>{speaker ? 'Someone else' : 'Who tells it'}</Btn>
            <Btn ghost onClick={() => open({ kind: 'timer', seconds: 60 })}>60 seconds</Btn>
          </div>
        </>
      )}
      {topic.deeper && (deeper
        ? <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border-[3px] border-current px-4 py-3 text-xl font-extrabold leading-snug">{topic.deeper}</motion.p>
        : <button onClick={() => { haptic('tap'); setDeeper(true); }} className="min-h-tap text-lg font-extrabold underline underline-offset-4">Go deeper</button>)}
      {stage && <ToolStage kind={stage.kind} tint={topic.group} prompt={topic.text} seconds={stage.seconds} endWord={stage.endWord} endText={stage.endText} nonDrinking onResult={() => {}} onClose={close} />}
    </div>
  );
}
