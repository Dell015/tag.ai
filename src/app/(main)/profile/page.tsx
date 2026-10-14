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
        <Avatar value={profile.avatar} name={profile.username} size={72} />
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
          className="h-cta min-w-0 flex-1 rounded-xl border-2 border-line bg-transparent px-4 text-3xl font-extrabold focus:border-accent"
        />
      </div>
            <p className="mb-3 mt-7 text-base font-bold text-muted">Colour</p>
      <AvatarPicker value={profile.avatar} onChange={(a) => update({ avatar: a })} />
      <dl className="mt-8 grid grid-cols-2 gap-4">
        <div className="border-t-2 border-line pt-3"><dd className="display text-6xl">{profile.coins}</dd><dt className="text-lg text-muted">coins</dt></div>
        <div className="border-t-2 border-line pt-3"><dd className="display text-6xl">{saved}</dd><dt className="text-lg text-muted">saved cards</dt></div>
      </dl>
      <Button variant="danger" full className="mt-10" onClick={() => { if (window.confirm('Reset your profile on this phone?')) { signOut(); router.replace('/welcome'); } }}>
        Reset profile
      </Button>
    </Screen>
  );
}
