/** Card text shrinks as it gets longer, so a full 160-character card still fits its card. Literal class names so Tailwind keeps them. */
export function cardTextClass(len: number, large = false): string {
  if (large) return len <= 40 ? 'text-[1.9rem]' : len <= 80 ? 'text-[1.55rem]' : len <= 120 ? 'text-[1.3rem]' : 'text-[1.12rem]';
  return len <= 40 ? 'text-[1.6rem]' : len <= 80 ? 'text-[1.35rem]' : len <= 120 ? 'text-[1.15rem]' : 'text-[1rem]';
}
