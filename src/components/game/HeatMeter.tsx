'use client';

import { useGameStore } from '@/stores/game-store';

/**
 * HeatMeter — A 4px full-width bar at the top of the game screen
 * that visually represents the session's current heat level (1.0–5.0).
 *
 * Color mapping:
 *   Level 1 (1.0–1.99): blue (#3b82f6)
 *   Level 2 (2.0–2.99): green (#22c55e)
 *   Level 3 (3.0–3.99): gold (#eab308)
 *   Level 4 (4.0–4.99): orange (#f97316)
 *   Level 5 (5.0):       red (#ef4444)
 *
 * Validates: Requirements 22.1
 */

function getHeatColor(heatLevel: number): string {
  if (heatLevel >= 5.0) return '#ef4444';
  if (heatLevel >= 4.0) return '#f97316';
  if (heatLevel >= 3.0) return '#eab308';
  if (heatLevel >= 2.0) return '#22c55e';
  return '#3b82f6';
}

function getHeatWidth(heatLevel: number): number {
  // heatLevel ranges from 1.0 to 5.0
  // Map to 0% (at 1.0) to 100% (at 5.0)
  const clamped = Math.max(1.0, Math.min(5.0, heatLevel));
  return ((clamped - 1) / 4) * 100;
}

export function HeatMeter() {
  const heatLevel = useGameStore((state) => state.heatLevel);

  const widthPercent = getHeatWidth(heatLevel);
  const color = getHeatColor(heatLevel);

  return (
    <div
      className="fixed top-0 left-0 w-full h-1 z-50 bg-neutral-800"
      role="meter"
      aria-label="Heat meter"
      aria-valuenow={heatLevel}
      aria-valuemin={1}
      aria-valuemax={5}
    >
      <div
        className="h-full transition-all duration-500 ease-in-out"
        style={{
          width: `${widthPercent}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
