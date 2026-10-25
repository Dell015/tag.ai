/**
 * Connection state of the real account (Supabase). Not persisted.
 *  off        Supabase is not configured: the app runs on the local mock.
 *  loading    checking for a session.
 *  signedOut  no session.
 *  signedIn   session and account loaded; money and saved cards are mirrored to the server.
 */
import { create } from 'zustand';
import { supabaseConfigured } from '@/lib/supabase/config';

export type AccountStatus = 'off' | 'loading' | 'signedOut' | 'signedIn';

interface AccountState {
  status: AccountStatus;
  userId: string | null;
  email: string | null;
  /** Signed in but has not picked a nickname and colour yet. */
  needsProfile: boolean;
  isAdmin: boolean;
  /** The player has passed the age gate (profiles.is_adult_confirmed). */
  adultConfirmed: boolean;
  set: (patch: Partial<Omit<AccountState, 'set'>>) => void;
}

export const useAccountStore = create<AccountState>()((set) => ({
  status: supabaseConfigured ? 'loading' : 'off',
  userId: null,
  email: null,
  needsProfile: false,
  isAdmin: false,
  adultConfirmed: false,
  set: (patch) => set(patch),
}));

/** True when coin and card changes must also be written to the server. */
export const isConnected = (): boolean => useAccountStore.getState().status === 'signedIn';
