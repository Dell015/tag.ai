import type { LucideProps } from 'lucide-react';
import {
  ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Coins, Copy, Dices, Download, Flame, Heart, Info, Layers, Lock, Minus, Pause,
  Camera, Mail, Pencil, Play, Plus, RefreshCw, Search, Share, ShoppingBag, SkipForward, SlidersHorizontal, Snowflake, Timer, Trash2, Undo2, User, Users, Wallet, Wine, X,
} from 'lucide-react';

const ICONS = {
  back: ChevronLeft, close: X, pause: Pause, trash: Trash2, skip: SkipForward, heart: Heart, check: Check, share: Share, plus: Plus,
  play: Play, cards: Layers, user: User, undo: Undo2, minus: Minus, flame: Flame, snow: Snowflake, bag: ShoppingBag, chevron: ChevronRight,
  search: Search, sliders: SlidersHorizontal, coin: Coins, shot: Wine, dice: Dices, edit: Pencil, lock: Lock, refresh: RefreshCw,
  timer: Timer, info: Info, copy: Copy, download: Download, users: Users, wallet: Wallet, camera: Camera, mail: Mail, up: ArrowUp, down: ArrowDown,
} as const;

export type IconName = keyof typeof ICONS;

/** Icons come from Lucide (open source, one consistent stroke). Decorative unless `label` is set. */
export function Icon({ name, size = 24, label, filled, ...rest }: { name: IconName; size?: number; label?: string; filled?: boolean } & Omit<LucideProps, 'name' | 'size'>) {
  const C = ICONS[name];
  return (
    <C width={size} height={size} strokeWidth={2.25} fill={filled ? 'currentColor' : 'none'}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} {...rest} />
  );
}
