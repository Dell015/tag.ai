'use client';
import { Button } from './Button';
import { Sheet } from './Sheet';

/** Confirmation with a specific verb on the main button, never "OK". */
export function ConfirmSheet({ open, title, body, confirmLabel, cancelLabel = 'Cancel', danger, onConfirm, onClose }: {
  open: boolean; title: string; body?: string; confirmLabel: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {body && <p className="-mt-2 mb-6 text-lg text-muted">{body}</p>}
      <div className="space-y-3 pb-2">
        <Button size="lg" full variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        <Button full variant="secondary" onClick={onClose}>{cancelLabel}</Button>
      </div>
    </Sheet>
  );
}
