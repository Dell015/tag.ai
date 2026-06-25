'use client';

import { CardCategory, CardType } from '@/types/game';

export interface CardFaceProps {
  text: string;
  category: CardCategory;
  intensity: number;
  cardType: CardType;
}

/** Category display labels and colors */
const CATEGORY_STYLES: Record<CardCategory, { label: string; bg: string; text: string }> = {
  hot_takes: { label: 'Hot Takes', bg: 'bg-red-500/20', text: 'text-red-300' },
  relationships: { label: 'Relationships', bg: 'bg-pink-500/20', text: 'text-pink-300' },
  memories: { label: 'Memories', bg: 'bg-amber-500/20', text: 'text-amber-300' },
  confessions: { label: 'Confessions', bg: 'bg-violet-500/20', text: 'text-violet-300' },
  dares: { label: 'Dares', bg: 'bg-orange-500/20', text: 'text-orange-300' },
  hypotheticals: { label: 'Hypotheticals', bg: 'bg-cyan-500/20', text: 'text-cyan-300' },
  controversial: { label: 'Controversial', bg: 'bg-rose-500/20', text: 'text-rose-300' },
  roasts: { label: 'Roasts', bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
  deep_philosophical: { label: 'Deep', bg: 'bg-indigo-500/20', text: 'text-indigo-300' },
};

/**
 * Returns the font size class based on text length.
 * Shorter text gets larger size (26px), longer text gets smaller (20px).
 */
function getTextSizeClass(text: string): string {
  if (text.length <= 60) return 'text-[26px]';
  if (text.length <= 100) return 'text-[23px]';
  return 'text-[20px]';
}

/**
 * Revealed card component showing the card text, category tag pill (top-left),
 * and intensity dots 1-5 (top-right).
 */
export function CardFace({ text, category, intensity, cardType }: CardFaceProps) {
  const categoryStyle = CATEGORY_STYLES[category];
  const clampedIntensity = Math.max(1, Math.min(5, Math.round(intensity)));

  return (
    <div
      className={`relative w-full aspect-[3/4] rounded-[20px] overflow-hidden shadow-xl p-6 flex flex-col ${
        cardType === 'wild' ? 'bg-purple-900' : 'bg-gray-900'
      }`}
    >
      {/* Top row: category pill (left) + intensity dots (right) */}
      <div className="flex items-start justify-between mb-4">
        {/* Category pill */}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
        >
          {categoryStyle.label}
        </span>

        {/* Intensity dots */}
        <div className="flex items-center gap-1" aria-label={`Intensity ${clampedIntensity} of 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i < clampedIntensity ? 'bg-orange-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card text — centered in remaining space */}
      <div className="flex-1 flex items-center justify-center">
        <p
          className={`${getTextSizeClass(text)} font-semibold text-white text-center leading-snug`}
        >
          {text}
        </p>
      </div>

      {/* Card type indicator at bottom */}
      <div className="mt-4 flex justify-center">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {cardType}
        </span>
      </div>
    </div>
  );
}
