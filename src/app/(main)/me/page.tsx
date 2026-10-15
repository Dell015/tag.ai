'use client';
import { Avatar, AvatarPicker, CoinAmount, ListRow, Screen, toast } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { useState } from 'react';
import { useShopStore } from '@/stores/shop-store';
import { itemById } from '@/lib/data/shop-catalogue';

export default function MePage() {
  const profile = useProfileStore((s) => s.profile)!;
  const update = useProfileStore((s) => s.updateProfile);
  const saved = useProfileStore((s) => s.savedCardIds.length);
  const frameId = useShopStore((st) => st.equipped.frame);
  const [name, setName] = useState(profile.username);
  const [editing, setEditing] = useState(false);

  const commit = () => {
    const n = name.trim();
    if (n.length >= 2 && n !== profile.username) { update({ username: n }); toast('Saved', { tone: 'ok' }); }
    else setName(profile.username);
  };

  return (
    <Screen title="Me">
      <div className="flex items-center gap-4">
        <Avatar value={profile.avatar} name={profile.username} size={72} frame={frameId ? itemById(frameId)?.value : undefined} />
        <input
          value={name} maxLength={16} aria-label="Nickname"
          onChange={(e) => setName(e.target.value)} onBlur={commit}
          className="h-cta min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-3xl font-extrabold focus:border-accent"
        />
      </div>
      <button onClick={() => setEditing((v) => !v)} className="mt-4 h-tap text-base font-extrabold text-accent">{editing ? 'Done' : 'Change colour'}</button>
      {editing && <div className="mb-2"><AvatarPicker value={profile.avatar} onChange={(a) => update({ avatar: a })} /></div>}

      <div className="mt-6 flex items-end justify-between border-t-2 border-line pt-4">
        <div>
          <p className="text-base font-bold text-muted">Balance</p>
          <CoinAmount value={profile.coins} className="display text-5xl" />
        </div>
      </div>

      <nav className="mt-6" aria-label="Me">
        <ListRow label="Wallet" hint="Balance and history" href="/me/wallet" />
        <ListRow label="Saved cards" value={saved} href="/library?tab=saved" />
        <ListRow label="Leaderboard" hint="Sample data until accounts launch" href="/me/leaderboard" />
        <ListRow label="Invite friends" hint="You and a friend each get 5 coins" href="/me/referral" />
        <ListRow label="Settings" hint="Game defaults, playing, display" href="/me/settings" />
        <ListRow label="Help" hint="How to play and FAQ" href="/help" />
      </nav>
    </Screen>
  );
}
