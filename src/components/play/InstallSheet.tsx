'use client';
import { useEffect, useState } from 'react';
import { Button, Sheet } from '@/components/ui';

const KEY = 'tagai-install-prompts';

/** After a finished game: how to add tag.ai to the Home Screen. Shown at most twice. */
export function InstallSheet() {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    try {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
      const n = Number(window.localStorage.getItem(KEY) ?? 0);
      if (standalone || n >= 2) return;
      window.localStorage.setItem(KEY, String(n + 1));
      setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
      const t = setTimeout(() => setOpen(true), 4000);
      return () => clearTimeout(t);
    } catch { /* storage blocked: skip the prompt */ }
  }, []);
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Add tag.ai to your Home Screen">
      <p className="-mt-2 text-lg text-muted">Open it like an app, full screen, and it works without a connection.</p>
      <ol className="my-5 list-decimal space-y-2 pl-6 text-xl">
        {ios ? (<><li>Tap the Share button in Safari.</li><li>Choose Add to Home Screen.</li><li>Tap Add.</li></>) : (<><li>Open the browser menu.</li><li>Choose Install app or Add to Home screen.</li><li>Confirm.</li></>)}
      </ol>
      <div className="pb-2"><Button size="lg" full onClick={() => setOpen(false)}>Got it</Button></div>
    </Sheet>
  );
}
