'use client';
import { useState } from 'react';
import { Button, Screen, TextField, toast } from '@/components/ui';
import { refreshAccount } from '@/components/AuthSync';
import { redeemCode } from '@/lib/supabase/codes';
import { useAccountStore } from '@/stores/account-store';

export default function RedeemPage() {
  const signedIn = useAccountStore((a) => a.status === 'signedIn');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null); setDone(null);
    const r = await redeemCode(code);
    setBusy(false);
    if (!r.ok || !r.data) { setError(r.error ?? 'Could not redeem.'); return; }
    setCode('');
    void refreshAccount();
    const msg = r.data.type === 'voucher'
      ? `${r.data.coins} coins added to your wallet.`
      : `${r.data.name ?? 'Your friend'} is now linked to you. You both get 30 coins after your first game.`;
    setDone(msg);
    toast('Code redeemed', { tone: 'ok' });
  };

  return (
    <Screen title="Redeem a code" back="/me">
      <p className="text-base text-muted">Type a voucher code, or the code of the friend who invited you.</p>
      {!signedIn && <p className="mt-3 text-base text-muted">Sign in first to redeem a code.</p>}
      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (code.trim() && signedIn) void submit(); }}>
        <TextField label="Code" autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={code} maxLength={24} error={error} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }} />
        <Button full type="submit" disabled={!code.trim() || busy || !signedIn}>{busy ? 'Checking' : 'Redeem'}</Button>
      </form>
      {done && <p role="status" className="mt-4 rounded-xl border-2 border-line p-4 text-lg font-bold">{done}</p>}
    </Screen>
  );
}
