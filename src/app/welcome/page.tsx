'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Logo, Avatar, AvatarPicker, DeckFan, Icon, Splash } from '@/components/ui';
import { useProfileStore, WELCOME_COINS } from '@/stores/profile-store';
import { useHydrated } from '@/lib/hydration';

function WelcomeInner() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const hydrated = useHydrated();
  const existing = useProfileStore((s) => s.profile);
  const createProfile = useProfileStore((s) => s.createProfile);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('c0');
  const [step, setStep] = useState<0 | 1>(0);

  if (!hydrated) return <Splash />;
  const dest = next && next.startsWith('/') ? next : '/';
  if (existing) { router.replace(dest); return <Splash />; }

  const valid = name.trim().length >= 2;

  if (step === 0) {
    return (
      <div className="flex min-h-dvh flex-col px-5 safe-top safe-bottom">
        <Logo className="text-3xl" />
        <DeckFan className="mt-6" />
        <h1 className="mt-8 text-[3rem] leading-[0.95]">
          Pass the phone.<br />Answer the card.<br />Take the shot.
        </h1>
        <p className="mt-4 max-w-[18rem] text-lg text-muted">A drinking game for the barkada. One phone, no setup.</p>
        <div className="mt-auto space-y-3 pt-8">
          <Button size="lg" full onClick={() => setStep(1)}>Get started</Button>
          <p className="text-center text-sm text-muted">For ages 18 and up. Drink responsibly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 safe-top safe-bottom">
      <button onClick={() => setStep(0)} aria-label="Back" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
      <h1 className="mt-5 text-6xl">What do your friends call you?</h1>
      <div className="mt-6 flex items-center gap-4">
        <Avatar value={avatar} name={name || '?'} size={72} />
        <input
          autoFocus value={name} maxLength={16} onChange={(e) => setName(e.target.value)} placeholder="Nickname" aria-label="Nickname"
          className="h-cta min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-3xl font-extrabold placeholder:text-muted/50 focus:border-accent"
        />
      </div>
      <p className="mb-3 mt-7 text-base font-bold text-muted">Pick your colour</p>
      <AvatarPicker value={avatar} onChange={setAvatar} />
      <div className="mt-auto pt-8">
        <Button size="lg" full disabled={!valid} onClick={() => { createProfile(name, avatar); router.replace(dest); }}>Start playing</Button>
        <p className="mt-3 text-center text-sm text-muted">You start with {WELCOME_COINS} free coins.</p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return <Suspense fallback={<Splash />}><WelcomeInner /></Suspense>;
}
