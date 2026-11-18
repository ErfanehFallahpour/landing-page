import { ParticleScene } from './particles.js';
import { Backdrop } from './backdrop.js';

/* =========================================================
   Setup
   ========================================================= */
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const faDigits = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

gsap.registerPlugin(ScrollTrigger);

// every visit starts at the ignition gate, at the top of the story
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo(0, 0);
gsap.defaults({ ease: 'expo.out' });

const THEMES = {
  mint:   { colors: ['#7cf7d4', '#5aa8ff'], glowA: [124, 247, 212], glowB: [90, 168, 255],  accent: '#7cf7d4' },
  violet: { colors: ['#a99cff', '#ff7ad9'], glowA: [139, 124, 255], glowB: [255, 122, 217], accent: '#a99cff' },
  cyan:   { colors: ['#6fd8ff', '#7cf7d4'], glowA: [111, 216, 255], glowB: [124, 247, 212], accent: '#6fd8ff' },
  gold:   { colors: ['#ffc66b', '#ff8a3d'], glowA: [255, 198, 107], glowB: [255, 138, 61],  accent: '#ffc66b' },
  ice:    { colors: ['#dbe8ff', '#8fb0ff'], glowA: [207, 227, 255], glowB: [143, 176, 255], accent: '#cfe3ff' },
};

let scene = null;
try {
  scene = new ParticleScene($('#webgl'), { reduce });
} catch (err) {
  // WebGL unavailable — the site still works with the CSS atmosphere only
  console.warn('WebGL disabled:', err);
}
const backdrop = new Backdrop($('#backdrop'), { reduce });
if (location.hostname === 'localhost') Object.assign(window, { __axon: scene, __bd: backdrop }); // dev-only handles

/* =========================================================
   Smooth scroll (Lenis) — disabled for reduced motion
   ========================================================= */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target) => {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  else document.querySelector(target)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
};

/* =========================================================
   Split text (whole words only — keeps Persian letters joined)
   ========================================================= */
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi';
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  return $$('.wi', el);
}

/* =========================================================
   Intro — boot counter → hold-to-ignite gate
   ========================================================= */
const intro = $('#intro');
const gate = $('#gate');
const holdBtn = $('#hold');
const holdBar = $('#holdBar');
const CIRC = 2 * Math.PI * 62;
let entered = false;

root.classList.add('is-locked', 'is-preentry');
lenis?.stop();

const heroWords = splitWords($('.hero__title'));

function bootCounter() {
  return new Promise((resolve) => {
    const c = { v: 0 };
    const el = $('#count');
    const lines = ['COMPILING CORE…', 'LINKING MODULES…', 'WARMING SHADERS…', 'READY.'];
    gsap.to(c, {
      v: 100,
      duration: reduce ? 0.3 : 2.4,
      ease: 'power3.inOut',
      onUpdate() {
        el.textContent = String(Math.round(c.v)).padStart(3, '0');
        $('#bootLine').textContent = lines[Math.min(3, Math.floor(c.v / 26))];
      },
      onComplete: resolve,
    });
  });
}

function showGate() {
  gsap.to('#count', { opacity: 0.1, scale: 1.5, duration: 1.4 });
  gate.hidden = false;
  gsap.from(gate.children, { opacity: 0, y: 24, duration: 1.2, stagger: 0.1 });
  holdBtn.focus({ preventScroll: true });
}

const hold = { p: 0 };
let holdTween = null;
function renderHold() {
  holdBar.style.strokeDashoffset = CIRC * (1 - hold.p);
  scene?.charge(hold.p);
}
function holdStart(e) {
  if (entered) return;
  e?.preventDefault?.();
  holdBtn.classList.add('is-pressing');
  holdTween?.kill();
  holdTween = gsap.to(hold, { p: 1, duration: 1.5 * (1 - hold.p), ease: 'none', onUpdate: renderHold, onComplete: enter });
}
function holdEnd() {
  if (entered || hold.p >= 1) return;
  holdBtn.classList.remove('is-pressing');
  holdTween?.kill();
  holdTween = gsap.to(hold, { p: 0, duration: 0.7, ease: 'power3.out', onUpdate: renderHold });
}
holdBtn.addEventListener('pointerdown', holdStart);
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => holdBtn.addEventListener(ev, holdEnd));
holdBtn.addEventListener('contextmenu', (e) => e.preventDefault());
holdBtn.addEventListener('keydown', (e) => {
  if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) holdStart(e);
});
holdBtn.addEventListener('keyup', (e) => {
  if (e.key === ' ' || e.key === 'Enter') holdEnd();
});
$('#skip').addEventListener('click', () => enter());

function enter() {
  if (entered) return;
  entered = true;
  holdTween?.kill();
  if (!location.hash) {
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
  }
  scene?.ignite('sphere');
  // sync chapter state (colours, layout shift, HUD) with whatever section is in view
  const inView = $$('[data-shape]').find((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= innerHeight * 0.55 && r.bottom > innerHeight * 0.55;
  });
  activate(inView || $('#top'));

  const tl = gsap.timeline();
  tl.to(intro, { opacity: 0, duration: reduce ? 0.2 : 1.1, ease: 'power2.inOut' })
    .add(() => {
      intro.classList.add('is-gone');
      intro.setAttribute('aria-hidden', 'true');
      root.classList.remove('is-locked');
      lenis?.start();
      ScrollTrigger.refresh();
    })
    .add(heroIn(), reduce ? 0 : 0.35);
}

function heroIn() {
  root.classList.remove('is-preentry');
  const tl = gsap.timeline();
  tl.fromTo(heroWords, { yPercent: 115 }, { yPercent: 0, duration: reduce ? 0.01 : 1.5, stagger: 0.07 })
    .fromTo('[data-hero-fade]', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: reduce ? 0.01 : 1.2, stagger: 0.12 }, reduce ? 0 : 0.5)
    .fromTo('.hud, .hud-bottom, .ruler', { opacity: 0 }, { opacity: 1, duration: 1 }, 0.2);
  return tl;
}
gsap.set('.hud, .hud-bottom, .ruler', { opacity: 0 });

Promise.all([bootCounter(), document.fonts?.ready ?? Promise.resolve()]).then(() => {
  if (reduce) enter();
  else showGate();
});

/* =========================================================
   Chapters — drive the particle morphs, atmosphere and HUD
   ========================================================= */
const glow = { ar: 124, ag: 247, ab: 212, br: 139, bg: 124, bb: 255 };
function applyGlow() {
  root.style.setProperty('--glow-a', `${glow.ar | 0}, ${glow.ag | 0}, ${glow.ab | 0}`);
  root.style.setProperty('--glow-b', `${glow.br | 0}, ${glow.bg | 0}, ${glow.bb | 0}`);
}

let activeSec = null;
function activate(sec) {
  if (activeSec === sec) return;
  activeSec = sec;
  const theme = THEMES[sec.dataset.theme] || THEMES.mint;
  const [idx, name] = (sec.dataset.chapter || '00|').split('|');

  const d = sec.dataset;
  scene?.setChapter({
    shape: d.shape,
    colors: theme.colors,
    px: Number(d.px || 0),
    py: Number(d.py || 0),
    scale: Number(d.scale || 1),
    dim: Number(d.dim || 1),
  });
  backdrop.set(d.bg);

  const [ar, ag, ab] = theme.glowA, [br, bg, bb] = theme.glowB;
  gsap.to(glow, { ar, ag, ab, br, bg, bb, duration: 1.4, ease: 'power2.out', onUpdate: applyGlow });
  root.style.setProperty('--accent', theme.accent);

  const idxEl = $('#chapterIdx'), nameEl = $('#chapterName');
  gsap.to([idxEl, nameEl], {
    opacity: 0, y: -6, duration: 0.25, ease: 'power2.in',
    onComplete() {
      idxEl.textContent = idx;
      nameEl.textContent = name;
      gsap.fromTo([idxEl, nameEl], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5 });
    },
  });
  $('#rulerLabel').textContent = sec.dataset.version || '';
}

$$('[data-shape]').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => self.isActive && entered && activate(sec),
  });
});

/* global progress → LN ticker, ruler marker, scroll velocity */
const ticks = $('#rulerTicks');
for (let i = 0; i <= 40; i++) {
  const t = document.createElement('i');
  t.style.top = `${(i / 40) * 100}%`;
  if (i % 5 === 0) t.className = 'major';
  ticks.appendChild(t);
}
const tickerVal = $('#tickerVal');
const marker = $('#rulerMarker');
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate(self) {
    tickerVal.textContent = String(Math.round(self.progress * 9999)).padStart(4, '0');
    marker.style.top = `${self.progress * 100}%`;
    scene?.setVelocity(self.getVelocity() / 2500);
  },
});

/* =========================================================
   Reveals
   ========================================================= */
$$('[data-split]:not([data-split="hero"])').forEach((el) => {
  const words = splitWords(el);
  if (reduce) return;
  gsap.fromTo(words, { yPercent: 115 }, {
    yPercent: 0, duration: 1.3, stagger: 0.06,
    scrollTrigger: { trigger: el, start: 'top 86%', once: true },
  });
});

if (!reduce) {
  $$('[data-fade]').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 32 }, {
      opacity: 1, y: 0, duration: 1.2,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

/* manifesto — words light up as you read (scrubbed) */
$$('[data-scrub-words]').forEach((el) => {
  const words = splitWords(el);
  words.forEach((w) => w.classList.add('sw'));
  if (reduce) return;
  gsap.to(words, {
    opacity: 1,
    ease: 'none',
    stagger: 0.1,
    scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: 0.6 },
  });
});

/* =========================================================
   Chapter motion — text blocks enter from their own side,
   drift against the scroll, and the giant index numbers
   travel across the frame so text and image swap places.
   ========================================================= */
if (!reduce) {
  $$('.chapter-sec[data-align]').forEach((sec) => {
    const align = sec.dataset.align;
    const fromX = align === 'left' ? -80 : align === 'right' ? 80 : 0;
    const fromY = align === 'center' ? 40 : 16;
    const items = $$('[data-side]', sec);
    if (items.length) {
      gsap.fromTo(items, { opacity: 0, x: fromX, y: fromY }, {
        opacity: 1, x: 0, y: 0, duration: 1.4, stagger: 0.12,
        scrollTrigger: { trigger: sec, start: 'top 62%', toggleActions: 'play none none reverse' },
      });
    }
    const block = $('.block', sec);
    if (block && sec.classList.contains('product')) {
      gsap.fromTo(block, { yPercent: 18 }, {
        yPercent: -18, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });

  $$('.product__num').forEach((n, i) => {
    const sec = n.closest('.product');
    const ltr = i % 2 === 0;
    gsap.fromTo(n,
      { x: () => (ltr ? -n.offsetWidth : sec.offsetWidth) },
      {
        x: () => (ltr ? sec.offsetWidth : -n.offsetWidth),
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true },
      });
  });

  /* capability words rise one after another */
  gsap.fromTo('[data-cap]', { opacity: 0, yPercent: 60 }, {
    opacity: 1, yPercent: 0, duration: 1.2, stagger: 0.08,
    scrollTrigger: { trigger: '.caps', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
}

/* process — steps switch on as you scroll through */
const flowItems = $$('.flow li');
if (reduce) {
  flowItems.forEach((li) => li.classList.add('is-on'));
} else {
  ScrollTrigger.create({
    trigger: '.flow',
    start: 'top 80%',
    end: 'bottom 35%',
    onUpdate(self) {
      const lit = Math.floor(self.progress * (flowItems.length + 0.5));
      flowItems.forEach((li, i) => li.classList.toggle('is-on', i < lit));
    },
    onLeave: () => flowItems.forEach((li) => li.classList.add('is-on')),
  });
}

$$('[data-count]').forEach((el) => {
  const end = Number(el.dataset.count);
  const o = { v: 0 };
  const set = () => (el.textContent = faDigits(Math.round(o.v)));
  if (reduce) { o.v = end; set(); return; }
  gsap.to(o, {
    v: end, duration: 2.2, ease: 'power3.out', onUpdate: set,
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  });
});

/* =========================================================
   Pointer — particles, custom cursor, magnetic buttons
   ========================================================= */
window.addEventListener('pointermove', (e) => scene?.setPointer(e.clientX, e.clientY), { passive: true });

if (finePointer && !reduce) {
  root.classList.add('has-cursor');
  const dot = $('.cursor__dot'), ring = $('.cursor__ring'), cursor = $('.cursor');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button, [data-cap]'));
  });

  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* =========================================================
   Menu + anchor navigation
   ========================================================= */
const menu = $('#menu');
const menuBtn = $('#menuBtn');
function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  $('.menu-btn__txt').textContent = open ? 'بستن' : 'منو';
  if (open) {
    menu.hidden = false;
    lenis?.stop();
    gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo('.menu__link b', { yPercent: 100 }, { yPercent: 0, duration: 1, stagger: 0.05 });
    $('.menu__link', menu).focus({ preventScroll: true });
  } else {
    gsap.to(menu, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => (menu.hidden = true) });
    lenis?.start();
    menuBtn.focus({ preventScroll: true });
  }
}
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menu.hidden) setMenu(false);
});

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !document.querySelector(id)) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    scrollTo(id);
  });
});

/* keep layout fresh after fonts settle */
window.addEventListener('load', () => ScrollTrigger.refresh());
