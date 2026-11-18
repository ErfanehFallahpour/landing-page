import * as THREE from 'three';

/* =========================================================
   Shape library — every shape is a Float32Array of N points
   ========================================================= */
const TAU = Math.PI * 2;
const rnd = Math.random;
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2;

function rotX([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}
function rotZ([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}
function randDir() {
  const u = rnd() * 2 - 1, t = rnd() * TAU, s = Math.sqrt(1 - u * u);
  return [s * Math.cos(t), u, s * Math.sin(t)];
}

const SHAPES = {
  chaos() {
    const r = 1.6 + Math.pow(rnd(), 0.9) * 5.5;
    const d = randDir();
    return [d[0] * r * 1.35, d[1] * r * 0.75, d[2] * r * 0.8];
  },

  sphere(i, N) {
    if (rnd() < 0.84) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = i * 2.399963229;
      const r = 2.55 + gauss() * 0.04;
      return [Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r];
    }
    const d = randDir();
    const r = Math.cbrt(rnd()) * 2.1;
    return [d[0] * r, d[1] * r, d[2] * r];
  },

  galaxy() {
    if (rnd() < 0.12) {
      const d = randDir();
      const r = Math.pow(rnd(), 2) * 0.9;
      return rotX([d[0] * r, d[1] * r * 0.6, d[2] * r], 1.05);
    }
    const arm = Math.floor(rnd() * 3);
    const r = 0.4 + Math.pow(rnd(), 0.65) * 5.2;
    const a = r * 0.95 + (arm * TAU) / 3 + gauss() * (0.5 / (r * 0.4 + 0.6));
    const y = gauss() * 0.14 * (1.2 - r / 6);
    return rotX([Math.cos(a) * r, y, Math.sin(a) * r], 1.08);
  },

  torus() {
    if (rnd() < 0.16) {
      const a = rnd() * TAU;
      const R = 3.6 + gauss() * 0.06;
      return rotZ(rotX([Math.cos(a) * R, gauss() * 0.03, Math.sin(a) * R], 1.35), 0.4);
    }
    const u = rnd() * TAU, v = rnd() * TAU;
    const R = 2.2, r = 0.72 * (0.9 + rnd() * 0.1);
    const p = [(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)];
    return rotZ(rotX(p, 1.15), -0.25);
  },

  lattice() {
    const n = 3, step = 1.3, h = 0.42;
    const c = () => (Math.floor(rnd() * n) - (n - 1) / 2) * step;
    const cx = c(), cy = c(), cz = c();
    if (rnd() < 0.2) {
      // network links between neighbouring cubes
      const axis = Math.floor(rnd() * 3);
      const p = [cx, cy, cz];
      p[axis] += rnd() * step;
      if (p[axis] > ((n - 1) / 2) * step) p[axis] -= step;
      return p.map((v) => v + gauss() * 0.015);
    }
    const axis = Math.floor(rnd() * 3);
    const p = [rnd() < 0.5 ? -h : h, rnd() < 0.5 ? -h : h, rnd() < 0.5 ? -h : h];
    p[axis] = (rnd() * 2 - 1) * h;
    return rotX([cx + p[0], cy + p[1], cz + p[2]], 0.5).map((v, k) => (k === 1 ? v : v));
  },

  wave() {
    const x = (rnd() * 2 - 1) * 4.6;
    const z = (rnd() * 2 - 1) * 3.4;
    const y = Math.sin(x * 0.9) * 0.55 + Math.cos(z * 1.15 + x * 0.45) * 0.42;
    return rotX([x, y, z], 0.62);
  },

  coins() {
    const k = Math.floor(rnd() * 7);
    const cy = -1.55 + k * 0.4;
    const ox = Math.sin(k * 1.9) * 0.16, oz = Math.cos(k * 2.3) * 0.12;
    const R = 1.6, t = 0.15;
    const r = rnd();
    let p;
    if (k === 6 && r < 0.12) {
      // embossed ring on top coin
      const a = rnd() * TAU, rr = 1.18 + gauss() * 0.02;
      p = [Math.cos(a) * rr, t + 0.02, Math.sin(a) * rr];
    } else if (r < 0.45) {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * R;
      p = [Math.cos(a) * rr, t, Math.sin(a) * rr];
    } else if (r < 0.88) {
      const a = rnd() * TAU;
      p = [Math.cos(a) * R, (rnd() * 2 - 1) * t, Math.sin(a) * R];
    } else {
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * R;
      p = [Math.cos(a) * rr, -t, Math.sin(a) * rr];
    }
    if (rnd() < 0.06) {
      // rising gold dust
      const d = randDir();
      return [d[0] * 2.6, 1.3 + rnd() * 2.2, d[2] * 2.2];
    }
    return rotX([p[0] + ox, p[1] + cy, p[2] + oz], 0.62);
  },

  pillars() {
    const r = rnd();
    let p;
    if (r < 0.58) {
      const col = Math.floor(rnd() * 5);
      const x = -2.4 + col * 1.2;
      const a = rnd() * TAU;
      const rad = 0.25 + 0.025 * Math.cos(a * 8);
      p = [x + Math.cos(a) * rad, -1.55 + rnd() * 2.95, Math.sin(a) * rad];
    } else if (r < 0.72) {
      // base steps
      const s = Math.floor(rnd() * 2);
      const w = 3.2 + s * 0.3, d = 0.75 + s * 0.15;
      const y = -1.6 - s * 0.22;
      p = edgeOrFace(w, 0.11, d, y);
    } else if (r < 0.84) {
      // architrave
      p = edgeOrFace(3.15, 0.14, 0.7, 1.55);
    } else {
      // pediment triangle
      const x = (rnd() * 2 - 1) * 3.1;
      const top = 1.72 + 0.95 * (1 - Math.abs(x) / 3.1);
      const y = 1.72 + rnd() * (top - 1.72);
      const z = rnd() < 0.7 ? 0.6 : -0.6;
      p = [x, y, z];
    }
    return rotX(p, 0.18).map((v, k) => (k === 1 ? v - 0.1 : v));
  },

  helix() {
    const len = 8;
    if (rnd() < 0.28) {
      const k = Math.floor(rnd() * 26);
      const t = k / 26;
      const a = t * TAU * 2.4;
      const f = rnd();
      const R = 1.25;
      const p = [Math.cos(a) * R * (1 - 2 * f), -len / 2 + t * len, Math.sin(a) * R * (1 - 2 * f)];
      return rotZ(p, 0.55);
    }
    const t = rnd();
    const a = t * TAU * 2.4 + (rnd() < 0.5 ? 0 : Math.PI);
    const R = 1.25 + gauss() * 0.05;
    return rotZ([Math.cos(a) * R, -len / 2 + t * len + gauss() * 0.04, Math.sin(a) * R], 0.55);
  },

  orbits() {
    if (rnd() < 0.14) {
      const d = randDir();
      const r = Math.cbrt(rnd()) * 0.55;
      return [d[0] * r, d[1] * r, d[2] * r];
    }
    const k = Math.floor(rnd() * 4);
    const R = 1.1 + k * 0.72 + gauss() * 0.03;
    const a = rnd() * TAU;
    let p = [Math.cos(a) * R, gauss() * 0.025, Math.sin(a) * R];
    p = rotX(p, 0.4 + k * 0.42);
    return rotZ(p, k * 0.75);
  },

  /* a crowd of developers — 4 staggered rows of head + shoulders */
  crowd() {
    const C = 8, R = 4;
    if (rnd() < 0.05) {
      // loose dust drifting above the crowd
      return [(rnd() * 2 - 1) * 4.6, 2.2 + rnd() * 1.4, (rnd() * 2 - 1) * 1.2];
    }
    const k = Math.floor(rnd() * C * R);
    const c = k % C, r = Math.floor(k / C);
    const x0 = (c - (C - 1) / 2) * 0.98 + (r % 2 ? 0.49 : 0) - 0.245;
    const y0 = 1.55 - r * 1.02;
    const z0 = (r - 1.5) * 0.55;
    let p;
    if (rnd() < 0.42) {
      const d = randDir();
      const hr = 0.19 + gauss() * 0.004;
      p = [d[0] * hr, 0.42 + d[1] * hr, d[2] * hr];
    } else if (rnd() < 0.18) {
      p = [(rnd() * 2 - 1) * 0.36, -0.12, gauss() * 0.09]; // shoulder base
    } else {
      const a = rnd() * Math.PI;
      const s = rnd() < 0.72 ? 1 : Math.sqrt(rnd());
      p = [Math.cos(a) * 0.36 * s, -0.12 + Math.sin(a) * 0.32 * s, gauss() * 0.09];
    }
    return rotX([x0 + p[0], y0 + p[1], z0 + p[2]], 0.16);
  },

  /* hourglass — glass bulbs, caps, posts and running sand */
  hourglass() {
    const H = 1.9;
    const prof = (y) => 0.11 + 1.16 * Math.pow(Math.abs(y) / H, 1.3);
    const r = rnd();
    let p;
    if (r < 0.34) {
      // glass shell
      const y = (rnd() * 2 - 1) * H;
      const a = rnd() * TAU, R = prof(y) + gauss() * 0.008;
      p = [Math.cos(a) * R, y, Math.sin(a) * R];
    } else if (r < 0.5) {
      // top + bottom caps (rim-heavy discs)
      const s = rnd() < 0.5 ? 1 : -1;
      const a = rnd() * TAU, rr = rnd() < 0.62 ? 1.58 : Math.sqrt(rnd()) * 1.58;
      p = [Math.cos(a) * rr, s * (H + 0.12) + (rnd() - 0.5) * 0.16, Math.sin(a) * rr];
    } else if (r < 0.58) {
      // three posts
      const k = Math.floor(rnd() * 3), a = (k * TAU) / 3 + 0.5;
      p = [Math.cos(a) * 1.42 + gauss() * 0.02, (rnd() * 2 - 1) * H, Math.sin(a) * 1.42 + gauss() * 0.02];
    } else if (r < 0.84) {
      // sand pile in the lower bulb
      const s = Math.pow(rnd(), 1.4);
      const y = -H + 0.04 + s * 0.95;
      const lim = Math.min(prof(y) * 0.9, (1 - s) * 1.3 + 0.05);
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * lim;
      p = [Math.cos(a) * rr, y, Math.sin(a) * rr];
    } else if (r < 0.94) {
      // what is left in the upper bulb
      const y = 0.22 + rnd() * 0.62;
      const a = rnd() * TAU, rr = Math.sqrt(rnd()) * prof(y) * 0.88;
      p = [Math.cos(a) * rr, y, Math.sin(a) * rr];
    } else {
      // falling stream
      p = [gauss() * 0.025, -H + 0.95 + rnd() * (H - 0.75), gauss() * 0.025];
    }
    return rotX(p, 0.16);
  },

  /* gold bars — a stacked pyramid of six trapezoid ingots */
  ingots() {
    if (rnd() < 0.05) {
      const d = randDir();
      return [d[0] * 2.8, 0.8 + rnd() * 2.2, d[2] * 1.8]; // rising gold dust
    }
    const STACK = [[-1.52, 0], [0, 0], [1.52, 0], [-0.76, 1], [0.76, 1], [0, 2]];
    const [cx, row] = STACK[Math.floor(rnd() * STACK.length)];
    const cy = -1.05 + row * 0.47;
    const w0 = 0.72, d0 = 0.4, w1 = 0.54, d1 = 0.26, hh = 0.42;
    const B = [[-w0, 0, -d0], [w0, 0, -d0], [w0, 0, d0], [-w0, 0, d0]];
    const T = [[-w1, hh, -d1], [w1, hh, -d1], [w1, hh, d1], [-w1, hh, d1]];
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const r = rnd();
    let q;
    if (r < 0.48) {
      // crisp edges
      const e = Math.floor(rnd() * 12), t = rnd();
      q = e < 4 ? mix(B[e], B[(e + 1) % 4], t) : e < 8 ? mix(T[e - 4], T[(e - 3) % 4], t) : mix(B[e - 8], T[e - 8], t);
    } else if (r < 0.74) {
      // polished top face with a stamped panel
      q = rnd() < 0.25
        ? [(rnd() < 0.5 ? -1 : 1) * w1 * 0.6 * (0.6 + rnd() * 0.4), hh + 0.01, (rnd() * 2 - 1) * d1 * 0.55]
        : [(rnd() * 2 - 1) * w1, hh, (rnd() * 2 - 1) * d1];
    } else {
      // sloped sides
      const i = Math.floor(rnd() * 4), u = rnd(), v = rnd();
      q = mix(mix(B[i], B[(i + 1) % 4], u), mix(T[i], T[(i + 1) % 4], u), v);
    }
    const s = 1.22;
    return rotX([(q[0] + cx) * s, (q[1] + cy) * s, q[2] * s], 0.6);
  },

  ring() {
    if (rnd() < 0.3) {
      const a = rnd() * TAU;
      const R = 3 + gauss() * 0.9;
      return [Math.cos(a) * R, Math.sin(a) * R, gauss() * 0.6];
    }
    const u = rnd() * TAU, v = rnd() * TAU;
    const R = 2.9, r = 0.1;
    return rotX([(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)], 0.22);
  },
};

function edgeOrFace(hw, hh, hd, cy) {
  // points on a box surface, biased to edges
  const axis = Math.floor(rnd() * 3);
  const h = [hw, hh, hd];
  const p = [(rnd() * 2 - 1) * hw, (rnd() * 2 - 1) * hh, (rnd() * 2 - 1) * hd];
  p[axis] = (rnd() < 0.5 ? -1 : 1) * h[axis];
  return [p[0], p[1] + cy, p[2]];
}

/* ---------------------------------------------------------
   Icon shapes — an SVG path is stroked onto an offscreen
   canvas, its pixels are sampled and extruded into depth.
   Lucide-style 24×24 paths (ISC licence).
   --------------------------------------------------------- */
const ICONS = {
  bitcoin: {
    d: 'M23 12a11 11 0 1 1-22 0a11 11 0 1 1 22 0 M15.6 9.2c.4-2.2-1.4-3-3.6-3.3L8.9 5.4 7.6 12.6l4 .7c2.2.4 4.2-.1 4-2.3 M7.6 12.6 6.3 19.8l4.3.8c2.4.4 4.4-.2 4.6-2.4.4-2.3-1.6-3.2-3.6-3.6 M10.4 3.6 10 5.6 M13.4 4.1 13 6.1 M8.6 20.3l-.3 1.6 M11.6 20.9l-.3 1.6',
    size: 5.2, depth: 0.32, lw: 1.5,
  },
  cart: {
    d: 'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12 M9 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0 M20 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0',
    size: 5.4, depth: 0.42, lw: 1.7,
  },
  bag: {
    d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0',
    size: 5.0, depth: 0.5, lw: 1.6,
  },
  bot: {
    d: 'M12 8V4H8 M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z M2 14h2 M20 14h2 M15 13v2 M9 13v2',
    size: 5.4, depth: 0.42, lw: 1.6,
  },
  zap: {
    d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
    size: 5.6, depth: 0.4, lw: 1.5,
  },
  bulb: {
    d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5 M9 18h6 M10 22h4 M12 5.5v3 M10.5 8.5h3',
    size: 5.4, depth: 0.45, lw: 1.5,
  },
  landing: {
    d: 'M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M2 6.8h20 M4.4 4.9h.01 M6.2 4.9h.01 M8 4.9h.01 M4.8 10h7.4 M4.8 12.4h5.2 M4.8 15.6h3.6 M14.2 9.6h5v6.4h-5z M4.8 18.4h3.8 M10.1 18.4h3.8 M15.4 18.4h3.8',
    size: 6.0, depth: 0.3, lw: 1.25,
  },
  scales: {
    d: 'm16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z m-14 0 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z M7 21h10 M12 3v18 M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2',
    size: 5.6, depth: 0.32, lw: 1.5,
  },
};
export const ICON_SHAPES = new Set(Object.keys(ICONS));
// non-icon shapes that should also face the viewer instead of spinning
const FRONT_SHAPES = new Set(['crowd', 'ingots']);
const facesFront = (name) => ICON_SHAPES.has(name) || FRONT_SHAPES.has(name);

function buildIcon(name, N) {
  const { d, size, depth, lw } = ICONS[name];
  const R = 320;
  const c = document.createElement('canvas');
  c.width = c.height = R;
  const x = c.getContext('2d');
  x.scale(R / 26, R / 26);
  x.translate(1, 1);
  x.lineWidth = lw;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.strokeStyle = '#fff';
  x.stroke(new Path2D(d));
  const img = x.getImageData(0, 0, R, R).data;
  const pts = [];
  for (let py = 0; py < R; py++) {
    for (let px = 0; px < R; px++) if (img[(py * R + px) * 4 + 3] > 140) pts.push(px, py);
  }
  const a = new Float32Array(N * 3);
  const M = pts.length / 2;
  for (let i = 0; i < N; i++) {
    const k = Math.floor(rnd() * M) * 2;
    // bias depth to front/back faces so the extrusion reads as a solid
    const zf = rnd() < 0.7 ? (rnd() < 0.5 ? -1 : 1) : rnd() * 2 - 1;
    a[i * 3] = ((pts[k] + rnd()) / R - 0.5) * size;
    a[i * 3 + 1] = -((pts[k + 1] + rnd()) / R - 0.5) * size;
    a[i * 3 + 2] = zf * depth + gauss() * 0.02;
  }
  return a;
}

function buildShape(name, N) {
  if (ICONS[name]) return buildIcon(name, N);
  const fn = SHAPES[name];
  const a = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const p = fn(i, N);
    a[i * 3] = p[0];
    a[i * 3 + 1] = p[1];
    a[i * 3 + 2] = p[2];
  }
  return a;
}

/* =========================================================
   Shaders
   ========================================================= */
const vert = /* glsl */ `
  uniform float uTime;
  uniform float uMix;
  uniform float uSize;
  uniform float uPR;
  uniform float uTurb;
  uniform float uBurst;
  uniform float uCharge;
  uniform vec2  uMouse;
  uniform float uMouseForce;
  uniform vec3  uColorA;
  uniform vec3  uColorB;

  attribute vec3 aTarget;
  attribute vec4 aRand;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float t = clamp(uMix * 1.5 - aRand.w * 0.5, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(position, aTarget, t);

    vec3 dir = normalize(aRand.xyz - 0.5 + 0.0001);
    p += dir * sin(t * 3.14159) * uBurst * (0.5 + aRand.y);

    float tm = uTime * (0.35 + aRand.x * 0.45);
    vec3 flow = vec3(
      sin(p.y * 1.1 + tm + aRand.z * 1.6),
      cos(p.z * 1.0 + tm * 1.1 + aRand.x * 1.6),
      sin(p.x * 1.2 + tm * 0.9 + aRand.y * 1.6)
    );
    p += flow * (0.012 + uTurb * (0.35 + aRand.w * 0.65));

    // charge — collapse inward + swirl (intro gate)
    float ch = uCharge * (0.55 + aRand.w * 0.45);
    float sa = ch * 2.2 * (0.5 + aRand.x);
    p.xz = mat2(cos(sa), -sin(sa), sin(sa), cos(sa)) * p.xz;
    p *= 1.0 - ch * 0.82;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // pointer repulsion in view space
    vec2 d = mv.xy - uMouse;
    float dl = length(d);
    float f = smoothstep(1.9, 0.0, dl) * uMouseForce;
    mv.xy += (d / (dl + 0.001)) * f * 0.85;
    mv.z += f * 0.5;

    gl_Position = projectionMatrix * mv;

    float sz = uSize * (0.3 + aRand.y * 1.15) * (1.0 + uCharge * 0.8);
    gl_PointSize = mv.z > -0.4 ? 0.0 : sz * uPR * (7.0 / -mv.z);

    float tw = 0.6 + 0.4 * sin(uTime * 1.8 + aRand.x * 40.0);
    vAlpha = tw * smoothstep(-22.0, -6.0, mv.z) * (0.55 + 0.45 * smoothstep(-13.0, -7.0, mv.z));
    vColor = mix(uColorA, uColorB, smoothstep(0.15, 0.95, aRand.z));
    vColor = mix(vColor, vec3(1.0), f * 0.6 + step(0.985, aRand.y) * 0.5);
  }
`;

const frag = /* glsl */ `
  uniform float uOpacity;
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - d * 2.0, 1.7);
    gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
  }
`;

const dustVert = /* glsl */ `
  uniform float uTime;
  uniform float uPR;
  attribute float aSeed;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.2 + aSeed * 30.0) * 0.4;
    p.x += cos(uTime * 0.15 + aSeed * 20.0) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = mv.z > -0.4 ? 0.0 : (1.0 + aSeed * 2.5) * uPR * (9.0 / -mv.z);
    vA = 0.25 + 0.35 * sin(uTime * 0.8 + aSeed * 50.0);
  }
`;
const dustFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, pow(1.0 - d * 2.0, 2.0) * vA);
  }
`;

/* =========================================================
   Scene
   ========================================================= */
export class ParticleScene {
  constructor(canvas, { reduce = false } = {}) {
    this.canvas = canvas;
    this.reduce = reduce;
    this.small = window.innerWidth < 860;
    this.N = this.small ? 11000 : 24000;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.pr = Math.min(window.devicePixelRatio || 1, this.small ? 1.5 : 1.75);
    this.renderer.setPixelRatio(this.pr);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, 9);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // shapes (built lazily, cached)
    this.cache = {};
    this.current = 'chaos';

    const geo = new THREE.BufferGeometry();
    const start = this.shape('chaos');
    this.pos = new Float32Array(start);
    this.tgt = new Float32Array(start);
    const rand = new Float32Array(this.N * 4);
    for (let i = 0; i < rand.length; i++) rand[i] = rnd();
    this.rand = rand;
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aTarget', new THREE.BufferAttribute(this.tgt, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);

    this.colorCache = {};
    this.colorA = new THREE.Color('#7cf7d4');
    this.colorB = new THREE.Color('#8b7cff');

    this.uniforms = {
      uTime: { value: 0 },
      uMix: { value: 1 },
      uSize: { value: this.small ? 4.6 : 4.2 },
      uPR: { value: this.pr },
      uTurb: { value: 0.04 },
      uBurst: { value: 0 },
      uCharge: { value: 0 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uMouseForce: { value: 0 },
      uColorA: { value: this.colorA },
      uColorB: { value: this.colorB },
      uOpacity: { value: 0.95 },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.material);
    this.group.add(this.points);

    // background dust
    const DN = this.small ? 500 : 1200;
    const dpos = new Float32Array(DN * 3);
    const dseed = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = (rnd() * 2 - 1) * 16;
      dpos[i * 3 + 1] = (rnd() * 2 - 1) * 10;
      dpos[i * 3 + 2] = -4 - rnd() * 14;
      dseed[i] = rnd();
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    dgeo.setAttribute('aSeed', new THREE.BufferAttribute(dseed, 1));
    this.dustUniforms = { uTime: this.uniforms.uTime, uPR: this.uniforms.uPR, uColor: { value: new THREE.Color('#9fb3d9') } };
    this.dust = new THREE.Points(
      dgeo,
      new THREE.ShaderMaterial({
        vertexShader: dustVert,
        fragmentShader: dustFrag,
        uniforms: this.dustUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scene.add(this.dust);

    // motion state
    this.state = { shiftX: 0, shiftY: 0, scale: 1, spin: 0.07, opacity: 0.95 };
    this.mouse = { x: 99, y: 99, tx: 99, ty: 99, force: 0, last: 0, nx: 0, ny: 0 };
    this.velocity = 0;
    this.clock = new THREE.Clock();
    this.running = true;

    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', () => {
      this.running = !document.hidden;
      if (this.running) {
        this.clock.getDelta();
        requestAnimationFrame(this.tick);
      }
    });
    this.resize();
    requestAnimationFrame(this.tick);
  }

  shape(name) {
    if (!this.cache[name]) this.cache[name] = buildShape(name, this.N);
    return this.cache[name];
  }

  /* morph to a named shape, continuing smoothly from wherever we are */
  morph(name, { duration = 1.9, burst = 0.55, ease = 'power2.inOut' } = {}) {
    if (name === this.current) return;
    const next = this.shape(name);
    const m = this.uniforms.uMix.value;
    const { pos, tgt, rand, N } = this;
    for (let i = 0; i < N; i++) {
      let t = Math.min(Math.max(m * 1.5 - rand[i * 4 + 3] * 0.5, 0), 1);
      t = t * t * (3 - 2 * t);
      const j = i * 3;
      pos[j] += (tgt[j] - pos[j]) * t;
      pos[j + 1] += (tgt[j + 1] - pos[j + 1]) * t;
      pos[j + 2] += (tgt[j + 2] - pos[j + 2]) * t;
    }
    tgt.set(next);
    this.pairA = this.pairB = null;
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aTarget.needsUpdate = true;
    this.current = name;

    this.uniforms.uMix.value = 0;
    this.uniforms.uBurst.value = this.reduce ? 0 : burst;
    gsap.killTweensOf(this.uniforms.uMix);
    gsap.to(this.uniforms.uMix, { value: 1, duration: this.reduce ? 0.01 : duration, ease });
  }

  /* chapter config: colours, layout shift, opacity */
  /* chapter config: shape, colours, screen placement, opacity.
     px/py ∈ [-1, 1] — where the object sits (-1 left/bottom, 1 right/top) */
  setChapter({ shape, colors, px = 0, py = 0, scale = 1, dim = 1 }) {
    if (facesFront(shape) && !facesFront(this.current)) {
      // unwind continuous spin so the icon swings around the front
      const g = this.group;
      g.rotation.y = Math.atan2(Math.sin(g.rotation.y), Math.cos(g.rotation.y));
    }
    this.morph(shape);
    this.iconMode = facesFront(shape);
    const [a, b] = colors;
    const ca = new THREE.Color(a), cb = new THREE.Color(b);
    gsap.to(this.colorA, { r: ca.r, g: ca.g, b: ca.b, duration: 1.4, ease: 'power2.out' });
    gsap.to(this.colorB, { r: cb.r, g: cb.g, b: cb.b, duration: 1.4, ease: 'power2.out' });
    this.place = { px, py, scale, dim };
    this.layout(1.8);
  }

  layoutTarget(place = this.place || {}) {
    const narrow = window.innerWidth < 860;
    const { px = 0, py = 0, scale = 1, dim = 1 } = place;
    const halfH = Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    const halfW = halfH * this.camera.aspect;
    const offset = Math.abs(px) + Math.abs(py) > 0.01 ? 1 : 0;
    return narrow
      ? { shiftX: 0, shiftY: halfH * 0.36 * offset, scale: scale * (1 - 0.18 * offset), opacity: (0.95 - 0.35 * offset) * dim }
      : { shiftX: px * halfW * 0.5, shiftY: py * halfH * 0.42, scale, opacity: 0.95 * dim };
  }

  layout(duration = 0) {
    gsap.to(this.state, { ...this.layoutTarget(), duration, ease: 'power3.inOut', overwrite: 'auto' });
  }

  /* ---------- scroll-scrubbed story mode ----------
     The scroll position decides the pair of shapes and how far
     the particles have travelled between them (t ∈ [0, 1]). */
  scrubTo(a, b, t) {
    if (this.pairA !== a || this.pairB !== b) {
      gsap.killTweensOf(this.uniforms.uMix);
      this.pos.set(this.shape(a));
      this.tgt.set(this.shape(b));
      const g = this.points.geometry;
      g.attributes.position.needsUpdate = true;
      g.attributes.aTarget.needsUpdate = true;
      this.pairA = a;
      this.pairB = b;
    }
    this.uniforms.uMix.value = t;
    this.uniforms.uBurst.value = this.reduce ? 0 : 0.9;
    const dom = t < 0.5 ? a : b;
    if (dom !== this.current) {
      if (facesFront(dom) && !facesFront(this.current)) {
        const g = this.group;
        g.rotation.y = Math.atan2(Math.sin(g.rotation.y), Math.cos(g.rotation.y));
      }
      this.current = dom;
      this.iconMode = facesFront(dom);
    }
  }

  /* placement interpolated between two chapters, applied instantly */
  placeNow(place) {
    this.place = place;
    gsap.killTweensOf(this.state);
    Object.assign(this.state, this.layoutTarget(place));
  }

  colorsNow([a1, b1], [a2, b2], t) {
    const c = (hex) => (this.colorCache[hex] ||= new THREE.Color(hex));
    gsap.killTweensOf(this.colorA);
    gsap.killTweensOf(this.colorB);
    this.colorA.copy(c(a1)).lerp(c(a2), t);
    this.colorB.copy(c(b1)).lerp(c(b2), t);
  }

  charge(p) {
    this.uniforms.uCharge.value = p;
    this.uniforms.uTurb.value = 0.04 + p * 0.3;
  }

  ignite(shape = 'sphere') {
    gsap.to(this.uniforms.uCharge, { value: 0, duration: 1.2, ease: 'expo.out' });
    gsap.to(this.uniforms.uTurb, { value: 0.04, duration: 2, ease: 'power2.out' });
    this.morph(shape, { duration: 2.6, burst: 2.4, ease: 'expo.out' });
  }

  setPointer(clientX, clientY) {
    const nx = (clientX / window.innerWidth) * 2 - 1;
    const ny = -(clientY / window.innerHeight) * 2 + 1;
    const h = Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    this.mouse.tx = nx * h * this.camera.aspect;
    this.mouse.ty = ny * h;
    this.mouse.nx = nx;
    this.mouse.ny = ny;
    this.mouse.last = performance.now();
  }

  setVelocity(v) {
    this.velocity = v;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep shapes framed on portrait screens
    const a = this.camera.aspect;
    this.baseScale = a < 1 ? 0.58 + a * 0.32 : 1;
    this.camera.updateProjectionMatrix();
    this.layout(0);
  }

  tick() {
    if (!this.running) return;
    this.step(Math.min(this.clock.getDelta(), 0.05));
    requestAnimationFrame(this.tick);
  }

  step(dt) {
    const u = this.uniforms;
    u.uTime.value += dt * (this.reduce ? 0.25 : 1);

    // pointer easing + force decay
    const m = this.mouse;
    const active = performance.now() - m.last < 1400;
    m.x += (m.tx - m.x) * 0.12;
    m.y += (m.ty - m.y) * 0.12;
    m.force += ((active && !this.reduce ? 1 : 0) - m.force) * 0.05;
    u.uMouse.value.set(m.x, m.y);
    u.uMouseForce.value = m.force;

    // scroll velocity feeds turbulence + spin
    const v = Math.min(Math.abs(this.velocity), 3);
    this.velocity *= 0.92;
    const spin = this.reduce ? 0.02 : this.state.spin + v * 0.5;

    const g = this.group;
    if (this.iconMode) {
      // icons swing gently around the front instead of spinning edge-on
      const target = Math.sin(u.uTime.value * 0.45) * 0.55 + v * 0.3;
      g.rotation.y += (target - g.rotation.y) * 0.03;
    } else {
      g.rotation.y += dt * spin;
    }
    g.rotation.x += ((this.reduce ? 0 : m.ny * 0.18) - g.rotation.x) * 0.04;
    g.rotation.z += ((this.reduce ? 0 : -m.nx * 0.08) - g.rotation.z) * 0.04;
    g.position.x = this.state.shiftX;
    g.position.y = this.state.shiftY;
    const s = this.baseScale * this.state.scale;
    g.scale.setScalar(s);
    u.uOpacity.value = this.state.opacity;
    u.uTurb.value += (0.04 + v * 0.06 - u.uTurb.value) * (u.uCharge.value > 0 ? 0 : 0.08);

    this.dust.rotation.y += dt * 0.01;

    this.renderer.render(this.scene, this.camera);
  }
}
