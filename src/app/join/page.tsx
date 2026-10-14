'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Screen, Splash } from '@/components/ui';
import { useRequireProfile } from '@/lib/use-profile';
import { joinRoom, normalizeCode } from '@/lib/data/join';

function JoinInner() {
  const router = useRouter();
  const preset = useSearchParams().get('code') ?? '';
  const { ready, profile } = useRequireProfile(preset ? `/join?code=${preset}` : '/join');
  const [code, setCode] = useState(normalizeCode(preset));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setCode(normalizeCode(preset)), [preset]);
  if (!ready || !profile) return <Splash />;

  const submit = () => {
    const res = joinRoom(code, profile);
    if (res.ok) router.push(`/game/${res.code}`);
    else setError(res.error);
  };

  return (
    <Screen title="Join a game" back="/" footer={<Button size="lg" full disabled={code.length !== 6} onClick={submit}>Join</Button>}>
      <p className="text-lg text-muted">Ask the host for the 6-character code, or paste their invite link.</p>
      <input
        autoFocus inputMode="text" autoCapitalize="characters" autoCorrect="off" spellCheck={false}
        value={code} placeholder="ABC123" aria-label="Room code"
        onChange={(e) => { setError(null); setCode(normalizeCode(e.target.value)); }}
        onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && submit()}
        className="mt-8 h-28 w-full rounded-xl border-2 border-line bg-transparent text-center text-[4rem] font-extrabold uppercase tracking-[0.25em] placeholder:text-muted/25 focus:border-accent"
        style={{ fontStretch: '75%' }}
      />
      {error && <p role="alert" className="mt-4 rounded-xl border-2 border-danger p-4 text-lg font-bold text-danger">{error}</p>}
    </Screen>
  );
}

export default function JoinPage() {
  return <Suspense fallback={<Splash />}><JoinInner /></Suspense>;
}
