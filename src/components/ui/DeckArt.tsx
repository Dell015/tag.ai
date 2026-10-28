import { deckArt } from '@/lib/brand/deck-art';

/** The picture printed on a deck's cards. Draws in the surrounding text colour (on-accent on a deck card). */
export function DeckArt({ id, size = 64, className }: { id: string; size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="-50 -50 100 100" className={className} dangerouslySetInnerHTML={{ __html: deckArt(id) }} />
  );
}
