'use client';
import { Avatar, Button } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

interface Seatable { userId: string; displayName: string; avatarUrl: string }

/**
 * The table, seen from above. Tap names in the order people sit (clockwise) and each one drops into the next
 * seat. Tap someone already seated to take them back off. Seat 1 plays first.
 */
export function SeatCircle({ players, order, onChange }: { players: Seatable[]; order: string[]; onChange: (order: string[]) => void }) {
  const n = players.length;
  const byId = new Map(players.map((p) => [p.userId, p]));
  const seated = order.filter((id) => byId.has(id));
  const waiting = players.filter((p) => !seated.includes(p.userId));
  const pos = (i: number) => {
    const a = ((i / Math.max(n, 1)) * 360 - 90) * (Math.PI / 180);
    return { left: `${50 + Math.cos(a) * 38}%`, top: `${50 + Math.sin(a) * 38}%` };
  };
  const sit = (id: string) => { haptic('tap'); onChange([...seated, id]); };
  const stand = (id: string) => { haptic('tap'); onChange(seated.filter((x) => x !== id)); };
  const shuffle = () => {
    haptic('success');
    const ids = players.map((p) => p.userId);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    onChange(ids);
  };

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-[21rem]" role="list" aria-label="Seats around the table">
        <div aria-hidden className="absolute inset-[16%] rounded-full border-2 border-dashed border-line" />
        <p aria-hidden className="sign absolute inset-0 flex items-center justify-center text-center text-xl text-muted">
          {seated.length === n && n > 0 ? 'Ready' : `${seated.length} of ${n}`}
        </p>
        {Array.from({ length: n }, (_, i) => {
          const p = seated[i] ? byId.get(seated[i]) : undefined;
          return (
            <div key={i} role="listitem" style={pos(i)} className="absolute flex w-[4.6rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              {p ? (
                <button onClick={() => stand(p.userId)} aria-label={`Seat ${i + 1}, ${p.displayName}. Tap to take off`} className="pop-in relative active:scale-95">
                  <Avatar value={p.avatarUrl} name={p.displayName} size={52} />
                  <span className="sign absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-onaccent">{i + 1}</span>
                </button>
              ) : (
                <span aria-label={`Seat ${i + 1}, empty`} className={cn('sign flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-dashed text-lg', i === seated.length ? 'border-accent text-accent' : 'border-line text-muted')}>{i + 1}</span>
              )}
              <span className="mt-1 w-full truncate text-center text-sm font-bold">{p?.displayName ?? ''}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 min-h-[4.5rem]">
        {waiting.length > 0 ? (
          <>
            <p className="mb-2 text-base font-bold text-muted">Tap the next person, going clockwise</p>
            <ul className="flex flex-wrap gap-2">
              {waiting.map((p) => (
                <li key={p.userId}>
                  <button onClick={() => sit(p.userId)} className="flex min-h-tap items-center gap-2 rounded-full border-2 border-line py-1 pl-1 pr-4 text-lg font-bold active:scale-95">
                    <Avatar value={p.avatarUrl} name={p.displayName} size={34} />
                    <span className="max-w-[8rem] truncate">{p.displayName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-base font-semibold text-ok">Everyone has a seat. {players.find((p) => p.userId === seated[0])?.displayName} goes first.</p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={shuffle}>Shuffle for me</Button>
        <Button variant="secondary" disabled={seated.length === 0} onClick={() => { haptic('tap'); onChange([]); }}>Start over</Button>
      </div>
    </div>
  );
}
