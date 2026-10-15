'use client';
import { Button, EmptyState, Screen } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { CURATED_CARDS } from '@/lib/data/cards';

export default function TrashedPage() {
  const ids = useProfileStore((s) => s.trashedCardIds);
  const untrash = useProfileStore((s) => s.untrashCard);
  const cards = ids.map((id) => CURATED_CARDS.find((c) => c.id === id)).filter((c) => !!c);

  return (
    <Screen title="Trashed" back="/me/settings"
      footer={cards.length > 1 ? <Button full variant="secondary" className="mb-4" onClick={() => ids.forEach(untrash)}>Restore all</Button> : undefined}>
      {cards.length === 0 ? (
        <EmptyState title="Nothing trashed." body="Cards you trash during a game show up here so you can bring them back." />
      ) : (
        <ul>
          {cards.map((c) => (
            <li key={c!.id} className="border-b-2 border-line/60 py-5">
              <p className="display text-3xl" style={{ lineHeight: 1.05 }}>{c!.text}</p>
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
