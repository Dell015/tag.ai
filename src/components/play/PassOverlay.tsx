'use client';
import { motion } from 'framer-motion';
import { Avatar, avatarColor } from '@/components/ui/Avatar';

/** Full-screen colour of the next player. You can see who's next from across the table. */
export function PassOverlay({ name, avatar, onReady }: { name: string; avatar: string; onReady: () => void }) {
  const c = avatarColor(avatar, name);
  return (
    <motion.button
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      onClick={onReady} aria-label={`Pass the phone to ${name}. Tap when you have it.`}
      style={{ background: c.bg, color: c.fg }}
      className="fixed inset-0 z-30 flex flex-col justify-between px-6 text-left safe-top safe-bottom"
    >
      <span className="mt-6 text-2xl font-extrabold">Pass the phone to</span>
      <span className="display break-words text-[7rem] leading-[0.85]">{name}</span>
      <span className="mb-4 flex items-center justify-between">
        <Avatar value={avatar} name={name} size={72} className="!bg-transparent border-4 border-current" />
        <span className="rounded-xl border-4 border-current px-6 py-4 text-2xl font-extrabold">Tap when you have it</span>
      </span>
    </motion.button>
  );
}
