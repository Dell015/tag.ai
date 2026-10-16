'use client';
import { MotionConfig } from 'framer-motion';
import { useSettingsStore } from '@/stores/settings-store';

/** One switch for all motion: the Reduce motion setting, or the phone's own preference, turns movement off. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const motion = useSettingsStore((s) => s.motion);
  return <MotionConfig reducedMotion={motion === 'reduce' ? 'always' : 'user'}>{children}</MotionConfig>;
}
