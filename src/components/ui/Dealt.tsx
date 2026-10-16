'use client';
import { motion } from 'framer-motion';

const CARDS = [
  { fill: '#4274FF', ink: '#fff', rot: -13, x: -46, y: 6 },
  { fill: '#FF82B2', ink: '#181310', rot: 9, x: 40, y: 12 },
  { fill: '#FFC72C', ink: '#181310', rot: -2, x: 0, y: -6 },
];

/** Three printed cards dealt onto the home screen once. The one decorative moment in the app. */
export function Dealt({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className} style={{ position: 'relative', width: 190, height: 200 }}>
      {CARDS.map((c, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 120, y: -60, rotate: 40 }}
          animate={{ opacity: 1, x: c.x, y: c.y, rotate: c.rot }}
          transition={{ type: 'spring', stiffness: 170, damping: 17, delay: 0.25 + i * 0.14 }}
          style={{ position: 'absolute', left: 35, top: 8, width: 120, height: 168, background: c.fill, color: c.ink, borderRadius: 12, border: '3px solid #0c0a08' }}
          className="flex flex-col justify-between p-3">
          <span className="sign text-[0.8rem]">tag.ai</span>
          <span className="sign self-end text-[3.2rem] leading-none">?</span>
        </motion.div>
      ))}
    </div>
  );
}
