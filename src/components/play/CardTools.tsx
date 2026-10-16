'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCountdown } from './ToolsSheet';
import { fillDrink, type CardKind, type CardTool } from '@/lib/game/card-kinds';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const pick = (n: number) => Math.floor(Math.random() * n);

/** The result, big and boxed, so the table can follow it. */
function Result({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <motion.p initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      className={cn('mt-3 rounded-xl border-[3px] border-current px-4 py-3 font-extrabold leading-tight', small ? 'text-xl' : 'text-2xl')} role="status">{children}</motion.p>
  );
}

const Go = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
  <button onClick={onClick} disabled={disabled} className="min-h-tap w-full rounded-xl bg-onaccent px-5 text-xl font-extrabold text-accent active:translate-y-px disabled:opacity-50">{children}</button>
);

function Dice({ count, outcomes, nonDrinking }: { count: 1 | 2; outcomes?: string[]; nonDrinking: boolean }) {
  const [vals, setVals] = useState<number[] | null>(null);
  const [rolling, setRolling] = useState(false);
  const roll = () => {
    haptic('tap'); setRolling(true);
    setTimeout(() => { setVals(Array.from({ length: count }, () => 1 + pick(6))); setRolling(false); haptic('success'); }, 700);
  };
  const total = vals?.reduce((a, b) => a + b, 0) ?? 0;
  return (
    <div className="mt-4">
      <div className="flex min-h-[5.5rem] items-center justify-center gap-3">
        {(rolling || !vals ? Array.from({ length: count }, () => null) : vals).map((v, i) => (
          <motion.span key={`${i}-${rolling}-${v}`} animate={rolling ? { rotate: [0, 120, 240, 360, 480, 600, 720], y: [0, -14, 0, -10, 0, -5, 0] } : { rotate: 0, scale: [0.8, 1.1, 1] }} transition={{ duration: rolling ? 0.7 : 0.35 }}
            className="display flex h-20 w-20 items-center justify-center rounded-2xl bg-onaccent text-6xl text-accent">{rolling || v === null ? '?' : v}</motion.span>
        ))}
      </div>
      {vals && count === 2 && <p className="mt-2 text-center text-xl font-extrabold">Total {total}</p>}
      {vals && count === 1 && outcomes?.[vals[0] - 1] && <Result>{cap(fillDrink(outcomes[vals[0] - 1], nonDrinking))}</Result>}
      {!vals && <Go onClick={roll} disabled={rolling}>{rolling ? 'Rolling...' : count === 2 ? 'Roll the dice' : 'Roll the die'}</Go>}
    </div>
  );
}

function Coin({ outcomes, nonDrinking }: { outcomes?: string[]; nonDrinking: boolean }) {
  const [side, setSide] = useState<0 | 1 | null>(null);
  const [busy, setBusy] = useState(false);
  const flip = () => {
    haptic('tap'); setBusy(true);
    setTimeout(() => { setSide(Math.random() < 0.5 ? 0 : 1); setBusy(false); haptic('success'); }, 900);
  };
  return (
    <div className="mt-4">
      <div className="flex justify-center" style={{ perspective: 600 }}>
        <motion.span animate={busy ? { rotateY: 1800, y: [0, -50, 0] } : { rotateY: 0 }} transition={{ duration: busy ? 0.9 : 0 }}
          className="display flex h-24 w-24 items-center justify-center rounded-full border-4 border-current bg-onaccent text-2xl text-accent">{busy ? '' : side === null ? 'Coin' : side === 0 ? 'Heads' : 'Tails'}</motion.span>
      </div>
      {side !== null && (outcomes?.[side] ? <Result>{fillDrink(outcomes[side], nonDrinking)}</Result> : <Result>{side === 0 ? 'Heads' : 'Tails'}</Result>)}
      {side === null && <div className="mt-3"><Go onClick={flip} disabled={busy}>{busy ? 'Flipping...' : 'Flip the coin'}</Go></div>}
    </div>
  );
}

/** A disc you spin. It lands on a real slice: the pointer at the top reads the winner. */
function Spinner({ labels, kind, nonDrinking }: { labels: string[]; kind: 'bottle' | 'wheel'; nonDrinking: boolean }) {
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const n = labels.length;
  const slice = 360 / n;
  const spin = () => {
    const idx = pick(n);
    haptic('tap'); setBusy(true); setResult(null);
    const target = 360 * 5 - (kind === 'wheel' ? (idx + 0.5) * slice : idx * slice);
    setAngle(target);
    setTimeout(() => { setResult(labels[idx]); setBusy(false); haptic('success'); }, 2300);
  };
  const stops = labels.map((_, i) => `${i % 2 ? 'rgb(var(--on-accent))' : 'rgb(var(--accent))'} ${i * slice}deg ${(i + 1) * slice}deg`).join(', ');
  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="relative h-36 w-36">
        <motion.div animate={{ rotate: angle }} transition={{ duration: angle === 0 ? 0 : 2.2, ease: [0.15, 0.7, 0.1, 1] }}
          className={cn('absolute inset-0 flex items-center justify-center', kind === 'wheel' && 'rounded-full border-[5px] border-current')}
          style={kind === 'wheel' ? { background: `conic-gradient(${stops})` } : undefined}>
          {kind === 'bottle' && <span aria-hidden className="relative block h-32 w-9"><span className="absolute inset-x-0 bottom-0 top-9 rounded-xl bg-onaccent" /><span className="absolute left-2.5 right-2.5 top-0 h-12 rounded-t-md bg-onaccent" /></span>}
        </motion.div>
        <span aria-hidden className="absolute -top-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[11px] border-t-[20px] border-x-transparent border-t-current" />
      </div>
      {result && <Result small={kind === 'wheel'}>{kind === 'bottle' ? result : cap(fillDrink(result, nonDrinking))}</Result>}
      {!result && <div className="mt-3 w-full"><Go onClick={spin} disabled={busy}>{busy ? 'Spinning...' : kind === 'bottle' ? 'Spin the bottle' : 'Spin the wheel'}</Go></div>}
    </div>
  );
}

function Timer({ seconds }: { seconds: number }) {
  const t = useCountdown(seconds);
  return (
    <div className="mt-4">
      <p className={cn('display text-center text-[6rem] leading-none tabular-nums', t.running && t.left <= 5 && t.left > 0 && 'animate-pulse')} aria-live="off">{fmt(t.left)}</p>
      <div className="mt-3 flex gap-3">
        <div className="flex-1"><Go onClick={t.toggle}>{t.left === 0 ? 'Time is up. Again' : t.running ? 'Pause' : t.left === seconds ? 'Start the timer' : 'Resume'}</Go></div>
        {t.left !== seconds && <button onClick={t.reset} className="min-h-tap px-3 text-lg font-extrabold underline">Reset</button>}
      </div>
    </div>
  );
}

function Vote({ seconds }: { seconds: number }) {
  const [n, setN] = useState<number | null>(null);
  const go = () => {
    haptic('tap'); let c = seconds; setN(c);
    const id = setInterval(() => { c -= 1; setN(c); haptic(c > 0 ? 'tap' : 'success'); if (c < 0) clearInterval(id); }, 900);
  };
  return (
    <div className="mt-4 text-center">
      {n !== null && (
        <motion.p key={n} initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }} className="display text-[6.5rem] leading-none">{n > 0 ? n : 'Point!'}</motion.p>
      )}
      {(n === null || n < 0) && <Go onClick={go}>{n === null ? 'Count down' : 'Count down again'}</Go>}
    </div>
  );
}

/** The tool a card brings with it. It sits under the card text and keeps drags off the card. */
export function CardToolView({ kind, tool, outcomes, players, nonDrinking }: { kind: CardKind; tool?: CardTool; outcomes?: string[]; players: string[]; nonDrinking: boolean }) {
  let body: React.ReactNode = null;
  if (kind === 'dice') body = <Dice count={tool?.dice ?? 1} outcomes={outcomes} nonDrinking={nonDrinking} />;
  else if (kind === 'coin') body = <Coin outcomes={outcomes} nonDrinking={nonDrinking} />;
  else if (kind === 'bottle') body = <Spinner kind="bottle" labels={players.length > 1 ? players : ['Anyone']} nonDrinking={nonDrinking} />;
  else if (kind === 'wheel') body = <Spinner kind="wheel" labels={tool?.labels ?? ['Truth', 'Dare']} nonDrinking={nonDrinking} />;
  else if (kind === 'timer') body = <Timer seconds={tool?.seconds ?? 30} />;
  else if (kind === 'vote') body = <Vote seconds={tool?.seconds ?? 3} />;
  if (!body) return null;
  return <div onPointerDownCapture={(e) => e.stopPropagation()}>{body}</div>;
}
