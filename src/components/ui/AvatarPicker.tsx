'use client';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { AVATAR_COLORS } from './Avatar';
import { Icon } from './Icon';

export const AVATARS = AVATAR_COLORS.map((_, i) => `c${i}`);

export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-5 gap-3" role="radiogroup" aria-label="Pick a colour">
      {AVATARS.map((a, i) => {
        const on = value === a;
        return (
          <button
            key={a} role="radio" aria-checked={on} aria-label={`Colour ${i + 1}`}
            onClick={() => { haptic('tap'); onChange(a); }}
            style={{ background: AVATAR_COLORS[i].bg, color: AVATAR_COLORS[i].fg }}
            className={cn('flex aspect-square items-center justify-center rounded-full transition-transform active:scale-90', on && 'ring-4 ring-text ring-offset-4 ring-offset-bg')}
          >
            {on && <Icon name="check" size={26} />}
          </button>
        );
      })}
    </div>
  );
}
