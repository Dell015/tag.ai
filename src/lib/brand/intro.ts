/**
 * The TagAi opening animation, drawn into an SVG (viewBox 0 0 640 400) and driven by the Web Animations API.
 * Full: a deck is dealt into a ring, melts into liquid, pours into a glass with ice, comes out as cards,
 * and one card tilts into the A of the logo. Short: the deal, then the card turns into the logo.
 */
import { BRAND, LETTERS, cardMarkup, type LetterKey } from './art';
import type { BrandSound } from '@/lib/sound';

export type IntroVariant = 'full' | 'short';
export interface IntroHandle {
  /** Resolves when the logo has settled (or the intro was skipped). */
  done: Promise<void>;
  skip: () => void;
  destroy: () => void;
}

const NS = 'http://www.w3.org/2000/svg';
const { yellow: YEL, ink: INK, cream: CREAM, white: WHITE } = BRAND;
const DECK: Record<string, [string, string]> = {
  blue: ['#4274FF', WHITE], green: ['#30BE70', INK], cyan: ['#24BECD', INK], purple: ['#8C68EB', WHITE],
  yellow: [YEL, INK], pink: ['#FF82B2', INK], red: ['#E83C2E', WHITE], orange: ['#FF7022', INK],
};
const ORDER = ['blue', 'pink', 'yellow', 'red', 'green', 'purple', 'cyan', 'orange'];
const CX = 320, CY = 200, S0 = 0.26, SP = 0.5, R = 125, LOCK_Y = 188;
const GLASS = 'M262 250 L378 250 L360 360 L280 360 Z';

type Attrs = Record<string, string | number>;
function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs, parent?: Element): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const k of Object.keys(attrs)) n.setAttribute(k, String(attrs[k]));
  parent?.appendChild(n);
  return n;
}
const grp = (parent: Element, attrs: Attrs = {}) => el('g', attrs, parent);
function origin<T extends SVGElement>(n: T): T {
  n.style.transformOrigin = '0 0';
  n.style.setProperty('transform-box', 'view-box');
  return n;
}
const tf = (x: number, y: number, r = 0, s = 1) => `translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`;

export function mountIntro(svg: SVGSVGElement, opts: { variant: IntroVariant; still?: boolean; onCue?: (c: BrandSound) => void }): IntroHandle {
  svg.replaceChildren();
  const defs = el('defs', {}, svg);
  const goo = el('filter', { id: 'introgoo', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
  el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 7, result: 'b' }, goo);
  el('feColorMatrix', { in: 'b', mode: 'matrix', values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9' }, goo);
  const gcp = el('clipPath', { id: 'introglass' }, defs);
  el('path', { d: GLASS }, gcp);

  const anims: Animation[] = [];
  const A = (node: Element, frames: Keyframe[], start: number, dur: number, ease = 'cubic-bezier(.45,0,.2,1)') => {
    const a = node.animate(frames, { duration: dur, delay: start, fill: 'forwards', easing: ease });
    a.pause();
    anims.push(a);
    return a;
  };
  const cues: [number, BrandSound][] = [];
  const full = opts.variant === 'full';
  const D = full ? 800 : 0;

  // ---- 1. The deck is dealt into a ring ------------------------------------------------------
  const detailWrap = origin(grp(svg));
  const moveD = origin(grp(detailWrap)); const spinD = origin(grp(moveD));
  const gooWrap = origin(grp(svg)); gooWrap.setAttribute('filter', 'url(#introgoo)'); gooWrap.style.opacity = '0';
  const moveG = origin(grp(gooWrap)); const spinG = origin(grp(moveG));
  moveD.style.transform = tf(CX, CY); moveG.style.transform = tf(CX, CY);

  const dealStart = full ? 450 : 150;
  const dealStep = full ? 85 : 45;
  const dealDur = full ? 480 : 380;
  const yellowHolders: SVGElement[] = [];

  for (const detailed of [true, false]) {
    const spin = detailed ? spinD : spinG;
    for (let i = 7; i >= 0; i -= 1) {
      const name = ORDER[i];
      const [col, ink] = DECK[name];
      const ang = i * 45;
      const arm = origin(grp(spin)); arm.style.transform = `rotate(${ang}deg)`;
      const holder = origin(grp(arm));
      holder.style.transform = `translate(0px,0px) rotate(${-ang}deg) scale(0)`;
      holder.innerHTML = cardMarkup(detailed ? { fill: col, ink, trimA: col, glyph: 'q' } : { fill: col, plain: true });
      const pile = `translate(0px,0px) rotate(${-ang + ((i % 3) - 1) * 3}deg) scale(${SP})`;
      const slot = `translate(0px,${-R}px) rotate(0deg) scale(${S0})`;
      A(holder, [{ transform: `translate(0px,0px) rotate(${-ang}deg) scale(0)` }, { transform: pile }], i * 25, 300, 'cubic-bezier(.2,1.4,.4,1)');
      A(holder, [
        { transform: pile },
        { transform: `translate(0px,${-R * 0.55}px) rotate(${-ang - 160}deg) scale(${(SP + S0) / 2 + 0.06})`, offset: 0.5 },
        { transform: slot },
      ], dealStart + i * dealStep, dealDur, 'cubic-bezier(.3,.7,.3,1)');
      if (detailed) cues.push([dealStart + i * dealStep + dealDur * 0.55, 'deal']);
      if (!detailed && full) {
        A(holder, [{ transform: slot }, { transform: 'translate(0px,-5px) rotate(0deg) scale(.2)' }], 1800, 700, 'cubic-bezier(.6,0,.3,1)');
        const face = holder.querySelector<SVGElement>('[data-face]');
        if (face) A(face, [{ fill: col }, { fill: YEL }], 1800, 700);
      }
      if (name === 'yellow' && detailed) yellowHolders.push(holder);
    }
  }

  const hero = origin(grp(svg)); hero.style.opacity = '0'; hero.style.transform = tf(CX, CY, 0, S0);
  const heroRot = origin(grp(hero));
  heroRot.innerHTML = cardMarkup({ fill: YEL, ink: INK, trimA: YEL, glyph: 'q' }) + `<g class="bc-a2" transform="translate(-45 -48)" style="color:${INK}" opacity="0">${LETTERS.A.markup}</g>`;
  const heroA = heroRot.querySelector<SVGElement>('.bc-a2');
  const heroQ = heroRot.querySelector<SVGElement>('.bc-q');

  let landAt: number; // when the hero card has landed in the logo

  if (full) {
    A(detailWrap, [{ opacity: 1 }, { opacity: 0 }], 1750, 200, 'linear');
    A(gooWrap, [{ opacity: 0 }, { opacity: 1 }], 1750, 200, 'linear');
    for (const sp of [spinD, spinG]) A(sp, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(150deg)' }], 1300, 1500, 'cubic-bezier(.3,.1,.3,1)');
    for (const mv of [moveD, moveG]) {
      A(mv, [{ transform: tf(CX, CY) }, { transform: tf(CX, 118) }], 2500, 700);
      A(mv, [
        { opacity: 1, transform: tf(CX, 118, 0, 1) },
        { opacity: 1, transform: tf(CX, 118, 0, 0.75), offset: 0.6 },
        { opacity: 0, transform: tf(CX, 140, 0, 0.15) },
      ], 3200, 1200, 'ease-in');
    }

    // ---- 2. Glass, ice, stream and liquid ----
    const glassG = origin(grp(svg)); glassG.style.opacity = '0'; glassG.style.transformOrigin = '320px 360px';
    const liquidClip = grp(glassG, { 'clip-path': 'url(#introglass)' });
    const liquid = origin(grp(liquidClip)); liquid.style.transform = 'translateY(120px)';
    el('rect', { x: 250, y: 250, width: 140, height: 130, fill: YEL }, liquid);
    el('rect', { x: 250, y: 250, width: 140, height: 7, fill: '#FFE08A' }, liquid);
    const stream = origin(el('rect', { x: -7, y: 0, width: 14, height: 222, rx: 7, fill: YEL }, glassG));
    stream.style.transform = 'translate(320px,136px) scaleY(0)'; stream.style.opacity = '0';
    el('path', { d: GLASS, fill: 'rgba(255,255,255,.07)', stroke: CREAM, 'stroke-width': 6, 'stroke-linejoin': 'round' }, glassG);
    el('rect', { x: 250, y: 346, width: 140, height: 14, fill: CREAM, opacity: 0.95, 'clip-path': 'url(#introglass)' }, glassG);
    const ice = origin(grp(glassG));
    for (const [x, y, r] of [[300, 336, -12], [339, 341, 14], [319, 305, 5]]) {
      const cube = grp(ice, { transform: `translate(${x} ${y}) rotate(${r})` });
      el('rect', { x: -18, y: -18, width: 36, height: 36, rx: 8, fill: 'rgba(235,248,255,.55)', stroke: 'rgba(255,255,255,.95)', 'stroke-width': 2.5 }, cube);
      el('path', { d: 'M-10 -8 L-10 -11 Q-10 -12 -9 -12 L-4 -12', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 }, cube);
      el('rect', { x: 4, y: 4, width: 8, height: 8, rx: 3, fill: 'rgba(255,255,255,.35)' }, cube);
    }
    A(glassG, [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'translateY(0px)' }], 1250 + D, 500);
    A(glassG, [{ opacity: 1, transform: 'translateY(0px) scale(1)' }, { opacity: 0, transform: 'translateY(14px) scale(.92)' }], 3950 + D, 420, 'ease-in');
    A(stream, [{ opacity: 1, transform: 'translate(320px,136px) scaleY(0)' }, { opacity: 1, transform: 'translate(320px,136px) scaleY(1)' }], 1750 + D, 330, 'ease-in');
    A(stream, [
      { opacity: 1, transform: 'translate(320px,136px) scaleY(1) scaleX(1)', offset: 0 },
      { opacity: 1, transform: 'translate(320px,136px) scaleY(1) scaleX(.35)', offset: 0.8 },
      { opacity: 0, transform: 'translate(320px,136px) scaleY(1) scaleX(.1)' },
    ], 2900 + D, 380, 'ease-out');
    A(liquid, [{ transform: 'translateY(120px)' }, { transform: 'translateY(10px)' }], 2060 + D, 1000, 'cubic-bezier(.4,0,.3,1)');
    A(liquid, [{ transform: 'translateY(10px)' }, { transform: 'translateY(4px)', offset: 0.4 }, { transform: 'translateY(10px)' }], 3000 + D, 420);
    A(liquid, [{ transform: 'translateY(10px)' }, { transform: 'translateY(125px)' }], 3550 + D, 650, 'cubic-bezier(.5,0,.5,1)');
    A(ice, [{ transform: 'translateY(0px)', offset: 0 }, { transform: 'translateY(0px)', offset: 0.3 }, { transform: 'translateY(-72px)' }], 2060 + D, 1000, 'cubic-bezier(.4,0,.3,1)');
    A(ice, [{ transform: 'translateY(-72px)' }, { transform: 'translateY(-68px) rotate(2deg)', offset: 0.4 }, { transform: 'translateY(-72px)' }], 3000 + D, 420);
    A(ice, [{ transform: 'translateY(-72px)' }, { transform: 'translateY(0px)' }], 3550 + D, 650, 'cubic-bezier(.5,0,.5,1)');
    cues.push([1750 + D, 'pour'], [2060 + D + 380, 'clink'], [3000 + D + 120, 'clink']);

    // ---- 3. Cards rise out of the glass, fan out, and gather ----
    const FAN: [number, string][] = [[-34, 'blue'], [-17, 'pink'], [0, 'yellow'], [17, 'red'], [34, 'green']];
    let heroFan: { wrap: SVGElement; fan: string; rest: string } | null = null;
    FAN.forEach(([ang, name], i) => {
      const wrap = origin(grp(svg)); wrap.style.opacity = '0';
      const [col, ink] = DECK[name];
      wrap.innerHTML = cardMarkup({ fill: col, ink, trimA: col, glyph: 'q' });
      const base = `translate(${CX}px,330px) rotate(0deg) translate(0px,-40px) scale(${S0 * 0.5})`;
      const fan = `translate(${CX}px,330px) rotate(${ang}deg) translate(0px,-150px) scale(${S0})`;
      const rest = `translate(${CX}px,330px) rotate(0deg) translate(0px,-130px) scale(${S0})`;
      wrap.style.transform = base;
      A(wrap, [{ opacity: 0, transform: base }, { opacity: 1, transform: fan }], 3450 + D + i * 60, 650, 'cubic-bezier(.2,1.2,.4,1)');
      if (name !== 'yellow') A(wrap, [{ opacity: 1, transform: fan }, { opacity: 0, transform: rest }], 4350 + D, 380, 'ease-in');
      else heroFan = { wrap, fan, rest };
      cues.push([3450 + D + i * 60 + 200, 'deal']);
    });
    if (heroFan) {
      const h: { wrap: SVGElement; fan: string; rest: string } = heroFan;
      A(h.wrap, [{ transform: h.fan }, { transform: h.rest }], 4350 + D, 380, 'ease-in');
      A(h.wrap, [{ opacity: 1 }, { opacity: 0 }], 4730 + D, 10);
    }
    const t0 = 4730 + D;
    A(hero, [{ opacity: 1, transform: tf(CX, CY, 0, S0) }, { opacity: 1, transform: tf(CX, CY, 0, S0) }], t0, 10);
    A(hero, [{ transform: tf(CX, CY, 0, S0) }, { transform: tf(453, LOCK_Y, 0, 0.61) }], 4900 + D, 650, 'cubic-bezier(.5,0,.15,1)');
    A(heroRot, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-12deg)' }], 4900 + D, 650, 'cubic-bezier(.4,0,.15,1.2)');
    if (heroA) A(heroA, [{ opacity: 0 }, { opacity: 1 }], 5250 + D, 300);
    if (heroQ) A(heroQ, [{ opacity: 1 }, { opacity: 0 }], 5150 + D, 200);
    landAt = 4900 + D + 650;
  } else {
    // Short: the ring pulls in, the yellow card is all that is left, and it turns into the A.
    for (const mv of [moveD, moveG]) {
      A(mv, [{ opacity: 1, transform: tf(CX, CY, 0, 1) }, { opacity: 1, transform: tf(CX, CY, 0, 0.08), offset: 0.85 }, { opacity: 0, transform: tf(CX, CY, 0, 0.02) }], 1000, 380, 'cubic-bezier(.6,0,.4,1)');
    }
    for (const sp of [spinD, spinG]) A(sp, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(120deg)' }], 650, 800, 'cubic-bezier(.3,.1,.3,1)');
    A(hero, [{ opacity: 1, transform: tf(CX, CY, 0, S0) }, { opacity: 1, transform: tf(CX, CY, 0, S0) }], 1330, 10);
    A(hero, [{ transform: tf(CX, CY, 0, S0) }, { transform: tf(453, LOCK_Y, 0, 0.61) }], 1380, 520, 'cubic-bezier(.5,0,.15,1)');
    A(heroRot, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-12deg)' }], 1380, 520, 'cubic-bezier(.4,0,.15,1.2)');
    if (heroA) A(heroA, [{ opacity: 0 }, { opacity: 1 }], 1620, 220);
    if (heroQ) A(heroQ, [{ opacity: 1 }, { opacity: 0 }], 1560, 150);
    landAt = 1380 + 520;
    void yellowHolders;
  }

  // ---- 4. Letters and the line under them ----
  const lockX = 87;
  const letters: [LetterKey, number][] = [['T', 0], ['A', 96], ['G', 202], ['I', 440]];
  const letterStart = landAt - (full ? 1300 : 350);
  letters.forEach(([k, off], i) => {
    const w = LETTERS[k].w;
    const cx = lockX + off + w / 2;
    const wrap = origin(grp(svg)); wrap.style.opacity = '0';
    const inner = grp(wrap, { transform: `translate(${-w / 2} -50)`, style: `color:${CREAM}` });
    inner.innerHTML = LETTERS[k].markup;
    const from = tf(cx, LOCK_Y + 26, 0, 0.85), to = tf(cx, LOCK_Y, 0, 1);
    wrap.style.transform = from;
    A(wrap, [{ opacity: 0, transform: from }, { opacity: 1, transform: to }], letterStart + (k === 'I' ? 3 : i) * (full ? 70 : 50), full ? 420 : 340, 'cubic-bezier(.2,1.3,.4,1)');
  });
  const tag = origin(el('text', { x: 320, y: 282, 'text-anchor': 'middle', fill: YEL, 'font-weight': 800, 'font-size': 28, 'font-stretch': '80%' }, svg));
  tag.style.fontFamily = "'Archivo Variable', system-ui, sans-serif";
  tag.textContent = 'Take the card or take the shot.';
  tag.style.opacity = '0';
  const tagAt = landAt + (full ? 150 : 100);
  A(tag, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0px)' }], tagAt, full ? 450 : 350);
  cues.push([landAt - 120, 'thud']);

  const total = tagAt + (full ? 450 : 350) + (full ? 900 : 600);

  // ---- Playback ----
  const timers: number[] = [];
  let resolveDone: () => void = () => undefined;
  const done = new Promise<void>((r) => { resolveDone = r; });
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    for (const t of timers) window.clearTimeout(t);
    for (const a of anims) { try { a.finish(); } catch { /* ignore */ } }
    resolveDone();
  };
  if (opts.still) {
    for (const a of anims) { try { a.finish(); } catch { /* ignore */ } }
    finished = true;
    window.setTimeout(resolveDone, 700);
  } else {
    for (const a of anims) a.play();
    for (const [at, name] of cues) timers.push(window.setTimeout(() => opts.onCue?.(name), at));
    timers.push(window.setTimeout(finish, total));
  }
  return {
    done,
    skip: finish,
    destroy: () => { finished = true; for (const t of timers) window.clearTimeout(t); for (const a of anims) a.cancel(); },
  };
}
