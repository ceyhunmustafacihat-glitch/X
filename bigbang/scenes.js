// "Big Bang'in adı" — flat illustration explainer, 9:16, 60 s.
// Every frame is a pure function of t, so the renderer can draw frames in any order.
const TL = window.TIMELINE;
const W = 1080, H = 1920;

// ---------- palette & type ----------
const C = {
  bg: '#0a0f2c', bg2: '#121a45', ink: '#f5f3ee', mute: '#9aa3c7', faint: '#4a5590',
  orange: '#ff7a3d', gold: '#ffc857', cyan: '#4fc3f7', violet: '#8e7cff', red: '#ff4d5e', green: '#3ddc97',
  card: 'rgba(255,255,255,0.06)', line: 'rgba(255,255,255,0.14)',
};
const F = {
  head: (s, w = 800) => `${w} ${s}px Montserrat`,
  body: (s, w = 500) => `${w} ${s}px Inter`,
  quote: s => `italic 500 ${s}px "Cormorant Garamond"`,
};
// Layout grid: chip, illustration centre, headline, body. Nothing important below y = 1520 (Reels UI).
const M = 90, TW = W - 2 * M, CHIP_Y = 290, ILL_Y = 760, HEAD_Y = 1200, BODY_Y = 1290;

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eback = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// Eased reveal of an element that starts at `d` seconds into the scene.
const rev = (lt, d, dur = 0.6) => eo(prog(lt, d, d + dur));

let ctx;
function init(canvas) { ctx = canvas.getContext('2d'); }

// ---------- drawing helpers ----------
function rrect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function text(c, s, x, y, { font, color = C.ink, align = 'left', alpha = 1, ls = 0, base = 'alphabetic' } = {}) {
  c.save(); c.globalAlpha *= alpha; c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = base;
  c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.restore();
}
function glow(c, x, y, r, color, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalAlpha *= a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore();
}
function star(c, x, y, rOut, rIn, n, rot = 0) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, r = i % 2 ? rIn : rOut;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}
function galaxy(c, x, y, r, rot, color, a) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.globalAlpha *= a;
  const base = c.globalAlpha;
  c.fillStyle = color;
  c.globalAlpha = base * 0.22; c.beginPath(); c.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = base * 0.55; c.beginPath(); c.ellipse(0, 0, r * 0.62, r * 0.26, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = base * 0.9; c.strokeStyle = color; c.lineWidth = Math.max(1.5, r * 0.08); c.lineCap = 'round';
  c.beginPath(); c.ellipse(0, 0, r * 0.85, r * 0.36, 0, -0.2, 1.6); c.stroke();
  c.beginPath(); c.ellipse(0, 0, r * 0.85, r * 0.36, 0, Math.PI - 0.2, Math.PI + 1.6); c.stroke();
  c.globalAlpha = base; c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(0, 0, r * 0.16, 0, Math.PI * 2); c.fill();
  c.restore();
}

// Rich text: *words* are emphasised. Returns the drawn height.
function parseRich(s) {
  const words = []; let cur = [], em = false, buf = '';
  const flush = () => { if (buf) { cur.push({ t: buf, em }); buf = ''; } };
  for (const ch of s) {
    if (ch === '*') { flush(); em = !em; }
    else if (ch === ' ' || ch === '\n') { flush(); if (cur.length) words.push(cur); cur = []; if (ch === '\n') words.push('\n'); }
    else buf += ch;
  }
  flush(); if (cur.length) words.push(cur);
  return words;
}
function rich(c, s, x, y, o) {
  const { size = 38, lh = size * 1.38, maxW = TW, color = C.ink, em = C.orange, align = 'left', weight = 500,
    emWeight = 700, fontFn = F.body, emFontFn = fontFn, p = 1, chars = Infinity, stagger = 0.25 } = o;
  const fN = fontFn(size, weight), fE = emFontFn(size, emWeight);
  c.save(); c.textBaseline = 'alphabetic'; c.letterSpacing = '0px';
  const width = run => { c.font = run.em ? fE : fN; return c.measureText(run.t).width; };
  c.font = fN; const sp = c.measureText(' ').width;
  const lines = [[]]; let lw = 0;
  for (const w of parseRich(s)) {
    if (w === '\n') { lines.push([]); lw = 0; continue; }
    const ww = w.reduce((a, r) => a + width(r), 0);
    const line = lines[lines.length - 1];
    if (line.length && lw + sp + ww > maxW) { lines.push([{ w, ww }]); lw = ww; }
    else { lw += (line.length ? sp : 0) + ww; line.push({ w, ww }); }
  }
  let left = chars;
  const base = c.globalAlpha;
  lines.forEach((line, i) => {
    const n = lines.length, lp = eo(clamp(p * (1 + stagger * (n - 1)) - stagger * i));
    if (lp <= 0) return;
    const total = line.reduce((a, it) => a + it.ww, 0) + sp * Math.max(0, line.length - 1);
    let cx = align === 'center' ? x - total / 2 : x;
    const cy = y + i * lh + (1 - lp) * 26;
    c.globalAlpha = base * lp * (o.alpha ?? 1);
    for (const it of line) {
      for (const r of it.w) {
        if (left <= 0) break;
        const t = r.t.slice(0, Math.max(0, left)); left -= r.t.length;
        c.font = r.em ? fE : fN; c.fillStyle = r.em ? em : color; c.fillText(t, cx, cy);
        cx += c.measureText(r.t).width;
      }
      left -= 1; cx += sp;
    }
  });
  c.restore();
  return lines.length * lh;
}
function chip(c, label, lt, color = C.orange, d = 0.15) {
  const p = rev(lt, d, 0.55);
  if (p <= 0) return;
  c.save(); c.globalAlpha *= p;
  c.font = F.head(30, 700); c.letterSpacing = '4px';
  const w = c.measureText(label).width + 64, h = 64, x = M, y = CHIP_Y - h / 2 + (1 - p) * 20;
  rrect(c, x, y, w * lerp(0.6, 1, p), h, h / 2); c.fillStyle = 'rgba(255,255,255,0.04)'; c.fill();
  c.strokeStyle = color; c.lineWidth = 3; c.stroke();
  c.fillStyle = color; c.beginPath(); c.arc(x + 30, y + h / 2, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.ink; c.textBaseline = 'middle'; c.fillText(label, x + 48, y + h / 2 + 2);
  c.restore();
}
function headline(c, s, lt, d, y = HEAD_Y, size = 68, align = 'left') {
  const p = rev(lt, d, 0.65);
  if (p <= 0) return;
  text(c, s, align === 'center' ? W / 2 : M, y + (1 - p) * 30, { font: F.head(size, 800), alpha: p, align, ls: -0.5 });
  if (align === 'left') { c.save(); c.globalAlpha *= p; c.fillStyle = C.orange; c.fillRect(M, y + 24, 90 * p, 6); c.restore(); }
}
function body(c, s, lt, d, y = BODY_Y + 30, o = {}) {
  const p = prog(lt, d, d + 0.9);
  if (p <= 0) return 0;
  return rich(c, s, o.align === 'center' ? W / 2 : M, y, { size: 38, color: '#d6dbf0', p, ...o });
}

// ---------- background & chrome ----------
const STARS = (() => { const r = rng(7); return Array.from({ length: 240 }, () => ({ x: r() * W, y: r() * H, s: 0.6 + r() * 2.2, ph: r() * 6.28, sp: 0.5 + r() * 1.5 })); })();
function background(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#070b24'); g.addColorStop(0.55, C.bg); g.addColorStop(1, '#0d1438');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  glow(c, W * 0.85, H * 0.18, 700, 'rgba(142,124,255,0.18)', 1);
  glow(c, W * 0.1, H * 0.62, 760, 'rgba(79,195,247,0.10)', 1);
  c.fillStyle = '#ffffff';
  for (const s of STARS) {
    const y = (s.y - t * 6 * s.sp + H) % H;
    c.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * s.sp * 1.7 + s.ph));
    c.fillRect(s.x, y, s.s, s.s);
  }
  c.globalAlpha = 1;
}
function chrome(c, t) {
  const p = rev(t, 0.1, 0.8);
  c.save(); c.globalAlpha = p;
  text(c, 'BİLİM TARİHİ', M, 140, { font: F.head(26, 700), color: C.ink, ls: 5 });
  text(c, 'Bir ismin hikâyesi', W - M, 140, { font: F.body(26, 500), color: C.mute, align: 'right' });
  const n = TL.scenes.length, gap = 10, sw = (TW - gap * (n - 1)) / n;
  TL.scenes.forEach((s, i) => {
    const x = M + i * (sw + gap), f = prog(t, s.a, s.b);
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(x, 168, sw, 5);
    c.fillStyle = C.orange; c.fillRect(x, 168, sw * f, 5);
  });
  c.restore();
}

// ---------- scenes ----------
const BURST = (() => {
  const r = rng(42), cols = [C.orange, C.gold, C.cyan, C.violet, '#ffffff'];
  return Array.from({ length: 170 }, () => ({ a: r() * Math.PI * 2, v: 0.25 + r() * 0.75, s: 3 + r() * 9, c: cols[(r() * cols.length) | 0], spin: r() }));
})();
function burst(c, cx, cy, lt, t0, maxR) {
  const k = lt - t0;
  if (k < 0) {
    const p = prog(lt, t0 - 0.5, t0);
    glow(c, cx, cy, 30 + 40 * p, 'rgba(255,200,87,0.9)', p);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, 3 + 6 * p, 0, Math.PI * 2); c.fill();
    return;
  }
  const flash = Math.exp(-k * 3.5);
  glow(c, cx, cy, 120 + 500 * eo(clamp(k / 1.2)), 'rgba(255,200,87,0.85)', flash);
  c.save(); c.strokeStyle = C.gold; c.lineWidth = 6 * flash + 1; c.globalAlpha = flash;
  c.beginPath(); c.arc(cx, cy, maxR * eo(clamp(k / 1.4)), 0, Math.PI * 2); c.stroke(); c.restore();
  const e = eo(clamp(k / 2.6)) + k * 0.03;
  for (const p of BURST) {
    const r = maxR * p.v * e, x = cx + Math.cos(p.a) * r, y = cy + Math.sin(p.a) * r;
    c.globalAlpha = clamp(1.2 - k * 0.12) * 0.9; c.fillStyle = p.c;
    if (p.spin > 0.8) { star(c, x, y, p.s, p.s * 0.45, 4, k * 2 * p.spin); c.fill(); }
    else { c.beginPath(); c.arc(x, y, p.s * 0.5, 0, Math.PI * 2); c.fill(); }
  }
  c.globalAlpha = 1;
}
function bigBangTitle(c, x, y, p, size = 150) {
  if (p <= 0) return;
  const s = lerp(0.7, 1, eback(p));
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= clamp(p * 1.6);
  c.font = F.head(size, 900); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '6px';
  c.lineJoin = 'round'; c.lineWidth = 18; c.strokeStyle = C.bg; c.strokeText('BIG BANG', 0, 0);
  const g = c.createLinearGradient(-400, 0, 400, 0); g.addColorStop(0, C.gold); g.addColorStop(1, C.orange);
  c.fillStyle = g; c.fillText('BIG BANG', 0, 0);
  c.restore();
}

function sceneHook(c, lt) {
  chip(c, 'BİR İSİM HİKÂYESİ', lt, C.gold, 2.0);
  burst(c, W / 2, ILL_Y, lt, 0.6, 470);
  bigBangTitle(c, W / 2, ILL_Y, prog(lt, 0.9, 1.6));
  headline(c, 'Bu ismi kim koydu?', lt, 2.2);
  body(c, 'Cevap şaşırtıcı: teoriye *hiç inanmayan* bir bilim insanı.', lt, 3.1);
}

function sceneLemaitre(c, lt) {
  chip(c, '1927 – 1931', lt);
  // Expanding-universe cone, drawn left to right like a timeline.
  const x0 = 170, x1 = 960, cy = ILL_Y - 20, reach = lerp(x0, x1, eio(prog(lt, 0.5, 4.2)));
  const half = x => 14 + 300 * Math.pow((x - x0) / (x1 - x0), 0.75);
  c.save();
  c.beginPath(); c.moveTo(x0, cy);
  for (let x = x0; x <= reach; x += 6) c.lineTo(x, cy - half(x));
  for (let x = reach; x >= x0; x -= 6) c.lineTo(x, cy + half(x));
  c.closePath();
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, 'rgba(255,200,87,0.55)'); g.addColorStop(0.35, 'rgba(255,122,61,0.22)'); g.addColorStop(1, 'rgba(142,124,255,0.14)');
  c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,200,87,0.7)'; c.lineWidth = 3;
  c.beginPath(); for (let x = x0; x <= reach; x += 6) c.lineTo(x, cy - half(x)); c.stroke();
  c.beginPath(); for (let x = x0; x <= reach; x += 6) c.lineTo(x, cy + half(x)); c.stroke();
  c.restore();
  // Galaxies spread with the cone's width.
  const r = rng(11);
  for (let i = 0; i < 34; i++) {
    const fx = 0.12 + r() * 0.88, x = lerp(x0, x1, fx), v = (r() * 2 - 1) * 0.8;
    const a = clamp((reach - x) / 60);
    if (a > 0) galaxy(c, x, cy + v * half(x), 8 + fx * 18, r() * 3, [C.gold, C.cyan, C.violet, C.ink][i % 4], a);
  }
  // The primeval atom.
  const pa = rev(lt, 0.3, 0.6);
  glow(c, x0, cy, 70, 'rgba(255,200,87,0.9)', pa * (0.8 + 0.2 * Math.sin(lt * 4)));
  c.fillStyle = '#fff'; c.globalAlpha = pa; c.beginPath(); c.arc(x0, cy, 12, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  const la = rev(lt, 1.2);
  c.save(); c.globalAlpha = la; c.strokeStyle = C.gold; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(x0, cy + 26); c.lineTo(x0, cy + 150 - (1 - la) * 40); c.stroke(); c.restore();
  text(c, '“İlkel atom”', x0 - 20, cy + 196, { font: F.head(34, 700), color: C.gold, alpha: la });
  // Time axis.
  const ta = rev(lt, 2.0);
  c.save(); c.globalAlpha = ta; c.strokeStyle = C.mute; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x0, cy + 360); c.lineTo(lerp(x0, x1, ta), cy + 360); c.stroke();
  c.fillStyle = C.mute; c.beginPath(); const ax = lerp(x0, x1, ta);
  c.moveTo(ax + 4, cy + 360); c.lineTo(ax - 16, cy + 350); c.lineTo(ax - 16, cy + 370); c.fill(); c.restore();
  text(c, 'zaman', x1, cy + 404, { font: F.body(28, 500), color: C.mute, align: 'right', alpha: ta });
  headline(c, 'Georges Lemaître', lt, 0.8);
  body(c, 'Belçikalı fizikçi. Evrenin *genişlediğini* ve tek bir *“ilkel atom”*dan doğduğunu öne sürdü.', lt, 1.6);
}

function sceneSteady(c, lt) {
  chip(c, '1948', lt, C.cyan);
  const fx = W / 2, fy = ILL_Y - 10, hs = 310, a = rev(lt, 0.3, 0.7);
  c.save(); c.globalAlpha = a;
  rrect(c, fx - hs, fy - hs, hs * 2, hs * 2, 36); c.fillStyle = 'rgba(79,195,247,0.05)'; c.fill();
  c.setLineDash([14, 12]); c.strokeStyle = 'rgba(79,195,247,0.6)'; c.lineWidth = 3; c.stroke(); c.setLineDash([]);
  c.restore();
  text(c, 'Uzayın bir bölgesi', fx, fy - hs - 22, { font: F.body(28, 500), color: C.cyan, align: 'center', alpha: a });
  // Galaxies drift apart; new ones appear in the gaps, so the density stays the same.
  c.save(); rrect(c, fx - hs + 4, fy - hs + 4, hs * 2 - 8, hs * 2 - 8, 32); c.clip();
  const r = rng(5), Hk = 0.16;
  for (let i = 0; i < 110; i++) {
    const tb = -14 + r() * 26, ang = r() * Math.PI * 2, d0 = 30 + r() * 90, rot = r() * 3, sz = 13 + r() * 9;
    const age = lt - tb;
    if (age < 0) continue;
    const d = d0 * Math.exp(Hk * age);
    if (d > hs * 1.6) continue;
    const x = fx + Math.cos(ang) * d * 1.9, y = fy + Math.sin(ang) * d * 1.9;
    const fade = eo(clamp(age / 0.7));
    galaxy(c, x, y, sz, rot, i % 3 ? C.cyan : C.ink, fade * a);
    if (tb > 0.5 && age < 1.0) {
      const k = age / 1.0;
      c.save(); c.globalAlpha = (1 - k) * a; c.strokeStyle = C.gold; c.lineWidth = 3;
      c.beginPath(); c.arc(x, y, sz + 30 * k, 0, Math.PI * 2); c.stroke();
      c.fillStyle = C.gold; star(c, x, y, 10 * (1 - k) + 4, 3, 4, 0); c.fill(); c.restore();
    }
  }
  c.restore();
  // Legend.
  const la = rev(lt, 2.6);
  c.save(); c.globalAlpha = la; c.fillStyle = C.gold; star(c, fx - 150, fy + hs + 52, 13, 4, 4, 0); c.fill(); c.restore();
  text(c, '= sürekli oluşan yeni madde', fx - 124, fy + hs + 62, { font: F.body(28, 500), color: C.mute, alpha: la });
  headline(c, 'Durağan Durum Teorisi', lt, 0.9);
  body(c, 'Evrenin bir başlangıcı yok. Genişledikçe boşluklarda *sürekli yeni madde* oluşur.', lt, 1.7);
  // Name pills.
  const names = ['Fred Hoyle', 'Hermann Bondi', 'Thomas Gold'];
  c.save(); c.font = F.body(30, 600); let x = M;
  names.forEach((n, i) => {
    const p = rev(lt, 3.2 + i * 0.25), w = c.measureText(n).width + 48, y = 1440 + (1 - p) * 20;
    c.globalAlpha = p; rrect(c, x, y, w, 60, 30);
    c.fillStyle = i === 0 ? C.orange : 'rgba(255,255,255,0.08)'; c.fill();
    c.fillStyle = i === 0 ? '#1a0e05' : C.ink; c.textBaseline = 'middle'; c.fillText(n, x + 24, y + 31);
    x += w + 16;
  });
  c.restore();
}

function radio(c, x, y, s, lt) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const w = 540, h = 340;
  // Sound waves.
  for (let side = -1; side <= 1; side += 2)
    for (let k = 0; k < 3; k++) {
      const ph = (lt * 0.9 + k / 3) % 1;
      c.globalAlpha = (1 - ph) * 0.8; c.strokeStyle = C.gold; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.arc(side * (w / 2 - 40), 10, 120 + ph * 150, side > 0 ? -0.55 : Math.PI - 0.55, side > 0 ? 0.55 : Math.PI + 0.55); c.stroke();
    }
  c.globalAlpha = 1;
  // Antenna & handle.
  c.strokeStyle = '#c9cde3'; c.lineWidth = 6; c.beginPath(); c.moveTo(150, -h / 2); c.lineTo(230, -h / 2 - 150); c.stroke();
  c.fillStyle = '#c9cde3'; c.beginPath(); c.arc(230, -h / 2 - 150, 10, 0, Math.PI * 2); c.fill();
  // Body.
  rrect(c, -w / 2, -h / 2 + 14, w, h, 42); c.fillStyle = '#9a4a24'; c.fill();
  rrect(c, -w / 2, -h / 2, w, h, 42); c.fillStyle = '#d0703f'; c.fill();
  rrect(c, -w / 2 + 28, -h / 2 + 28, w - 56, h - 56, 26); c.fillStyle = '#f2e3c6'; c.fill();
  // Speaker grille.
  c.save(); c.beginPath(); c.arc(-100, 0, 108, 0, Math.PI * 2); c.fillStyle = '#3b2a22'; c.fill(); c.clip();
  c.fillStyle = '#5a4234'; for (let yy = -100; yy <= 100; yy += 22) c.fillRect(-210, yy, 220, 10);
  c.restore();
  // Dial.
  c.beginPath(); c.arc(130, -30, 70, 0, Math.PI * 2); c.fillStyle = '#fffaf0'; c.fill();
  c.strokeStyle = '#3b2a22'; c.lineWidth = 4; c.stroke();
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.8 + 1.4 * i / 10);
    c.beginPath(); c.moveTo(130 + Math.cos(a) * 52, -30 + Math.sin(a) * 52); c.lineTo(130 + Math.cos(a) * 62, -30 + Math.sin(a) * 62); c.stroke();
  }
  const na = Math.PI * (1.4 + 0.08 * Math.sin(lt * 1.3));
  c.strokeStyle = C.red; c.lineWidth = 5; c.beginPath(); c.moveTo(130, -30); c.lineTo(130 + Math.cos(na) * 56, -30 + Math.sin(na) * 56); c.stroke();
  // Knobs.
  for (const kx of [85, 175]) { c.beginPath(); c.arc(kx, 85, 22, 0, Math.PI * 2); c.fillStyle = '#3b2a22'; c.fill(); }
  // Feet.
  c.fillStyle = '#6e3418'; c.fillRect(-w / 2 + 50, h / 2 + 10, 40, 22); c.fillRect(w / 2 - 90, h / 2 + 10, 40, 22);
  c.restore();
}
function sceneRadio(c, lt) {
  chip(c, '28 MART 1949', lt);
  const phaseB = prog(lt, 4.8, 5.6);
  const ra = rev(lt, 0.3, 0.8), ry = lerp(ILL_Y, 600, eio(phaseB)), rs = lerp(1, 0.78, eio(phaseB));
  c.save(); c.globalAlpha = ra; radio(c, W / 2, ry + (1 - ra) * 40, rs, lt); c.restore();
  // ON AIR light.
  const oa = rev(lt, 1.0) * (0.55 + 0.45 * (Math.sin(lt * 5) > -0.2 ? 1 : 0.3));
  c.save(); c.globalAlpha = oa; c.font = F.head(28, 800); c.letterSpacing = '4px';
  const ow = c.measureText('YAYINDA').width + 70, oy = ry - 300 * rs;
  rrect(c, W / 2 - ow / 2, oy - 30, ow, 60, 30); c.fillStyle = C.red; c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(W / 2 - ow / 2 + 28, oy, 8, 0, Math.PI * 2); c.fill();
  c.textBaseline = 'middle'; c.fillText('YAYINDA', W / 2 - ow / 2 + 48, oy + 2); c.restore();
  text(c, 'BBC  ·  Third Programme  ·  18.30', W / 2, ry + 250 * rs, { font: F.body(30, 600), color: C.mute, align: 'center', alpha: rev(lt, 1.4) });

  // Phase A: who is speaking.
  c.save(); c.globalAlpha = 1 - phaseB;
  headline(c, 'Fred Hoyle, BBC radyosunda', lt, 0.9, HEAD_Y, 62);
  body(c, 'Durağan durum teorisinin savunucusu Hoyle, bir konuşmasında *rakip teoriyi* anlatıyordu.', lt, 1.8);
  c.restore();

  // Phase B: the quote.
  if (phaseB > 0) {
    const y0 = 980, cardH = 450;
    c.save(); c.globalAlpha = eo(phaseB);
    rrect(c, M - 10, y0 + (1 - eo(phaseB)) * 30, TW + 20, cardH, 28); c.fillStyle = C.card; c.fill();
    c.fillStyle = C.orange; c.fillRect(M - 10, y0 + 40, 8, cardH - 80);
    text(c, '“', M + 30, y0 + 120, { font: F.quote(160), color: C.orange });
    c.restore();
    const en = '…all the matter in the universe was created in one *big bang* at a particular time in the remote past.';
    const chars = Math.floor(prog(lt, 5.7, 9.2) * en.length);
    rich(c, en, M + 50, y0 + 110, { size: 50, lh: 60, maxW: TW - 90, fontFn: F.quote, emFontFn: s => `italic 700 ${s}px "Cormorant Garamond"`, color: C.ink, em: C.orange, p: 1, chars });
    const trP = prog(lt, 9.3, 10.1);
    if (trP > 0) rich(c, '“…evrendeki tüm madde, uzak geçmişte belirli bir anda tek bir *big bang* ile yaratıldı.”', M + 50, y0 + 310, { size: 30, lh: 42, maxW: TW - 90, color: C.mute, em: C.gold, p: trP });
    text(c, '— Fred Hoyle', M + 50, y0 + 410, { font: F.body(28, 600), color: C.ink, alpha: rev(lt, 10.0) });
  }
}

function sceneIntent(c, lt) {
  chip(c, 'ALAY MI, BENZETME Mİ?', lt, C.violet);
  // Speaker → waves → a picture forming in the listener's mind.
  const sy = ILL_Y - 20, a = rev(lt, 0.3);
  c.save(); c.globalAlpha = a; c.translate(220, sy);
  c.fillStyle = C.ink; c.fillRect(-60, -34, 40, 68);
  c.beginPath(); c.moveTo(-20, -34); c.lineTo(30, -80); c.lineTo(30, 80); c.lineTo(-20, 34); c.closePath(); c.fill();
  for (let k = 0; k < 3; k++) {
    const ph = (lt * 0.8 + k / 3) % 1;
    c.globalAlpha = a * (1 - ph); c.strokeStyle = C.violet; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.arc(40, 0, 40 + ph * 130, -0.6, 0.6); c.stroke();
  }
  c.restore();
  // Picture frame.
  const fp = rev(lt, 0.9, 0.8), fx = 450, fw = 470, fh = 360, fy = sy - fh / 2;
  c.save(); c.globalAlpha = fp;
  rrect(c, fx, fy, fw, fh, 26); c.fillStyle = '#0e1540'; c.fill(); c.strokeStyle = C.violet; c.lineWidth = 5; c.stroke();
  rrect(c, fx, fy, fw, fh, 26); c.clip();
  const k = prog(lt, 1.5, 4.0);
  const bx = fx + fw / 2, by = fy + fh / 2;
  glow(c, bx, by, 60 + 200 * eo(k), 'rgba(255,200,87,0.8)', k > 0 ? 0.9 : 0);
  c.fillStyle = C.gold; star(c, bx, by, 30 + 70 * eback(clamp(k * 1.5)), 14 + 26 * eo(k), 8, lt * 0.2); if (k > 0) c.fill();
  c.fillStyle = C.orange; star(c, bx, by, 14 + 30 * eo(k), 8 + 10 * eo(k), 8, -lt * 0.3); if (k > 0) c.fill();
  const rr = rng(3);
  for (let i = 0; i < 40; i++) {
    const ang = rr() * 6.28, v = 0.3 + rr() * 0.7, d = 230 * v * eo(k);
    c.fillStyle = [C.gold, C.cyan, C.ink][i % 3]; c.globalAlpha = fp * (k > 0 ? 0.9 : 0);
    c.beginPath(); c.arc(bx + Math.cos(ang) * d, by + Math.sin(ang) * d * 0.8, 3 + rr() * 4, 0, 6.28); c.fill();
  }
  c.restore();
  text(c, 'Dinleyicinin zihnindeki resim', fx + fw / 2, fy + fh + 50, { font: F.body(28, 500), color: C.mute, align: 'center', alpha: rev(lt, 1.6) });

  headline(c, 'Alay mı etti?', lt, 0.9);
  // Two claim cards.
  const strike = prog(lt, 4.6, 5.3);
  const cardA = rev(lt, 1.9), cardB = rev(lt, 3.2);
  const drawCard = (y, p, icon, iconCol, label, msg, active, dim) => {
    if (p <= 0) return;
    c.save(); c.globalAlpha = p * (1 - 0.5 * dim);
    rrect(c, M, y + (1 - p) * 24, TW, 112, 22);
    c.fillStyle = active ? 'rgba(61,220,151,0.10)' : C.card; c.fill();
    c.strokeStyle = active ? C.green : C.line; c.lineWidth = 3; c.stroke();
    c.fillStyle = iconCol; c.beginPath(); c.arc(M + 52, y + 56 + (1 - p) * 24, 26, 0, 6.28); c.fill();
    text(c, icon, M + 52, y + 57 + (1 - p) * 24, { font: F.head(30, 900), color: C.bg, align: 'center', base: 'middle' });
    text(c, label, M + 100, y + 46 + (1 - p) * 24, { font: F.body(24, 600), color: active ? C.green : C.mute, ls: 2 });
    text(c, msg, M + 100, y + 88 + (1 - p) * 24, { font: F.body(32, 600), color: C.ink });
    c.restore();
  };
  drawCard(1260, cardA, '✕', C.red, 'YAYGIN ANLATIM', 'Teoriyle alay etmek için söyledi.', false, strike);
  if (strike > 0) {
    c.save(); c.strokeStyle = C.red; c.lineWidth = 4; c.globalAlpha = 0.9;
    c.beginPath(); c.moveTo(M + 100, 1337); c.lineTo(M + 100 + 560 * eo(strike), 1340); c.stroke(); c.restore();
  }
  drawCard(1394, cardB, '✓', C.green, 'KONUŞMA METNİ', 'Dinleyiciye bir resim çizmek istedi.', true, 0);
}

function hornAntenna(c, x, y, lt, a) {
  c.save(); c.globalAlpha = a; c.translate(x, y);
  // Rails and turntable.
  c.fillStyle = '#2a3366'; rrect(c, -330, 200, 560, 26, 13); c.fill();
  c.fillStyle = '#3a4580'; for (const wx of [-260, -60, 140]) { c.beginPath(); c.arc(wx, 196, 18, 0, 6.28); c.fill(); }
  // Support frame.
  c.strokeStyle = '#8b93bd'; c.lineWidth = 8;
  c.beginPath(); c.moveTo(-250, 190); c.lineTo(-120, 40); c.lineTo(80, 190); c.moveTo(-120, 40); c.lineTo(-120, 190); c.stroke();
  // Horn: narrow throat on the left, wide square mouth on the right.
  c.beginPath(); c.moveTo(-300, 30); c.lineTo(160, -190); c.lineTo(160, 110); c.lineTo(-300, 70); c.closePath();
  c.fillStyle = '#e7ebf7'; c.fill();
  c.beginPath(); c.moveTo(-300, 70); c.lineTo(160, 110); c.lineTo(230, 160); c.lineTo(-280, 92); c.closePath();
  c.fillStyle = '#aab2d6'; c.fill();
  c.beginPath(); c.moveTo(160, -190); c.lineTo(230, -130); c.lineTo(230, 160); c.lineTo(160, 110); c.closePath();
  c.fillStyle = '#1b2350'; c.fill(); c.strokeStyle = '#e7ebf7'; c.lineWidth = 5; c.stroke();
  // Ribs.
  c.strokeStyle = 'rgba(42,51,102,0.35)'; c.lineWidth = 3;
  for (let i = 1; i < 5; i++) { const f = i / 5, xx = lerp(-300, 160, f); c.beginPath(); c.moveTo(xx, lerp(30, -190, f)); c.lineTo(xx, lerp(70, 110, f)); c.stroke(); }
  // Receiver cabin.
  rrect(c, -380, 0, 100, 110, 12); c.fillStyle = '#cdd3ec'; c.fill();
  c.fillStyle = C.gold; c.fillRect(-358, 30, 26, 20);
  c.restore();
}
function sceneCMB(c, lt) {
  chip(c, '1964 – 1965', lt, C.green);
  const ax = 560, ay = ILL_Y - 40, a = rev(lt, 0.3, 0.8);
  // Faint microwave background coming from every direction.
  const r = rng(9);
  c.save(); c.lineWidth = 4; c.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const ang = -Math.PI * 0.95 + r() * Math.PI * 1.5, ph = (lt * 0.35 + r()) % 1, len = 90;
    const d = lerp(560, 140, ph), x = ax + 200 + Math.cos(ang) * d, y = ay - 20 + Math.sin(ang) * d * 0.8;
    c.globalAlpha = a * Math.sin(ph * Math.PI) * 0.8; c.strokeStyle = i % 2 ? C.cyan : C.green;
    c.beginPath();
    for (let s = 0; s <= len; s += 6) {
      const px = x + Math.cos(ang) * s, py = y + Math.sin(ang) * s * 0.8, off = Math.sin(s * 0.18 + lt * 6) * 8;
      c.lineTo(px - Math.sin(ang) * off, py + Math.cos(ang) * off);
    }
    c.stroke();
  }
  c.restore();
  hornAntenna(c, ax, ay, lt, a);
  // Readout.
  const rp = rev(lt, 1.8);
  c.save(); c.globalAlpha = rp;
  rrect(c, 640, 380 - (1 - rp) * 20, 330, 150, 24); c.fillStyle = '#0f2a36'; c.fill(); c.strokeStyle = C.green; c.lineWidth = 3; c.stroke();
  c.restore();
  text(c, '≈ 3 K', 670, 465, { font: F.head(64, 800), color: C.green, alpha: rp });
  text(c, 'her yönden gelen ışıma', 670, 505, { font: F.body(24, 500), color: C.mute, alpha: rp });
  // Nobel medal.
  const mp = eback(prog(lt, 4.4, 5.1));
  if (mp > 0) {
    const mx = 200, my = 470;
    c.save(); c.translate(mx, my); c.scale(mp, mp);
    c.fillStyle = C.red; c.beginPath(); c.moveTo(-34, -110); c.lineTo(-6, -40); c.lineTo(-40, -40); c.lineTo(-62, -110); c.fill();
    c.fillStyle = '#c23646'; c.beginPath(); c.moveTo(34, -110); c.lineTo(6, -40); c.lineTo(40, -40); c.lineTo(62, -110); c.fill();
    c.beginPath(); c.arc(0, 10, 66, 0, 6.28); c.fillStyle = '#c8941f'; c.fill();
    c.beginPath(); c.arc(0, 4, 66, 0, 6.28); c.fillStyle = C.gold; c.fill();
    c.beginPath(); c.arc(0, 4, 52, 0, 6.28); c.strokeStyle = '#c8941f'; c.lineWidth = 4; c.stroke();
    c.font = F.head(30, 800); c.fillStyle = '#5b3d00'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1978', 0, -6);
    c.font = F.head(16, 700); c.letterSpacing = '2px'; c.fillText('NOBEL', 0, 24);
    c.restore();
  }
  headline(c, 'Kalıntı ışık bulundu', lt, 0.9);
  body(c, 'Arno Penzias ve Robert Wilson, Big Bang’den kalan *kozmik mikrodalga arka plan ışımasını* tesadüfen keşfetti.', lt, 1.8);
  rich(c, '*1978 Nobel Fizik Ödülü*', M, 1490, { size: 34, em: C.gold, p: prog(lt, 5.0, 5.8) });
}

function sceneOutro(c, lt) {
  burst(c, W / 2, ILL_Y - 40, lt, 0.25, 430);
  bigBangTitle(c, W / 2, ILL_Y - 40, prog(lt, 0.5, 1.2), 140);
  const p = rev(lt, 1.4, 0.8);
  rich(c, 'Teoriye adını, ona *en çok karşı çıkan* bilim insanı verdi.', W / 2, 1150, { size: 50, lh: 66, align: 'center', weight: 700, emWeight: 800, fontFn: F.head, maxW: 860, p: prog(lt, 1.4, 2.4) });
  c.save(); c.globalAlpha = rev(lt, 2.6);
  c.fillStyle = C.orange; c.fillRect(W / 2 - 45, 1330, 90, 6); c.restore();
  text(c, 'Fred Hoyle  ·  BBC Third Programme  ·  28 Mart 1949', W / 2, 1400, { font: F.body(28, 500), color: C.mute, align: 'center', alpha: rev(lt, 2.8) * p });
}

const SCENES = { hook: sceneHook, lemaitre: sceneLemaitre, steady: sceneSteady, radio: sceneRadio, intent: sceneIntent, cmb: sceneCMB, outro: sceneOutro };

function renderFrame(t) {
  const c = ctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  background(c, t);
  TL.scenes.forEach((s, i) => {
    const last = i === TL.scenes.length - 1;
    if (t < s.a || (t >= s.b && !last)) return;
    const lt = t - s.a;
    const fade = Math.min(i === 0 ? 1 : eo(prog(lt, 0, 0.45)), last ? 1 : 1 - prog(t, s.b - 0.4, s.b));
    c.save(); c.globalAlpha = fade; SCENES[s.id](c, lt); c.restore();
  });
  chrome(c, t);
}
