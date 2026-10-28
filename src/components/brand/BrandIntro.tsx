'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { mountIntro, type IntroHandle } from '@/lib/brand/intro';
import { playBrand, unlockAudio } from '@/lib/sound';
import { useIntroStore } from '@/stores/intro-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useHydrated } from '@/lib/hydration';

const FULL_KEY = 'tagai-intro-full';
const SESSION_KEY = 'tagai-intro-session';
/** Links into a room or an invite go straight in. */
const FAST_PATHS = ['/game', '/join', '/r/', '/legal', '/help'];

function read(store: 'local' | 'session', key: string): string | null {
  try { return (store === 'local' ? window.localStorage : window.sessionStorage).getItem(key); } catch { return null; }
}
function write(store: 'local' | 'session', key: string) {
  try { (store === 'local' ? window.localStorage : window.sessionStorage).setItem(key, '1'); } catch { /* private mode: it just plays again */ }
}

/**
 * The opening animation. The very first open plays the full version once; later opens play the short one
 * once per session; sign in and sign up ask for the short one. A tap skips it.
 */
export function BrandIntro() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const variant = useIntroStore((s) => s.variant);
  const show = useIntroStore((s) => s.show);
  const hide = useIntroStore((s) => s.hide);
  const motion = useSettingsStore((s) => s.motion);
  const sounds = useSettingsStore((s) => s.sounds);
  const setSetting = useSettingsStore((s) => s.set);
  const svg = useRef<SVGSVGElement>(null);
  const handle = useRef<IntroHandle | null>(null);
  const decided = useRef(false);
  const [leaving, setLeaving] = useState(false);

  // Decide once what this open gets.
  useEffect(() => {
    if (!hydrated || decided.current) return;
    decided.current = true;
    if (FAST_PATHS.some((p) => pathname.startsWith(p))) { write('session', SESSION_KEY); return; }
    if (!read('local', FULL_KEY)) { write('local', FULL_KEY); write('session', SESSION_KEY); show('full'); return; }
    if (!read('session', SESSION_KEY)) { write('session', SESSION_KEY); show('short'); }
  }, [hydrated, pathname, show]);

  useEffect(() => {
    if (!variant || !svg.current) return;
    setLeaving(false);
    const prefersReduced = motion === 'reduce' || (motion === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const h = mountIntro(svg.current, { variant, still: prefersReduced, onCue: playBrand });
    handle.current = h;
    let timer = 0;
    void h.done.then(() => { setLeaving(true); timer = window.setTimeout(hide, 280); });
    return () => { h.destroy(); window.clearTimeout(timer); handle.current = null; };
  }, [variant, motion, hide]);

  if (!variant) return null;
  return (
    <div
      role="dialog" aria-label="TagAi"
      onClick={() => handle.current?.skip()}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-bg transition-opacity duration-300"
      style={{ opacity: leaving ? 0 : 1 }}
    >
      <svg ref={svg} viewBox="0 0 640 400" aria-hidden className="h-auto w-full max-w-[560px]" />
      {variant === 'full' && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {!sounds && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setSetting('sounds', true); unlockAudio(); }}
              className="rounded-xl border-2 border-line px-4 py-2 text-base font-extrabold text-text">
              Sound is off. Tap to turn it on
            </button>
          )}
          <p className="text-sm text-muted">Tap anywhere to skip</p>
        </div>
      )}
    </div>
  );
}
