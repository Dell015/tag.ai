import { create } from 'zustand';
import { fetchInbox, type InboxMessage } from '@/lib/supabase/account';

interface InboxState {
  messages: InboxMessage[];
  loaded: boolean;
  unread: number;
  load: () => Promise<void>;
  patch: (id: string, p: Partial<InboxMessage>) => void;
  /** Marks everything read locally (the database call is separate). */
  markAllRead: () => void;
}

export const useInboxStore = create<InboxState>((set, get) => ({
  messages: [], loaded: false, unread: 0,
  load: async () => {
    const r = await fetchInbox();
    if (r.ok && r.data) set({ messages: r.data, loaded: true, unread: r.data.filter((m) => !m.read).length });
    else set({ loaded: true });
  },
  patch: (id, p) => set({ messages: get().messages.map((m) => (m.id === id ? { ...m, ...p } : m)) }),
  markAllRead: () => set({ unread: 0 }),
}));
