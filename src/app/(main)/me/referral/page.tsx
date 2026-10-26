'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Screen, toast } from '@/components/ui';
import { appOrigin } from '@/lib/app-url';
import { useProfileStore } from '@/stores/profile-store';
import { useAccountStore } from '@/stores/account-store';
import { REFERRAL_COINS, myReferrals } from '@/lib/supabase/referral';

export default function ReferralPage() {
  const profile = useProfileStore((s) => s.profile)!;
  const signedIn = useAccountStore((a) => a.status === 'signedIn');
  const [stats, setStats] = useState<{ code: string; joined: number; paid: number } | null>(null);
  useEffect(() => { if (signedIn) void myReferrals().then(setStats); }, [signedIn]);
  const code = stats?.code ?? profile.id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
  const origin = appOrigin();
  const link = `${origin}/r/${code}`;
  const copy = async () => { try { await navigator.clipboard.writeText(link); toast('Link copied', { tone: 'ok' }); } catch { toast('Could not copy. Press and hold the link.', {}); } };
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'tag.ai', text: `Play tag.ai with me. We both get ${REFERRAL_COINS} coins.`, url: link }); return; } } catch { return; }
    copy();
  };
  return (
    <Screen title="Invite friends" back="/me">
      {!signedIn && <p className="mb-3 flex items-center gap-2 text-base text-muted"><Badge tone="line">Sample</Badge> Sign in to earn coins for invites.</p>}
      <p className="text-2xl font-extrabold">You and your friend each get {REFERRAL_COINS} coins when they play their first game.</p>
      <div className="mt-6 break-all rounded-xl border-2 border-line p-4 text-xl font-bold">{link}</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={copy}>Copy link</Button>
        <Button onClick={share}>Share</Button>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-3 border-t-2 border-line pt-3">
        <div><dd className="display text-6xl tabular-nums">{stats?.joined ?? 0}</dd><dt className="text-lg text-muted">friends joined</dt></div>
        <div><dd className="display text-6xl tabular-nums">{(stats?.paid ?? 0) * REFERRAL_COINS}</dd><dt className="text-lg text-muted">coins earned</dt></div>
      </dl>
      <h2 className="mb-2 mt-8 text-3xl">Rules</h2>
      <ul className="space-y-2 text-lg text-muted">
        <li>Your friend must be 18 or older and sign up with your link.</li>
        <li>Coins are added to both of you when they play their first game.</li>
        <li>You can earn from up to 20 friends.</li>
      </ul>
    </Screen>
  );
}
