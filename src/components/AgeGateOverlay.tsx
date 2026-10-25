'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AgeForm } from '@/components/AgeForm';
import { useAccountStore } from '@/stores/account-store';
import { confirmAdult, signOutServer } from '@/lib/supabase/account';
import { refreshAccount } from '@/components/AuthSync';
import { ageLockLeft, lockText, setAgeLock } from '@/lib/age';

/**
 * Signed-in accounts that never passed the age gate (made before it existed, or the code step was
 * interrupted) get the birth date question before anything else. Under 18 signs them out for 24 hours.
 */
export function AgeGateOverlay() {
  const status = useAccountStore((a) => a.status);
  const needsProfile = useAccountStore((a) => a.needsProfile);
  const confirmed = useAccountStore((a) => a.adultConfirmed);
  const path = usePathname();
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(0);
  const [error, setError] = useState('');
  if (path.startsWith('/welcome') || path.startsWith('/legal') || path.startsWith('/help')) return null;
  if (blocked <= 0 && (status !== 'signedIn' || needsProfile || confirmed)) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Age check" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg px-5 safe-top safe-bottom">
      {blocked > 0 ? (
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-6xl">tag.ai is for adults.</h1>
          <p className="mt-4 text-lg text-muted">Come back when you&apos;re 18. You can try again in {lockText(blocked)}.</p>
        </div>
      ) : (
        <>
          <h1 className="mt-8 text-6xl">When were you born?</h1>
          <p className="mt-4 text-lg text-muted">tag.ai is a drinking game, so it is for adults only. We need to check once.</p>
          <AgeForm
            busy={busy}
            onAdult={async () => {
              setBusy(true); setError('');
              const r = await confirmAdult();
              if (!r.ok) { setBusy(false); setError(r.error ?? 'Could not save that. Try again.'); return; }
              await refreshAccount();
              setBusy(false);
            }}
            onUnderage={async () => { setAgeLock(); setBlocked(ageLockLeft()); await signOutServer(); }}
          />
          {error && <p role="alert" className="mt-3 text-base font-bold text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
