'use strict';
// Core helpers: math, easing, deterministic noise, colour, sprites, layers.

const W = 1080, H = 1920;
const TAU = Math.PI * 2;
const TL = window.TIMELINE;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const sstep = t => t * t * (3 - 2 * t);
const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);
const ss = (a, b, x) => sstep(inv(a, b, x));
const sm = (a, b, x) => smoother(inv(a, b, x));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const expOut = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const win = (a, b, c, d, x) => ss(a, b, x) * (1 - ss(c, d, x));

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
// smooth fractal noise, roughly in [-1, 1]
function fbm(x, seed = 0) { return noise1(x + seed * 17.3) * 0.65 + noise1(x * 2.1 + seed * 5.1 + 3.7) * 0.35; }

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
function shade(c, k) { c = hex(c); return [c[0] * k, c[1] * k, c[2] * k]; }

const GOLD = '#d9b26a', GOLD_HI = '#f6deA0', GOLD_DEEP = '#a8792f', CREAM = '#f5ecd9';

// ---------- canvases & sprites ----------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

const Sprites = {};
function glowSprite(color, size = 128, hard = 0.0) {
  const key = 'glow' + hex(color).join(',') + size + hard;
  if (Sprites[key]) return Sprites[key];
  const c = makeCanvas(size, size), g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const cc = hex(color);
  gr.addColorStop(0, rgb(cc, 1));
  gr.addColorStop(clamp(0.08 + hard), rgb(cc, 0.75));
  gr.addColorStop(0.35, rgb(cc, 0.22));
  gr.addColorStop(0.7, rgb(cc, 0.05));
  gr.addColorStop(1, rgb(cc, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return (Sprites[key] = c);
}
function drawGlow(ctx, x, y, r, color, alpha = 1) {
  if (alpha <= 0.002 || r <= 0.1) return;
  const s = glowSprite(color);
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * Math.min(1, alpha);
  ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = a0;
}

// glowing glyph sprite (letters that float out of the phone)
function glyphSprite(ch, font, px) {
  const key = 'g' + ch + font + px;
  if (Sprites[key]) return Sprites[key];
  const pad = px * 0.9, size = px * 1.4 + pad * 2;
  const c = makeCanvas(size, size), g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${font} ${px}px "Cormorant Garamond", serif`;
  g.shadowColor = 'rgba(246,206,120,0.95)';
  g.shadowBlur = px * 0.45;
  g.fillStyle = '#ffe9b8';
  g.fillText(ch, size / 2, size / 2);
  g.shadowBlur = px * 0.12;
  g.fillStyle = '#fff6e0';
  g.fillText(ch, size / 2, size / 2);
  return (Sprites[key] = c);
}

// film grain tiles (deterministic)
const GrainTiles = [];
function buildGrain() {
  const rnd = mulberry32(99);
  for (let k = 0; k < 6; k++) {
    const c = makeCanvas(384, 384), g = c.getContext('2d');
    const img = g.createImageData(384, 384);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 110;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    GrainTiles.push(c);
  }
}

// reusable full-frame layers
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

// ---------- path helpers ----------
// Smooth closed/open curve through points (Catmull-Rom -> Bezier).
function curve(path, pts, closed = false, tension = 0.5) {
  const n = pts.length;
  if (n < 2) return path;
  const P = i => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  path.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const k = tension / 3 * 2;
    path.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) * k / 2, p1[1] + (p2[1] - p0[1]) * k / 2,
      p2[0] - (p3[0] - p1[0]) * k / 2, p2[1] - (p3[1] - p1[1]) * k / 2,
      p2[0], p2[1]);
  }
  if (closed) path.closePath();
  return path;
}
function curvePath(pts, closed = true, tension = 0.5) { return curve(new Path2D(), pts, closed, tension); }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
function rrPath(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }

function lerpPts(a, b, t) { return a.map((p, i) => [lerp(p[0], b[i][0], t), lerp(p[1], b[i][1], t)]); }
function rot(x, y, a) { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
// direction for limb angles: 0 = straight down, +PI/2 = forward (+x)
function dir(a) { return [Math.sin(a), Math.cos(a)]; }

function withClip(ctx, path, fn) { ctx.save(); ctx.clip(path); fn(); ctx.restore(); }

// make every key carry all fields, inheriting missing ones from the previous key
function fillKeys(keys, base) {
  let prev = base;
  return keys.map(k => (prev = Object.assign({}, prev, k)));
}
// interpolate keyed objects with smootherstep between keys
function keyed(keys, t) {
  if (t <= keys[0].t) return Object.assign({}, keys[0]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const e = (b.ease || smoother)((t - a.t) / (b.t - a.t));
      const o = {};
      for (const k in a) if (typeof a[k] === 'number') o[k] = lerp(a[k], b[k] !== undefined ? b[k] : a[k], e);
      for (const k in b) if (o[k] === undefined && typeof b[k] === 'number') o[k] = b[k];
      return o;
    }
  }
  return Object.assign({}, keys[keys.length - 1]);
}

// text with letter spacing (canvas letterSpacing is supported in Chromium)
function spacedText(ctx, str, x, y, spacing) {
  ctx.letterSpacing = spacing + 'px';
  ctx.fillText(str, x, y);
  ctx.letterSpacing = '0px';
}
