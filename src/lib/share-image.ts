/** Draws the recap share image (1080x1920) on a canvas. No player names unless asked. */
import type { GameMode } from '@/types/game';
import { lockupMarkup } from '@/lib/brand/art';

const ACCENT: Record<GameMode, [string, string]> = {
  icebreaker: ['#4274FF', '#FFFFFF'], barkada: ['#FFC72C', '#181310'], lovers: ['#FF82B2', '#181310'],
  spicy: ['#E83C2E', '#FFFFFF'], chaos: ['#FF7022', '#181310'], family: ['#30BE70', '#181310'],
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** The TagAi wordmark as an image in one colour pair, so it matches the deck colour of the night. */
function logoImage(ink: string, card: string, edge: string): Promise<HTMLImageElement | null> {
  const l = lockupMarkup({ text: ink, card: { fill: card, trimA: card, ink: edge, edge } });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 466 150" width="932" height="300">${l.markup}</svg>`;
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

export interface ShareData {
  mode: GameMode; deckName: string; played: number; skipped: number; saved: number; peak: number; cardOfTheNight?: string;
}

export async function renderShareImage(d: ShareData): Promise<Blob | null> {
  const [bg, fg] = ACCENT[d.mode];
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1920;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  try { await document.fonts.load("800 100px 'Archivo Variable'"); } catch { /* fall back to sans-serif */ }
  const font = (w: number, px: number) => `${w} ${px}px 'Archivo Variable', Archivo, Arial, sans-serif`;

  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = fg; ctx.textBaseline = 'top';
  const logo = await logoImage(fg, fg, bg);
  if (logo) ctx.drawImage(logo, 80, 60, 373, 120); else { ctx.font = font(800, 84); ctx.fillText('TagAi', 80, 90); }
  ctx.font = font(700, 48); ctx.fillText(`${d.deckName} deck`, 80, 230);
  ctx.font = font(800, 230);
  wrap(ctx, "That's a wrap.", 920).forEach((l, i) => ctx.fillText(l, 80, 330 + i * 220));

  const stats: [string, string][] = [[String(d.played), 'cards played'], [String(d.skipped), 'skipped'], [String(d.saved), 'saved'], [d.peak.toFixed(1), 'peak heat']];
  stats.forEach(([v, l], i) => {
    const x = 80 + (i % 2) * 480; const y = 880 + Math.floor(i / 2) * 270;
    ctx.fillRect(x, y, 420, 6);
    ctx.font = font(800, 150); ctx.fillText(v, x, y + 24);
    ctx.font = font(600, 44); ctx.fillText(l, x, y + 190);
  });

  if (d.cardOfTheNight) {
    ctx.font = font(700, 40); ctx.fillText('Card of the night', 80, 1450);
    ctx.font = font(800, 64);
    wrap(ctx, d.cardOfTheNight, 920).slice(0, 4).forEach((l, i) => ctx.fillText(l, 80, 1510 + i * 74));
  }
  ctx.font = font(800, 52); ctx.fillText('Take the card or take the shot.', 80, 1700);
  ctx.font = font(600, 40); ctx.fillText('Drink responsibly. Get home safe.', 80, 1800);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
}

/** Native share sheet with the image; falls back to a download. */
export async function shareImage(blob: Blob, filename = 'tagai-recap.png'): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'TagAi' }); return 'shared'; }
  } catch { return 'cancelled'; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}
