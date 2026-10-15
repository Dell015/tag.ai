'use client';
import type { GameMode } from '@/types/game';
import { formatPot } from '@/lib/game/pot';
import { useSettingsStore } from '@/stores/settings-store';
import { useShopStore } from '@/stores/shop-store';
import { itemById } from '@/lib/data/shop-catalogue';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Logo } from '@/components/ui';
import { useProfileStore } from '@/stores/profile-store';
import { rooms } from '@/lib/data/rooms';
import { LAST_ROOM_KEY } from '@/lib/data/start-game';
import { useGameStore } from '@/stores/game-store';
import { useEffect, useState } from 'react';

const TIPS = [
  'Add friends by name. They do not need an account.',
  'Skip is always allowed. Nobody has to answer.',
  'Wild cards are free. They never use coins from the pot.',
  'Save a card you love and build your own deck from it.',
];

export default function HomePage() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile)!;
  const phase = useGameStore((s) => s.sessionPhase);
  const [resume, setResume] = useState<string | null>(null);
  useEffect(() => {
    try {
      const code = window.localStorage.getItem(LAST_ROOM_KEY);
      const room = code ? rooms.get(code) : null;
      setResume(code && room && room.hostId === profile.id && room.status === 'active' && phase === 'play' ? code : null);
    } catch { setResume(null); }
  }, [phase, profile.id]);

  const frameId = useShopStore((st) => st.equipped.frame);
  const frameValue = frameId ? itemById(frameId)?.value : undefined;

  const [tip, setTip] = useState<string | null>(null);
  const [coach, setCoach] = useState(false);
  useEffect(() => {
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    try { setCoach(!window.localStorage.getItem('tagai-games-finished')); } catch { /* ignore */ }
  }, []);

  const host = () => {
    const room = rooms.create({ id: profile.id, name: profile.username, avatar: profile.avatar });
    const d = useSettingsStore.getState();
    rooms.update(room.code, (r) => ({
      ...r,
      config: {
        ...r.config,
        gameMode: d.defaultDeck as GameMode,
        cardCountTarget: d.defaultLength,
        comfortFilters: d.skipTopics,
        drinkRuleTemplate: d.defaultDrinkRule,
        nonDrinkingMode: d.nonDrinkingDefault,
        customDrinkRules: d.customRules,
      },
    }));
    router.push(`/game/${room.code}`);
  };

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] flex-col px-4 safe-top">
      <header className="flex items-center justify-between">
        <Logo className="text-3xl" />
        <Link href="/me" aria-label="Your profile" className="flex h-tap items-center gap-3 rounded-full border-2 border-line pl-4 pr-1.5">
          <span className="font-extrabold tabular-nums">{formatPot(profile.coins)} coins</span>
          <Avatar value={profile.avatar} name={profile.username} size={42} frame={frameValue} />
        </Link>
      </header>

      <section className="mt-12">
        <p className="text-xl font-bold text-muted">Kumusta, {profile.username}.</p>
        <h1 className="mt-2 text-[4.5rem] leading-[0.92]">Who&apos;s drinking tonight?</h1>
      </section>

      <section className="mt-auto space-y-3 pb-6 pt-10">
        {resume && <Link href={`/game/${resume}/play`} className="block"><Button size="lg" full>Resume your game</Button></Link>}
        <Button size="lg" full variant={resume ? 'secondary' : 'primary'} onClick={host}>Host a game</Button>
        <Link href="/join" className="block"><Button size="lg" variant="secondary" full>Join with a code</Button></Link>
        {coach ? <p className="pt-2 text-center text-lg font-bold">Start here. Host a game, then add your friends by name.</p>
          : tip && <Link href="/help" className="block pt-2 text-center text-muted">{tip}</Link>}
      </section>
    </div>
  );
}
