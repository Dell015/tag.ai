/** Sounds for the opening animation only. Off by default; see Settings, Sounds. */
import { useSettingsStore } from '@/stores/settings-store';


let ctx: AudioContext | null = null;

/** Sounds for the opening animation: a card flick, a pour, an ice clink and the thud of the A landing. */
export type BrandSound = 'deal' | 'pour' | 'clink' | 'thud';

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    // iPhone: play through the silent switch like music does.
    const as = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (as) as.type = 'playback';
  } catch { /* ignore */ }
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  preload(ctx);
  return ctx;
}

function noise(c: AudioContext, seconds: number): AudioBufferSourceNode {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

let verb: ConvolverNode | null = null;
/** A small room, so the sounds sit in a space instead of sounding like beeps. */
function room(c: AudioContext): ConvolverNode {
  if (verb) return verb;
  const len = Math.floor(c.sampleRate * 0.45);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  verb = c.createConvolver();
  verb.buffer = buf;
  const wet = c.createGain();
  wet.gain.value = 0.9;
  verb.connect(wet).connect(c.destination);
  return verb;
}

/** Envelope helper: quick attack, exponential decay. */
function env(c: AudioContext, t0: number, peak: number, attack: number, decay: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  return g;
}

/** Real card recordings (Kenney Casino Audio, CC0), in public/sounds. Synthesised sounds stand in until they load. */
const SAMPLES = ['slide-1', 'slide-2', 'slide-3', 'slide-4', 'slide-5', 'slide-6', 'slide-7', 'slide-8', 'place-3'];
const buffers = new Map<string, AudioBuffer>();
let loading = false;

function preload(c: AudioContext): void {
  if (loading) return;
  loading = true;
  for (const name of SAMPLES) {
    void fetch(`/sounds/${name}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('missing'))))
      .then((data) => new Promise<AudioBuffer>((res, rej) => { c.decodeAudioData(data, res, rej); }))
      .then((buf) => { buffers.set(name, buf); })
      .catch(() => { /* the synthesised sound plays instead */ });
  }
}

/** Plays one recording picked at random from the group (`slide`, `place`...). Returns false if none has loaded. */
function sample(c: AudioContext, group: string, t0: number, v: number, o: { rate?: number; gain?: number; only?: number } = {}): boolean {
  const names = SAMPLES.filter((n) => n === group || n.startsWith(`${group}-`));
  const ready = names.filter((n) => buffers.has(n));
  if (ready.length === 0) return false;
  const pick = o.only ? `${group}-${o.only}` : ready[Math.floor(Math.random() * ready.length)];
  const buf = buffers.get(pick) ?? buffers.get(ready[0])!;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = (o.rate ?? 1) * (0.96 + Math.random() * 0.08);
  const g = c.createGain();
  g.gain.value = Math.min(1, (o.gain ?? 0.9) * v);
  src.connect(g).connect(c.destination);
  src.start(t0);
  return true;
}

type Send = (node: AudioNode, wet: number) => void;

/** A card leaving the thumb: a bright paper snap, a short slide on the table and a small tap. */
function flick(c: AudioContext, t0: number, v: number, send: Send, o: { snap?: number; slide?: number; tap?: number } = {}) {
  const jitter = 0.9 + Math.random() * 0.2;
  const snap = noise(c, 0.05);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(5200 * jitter, t0); bp.frequency.exponentialRampToValueAtTime(1900, t0 + 0.04);
  const g1 = env(c, t0, (o.snap ?? 0.55) * v, 0.002, 0.04);
  snap.connect(bp).connect(g1); send(g1, 0.25); snap.start(t0);
  const slide = noise(c, 0.12);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
  const g2 = env(c, t0 + 0.012, (o.slide ?? 0.16) * v, 0.02, 0.09);
  slide.connect(hp).connect(lp).connect(g2); send(g2, 0.3); slide.start(t0 + 0.012);
  const tap = c.createOscillator(); tap.type = 'sine';
  tap.frequency.setValueAtTime(240 * jitter, t0 + 0.035); tap.frequency.exponentialRampToValueAtTime(110, t0 + 0.08);
  const g3 = env(c, t0 + 0.035, (o.tap ?? 0.12) * v, 0.002, 0.05);
  tap.connect(g3); send(g3, 0.2); tap.start(t0 + 0.035); tap.stop(t0 + 0.12);
}

/** A card put down on the table: a soft slap, no brightness. */
function lay(c: AudioContext, t0: number, v: number, send: Send, weight = 1) {
  const slap = noise(c, 0.1);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2600, t0); lp.frequency.exponentialRampToValueAtTime(450, t0 + 0.08);
  const sg = env(c, t0, 0.4 * v * weight, 0.003, 0.08);
  slap.connect(lp).connect(sg); send(sg, 0.3); slap.start(t0);
  const body = c.createOscillator(); body.type = 'sine';
  body.frequency.setValueAtTime(170, t0); body.frequency.exponentialRampToValueAtTime(80, t0 + 0.1);
  const bg = env(c, t0, 0.2 * v * weight, 0.003, 0.1);
  body.connect(bg); send(bg, 0.2); body.start(t0); body.stop(t0 + 0.2);
}

export function playBrand(name: BrandSound): void {
  const { sounds, volume } = useSettingsStore.getState();
  if (!sounds) return;
  try {
    const c = audio();
    if (!c) return;
    const t0 = c.currentTime + 0.01;
    const v = volume;
    const r = room(c);
    const send = (node: AudioNode, wet: number) => {
      node.connect(c.destination);
      const w = c.createGain(); w.gain.value = wet; node.connect(w).connect(r);
    };
    const jitter = 0.9 + Math.random() * 0.2;

    if (name === 'deal') {
      if (!sample(c, 'slide', t0, v, { rate: 1.15, gain: 0.7 })) flick(c, t0, v, send);
    } else if (name === 'pour') {
      // Liquid: a steady stream with bubbling, rising in pitch as the glass fills.
      const dur = 1.25;
      const stream = noise(c, dur);
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
      bp.frequency.setValueAtTime(700, t0); bp.frequency.exponentialRampToValueAtTime(1500, t0 + dur);
      const lfo = c.createOscillator(); lfo.frequency.value = 17;
      const lfoGain = c.createGain(); lfoGain.gain.value = 0.35;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.3 * v), t0 + 0.1);
      g.gain.setValueAtTime(Math.max(0.0002, 0.3 * v), t0 + dur - 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      const wob = c.createGain(); wob.gain.value = 0.65;
      lfo.connect(lfoGain).connect(wob.gain);
      stream.connect(bp).connect(wob).connect(g); send(g, 0.2);
      stream.start(t0); lfo.start(t0); lfo.stop(t0 + dur);
      // Bubbles
      for (let i = 0; i < 9; i += 1) {
        const bt = t0 + 0.15 + Math.random() * (dur - 0.3);
        const f = 500 + Math.random() * 900 + (bt - t0) * 500;
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(f, bt); o.frequency.exponentialRampToValueAtTime(f * 1.9, bt + 0.05);
        const bg = env(c, bt, 0.07 * v, 0.004, 0.05);
        o.connect(bg); send(bg, 0.3); o.start(bt); o.stop(bt + 0.08);
      }
    } else if (name === 'clink') {
      // Glass: inharmonic partials that ring and fade at different speeds, plus a tiny contact tick.
      const base = 1750 * jitter;
      const parts: [number, number, number][] = [[1, 0.5, 0.55], [2.32, 0.32, 0.38], [4.25, 0.2, 0.22], [6.63, 0.11, 0.12]];
      for (const [ratio, amp, decay] of parts) {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = base * ratio;
        const og = env(c, t0, amp * 0.4 * v, 0.0015, decay);
        o.connect(og); send(og, 0.35); o.start(t0); o.stop(t0 + decay + 0.1);
      }
      const tick = noise(c, 0.02);
      const th = c.createBiquadFilter(); th.type = 'highpass'; th.frequency.value = 4500;
      const tg = env(c, t0, 0.25 * v, 0.001, 0.012);
      tick.connect(th).connect(tg); send(tg, 0.2); tick.start(t0);
    } else if (!sample(c, 'place', t0, v, { rate: 0.85, gain: 1, only: 3 })) {
      lay(c, t0, v, send, 1.2);
    }
  } catch { /* audio blocked: the intro is silent */ }
}

/** Call from a tap so the phone lets later sounds play. */
export function unlockAudio(): void {
  try { audio(); } catch { /* ignore */ }
}
