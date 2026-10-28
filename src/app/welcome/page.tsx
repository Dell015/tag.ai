'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIntroStore } from '@/stores/intro-store';
import { Button, Logo, AvatarPicker, DeckFan, Icon, Splash } from '@/components/ui';
import { AuthField, AuthShell, Divider, ErrorNote, GoogleButton, PlayerCard } from '@/components/auth/AuthParts';
import { emailLooksValid, suggestEmailFix } from '@/lib/email-hint';
import { useProfileStore, WELCOME_COINS } from '@/stores/profile-store';
import { useHydrated } from '@/lib/hydration';
import { supabaseConfigured } from '@/lib/supabase/config';
import { useAccountStore } from '@/stores/account-store';
import { codeLoginEnabled, completeProfile, confirmAdult, googleAvailable, sendEmailCode, signInWithGoogle, signInWithPassword, signUpWithPassword, verifyEmailCode } from '@/lib/supabase/account';
import { refreshAccount } from '@/components/AuthSync';
import { AgeForm } from '@/components/AgeForm';
import { ageLockLeft, lockText, setAgeLock } from '@/lib/age';

function WelcomeInner() {
  const router = useRouter();
  // Read after mount: useSearchParams would force a client-only render and cause a hydration mismatch here.
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => { setNext(new URLSearchParams(window.location.search).get('next')); }, []);
  const hydrated = useHydrated();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => { void googleAvailable().then(setGoogleEnabled); }, []);
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
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [dealt, setDealt] = useState(false);
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
        <DeckFan className="mt-8" />
        <h1 className="mt-12 text-[3rem] leading-[0.95]">
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
      <AuthShell step={1} onBack={() => setStep(0)} title="When were you born?" subtitle="TagAi is a drinking game, so it is for adults only.">
        <AgeForm
          onAdult={() => { setAdultOk(true); setCreating(true); setStep(supabaseConfigured ? 6 : 2); }}
          onUnderage={() => { setAgeLock(); setLockLeft(ageLockLeft()); setStep(3); }}
        />
      </AuthShell>
    );
  }

  if (step === 3) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 safe-top safe-bottom">
        <h1 className="text-6xl">TagAi is for adults.</h1>
        <p className="mt-4 text-lg text-muted">Come back when you&apos;re 18.{lockLeft > 0 && <> You can try again in {lockText(lockLeft)}.</>}</p>
      </div>
    );
  }

  if (step === 4) {
    const emailOk = emailLooksValid(email);
    return (
      <AuthShell step={2} onBack={() => { setError(''); setStep(6); }} title="What is your email?" subtitle="We send you a code. No password to remember.">
        <form className="mt-6 flex flex-1 flex-col" noValidate onSubmit={async (e) => {
          e.preventDefault();
          if (!emailOk || busy) return;
          setBusy(true); setError('');
          const r = await sendEmailCode(email);
          setBusy(false);
          if (r.ok) { setCode(''); setStep(5); } else setError(r.error ?? 'Could not send the code.');
        }}>
          <AuthField label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="mt-auto pt-8">
            <Button size="lg" full type="submit" disabled={!emailOk || busy}>{busy ? 'Sending' : 'Send code'}</Button>
          </div>
        </form>
      </AuthShell>
    );
  }

  if (step === 5) {
    const codeOk = /^\d{6,8}$/.test(code.trim());
    return (
      <AuthShell step={2} onBack={() => { setError(''); setStep(4); }} title="Enter your code" subtitle={<>We sent it to {email.trim()}. Check spam if you do not see it.</>}>
        <form className="mt-6 flex flex-1 flex-col" noValidate onSubmit={async (e) => {
          e.preventDefault();
          if (!codeOk || busy) return;
          setBusy(true); setError('');
          const r = await verifyEmailCode(email, code);
          if (!r.ok) { setBusy(false); setError(r.error ?? 'That code did not work.'); return; }
          if (adultOk) await confirmAdult();
          await refreshAccount();
          setBusy(false);
          if (useAccountStore.getState().needsProfile) setStep(2); else { useIntroStore.getState().show('short'); router.replace(dest); }
        }}>
          <AuthField label="Code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="6 digit code" className="tracking-widest" />
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="mt-auto space-y-3 pt-8">
            <Button size="lg" full type="submit" disabled={!codeOk || busy}>{busy ? 'Checking' : 'Continue'}</Button>
            <Button full type="button" variant="secondary" disabled={busy} onClick={async () => { setError(''); const r = await sendEmailCode(email); if (!r.ok) setError(r.error ?? 'Could not send the code.'); }}>Send a new code</Button>
          </div>
        </form>
      </AuthShell>
    );
  }

  if (step === 6) {
    const fix = suggestEmailFix(email);
    const pwOk = password.length >= 8;
    const submit = async () => {
      if (busy) return;
      const eErr = emailLooksValid(email) ? null : 'Enter the email you use, like you@email.com.';
      const pErr = creating ? (pwOk ? null : 'Use at least 8 characters.') : (password ? null : 'Enter your password.');
      setEmailErr(eErr); setPwErr(pErr); setError('');
      if (eErr || pErr) return;
      setBusy(true);
      const r = creating ? await signUpWithPassword(email, password) : await signInWithPassword(email, password);
      if (!r.ok) { setBusy(false); setError(r.error ?? 'Something went wrong. Try again.'); return; }
      if (adultOk) await confirmAdult();
      await refreshAccount();
      setBusy(false);
      if (useAccountStore.getState().needsProfile) setStep(2); else { useIntroStore.getState().show('short'); router.replace(dest); }
    };
    return (
      <AuthShell
        step={2} progress={creating} onBack={() => { setError(''); setStep(adultOk ? 1 : 0); }}
        title={creating ? 'Make your account' : 'Welcome back'}
        subtitle={creating ? <span className="inline-flex items-center gap-2"><span style={{ animationDelay: '250ms' }} className="seat-pop flex h-8 w-8 items-center justify-center rounded-full bg-accent text-onaccent"><Icon name="coin" size={18} /></span>You start with {WELCOME_COINS} free coins.</span> : 'Sign in to get your coins and decks back.'}
      >
        {googleEnabled && (
          <div className="mt-6">
            <GoogleButton disabled={busy} onClick={async () => {
              setError('');
              try { if (adultOk) sessionStorage.setItem('tagai-adult-ok', '1'); } catch { /* private mode */ }
              const r = await signInWithGoogle(next ?? undefined);
              if (!r.ok) setError(r.error ?? 'Google sign in is not available right now.');
            }} />
            <Divider>or use your email</Divider>
          </div>
        )}
        <form className={`${googleEnabled ? '' : 'mt-6 '}flex flex-1 flex-col`} noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <div className="space-y-4">
            <AuthField
              label="Email" type="email" inputMode="email" autoComplete="email" value={email} placeholder="you@email.com" error={emailErr}
              onChange={(e) => { setEmail(e.target.value); setEmailErr(null); }}
              helper={fix && !emailErr ? <button type="button" className="font-bold text-accent underline" onClick={() => setEmail(fix)}>Did you mean {fix}?</button> : undefined}
            />
            <AuthField
              label="Password" type="password" autoComplete={creating ? 'new-password' : 'current-password'} value={password} placeholder={creating ? 'At least 8 characters' : 'Your password'} error={pwErr}
              onChange={(e) => { setPassword(e.target.value); setPwErr(null); }}
              helper={creating && !pwErr ? <span className={`flex items-center gap-1.5 ${pwOk ? 'text-ok' : ''}`}><Icon name={pwOk ? 'check' : 'minus'} size={16} />8 or more characters</span> : undefined}
            />
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="mt-auto pt-8">
            <Button size="lg" full type="submit" disabled={busy || !email.trim() || !password}>{busy ? 'One moment' : creating ? 'Create account' : 'Sign in'}</Button>
            <button type="button" disabled={busy} onClick={() => { setCreating(!creating); setError(''); setEmailErr(null); setPwErr(null); }} className="mx-auto mt-3 block py-2 text-base font-bold text-muted underline">{creating ? 'Already have an account? Sign in' : 'New here? Make an account'}</button>
            {creating && <p className="text-center text-sm text-muted">By continuing you accept the <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy</Link> notes.</p>}
            {codeLoginEnabled && <button type="button" className="mx-auto mt-2 block py-2 text-base font-bold text-muted underline" onClick={() => { setError(''); setStep(4); }}>Email me a code instead</button>}
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell step={3} onBack={supabaseConfigured ? undefined : () => setStep(1)} title="What do your friends call you?">
      <form className="mt-6 flex flex-1 flex-col" noValidate onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || busy) return;
        if (!supabaseConfigured) { setDealt(true); await new Promise((r) => setTimeout(r, 700)); createProfile(name, avatar); useIntroStore.getState().show('short'); router.replace(dest); return; }
        setBusy(true); setError('');
        const r = await completeProfile(name.trim(), avatar);
        if (!r.ok) { setBusy(false); setError(r.error ?? 'Could not save your name.'); return; }
        setDealt(true);
        await new Promise((res) => setTimeout(res, 650));
        await refreshAccount();
        setBusy(false);
        useIntroStore.getState().show('short');
        router.replace(dest);
      }}>
        <PlayerCard name={name} avatar={avatar} coins={WELCOME_COINS} dealt={dealt} />
        <div className="mt-5"><AuthField label="Nickname" value={name} maxLength={16} onChange={(e) => setName(e.target.value)} placeholder="Nickname" autoComplete="nickname" /></div>
        <p className="mb-3 mt-5 text-base font-bold text-muted">Pick your colour</p>
        <AvatarPicker value={avatar} onChange={setAvatar} />
        <div className="mt-auto pt-8">
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button size="lg" full type="submit" className="mt-4" disabled={!valid || busy}>{busy ? 'Saving' : 'Start playing'}</Button>
          <p className="mt-3 text-center text-sm text-muted">You start with {WELCOME_COINS} free coins. By continuing you accept the <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy</Link> notes.</p>
        </div>
      </form>
    </AuthShell>
  );
}

export default function WelcomePage() {
  return <WelcomeInner />;
}
