'use client';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

export const AVATARS = ['😎','🥳','😈','🤪','😏','🥴','🤠','👻','🦄','🐯','🐸','🐼','🦊','🐙','🍺','🍹','🔥','💀','👑','🌶️','🍕','🎤','🌴','⚡'];

export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Pick an avatar">
      {AVATARS.map((a) => (
        <button
          key={a}
          role="radio"
          aria-checked={value === a}
          aria-label={a}
          onClick={() => {
            haptic('tap');
            onChange(a);
          }}
          className={cn(
            'flex aspect-square items-center justify-center rounded-2xl text-3xl transition active:scale-90',
            value === a ? 'bg-accent-gradient shadow-glow' : 'bg-surface ring-1 ring-white/10',
          )}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
