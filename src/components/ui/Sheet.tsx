'use client';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Bottom sheet with a dimmed backdrop. Tap outside or the handle to close. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <motion.button
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-md rounded-t-sheet border-t border-white/10 bg-surface px-5 pb-2 pt-3 shadow-card safe-bottom"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <button aria-label="Close" onClick={onClose} className="mx-auto mb-3 block h-tap w-24">
              <span className="mx-auto block h-1.5 w-12 rounded-full bg-white/20" />
            </button>
            {title && <h2 className="mb-4 text-2xl font-extrabold">{title}</h2>}
            <div className="max-h-[70dvh] overflow-y-auto scrollbar-none">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
