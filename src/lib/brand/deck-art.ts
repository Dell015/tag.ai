/** One flat picture per deck, drawn in currentColor on a -50..50 grid. Printed on deck cards in place of the old question mark. */
const S = 'fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor"';

const HEART = 'M0 12 C-26 -6 -22 -30 -8 -30 C-3 -30 0 -26 0 -22 C0 -26 3 -30 8 -30 C22 -30 26 -6 0 12 Z';

export const DECK_ART: Record<string, string> = {
  // An ice cube with a crack and a shine: breaking the ice.
  icebreaker: `<g transform="rotate(12)"><rect x="-27" y="-27" width="54" height="54" rx="10" ${S}/><path d="M-4 -27 L4 -8 L-9 3 L1 27" ${S} stroke-width="6"/><path d="M-18 -16 L-18 -9" ${S} stroke-width="6"/></g>`,
  // A house with a heart in the window.
  family: `<path d="M-36 -2 L0 -36 L36 -2" ${S}/><path d="M-26 -4 V32 H26 V-4" ${S}/><g transform="translate(0 14) scale(.62)"><path d="${HEART}" ${F}/></g>`,
  // Sun coming up over the horizon.
  life: `<path d="M-22 14 A22 22 0 0 1 22 14" ${S}/><path d="M-40 14 H40" ${S}/><path d="M0 -26 V-14 M-28 -16 L-20 -8 M28 -16 L20 -8 M-38 -2 H-30 M38 -2 H30" ${S} stroke-width="6"/><path d="M-22 30 H22" ${S} stroke-width="6"/>`,
  // Ripples spreading from a dropped stone.
  deep: `<circle cx="0" cy="0" r="8" ${F}/><circle cx="0" cy="0" r="22" ${S} stroke-width="6"/><path d="M-36 0 A36 36 0 0 1 36 0" ${S} stroke-width="6"/><path d="M36 0 A36 36 0 0 1 -36 0" ${S} stroke-width="6" stroke-dasharray="3 14"/>`,
  // Two glasses clinking.
  barkada: `<g transform="translate(-19 8) rotate(-14)"><path d="M-13 -22 H13 L10 28 H-10 Z" ${S}/><path d="M-11 -4 H11" ${S} stroke-width="5"/></g><g transform="translate(19 8) rotate(14)"><path d="M-13 -22 H13 L10 28 H-10 Z" ${S}/><path d="M-11 -4 H11" ${S} stroke-width="5"/></g><path d="M0 -38 V-28 M-10 -35 L-6 -28 M10 -35 L6 -28" ${S} stroke-width="5"/>`,
  // Two hearts, one inside the other's shadow.
  lovers: `<g transform="translate(-8 -2) scale(1.2)"><path d="${HEART}" ${S} stroke-width="5.5"/></g><g transform="translate(18 14) scale(.62)"><path d="${HEART}" ${F}/></g>`,
  // A flame with a small flame inside.
  spicy: `<path d="M2 -40 C8 -22 30 -12 30 10 C30 28 17 38 0 38 C-17 38 -30 28 -30 12 C-30 0 -23 -8 -16 -14 C-14 -4 -9 0 -5 -3 C-9 -17 -5 -30 2 -40 Z" ${S}/><path d="M0 8 C6 14 12 18 12 25 C12 31 6 34 0 34 C-6 34 -12 31 -12 25 C-12 19 -4 16 0 8 Z" ${F}/>`,
  // Moon and a spark: after dark.
  adult: `<path d="M8 -36 A36 36 0 1 0 36 12 A28 28 0 0 1 8 -36 Z" ${F}/><path d="M26 -30 L29 -22 L37 -19 L29 -16 L26 -8 L23 -16 L15 -19 L23 -22 Z" ${F}/>`,
  // A phone with a heart on the screen.
  social: `<rect x="-20" y="-38" width="40" height="76" rx="9" ${S}/><path d="M-5 -30 H5" ${S} stroke-width="5"/><g transform="translate(0 2) scale(.6)"><path d="${HEART}" ${F}/></g>`,
  // A lightning bolt.
  chaos: `<path d="M10 -40 L-24 6 H-3 L-12 40 L26 -10 H4 Z" ${F} stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>`,
};

export const deckArt = (id: string): string => DECK_ART[id] ?? DECK_ART.barkada;
