'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const DECK = ['#4274FF', '#FFC72C', '#FF82B2', '#E83C2E', '#FF7022', '#30BE70'];

/** The six stack colours dealt out like a hand of cards. Tap the hand to shuffle it. */
export function DeckFan({ className }: { className?: string }) {
  const [order, setOrder] = useState(DECK);
  const [spin, setSpin] = useState(0);
  const shuffle = () => {
    setSpin((n) => n + 1);
    setOrder((o) => [...o.slice(1), o[0]]);
  };
  return (
    <div aria-hidden onClick={shuffle} className={className} style={{ position: 'relative', height: 220, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
      {order.map((c, i) => (
        <motion.div
          key={c}
          layout
          initial={{ y: 260, rotate: 0, opacity: 0 }}
          animate={{ y: 0, rotate: (i - 2.5) * 13, opacity: 1 }}
          whileTap={{ y: -10 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20, delay: spin === 0 ? i * 0.08 : 0 }}
          style={{
            position: 'absolute', left: '50%', bottom: 0, width: 132, height: 188, marginLeft: -66,
            background: c, borderRadius: 18, border: '3px solid #181310', transformOrigin: '50% 140%', zIndex: i,
          }}
        />
      ))}
    </div>
  );
}
