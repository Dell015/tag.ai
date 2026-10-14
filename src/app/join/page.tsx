'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Screen } from '@/components/ui';
import { Splash } from '@/components/ui/Splash';
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
    <Screen
      title="Join a game"
      back="/"
      footer={<Button size="lg" full disabled={code.length !== 6} onClick={submit}>Join</Button>}
    >
      <p className="text-lg text-muted">Ask the host for the 6-character code, or paste their invite link.</p>
      <input
        autoFocus
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        value={code}
        onChange={(e) => {
          setError(null);
          setCode(normalizeCode(e.target.value));
        }}
        onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && submit()}
        placeholder="ABC123"
        aria-label="Room code"
        className="mt-8 h-24 w-full rounded-card bg-surface text-center font-display text-5xl font-extrabold uppercase tracking-[0.3em] ring-1 ring-white/10 placeholder:text-white/15"
      />
      {error && <p role="alert" className="mt-4 rounded-2xl bg-danger/15 p-4 text-center text-base font-semibold text-danger">{error}</p>}
    </Screen>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<Splash />}>
      <JoinInner />
    </Suspense>
  );
}
