import type { ReactNode } from 'react';

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="py-10">
      <p className="display text-5xl">{title}</p>
      {body && <p className="mt-3 text-lg text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
