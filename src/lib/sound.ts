/** Tiny UI sounds made with WebAudio (no asset files). Off by default; see Settings, Sounds. */
import { useSettingsStore } from '@/stores/settings-store';

export type SoundName = 'reveal' | 'done' | 'skip' | 'pass' | 'wild' | 'end';

// [frequency Hz, duration s, delay s] notes per sound
const NOTES: Record<SoundName, [number, number, number][]> = {
  reveal: [[520, 0.07, 0], [780, 0.09, 0.07]],
  done: [[660, 0.08, 0], [990, 0.12, 0.08]],
  skip: [[330, 0.12, 0]],
  pass: [[440, 0.06, 0], [440, 0.06, 0.1]],
  wild: [[392, 0.08, 0], [523, 0.08, 0.08], [784, 0.14, 0.16]],
  end: [[523, 0.12, 0], [659, 0.12, 0.12], [784, 0.12, 0.24], [1046, 0.3, 0.36]],
};

let ctx: AudioContext | null = null;

export function play(name: SoundName): void {
  const { sounds, volume } = useSettingsStore.getState();
  if (!sounds || typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime;
    for (const [freq, dur, delay] of NOTES[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + delay);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.25 * volume), t0 + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + dur + 0.02);
    }
  } catch { /* audio blocked: the game is silent */ }
}
