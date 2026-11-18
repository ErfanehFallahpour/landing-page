/* AXON — story landing
   Scene colours: every .scene / .prod carries data-bg / data-fg / data-ac.
   The root CSS variables are tweened to them as the story scrolls. */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------------- shared builders ---------------- */
  // Crowd of 48 "developers" — 5 of them become the AI agents later
  const crowd = $('#crowd');
  const AGENTS = [10, 19, 27, 36, 45];
  for (let i = 0; i < 48; i++) {
    const p = document.createElement('i');
    p.className = 'person' + (AGENTS.includes(i) ? ' agent-seed' : '');
    crowd.appendChild(p);
  }

  // Exchange candles
  const exChart = $('#exChart');
  const candles = [];
  let price = 97000;
  const N = 30;
  for (let i = 0; i < N; i++) {
    const o = price;
    const c = o + rand(-420, 470);
    const h = Math.max(o, c) + rand(40, 260);
    const l = Math.min(o, c) - rand(40, 260);
    candles.push({ o, c, h, l });
    price = c;
  }
  function drawCandles() {
    const max = Math.max(...candles.map(k => k.h));
    const min = Math.min(...candles.map(k => k.l));
    const y = v => 145 - ((v - min) / (max - min)) * 140;
    const w = 320 / N;
    exChart.innerHTML = candles.map((k, i) => {
      const up = k.c >= k.o;
      const col = up ? '#2ee6a0' : '#ff5577';
      const x = i * w + w / 2;
      const top = y(Math.max(k.o, k.c));
      const hgt = Math.max(1.5, Math.abs(y(k.o) - y(k.c)));
      return `<line x1="${x}" x2="${x}" y1="${y(k.h)}" y2="${y(k.l)}" stroke="${col}" stroke-width="1" vector-effect="non-scaling-stroke"/>` +
             `<rect x="${x - w * 0.32}" y="${top}" width="${w * 0.64}" height="${hgt}" fill="${col}" rx="1"/>`;
    }).join('');
  }
  drawCandles();

  // Gold curve
  const goldPts = [];
  let g = 60;
  for (let i = 0; i <= 40; i++) { g += rand(-6, 7.5); g = Math.min(100, Math.max(10, g)); goldPts.push(g); }
  const goldPath = $('#goldPath');
  const goldD = () => goldPts.map((v, i) => `${i ? 'L' : 'M'}${(i / 40) * 300},${110 - v}`).join(' ');
  goldPath.setAttribute('d', goldD());

  // Live tickers (skipped for reduced motion)
  const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (!reduce) {
    const exPrice = $('#exPrice');
    const goldPrice = $('#goldPrice');
    let gp = 7245000;
    setInterval(() => {
      const last = candles[candles.length - 1];
      last.c += rand(-90, 100);
      last.h = Math.max(last.h, last.c);
      last.l = Math.min(last.l, last.c);
      if (Math.random() < 0.12) {
        candles.shift();
        const o = last.c;
        candles.push({ o, c: o, h: o + 20, l: o - 20 });
      }
      drawCandles();
      exPrice.textContent = fmt(candles[candles.length - 1].c);
      gp += Math.round(rand(-3, 4)) * 1000;
      goldPrice.textContent = gp.toLocaleString('en-US');
    }, 900);
  }

  // Rotating word: سایت / اپلیکیشن / …
  const rot = $('#rotator');
  const WORDS = ['سایت', 'اپلیکیشن', 'فروشگاه', 'پلتفرم'];
  let wi = 0;
  setInterval(() => {
    wi = (wi + 1) % WORDS.length;
    if (hasGsap && !reduce) {
      gsap.to(rot, { yPercent: -60, opacity: 0, duration: .25, ease: 'power2.in', onComplete: () => {
        rot.textContent = WORDS[wi];
        gsap.fromTo(rot, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .4, ease: 'power3.out' });
      } });
    } else {
      rot.textContent = WORDS[wi];
    }
  }, 2000);

  /* ---------------- static fallback ---------------- */
  if (!hasGsap || reduce) {
    root.classList.add('static');
    $$('.scene').forEach(s => {
      s.style.background = s.dataset.bg;
      s.style.color = s.dataset.fg;
      s.style.setProperty('--ac', s.dataset.ac);
      s.style.setProperty('--bg', s.dataset.bg);
      s.style.setProperty('--fg', s.dataset.fg);
    });
    $$('.prod').forEach(p => {
      p.classList.add('is-active');
      p.style.setProperty('--pbg', p.dataset.bg);
      p.style.setProperty('--pfg', p.dataset.fg);
      p.style.setProperty('--pac', p.dataset.ac);
    });
    $('.devices').classList.add('is-built');
    $$('.agent-seed').forEach(p => p.classList.add('is-agent'));
    document.body.classList.remove('is-loading');
    return;
  }

  /* ---------------- motion ---------------- */
  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('is-loading');
  window.scrollTo(0, 0);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Smooth scroll
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? 0 : $(id);
    if (el === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.6 });
    else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else el.scrollIntoView({ behavior: 'smooth' });
  }));

  // Word splitter (word level so Persian letters stay joined)
  function splitWords(el) {
    [...el.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        const parts = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const m = document.createElement('span'); m.className = 'mask';
          const w = document.createElement('span'); w.className = 'wi'; w.textContent = part;
          m.appendChild(w); frag.appendChild(m);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1 && node.tagName !== 'BR' && !node.classList.contains('strike') && !node.classList.contains('wink')) {
        splitWords(node);
      }
    });
  }
  $$('.reveal, .era__title, #punchText, .contact__title').forEach(splitWords);

  // Theme switching
  const themeMeta = $('meta[name="theme-color"]');
  const chIdx = $('#chIdx');
  const chName = $('#chName');
  let current = '';
  function setTheme(el) {
    const key = el.dataset.bg + el.dataset.fg + el.dataset.ac;
    if (key === current) return;
    current = key;
    gsap.to(root, { '--bg': el.dataset.bg, '--fg': el.dataset.fg, '--ac': el.dataset.ac, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
    themeMeta.setAttribute('content', el.dataset.bg);
  }
  function setChapter(el) {
    const [i, n] = (el.dataset.ch || '').split('|');
    if (!i) return;
    chIdx.textContent = i;
    chName.textContent = n;
  }
  // after a scene's pin is created, its pin-spacer is the true scroll extent
  function themeTrigger(scene) {
    const t = scene.parentElement.classList.contains('pin-spacer') ? scene.parentElement : scene;
    ScrollTrigger.create({
      trigger: t, start: 'top 55%', end: 'bottom 55%',
      onToggle: self => { if (self.isActive) { setTheme(scene); setChapter(scene); } },
    });
  }
  const revealIn = (el, trigger, extra = {}) => gsap.from($$('.wi', el), {
    yPercent: 115, duration: 1, ease: 'expo.out', stagger: 0.05,
    scrollTrigger: { trigger, start: 'top 72%', toggleActions: 'play none none reverse' }, ...extra,
  });

  // Progress bar
  gsap.to('#progressBar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---- 01 ERA ---- */
  const era = $('#top');
  const persons = $$('.person');
  const agentsDots = $$('.agent-seed');
  const others = persons.filter(p => !p.classList.contains('agent-seed'));
  gsap.set(persons, { scale: 0, opacity: 0 });
  gsap.set($$('.era__title .wi'), { yPercent: 115 });
  gsap.set(['.era__meta', '.era .kicker', '.scroll-cue'], { opacity: 0 });

  const eraTl = gsap.timeline({
    scrollTrigger: { trigger: era, pin: true, start: 'top top', end: '+=140%', scrub: 0.7 },
  });
  eraTl
    .to('.strike', { scaleX: 1, duration: 1, ease: 'power2.inOut' })
    .to('.scroll-cue', { opacity: 0, duration: .3 }, 0)
    .to('#eraMeta', { opacity: 0, y: -10, duration: .4 }, '<0.2')
    .to(others, {
      y: () => rand(120, 420), x: () => rand(-60, 60), rotate: () => rand(-90, 90), opacity: 0,
      duration: 1.2, ease: 'power2.in', stagger: { each: 0.018, from: 'random' },
    }, '<')
    .to(agentsDots, { scale: 1.35, duration: .5 }, '<0.6')
    .to('.era__over', { opacity: 1, y: 0, rotate: -4, duration: .7, ease: 'back.out(2)' }, '-=0.4')
    .to({}, { duration: .4 });
  eraTl.eventCallback('onUpdate', () => agentsDots.forEach(p => p.classList.toggle('is-agent', eraTl.progress() > 0.45)));
  themeTrigger(era);

  /* ---- 02 AGENTS ---- */
  const agents = $('#agents');
  revealIn($('.reveal', agents), agents);
  gsap.from($$('.ups li', agents), { opacity: 0, y: 30, stagger: .12, duration: .8, ease: 'power3.out',
    scrollTrigger: { trigger: agents, start: 'top 55%', toggleActions: 'play none none reverse' } });
  const agTl = gsap.timeline({ scrollTrigger: { trigger: agents, pin: true, start: 'top top', end: '+=110%', scrub: 0.6 } });
  $$('.agent', agents).forEach((row, i) => {
    agTl.to($('.agent__bar i', row), { scaleX: 1, duration: 1, ease: 'none' }, i * 0.35)
        .to($('.agent__ok', row), { opacity: 1, duration: .15 }, '>');
  });
  agTl.to('.term__done', { opacity: 1, duration: .3 }).to({}, { duration: .3 });
  themeTrigger(agents);

  /* ---- 03 TIME ---- */
  const time = $('#time');
  const usVal = $('#usVal');
  revealIn($('.reveal', time), time);
  gsap.from($('.ghost', time), { yPercent: 30, ease: 'none', scrollTrigger: { trigger: time, start: 'top bottom', end: 'bottom top', scrub: true } });
  const tTl = gsap.timeline({ scrollTrigger: { trigger: time, pin: true, start: 'top top', end: '+=90%', scrub: 0.6,
    onUpdate: s => { usVal.textContent = s.progress > 0.5 ? 'روزها' : 'ماه‌ها'; } } });
  tTl.to('#usBar', { width: '14%', duration: 1, ease: 'power2.inOut' }, 0.15).to({}, { duration: .3 });
  themeTrigger(time);

  /* ---- 04 IDEA ---- */
  const idea = $('#idea');
  revealIn($('.reveal', idea), idea);
  ScrollTrigger.create({
    trigger: idea, start: 'top 35%',
    onEnter: () => $('.devices').classList.add('is-built'),
    onLeaveBack: () => $('.devices').classList.remove('is-built'),
  });
  gsap.from('.dev', { y: 60, opacity: 0, stagger: .15, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: idea, start: 'top 70%', toggleActions: 'play none none reverse' } });
  gsap.from('.sketch__note', { scale: 0, rotate: -30, duration: .8, ease: 'back.out(2.5)',
    scrollTrigger: { trigger: idea, start: 'top 55%', toggleActions: 'play none none reverse' } });
  themeTrigger(idea);

  /* ---- 05 WORK (horizontal, RTL → track moves right) ---- */
  const work = $('#work');
  const track = $('#workTrack');
  const prods = $$('.prod');
  const dist = () => track.scrollWidth - window.innerWidth;
  let activeProd = -1;
  function activateProd(i) {
    if (i === activeProd) return;
    activeProd = i;
    prods.forEach((p, j) => p.classList.toggle('is-active', j === i));
    setTheme(prods[i]);
    const [, nm] = work.dataset.ch.split('|');
    chIdx.textContent = `05.${i + 1}`;
    chName.textContent = prods[i].querySelector('.prod__title').textContent || nm;
    if (prods[i].querySelector('.mock--gold')) {
      const len = goldPath.getTotalLength();
      gsap.fromTo(goldPath, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out' });
    }
  }
  const hTween = gsap.to(track, {
    x: () => dist(), ease: 'none',
    scrollTrigger: {
      trigger: work, pin: true, start: 'top top', end: () => '+=' + Math.max(dist(), window.innerHeight * 4), scrub: 0.7, invalidateOnRefresh: true,
      onUpdate: s => activateProd(Math.round(s.progress * (prods.length - 1))),
    },
  });
  ScrollTrigger.create({
    trigger: work.parentElement, start: 'top 55%', end: 'bottom 55%',
    onToggle: self => {
      if (!self.isActive) return;
      activeProd = -1;
      activateProd(Math.round(hTween.scrollTrigger.progress * (prods.length - 1)));
    },
  });

  /* ---- 06 LANDING ---- */
  const landing = $('#landing');
  revealIn($('.reveal', landing), landing);
  gsap.from($$('.bk', landing), {
    x: () => rand(-260, 260), y: () => rand(-200, 200), rotate: () => rand(-40, 40), opacity: 0, scale: .6,
    stagger: 0.07, ease: 'power3.out',
    scrollTrigger: { trigger: landing, start: 'top 75%', end: 'center 50%', scrub: 0.8 },
  });
  gsap.from('.note', { opacity: 0, x: -20, scrollTrigger: { trigger: landing, start: 'center 60%', toggleActions: 'play none none reverse' } });
  themeTrigger(landing);

  /* ---- 07 PUNCH ---- */
  const punch = $('#punch');
  gsap.to($$('#punchText .wi'), { opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: punch, start: 'top 65%', end: 'center 45%', scrub: 0.5 } });
  gsap.from('.wink', { scale: 0, rotate: -180, ease: 'back.out(3)',
    scrollTrigger: { trigger: punch, start: 'center 50%', end: 'center 35%', scrub: 0.5 } });
  themeTrigger(punch);

  /* ---- 08 CONTACT ---- */
  const contact = $('#contact');
  revealIn(contact, contact);
  gsap.from($$('.links li', contact), { y: 50, opacity: 0, stagger: .1, duration: .9, ease: 'expo.out',
    scrollTrigger: { trigger: '.links', start: 'top 85%', toggleActions: 'play none none reverse' } });
  themeTrigger(contact);

  /* ---------------- intro ---------------- */
  function intro() {
    const count = $('#count');
    const o = { v: 0 };
    const tl = gsap.timeline();
    tl.to(o, { v: 99, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(o.v)).padStart(2, '0'); } })
      .to('#intro', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '+=0.15')
      .add(() => { document.body.classList.remove('is-loading'); lenis && lenis.start(); $('#intro').remove(); })
      .to('.era__title .wi', { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, '-=0.5')
      .to(persons, { scale: 1, opacity: 1, duration: .6, ease: 'back.out(2)', stagger: { each: 0.012, from: 'random' } }, '<0.1')
      .to(['.era__meta', '.era .kicker', '.scroll-cue'], { opacity: 1, duration: .6, stagger: .1 }, '<0.4');
    gsap.set('#intro', { clipPath: 'inset(0 0 0% 0)' });
  }

  setTheme(era);
  setChapter(era);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    ScrollTrigger.refresh();
    intro();
  });
})();
