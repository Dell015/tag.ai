'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, Chip, NumberStepper, SegmentedControl, Sheet } from '@/components/ui';
import { MAX_CARD_CHARS, SLOT, type DeckCard } from '@/stores/deck-store';
import { CATEGORIES } from './common';
import type { CardCategory } from '@/types/game';

type Draft = Omit<DeckCard, 'id'>;
const BLANK: Draft = { text: '', type: 'question', intensity: 2, category: 'hot_takes' };

/** Create or edit one card. `card` set means edit. */
export function CardEditorSheet({ open, card, onClose, onSave }: { open: boolean; card?: DeckCard | null; onClose: () => void; onSave: (d: Draft) => void }) {
  const [d, setD] = useState<Draft>(BLANK);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (open) setD(card ? { text: card.text, type: card.type, intensity: card.intensity, category: card.category } : BLANK); }, [open, card]);

  const insertSlot = () => {
    const el = ref.current;
    const pos = el?.selectionStart ?? d.text.length;
    const text = (d.text.slice(0, pos) + SLOT + d.text.slice(pos)).slice(0, MAX_CARD_CHARS);
    setD({ ...d, text });
  };
  const trimmed = d.text.trim();
  const tooShort = trimmed.length < 8;

  return (
    <Sheet open={open} onClose={onClose} title={card ? 'Edit card' : 'New card'}>
      <label htmlFor="card-text" className="mb-1.5 flex justify-between text-base font-bold text-muted"><span>Card text</span><span>{d.text.length}/{MAX_CARD_CHARS}</span></label>
      <textarea id="card-text" ref={ref} value={d.text} maxLength={MAX_CARD_CHARS} rows={4} onChange={(e) => setD({ ...d, text: e.target.value })}
        placeholder="Who here would survive longest on a deserted island?" className="w-full rounded-xl border-2 border-line bg-transparent p-4 text-xl leading-snug placeholder:text-muted/50 focus:border-accent" />
      <button type="button" onClick={insertSlot} className="mt-2 h-tap text-base font-extrabold text-accent">Insert blank [SLOT]</button>
      <p className="text-sm text-muted">A blank is filled with a name, place or memory from your group before the game starts.</p>

      <div className="mt-5"><SegmentedControl<'question' | 'action'> label="Card type" value={d.type} onChange={(t) => setD({ ...d, type: t, category: t === 'action' ? 'dares' : d.category === 'dares' ? 'hot_takes' : d.category })}
        options={[{ id: 'question', label: 'Question' }, { id: 'action', label: 'Dare' }]} /></div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xl font-bold">Intensity</span>
        <NumberStepper label="intensity" value={d.intensity} min={1} max={5} onChange={(v) => setD({ ...d, intensity: v })} />
      </div>

      <p className="mb-2 mt-5 text-xl font-bold">Category</p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.filter((c) => (d.type === 'action' ? c.id === 'dares' : c.id !== 'dares')).map((c) => (
          <Chip key={c.id} selected={d.category === c.id} onClick={() => setD({ ...d, category: c.id as CardCategory })}>{c.label}</Chip>
        ))}
      </div>

      <div className="mt-6 space-y-3 pb-2">
        <Button size="lg" full disabled={tooShort} onClick={() => { onSave({ ...d, text: trimmed }); onClose(); }}>{tooShort ? 'Write at least 8 characters' : card ? 'Save card' : 'Add card'}</Button>
        <Button full variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </Sheet>
  );
}
