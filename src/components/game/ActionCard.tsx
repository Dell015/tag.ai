'use client';

import { CardCategory } from '@/types/game';

export interface ActionCardProps {
  text: string;
  category: CardCategory;
  intensity: number;
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
 * Returns the font size class for action card text (20-24px range).
 * Shorter text gets the larger end, longer text the smaller end.
 */
function getActionTextSizeClass(text: string): string {
  if (text.length <= 60) return 'text-[24px]';
  if (text.length <= 100) return 'text-[22px]';
  return 'text-[20px]';
}

/**
 * Action card component with a visually distinct warm dark teal gradient.
 * Displays an action emoji, energetic bold text, category pill, and intensity dots.
 * Dismissal behavior is identical to question cards (handled by SwipeHandler parent).
 *
 * Validates: Requirements 21.1, 21.2, 21.3
 */
export function ActionCard({ text, category, intensity }: ActionCardProps) {
  const categoryStyle = CATEGORY_STYLES[category];
  const clampedIntensity = Math.max(1, Math.min(5, Math.round(intensity)));

  return (
    <div
      className="relative w-full aspect-[3/4] rounded-[20px] overflow-hidden shadow-xl p-6 flex flex-col bg-gradient-to-br from-teal-800 to-teal-950"
      role="article"
      aria-label="Action card"
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

      {/* Action emoji */}
      <div className="flex justify-center mt-2 mb-2">
        <span className="text-4xl" role="img" aria-label="Action">
          🏃
        </span>
      </div>

      {/* Card text — centered, bold, energetic styling */}
      <div className="flex-1 flex items-center justify-center">
        <p
          className={`${getActionTextSizeClass(text)} font-bold text-white text-center leading-snug`}
        >
          {text}
        </p>
      </div>

      {/* Card type indicator at bottom */}
      <div className="mt-4 flex justify-center">
        <span className="text-xs text-teal-300/70 uppercase tracking-wider font-semibold">
          Action
        </span>
      </div>
    </div>
  );
}
