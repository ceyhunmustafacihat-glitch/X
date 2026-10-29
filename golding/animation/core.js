'use strict';
// Core helpers: math, easing, deterministic noise, colour, layers, paper,
// and the hand-drawn ink toolkit every illustration is built from.

const W = 1080, H = 1920;
const TAU = Math.PI * 2;
const TL = window.TIMELINE;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const sstep = t => t * t * (3 - 2 * t);
const ss = (a, b, x) => sstep(inv(a, b, x));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const win = (a, b, c, d, x) => ss(a, b, x) * (1 - ss(c, d, x));
// overshooting "pop" used for things that spring into the frame
function backOut(t, k = 1.9) { t = clamp(t); return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); }
const pop = (t0, x, d = 0.45) => (x <= t0 ? 0 : backOut((x - t0) / d));
// damped bounce for things that drop in
function bounce(t0, x, d = 0.7) {
  if (x <= t0) return 0;
  const u = (x - t0) / d;
  if (u >= 1) return 1;
  return 1 - Math.cos(u * Math.PI * 2.5) * Math.exp(-u * 5.5) * (1 - u);
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash1(i), hash1(i + 1), u) * 2 - 1;
}

// ---------- colour ----------
const _hexCache = {};
function hex(h) {
  if (Array.isArray(h)) return h;
  if (_hexCache[h]) return _hexCache[h];
  const s = h.replace('#', '');
  return (_hexCache[h] = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]);
}
function mixc(a, b, t) { a = hex(a); b = hex(b); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgb(c, a = 1) { c = hex(c); return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
function col(a, b, t, alpha = 1) { return rgb(mixc(a, b, t), alpha); }
function shade(c, k) { c = hex(c); return [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)]; }

const C = {
  paper: '#f3e7cd', paper2: '#e9d9b6', card: '#f7eed8', ink: '#1e2a22',
  navy: '#2e4057', navyD: '#1f2c3d', teal: '#2f6b4a', sea: '#3f7c6a', seaD: '#2a5a4a', sky: '#dbe5cd',
  forest: '#1f4f35', forestD: '#173d29', forestL: '#2c6345', goldL: '#e9cf98', goldM: '#d6b47f', goldD: '#c39f69',
  mustard: '#e5a93c', gold: '#f2c14e', coral: '#d9633d', red: '#b9412f', pink: '#f0a1a0',
  sage: '#9cb486', grass: '#7f9f58', grassD: '#5f7f43', brown: '#7b4f2e', wood: '#a8713f',
  grey: '#8b9096', stone: '#b3ada0', night: '#1d2742', purple: '#6f4a8e', green: '#4f7f4b',
  skin: '#f2c8a2', skin2: '#e3ad86', white: '#fbf6ea', cream: '#f7ecd3'
};

// ---------- canvases & layers ----------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
const Layers = {};
function layer(name, w = W, h = H) {
  let L = Layers[name];
  if (!L || L.c.width !== Math.round(w) || L.c.height !== Math.round(h)) {
    const c = makeCanvas(w, h);
    L = Layers[name] = { c, g: c.getContext('2d') };
  }
  L.g.setTransform(1, 0, 0, 1, 0, 0);
  L.g.globalAlpha = 1; L.g.globalCompositeOperation = 'source-over'; L.g.filter = 'none';
  L.g.clearRect(0, 0, L.c.width, L.c.height);
  return L;
}

const Sprites = {};
function glowSprite(color, size = 128) {
  const key = 'glow' + hex(color).join(',') + size;
  if (Sprites[key]) return Sprites[key];
  const c = makeCanvas(size, size), g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const cc = hex(color);
  gr.addColorStop(0, rgb(cc, 1)); gr.addColorStop(0.3, rgb(cc, 0.45)); gr.addColorStop(0.65, rgb(cc, 0.1)); gr.addColorStop(1, rgb(cc, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return (Sprites[key] = c);
}
function drawGlow(g, x, y, r, color, alpha = 1) {
  if (alpha <= 0.002 || r <= 0.1) return;
  const a0 = g.globalAlpha;
  g.globalAlpha = a0 * Math.min(1, alpha);
  g.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  g.globalAlpha = a0;
}

// Static paper: soft blotches, fibres and speckles, multiplied over every frame.
let PAPER = null;
function buildPaper() {
  const c = makeCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const rnd = mulberry32(11);
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W, y = rnd() * H, r = 80 + rnd() * 260;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.025 + rnd() * 0.05;
    gr.addColorStop(0, `rgba(170,140,95,${a})`); gr.addColorStop(1, 'rgba(170,140,95,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 1600; i++) {
    const x = rnd() * W, y = rnd() * H, a = rnd() * TAU, l = 4 + rnd() * 18;
    g.strokeStyle = `rgba(120,95,60,${0.05 + rnd() * 0.08})`; g.lineWidth = 0.6 + rnd() * 0.8;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + rnd() * 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 16;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
  }
  g.putImageData(img, 0, 0);
  PAPER = c;
}

// ---------- hand-drawn ink toolkit ----------
// Lines "boil" a little (re-jittered 8 times a second), like hand-drawn animation.
let BOIL = 0;
const jit = (seed, k) => hash1(seed * 31.7 + k * 7.13 + BOIL * 3.71) * 2 - 1;
const INKW = 5;

// closed polygon whose edges bow slightly, as if drawn freehand
function wpoly(pts, amp = 1.6, seed = 1, closed = true) {
  const p = new Path2D(), n = pts.length;
  const J = pts.map((q, i) => [q[0] + jit(seed, i) * amp, q[1] + jit(seed, i + 50) * amp]);
  p.moveTo(J[0][0], J[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = J[i], b = J[(i + 1) % n];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const bow = jit(seed, i + 100) * Math.min(amp * 1.5, L * 0.03);
    p.quadraticCurveTo(mx - dy / L * bow, my + dx / L * bow, b[0], b[1]);
  }
  if (closed) p.closePath();
  return p;
}
// smooth closed curve through points (Catmull-Rom)
function curve(path, pts, closed = false, tension = 0.5) {
  const n = pts.length;
  if (n < 2) return path;
  const P = i => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  path.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const k = tension / 3;
    path.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k,
      p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  if (closed) path.closePath();
  return path;
}
function wcurve(pts, amp = 1.4, seed = 1, closed = true) {
  return curve(new Path2D(), pts.map((q, i) => [q[0] + jit(seed, i) * amp, q[1] + jit(seed, i + 50) * amp]), closed);
}
function wellipse(cx, cy, rx, ry, amp = 1.3, seed = 1, n = 14, rotA = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, r = 1 + jit(seed, i) * amp / Math.max(rx, ry);
    const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    pts.push([cx + x * Math.cos(rotA) - y * Math.sin(rotA), cy + x * Math.sin(rotA) + y * Math.cos(rotA)]);
  }
  return curve(new Path2D(), pts, true);
}
function wrect(x, y, w, h, amp = 1.5, seed = 1) { return wpoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], amp, seed); }
function wround(x, y, w, h, r, amp = 1.2, seed = 1) {
  const pts = [], k = 4;
  const cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= k; i++) { const a = a0 + i / k * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return wpoly(pts, amp, seed);
}

// fill with flat colour then outline in ink
function ink(g, path, fill, lw = INKW, stroke = C.ink) {
  if (fill) { g.fillStyle = typeof fill === 'string' ? fill : rgb(fill); g.fill(path); }
  if (lw > 0) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(path); }
}
// shading inside a shape: a darker crescent offset from the light
// (the part of the shape not covered by a copy shifted by dx, dy gets darkened)
function inkShade(g, path, dx, dy, a = 0.16, colr = '#3b2a1f') {
  g.save(); g.clip(path);
  g.translate(dx, dy);
  const p = new Path2D(); p.rect(-5000, -5000, 10000, 10000); p.addPath(path);
  g.fillStyle = rgb(colr, a);
  g.fill(p, 'evenodd');
  g.restore();
}
// thick limb / pipe: ink outline then colour core
function limb(g, pts, colr, w, lw = INKW, seed = 3) {
  const p = new Path2D();
  const J = pts.map((q, i) => [q[0] + jit(seed, i) * 0.8, q[1] + jit(seed, i + 9) * 0.8]);
  p.moveTo(J[0][0], J[0][1]);
  for (let i = 1; i < J.length; i++) p.lineTo(J[i][0], J[i][1]);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = C.ink; g.lineWidth = w + lw * 2; g.stroke(p);
  g.strokeStyle = typeof colr === 'string' ? colr : rgb(colr); g.lineWidth = w; g.stroke(p);
}
function wline(g, pts, w = INKW, colr = C.ink, seed = 5, smooth = false) {
  const J = pts.map((q, i) => [q[0] + jit(seed, i) * 1.0, q[1] + jit(seed, i + 9) * 1.0]);
  const p = smooth ? curve(new Path2D(), J, false) : (() => { const q = new Path2D(); q.moveTo(J[0][0], J[0][1]); for (let i = 1; i < J.length; i++) q.lineTo(J[i][0], J[i][1]); return q; })();
  g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.strokeStyle = colr; g.stroke(p);
}

// five-point star / sparkle shapes
function starPath(cx, cy, r1, r2, n = 5, a0 = -Math.PI / 2) {
  const p = new Path2D();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1, a = a0 + i * Math.PI / n;
    i ? p.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : p.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  p.closePath();
  return p;
}
function sparkle(g, x, y, r, a = 1, colr = C.gold) {
  if (a <= 0 || r <= 0) return;
  g.save(); g.globalAlpha *= a;
  const p = new Path2D();
  p.moveTo(x, y - r); p.quadraticCurveTo(x, y, x + r, y); p.quadraticCurveTo(x, y, x, y + r); p.quadraticCurveTo(x, y, x - r, y); p.quadraticCurveTo(x, y, x, y - r);
  ink(g, p, colr, 3);
  g.restore();
}
function heart(g, x, y, s, colr = C.coral, a = 1) {
  if (a <= 0 || s <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  const p = new Path2D();
  p.moveTo(0, 12); p.bezierCurveTo(-30, -8, -14, -30, 0, -14); p.bezierCurveTo(14, -30, 30, -8, 0, 12); p.closePath();
  ink(g, p, colr, 4 / s);
  g.restore();
}

// text helpers
function text(g, str, x, y, font, colr = C.ink, align = 'center', spacing = 0) {
  g.font = font; g.fillStyle = colr; g.textAlign = align; g.textBaseline = 'middle';
  g.letterSpacing = spacing + 'px';
  g.fillText(str, x, y);
  g.letterSpacing = '0px';
}
// transform helpers
function at(g, x, y, s = 1, r = 0, fn) { g.save(); g.translate(x, y); if (r) g.rotate(r); if (s !== 1) g.scale(s, s); fn(); g.restore(); }
function alpha(g, a, fn) { if (a <= 0.001) return; g.save(); g.globalAlpha *= clamp(a); fn(); g.restore(); }
