import { createJSONStorage, type PersistStorage, type StateStorage, type StorageValue } from 'zustand/middleware';

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** localStorage in the browser, a silent no-op on the server / in tests. */
export function safeStorage<S>() {
  return createJSONStorage<S>(() =>
    typeof window !== 'undefined' && window.localStorage ? window.localStorage : noopStorage
  );
}

/**
 * Like `safeStorage`, but the write to localStorage is postponed until the screen has been quiet for a moment
 * (and always before the page is hidden or closed). A game keeps its whole card queue in one store; writing
 * that on every tap made buttons feel slow on phones. The newest state is also kept in memory, so reading
 * back before the write happens still returns it.
 */
export function lazyStorage<S>(waitMs = 500): PersistStorage<S> | undefined {
  if (typeof window === 'undefined' || !window.localStorage) return safeStorage<S>();
  const pending = new Map<string, StorageValue<S>>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    pending.forEach((value, name) => {
      try { window.localStorage.setItem(name, JSON.stringify(value)); } catch { /* storage full or blocked: the game still runs */ }
    });
    pending.clear();
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  return {
    getItem: (name) => {
      const waiting = pending.get(name);
      if (waiting) return waiting;
      try { const raw = window.localStorage.getItem(name); return raw ? (JSON.parse(raw) as StorageValue<S>) : null; } catch { return null; }
    },
    setItem: (name, value) => {
      pending.set(name, value);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, waitMs);
    },
    removeItem: (name) => {
      pending.delete(name);
      try { window.localStorage.removeItem(name); } catch { /* ignore */ }
    },
  };
}
