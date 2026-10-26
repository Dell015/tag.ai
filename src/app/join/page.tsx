'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Icon, Screen, Splash } from '@/components/ui';
import { QrScanner } from '@/components/lobby/QrScanner';
import { useAccountStore } from '@/stores/account-store';
import { useProfileStore } from '@/stores/profile-store';
import { useHydrated } from '@/lib/hydration';
import { joinOnline } from '@/lib/data/room-sync';
import { supabaseConfigured } from '@/lib/supabase/config';

/** Join a friend's room: type the 6 character code, or arrive here from their QR code with the code in the link. */
export default function JoinPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useProfileStore((s) => s.profile);
  const status = useAccountStore((s) => s.status);
  const [code, setCode] = useState('');
  const [fromLink, setFromLink] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const tried = useRef(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const c = (new URLSearchParams(window.location.search).get('code') ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    if (c) { setCode(c); setFromLink(c); }
  }, []);

  // Not signed in: go and make an account, then come straight back to this room.
  useEffect(() => {
    if (!hydrated || status === 'loading') return;
    if (supabaseConfigured && status === 'signedOut') {
      const back = `/join${code ? `?code=${code}` : ''}`;
      router.replace(`/welcome?next=${encodeURIComponent(back)}`);
    }
  }, [hydrated, status, code, router]);

  const join = async (c: string) => {
    setBusy(true); setError('');
    const res = await joinOnline(c);
    if (res.ok) { router.replace(`/game/${res.code}`); return; }
    setError(res.error); setBusy(false);
  };

  // A QR code carries the code, so join straight away once the account is ready.
  useEffect(() => {
    if (fromLink && status === 'signedIn' && profile && !tried.current) { tried.current = true; void join(fromLink); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLink, status, profile]);

  if (!hydrated || status === 'loading' || (supabaseConfigured && status === 'signedOut')) return <Splash />;

  if (!supabaseConfigured || status === 'off') {
    return (
      <Screen title="Join a room" back="/">
        <p className="text-lg text-muted">Joining a room needs an account. This copy of the app is running without one.</p>
      </Screen>
    );
  }

  return (
    <Screen title="Join a room" back="/">
      <p className="text-lg text-muted">Ask the host for the 6 character code, or scan their QR code with your camera.</p>
      <Button size="lg" full variant="secondary" className="mt-5" onClick={() => setScanning(true)}><Icon name="scan" size={22} />Scan a QR code</Button>
      <QrScanner open={scanning} onClose={() => setScanning(false)} onCode={(c) => { setScanning(false); setCode(c); void join(c); }} />
      <form className="mt-6" onSubmit={(e) => { e.preventDefault(); if (code.length === 6 && !busy) void join(code); }}>
        <label htmlFor="room-code" className="mb-2 block text-base font-bold text-muted">Room code</label>
        <input id="room-code" value={code} autoFocus autoCapitalize="characters" autoComplete="off" spellCheck={false} inputMode="text" maxLength={6}
          onChange={(e) => { setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()); setError(''); }}
          placeholder="ABC123"
          className="sign h-16 w-full rounded-xl border-2 border-line bg-transparent px-4 text-center text-4xl tracking-[0.3em] placeholder:text-muted/40 focus:border-accent" />
        {error && <p role="alert" className="mt-3 text-base font-semibold text-danger">{error}</p>}
        <Button size="lg" full type="submit" className="mt-5" disabled={code.length !== 6 || busy}>{busy ? 'Joining' : 'Join'}</Button>
      </form>
      <p className="mt-6 text-base text-muted">Want to host instead? <Link href="/" className="font-bold text-text underline">Start a game</Link> and share its code.</p>
    </Screen>
  );
}
