import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** localStorage in the browser, a silent no-op on the server / in tests. */
export function safeStorage() {
  return createJSONStorage(() =>
    typeof window !== 'undefined' && window.localStorage ? window.localStorage : noopStorage
  );
}
