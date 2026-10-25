'use client';
import { Avatar, AvatarPicker, CoinAmount, CoinStack, ListRow, Plate, Screen, Section, toast } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { useState } from 'react';
import { useShopStore } from '@/stores/shop-store';
import { useAccountStore } from '@/stores/account-store';
import { itemById } from '@/lib/data/shop-catalogue';

export default function MePage() {
  const profile = useProfileStore((s) => s.profile)!;
  const update = useProfileStore((s) => s.updateProfile);
  const saved = useProfileStore((s) => s.savedCardIds.length);
  const isAdmin = useAccountStore((a) => a.isAdmin);
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

      <div className="mt-5 flex items-center justify-between rounded-2xl border-b-4 border-black/35 bg-[#FFC72C] px-5 py-4 text-[#181310]">
        <div>
          <p className="text-sm font-extrabold">Balance</p>
          <CoinAmount value={profile.coins} className="display text-[2.6rem]" />
        </div>
        <CoinStack count={Math.max(1, Math.min(5, Math.ceil(profile.coins / 10)))} size={72} />
      </div>

      <Section className="mt-6" title="Your stuff">
        <Plate>
          <ListRow icon="coin" tone="yellow" label="Wallet" hint="Balance and history" href="/me/wallet" />
          <ListRow icon="heart" tone="pink" label="Saved cards" value={saved} href="/me/saved" />
          <ListRow icon="plus" tone="green" label="Suggest a card" hint="Write a card, friends like it" href="/me/suggest" />
          <ListRow icon="up" tone="orange" label="Leaderboard" hint="Sample data until accounts launch" href="/me/leaderboard" />
          <ListRow icon="users" tone="blue" label="Invite friends" hint="You and a friend each get 5 coins" href="/me/referral" />
        </Plate>
      </Section>
      <Section title="App">
        <Plate>
          <ListRow icon="sliders" tone="green" label="Settings" hint="Game defaults, playing, display" href="/me/settings" />
          {isAdmin && <ListRow icon="sliders" tone="red" label="Admin" hint="Suggestions, cards, blocked words" href="/me/admin" />}
          <ListRow icon="info" tone="blue" label="Help" hint="How to play and FAQ" href="/help" />
        </Plate>
      </Section>
    </Screen>
  );
}
