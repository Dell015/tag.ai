import type { ReactNode } from 'react';

export function EmptyState({ title, body, action, art }: { title: string; body?: string; action?: ReactNode; art?: ReactNode }) {
  return (
    <div className="py-10">
      {art && <div className="mb-4">{art}</div>}
      <p className="display text-5xl">{title}</p>
      {body && <p className="mt-3 text-lg text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
