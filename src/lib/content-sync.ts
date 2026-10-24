import { loadContent } from '@/lib/supabase/account';
import { setRemoteContent } from '@/lib/data/remote-content';

/** Loads the cards and topics from the database after sign in or after buying a pack. Too few rows means something is wrong, so the bundled copies stay. */
export async function refreshContent(signedIn: boolean): Promise<void> {
  if (!signedIn) { setRemoteContent(null); return; }
  const res = await loadContent();
  if (res.ok && res.data && res.data.cards.length >= 50 && res.data.topics.length >= 20) setRemoteContent(res.data);
}
