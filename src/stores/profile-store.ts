/**
 * Profile store — the mock "account": who you are, your coins, and the cards you
 * saved (hearted) or trashed. Persisted to localStorage. In Stage B this is
 * replaced by Supabase auth + the users/saved_cards/user_trashed_cards tables.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';

export const WELCOME_COINS = 10;

export interface Profile {
  id: string;
  username: string;
  avatar: string; // emoji
  coins: number;
  createdAt: number;
}

interface ProfileState {
  profile: Profile | null;
  savedCardIds: string[];
  trashedCardIds: string[];
  hasSeenHints: boolean;
  hydrated: boolean;

  createProfile: (username: string, avatar: string) => Profile;
  updateProfile: (patch: Partial<Pick<Profile, 'username' | 'avatar'>>) => void;
  saveCard: (id: string) => void;
  unsaveCard: (id: string) => void;
  trashCard: (id: string) => void;
  untrashCard: (id: string) => void;
  markHintsSeen: () => void;
  signOut: () => void;
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      savedCardIds: [],
      trashedCardIds: [],
      hasSeenHints: false,
      hydrated: false,

      createProfile: (username, avatar) => {
        const profile: Profile = {
          id: newId(),
          username: username.trim(),
          avatar,
          coins: WELCOME_COINS,
          createdAt: Date.now(),
        };
        set({ profile });
        return profile;
      },

      updateProfile: (patch) => {
        const profile = get().profile;
        if (profile) set({ profile: { ...profile, ...patch } });
      },

      saveCard: (id) =>
        set((s) => (s.savedCardIds.includes(id) ? s : { savedCardIds: [...s.savedCardIds, id] })),
      unsaveCard: (id) => set((s) => ({ savedCardIds: s.savedCardIds.filter((c) => c !== id) })),
      trashCard: (id) =>
        set((s) => (s.trashedCardIds.includes(id) ? s : { trashedCardIds: [...s.trashedCardIds, id] })),
      untrashCard: (id) => set((s) => ({ trashedCardIds: s.trashedCardIds.filter((c) => c !== id) })),
      markHintsSeen: () => set({ hasSeenHints: true }),
      signOut: () => set({ profile: null, savedCardIds: [], trashedCardIds: [], hasSeenHints: false }),
    }),
    {
      name: 'tagai-profile',
      version: 1,
      storage: safeStorage(),
      skipHydration: true,
      partialize: (s) => ({
        profile: s.profile,
        savedCardIds: s.savedCardIds,
        trashedCardIds: s.trashedCardIds,
        hasSeenHints: s.hasSeenHints,
      }),
      onRehydrateStorage: () => () => useProfileStore.setState({ hydrated: true }),
    }
  )
);
