'use client';
import { fillDrink } from '@/lib/game/card-kinds';
import { Button, EmptyState, Screen, Spot } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { findCard } from '@/lib/data/card-pool';
import { useAdultOn } from '@/lib/adult';

export default function TrashedPage() {
  const ids = useProfileStore((s) => s.trashedCardIds);
  const untrash = useProfileStore((s) => s.untrashCard);
  const adultOn = useAdultOn();
  const cards = ids.map((id) => findCard(id, adultOn)).filter((c) => !!c);

  return (
    <Screen title="Trashed" back="/me/settings"
      footer={cards.length > 1 ? <Button full variant="secondary" className="mb-4" onClick={() => ids.forEach(untrash)}>Restore all</Button> : undefined}>
      {cards.length === 0 ? (
        <EmptyState art={<Spot name="bottle" />} title="Nothing trashed." body="Cards you trash during a game show up here so you can bring them back." />
      ) : (
        <ul>
          {cards.map((c) => (
            <li key={c!.id} className="border-b-2 border-line/60 py-5">
              <p className="display text-3xl" style={{ lineHeight: 1.05 }}>{fillDrink(c!.text, false)}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base text-muted">{c!.category.replace(/_/g, ' ')}</span>
                <button onClick={() => untrash(c!.id)} className="h-tap px-2 text-base font-extrabold text-accent">Restore</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
