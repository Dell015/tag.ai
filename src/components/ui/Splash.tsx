import { BRAND, LETTERS, cardMarkup } from '@/lib/brand/art';

const letter = (k: 'T' | 'A' | 'G' | 'I', x: number, i: number) =>
  `<g class="splash-letter" style="animation-delay:${i * 0.07}s"><g transform="translate(${x} 25)" style="color:${BRAND.cream}">${LETTERS[k].markup}</g></g>`;

const MARKUP =
  letter('T', 0, 0) + letter('A', 96, 1) + letter('G', 202, 2) +
  `<g class="splash-card"><g class="splash-rock"><g transform="translate(366 75) rotate(-12) scale(.61)">${cardMarkup({ glyph: 'a', fill: BRAND.yellow, trimA: BRAND.yellow, ink: BRAND.ink, edge: BRAND.ink })}</g></g></g>` +
  letter('I', 440, 3);

/** Shown while the app loads: the wordmark builds itself and the card A lands and rocks until the screen is ready. */
export function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6" role="status" aria-label="Loading TagAi">
      <svg aria-hidden viewBox="0 0 466 150" className="w-[min(78vw,22rem)] overflow-visible" dangerouslySetInnerHTML={{ __html: MARKUP }} />
      <p className="splash-line text-lg font-extrabold text-accent">Take the card or take the shot.</p>
    </div>
  );
}
