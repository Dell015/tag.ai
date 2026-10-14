'use client';
import { useHydrated } from '@/lib/hydration';

/** Mounted once in the root layout: rehydrates persisted stores on the client. */
export function StoreHydrator() {
  useHydrated();
  return null;
}
