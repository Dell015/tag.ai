/** Brand artwork as plain SVG markup, drawn on fixed grids so the logo, app icon, intro and card art all share one source. */
export const BRAND = { yellow: '#FFC72C', ink: '#181310', cream: '#F4F1EC', white: '#FFFFFF' } as const;

export const CARD_W = 150;
export const CARD_H = 214;

export type LetterKey = 'T' | 'A' | 'G' | 'I';

/** Letters of the wordmark on a 100 tall grid, top left at 0,0. They draw in currentColor. */
export const LETTERS: Record<LetterKey, { w: number; markup: string }> = {
  T: { w: 80, markup: '<rect x="0" y="0" width="80" height="26" fill="currentColor"/><rect x="27" y="0" width="26" height="100" fill="currentColor"/>' },
  A: { w: 90, markup: '<path fill="currentColor" fill-rule="evenodd" d="M34.6 0 L55.4 0 L91.3 100 L64.7 100 L59 84 L31 84 L25.3 100 L-1.3 100 Z M45 45.1 L51.8 64 L38.2 64 Z"/>' },
  G: { w: 90, markup: '<path d="M78 12 H26 Q12 12 12 26 V74 Q12 88 26 88 H78 V52 H48" fill="none" stroke="currentColor" stroke-width="24"/>' },
  I: { w: 26, markup: '<rect x="0" y="0" width="26" height="100" fill="currentColor"/>' },
};

/** The big question mark printed on a plain deck card. Centered on 0,0. */
const QMARK = '<path d="M-24 -26 C-24 -58 26 -58 26 -28 C26 -8 0 -10 0 14" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round"/><circle cx="0" cy="38" r="9" fill="currentColor"/>';

export interface CardArt {
  fill: string;
  /** Colour of the printed glyph. */
  ink?: string;
  /** Border and the dark half of the trim stripes. */
  edge?: string;
  /** Light half of the trim stripes (the face colour by default). */
  trimA?: string;
  glyph?: 'q' | 'a' | 'none';
  /** Face and shadow only, for the gooey melt. */
  plain?: boolean;
}

const slug = (c: string) => c.replace(/[^0-9a-z]/gi, '');

/** One of our printed cards, centered on 0,0 and 150 by 214: face, ink border, hazard trim top and bottom, a lower edge like a key. */
export function cardMarkup(o: CardArt): string {
  const edge = o.edge ?? BRAND.ink;
  const trimA = o.trimA ?? o.fill;
  const ink = o.ink ?? BRAND.ink;
  const x = -CARD_W / 2, y = -CARD_H / 2;
  const shadow = `<rect x="${x}" y="${y + 6}" width="${CARD_W}" height="${CARD_H}" rx="16" fill="rgba(0,0,0,.4)"/>`;
  const face = `<rect data-face x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="16" fill="${o.fill}"/>`;
  if (o.plain) return shadow + face;
  const pid = `tp${slug(trimA)}${slug(edge)}`;
  const defs = `<defs><clipPath id="brandcardclip"><rect x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="16"/></clipPath>` +
    `<pattern id="${pid}" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="24" fill="${trimA}"/><rect x="12" width="12" height="24" fill="${edge}"/></pattern></defs>`;
  const trim = `<g clip-path="url(#brandcardclip)"><rect x="${x}" y="${y}" width="${CARD_W}" height="14" fill="url(#${pid})"/><rect x="${x}" y="${CARD_H / 2 - 14}" width="${CARD_W}" height="14" fill="url(#${pid})"/></g>`;
  const border = `<rect x="${x + 1.5}" y="${y + 1.5}" width="${CARD_W - 3}" height="${CARD_H - 3}" rx="15" fill="none" stroke="${edge}" stroke-width="3"/>`;
  const glyph = o.glyph === 'q'
    ? `<g class="bc-q" transform="translate(0 4) scale(1.15)" style="color:${ink}">${QMARK}</g>`
    : o.glyph === 'a'
      ? `<g class="bc-a" transform="translate(-45 -48)" style="color:${ink}">${LETTERS.A.markup}</g>`
      : '';
  return defs + shadow + face + trim + border + glyph;
}

/** The wordmark: TAG, the card A, then I. Returns the markup and its size (466 by 150 around y 75). */
export function lockupMarkup(o: { text: string; card: CardArt; cardScale?: number }): { markup: string; width: number; height: number } {
  const cy = 75;
  const letter = (k: LetterKey, x: number) => `<g transform="translate(${x} ${cy - 50})" style="color:${o.text}">${LETTERS[k].markup}</g>`;
  const s = o.cardScale ?? 0.61;
  const card = `<g transform="translate(366 ${cy}) rotate(-12) scale(${s})">${cardMarkup({ glyph: 'a', ...o.card })}</g>`;
  return { markup: letter('T', 0) + letter('A', 96) + letter('G', 202) + card + letter('I', 440), width: 466, height: 150 };
}
