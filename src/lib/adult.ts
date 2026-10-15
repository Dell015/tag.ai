import { useSettingsStore } from '@/stores/settings-store';

/** 18+ cards are an ordinary skippable topic. Skipped by default, so a new table has to opt in. */
export const ADULT_TOPIC = '18+ Cards';

/** True when the player's defaults do not skip 18+ cards (used by Browse, Saved and the Shop). */
export const useAdultOn = () => useSettingsStore((s) => !s.skipTopics.includes(ADULT_TOPIC));
