'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Logo, Avatar, AvatarPicker, DeckFan, Icon, Splash } from '@/components/ui';
import { useProfileStore, WELCOME_COINS } from '@/stores/profile-store';
import { useHydrated } from '@/lib/hydration';
import { supabaseConfigured } from '@/lib/supabase/config';
import { useAccountStore } from '@/stores/account-store';
import { completeProfile, confirmAdult, googleEnabled, sendEmailCode, signInWithGoogle, signInWithPassword, signUpWithPassword, verifyEmailCode } from '@/lib/supabase/account';
import { refreshAccount } from '@/components/AuthSync';
import { AgeForm } from '@/components/AgeForm';
import { ageLockLeft, lockText, setAgeLock } from '@/lib/age';

function WelcomeInner() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const hydrated = useHydrated();
  const existing = useProfileStore((s) => s.profile);
  const createProfile = useProfileStore((s) => s.createProfile);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('c0');
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0); // 0 intro, 1 age, 2 name, 3 closed, 4 email code, 5 code, 6 account (Google or password)
  const account = useAccountStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [adultOk, setAdultOk] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(true);
  useEffect(() => { const left = ageLockLeft(); if (left > 0) { setLockLeft(left); setStep(3); } }, []);

  // Signed in but no nickname yet (for example the tab was closed after the code): go straight to the name step.
  useEffect(() => {
    if (supabaseConfigured && account.status === 'signedIn' && account.needsProfile) setStep(2);
  }, [account.status, account.needsProfile]);

  // Back from Google: the age answer given before leaving is saved now.
  useEffect(() => {
    if (!supabaseConfigured || account.status !== 'signedIn' || account.adultConfirmed) return;
    let flagged = false;
    try { flagged = sessionStorage.getItem('tagai-adult-ok') === '1'; } catch { /* private mode */ }
    if (!flagged) return;
    try { sessionStorage.removeItem('tagai-adult-ok'); } catch { /* private mode */ }
    void confirmAdult().then(() => refreshAccount());
  }, [account.status, account.adultConfirmed]);

  if (!hydrated) return <Splash />;
  if (supabaseConfigured && account.status === 'loading') return <Splash />;
  const dest = next && next.startsWith('/') ? next : '/';
  if (existing) { router.replace(dest); return <Splash />; }

  const valid = name.trim().length >= 2;

  if (step === 0) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-clip px-5 safe-top safe-bottom">
        <Logo className="text-3xl" />
        <DeckFan className="mt-6" />
        <h1 className="mt-8 text-[3rem] leading-[0.95]">
          Pass the phone.<br />Answer the card.<br />Take the shot.
        </h1>
        <p className="mt-4 max-w-[18rem] text-lg text-muted">A drinking game for the barkada. One phone, no setup.</p>
        <div className="mt-auto space-y-3 pt-8">
          <Button size="lg" full onClick={() => setStep(1)}>Get started</Button>
          {supabaseConfigured && <Button full variant="secondary" onClick={() => { setError(''); setCreating(false); setStep(6); }}>I already have an account</Button>}
          <p className="text-center text-sm text-muted">For ages 18 and up. Drink responsibly.</p>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 safe-top safe-bottom">
        <button onClick={() => setStep(0)} aria-label="Back" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
        <h1 className="mt-5 text-6xl">When were you born?</h1>
        <p className="mt-4 text-lg text-muted">tag.ai is a drinking game, so it is for adults only.</p>
        <AgeForm
          onAdult={() => { setAdultOk(true); setCreating(true); setStep(supabaseConfigured ? 6 : 2); }}
          onUnderage={() => { setAgeLock(); setLockLeft(ageLockLeft()); setStep(3); }}
        />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 safe-top safe-bottom">
        <h1 className="text-6xl">tag.ai is for adults.</h1>
        <p className="mt-4 text-lg text-muted">Come back when you&apos;re 18.{lockLeft > 0 && <> You can try again in {lockText(lockLeft)}.</>}</p>
      </div>
    );
  }

  if (step === 4) {
    const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 safe-top safe-bottom">
        <button onClick={() => { setError(''); setStep(6); }} aria-label="Back" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
        <h1 className="mt-5 text-6xl">What is your email?</h1>
        <p className="mt-4 text-lg text-muted">We send you a code. No password to remember.</p>
        <input
          autoFocus type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" aria-label="Email"
          className="mt-6 h-cta w-full rounded-xl border-2 border-line bg-transparent px-4 text-2xl font-extrabold placeholder:text-muted/50 focus:border-accent"
        />
        {error && <p role="alert" className="mt-3 text-base font-bold text-red-400">{error}</p>}
        <div className="mt-auto pt-8">
          <Button size="lg" full disabled={!emailOk || busy} onClick={async () => {
            setBusy(true); setError('');
            const r = await sendEmailCode(email);
            setBusy(false);
            if (r.ok) { setCode(''); setStep(5); } else setError(r.error ?? 'Could not send the code.');
          }}>{busy ? 'Sending' : 'Send code'}</Button>
        </div>
      </div>
    );
  }

  if (step === 6) {
    const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
    const pwOk = password.length >= 8;
    const submit = async () => {
      setBusy(true); setError('');
      const r = creating ? await signUpWithPassword(email, password) : await signInWithPassword(email, password);
      if (!r.ok) { setBusy(false); setError(r.error ?? 'Something went wrong. Try again.'); return; }
      if (adultOk) await confirmAdult();
      await refreshAccount();
      setBusy(false);
      if (useAccountStore.getState().needsProfile) setStep(2); else router.replace(dest);
    };
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 safe-top safe-bottom">
        <button onClick={() => { setError(''); setStep(adultOk ? 1 : 0); }} aria-label="Back" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
        <h1 className="mt-5 text-6xl">{creating ? 'Make your account' : 'Welcome back'}</h1>
        {googleEnabled && (
          <>
            <Button size="lg" full variant="secondary" className="mt-6" disabled={busy} onClick={async () => {
              setError('');
              try { if (adultOk) sessionStorage.setItem('tagai-adult-ok', '1'); } catch { /* private mode */ }
              const r = await signInWithGoogle();
              if (!r.ok) setError(r.error ?? 'Google sign in is not available right now.');
            }}>Continue with Google</Button>
            <p className="my-4 text-center text-base text-muted">or use an email and password</p>
          </>
        )}
        <input
          autoFocus={!googleEnabled} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" aria-label="Email"
          className={`${googleEnabled ? '' : 'mt-6 '}h-cta w-full rounded-xl border-2 border-line bg-transparent px-4 text-2xl font-extrabold placeholder:text-muted/50 focus:border-accent`}
        />
        <input
          type="password" autoComplete={creating ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={creating ? 'Password, 8 or more characters' : 'Password'} aria-label="Password"
          className="mt-3 h-cta w-full rounded-xl border-2 border-line bg-transparent px-4 text-2xl font-extrabold placeholder:text-muted/50 focus:border-accent"
        />
        {error && <p role="alert" className="mt-3 text-base font-bold text-red-400">{error}</p>}
        <div className="mt-auto space-y-3 pt-8">
          <Button size="lg" full disabled={!emailOk || !pwOk || busy} onClick={submit}>{busy ? 'One moment' : creating ? 'Create account' : 'Sign in'}</Button>
          <Button full variant="secondary" disabled={busy} onClick={() => { setError(''); setCreating(!creating); }}>{creating ? 'I already have an account' : 'Make a new account'}</Button>
          <button className="mx-auto block py-2 text-base font-bold text-muted underline" onClick={() => { setError(''); setStep(4); }}>Email me a code instead</button>
        </div>
      </div>
    );
  }

  if (step === 5) {
    const codeOk = /^\d{6,8}$/.test(code.trim());
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 safe-top safe-bottom">
        <button onClick={() => setStep(4)} aria-label="Back" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
        <h1 className="mt-5 text-6xl">Enter your code</h1>
        <p className="mt-4 text-lg text-muted">We sent it to {email.trim()}. Check spam if you do not see it.</p>
        <input
          autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="Code" aria-label="Code"
          className="mt-6 h-cta w-full rounded-xl border-2 border-line bg-transparent px-4 text-3xl font-extrabold tracking-widest placeholder:text-muted/50 focus:border-accent"
        />
        {error && <p role="alert" className="mt-3 text-base font-bold text-red-400">{error}</p>}
        <div className="mt-auto space-y-3 pt-8">
          <Button size="lg" full disabled={!codeOk || busy} onClick={async () => {
            setBusy(true); setError('');
            const r = await verifyEmailCode(email, code);
            if (!r.ok) { setBusy(false); setError(r.error ?? 'That code did not work.'); return; }
            if (adultOk) await confirmAdult();
            await refreshAccount();
            setBusy(false);
            if (useAccountStore.getState().needsProfile) setStep(2); else router.replace(dest);
          }}>{busy ? 'Checking' : 'Continue'}</Button>
          <Button full variant="secondary" disabled={busy} onClick={async () => { setError(''); const r = await sendEmailCode(email); if (!r.ok) setError(r.error ?? 'Could not send the code.'); }}>Send a new code</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 safe-top safe-bottom">
      <button onClick={() => setStep(1)} aria-label="Back" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line"><Icon name="back" /></button>
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
        {error && <p role="alert" className="mb-3 text-base font-bold text-red-400">{error}</p>}
        <Button size="lg" full disabled={!valid || busy} onClick={async () => {
          if (!supabaseConfigured) { createProfile(name, avatar); router.replace(dest); return; }
          setBusy(true); setError('');
          const r = await completeProfile(name.trim(), avatar);
          if (!r.ok) { setBusy(false); setError(r.error ?? 'Could not save your name.'); return; }
          await refreshAccount();
          setBusy(false);
          router.replace(dest);
        }}>{busy ? 'Saving' : 'Start playing'}</Button>
        <p className="mt-3 text-center text-sm text-muted">You start with {WELCOME_COINS} free coins. By continuing you accept the <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy</Link> notes.</p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return <Suspense fallback={<Splash />}><WelcomeInner /></Suspense>;
}
