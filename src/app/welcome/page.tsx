'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Logo, Avatar, AvatarPicker } from '@/components/ui';
import { useProfileStore, WELCOME_COINS } from '@/stores/profile-store';
import { useHydrated } from '@/lib/hydration';
import { Splash } from '@/components/ui/Splash';

function WelcomeInner() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const hydrated = useHydrated();
  const existing = useProfileStore((s) => s.profile);
  const createProfile = useProfileStore((s) => s.createProfile);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😎');
  const [step, setStep] = useState<0 | 1>(0);

  if (!hydrated) return <Splash />;
  if (existing) {
    router.replace(next && next.startsWith('/') ? next : '/');
    return <Splash />;
  }

  const valid = name.trim().length >= 2;
  const finish = () => {
    createProfile(name, avatar);
    router.replace(next && next.startsWith('/') ? next : '/');
  };

  if (step === 0) {
    return (
      <div className="flex min-h-dvh flex-col justify-between px-6 safe-top safe-bottom">
        <div className="pt-16">
          <Logo className="text-6xl" />
          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-tight">
            Pass the phone. Answer the card. <span className="text-accent">Take the shot.</span>
          </h1>
          <p className="mt-4 text-lg text-muted">The barkada drinking game. One phone, no setup headaches.</p>
        </div>
        <div className="space-y-3 pb-4">
          <Button size="lg" full onClick={() => setStep(1)}>Let&apos;s go 🍻</Button>
          <p className="text-center text-sm text-muted">Please drink responsibly. 18+ only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 safe-top">
      <button onClick={() => setStep(0)} aria-label="Back" className="mt-2 h-tap w-tap self-start rounded-2xl bg-surface text-2xl">←</button>
      <h1 className="mt-4 text-4xl font-extrabold">Who are you?</h1>
      <p className="mt-1 text-muted">This is how your barkada sees you.</p>
      <div className="mt-6 flex items-center gap-4">
        <Avatar value={avatar} size={72} />
        <input
          autoFocus
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your nickname"
          aria-label="Nickname"
          className="h-cta min-w-0 flex-1 rounded-2xl bg-surface px-4 text-2xl font-bold ring-1 ring-white/10 placeholder:text-muted/60"
        />
      </div>
      <div className="mt-6"><AvatarPicker value={avatar} onChange={setAvatar} /></div>
      <div className="safe-bottom mt-auto pt-6">
        <Button size="lg" full disabled={!valid} onClick={finish}>Start playing</Button>
        <p className="mt-3 text-center text-sm text-muted">🪙 {WELCOME_COINS} free coins on the house</p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<Splash />}>
      <WelcomeInner />
    </Suspense>
  );
}
