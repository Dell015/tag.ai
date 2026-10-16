'use client';
import { useCountdown } from './ToolsSheet';
import type { WildCardType } from '@/types/game';
import { Icon } from '@/components/ui';
import { CardToolView } from './CardTools';

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

export function WildExtras({ type, players, nonDrinking }: { type: WildCardType; players: string[]; nonDrinking: boolean }) {
  switch (type) {
    case 'group_pose': return <TimerChip seconds={5} label="Hold the pose" />;
    case 'dance_off': return <TimerChip seconds={15} label="Start dancing" />;
    case 'call_out':
    case 'voice_note': return <CardToolView kind="bottle" players={players} nonDrinking={nonDrinking} />;
    case 'lucky_roll': return <CardToolView kind="dice" tool={{ dice: 1 }} players={players} nonDrinking={nonDrinking} />;
    default: return null;
  }
}
