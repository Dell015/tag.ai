'use client';

import { ReactNode } from 'react';

export interface CardStackProps {
  children: ReactNode;
}

/**
 * Card stack component that wraps the current card and positions 2 "shadow" cards
 * behind at 96% and 92% scale, offset 6px and 12px down. Gives the visual effect
 * of a stack of cards waiting to be drawn.
 */
export function CardStack({ children }: CardStackProps) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      {/* Third card (deepest - 92% scale, 12px offset) */}
      <div
        className="absolute inset-0 rounded-[20px] bg-gray-800 shadow-lg"
        style={{
          transform: 'scale(0.92) translateY(12px)',
          transformOrigin: 'top center',
        }}
        aria-hidden="true"
      />

      {/* Second card (middle - 96% scale, 6px offset) */}
      <div
        className="absolute inset-0 rounded-[20px] bg-gray-800 shadow-lg"
        style={{
          transform: 'scale(0.96) translateY(6px)',
          transformOrigin: 'top center',
        }}
        aria-hidden="true"
      />

      {/* Current card (top - full scale) */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
