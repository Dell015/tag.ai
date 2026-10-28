'use client';
import Link from 'next/link';
import { Avatar, AvatarPicker, CoinAmount, CoinStack, stackFor, Icon, ListRow, Plate, Screen, Section, toast } from '@/components/ui';
import { completeProfile } from '@/lib/supabase/account';
import { refreshAccount } from '@/components/AuthSync';
import { photoToAvatar } from '@/lib/avatar-photo';
import { useProfileStore } from '@/stores/profile-store';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useInboxStore } from '@/stores/inbox-store';
import { supabaseConfigured } from '@/lib/supabase/config';
import { useShopStore } from '@/stores/shop-store';
import { useAccountStore } from '@/stores/account-store';
import { itemById } from '@/lib/data/shop-catalogue';

export default function MePage() {
  const profile = useProfileStore((s) => s.profile)!;
  const update = useProfileStore((s) => s.updateProfile);
  const saved = useProfileStore((s) => s.savedCardIds.length);
  const frameId = useShopStore((st) => st.equipped.frame);
  const unread = useInboxStore((i) => i.unread);
  const { requests } = useNotifications();
  const loadInbox = useInboxStore((i) => i.load);
  useEffect(() => { if (supabaseConfigured) void loadInbox(); }, [loadInbox]);
  const [name, setName] = useState(profile.username);
  const [editing, setEditing] = useState(false);

  const connected = useAccountStore((a) => a.status === 'signedIn');
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  /** Saves name and look. With an account it goes to the server, so it survives signing in on another phone. */
  const save = async (next: { username?: string; avatar?: string }) => {
    const username = next.username ?? profile.username;
    const avatar = next.avatar ?? profile.avatar;
    if (connected) {
      const r = await completeProfile(username, avatar);
      if (!r.ok) { toast(r.error ?? 'Could not save.', { tone: 'warn' }); setName(profile.username); return false; }
      await refreshAccount();
    } else update({ username, avatar });
    return true;
  };

  const commit = async () => {
    const n = name.trim();
    if (n.length >= 2 && n !== profile.username) { if (await save({ username: n })) toast('Saved', { tone: 'ok' }); }
    else setName(profile.username);
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const r = await photoToAvatar(file, connected ? profile.id : null);
    if (!r.ok) { setBusy(false); toast(r.error, { tone: 'warn' }); return; }
    if (await save({ avatar: r.value })) toast('Photo saved', { tone: 'ok' });
    setBusy(false);
  };

  return (
    <Screen title="Me">
      <div className="flex items-center gap-4">
        <button onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Change your photo" className="relative shrink-0 active:scale-95">
          <Avatar value={profile.avatar} name={profile.username} size={80} frame={frameId ? itemById(frameId)?.value : undefined} className={busy ? 'opacity-50' : undefined} />
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg bg-accent text-onaccent"><Icon name="camera" size={16} /></span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
        <input
          value={name} maxLength={16} aria-label="Nickname"
          onChange={(e) => setName(e.target.value)} onBlur={() => void commit()}
          className="h-cta min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-3xl font-extrabold focus:border-accent"
        />
      </div>
      <button onClick={() => setEditing((v) => !v)} className="mt-4 h-tap text-base font-extrabold text-accent">{editing ? 'Done' : 'Use a colour instead of a photo'}</button>
      {editing && <div className="mb-2"><AvatarPicker value={profile.avatar} onChange={(a) => void save({ avatar: a })} /></div>}

      <p className="mt-1 text-sm text-muted">This is the name and photo your friends see.</p>

      <Link href="/me/wallet" aria-label="Balance, open your wallet" className="mt-5 flex items-center justify-between rounded-2xl border-b-4 border-black/35 bg-[#FFC72C] px-5 py-4 text-[#181310] active:translate-y-px">
        <div>
          <p className="text-sm font-extrabold">Balance, tap for history</p>
          <CoinAmount value={profile.coins} className="display text-[2.6rem]" />
        </div>
        <CoinStack count={stackFor(profile.coins)} size={72} />
      </Link>

      <Section className="mt-6" title="Your stuff">
        <Plate>
          <ListRow icon="mail" tone="blue" label="Notifications" hint={unread ? `${unread} new` : 'Invites, updates and gifts'} value={unread || undefined} href="/me/inbox" />
          <ListRow icon="wallet" tone="yellow" label="Wallet" hint="Balance and history" href="/me/wallet" />
          <ListRow icon="heart" tone="pink" label="Saved cards" hint="Cards you hearted in a game" value={saved} href="/me/saved" />
          <ListRow icon="plus" tone="green" label="Suggest a card" hint="Write a card for the game" href="/me/suggest" />
          <ListRow icon="up" tone="orange" label="Leaderboard" hint="Top cards and card makers from the Cards tab" href="/me/leaderboard" />
          {connected && <ListRow icon="users" tone="green" label="Friends" hint={requests ? `${requests} new ${requests === 1 ? 'request' : 'requests'}` : 'See who is online, invite them to a room'} value={requests || undefined} href="/me/friends" />}
          <ListRow icon="users" tone="blue" label="Invite friends" hint="You and a friend each get 30 coins" href="/me/referral" />
          <ListRow icon="plus" tone="yellow" label="Redeem a code" hint="Voucher or friend code" href="/me/redeem" />
        </Plate>
      </Section>
      <Section title="App">
        <Plate>
          <ListRow icon="sliders" tone="green" label="Settings" hint="Game defaults, playing, display" href="/me/settings" />
          <ListRow icon="info" tone="blue" label="Help" hint="How to play and answers to common questions" href="/help" />
        </Plate>
      </Section>
    </Screen>
  );
}
