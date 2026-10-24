import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { TalkTopic } from '@/lib/data/talk-topics';

/**
 * Cards and topics loaded from the database while signed in. Empty until loaded, and the app then
 * uses the copies bundled with it, so a play session never waits on the network.
 * `packs` holds shop pack cards by pack id; the database only returns packs the player owns (admins see all).
 */
export interface Remote { cards: QueuedCard[]; topics: TalkTopic[]; packs: Record<string, QueuedCard[]> }
let remote: Remote | null = null;

export const getRemoteContent = (): Remote | null => remote;
export const setRemoteContent = (r: Remote | null): void => { remote = r; };
