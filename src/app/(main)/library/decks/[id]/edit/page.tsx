'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Chip, EmptyState, Icon, Screen, Spot, TextField, toast } from '@/components/ui';
import { CardEditorSheet } from '@/components/library/CardEditorSheet';
import { categoryLabel } from '@/components/library/common';
import { AUDIENCES, MAX_DECK_CARDS, hasSlot, useDeckStore, type DeckCard } from '@/stores/deck-store';
import { GAME_MODES } from '@/lib/game/game-modes';
import { CURATED_CARDS } from '@/lib/data/cards';
import { useProfileStore } from '@/stores/profile-store';
import { Sheet } from '@/components/ui';
import type { GameMode } from '@/types/game';

const COLORS: GameMode[] = ['icebreaker', 'barkada', 'lovers', 'spicy', 'chaos', 'family'];

export default function EditDeckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === id));
  const st = useDeckStore();
  const savedIds = useProfileStore((s) => s.savedCardIds);
  const [editing, setEditing] = useState<DeckCard | null>(null);
  const [adding, setAdding] = useState(false);
  const [picker, setPicker] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  if (!deck) return <Screen title="Deck" back="/library"><EmptyState title="That deck is gone." /></Screen>;

  const saved = savedIds.map((i) => CURATED_CARDS.find((c) => c.id === i)).filter((c) => !!c);
  const have = new Set(deck.cards.map((c) => c.text));
  const fromSaved = saved.filter((c) => !have.has(c!.text));

  const removeCard = (c: DeckCard) => {
    const index = deck.cards.findIndex((x) => x.id === c.id);
    st.removeCard(deck.id, c.id);
    toast('Card removed', { duration: 5000, action: { label: 'Undo', onClick: () => st.restoreCard(deck.id, c, index) } });
  };
  const addPicked = () => {
    const cards = fromSaved.filter((c) => picked.includes(c!.id)).map((c) => ({ text: c!.text, type: (c!.cardType === 'action' ? 'action' : 'question') as 'action' | 'question', intensity: c!.intensity, category: c!.category }));
    const n = st.addCards(deck.id, cards);
    toast(`Added ${n} ${n === 1 ? 'card' : 'cards'}`, { tone: 'ok' });
    setPicked([]); setPicker(false);
  };

  return (
    <Screen title="Edit deck" onBack={() => router.push(`/library/decks/${deck.id}`)} footer={<Button size="lg" full className="mb-4" onClick={() => router.push(`/library/decks/${deck.id}`)}>Done</Button>}>
      <TextField label="Name" value={deck.name} maxLength={30} counter onChange={(e) => st.update(deck.id, { name: e.target.value })}
        onBlur={() => { if (!deck.name.trim()) st.update(deck.id, { name: 'Untitled deck' }); }} />

      <p className="mb-2 mt-6 text-base font-bold text-muted">Who is it for</p>
      <div className="flex flex-wrap gap-2">{AUDIENCES.map((a) => <Chip key={a} selected={deck.audience === a} onClick={() => st.update(deck.id, { audience: a })}>{a}</Chip>)}</div>

      <p className="mb-2 mt-6 text-base font-bold text-muted">Colour</p>
      <div className="flex flex-wrap gap-3">
        {COLORS.map((c) => (
          <button key={c} data-mode={c} aria-label={GAME_MODES[c].name} aria-pressed={deck.color === c} onClick={() => st.update(deck.id, { color: c })}
            className={`h-12 w-12 rounded-full bg-accent ${deck.color === c ? 'ring-4 ring-text ring-offset-4 ring-offset-bg' : ''}`} />
        ))}
      </div>

      <div className="mb-3 mt-8 flex items-end justify-between">
        <h2 className="text-3xl">Cards <span className="text-xl text-muted">{deck.cards.length} of {MAX_DECK_CARDS}</span></h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => setAdding(true)}><Icon name="plus" size={20} />New card</Button>
        <Button variant="secondary" disabled={fromSaved.length === 0} onClick={() => setPicker(true)}>From saved</Button>
      </div>
      {fromSaved.length === 0 && <p className="mt-2 text-sm text-muted">Cards you save in games can be added here.</p>}

      {deck.cards.length === 0 ? <EmptyState art={<Spot name="bubble" />} title="Empty deck." body="Write your first card. A deck plays best with 10 or more." /> : (
        <ul className="mt-2">
          {deck.cards.map((c) => (
            <li key={c.id} className="border-b-2 border-line/60 py-4">
              <button onClick={() => setEditing(c)} className="block w-full text-left">
                <p className="display text-2xl" style={{ lineHeight: 1.1 }}>{c.text}</p>
                <p className="mt-1 text-base text-muted">{c.type === 'action' ? 'Dare' : categoryLabel(c.category)}, intensity {c.intensity} of 5{hasSlot(c.text) ? ', has a blank' : ''}</p>
              </button>
              <button onClick={() => removeCard(c)} className="mt-1 h-tap text-base font-extrabold text-danger">Remove</button>
            </li>
          ))}
        </ul>
      )}

      <CardEditorSheet open={adding || !!editing} card={editing} onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(d) => { if (editing) st.updateCard(deck.id, editing.id, d); else st.addCard(deck.id, d); }} />

      <Sheet open={picker} onClose={() => setPicker(false)} title="Add from saved">
        <ul>
          {fromSaved.map((c) => {
            const on = picked.includes(c!.id);
            return (
              <li key={c!.id}>
                <button aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== c!.id) : [...picked, c!.id])} className="flex w-full items-start gap-3 border-b-2 border-line/60 py-3 text-left">
                  <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${on ? 'border-accent bg-accent text-onaccent' : 'border-line'}`}>{on && <Icon name="check" size={16} />}</span>
                  <span className="text-lg">{c!.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 pb-2"><Button size="lg" full disabled={picked.length === 0} onClick={addPicked}>{picked.length ? `Add ${picked.length}` : 'Pick cards to add'}</Button></div>
      </Sheet>
    </Screen>
  );
}
