'use client';
import { useMemo, useState } from 'react';
import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { MONTHS, monthCells } from '@/lib/calendar';
import { isAdultBirth } from '@/lib/age';

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const select = 'h-11 min-w-0 rounded-lg border-2 border-line bg-panel px-2 text-base font-extrabold text-text focus:border-accent';

/** Asks for a birth date with a calendar. Calls onAdult or onUnderage, and keeps the date to itself. */
export function AgeForm({ onAdult, onUnderage, busy }: { onAdult: () => void; onUnderage: () => void; busy?: boolean }) {
  const today = useMemo(() => new Date(), []);
  const thisYear = today.getFullYear();
  const [vy, setVy] = useState(thisYear - 22); // the view starts where most players were born
  const [vm, setVm] = useState(0);
  const [sel, setSel] = useState<{ d: number; m: number; y: number } | null>(null);
  const [error, setError] = useState('');

  const cells = useMemo(() => monthCells(vy, vm), [vy, vm]);
  const years = useMemo(() => Array.from({ length: 101 }, (_, i) => thisYear - i), [thisYear]);
  const isFuture = (d: number) => new Date(vy, vm, d) > today;
  const atEnd = vy === thisYear && vm === today.getMonth();
  const atStart = vy === years[years.length - 1] && vm === 0;

  const step = (delta: number) => {
    const t = new Date(vy, vm + delta, 1);
    if (t.getFullYear() > thisYear || t.getFullYear() < years[years.length - 1]) return;
    setVy(t.getFullYear()); setVm(t.getMonth());
  };

  const submit = () => {
    if (!sel) return;
    const r = isAdultBirth(sel.d, sel.m + 1, sel.y);
    if (r === null) { setError('That date does not look right. Pick it again.'); return; }
    setError('');
    if (r) onAdult(); else onUnderage();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-1 flex-col">
      <div className="mt-6 rounded-card border-2 border-line p-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} disabled={atStart} aria-label="Previous month" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line disabled:opacity-30"><Icon name="back" size={20} /></button>
          <select aria-label="Month" value={vm} onChange={(e) => setVm(Number(e.target.value))} className={cn(select, 'flex-1')}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select aria-label="Year" value={vy} onChange={(e) => setVy(Number(e.target.value))} className={cn(select, 'w-24')}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="button" onClick={() => step(1)} disabled={atEnd} aria-label="Next month" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line disabled:opacity-30"><Icon name="chevron" size={20} /></button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-y-1 text-center" role="grid" aria-label={`${MONTHS[vm]} ${vy}`}>
          {WEEK.map((w) => <span key={w} className="pb-1 text-sm font-bold text-muted">{w}</span>)}
          {cells.map((d, i) => {
            if (d === null) return <span key={`b${i}`} />;
            const on = sel?.d === d && sel.m === vm && sel.y === vy;
            return (
              <button
                key={d} type="button" disabled={isFuture(d)} aria-pressed={on} aria-label={`${d} ${MONTHS[vm]} ${vy}`}
                onClick={() => { setSel({ d, m: vm, y: vy }); setError(''); }}
                className={cn('mx-auto flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold transition-colors disabled:opacity-25', on ? 'bg-accent text-onaccent' : 'active:bg-raised')}
              >{d}</button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 h-16">
        {sel ? (
          <div key={`${sel.d}-${sel.m}-${sel.y}`} className="pop-in flex h-full items-center justify-between overflow-hidden rounded-card border-[3px] border-[#181310] bg-accent pl-4 text-onaccent">
            <span className="sign text-xl">{sel.d} {MONTHS[sel.m].slice(0, 3)} {sel.y}</span>
            <span className="trim h-full w-6" />
          </div>
        ) : (
          <div className="flex h-full items-center rounded-card border-2 border-dashed border-line px-4 text-lg font-medium text-muted">Tap the day you were born.</div>
        )}
      </div>
      <p className="mt-3 text-base text-muted">We only use this to check your age. We do not keep your birth date.</p>
      {error && <p role="alert" className="mt-3 text-base font-bold text-danger">{error}</p>}
      <div className="mt-auto pt-6">
        <Button size="lg" full type="submit" disabled={busy || !sel}>Continue</Button>
      </div>
    </form>
  );
}
