'use client';
import { useToastStore } from '@/stores/toast-store';
import { cn } from '@/lib/cn';

/** Top-of-screen toasts. Big tap target Undo action, 5s by default for undo toasts. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4 safe-top"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex min-h-tap animate-toast-in items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-base font-medium shadow-card backdrop-blur',
            t.tone === 'ok' && 'border-ok/40 bg-surface/95',
            t.tone === 'warn' && 'border-danger/50 bg-surface/95',
            t.tone === 'info' && 'border-white/10 bg-elevated/95',
          )}
        >
          <span className="text-balance">{t.message}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
              className="min-h-tap shrink-0 rounded-xl bg-accent-gradient px-4 font-bold text-white active:scale-95"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
