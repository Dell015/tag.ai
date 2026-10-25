'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Chip, EmptyState, Icon, Sheet, TextField, toast } from '@/components/ui';
import { PAINT } from '@/components/ui/Art';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { adminAuditLog } from '@/lib/supabase/account';
import {
  ACTION_IDS, AREAS, DEFAULT_FILTERS, actionLabel, activeCount, areaOf, dayLabel, fullTime, rpcArgs, timeLabel, toCsv,
  type AuditFilters, type AuditRow, type Range, type SortKey, type Who,
} from '@/lib/audit';

const PAGE = 50;
const WHO: { id: Who; label: string }[] = [{ id: 'all', label: 'Anyone' }, { id: 'admins', label: 'Admins' }, { id: 'players', label: 'Players' }, { id: 'system', label: 'System' }];
const RANGES: { id: Range; label: string }[] = [{ id: 'all', label: 'All time' }, { id: 'today', label: 'Today' }, { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }, { id: 'custom', label: 'Pick dates' }];
const SORTS: { id: SortKey; label: string }[] = [{ id: 'at', label: 'Time' }, { id: 'amount', label: 'Amount' }, { id: 'action', label: 'Action' }, { id: 'actor', label: 'Who' }, { id: 'target', label: 'Player' }];
const QUICK: { label: string; sort: SortKey; dir: 'asc' | 'desc' }[] = [
  { label: 'Newest', sort: 'at', dir: 'desc' }, { label: 'Oldest', sort: 'at', dir: 'asc' }, { label: 'Biggest amount', sort: 'amount', dir: 'desc' }, { label: 'Smallest amount', sort: 'amount', dir: 'asc' },
];

const money = (r: AuditRow) => {
  if (r.amount == null) return null;
  if (r.area === 'payment') return { text: `P${r.amount}`, tone: 'text-text' };
  const n = r.amount;
  return { text: `${n > 0 ? '+' : ''}${n}`, tone: n > 0 ? 'text-ok' : n < 0 ? 'text-danger' : 'text-text' };
};

function Row({ r, open, onToggle }: { r: AuditRow; open: boolean; onToggle: () => void }) {
  const a = areaOf(r.area);
  const m = money(r);
  const who = r.actor_label ?? 'system';
  return (
    <li className="border-b border-line/60">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 py-3 text-left">
        <span aria-hidden className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#0c0a08] text-[#181310]" style={{ background: PAINT[a.paint] }}><Icon name={a.icon} size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-extrabold leading-tight">{actionLabel(r.action)}</span>
          <span className="mt-0.5 block break-words text-base leading-snug text-muted">{r.summary}</span>
          <span className="mt-1 block truncate text-sm font-semibold text-muted">
            {who}{r.actor_is_admin && ' (admin)'}{r.target_label && r.target_label !== r.actor_label ? ` to ${r.target_label}` : ''}
          </span>
        </span>
        <span className="shrink-0 text-right">
          {m && <span className={cn('block text-lg font-extrabold tabular-nums', m.tone)}>{m.text}</span>}
          <span className="block text-sm font-semibold text-muted">{timeLabel(r.at)}</span>
        </span>
      </button>
      {open && (
        <dl className="mb-3 ml-[3.25rem] space-y-1 rounded-xl bg-raised p-3 text-sm">
          <div><dt className="inline font-bold">When: </dt><dd className="inline">{fullTime(r.at)}</dd></div>
          <div><dt className="inline font-bold">Action: </dt><dd className="inline">{r.action}</dd></div>
          <div className="break-all"><dt className="inline font-bold">Who: </dt><dd className="inline">{who}{r.actor_is_admin ? ', admin' : ''}</dd></div>
          {r.target_label && <div className="break-all"><dt className="inline font-bold">Player: </dt><dd className="inline">{r.target_label}</dd></div>}
          {Object.keys(r.meta ?? {}).length > 0 && <div className="break-all"><dt className="inline font-bold">Details: </dt><dd className="inline">{Object.entries(r.meta).map(([k, v]) => `${k}: ${String(v)}`).join(', ')}</dd></div>}
          <div><dt className="inline font-bold">Entry: </dt><dd className="inline">#{r.id}</dd></div>
        </dl>
      )}
    </li>
  );
}

/** Everything that happened, newest first. Search, filter, sort, page and export. Built to be used on a phone. */
export function AuditLog() {
  const [f, setF] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [typing, setTyping] = useState('');
  const seq = useRef(0);

  const load = useCallback(async (filters: AuditFilters) => {
    const mine = ++seq.current;
    setState('loading');
    const r = await adminAuditLog(rpcArgs(filters, PAGE, 0));
    if (mine !== seq.current) return;
    if (!r.ok || !r.data) { setState('error'); setError(r.error ?? 'Could not load the log.'); return; }
    setRows(r.data.rows); setTotal(r.data.total); setState('ok'); setError(null); setOpenId(null);
  }, []);

  useEffect(() => { void load(f); }, [f, load]);
  useEffect(() => { const t = setTimeout(() => setF((p) => (p.search === typing ? p : { ...p, search: typing })), 350); return () => clearTimeout(t); }, [typing]);

  const loadMore = async () => {
    setMore(true);
    const r = await adminAuditLog(rpcArgs(f, PAGE, rows.length));
    setMore(false);
    if (r.ok && r.data) { setRows((p) => [...p, ...r.data!.rows]); setTotal(r.data.total); } else toast(r.error ?? 'Could not load more.', { tone: 'warn' });
  };

  const exportCsv = async () => {
    const r = await adminAuditLog(rpcArgs(f, 1000, 0));
    if (!r.ok || !r.data) { toast(r.error ?? 'Could not export.', { tone: 'warn' }); return; }
    const url = URL.createObjectURL(new Blob([toCsv(r.data.rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `tagai-audit-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${r.data.rows.length} rows${r.data.total > 1000 ? ' (the newest 1000)' : ''}`, { tone: 'ok' });
  };

  const quickOn = (q: (typeof QUICK)[number]) => f.sort === q.sort && f.dir === q.dir;
  const n = activeCount(f);
  const reset = () => { setTyping(''); setF(DEFAULT_FILTERS); setDraft(DEFAULT_FILTERS); };
  const openSheet = () => { setDraft(f); setSheet(true); };
  const actionOptions = ACTION_IDS.filter((a) => f.areas.length === 0 || f.areas.includes(a.split('.')[0]));

  let lastDay = '';
  return (
    <div>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Icon name="search" size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={typing} onChange={(e) => setTyping(e.target.value)} maxLength={80} placeholder="Search anything" aria-label="Search the log" enterKeyHint="search"
            className="h-tap w-full rounded-xl border-2 border-line bg-transparent pl-10 pr-3 text-base placeholder:text-muted/60 focus:border-accent" />
        </div>
        <button onClick={openSheet} aria-label={`Filters${n ? `, ${n} on` : ''}`} className="relative flex h-tap shrink-0 items-center gap-2 rounded-xl border-2 border-line px-3 font-extrabold">
          <Icon name="sliders" size={20} />Filters
          {n > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-sm text-onaccent">{n}</span>}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Select label="Show" value={f.areas.length === 1 ? f.areas[0] : f.areas.length === 0 ? 'all' : 'several'} onChange={(e) => setF((p) => ({ ...p, areas: e.target.value === 'all' ? [] : [e.target.value], actions: [] }))}
          options={[{ id: 'all', label: 'Everything' }, ...(f.areas.length > 1 ? [{ id: 'several', label: 'Several' }] : []), ...AREAS.map((a) => ({ id: a.id, label: a.label }))]} />
        <Select label="Order" value={QUICK.find(quickOn)?.label ?? 'custom'} onChange={(e) => { const q = QUICK.find((x) => x.label === e.target.value); if (q) setF((p) => ({ ...p, sort: q.sort, dir: q.dir })); }}
          options={[...QUICK.map((q) => ({ id: q.label, label: q.label })), ...(QUICK.some(quickOn) ? [] : [{ id: 'custom', label: 'Custom' }])]} />
        <Select label="When" value={f.range === 'custom' ? 'custom' : f.range} onChange={(e) => { const r = e.target.value as Range; if (r === 'custom') { setDraft({ ...f, range: 'custom' }); setSheet(true); } else setF((p) => ({ ...p, range: r })); }}
          options={RANGES.map((r) => ({ id: r.id, label: r.id === 'custom' ? 'Pick dates' : r.label }))} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-muted" aria-live="polite">{state === 'loading' && rows.length === 0 ? 'Loading' : `${total.toLocaleString('en-PH')} ${total === 1 ? 'entry' : 'entries'}`}</p>
        <div className="flex gap-2">
          {(n > 0 || f.search || f.areas.length > 0) && <button onClick={reset} className="h-10 rounded-lg px-3 text-base font-bold underline">Clear</button>}
          <button onClick={() => void load(f)} aria-label="Refresh" className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-line"><Icon name="refresh" size={18} /></button>
          <button onClick={() => void exportCsv()} aria-label="Export to a spreadsheet" className="flex h-10 items-center gap-1.5 rounded-lg border-2 border-line px-3 text-base font-bold"><Icon name="download" size={18} />CSV</button>
        </div>
      </div>

      {state === 'error' && <p role="alert" className="mt-3 rounded-xl border-2 border-danger p-3 text-base font-bold text-danger">{error} <button className="underline" onClick={() => void load(f)}>Try again</button></p>}
      {state === 'ok' && rows.length === 0 && <EmptyState title="Nothing matches" body="Try fewer filters or a wider time range." />}

      <ul className={cn('mt-1', state === 'loading' && rows.length > 0 && 'opacity-50')}>
        {rows.map((r) => {
          const day = f.sort === 'at' ? dayLabel(r.at) : '';
          const head = day && day !== lastDay ? (lastDay = day) : null;
          return (
            <div key={r.id}>
              {head && <li className="sticky top-0 z-10 -mx-4 bg-bg/95 px-4 py-2 text-sm font-extrabold text-muted">{head}</li>}
              <Row r={r} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} />
            </div>
          );
        })}
      </ul>
      {rows.length < total && <Button full variant="secondary" className="mt-4" disabled={more} onClick={() => void loadMore()}>{more ? 'Loading' : `Show ${Math.min(PAGE, total - rows.length)} more`}</Button>}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filters">
        <div className="space-y-5 pb-2">
          <section>
            <h3 className="text-lg font-extrabold">Who did it</h3>
            <div className="mt-2 flex flex-wrap gap-2">{WHO.map((w) => <Chip key={w.id} selected={draft.who === w.id} onClick={() => setDraft({ ...draft, who: w.id })}>{w.label}</Chip>)}</div>
            <div className="mt-3"><TextField label="Their email contains" value={draft.actor} maxLength={60} autoCapitalize="none" onChange={(e) => setDraft({ ...draft, actor: e.target.value })} /></div>
          </section>
          <section>
            <TextField label="Player affected, email contains" value={draft.target} maxLength={60} autoCapitalize="none" onChange={(e) => setDraft({ ...draft, target: e.target.value })} />
          </section>
          <section>
            <h3 className="text-lg font-extrabold">When</h3>
            <div className="mt-2 flex flex-wrap gap-2">{RANGES.map((r) => <Chip key={r.id} selected={draft.range === r.id} onClick={() => setDraft({ ...draft, range: r.id })}>{r.label}</Chip>)}</div>
            {draft.range === 'custom' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <TextField label="From" type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
                <TextField label="Until" type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
              </div>
            )}
          </section>
          <section>
            <h3 className="text-lg font-extrabold">Amount</h3>
            <p className="text-sm text-muted">Coins or pesos, depending on the entry. Negative numbers are spending.</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <TextField label="At least" inputMode="decimal" value={draft.min} maxLength={8} onChange={(e) => setDraft({ ...draft, min: e.target.value.replace(/[^\d.-]/g, '') })} />
              <TextField label="At most" inputMode="decimal" value={draft.max} maxLength={8} onChange={(e) => setDraft({ ...draft, max: e.target.value.replace(/[^\d.-]/g, '') })} />
            </div>
          </section>
          <section>
            <h3 className="text-lg font-extrabold">What happened</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {actionOptions.map((a) => <Chip key={a} selected={draft.actions.includes(a)} onClick={() => setDraft({ ...draft, actions: draft.actions.includes(a) ? draft.actions.filter((x) => x !== a) : [...draft.actions, a] })}>{actionLabel(a)}</Chip>)}
            </div>
          </section>
          <section>
            <h3 className="text-lg font-extrabold">Sort by</h3>
            <div className="mt-2 flex flex-wrap gap-2">{SORTS.map((s) => <Chip key={s.id} selected={draft.sort === s.id} onClick={() => setDraft({ ...draft, sort: s.id })}>{s.label}</Chip>)}</div>
            <div className="mt-2 flex gap-2">
              <Chip selected={draft.dir === 'desc'} onClick={() => setDraft({ ...draft, dir: 'desc' })}>{draft.sort === 'at' ? 'Newest first' : 'High to low, Z to A'}</Chip>
              <Chip selected={draft.dir === 'asc'} onClick={() => setDraft({ ...draft, dir: 'asc' })}>{draft.sort === 'at' ? 'Oldest first' : 'Low to high, A to Z'}</Chip>
            </div>
          </section>
          <div className="sticky bottom-0 -mx-1 flex gap-3 bg-panel px-1 pt-2">
            <Button size="lg" className="flex-1" onClick={() => { setF({ ...draft, search: f.search, areas: draft.areas }); setSheet(false); }}>Show results</Button>
            <Button size="lg" variant="secondary" onClick={() => { setDraft({ ...DEFAULT_FILTERS, search: f.search, areas: f.areas }); }}>Reset</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
