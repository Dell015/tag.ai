/**
 * Settings store: every preference on /me/settings. Persisted to localStorage
 * (`tagai-settings`). Stage B can mirror this to the users table.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { MAX_CUSTOM_RULES } from '@/lib/game/setup-options';

export type TextSize = 'normal' | 'large' | 'xlarge';
export type MotionPref = 'system' | 'reduce' | 'full';
export type PotStyle = 'solo' | 'split';
export type Language = 'en' | 'fil' | 'taglish';

export interface Settings {
  // Game defaults
  defaultDeck: string;
  defaultLength: number;
  skipTopics: string[];
  defaultDrinkRule: string;
  nonDrinkingDefault: boolean;
  customRules: string[];
  potStyle: PotStyle;
  // Playing
  vibration: boolean;
  sounds: boolean;
  volume: number; // 0..1
  keepAwake: boolean;
  swipe: boolean;
  undoSeconds: 3 | 5 | 8;
  confirmTrash: boolean;
  showPips: boolean;
  showRules: boolean;
  leftHanded: boolean;
  // Display
  textSize: TextSize;
  motion: MotionPref;
  highContrast: boolean;
  language: Language;
  // Developer
  testPurchases: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDeck: 'barkada',
  defaultLength: 20,
  skipTopics: [],
  defaultDrinkRule: 'Classic',
  nonDrinkingDefault: false,
  customRules: [],
  potStyle: 'solo',
  vibration: true,
  sounds: false,
  volume: 0.6,
  keepAwake: true,
  swipe: true,
  undoSeconds: 5,
  confirmTrash: false,
  showPips: true,
  showRules: true,
  leftHanded: false,
  textSize: 'normal',
  motion: 'system',
  highContrast: false,
  language: 'en',
  testPurchases: false,
};

interface SettingsState extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  addRule: (text: string) => boolean;
  removeRule: (text: string) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      addRule: (text) => {
        const t = text.trim();
        const { customRules } = get();
        if (!t || customRules.length >= MAX_CUSTOM_RULES || customRules.includes(t)) return false;
        set({ customRules: [...customRules, t] });
        return true;
      },
      removeRule: (text) => set((s) => ({ customRules: s.customRules.filter((r) => r !== text) })),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'tagai-settings',
      version: 1,
      storage: safeStorage(),
      skipHydration: true,
      partialize: (s) => {
        const { set: _s, addRule: _a, removeRule: _r, reset: _x, ...data } = s;
        void _s; void _a; void _r; void _x;
        return data;
      },
    }
  )
);

/** Non-hook read for code outside React (haptics, sound). */
export const getSettings = (): Settings => useSettingsStore.getState();
