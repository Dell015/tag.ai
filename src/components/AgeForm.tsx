'use client';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { isAdultBirth } from '@/lib/age';

const box = 'h-cta w-full rounded-xl border-2 border-line bg-transparent px-2 text-center text-3xl font-extrabold placeholder:text-muted/50 focus:border-accent';

/** Asks for a birth date. Calls onAdult or onUnderage, and keeps the date to itself. */
export function AgeForm({ onAdult, onUnderage, busy }: { onAdult: () => void; onUnderage: () => void; busy?: boolean }) {
  const [d, setD] = useState('');
  const [m, setM] = useState('');
  const [y, setY] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
    const r = isAdultBirth(Number(d), Number(m), Number(y));
    if (r === null) { setError('That date does not look right. Check the day, month and year.'); return; }
    setError('');
    if (r) onAdult(); else onUnderage();
  };
  const digits = (v: string, n: number) => v.replace(/\D/g, '').slice(0, n);
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-1 flex-col">
      <div className="mt-6 grid grid-cols-[1fr_1fr_1.6fr] gap-3">
        <label className="block"><span className="mb-1 block text-base font-bold text-muted">Day</span><input inputMode="numeric" autoComplete="bday-day" placeholder="DD" value={d} onChange={(e) => setD(digits(e.target.value, 2))} className={box} /></label>
        <label className="block"><span className="mb-1 block text-base font-bold text-muted">Month</span><input inputMode="numeric" autoComplete="bday-month" placeholder="MM" value={m} onChange={(e) => setM(digits(e.target.value, 2))} className={box} /></label>
        <label className="block"><span className="mb-1 block text-base font-bold text-muted">Year</span><input inputMode="numeric" autoComplete="bday-year" placeholder="YYYY" value={y} onChange={(e) => setY(digits(e.target.value, 4))} className={box} /></label>
      </div>
      <p className="mt-3 text-base text-muted">We only use this to check your age. We do not keep your birth date.</p>
      {error && <p role="alert" className="mt-3 text-base font-bold text-red-400">{error}</p>}
      <div className="mt-auto pt-8">
        <Button size="lg" full type="submit" disabled={busy || d.length < 1 || m.length < 1 || y.length < 4}>Continue</Button>
      </div>
    </form>
  );
}
