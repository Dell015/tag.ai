'use client';
import { motion } from 'framer-motion';

const INK = '#181310';
const CARDS = [
  { fill: '#4274FF', rgb: '66 116 255', ink: '#fff', rot: -24, x: -104, y: 22 },
  { fill: '#30BE70', rgb: '48 190 112', ink: INK, rot: -12, x: -52, y: 6 },
  { fill: '#FFC72C', rgb: '255 199 44', ink: INK, rot: 0, x: 0, y: -4 },
  { fill: '#FF82B2', rgb: '255 130 178', ink: INK, rot: 12, x: 52, y: 6 },
  { fill: '#E83C2E', rgb: '232 60 46', ink: '#fff', rot: 24, x: 104, y: 22 },
];

/** Five printed cards dealt onto the home screen once: hazard stripes top and bottom, like the jeepney trim. */
export function Dealt({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className} style={{ position: 'relative', width: 340, height: 270 }}>
      {CARDS.map((c, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 160, y: -80, rotate: 50 }}
          animate={{ opacity: 1, x: c.x, y: c.y, rotate: c.rot }}
          transition={{ type: 'spring', stiffness: 170, damping: 17, delay: 0.2 + i * 0.1 }}
          style={{ position: 'absolute', left: 95, top: 6, width: 150, height: 214, background: c.fill, color: c.ink, borderRadius: 16, border: `3px solid ${INK}`, boxShadow: '0 5px 0 rgba(0,0,0,0.35)', overflow: 'hidden', ['--trim-a' as string]: c.rgb, ['--trim-b' as string]: '24 19 16' } as React.CSSProperties}
          className="flex flex-col justify-between">
          <span className="trim h-3 w-full" />
          <span className="sign px-3 text-[0.9rem]">tag.ai</span>
          <span className="sign self-end px-3 text-[3.6rem] leading-none">?</span>
          <span className="trim h-3 w-full" />
        </motion.div>
      ))}
      <motion.span initial={{ opacity: 0, scale: 0.6, rotate: 0 }} animate={{ opacity: 1, scale: 1, rotate: 4 }} transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 16 }}
        className="absolute -right-1 top-0 rounded-lg bg-[#f4f1ec] px-3 py-1.5 text-sm font-extrabold text-[#181310] shadow-[0_4px_0_rgba(0,0,0,0.4)]">
        one phone, one table
      </motion.span>
    </div>
  );
}
