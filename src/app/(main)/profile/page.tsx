'use client';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarPicker, Button, Screen, toast } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { useState } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile)!;
  const update = useProfileStore((s) => s.updateProfile);
  const signOut = useProfileStore((s) => s.signOut);
  const saved = useProfileStore((s) => s.savedCardIds.length);
  const [name, setName] = useState(profile.username);

  return (
    <Screen title="Me">
      <div className="flex items-center gap-4">
        <Avatar value={profile.avatar} size={72} />
        <input
          value={name}
          maxLength={16}
          aria-label="Nickname"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim().length >= 2 && name.trim() !== profile.username) {
              update({ username: name.trim() });
              toast('Saved', { tone: 'ok' });
            } else setName(profile.username);
          }}
          className="h-cta min-w-0 flex-1 rounded-2xl bg-surface px-4 text-2xl font-bold ring-1 ring-white/10"
        />
      </div>
      <div className="mt-5"><AvatarPicker value={profile.avatar} onChange={(a) => update({ avatar: a })} /></div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-card bg-surface p-4 ring-1 ring-white/10"><div className="text-3xl font-extrabold">🪙 {profile.coins}</div><div className="text-muted">coins</div></div>
        <div className="rounded-card bg-surface p-4 ring-1 ring-white/10"><div className="text-3xl font-extrabold">❤️ {saved}</div><div className="text-muted">saved cards</div></div>
      </div>
      <Button variant="danger" full className="mt-8" onClick={() => { if (window.confirm('Reset your profile on this phone?')) { signOut(); router.replace('/welcome'); } }}>
        Reset profile
      </Button>
    </Screen>
  );
}
