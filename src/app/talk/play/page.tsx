'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button, ConfirmSheet, Icon, Splash, toast } from '@/components/ui';
import { useRequireProfile } from '@/lib/use-profile';
import { useTalkStore } from '@/stores/talk-store';
import { useWalletStore } from '@/stores/wallet-store';
import { TALK_GROUPS } from '@/lib/data/talk-topics';
import { formatPot } from '@/lib/game/pot';

export default function TalkPlayPage() {
  const router = useRouter();
  const { ready } = useRequireProfile('/talk');
  const t = useTalkStore();
  const [ending, setEnding] = useState(false);
  const leaving = useRef(false);
  const dir = useRef(1);

  useEffect(() => { if (ready && !t.active && !leaving.current) router.replace('/talk'); }, [ready, t.active, router]);
  if (!ready || !t.active) return <Splash />;

  const total = t.queue.length;
  const done = t.index >= total;
  const topic = t.queue[t.index];
  const group = topic ? TALK_GROUPS.find((g) => g.id === topic.group)?.label : '';

  const leave = (to: string) => {
    leaving.current = true;
    const back = t.finish();
    if (back > 0 && useWalletStore.getState().apply('refund', back, 'Unused topics')) toast(`${formatPot(back)} coins back to your wallet`, { tone: 'ok' });
    router.replace(to);
  };

  return (
    <div data-mode="family" className="flex h-dvh flex-col px-4 safe-top safe-bottom">
      <header className="flex items-center justify-between gap-3">
        <button onClick={() => (done ? leave('/') : setEnding(true))} aria-label="End topic deck" className="flex h-tap w-tap items-center justify-center rounded-xl border-2 border-line"><Icon name="close" /></button>
        <p className="text-lg font-bold text-muted">{done ? `${total} topics done` : `Topic ${t.index + 1} of ${total}`}</p>
      </header>

      {done ? (
        <main className="flex flex-1 flex-col justify-center">
          <h1 className="text-[3.2rem] leading-[0.95]">That is all of them.</h1>
          <p className="mt-4 text-xl text-muted">Go back if there is one you want to talk about more.</p>
        </main>
      ) : (
        <main className="relative my-4 flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={dir.current}>
            <motion.div key={topic.id} custom={dir.current}
              variants={{ enter: (d: number) => ({ x: `${d * 105}%`, rotate: d * 5, opacity: 0 }), center: { x: 0, rotate: 0, opacity: 1 }, exit: (d: number) => ({ x: `${d * -105}%`, rotate: d * -5, opacity: 0 }) }}
              initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 230, damping: 28 }}
              style={{ '--trim-a': 'var(--on-accent)', '--trim-b': 'var(--accent)' } as React.CSSProperties}
              className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-card bg-accent p-6 text-onaccent">
              <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-lg border-2 border-current opacity-20" />
              <span aria-hidden className="trim absolute inset-x-0 top-0 h-3" />
              <p className="mt-3 text-lg font-bold">{group}</p>
              <p className="display text-[2.5rem] leading-[1.02]" style={{ fontSize: topic.text.length > 90 ? '2.1rem' : undefined }}>{topic.text}</p>
              <span className="sign text-[0.7rem] opacity-60">tag.ai</span>
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      <footer className="space-y-3 pb-2 pt-2">
        {done ? (
          <>
            <Button size="lg" full onClick={() => leave('/talk')}>Play again</Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={t.back}>Back</Button>
              <Button variant="secondary" onClick={() => leave('/')}>Back home</Button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <Button size="lg" variant="secondary" disabled={t.index === 0} onClick={() => { dir.current = -1; t.back(); }}>Back</Button>
            <Button size="lg" onClick={() => { dir.current = 1; t.next(); }}>{t.index === total - 1 ? 'Finish' : 'Next topic'}</Button>
          </div>
        )}
      </footer>
      <ConfirmSheet open={ending} title="End the topic deck?" body="Topics you have not reached are refunded to your wallet." confirmLabel="End and go home" danger onConfirm={() => leave('/')} onClose={() => setEnding(false)} />
    </div>
  );
}
