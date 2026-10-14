'use client';
import { motion } from 'framer-motion';
import { Avatar, Button } from '@/components/ui';

/** Full-screen "hand the phone over" moment. Always names who holds it next. */
export function PassOverlay({ name, avatar, onReady }: { name: string; avatar: string; onReady: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-bg/95 px-6 backdrop-blur-md safe-top safe-bottom"
    >
      <p className="text-xl font-semibold text-muted">Pass the phone to</p>
      <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
        <Avatar value={avatar} size={160} className="shadow-glow" />
      </motion.div>
      <h2 className="max-w-full truncate font-display text-6xl font-extrabold">{name}</h2>
      <Button size="lg" full onClick={onReady} className="mt-6 max-w-sm">I&apos;ve got it</Button>
    </motion.div>
  );
}
