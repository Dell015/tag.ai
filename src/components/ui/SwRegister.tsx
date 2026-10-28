'use client';
import { useEffect } from 'react';

/** Registers the small service worker that shows the "No connection" page when the phone is offline. */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => { /* the app works the same without it */ });
  }, []);
  return null;
}
