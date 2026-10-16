/** Retired filter name. Older saved settings may still carry it, so it is stripped when a game is set up. */
export const ADULT_TOPIC = '18+ Cards';

/**
 * 18+ cards are now the Adult deck, bought like any other. The app itself is for adults only
 * (the welcome screen asks), and the table confirms again before the Adult deck is used.
 */
export const useAdultOn = () => true;
