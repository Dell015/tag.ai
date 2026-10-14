import { create } from 'zustand';

export interface ToastAction {
  label: string;
  onClick: () => void;
}
export interface ToastItem {
  id: number;
  message: string;
  tone: 'info' | 'ok' | 'warn';
  action?: ToastAction;
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, opts?: Partial<Pick<ToastItem, 'tone' | 'action' | 'duration'>>) => number;
  dismiss: (id: number) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, opts = {}) => {
    const id = ++seq;
    const item: ToastItem = { id, message, tone: opts.tone ?? 'info', action: opts.action, duration: opts.duration ?? 3000 };
    set({ toasts: [...get().toasts.slice(-2), item] });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => get().dismiss(id), item.duration);
    }
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = (...args: Parameters<ToastState['show']>) => useToastStore.getState().show(...args);
