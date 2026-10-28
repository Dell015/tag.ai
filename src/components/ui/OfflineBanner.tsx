'use client';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); };
  }, []);
  if (!offline) return null;
  return <div role="status" className="safe-top fixed inset-x-0 top-0 z-50 mx-auto max-w-md bg-raised px-4 py-2 text-center text-sm font-bold">No connection. A game on this phone keeps going. Coins, rooms and friends come back when you are online.</div>;
}
