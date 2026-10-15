'use client';
import { useState } from 'react';
import { useCountdown } from './ToolsSheet';
import type { WildCardType } from '@/types/game';
import { Icon } from '@/components/ui';

const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

/** Pulls a duration out of a dare ("for 30 seconds", "2 minutes"). Returns seconds or null. */
export function dareSeconds(text: string): number | null {
  const m = text.match(/(\d+)\s*(seconds?|secs?|minutes?|mins?)\b/i);
  if (!m) return null;
  const n = Number(m[1]) * (/^m/i.test(m[2]) ? 60 : 1);
  return n >= 5 && n <= 600 ? n : null;
}

export function TimerChip({ seconds, label = 'Start timer' }: { seconds: number; label?: string }) {
  const t = useCountdown(seconds);
  return (
    <div className="mt-4 flex items-center gap-3" onPointerDownCapture={(e) => e.stopPropagation()}>
      <button onClick={t.toggle} className="min-h-tap rounded-full border-2 border-current px-5 text-lg font-extrabold">
        {t.left === 0 ? 'Time is up. Again' : t.running ? `Pause ${fmt(t.left)}` : t.left === seconds ? `${label}, ${fmt(seconds)}` : `Resume ${fmt(t.left)}`}
      </button>
      {t.left !== seconds && <button onClick={t.reset} className="min-h-tap px-2 text-base font-extrabold underline">Reset</button>}
    </div>
  );
}

function EveryoneAnswers({ order }: { order: string[] }) {
  const [i, setI] = useState(0);
  const done = i >= order.length;
  return (
    <div className="mt-4" onPointerDownCapture={(e) => e.stopPropagation()}>
      <p className="text-2xl font-extrabold">{done ? 'Everyone has answered.' : `Now answering: ${order[i]}`}</p>
      {!done && <p className="text-base font-semibold opacity-70">{i + 1} of {order.length}</p>}
      {!done && <button onClick={() => setI(i + 1)} className="mt-3 min-h-tap rounded-full border-2 border-current px-5 text-lg font-extrabold">{i === order.length - 1 ? 'Last one done' : `Next speaker, ${order[i + 1]}`}</button>}
    </div>
  );
}

/** Loud, unmistakable call to drink. Used wherever a card makes people drink. */
export function DrinkBanner({ nonDrinking, who = 'Everyone' }: { nonDrinking: boolean; who?: string }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border-[3px] border-current px-4 py-3" role="alert">
      <Icon name="shot" size={44} className="shrink-0" />
      <div>
        <p className="display text-4xl leading-none">{nonDrinking ? 'Do a forfeit' : 'Take a drink'}</p>
        <p className="mt-1 text-lg font-bold">{who}{nonDrinking ? ' does the forfeit.' : ' drinks now.'}</p>
      </div>
    </div>
  );
}

export function WildExtras({ type, order, nextName, crown, spike, nonDrinking }: {
  type: WildCardType; order: string[]; nextName: string; crown: number; spike: number; nonDrinking: boolean;
}) {
  const line = 'mt-4 text-2xl font-extrabold';
  switch (type) {
    case 'everyone_answers': return <EveryoneAnswers order={order} />;
    case 'act_it_out': return <TimerChip seconds={30} label="Start charades" />;
    case 'whisper_round': return <p className={line}>Whisper to {nextName}.</p>;
    case 'free_drink': return <DrinkBanner nonDrinking={nonDrinking} />;
    case 'crown': return <p className={line}>Crown immunity: {crown} {crown === 1 ? 'card' : 'cards'} left</p>;
    case 'heat_spike': return <p className={line}>Heat spike: {spike} {spike === 1 ? 'card' : 'cards'} left</p>;
    case 'shuffle': return <p className={line}>The next 5 cards are reshuffled.</p>;
    default: return null;
  }
}
