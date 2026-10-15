'use client';
import { Badge, Button, Screen, toast } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';

export default function ReferralPage() {
  const profile = useProfileStore((s) => s.profile)!;
  const code = profile.id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
  const link = `https://tag.ai/r/${code}`;
  const copy = async () => { try { await navigator.clipboard.writeText(link); toast('Link copied', { tone: 'ok' }); } catch { toast('Could not copy. Press and hold the link.', {}); } };
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'tag.ai', text: 'Play tag.ai with me. We both get 5 coins.', url: link }); return; } } catch { return; }
    copy();
  };
  return (
    <Screen title="Invite friends" back="/me">
      <p className="mb-3 flex items-center gap-2 text-base text-muted"><Badge tone="line">Sample</Badge> Rewards start when accounts launch.</p>
      <p className="text-2xl font-extrabold">You and your friend each get 5 coins when they sign up.</p>
      <div className="mt-6 break-all rounded-xl border-2 border-line p-4 text-xl font-bold">{link}</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={copy}>Copy link</Button>
        <Button onClick={share}>Share</Button>
      </div>
      <dl className="mt-8 border-t-2 border-line pt-3"><dd className="display text-6xl">0</dd><dt className="text-lg text-muted">friends joined</dt></dl>
      <h2 className="mb-2 mt-8 text-3xl">Rules</h2>
      <ul className="space-y-2 text-lg text-muted">
        <li>Your friend must be 18 or older and sign up with your link.</li>
        <li>Coins are added when they finish their first game.</li>
        <li>No limit on how many friends you invite.</li>
      </ul>
    </Screen>
  );
}
