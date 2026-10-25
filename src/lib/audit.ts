/** Admin audit log: labels, filters and helpers. Pure code, so it is easy to test. */
import type { IconName } from '@/components/ui/Icon';

export interface AuditRow {
  id: number; at: string; actor_id: string | null; actor_label: string | null; actor_is_admin: boolean;
  action: string; area: string; target_id: string | null; target_label: string | null;
  summary: string; amount: number | null; meta: Record<string, unknown>;
}

export const AREAS: { id: string; label: string; icon: IconName; paint: 'blue' | 'yellow' | 'pink' | 'red' | 'orange' | 'green' }[] = [
  { id: 'coins', label: 'Coins', icon: 'coin', paint: 'yellow' },
  { id: 'payment', label: 'Payments', icon: 'wallet', paint: 'green' },
  { id: 'player', label: 'Players', icon: 'user', paint: 'blue' },
  { id: 'suggestion', label: 'Suggestions', icon: 'edit', paint: 'pink' },
  { id: 'card', label: 'Cards', icon: 'cards', paint: 'orange' },
  { id: 'post', label: 'Feed', icon: 'users', paint: 'blue' },
  { id: 'message', label: 'Messages', icon: 'mail', paint: 'pink' },
  { id: 'word', label: 'Words', icon: 'alert', paint: 'red' },
  { id: 'admin', label: 'Admins', icon: 'lock', paint: 'red' },
];
export const areaOf = (id: string) => AREAS.find((a) => a.id === id) ?? AREAS[0];

const ACTION_LABELS: Record<string, string> = {
  'coins.pot': 'Pot paid', 'coins.refund': 'Pot refund', 'coins.shop': 'Shop purchase', 'coins.purchase': 'Coin purchase', 'coins.topup': 'Coins added',
  'payment.requested': 'Payment requested', 'payment.paid': 'Payment confirmed', 'payment.rejected': 'Payment rejected', 'payment.cancelled': 'Payment cancelled', 'payment.receipt': 'Receipt uploaded',
  'player.joined': 'Joined', 'player.adult_confirmed': 'Confirmed 18+', 'player.renamed': 'Renamed',
  'suggestion.sent': 'Card suggested', 'suggestion.approved': 'Suggestion approved', 'suggestion.rejected': 'Suggestion rejected',
  'card.added': 'Card added', 'card.retired': 'Card retired', 'card.approved': 'Card approved', 'card.pending': 'Card set to pending',
  'post.created': 'Post created', 'post.hidden': 'Post hidden', 'post.restored': 'Post restored', 'post.deleted': 'Post deleted', 'post.reported': 'Post reported',
  'message.sent': 'Message sent', 'message.claimed': 'Gift claimed',
  'word.added': 'Word blocked', 'word.removed': 'Word unblocked',
  'admin.granted': 'Admin added', 'admin.removed': 'Admin removed',
};
export const ACTION_IDS = Object.keys(ACTION_LABELS);

export function actionLabel(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const tail = action.split('.').slice(1).join(' ').replace(/_/g, ' ');
  return tail ? tail.charAt(0).toUpperCase() + tail.slice(1) : action;
}

export type Who = 'all' | 'admins' | 'players' | 'system';
export type Range = 'all' | 'today' | '7d' | '30d' | 'custom';
export type SortKey = 'at' | 'amount' | 'action' | 'actor' | 'target';

export interface AuditFilters {
  search: string; areas: string[]; actions: string[]; actor: string; target: string; who: Who;
  range: Range; from: string; to: string; min: string; max: string; sort: SortKey; dir: 'asc' | 'desc';
}

export const DEFAULT_FILTERS: AuditFilters = { search: '', areas: [], actions: [], actor: '', target: '', who: 'all', range: 'all', from: '', to: '', min: '', max: '', sort: 'at', dir: 'desc' };

/** How many filters are switched on, for the badge on the Filters button (search and area chips show for themselves). */
export function activeCount(f: AuditFilters): number {
  return [f.actions.length > 0, f.actor.trim() !== '', f.target.trim() !== '', f.who !== 'all', f.range !== 'all', f.min !== '' || f.max !== '', f.sort !== 'at' || f.dir !== 'desc'].filter(Boolean).length;
}

const MANILA = 8 * 60 * 60 * 1000;
/** Midnight in Manila (UTC+8) for the day containing `now`, as an ISO string. */
export function manilaDayStart(now: Date, addDays = 0): string {
  const local = new Date(now.getTime() + MANILA);
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + addDays) - MANILA;
  return new Date(start).toISOString();
}
const dateStart = (d: string, addDays = 0) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day + addDays) - MANILA).toISOString();
};

export function dateRange(f: AuditFilters, now = new Date()): { from: string | null; to: string | null } {
  if (f.range === 'today') return { from: manilaDayStart(now), to: null };
  if (f.range === '7d') return { from: manilaDayStart(now, -6), to: null };
  if (f.range === '30d') return { from: manilaDayStart(now, -29), to: null };
  if (f.range === 'custom') return { from: /^\d{4}-\d{2}-\d{2}$/.test(f.from) ? dateStart(f.from) : null, to: /^\d{4}-\d{2}-\d{2}$/.test(f.to) ? dateStart(f.to, 1) : null };
  return { from: null, to: null };
}

const num = (s: string) => { const n = Number(s); return s.trim() !== '' && Number.isFinite(n) ? n : null; };

/** The arguments for the database function. */
export function rpcArgs(f: AuditFilters, limit: number, offset: number, now = new Date()) {
  const { from, to } = dateRange(f, now);
  return {
    p_search: f.search.trim() || null, p_areas: f.areas.length ? f.areas : null, p_actions: f.actions.length ? f.actions : null,
    p_actor: f.actor.trim() || null, p_target: f.target.trim() || null, p_from: from, p_to: to,
    p_min: num(f.min), p_max: num(f.max), p_who: f.who, p_sort: f.sort, p_dir: f.dir, p_limit: limit, p_offset: offset,
  };
}

const q = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
/** CSV text for a spreadsheet. */
export function toCsv(rows: AuditRow[]): string {
  const head = ['time', 'area', 'action', 'who', 'who_is_admin', 'player', 'summary', 'amount', 'details'];
  const lines = rows.map((r) => [r.at, r.area, r.action, r.actor_label, r.actor_is_admin ? 'yes' : 'no', r.target_label, r.summary, r.amount, JSON.stringify(r.meta)].map(q).join(','));
  return [head.join(','), ...lines].join('\n');
}

const TZ = 'Asia/Manila';
export const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
export const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-PH', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
export const fullTime = (iso: string) => new Date(iso).toLocaleString('en-PH', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'medium' });
