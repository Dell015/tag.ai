'use client';
import { useEffect, useState } from 'react';
import { useProfileStore } from '@/stores/profile-store';
import { useGameStore } from '@/stores/game-store';

/**
 * Persisted stores use `skipHydration` so the server render and the first client
 * render match. `useHydrated()` rehydrates them once on the client and tells
 * pages when it is safe to read saved state.
 */
let started: Promise<void> | null = null;
let done = false;

function hydrateAll(): Promise<void> {
  if (!started) {
    started = Promise.all([
      useProfileStore.persist.rehydrate(),
      useGameStore.persist.rehydrate(),
    ]).then(() => {
      useProfileStore.setState({ hydrated: true });
      done = true;
    });
  }
  return started;
}

export function useHydrated(): boolean {
  const [ready, setReady] = useState(done);
  useEffect(() => {
    let live = true;
    hydrateAll().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}
