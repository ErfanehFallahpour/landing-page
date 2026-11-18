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
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

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
  lime:   { colors: ['#c8ff3d', '#7cf7d4'], glowA: [200, 255, 61],  glowB: [124, 247, 212], accent: '#c8ff3d' },
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
  lenis = new Lenis({ duration: 1.2, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target) => {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.8 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
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
      } else if (child.nodeType === 1 && child.tagName !== 'BR' && !child.hasAttribute('data-nosplit')) {
        walk(child);
      }
    });
  };
  walk(el);
  return $$('.wi', el);
}

/* =========================================================
   Chapters — every [data-shape] section is a stop in the story
   ========================================================= */
const chapters = $$('[data-shape]').map((sec) => ({
  sec,
  d: sec.dataset,
  theme: THEMES[sec.dataset.theme] || THEMES.mint,
  product: sec.classList.contains('product'),
  hold: [0, 0],
}));

/* =========================================================
   Products — pinned, scrolled sideways (RTL: track moves right)
   Created first so every later trigger accounts for its pin.
   ========================================================= */
const hWrap = $('#products');
const hTrack = $('#hTrack');
const panels = $$('.product', hTrack);
const hDist = () => Math.max(0, hTrack.scrollWidth - window.innerWidth);
const hLen = () => hDist() * 1.25;

function panelFx(progress) {
  const f = progress * (panels.length - 1);
  panels.forEach((pn, i) => {
    const o = i - f; // > 0 → still to come (sitting to the left)
    const a = clamp01(1 - (Math.abs(o) - 0.12) / 0.4);
    const block = $('.block', pn);
    const num = $('.product__num', pn);
    if (block) {
      block.style.opacity = reduce ? 1 : a;
      block.style.transform = reduce ? '' : `translate3d(${-o * 18}vw, ${(1 - a) * 30}px, 0)`;
      block.style.filter = reduce ? '' : `blur(${((1 - a) * 8).toFixed(1)}px)`;
    }
    if (num) num.style.transform = `translate3d(${-o * 34}vw, -50%, 0)`;
  });
}

const hTween = gsap.to(hTrack, {
  x: () => hDist(),
  ease: 'none',
  scrollTrigger: {
    trigger: hWrap,
    pin: true,
    start: 'top top',
    end: () => '+=' + hLen(),
    scrub: reduce ? true : 0.6,
    invalidateOnRefresh: true,
    onUpdate: (self) => panelFx(self.progress),
  },
});
panelFx(0);

/* =========================================================
   Intro — boot counter → hold-to-ignite gate
   ========================================================= */
const intro = $('#intro');
const gate = $('#gate');
const holdBtn = $('#hold');
const holdBar = $('#holdBar');
const CIRC = 2 * Math.PI * 62;
let entered = false;
let igniting = false;

root.classList.add('is-locked', 'is-preentry');
lenis?.stop();

const heroWords = splitWords($('.hero__title'));

function bootCounter() {
  return new Promise((resolve) => {
    const c = { v: 0 };
    const el = $('#count');
    const lines = ['COMPILING CORE…', 'LINKING AGENTS…', 'WARMING SHADERS…', 'READY.'];
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
  // ignite into whatever the story wants at this scroll position, then hand over to the scroll
  const now = storyAt(window.scrollY);
  igniting = true;
  scene?.ignite(now.t < 0.5 ? now.a.d.shape : now.b.d.shape);
  gsap.delayedCall(reduce ? 0.1 : 2.3, () => { igniting = false; story(); });
  activate(now.t < 0.5 ? now.a : now.b);
  applyPlacement(now);

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
    .fromTo('.hud, .hud-bottom, .topbar', { opacity: 0 }, { opacity: 1, duration: 1 }, 0.2);
  return tl;
}
gsap.set('.hud, .hud-bottom, .topbar', { opacity: 0 });

Promise.all([bootCounter(), document.fonts?.ready ?? Promise.resolve()]).then(() => {
  if (reduce) enter();
  else showGate();
});

/* =========================================================
   Story engine — the scroll position is the timeline.
   Each chapter has a "hold" range where its shape is fully
   formed; between holds the particles travel to the next one.
   ========================================================= */
function measure() {
  const vh = window.innerHeight;
  const st = hTween.scrollTrigger;
  const seg = (st.end - st.start) / Math.max(1, panels.length - 1);
  let pi = 0;
  chapters.forEach((c) => {
    if (c.product) {
      const center = st.start + seg * pi++;
      c.hold = [center - seg * 0.22, center + seg * 0.22];
    } else {
      const top = c.sec.getBoundingClientRect().top + window.scrollY;
      const h = c.sec.offsetHeight;
      c.hold = [top - vh * 0.08, top + Math.max(0, h - vh) + vh * 0.08];
    }
  });
  // keep holds ordered and non-overlapping
  for (let i = 1; i < chapters.length; i++) {
    const prev = chapters[i - 1].hold, cur = chapters[i].hold;
    if (cur[0] < prev[1]) {
      const mid = (cur[0] + prev[1]) / 2;
      prev[1] = mid - 1;
      cur[0] = mid + 1;
    }
  }
}

function storyAt(y) {
  const n = chapters.length;
  for (let k = 0; k < n; k++) {
    const [h0, h1] = chapters[k].hold;
    if (y < h0) {
      if (k === 0) return { a: chapters[0], b: chapters[1], t: 0 };
      const prevEnd = chapters[k - 1].hold[1];
      return { a: chapters[k - 1], b: chapters[k], t: clamp01((y - prevEnd) / Math.max(1, h0 - prevEnd)) };
    }
    if (y <= h1) {
      return k < n - 1 ? { a: chapters[k], b: chapters[k + 1], t: 0 } : { a: chapters[n - 2], b: chapters[n - 1], t: 1 };
    }
  }
  return { a: chapters[n - 2], b: chapters[n - 1], t: 1 };
}

const placeOf = (c) => ({
  px: Number(c.d.px || 0), py: Number(c.d.py || 0), scale: Number(c.d.scale || 1), dim: Number(c.d.dim || 1),
});
function applyPlacement({ a, b, t }) {
  if (!scene) return;
  const e = smooth(t);
  const A = placeOf(a), B = placeOf(b);
  scene.placeNow({ px: lerp(A.px, B.px, e), py: lerp(A.py, B.py, e), scale: lerp(A.scale, B.scale, e), dim: lerp(A.dim, B.dim, e) });
  scene.colorsNow(a.theme.colors, b.theme.colors, e);
}

function story() {
  if (!entered) return;
  const now = storyAt(window.scrollY);
  if (!igniting) {
    scene?.scrubTo(now.a.d.shape, now.b.d.shape, now.t);
    applyPlacement(now);
  }
  activate(now.t < 0.5 ? now.a : now.b);
}

/* HUD, backdrop and glow follow the dominant chapter */
const glow = { ar: 124, ag: 247, ab: 212, br: 139, bg: 124, bb: 255 };
function applyGlow() {
  root.style.setProperty('--glow-a', `${glow.ar | 0}, ${glow.ag | 0}, ${glow.ab | 0}`);
  root.style.setProperty('--glow-b', `${glow.br | 0}, ${glow.bg | 0}, ${glow.bb | 0}`);
}
let active = null;
function activate(c) {
  if (active === c) return;
  active = c;
  const theme = c.theme;
  const [idx, name] = (c.d.chapter || '00|').split('|');
  backdrop.set(c.d.bg);
  const [ar, ag, ab] = theme.glowA, [br, bg, bb] = theme.glowB;
  gsap.to(glow, { ar, ag, ab, br, bg, bb, duration: 1.4, ease: 'power2.out', onUpdate: applyGlow });
  root.style.setProperty('--accent', theme.accent);

  const idxEl = $('#chapterIdx'), nameEl = $('#chapterName');
  gsap.to([idxEl, nameEl], {
    opacity: 0, y: -6, duration: 0.25, ease: 'power2.in', overwrite: true,
    onComplete() {
      idxEl.textContent = idx;
      nameEl.textContent = name;
      gsap.fromTo([idxEl, nameEl], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5 });
    },
  });
  $('#topMarker').textContent = c.d.version || '';
}

/* top progress bar + LN ticker */
const ticks = $('#topTicks');
for (let i = 0; i <= 60; i++) {
  const t = document.createElement('i');
  t.style.right = `${(i / 60) * 100}%`;
  if (i % 5 === 0) t.className = 'major';
  ticks.appendChild(t);
}
const tickerVal = $('#tickerVal');
const topFill = $('#topFill');
const topMarker = $('#topMarker');
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate(self) {
    tickerVal.textContent = String(Math.round(self.progress * 9999)).padStart(4, '0');
    topFill.style.transform = `scaleX(${self.progress})`;
    topMarker.style.right = `${self.progress * 100}%`;
    scene?.setVelocity(self.getVelocity() / 2500);
    story();
  },
});

/* =========================================================
   Scene text — sticky scenes: copy blurs in as the scene
   arrives, holds while it is pinned, and blurs out as it leaves
   ========================================================= */
const scenes = $$('.chapter-sec:not(.product)');
scenes.forEach((sec, i) => {
  const wrap = $('.wrap', sec);
  if (!wrap || reduce) return;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true },
  });
  if (i > 0) {
    tl.fromTo(wrap, { autoAlpha: 0, y: 90, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.2, ease: 'power2.out' }, 0.16);
  }
  if (i < scenes.length - 1) {
    tl.fromTo(wrap, { autoAlpha: 1, y: 0, filter: 'blur(0px)' }, { autoAlpha: 0, y: -90, filter: 'blur(10px)', duration: 0.2, ease: 'power2.in', immediateRender: false }, 0.64);
  }
  tl.add(() => {}, 1);
});

/* titles — words rise in as each scene arrives */
$$('[data-split]:not([data-split="hero"])').forEach((el) => {
  const words = splitWords(el);
  if (reduce) return;
  const sec = el.closest('section');
  gsap.fromTo(words, { yPercent: 115 }, {
    yPercent: 0, duration: 1.3, stagger: 0.06,
    scrollTrigger: { trigger: sec.classList.contains('product') ? hWrap : sec, start: 'top 45%', toggleActions: 'play none none reverse' },
  });
});

/* contact cards */
if (!reduce) {
  gsap.fromTo('#contact [data-fade]', { opacity: 0, y: 32 }, {
    opacity: 1, y: 0, duration: 1.2, stagger: 0.08,
    scrollTrigger: { trigger: '#contact', start: 'top 35%', toggleActions: 'play none none reverse' },
  });
}

/* manifesto lines — words light up while the scene is held */
$$('[data-scrub-words]').forEach((el) => {
  const words = splitWords(el);
  words.forEach((w) => w.classList.add('sw'));
  if (reduce) return;
  gsap.to(words, {
    opacity: 1,
    ease: 'none',
    stagger: 0.1,
    scrollTrigger: { trigger: el.closest('section'), start: 'top 40%', end: 'bottom 105%', scrub: 0.6 },
  });
});

/* agents log — lines tick on one after another */
const logItems = $$('.log li');
if (reduce) {
  logItems.forEach((li) => li.classList.add('is-on'));
} else {
  ScrollTrigger.create({
    trigger: '#agents',
    start: 'top 30%',
    end: 'bottom 110%',
    onUpdate(self) {
      const lit = Math.floor(self.progress * (logItems.length + 0.6));
      logItems.forEach((li, i) => li.classList.toggle('is-on', i < lit));
    },
    onLeave: () => logItems.forEach((li) => li.classList.add('is-on')),
  });
}

/* months → weeks : strike the old, light the new */
const swap = $('.swap');
if (reduce) swap.classList.add('is-on');
else {
  ScrollTrigger.create({
    trigger: '#speed',
    start: 'top 15%',
    onEnter: () => swap.classList.add('is-on'),
    onLeaveBack: () => swap.classList.remove('is-on'),
  });
}

/* idea → site / app / store / platform */
const rotator = $('#rotator');
const WORDS = ['سایت', 'اپلیکیشن', 'فروشگاه', 'پلتفرم'];
let wordIdx = 0;
setInterval(() => {
  wordIdx = (wordIdx + 1) % WORDS.length;
  if (reduce) { rotator.textContent = WORDS[wordIdx]; return; }
  gsap.to(rotator, {
    yPercent: -70, opacity: 0, duration: 0.28, ease: 'power2.in',
    onComplete() {
      rotator.textContent = WORDS[wordIdx];
      gsap.fromTo(rotator, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
    },
  });
}, 2200);

/* wink pops at the end of the punchline */
if (!reduce) {
  gsap.fromTo('.wink', { scale: 0, rotate: -120 }, {
    scale: 1, rotate: 0, ease: 'back.out(3)', duration: 1,
    scrollTrigger: { trigger: '#punch', start: 'top 5%', toggleActions: 'play none none reverse' },
  });
}

/* re-measure the story whenever layout changes */
ScrollTrigger.addEventListener('refresh', () => { measure(); story(); });
measure();

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
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button'));
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
   Anchor navigation
   ========================================================= */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !document.querySelector(id)) return;
    e.preventDefault();
    scrollTo(id);
  });
});

/* keep layout fresh after fonts settle */
window.addEventListener('load', () => ScrollTrigger.refresh());
