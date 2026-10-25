'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCountdown } from './ToolsSheet';
import { KIND_META, fillDrink, type CardKind } from '@/lib/game/card-kinds';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

/** What a tool hands back to its card when it finishes. `text` is the line the card keeps on show. */
export interface ToolResult { label?: string; text: string }

const pick = (n: number) => Math.floor(Math.random() * n);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

interface StageProps {
  kind: Exclude<CardKind, 'truth' | 'dare' | 'rule'>;
  prompt: string;
  dice?: 1 | 2; outcomes?: string[]; labels?: string[]; seconds?: number;
  nonDrinking: boolean;
  /** Topic deck: the topic group's colour instead of the card type's. */
  tint?: string;
  /** Vote countdown: the word and the line shown when it hits zero. */
  endWord?: string; endText?: string;
  onResult: (r: ToolResult) => void;
  onClose: () => void;
}

const Shadow = ({ lift }: { lift: number[] }) => (
  <motion.span aria-hidden className="mt-3 block h-4 w-32 rounded-full bg-onaccent/30 blur-sm" animate={{ scaleX: lift, opacity: [0.2, 0.6, 0.3, 0.6, 0.4, 0.6] }} transition={{ duration: 1.8, ease: 'easeOut' }} />
);

/** Big finish: the result line, then buttons. */
function Footer({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 pb-2">{children}</div>;
}
const Btn = ({ onClick, children, ghost }: { onClick: () => void; children: React.ReactNode; ghost?: boolean }) => (
  <button onClick={onClick} className={cn('min-h-[3.5rem] w-full rounded-xl px-5 text-xl font-extrabold active:translate-y-px', ghost ? 'border-[3px] border-current' : 'bg-onaccent text-accent')}>{children}</button>
);
const Said = ({ children }: { children: React.ReactNode }) => (
  <motion.p initial={{ opacity: 0, y: 16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }}
    className="display mt-6 text-balance text-center text-[2.4rem] leading-[1.02]" role="status">{children}</motion.p>
);

// ─── Dice ────────────────────────────────────────────────────────────────────

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function Die({ v, landed, offset }: { v: number; landed: boolean; offset: number }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div initial={{ y: -420, x: offset * 2, rotate: -90, opacity: 0 }}
        animate={{ y: [-420, 0, -150, 0, -50, 0, -14, 0], x: [offset * 2, offset, -offset / 2, offset / 3, 0, 0, 0, 0], rotate: [-90, 180, 330, 480, 600, 690, 720, 720], opacity: 1 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}>
        <motion.span animate={landed ? { scale: [1, 1.18, 0.94, 1] } : {}} transition={{ duration: 0.4 }}
          className="grid h-32 w-32 grid-cols-3 grid-rows-3 rounded-[1.7rem] bg-onaccent p-4 shadow-[0_8px_0_rgb(0_0_0/0.25)]" aria-label={`Die showing ${v}`} role="img">
          {Array.from({ length: 9 }, (_, i) => <span key={i} className={cn('m-auto h-5 w-5 rounded-full', PIPS[v].includes(i) ? 'bg-accent' : 'bg-transparent')} />)}
        </motion.span>
      </motion.div>
      <Shadow lift={[0.4, 1, 0.55, 1, 0.8, 1]} />
    </div>
  );
}

function DiceStage({ dice = 1, outcomes, nonDrinking, onResult, onClose }: StageProps) {
  const count = dice;
  const [faces, setFaces] = useState<number[]>(() => Array.from({ length: count }, () => 1 + pick(6)));
  const [landed, setLanded] = useState<ToolResult | null>(null);
  const reduced = useReducedMotion();
  const done = useRef(false);
  const roll = useRef<() => void>(() => {});
  roll.current = () => {
    done.current = false; setLanded(null);
    const final = Array.from({ length: count }, () => 1 + pick(6));
    const steps = reduced ? 3 : 11;
    let k = 0; let delay = 55;
    const tick = () => {
      if (done.current) return;
      k += 1;
      if (k >= steps) {
        setFaces(final); haptic('success');
        const total = final.reduce((a, b) => a + b, 0);
        const r: ToolResult = count === 1
          ? { label: String(final[0]), text: outcomes?.[final[0] - 1] ? cap(fillDrink(outcomes[final[0] - 1], nonDrinking)) : `You rolled ${final[0]}` }
          : { label: String(total), text: `${final[0]} and ${final[1]}. Total ${total}` };
        setLanded(r); onResult(r); return;
      }
      setFaces(Array.from({ length: count }, () => 1 + pick(6))); haptic('tap'); delay *= 1.2; setTimeout(tick, delay);
    };
    setTimeout(tick, delay);
  };
  // Always roll on mount. Strict mode runs effect, cleanup, effect again; a once-only guard left the die stopped after the cleanup.
  useEffect(() => { roll.current(); return () => { done.current = true; }; }, []);
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex items-end gap-6">{faces.map((v, i) => <Die key={i} v={v} landed={!!landed} offset={count === 2 ? (i ? 50 : -50) : 0} />)}</div>
        {landed ? <Said>{landed.text}</Said> : <p className="mt-6 text-xl font-bold opacity-80">Rolling</p>}
      </div>
      <Footer>{landed && <><Btn onClick={onClose}>Done</Btn></>}</Footer>
    </>
  );
}

// ─── Coin ────────────────────────────────────────────────────────────────────

function CoinStage({ outcomes, nonDrinking, onResult, onClose }: StageProps) {
  const [side] = useState<0 | 1>(() => (Math.random() < 0.5 ? 0 : 1));
  const [landed, setLanded] = useState<ToolResult | null>(null);
  const reduced = useReducedMotion();
  const dur = reduced ? 0.4 : 1.8;
  useEffect(() => {
    const ticks = [0.15, 0.4, 0.62, 0.8].map((f) => setTimeout(() => haptic('tap'), f * dur * 1000));
    const t = setTimeout(() => {
      haptic('success');
      const r: ToolResult = { label: side === 0 ? 'Heads' : 'Tails', text: outcomes?.[side] ? cap(fillDrink(outcomes[side], nonDrinking)) : side === 0 ? 'Heads' : 'Tails' };
      setLanded(r); onResult(r);
    }, dur * 1000 + 100);
    return () => { ticks.forEach(clearTimeout); clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const face = 'absolute inset-0 flex flex-col items-center justify-center rounded-full border-[10px] border-onaccent bg-accent text-onaccent [backface-visibility:hidden]';
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div style={{ perspective: 900 }}>
          <motion.div initial={{ y: 0, rotateX: 0 }} animate={{ y: [0, -210, 0, -30, 0], rotateX: 360 * 6 + (side === 1 ? 180 : 0) }}
            transition={{ duration: dur, ease: 'easeOut', y: { duration: dur, times: [0, 0.4, 0.8, 0.9, 1], ease: 'easeOut' } }}
            style={{ transformStyle: 'preserve-3d' }} className="relative h-44 w-44">
            <span className={cn(face, 'outline outline-[6px] -outline-offset-[22px] outline-onaccent/40')}><span className="display text-[4.5rem] leading-none">H</span><span className="sign text-sm">Heads</span></span>
            <span className={cn(face, 'outline outline-[6px] -outline-offset-[22px] outline-onaccent/40')} style={{ transform: 'rotateX(180deg)' }}><span className="display text-[4.5rem] leading-none">T</span><span className="sign text-sm">Tails</span></span>
          </motion.div>
        </div>
        <Shadow lift={[0.5, 0.35, 1, 0.8, 1]} />
        {landed ? <Said>{landed.text}</Said> : <p className="mt-6 text-xl font-bold opacity-80">Flipping</p>}
      </div>
      <Footer>{landed && <Btn onClick={onClose}>Done</Btn>}</Footer>
    </>
  );
}

// ─── Bottle ──────────────────────────────────────────────────────────────────

/** A real bottle, neck up. It stops anywhere in 360 degrees, so the table sees who it points at. */
function BottleStage({ onClose }: StageProps) {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const reduced = useReducedMotion();
  const live = useRef(true);
  const spin = () => {
    const turns = 4 + Math.random() * 3;
    const ms = reduced ? 600 : 3800 + Math.random() * 1200;
    setAngle((a) => a + 360 * turns + Math.random() * 360);
    setSpinning(true);
    let at = 0; let gap = 90;
    const tick = () => { if (!live.current) return; at += gap; if (at < ms) { haptic('tap'); gap *= 1.12; setTimeout(tick, gap); } };
    setTimeout(tick, gap);
    setTimeout(() => { if (live.current) { setSpinning(false); haptic('success'); } }, ms);
    spinMs.current = ms;
  };
  const spinMs = useRef(4000);
  const first = useRef(true);
  useEffect(() => { live.current = true; if (first.current) { first.current = false; setTimeout(spin, 350); } return () => { live.current = false; }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const started = angle !== 0;
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative flex h-[22rem] w-[22rem] max-w-full items-center justify-center">
          <span aria-hidden className="absolute inset-3 rounded-full border-[3px] border-dashed border-onaccent/40" />
          <motion.svg viewBox="0 0 80 240" className="h-[20rem]" animate={{ rotate: angle }} transition={{ duration: spinMs.current / 1000, ease: [0.1, 0.6, 0.12, 1] }} aria-label="Bottle" role="img">
            <path d="M33 4h14v8h-2l1 42c0 10 14 18 14 44v118c0 14-10 20-20 20s-20-6-20-20V98c0-26 14-34 14-44l1-42h-2z" fill="rgb(var(--on-accent))" />
            <path d="M24 130h32v70H24z" fill="rgb(var(--accent))" opacity="0.9" />
            <rect x="31" y="2" width="18" height="7" rx="2" fill="rgb(var(--accent))" />
            <path d="M28 64c-3 8-4 20-4 34" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55" />
          </motion.svg>
        </div>
        <p className="mt-2 text-center text-xl font-extrabold">{spinning || !started ? 'Spinning' : 'The neck points at one of you. You decide who.'}</p>
      </div>
      <Footer>{!spinning && started && <><Btn onClick={onClose}>Done</Btn><Btn ghost onClick={spin}>Spin again</Btn></>}</Footer>
    </>
  );
}

// ─── Wheel ───────────────────────────────────────────────────────────────────

/** Splits a long wheel label into two lines at the space nearest the middle, so it fits its slice. */
const wrap = (t: string): string[] => {
  if (t.length <= 12 || !t.includes(' ')) return [t.slice(0, 22)];
  let best = -1;
  for (let i = 0; i < t.length; i++) if (t[i] === ' ' && (best < 0 || Math.abs(i - t.length / 2) < Math.abs(best - t.length / 2))) best = i;
  return [t.slice(0, best), t.slice(best + 1)].map((x) => x.slice(0, 16));
};

const polar = (r: number, deg: number) => [150 + r * Math.sin((deg * Math.PI) / 180), 150 - r * Math.cos((deg * Math.PI) / 180)];

function WheelStage({ labels = ['Truth', 'Dare'], nonDrinking, onResult, onClose }: StageProps) {
  const n = labels.length; const slice = 360 / n;
  const [angle, setAngle] = useState(0);
  const [landed, setLanded] = useState<ToolResult | null>(null);
  const reduced = useReducedMotion();
  const ms = reduced ? 600 : 4200;
  const idx = useMemo(() => pick(n), [n]);
  useEffect(() => {
    const a = setTimeout(() => setAngle(360 * 6 - (idx + 0.5 + (Math.random() - 0.5) * 0.7) * slice), 350);
    let at = 350; let gap = 80; const ids: ReturnType<typeof setTimeout>[] = [];
    while (at < ms) { at += gap; gap *= 1.1; ids.push(setTimeout(() => haptic('tap'), at)); }
    const b = setTimeout(() => { haptic('success'); const r = { text: cap(fillDrink(labels[idx], nonDrinking)) }; setLanded(r); onResult(r); }, ms + 450);
    return () => { clearTimeout(a); clearTimeout(b); ids.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fs = n > 6 ? 12 : 14;
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative">
          <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[26px] border-x-transparent border-t-onaccent" />
          <motion.svg viewBox="0 0 300 300" className="h-[21rem] w-[21rem] max-w-[88vw]" animate={{ rotate: angle }} transition={{ duration: ms / 1000, ease: [0.12, 0.65, 0.1, 1] }} role="img" aria-label="Wheel">
            <circle cx="150" cy="150" r="146" fill="rgb(var(--on-accent))" />
            {labels.map((l, i) => {
              const a0 = i * slice; const a1 = (i + 1) * slice;
              const [x0, y0] = polar(138, a0); const [x1, y1] = polar(138, a1);
              const dark = i % 2 === 0;
              return (
                <g key={i}>
                  <path d={`M150 150L${x0} ${y0}A138 138 0 0 1 ${x1} ${y1}Z`} fill={dark ? 'rgb(var(--accent))' : 'rgb(var(--on-accent))'} stroke="rgb(var(--on-accent))" strokeWidth="3" />
                  <text transform={`rotate(${a0 + slice / 2 - 90} 150 150)`} textAnchor="end" fontSize={fs} fontWeight="800" fill={dark ? 'rgb(var(--on-accent))' : 'rgb(var(--accent))'}>
                    {wrap(fillDrink(l, nonDrinking)).map((ln, k, all) => <tspan key={k} x="278" y={150 + fs / 3 + (k - (all.length - 1) / 2) * (fs + 1)}>{ln}</tspan>)}
                  </text>
                  </g>
              );
            })}
            <circle cx="150" cy="150" r="16" fill="rgb(var(--on-accent))" stroke="rgb(var(--accent))" strokeWidth="4" />
          </motion.svg>
        </div>
        {landed ? <Said>{landed.text}</Said> : <p className="mt-6 text-xl font-bold opacity-80">Spinning</p>}
      </div>
      <Footer>{landed && <Btn onClick={onClose}>Done</Btn>}</Footer>
    </>
  );
}

// ─── Timer ───────────────────────────────────────────────────────────────────

function TimerStage({ seconds = 30, onClose }: StageProps) {
  const t = useCountdown(seconds);
  const R = 120; const C = 2 * Math.PI * R;
  const done = t.left === 0;
  useEffect(() => { if (t.running && t.left > 0 && t.left <= 5) haptic('tap'); }, [t.left, t.running]);
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative flex h-72 w-72 items-center justify-center">
          <svg viewBox="0 0 280 280" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="140" cy="140" r={R} fill="none" stroke="rgb(var(--on-accent))" strokeOpacity="0.25" strokeWidth="14" />
            <circle cx="140" cy="140" r={R} fill="none" stroke="rgb(var(--on-accent))" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - t.left / seconds)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <motion.p key={done ? 'done' : t.left <= 5 && t.running ? t.left : 'n'} initial={{ scale: t.left <= 5 && t.running ? 1.25 : 1 }} animate={{ scale: 1 }} className="display text-[5.5rem] leading-none tabular-nums" aria-live="off">{done ? 'Time!' : fmt(t.left)}</motion.p>
        </div>
      </div>
      <Footer>
        <Btn onClick={t.toggle}>{done ? 'Again' : t.running ? 'Pause' : t.left === seconds ? 'Start' : 'Resume'}</Btn>
        <Btn ghost onClick={onClose}>Close</Btn>
      </Footer>
    </>
  );
}

// ─── Vote ────────────────────────────────────────────────────────────────────

function VoteStage({ seconds = 3, endWord, endText, onClose }: StageProps) {
  const [n, setN] = useState<number>(seconds);
  const [run, setRun] = useState(0);
  useEffect(() => {
    let c = seconds; setN(c); haptic('tap');
    const id = setInterval(() => { c -= 1; setN(c); haptic(c > 0 ? 'tap' : 'success'); if (c <= 0) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [run, seconds]);
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.p key={`${run}-${n}`} initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="display text-[10rem] leading-none">{n > 0 ? n : endWord ?? 'Point!'}</motion.p>
        {n <= 0 && <p className="mt-4 text-balance text-xl font-extrabold">{endText ?? 'Everyone points at once.'}</p>}
      </div>
      <Footer>{n <= 0 && <><Btn onClick={onClose}>Done</Btn><Btn ghost onClick={() => setRun((r) => r + 1)}>Count down again</Btn></>}</Footer>
    </>
  );
}

// ─── The full-screen stage ───────────────────────────────────────────────────

/** A tool gets the whole screen. It plays on its own, hands the result back to the card and waits for Done. */
export function ToolStage(props: StageProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const Body = { dice: DiceStage, coin: CoinStage, bottle: BottleStage, wheel: WheelStage, timer: TimerStage, vote: VoteStage }[props.kind];
  return createPortal(
    <motion.div {...(props.tint ? { 'data-group': props.tint } : { 'data-kind': props.kind })} role="dialog" aria-modal="true" aria-label={KIND_META[props.kind].label}
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
      onPointerDownCapture={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-accent px-6 pb-6 pt-12 text-onaccent">
      <header>
        <p className="sign text-xl">{KIND_META[props.kind].label}</p>
        <p className="mt-2 text-balance text-xl font-bold leading-snug opacity-90">{fillDrink(props.prompt, props.nonDrinking)}</p>
      </header>
      <Body {...props} />
    </motion.div>,
    document.body,
  );
}
