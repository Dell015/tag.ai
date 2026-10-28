import { BRAND, cardMarkup, lockupMarkup } from '@/lib/brand/art';
import { cn } from '@/lib/cn';

/**
 * The TagAi wordmark: the A is a tilted printed card. Size it with font size (the height is 1.1em).
 * `mark` draws only the card (for tight spaces and app icons).
 */
export function Logo({ className, mark }: { className?: string; mark?: boolean }) {
  if (mark) {
    return (
      <svg role="img" aria-label="TagAi" viewBox="-70 -70 140 140" style={{ height: '1.1em', width: '1.1em' }} className={cn('inline-block align-middle', className)}
        dangerouslySetInnerHTML={{ __html: `<g transform="rotate(-12) scale(.5)">${cardMarkup({ fill: BRAND.yellow, glyph: 'a' })}</g>` }} />
    );
  }
  const l = lockupMarkup({ text: BRAND.cream, card: { fill: BRAND.yellow, trimA: BRAND.yellow, ink: BRAND.ink, edge: BRAND.ink } });
  return (
    <svg role="img" aria-label="TagAi" viewBox="0 0 466 150" style={{ height: '1.1em', width: 'auto', overflow: 'visible' }} className={cn('inline-block align-middle', className)}
      dangerouslySetInnerHTML={{ __html: l.markup }} />
  );
}
