import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';
import { fillDrink, kindOf, KIND_META } from '@/lib/game/card-kinds';
import { categoryLabel } from '@/components/library/common';
import type { QueuedCard } from '@/lib/game/escalation-engine';

/** One card in a list: its text, what kind it is, and the actions the screen passes in. */
export function CardRow({ card, actions }: { card: QueuedCard; actions?: ReactNode }) {
  return (
    <li className="border-b-2 border-line/60 py-4">
      <p className="text-xl font-bold leading-snug">{fillDrink(card.text, false)}</p>
      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-base text-muted">
        <Badge tone="line">{KIND_META[kindOf(card)].label}</Badge>
        {card.adult && <Badge>18+</Badge>}
        <span>{categoryLabel(card.category)}, heat {card.intensity} of 5</span>
      </p>
      {actions && <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">{actions}</div>}
    </li>
  );
}
