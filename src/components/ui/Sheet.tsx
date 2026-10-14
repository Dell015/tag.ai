'use client';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <motion.button
            aria-label="Close" className="absolute inset-0 bg-black/75"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className="relative w-full max-w-md rounded-t-sheet border-t-2 border-line bg-panel px-5 pt-2 safe-bottom"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
          >
            <button aria-label="Close" onClick={onClose} className="mx-auto mb-2 block h-tap w-24">
              <span className="mx-auto block h-1.5 w-12 rounded-full bg-line" />
            </button>
            {title && <h2 className="mb-5 text-4xl">{title}</h2>}
            <div className="max-h-[70dvh] overflow-y-auto pb-2 scrollbar-none">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
