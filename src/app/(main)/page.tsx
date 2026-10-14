'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Logo } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { rooms } from '@/lib/data/rooms';

export default function HomePage() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile)!;

  const host = () => {
    const room = rooms.create({ id: profile.id, name: profile.username, avatar: profile.avatar });
    router.push(`/game/${room.code}`);
  };

  return (
    <div className="px-4 safe-top">
      <header className="flex items-center justify-between">
        <Logo className="text-3xl" />
        <Link href="/profile" className="flex h-tap items-center gap-2 rounded-full bg-surface pl-4 pr-1.5 ring-1 ring-white/10">
          <span className="font-bold tabular-nums">🪙 {profile.coins}</span>
          <Avatar value={profile.avatar} size={44} />
        </Link>
      </header>

      <section className="mt-10">
        <p className="text-lg text-muted">Kumusta, {profile.username}!</p>
        <h1 className="text-balance text-5xl font-extrabold leading-[1.05]">Who&apos;s drinking tonight?</h1>
      </section>

      <section className="mt-8 space-y-3">
        <Button size="lg" full onClick={host}>🎮 Host a game</Button>
        <Link href="/join" className="block">
          <Button size="lg" variant="secondary" full>🎯 Join with a code</Button>
        </Link>
      </section>

      <section className="mt-8 rounded-card bg-surface p-5 ring-1 ring-white/10">
        <h2 className="text-xl font-extrabold">How it works</h2>
        <ol className="mt-3 space-y-3 text-base text-muted">
          <li><b className="text-ink">1.</b> Host a room, barkada joins with the code (or the host adds friends by name).</li>
          <li><b className="text-ink">2.</b> Pick a vibe and the house rules.</li>
          <li><b className="text-ink">3.</b> Pass the phone. Read the card out loud. Dare or drink.</li>
        </ol>
      </section>
    </div>
  );
}
