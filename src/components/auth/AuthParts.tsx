'use client';
import { forwardRef, useEffect, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { Icon } from '@/components/ui';
import { avatarColor } from '@/components/ui/Avatar';

/** One screen of the sign up flow: back button, progress, title, then the content. */
export function AuthShell({ step, total = 3, progress = true, onBack, title, subtitle, children }: {
  step: number; total?: number; progress?: boolean; onBack?: () => void; title: string; subtitle?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 safe-top safe-bottom">
      <div className="flex items-center gap-4">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Back" className="flex h-tap w-tap shrink-0 items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
        ) : <span className="h-tap w-tap shrink-0" />}
        {progress && <div className="flex flex-1 items-end justify-end gap-2 pr-1" role="progressbar" aria-label={`Step ${step} of ${total}`} aria-valuemin={1} aria-valuemax={total} aria-valuenow={step}>
          {Array.from({ length: total }, (_, i) => {
            const done = i < step - 1, here = i === step - 1;
            return (
              <span
                key={i}
                style={{ transform: here ? `translate3d(0, -4px, 0) rotate(${(i - 1) * 6}deg) scale(1.08)` : 'none', transition: 'transform 320ms cubic-bezier(0.3, 1.5, 0.5, 1)' }}
                className={cn('flex h-10 w-7 items-center justify-center rounded-md border-2', done || here ? 'border-[#181310] bg-accent text-onaccent' : 'border-line')}
              >
                {done && <span className="pop-in flex"><Icon name="check" size={14} /></span>}
              </span>
            );
          })}
        </div>}
      </div>
      <div key={title} className="auth-in flex flex-1 flex-col">
        <h1 className="mt-6 text-5xl leading-[0.95]">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-muted">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/** Error line with an icon, so it is not told by colour alone. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border-2 border-danger/60 px-3 py-2.5 text-base font-bold text-danger">
      <Icon name="alert" size={20} className="mt-0.5 shrink-0" /><span>{children}</span>
    </p>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: ReactNode; error?: string | null };

/** Labelled input. A password field gets a Show / Hide button. */
export const AuthField = forwardRef<HTMLInputElement, FieldProps>(function AuthField({ label, helper, error, type, className, ...rest }, ref) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPw = type === 'password';
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-base font-bold text-muted">{label}</label>
      <div className="relative">
        <input
          id={id} ref={ref} type={isPw && shown ? 'text' : type} aria-invalid={!!error} aria-describedby={helper || error ? `${id}-h` : undefined}
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
          className={cn('h-cta w-full rounded-xl border-2 bg-transparent px-4 text-xl font-bold placeholder:font-medium placeholder:text-muted/60 focus:border-accent', isPw && 'pr-14', error ? 'border-danger' : 'border-line', className)}
          {...rest}
        />
        {isPw && (
          <button type="button" onClick={() => { haptic('tap'); setShown((v) => !v); }} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted">
            <Icon name={shown ? 'eyeoff' : 'eye'} size={22} />
          </button>
        )}
      </div>
      {(helper || error) && <div id={`${id}-h`} className={cn('mt-1.5 text-base', error ? 'font-bold text-danger' : 'text-muted')}>{error || helper}</div>}
    </div>
  );
});

/** The Google brand mark has to keep Google's own colours. */
function GoogleG() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => { haptic('tap'); onClick(); }}
      className="inline-flex h-cta w-full select-none items-center justify-center gap-3 rounded-xl border-b-4 border-black/35 bg-white px-6 text-lg font-extrabold text-[#1f1f1f] transition-transform active:translate-y-[3px] active:border-b-[1px] disabled:opacity-40">
      <GoogleG />Continue with Google
    </button>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-3 text-base text-muted" role="separator">
      <span className="h-px flex-1 bg-line" /><span>{children}</span><span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** The player's card, filled in live while they type. When `dealt` is true it turns over (a 2D squash, no 3D, so it stays smooth). */
export function PlayerCard({ name, avatar, coins, dealt }: { name: string; avatar: string; coins: number; dealt?: boolean }) {
  const c = avatarColor(avatar, name || '?');
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0 front, 1 squashed, 2 back
  useEffect(() => {
    if (!dealt) { setPhase(0); return; }
    setPhase(1);
    const t = setTimeout(() => setPhase(2), 200);
    return () => clearTimeout(t);
  }, [dealt]);
  return (
    <div className="mx-auto" aria-hidden style={{ width: 140 }}>
      <div key={avatar} className="wobble">
        <div style={{ width: 140, height: 184, transform: phase === 1 ? 'scaleX(0.02)' : 'none', transition: 'transform 200ms ease-in-out', willChange: 'transform' }}>
          {phase < 2 ? (
            <div style={{ background: c.bg, color: c.fg, border: '3px solid #181310' }} className="flex h-full w-full flex-col overflow-hidden rounded-card">
              <div className="trim h-2.5 shrink-0" />
              <div className="flex flex-1 flex-col items-center justify-center px-2">
                <span className="sign text-6xl leading-none">{initial}</span>
                <span className="mt-2 max-w-full truncate text-lg font-extrabold">{name.trim() || 'Your name'}</span>
              </div>
              <div className="mx-2 mb-2 flex items-center justify-center gap-1.5 rounded-lg bg-[#181310] py-1.5 text-sm font-extrabold text-white">
                <Icon name="coin" size={16} />{coins} coins
              </div>
            </div>
          ) : (
            <div style={{ background: '#181310', border: '3px solid #FFC72C' }} className="flex h-full w-full items-center justify-center rounded-card">
              <span className="sign text-2xl text-[#FFC72C]">tag.ai</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
