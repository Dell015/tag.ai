'use client';
import { useState } from 'react';

const DECK = ['#4274FF', '#FFC72C', '#FF82B2', '#E83C2E', '#FF7022', '#30BE70'];

/** The six stack colours dealt out like a hand of cards. Tap the hand to shuffle it. Motion is CSS only, so it stays smooth. */
export function DeckFan({ className }: { className?: string }) {
  const [order, setOrder] = useState(DECK);
  return (
    <div aria-hidden onClick={() => setOrder((o) => [...o.slice(1), o[0]])} className={className} style={{ position: 'relative', height: 220, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
      {order.map((c, i) => {
        const r = (i - 2.5) * 13;
        return (
          <div
            key={c}
            className="deal"
            style={{
              position: 'absolute', left: '50%', bottom: 0, width: 132, height: 188, marginLeft: -66,
              background: c, borderRadius: 18, border: '3px solid #181310', transformOrigin: '50% 140%', zIndex: i,
              transform: `rotate(${r}deg)`, transition: 'transform 450ms cubic-bezier(0.3, 1.4, 0.5, 1)', willChange: 'transform',
              ['--r' as string]: `${r}deg`, ['--d' as string]: `${DECK.indexOf(c) * 70}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
