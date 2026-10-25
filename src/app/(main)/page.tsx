'use client';
import { ADULT_TOPIC } from '@/lib/adult';
import { formatPot } from '@/lib/game/pot';
import { useSettingsStore } from '@/stores/settings-store';
import { useShopStore } from '@/stores/shop-store';
import { itemById } from '@/lib/data/shop-catalogue';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, CoinStack, stackFor, Dealt, Icon, RollNumber } from '@/components/ui';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useProfileStore } from '@/stores/profile-store';
import { rooms } from '@/lib/data/rooms';
import { LAST_ROOM_KEY } from '@/lib/data/start-game';
import { useGameStore } from '@/stores/game-store';
import { useTalkStore } from '@/stores/talk-store';
import { useEffect, useState } from 'react';

const TIPS = [
  'Add friends by name. They do not need an account.',
  'Skip is always allowed. Nobody has to answer.',
  'Wild cards are free. They never use coins from the pot.',
  'Pick how many cards to buy from each stack. Cheap stacks last longer.',
];

export default function HomePage() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile)!;
  const phase = useGameStore((s) => s.sessionPhase);
  const talking = useTalkStore((s) => s.active);
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
        comfortFilters: d.skipTopics.filter((t) => t !== ADULT_TOPIC),
        drinkRuleTemplate: d.defaultDrinkRule,
        nonDrinkingMode: d.nonDrinkingDefault,
        customDrinkRules: d.customRules,
      },
    }));
    router.push(`/game/${room.code}`);
  };

  const cardNo = useGameStore((s) => s.currentCardIndex + 1);
  const cardTotal = useGameStore((s) => s.cardCountTarget);
  const topicNo = useTalkStore((s) => s.index + 1);
  const topicTotal = useTalkStore((s) => s.queue.length);

  const rows: { key: string; title: string; sub: string; hot?: boolean; href?: string; onClick?: () => void }[] = [
    ...(resume ? [{ key: 'resume', title: 'Resume game', sub: `Card ${cardNo} of ${cardTotal}`, hot: true, href: `/game/${resume}/play` }] : []),
    ...(talking ? [{ key: 'resume-talk', title: 'Resume topics', sub: `Topic ${Math.min(topicNo, topicTotal)} of ${topicTotal}`, hot: !resume, href: '/talk/play' }] : []),
    { key: 'game', title: 'Drinking game', sub: 'Cards, dares and shots. Add friends by name.', onClick: host },
    { key: 'talk', title: 'Topic stack', sub: 'Just talk. Debates, dilemmas and stories.', href: '/talk' },
  ];

  return (
    <div className="mx-auto flex overflow-x-clip min-h-[calc(100dvh-5.5rem-max(env(safe-area-inset-bottom),14px))] max-w-md flex-col px-4 pb-3 safe-top lg:grid lg:min-h-dvh lg:max-w-5xl lg:grid-cols-2 lg:content-center lg:gap-x-16 lg:px-10">
      <header className="flex items-center justify-end lg:hidden">
        <Link href="/me" aria-label={`Your profile, ${formatPot(profile.coins)} coins`} className="flex h-tap items-center gap-3 rounded-lg border-2 border-line pl-4 pr-1.5">
          <span className="inline-flex items-center gap-1.5 font-extrabold tabular-nums"><CoinStack count={stackFor(profile.coins)} size={28} /><RollNumber value={profile.coins} format={formatPot} /></span>
          <Avatar value={profile.avatar} name={profile.username} size={38} frame={frameValue} />
        </Link>
      </header>

      <section className="mt-6 lg:col-start-1 lg:row-start-1 lg:self-end">
        <p className="text-lg text-muted">Kumusta, {profile.username}.</p>
        <h1 className="mt-3 text-[3.4rem] leading-[0.9] lg:text-[5rem]">Who&apos;s drinking<br />tonight?</h1>
      </section>

      <div className="flex flex-1 items-center justify-center overflow-x-clip py-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:scale-110">
        <Dealt className="scale-[0.8] sm:scale-100" />
      </div>

      <section aria-label="Choose a game" className="space-y-3 pb-2 lg:col-start-1 lg:row-start-2 lg:mt-8 lg:self-start">
        {rows.map((r, i) => {
          const mode = r.key === 'talk' || r.key === 'resume-talk' ? 'icebreaker' : 'barkada';
          const inner = (
            <>
              <span className="min-w-0 flex-1">
                <span className="sign block text-[1.3rem]">{r.title}</span>
                <span className="mt-1.5 block text-sm font-bold opacity-80">{r.sub}</span>
              </span>
              <Icon name="chevron" size={26} />
            </>
          );
          const cls = cn('flex min-h-[5.25rem] w-full items-center gap-3 rounded-2xl border-b-4 border-black/35 px-4 py-3 text-left transition-transform active:translate-y-[3px] active:border-b-[1px]', r.hot ? 'bg-text text-bg' : 'bg-accent text-onaccent');
          return (
            <motion.div key={r.key} data-mode={mode} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.35 + i * 0.1 }}>
              {r.href ? <Link href={r.href} className={cls}>{inner}</Link> : <button onClick={() => { haptic('tap'); r.onClick?.(); }} className={cls}>{inner}</button>}
            </motion.div>
          );
        })}
        {!coach && tip && <Link href="/help" className="block pt-1 text-center text-sm text-muted">{tip}</Link>}
      </section>
    </div>
  );
}
