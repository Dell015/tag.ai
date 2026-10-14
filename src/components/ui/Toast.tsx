'use client';
import { useToastStore } from '@/stores/toast-store';
import { cn } from '@/lib/cn';

/** Top-of-screen messages. Undo is a full-size button so it can be hit one-handed. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4 safe-top">
      {toasts.map((t) => (
        <div key={t.id} role="status"
          className={cn('pointer-events-auto flex min-h-tap animate-toast-in items-center justify-between gap-3 rounded-xl border-2 bg-panel py-2 pl-4 pr-2 text-lg font-bold',
            t.tone === 'ok' && 'border-ok', t.tone === 'warn' && 'border-danger', t.tone === 'info' && 'border-line')}>
          <span>{t.message}</span>
          {t.action && (
            <button onClick={() => { t.action!.onClick(); dismiss(t.id); }}
              className="h-12 shrink-0 rounded-lg bg-accent px-5 font-extrabold text-onaccent active:translate-y-px">
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
