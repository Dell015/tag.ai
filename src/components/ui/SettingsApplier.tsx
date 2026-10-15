'use client';
import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { useShopStore } from '@/stores/shop-store';
import { itemById } from '@/lib/data/shop-catalogue';

/** Mirrors display settings onto <html> data attributes (see globals.css). */
export function SettingsApplier() {
  const textSize = useSettingsStore((s) => s.textSize);
  const motion = useSettingsStore((s) => s.motion);
  const contrast = useSettingsStore((s) => s.highContrast);
  const hand = useSettingsStore((s) => s.leftHanded);
  const themeId = useShopStore((s) => s.equipped.theme);
  useEffect(() => {
    const v = themeId ? itemById(themeId)?.value : undefined;
    if (v) document.documentElement.style.setProperty('--accent', v); else document.documentElement.style.removeProperty('--accent');
  }, [themeId]);
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.text = textSize;
    el.dataset.motion = motion;
    el.dataset.contrast = contrast ? 'high' : 'normal';
    el.dataset.hand = hand ? 'left' : 'right';
  }, [textSize, motion, contrast, hand]);
  return null;
}
