/**
 * Card suggestions: players write cards, others like them, and the top contributor of each week
 * wins free coins. Pure functions here; the store keeps the data. Stage B: moderation, real
 * accounts and the weekly payout move to the server.
 */

export const SUGGEST_KINDS = ['truth', 'dare', 'dice', 'coin', 'bottle', 'wheel', 'rule'] as const;
export type SuggestKind = (typeof SUGGEST_KINDS)[number];
/** Decks a suggestion can go to. Social media is not ready and Chaos is a mix of the others. */
export const SUGGEST_DECKS = ['icebreaker', 'family', 'life', 'deep', 'barkada', 'lovers', 'spicy', 'adult'] as const;
export type SuggestDeck = (typeof SUGGEST_DECKS)[number];

/** Coins the top contributor of a week receives. Placeholder amount, the owner decides. */
export const WEEKLY_REWARD = 10;
export const MIN_LEN = 15;
export const MAX_LEN = 160;
export const MAX_PER_DAY = 5;
/** One card is worth 1 point, each like from someone else is worth 2. */
export const POINTS_PER_CARD = 1;
export const POINTS_PER_LIKE = 2;

export interface Suggestion {
  id: string;
  text: string;
  kind: SuggestKind;
  deckId: SuggestDeck;
  authorId: string;
  authorName: string;
  createdAt: number;
  /** Ids of the players who liked it. The author cannot like their own card. */
  likes: string[];
  /** Sample cards that ship with the app so the board is not empty. */
  sample?: boolean;
}

export interface Contributor { authorId: string; name: string; cards: number; likes: number; points: number }

const DAY = 86_400_000;

/** Monday 00:00 (local time) of the week the timestamp falls in. */
export function weekStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const back = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - back);
  return d.getTime();
}
export const nextWeekStart = (ts: number): number => { const d = new Date(weekStart(ts)); d.setDate(d.getDate() + 7); return d.getTime(); };
export const prevWeekStart = (ts: number): number => { const d = new Date(weekStart(ts)); d.setDate(d.getDate() - 7); return d.getTime(); };
export const weekKey = (ts: number): string => { const d = new Date(weekStart(ts)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Why a suggestion cannot be sent, or null when it is fine. */
export function validateSuggestion(text: string, authorId: string, items: Suggestion[], now: number): string | null {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length < MIN_LEN) return `Write at least ${MIN_LEN} characters.`;
  if (t.length > MAX_LEN) return `Keep it under ${MAX_LEN} characters.`;
  if (items.some((s) => s.text.toLowerCase() === t.toLowerCase())) return 'Someone already suggested this card.';
  if (items.filter((s) => s.authorId === authorId && now - s.createdAt < DAY).length >= MAX_PER_DAY) return `You can send ${MAX_PER_DAY} cards a day. Come back tomorrow.`;
  return null;
}

/** Ranking for the week that starts at `start`: cards written that week, likes those cards got. */
export function weeklyRanking(items: Suggestion[], start: number): Contributor[] {
  const end = start + 7 * DAY + 3_600_000; // tolerate a daylight saving shift
  const nextStart = (() => { const d = new Date(start); d.setDate(d.getDate() + 7); return d.getTime(); })();
  const by = new Map<string, Contributor>();
  for (const s of items) {
    if (s.createdAt < start || s.createdAt >= Math.min(end, nextStart)) continue;
    const c = by.get(s.authorId) ?? { authorId: s.authorId, name: s.authorName, cards: 0, likes: 0, points: 0 };
    c.cards += 1; c.likes += s.likes.filter((l) => l !== s.authorId).length;
    c.points = c.cards * POINTS_PER_CARD + c.likes * POINTS_PER_LIKE;
    by.set(s.authorId, c);
  }
  return Array.from(by.values()).sort((a, b) => b.points - a.points || b.likes - a.likes || a.name.localeCompare(b.name));
}

/** The winner of a finished week, or null when nobody got a like (a week of spam earns nothing). */
export function weekWinner(items: Suggestion[], start: number): Contributor | null {
  const top = weeklyRanking(items, start)[0];
  return top && top.likes > 0 ? top : null;
}

/** Sample contributors so a new install shows a live board. Times are relative to `now`. */
export function sampleSuggestions(now: number): Suggestion[] {
  const thisWeek = weekStart(now);
  const lastWeek = prevWeekStart(now);
  const mk = (i: number, authorName: string, text: string, kind: SuggestKind, deckId: SuggestDeck, at: number, likes: number): Suggestion => ({
    id: `sample-${i}`, text, kind, deckId, authorName, authorId: `sample-${authorName}`, createdAt: Math.min(at, now - 60_000), sample: true,
    likes: Array.from({ length: likes }, (_, k) => `fan-${i}-${k}`),
  });
  return [
    mk(1, 'titacora', 'Name three things in your bag without looking. Miss one and take a shot.', 'dare', 'barkada', thisWeek + 3_600_000, 9),
    mk(2, 'kuyamigs', 'What is the most expensive thing you bought just to impress someone?', 'truth', 'life', thisWeek + 7_200_000, 6),
    mk(3, 'spicygal', 'Flip the coin. Heads: you pick who takes a shot. Tails: you take two.', 'coin', 'spicy', thisWeek + 10_800_000, 4),
    mk(4, 'chaoskid', 'Roll the die. Your number is how many seconds you hold eye contact with the player on your left.', 'dice', 'barkada', thisWeek + 14_400_000, 3),
    mk(5, 'lovebirds_ph', 'What small thing did someone do for you that you still think about?', 'truth', 'deep', thisWeek + 18_000_000, 2),
    mk(6, 'titacora', 'Everyone speaks only in questions until the next wild card. Whoever slips takes a shot.', 'rule', 'barkada', lastWeek + 3_600_000, 12),
    mk(7, 'kuyamigs', 'Spin the bottle. The player it lands on shares the last photo in their gallery.', 'bottle', 'barkada', lastWeek + 7_200_000, 8),
    mk(8, 'byahero', 'What is a place you want to go back to and why?', 'truth', 'icebreaker', lastWeek + 10_800_000, 3),
  ];
}
