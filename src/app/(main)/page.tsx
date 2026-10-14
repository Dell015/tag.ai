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
    <div className="flex min-h-[calc(100dvh-4.25rem)] flex-col px-4 safe-top">
      <header className="flex items-center justify-between">
        <Logo className="text-3xl" />
        <Link href="/profile" aria-label="Your profile" className="flex h-tap items-center gap-3 rounded-full border-2 border-line pl-4 pr-1.5">
          <span className="font-extrabold tabular-nums">{profile.coins} coins</span>
          <Avatar value={profile.avatar} name={profile.username} size={42} />
        </Link>
      </header>

      <section className="mt-12">
        <p className="text-xl font-bold text-muted">Kumusta, {profile.username}.</p>
        <h1 className="mt-2 text-[4.5rem] leading-[0.92]">Who&apos;s drinking tonight?</h1>
      </section>

      <section className="mt-auto space-y-3 pb-6 pt-10">
        <Button size="lg" full onClick={host}>Host a game</Button>
        <Link href="/join" className="block"><Button size="lg" variant="secondary" full>Join with a code</Button></Link>
        <p className="pt-2 text-center text-muted">Host picks the vibe. Everyone agrees to the rules. Then pass the phone.</p>
      </section>
    </div>
  );
}
