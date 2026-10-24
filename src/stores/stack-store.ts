/**
 * Stack store: the player's own stacks (named lists of card ids, like playlists). Liked cards are the
 * saved cards in profile-store. A stack holds ids only, never copies. Signed in, the server is the
 * source of truth and changes are written through; signed out, stacks live in localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { isConnected } from '@/stores/account-store';
import { toast } from '@/stores/toast-store';
import {
  addStackCardsRemote, createStackRemote, deleteStackRemote, loadStacks, removeStackCardRemote, renameStackRemote,
} from '@/lib/supabase/account';

export const MAX_STACKS = 20;
export const MAX_STACK_CARDS = 200;
export const MAX_STACK_NAME = 40;

export interface Stack { id: string; name: string; cardIds: string[]; updatedAt: number }

const uid = () => `stack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const cleanName = (n: string) => n.replace(/\s+/g, ' ').trim().slice(0, MAX_STACK_NAME);

interface StackState {
  stacks: Stack[];
  /** Replaces everything, used when the server's copy is loaded. */
  setAll: (s: Stack[]) => void;
  create: (name?: string) => Promise<Stack | null>;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  /** Adds the cards that are not in the stack yet and fit. Returns how many were added. */
  addCards: (id: string, cardIds: string[]) => number;
  removeCard: (id: string, cardId: string) => void;
}

/** Reloads from the server after a write was refused, so the screen shows the truth. */
async function resync(): Promise<void> {
  const r = await loadStacks();
  if (r.ok && r.data) useStackStore.getState().setAll(r.data);
}
const failed = (m?: string) => { toast(m ?? 'That did not save. Try again.', { tone: 'warn' }); void resync(); };

export const useStackStore = create<StackState>()(
  persist(
    (set, get) => ({
      stacks: [],
      setAll: (stacks) => set({ stacks }),
      create: async (name = 'New stack') => {
        if (get().stacks.length >= MAX_STACKS) { toast(`You can have up to ${MAX_STACKS} stacks.`, { tone: 'warn' }); return null; }
        const n = cleanName(name) || 'New stack';
        let id = uid();
        if (isConnected()) {
          const r = await createStackRemote(n);
          if (!r.ok || !r.data) { toast(r.error ?? 'Could not create the stack.', { tone: 'warn' }); return null; }
          id = r.data;
        }
        const s: Stack = { id, name: n, cardIds: [], updatedAt: Date.now() };
        set({ stacks: [s, ...get().stacks] });
        return s;
      },
      rename: (id, name) => {
        const n = cleanName(name);
        if (!n) return;
        set({ stacks: get().stacks.map((s) => (s.id === id ? { ...s, name: n, updatedAt: Date.now() } : s)) });
        if (isConnected()) void renameStackRemote(id, n).then((r) => { if (!r.ok) failed(r.error); });
      },
      remove: (id) => {
        set({ stacks: get().stacks.filter((s) => s.id !== id) });
        if (isConnected()) void deleteStackRemote(id).then((r) => { if (!r.ok) failed(r.error); });
      },
      addCards: (id, cardIds) => {
        const st = get().stacks.find((s) => s.id === id);
        if (!st) return 0;
        const have = new Set(st.cardIds);
        const fresh = Array.from(new Set(cardIds)).filter((c) => !have.has(c)).slice(0, Math.max(0, MAX_STACK_CARDS - st.cardIds.length));
        if (fresh.length === 0) return 0;
        set({ stacks: get().stacks.map((s) => (s.id === id ? { ...s, cardIds: [...s.cardIds, ...fresh], updatedAt: Date.now() } : s)) });
        if (isConnected()) void addStackCardsRemote(id, fresh).then((r) => { if (!r.ok) failed(r.error); });
        return fresh.length;
      },
      removeCard: (id, cardId) => {
        set({ stacks: get().stacks.map((s) => (s.id === id ? { ...s, cardIds: s.cardIds.filter((c) => c !== cardId), updatedAt: Date.now() } : s)) });
        if (isConnected()) void removeStackCardRemote(id, cardId).then((r) => { if (!r.ok) failed(r.error); });
      },
    }),
    { name: 'tagai-stacks', version: 1, storage: safeStorage(), skipHydration: true, partialize: (s) => ({ stacks: s.stacks }) },
  ),
);
