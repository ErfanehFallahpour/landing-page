/* =========================================================
   Backdrop — themed 2D scenes behind the particle layer.
   Each chapter picks a scene; scenes crossfade.
   Rule: scenes never touch ctx.globalAlpha (the layer fade owns it).
   ========================================================= */
const TAU = Math.PI * 2;
const rnd = Math.random;
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* Lucide-style 24×24 icon paths (ISC licence) */
export const ICON_PATHS = {
  cart: 'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12 M9 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0 M20 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0',
  bag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0',
  tag: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z M8 7.5a.5.5 0 1 1-1 0a.5.5 0 1 1 1 0',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  box: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5 M12 22V12',
  card: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M2 10h20',
};
const P2D = {};
const icon = (name) => (P2D[name] ||= new Path2D(ICON_PATHS[name]));

function drawIcon(ctx, name, x, y, size, rot, stroke, px = 1.3) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.translate(-12, -12);
  ctx.lineWidth = px / s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke;
  ctx.stroke(icon(name));
  ctx.restore();
}

/* ---------------------------------------------------------
   00 — CODE : scrolling editor of abstract code tokens
   --------------------------------------------------------- */
function codeScene() {
  let buf, bh = 0, off = 0, W = 0;
  return {
    resize(w, h, dpr) {
      W = w;
      bh = Math.ceil(h / 26) * 26 + 26 * 6;
      buf = document.createElement('canvas');
      buf.width = Math.ceil(w * dpr);
      buf.height = Math.ceil(bh * dpr);
      const c = buf.getContext('2d');
      c.scale(dpr, dpr);
      const x0 = Math.max(48, w * 0.05);
      const maxW = Math.min(w * 0.62, 820);
      let indent = 0;
      c.font = '10px "JetBrains Mono", monospace';
      for (let i = 0, y = 14; y < bh; i++, y += 26) {
        c.fillStyle = 'rgba(238,240,246,0.07)';
        c.fillText(String(i + 1).padStart(3, '0'), x0 - 36, y + 7);
        if (hash(i * 3.1) < 0.12) continue; // blank line
        indent = Math.max(0, Math.min(4, indent + (hash(i) < 0.3 ? 1 : hash(i) > 0.75 ? -1 : 0)));
        let x = x0 + indent * 26;
        const tokens = 1 + Math.floor(hash(i * 7.7) * 5);
        for (let k = 0; k < tokens && x < x0 + maxW; k++) {
          const tw = 18 + hash(i * 13 + k) * 110;
          const r = hash(i * 5 + k * 3);
          c.fillStyle = r > 0.86 ? 'rgba(124,247,212,0.2)' : r > 0.74 ? 'rgba(139,124,255,0.18)' : 'rgba(238,240,246,0.075)';
          c.beginPath();
          c.roundRect(x, y, tw, 7, 3.5);
          c.fill();
          x += tw + 10;
        }
      }
    },
    draw(ctx, t, dt, w, h) {
      off = (off + dt * 16) % bh;
      ctx.drawImage(buf, 0, -off, W, bh);
      ctx.drawImage(buf, 0, bh - off, W, bh);
    },
  };
}

/* ---------------------------------------------------------
   02.1 — CANDLES : live candlestick chart
   --------------------------------------------------------- */
function candlesScene() {
  const CW = 14, GAP = 9, STEP = CW + GAP;
  let candles = [], price = 100, off = 0, mn = 80, mx = 120, shifted = 0;
  const push = () => {
    const o = price;
    const c = o + (rnd() - 0.47) * 5.5;
    candles.push({ o, c, hi: Math.max(o, c) + rnd() * 2.6, lo: Math.min(o, c) - rnd() * 2.6, v: 0.2 + rnd() * 0.8 });
    price = c;
  };
  return {
    resize(w) {
      const need = Math.ceil(w / STEP) + 4;
      while (candles.length < need) push();
    },
    draw(ctx, t, dt, w, h) {
      off += dt * 22;
      while (off >= STEP) { off -= STEP; candles.shift(); push(); shifted++; }

      let lo = Infinity, hi = -Infinity;
      for (const c of candles) { lo = Math.min(lo, c.lo); hi = Math.max(hi, c.hi); }
      mn += (lo - mn) * 0.04; mx += (hi - mx) * 0.04;
      const top = h * 0.16, bot = h * 0.74;
      const Y = (v) => bot - ((v - mn) / Math.max(1, mx - mn)) * (bot - top);

      // grid
      ctx.strokeStyle = 'rgba(238,240,246,0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) { const y = top + ((bot - top) / 8) * i; ctx.moveTo(0, y); ctx.lineTo(w, y); }
      for (let x = -off - (shifted % 6) * STEP; x < w; x += STEP * 6) { ctx.moveTo(x, top - 30); ctx.lineTo(x, h * 0.95); }
      ctx.stroke();

      // candles + volume
      candles.forEach((c, i) => {
        const x = i * STEP - off;
        const up = c.c >= c.o;
        const col = up ? '62,230,165' : '255,92,122';
        const cx = x + CW / 2;
        ctx.strokeStyle = `rgba(${col},0.45)`;
        ctx.beginPath(); ctx.moveTo(cx, Y(c.hi)); ctx.lineTo(cx, Y(c.lo)); ctx.stroke();
        const y1 = Y(Math.max(c.o, c.c)), y2 = Y(Math.min(c.o, c.c));
        ctx.fillStyle = `rgba(${col},${up ? 0.34 : 0.3})`;
        ctx.fillRect(x, y1, CW, Math.max(1.5, y2 - y1));
        ctx.fillStyle = `rgba(${col},0.1)`;
        const vh = c.v * h * 0.08;
        ctx.fillRect(x, h * 0.94 - vh, CW, vh);
      });

      // moving average
      ctx.strokeStyle = 'rgba(124,247,212,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      candles.forEach((c, i) => {
        if (i < 6) return;
        let s = 0; for (let k = 0; k < 7; k++) s += candles[i - k].c;
        const x = i * STEP - off + CW / 2, y = Y(s / 7);
        i === 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // last price line + tag
      const last = candles[candles.length - 1];
      const ly = Y(last.c);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(124,247,212,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(w, ly); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(124,247,212,0.85)';
      ctx.beginPath(); ctx.roundRect(w - 84, ly - 11, 72, 22, 4); ctx.fill();
      ctx.fillStyle = '#05060a';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText((last.c * 612.4).toFixed(1), w - 78, ly + 4);
    },
  };
}

/* ---------------------------------------------------------
   02.2 — STORE : endless wall of marketplace product cards
   --------------------------------------------------------- */
function storeScene() {
  const CW = 168, CH = 228, G = 24;
  const ICONS = ['bag', 'box', 'heart', 'tag', 'card'];
  let cols = [];
  return {
    resize(w) {
      const n = Math.ceil(w / (CW + G)) + 1;
      cols = Array.from({ length: n }, (_, i) => ({ x: i * (CW + G) - 20, off: hash(i) * (CH + G), sp: 12 + (i % 3) * 8, seed: i * 31 }));
    },
    draw(ctx, t, dt, w, h) {
      const step = CH + G;
      for (const col of cols) {
        col.off += dt * col.sp;
        const base = Math.floor(col.off / step);
        const rows = Math.ceil(h / step) + 2;
        for (let r = -1; r < rows; r++) {
          const y = r * step - (col.off % step);
          card(ctx, col.x, y, col.seed + base + r, t);
        }
      }
    },
  };
  function card(ctx, x, y, id, t) {
    const hv = hash(id);
    ctx.fillStyle = 'rgba(169,156,255,0.03)';
    ctx.strokeStyle = 'rgba(169,156,255,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, CW, CH, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(169,156,255,0.05)';
    ctx.beginPath(); ctx.roundRect(x + 10, y + 10, CW - 20, CH * 0.5, 10); ctx.fill();
    drawIcon(ctx, ICONS[Math.floor(hv * ICONS.length)], x + CW / 2, y + 10 + CH * 0.25, 40, 0, 'rgba(210,200,255,0.3)', 1.4);
    ctx.fillStyle = 'rgba(238,240,246,0.08)';
    ctx.beginPath(); ctx.roundRect(x + 14, y + CH * 0.62, (CW - 28) * (0.55 + hv * 0.4), 7, 3.5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 14, y + CH * 0.62 + 15, (CW - 28) * 0.4, 7, 3.5); ctx.fill();
    for (let s = 0; s < 5; s++) {
      ctx.fillStyle = s < 3 + Math.round(hv * 2) ? 'rgba(255,198,107,0.35)' : 'rgba(238,240,246,0.08)';
      ctx.beginPath(); ctx.arc(x + 18 + s * 10, y + CH * 0.62 + 34, 2.5, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(169,156,255,0.13)';
    ctx.beginPath(); ctx.roundRect(x + 14, y + CH - 38, 62, 22, 11); ctx.fill();
    ctx.strokeStyle = 'rgba(255,122,217,0.35)';
    ctx.beginPath(); ctx.arc(x + CW - 30, y + CH - 27, 15, 0, TAU); ctx.stroke();
    drawIcon(ctx, 'cart', x + CW - 30, y + CH - 27, 16, 0, 'rgba(255,122,217,0.55)', 1.2);
    if (hv > 0.72) {
      const pulse = 0.22 + 0.1 * Math.sin(t * 3 + id);
      ctx.fillStyle = `rgba(255,122,217,${pulse})`;
      ctx.beginPath(); ctx.arc(x + CW - 22, y + 22, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText('%', x + CW - 26, y + 26);
    }
  }
}

/* ---------------------------------------------------------
   02.3 — SHOP : floating bags / tags / boxes + delivery route
   --------------------------------------------------------- */
function shopScene() {
  const NAMES = ['bag', 'tag', 'box', 'card', 'heart', 'cart'];
  let items = [], W = 0, H = 0;
  const spawn = (y) => {
    const s = 22 + Math.pow(rnd(), 2) * 80;
    return { x: rnd() * W, y: y ?? rnd() * H, s, rot: (rnd() - 0.5) * 0.8, vr: (rnd() - 0.5) * 0.3, sp: 8 + s * 0.35, n: NAMES[Math.floor(rnd() * NAMES.length)] };
  };
  return {
    resize(w, h) {
      W = w; H = h;
      items = Array.from({ length: Math.round((w * h) / 26000) }, () => spawn());
    },
    draw(ctx, t, dt, w, h) {
      // delivery route
      const p0 = [w * -0.05, h * 0.85], p1 = [w * 0.3, h * 0.2], p2 = [w * 0.7, h * 1.05], p3 = [w * 1.05, h * 0.25];
      ctx.setLineDash([2, 10]);
      ctx.lineDashOffset = -t * 30;
      ctx.strokeStyle = 'rgba(124,247,212,0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(...p0); ctx.bezierCurveTo(...p1, ...p2, ...p3); ctx.stroke();
      ctx.setLineDash([]);
      const u = (t * 0.06) % 1, iu = 1 - u;
      const bx = iu ** 3 * p0[0] + 3 * iu * iu * u * p1[0] + 3 * iu * u * u * p2[0] + u ** 3 * p3[0];
      const by = iu ** 3 * p0[1] + 3 * iu * iu * u * p1[1] + 3 * iu * u * u * p2[1] + u ** 3 * p3[1];
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, 40);
      g.addColorStop(0, 'rgba(124,247,212,0.55)'); g.addColorStop(1, 'rgba(124,247,212,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 40, 0, TAU); ctx.fill();
      drawIcon(ctx, 'box', bx, by, 22, 0, 'rgba(220,255,245,0.9)', 1.4);

      for (const it of items) {
        it.y -= it.sp * dt;
        it.rot += it.vr * dt;
        if (it.y < -it.s) Object.assign(it, spawn(h + it.s));
        const a = 0.07 + (it.s / 102) * 0.26;
        drawIcon(ctx, it.n, it.x, it.y, it.s, it.rot, `rgba(111,216,255,${a.toFixed(3)})`, 1.2 + it.s / 80);
      }
    },
  };
}

/* ---------------------------------------------------------
   02.4 — GOLD : warm light, gold price curve, sparkles
   --------------------------------------------------------- */
function goldScene() {
  let sparks = [];
  return {
    resize(w, h) {
      sparks = Array.from({ length: 70 }, () => ({ x: rnd() * w, y: rnd() * h, s: 3 + rnd() * 9, ph: rnd() * TAU, vy: 4 + rnd() * 10 }));
    },
    draw(ctx, t, dt, w, h) {
      const g = ctx.createRadialGradient(w * 0.78, h * 0.25, 0, w * 0.78, h * 0.25, Math.max(w, h) * 0.75);
      g.addColorStop(0, 'rgba(255,198,107,0.14)'); g.addColorStop(1, 'rgba(255,198,107,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,198,107,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 8; i++) { const y = (h / 8) * i; ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      const n = 140, pts = [];
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * w;
        const y = h * 0.7
          - (i / n) * h * 0.22
          + Math.sin(i * 0.09 + t * 0.35) * h * 0.035
          + Math.sin(i * 0.27 - t * 0.6) * h * 0.012
          + Math.sin(i * 0.035 + t * 0.12) * h * 0.05;
        pts.push([x, y]);
      }
      const area = ctx.createLinearGradient(0, h * 0.35, 0, h);
      area.addColorStop(0, 'rgba(255,198,107,0.2)'); area.addColorStop(1, 'rgba(255,198,107,0)');
      ctx.fillStyle = area;
      ctx.beginPath(); ctx.moveTo(0, h);
      pts.forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,198,107,0.6)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.stroke();
      const [lx, ly] = pts[pts.length - 1];
      const pr = 5 + Math.sin(t * 4) * 2;
      ctx.fillStyle = 'rgba(255,220,150,0.9)'; ctx.beginPath(); ctx.arc(lx - 3, ly, 3, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,150,0.4)'; ctx.beginPath(); ctx.arc(lx - 3, ly, pr + 4, 0, TAU); ctx.stroke();

      for (const s of sparks) {
        s.y += s.vy * dt;
        if (s.y > h + 10) { s.y = -10; s.x = rnd() * w; }
        const b = Math.max(0, Math.sin(t * 1.6 + s.ph));
        const L = s.s * b;
        if (L < 0.5) continue;
        ctx.strokeStyle = `rgba(255,220,150,${(b * 0.55).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y);
        ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L);
        ctx.stroke();
      }
    },
  };
}

/* ---------------------------------------------------------
   02.5 — LEGAL : drifting contracts, signatures, stamps
   --------------------------------------------------------- */
function legalScene() {
  let docs = [], W = 0, H = 0;
  const spawn = (y) => ({ x: rnd() * W, y: y ?? rnd() * H, s: 0.55 + rnd() * 0.75, rot: (rnd() - 0.5) * 0.5, vr: (rnd() - 0.5) * 0.06, sp: 6 + rnd() * 10, seed: rnd() * 100, stamp: rnd() > 0.55 });
  return {
    resize(w, h) {
      W = w; H = h;
      docs = Array.from({ length: Math.max(8, Math.round((w * h) / 90000)) }, () => spawn());
    },
    draw(ctx, t, dt, w, h) {
      for (const d of docs) {
        d.y -= d.sp * dt;
        d.rot += d.vr * dt;
        if (d.y < -200) Object.assign(d, spawn(h + 200));
        const a = 0.08 + d.s * 0.12;
        const dw = 120 * d.s, dh = 160 * d.s;
        ctx.save();
        ctx.translate(d.x + Math.sin(t * 0.3 + d.seed) * 12, d.y);
        ctx.rotate(d.rot);
        ctx.translate(-dw / 2, -dh / 2);
        ctx.fillStyle = `rgba(207,227,255,${(a * 0.18).toFixed(3)})`;
        ctx.strokeStyle = `rgba(207,227,255,${a.toFixed(3)})`;
        ctx.lineWidth = 1;
        const f = 16 * d.s;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(dw - f, 0); ctx.lineTo(dw, f); ctx.lineTo(dw, dh); ctx.lineTo(0, dh); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(dw - f, 0); ctx.lineTo(dw - f, f); ctx.lineTo(dw, f); ctx.stroke();
        ctx.fillStyle = `rgba(207,227,255,${(a * 0.7).toFixed(3)})`;
        for (let i = 0; i < 7; i++) {
          const lw = (dw - 24 * d.s) * (i === 0 ? 0.45 : 0.6 + hash(d.seed + i) * 0.4);
          ctx.fillRect(dw - 12 * d.s - lw, (20 + i * 13) * d.s, lw, 3 * d.s);
        }
        ctx.beginPath();
        const sy = dh - 22 * d.s;
        ctx.moveTo(14 * d.s, sy);
        ctx.bezierCurveTo(30 * d.s, sy - 18 * d.s, 36 * d.s, sy + 12 * d.s, 52 * d.s, sy - 6 * d.s);
        ctx.bezierCurveTo(60 * d.s, sy - 14 * d.s, 64 * d.s, sy + 4 * d.s, 76 * d.s, sy - 2 * d.s);
        ctx.stroke();
        if (d.stamp) {
          ctx.strokeStyle = `rgba(143,176,255,${(a * 1.6).toFixed(3)})`;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.arc(dw - 28 * d.s, dh - 30 * d.s, 16 * d.s, 0, TAU); ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(dw - 28 * d.s, dh - 30 * d.s, 11 * d.s, 0, TAU); ctx.stroke();
        }
        ctx.restore();
      }
    },
  };
}

/* ---------------------------------------------------------
   03 — NETWORK : nodes, links and travelling pulses
   --------------------------------------------------------- */
function networkScene() {
  let nodes = [], pulses = [];
  const R = 170;
  return {
    resize(w, h) {
      nodes = Array.from({ length: Math.round((w * h) / 22000) }, () => ({ x: rnd() * w, y: rnd() * h, vx: (rnd() - 0.5) * 14, vy: (rnd() - 0.5) * 14 }));
      pulses = Array.from({ length: 14 }, () => ({ a: Math.floor(rnd() * nodes.length), b: -1, u: 1 }));
    },
    draw(ctx, t, dt, w, h) {
      for (const n of nodes) {
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < R) {
            ctx.strokeStyle = `rgba(124,247,212,${((1 - d / R) * 0.16).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(124,247,212,0.4)';
      for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, TAU); ctx.fill(); }
      for (const p of pulses) {
        if (p.u >= 1 || p.b < 0) {
          if (p.b >= 0) p.a = p.b;
          const A = nodes[p.a];
          const near = nodes.map((n, k) => [k, Math.hypot(n.x - A.x, n.y - A.y)]).filter(([k, d]) => k !== p.a && d < R);
          if (!near.length) { p.a = Math.floor(rnd() * nodes.length); p.b = -1; continue; }
          p.b = near[Math.floor(rnd() * near.length)][0];
          p.u = 0;
        }
        p.u += dt * 1.4;
        const A = nodes[p.a], B = nodes[p.b];
        const x = A.x + (B.x - A.x) * p.u, y = A.y + (B.y - A.y) * p.u;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
        g.addColorStop(0, 'rgba(200,255,240,0.9)'); g.addColorStop(1, 'rgba(124,247,212,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
      }
    },
  };
}

/* ---------------------------------------------------------
   04 — BLUEPRINT : grid, rotating dashed orbits, ticks
   --------------------------------------------------------- */
function blueprintScene() {
  return {
    draw(ctx, t, dt, w, h) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(169,156,255,0.035)';
      ctx.beginPath();
      for (let x = (w / 2) % 32; x < w; x += 32) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = (h / 2) % 32; y < h; y += 32) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(169,156,255,0.08)';
      ctx.beginPath();
      for (let x = (w / 2) % 160; x < w; x += 160) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = (h / 2) % 160; y < h; y += 160) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
      const cx = w / 2, cy = h / 2;
      for (let i = 0; i < 5; i++) {
        const r = 110 + i * 95;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.05 * (i % 2 ? -1 : 1) * (1 + i * 0.3));
        ctx.setLineDash([2 + i * 3, 8 + i * 4]);
        ctx.strokeStyle = `rgba(169,156,255,${(0.16 - i * 0.02).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,122,217,0.6)';
        ctx.beginPath(); ctx.arc(r, 0, 2.5, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(169,156,255,0.18)';
      ctx.beginPath();
      const R = 110 + 4 * 95 + 18;
      for (let k = 0; k < 120; k++) {
        const a = (k / 120) * TAU + t * 0.02;
        const l = k % 10 === 0 ? 14 : 6;
        ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.lineTo(cx + Math.cos(a) * (R + l), cy + Math.sin(a) * (R + l));
      }
      ctx.stroke();
    },
  };
}

/* ---------------------------------------------------------
   05 — TUNNEL : expanding rings toward the viewer
   --------------------------------------------------------- */
function tunnelScene() {
  return {
    draw(ctx, t, dt, w, h) {
      const cx = w / 2, cy = h / 2, M = Math.hypot(w, h) * 0.62;
      for (let i = 0; i < 22; i++) {
        const p = (i / 22 + t * 0.07) % 1;
        const r = Math.pow(p, 2.2) * M;
        ctx.strokeStyle = `rgba(124,247,212,${(Math.sin(p * Math.PI) * 0.22).toFixed(3)})`;
        ctx.lineWidth = 0.5 + p * 1.5;
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.92, 0, 0, TAU); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(124,247,212,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 36; k++) {
        const a = (k / 36) * TAU + t * 0.03;
        ctx.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40);
        ctx.lineTo(cx + Math.cos(a) * M, cy + Math.sin(a) * M);
      }
      ctx.stroke();
    },
  };
}

const SCENES = {
  code: codeScene,
  candles: candlesScene,
  store: storeScene,
  shop: shopScene,
  gold: goldScene,
  legal: legalScene,
  network: networkScene,
  blueprint: blueprintScene,
  tunnel: tunnelScene,
};

export class Backdrop {
  constructor(canvas, { reduce = false } = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduce = reduce;
    this.cache = {};
    this.layers = [];
    this.name = null;
    this.t = 0;
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { this.last = performance.now(); requestAnimationFrame(this.loop); }
    });
    this.resize();
    requestAnimationFrame(this.loop);
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.c.width = Math.round(this.w * this.dpr);
    this.c.height = Math.round(this.h * this.dpr);
    Object.values(this.cache).forEach((s) => s.resize?.(this.w, this.h, this.dpr));
  }

  get(name) {
    if (!SCENES[name]) return null;
    if (!this.cache[name]) {
      const s = SCENES[name]();
      s.resize?.(this.w, this.h, this.dpr);
      this.cache[name] = s;
    }
    return this.cache[name];
  }

  set(name) {
    if (this.name === name) return;
    this.name = name;
    const s = this.get(name);
    for (const l of this.layers) {
      if (l.s === s) continue;
      gsap.killTweensOf(l);
      gsap.to(l, { a: 0, duration: 0.9, ease: 'power2.in', onComplete: () => (this.layers = this.layers.filter((x) => x !== l)) });
    }
    if (!s) return;
    let layer = this.layers.find((l) => l.s === s);
    if (!layer) { layer = { s, a: 0 }; this.layers.push(layer); }
    gsap.killTweensOf(layer);
    gsap.to(layer, { a: 1, duration: 1.6, delay: 0.2, ease: 'power2.out' });
  }

  loop(now) {
    if (document.hidden) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.render(dt);
    requestAnimationFrame(this.loop);
  }

  render(dt) {
    const step = this.reduce ? dt * 0.15 : dt;
    this.t += step;
    const { ctx, w, h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const l of this.layers) {
      if (l.a <= 0.002) continue;
      ctx.save();
      ctx.globalAlpha = l.a;
      l.s.draw(ctx, this.t, step, w, h);
      ctx.restore();
    }
  }
}
