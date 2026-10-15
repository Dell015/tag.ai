'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Sheet } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useShopStore } from '@/stores/shop-store';
import { cn } from '@/lib/cn';

type Tool = 'menu' | 'timer' | 'coin' | 'dice' | 'bottle' | 'wheel';

const TOOLS: { id: Exclude<Tool, 'menu'>; name: string; blurb: string; shop?: string }[] = [
  { id: 'timer', name: 'Timer', blurb: 'Count down any time' },
  { id: 'coin', name: 'Coin flip', blurb: 'Heads or tails' },
  { id: 'dice', name: 'Dice', blurb: 'Roll one or two', shop: 'tool-dice' },
  { id: 'bottle', name: 'Spin the bottle', blurb: 'Picks a player', shop: 'tool-bottle' },
  { id: 'wheel', name: 'Wheel', blurb: 'Your own labels', shop: 'tool-wheel' },
];

export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const done = useRef(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (running && left === 0 && !done.current) { done.current = true; setRunning(false); haptic('warn'); }
  }, [left, running]);
  return {
    left, running,
    toggle: () => { if (left === 0) { done.current = false; setLeft(seconds); setRunning(true); } else setRunning((r) => !r); },
    reset: () => { done.current = false; setRunning(false); setLeft(seconds); },
    set: (n: number) => { done.current = false; setRunning(false); setLeft(n); },
  };
}

const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

function TimerTool() {
  const [secs, setSecs] = useState(30);
  const t = useCountdown(secs);
  return (
    <div className="text-center">
      <p className="display text-[7rem] leading-none tabular-nums" aria-live="off">{fmt(t.left)}</p>
      <div className="my-5 flex justify-center gap-2">
        {[15, 30, 60, 120].map((n) => (
          <button key={n} onClick={() => { setSecs(n); t.set(n); }} aria-pressed={secs === n}
            className={cn('min-h-tap rounded-full border-2 px-4 text-lg font-extrabold', secs === n ? 'border-accent bg-accent text-onaccent' : 'border-line')}>{n < 60 ? `${n}s` : `${n / 60}m`}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" onClick={t.toggle}>{t.left === 0 ? 'Again' : t.running ? 'Pause' : 'Start'}</Button>
        <Button size="lg" variant="secondary" onClick={t.reset}>Reset</Button>
      </div>
    </div>
  );
}

function CoinTool() {
  const [side, setSide] = useState<string | null>(null);
  const [flips, setFlips] = useState(0);
  const [busy, setBusy] = useState(false);
  const flip = () => {
    setBusy(true); haptic('tap'); setSide(null);
    setTimeout(() => { setSide(Math.random() < 0.5 ? 'Heads' : 'Tails'); setFlips((n) => n + 1); setBusy(false); haptic('success'); }, 600);
  };
  return (
    <div className="text-center">
      <div key={flips} className={cn('mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-accent text-onaccent', busy && 'animate-[spin_0.6s_linear]')}>
        <span className="display text-5xl">{busy ? '' : side ?? 'Flip'}</span>
      </div>
      <Button size="lg" full className="mt-6" onClick={flip} disabled={busy}>{side ? 'Flip again' : 'Flip the coin'}</Button>
    </div>
  );
}

function DiceTool() {
  const [n, setN] = useState<1 | 2>(1);
  const [vals, setVals] = useState<number[]>([]);
  const [roll, setRoll] = useState(0);
  const go = () => { haptic('tap'); setVals(Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6))); setRoll((r) => r + 1); };
  return (
    <div className="text-center">
      <div className="mb-5 flex justify-center gap-2">
        {([1, 2] as const).map((k) => <button key={k} onClick={() => { setN(k); setVals([]); }} aria-pressed={n === k} className={cn('min-h-tap rounded-full border-2 px-5 text-lg font-extrabold', n === k ? 'border-accent bg-accent text-onaccent' : 'border-line')}>{k} {k === 1 ? 'die' : 'dice'}</button>)}
      </div>
      <div key={roll} className="flex min-h-[9rem] items-center justify-center gap-4">
        {vals.length === 0 ? <p className="text-xl text-muted">Tap Roll</p> : vals.map((v, i) => (
          <span key={i} className="display flex h-32 w-32 items-center justify-center rounded-2xl bg-text text-bg text-8xl">{v}</span>
        ))}
      </div>
      {vals.length === 2 && <p className="mt-2 text-xl font-extrabold">Total {vals[0] + vals[1]}</p>}
      <Button size="lg" full className="mt-6" onClick={go}>Roll</Button>
    </div>
  );
}

function SpinTool({ labels, title, editable }: { labels: string[]; title: string; editable?: boolean }) {
  const [list, setList] = useState(labels);
  const [draft, setDraft] = useState('');
  const [pick, setPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const spin = () => {
    if (list.length < 2) return;
    setSpinning(true); setPick(null); haptic('tap');
    const idx = Math.floor(Math.random() * list.length);
    setAngle((a) => a + 1440 + Math.random() * 360);
    setTimeout(() => { setPick(list[idx]); setSpinning(false); haptic('success'); }, 1800);
  };
  return (
    <div className="text-center">
      <div className="relative mx-auto h-44 w-44">
        <div className="absolute inset-0 rounded-full border-4 border-accent" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? 'transform 1.8s cubic-bezier(.2,.7,.1,1)' : 'none', background: 'repeating-conic-gradient(rgb(var(--accent)) 0 20deg, rgb(var(--raised)) 20deg 40deg)' }} />
        <span className="absolute -top-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-text" />
      </div>
      <p className="display mt-5 min-h-[3.5rem] text-5xl">{spinning ? '...' : pick ?? title}</p>
      {editable && (
        <>
          <ul className="my-3 flex flex-wrap justify-center gap-2">
            {list.map((l) => <li key={l}><button onClick={() => setList(list.filter((x) => x !== l))} aria-label={`Remove ${l}`} className="min-h-tap rounded-full border-2 border-line px-4 text-base font-bold">{l} x</button></li>)}
          </ul>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = draft.trim(); if (t && list.length < 12 && !list.includes(t)) setList([...list, t]); setDraft(''); }}>
            <input value={draft} maxLength={24} onChange={(e) => setDraft(e.target.value)} placeholder="Add a dare or label" aria-label="New label" className="h-tap min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-lg focus:border-accent" />
            <Button type="submit" variant="secondary" disabled={!draft.trim()}>Add</Button>
          </form>
        </>
      )}
      <Button size="lg" full className="mt-5" onClick={spin} disabled={spinning || list.length < 2}>{list.length < 2 ? 'Add at least 2 labels' : 'Spin'}</Button>
    </div>
  );
}

/** Pause-menu tools. Timer and Coin flip are free; the rest come from the Shop. */
export function ToolsSheet({ open, onClose, players }: { open: boolean; onClose: () => void; players: string[] }) {
  const owned = useShopStore((s) => s.owned);
  const [tool, setTool] = useState<Tool>('menu');
  const close = () => { setTool('menu'); onClose(); };
  const current = TOOLS.find((t) => t.id === tool);
  return (
    <Sheet open={open} onClose={close} title={current ? current.name : 'Tools'}>
      {tool === 'menu' ? (
        <ul>
          {TOOLS.map((t) => {
            const locked = !!t.shop && !owned.includes(t.shop);
            return (
              <li key={t.id}>
                {locked ? (
                  <Link href="/shop?tab=tools" className="flex min-h-[4.25rem] items-center justify-between gap-3 border-b-2 border-line/60 py-3 opacity-80">
                    <span><span className="block text-xl font-bold">{t.name}</span><span className="text-base text-muted">{t.blurb}</span></span>
                    <span className="text-base font-extrabold text-accent">Get in Shop</span>
                  </Link>
                ) : (
                  <button onClick={() => setTool(t.id)} className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 border-b-2 border-line/60 py-3 text-left">
                    <span><span className="block text-xl font-bold">{t.name}</span><span className="text-base text-muted">{t.blurb}</span></span>
                    <span className="text-base font-extrabold text-accent">Open</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <button onClick={() => setTool('menu')} className="mb-4 h-tap text-base font-extrabold text-accent">All tools</button>
          {tool === 'timer' && <TimerTool />}
          {tool === 'coin' && <CoinTool />}
          {tool === 'dice' && <DiceTool />}
          {tool === 'bottle' && <SpinTool labels={players} title="Spin the bottle" />}
          {tool === 'wheel' && <SpinTool labels={['Sing', 'Shot', 'Dance', 'Truth', 'Swap seats']} title="Spin the wheel" editable />}
        </>
      )}
    </Sheet>
  );
}
