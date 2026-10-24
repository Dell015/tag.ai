import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { TalkTopic } from '@/lib/data/talk-topics';

/**
 * Cards and topics loaded from the database while signed in. Empty until loaded, and the app then
 * uses the copies bundled with it, so a play session never waits on the network.
 */
interface Remote { cards: QueuedCard[]; topics: TalkTopic[] }
let remote: Remote | null = null;

export const getRemoteContent = (): Remote | null => remote;
export const setRemoteContent = (r: Remote | null): void => { remote = r; };
