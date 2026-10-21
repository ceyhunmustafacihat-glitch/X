'use strict';
// Drawing engine for the "to be" lesson: easing, text, word tiles and their
// morphs, characters, the owl mascot, icons and the per-frame compositor.

const W = 1920, H = 1080;
let ctx;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, at, d = 0.45) => clamp((t - at) / d);
const eOut = p => 1 - Math.pow(1 - p, 3);
const eInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const eBack = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
// fade in at a, fade out at b (b may be null = stay)
const env = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(clamp((t - a) / fi), b == null ? 1 : clamp((b - t) / fo));

function rand(seed) { const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

// ---------- palette ----------
const C = {
  bg: '#FBF5EA', ink: '#2B2A33', soft: '#77727F', line: '#E7DCC8', card: '#FFFFFF',
  ok: '#20A36B', bad: '#E5484D',
};
// tile kinds: s subject, b to be, n not, r rest, w wh-word; [fill, shadow]
const K = {
  s: ['#3A7BEA', '#2759B5'], b: ['#F28C28', '#C4660F'], n: ['#E5484D', '#AE2A2F'],
  r: ['#20A36B', '#14774D'], w: ['#8B5CF6', '#6438CF'], x: ['#FFFFFF', '#D8CDB8'],
};
// inline rich-text colours
const RC = { s: K.s[0], b: K.b[0], n: K.n[0], r: K.r[0], w: K.w[0], h: C.ink, g: C.ok, x: '#A59EAE' };
const BADGE = { plus: '#20A36B', minus: '#E5484D', q: '#3A7BEA', nq: '#D9468F', wh: '#8B5CF6', star: '#E9A800', warn: '#F2542D', ink: '#2B2A33' };

// ---------- primitives ----------
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function ellipse(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
function withA(a, fn) { if (a <= 0.001) return; ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); }
// scale around a point
function around(x, y, s, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y); fn(); ctx.restore(); }
function card(x, y, w, h, { r = 28, fill = C.card, border = null, shadow = true } = {}) {
  if (shadow) { ctx.fillStyle = 'rgba(80,60,30,0.10)'; rr(x, y + 8, w, h, r); ctx.fill(); }
  ctx.fillStyle = fill; rr(x, y, w, h, r); ctx.fill();
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 4; rr(x, y, w, h, r); ctx.stroke(); }
}

// ---------- text ----------
function setFont(size, w = 500, fam = 'Inter', italic = false) { ctx.font = `${italic ? 'italic ' : ''}${w} ${size}px ${fam}`; }
function txt(s, x, y, { size = 44, w = 500, fam = 'Inter', color = C.ink, align = 'center', italic = false, alpha = 1 } = {}) {
  withA(alpha, () => {
    setFont(size, w, fam, italic); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  });
}
function heading(s, x, y, size = 56, color = C.ink, alpha = 1) { txt(s, x, y, { size, w: 800, fam: 'Montserrat', color, alpha }); }
function trLine(s, x, y, alpha = 1, size = 40, align = 'center') {
  txt(s, x, y, { size, w: 500, fam: 'Montserrat', italic: true, color: C.soft, alpha, align });
}

// "plain [b:coloured] plain [x:struck]" -> segments
function parseRich(s) {
  const out = [], re = /\[(\w):([^\]]+)\]/g; let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index) });
    out.push({ t: m[2], k: m[1] }); last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  return out;
}
function segFont(seg, size) { if (seg.k) setFont(size, 800, 'Montserrat'); else setFont(size, 500, 'Inter'); }
function richWidth(s, size) {
  let w = 0;
  for (const seg of parseRich(s)) { segFont(seg, size); w += ctx.measureText(seg.t).width; }
  return w;
}
function rich(s, x, y, { size = 44, align = 'center', color = C.ink, alpha = 1 } = {}) {
  withA(alpha, () => {
    const segs = parseRich(s), tw = richWidth(s, size);
    let cx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (const seg of segs) {
      segFont(seg, size);
      const w = ctx.measureText(seg.t).width;
      ctx.fillStyle = seg.k ? RC[seg.k] || C.ink : color;
      ctx.fillText(seg.t, cx, y);
      if (seg.k === 'x') {
        ctx.strokeStyle = C.bad; ctx.lineWidth = Math.max(3, size * 0.07); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - 4, y + size * 0.02); ctx.lineTo(cx + w + 4, y - size * 0.04); ctx.stroke();
      }
      cx += w;
    }
  });
}

// ---------- word tiles ----------
// spec: "She:s|is+n't:b+n<n0|happy:r|?:p"
//   text:kinds  kinds joined by + colour the +-separated parts (cycled)
//   flags: ! jump over others, ^ drop from above, <id absorbs that token, #id explicit id
//   kinds: s b n r w = tiles, x = blank, p = plain text, o = operator (+)
function toks(spec) {
  const count = {};
  return spec.split('|').map(raw => {
    const m = raw.match(/^(.*):([a-z+]+)([!^]*)(?:<(\w+))?(?:#(\w+))?$/);
    const kinds = m[2].split('+'), k = kinds[0];
    const parts = kinds.length > 1 ? m[1].split('+').map((t, i) => ({ t, k: kinds[i % kinds.length] })) : [{ t: m[1], k }];
    count[k] = (count[k] || 0);
    const id = m[5] || k + count[k]++;
    return { id, k, parts, text: parts.map(p => p.t).join(''), jump: m[3].includes('!'), drop: m[3].includes('^'), absorb: m[4] };
  });
}
const tileFont = size => setFont(size, 800, 'Montserrat');
function measureTok(tok, size) {
  if (tok.k === 'p') { tileFont(size); return ctx.measureText(tok.text).width; }
  if (tok.k === 'o') { setFont(size, 700, 'Montserrat'); return ctx.measureText(tok.text).width; }
  if (tok.k === 'x') return size * 2.3;
  tileFont(size);
  return tok.parts.reduce((a, p) => a + ctx.measureText(p.t).width, 0) + size * 0.76;
}
function layout(tokens, cx, size, align = 'center') {
  const gap = size * 0.26;
  const items = tokens.map(t => ({ ...t, w: measureTok(t, size) }));
  let total = 0;
  items.forEach((it, i) => { if (i) total += it.k === 'p' && /^[.,?!]/.test(it.text) ? size * 0.07 : gap; total += it.w; });
  let x = align === 'center' ? cx - total / 2 : cx;
  items.forEach((it, i) => {
    if (i) x += it.k === 'p' && /^[.,?!]/.test(it.text) ? size * 0.07 : gap;
    it.x = x + it.w / 2; x += it.w;
  });
  return items;
}
function drawTok(tok, x, y, size, { alpha = 1, scale = 1, glow = 0 } = {}) {
  withA(alpha, () => around(x, y, scale, () => {
    const w = tok.w, h = size * 1.42, r = h * 0.3, x0 = x - w / 2, y0 = y - h / 2;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    if (tok.k === 'p' || tok.k === 'o') {
      if (tok.k === 'p') tileFont(size); else setFont(size, 700, 'Montserrat');
      ctx.fillStyle = tok.k === 'p' ? C.ink : C.soft; ctx.fillText(tok.text, x, y + size * 0.02);
      return;
    }
    if (tok.k === 'x') {
      ctx.fillStyle = '#FFFFFF'; rr(x0, y0, w, h, r); ctx.fill();
      ctx.setLineDash([size * 0.22, size * 0.16]); ctx.lineWidth = size * 0.07; ctx.strokeStyle = '#B9AC95';
      rr(x0, y0, w, h, r); ctx.stroke(); ctx.setLineDash([]);
      tileFont(size * 0.8); ctx.fillStyle = '#C9BDA7'; ctx.fillText('?', x, y + size * 0.02);
      return;
    }
    if (glow > 0) { ctx.fillStyle = `rgba(255,209,102,${0.55 * glow})`; rr(x0 - 12, y0 - 12, w + 24, h + 24 + size * 0.12, r + 12); ctx.fill(); }
    // split-colour tile when parts differ
    tileFont(size);
    const widths = tok.parts.map(p => ctx.measureText(p.t).width);
    const inner = widths.reduce((a, b) => a + b, 0), pad = (w - inner) / 2;
    const bounds = []; let bx = x0;
    tok.parts.forEach((p, i) => {
      const pw = widths[i] + (i === 0 ? pad : 0) + (i === tok.parts.length - 1 ? pad : 0);
      bounds.push([bx, pw, p.k]); bx += pw;
    });
    for (const layer of [1, 0]) {
      ctx.save(); rr(x0, y0 + (layer ? size * 0.11 : 0), w, h, r); ctx.clip();
      for (const [bx0, bw, k] of bounds) { ctx.fillStyle = K[k][layer]; ctx.fillRect(bx0 - 0.5, y0 - 2, bw + 1, h + size * 0.2); }
      ctx.restore();
    }
    ctx.fillStyle = '#FFFFFF';
    let tx = x0 + pad;
    tok.parts.forEach((p, i) => { ctx.textAlign = 'left'; ctx.fillText(p.t, tx, y + size * 0.03); tx += widths[i]; });
  }));
}
// static sentence whose tokens pop in one after another
function popSentence(spec, t, at, cx, y, size, { stagger = 0.2, alpha = 1, align = 'center', glow = null } = {}) {
  const L = layout(typeof spec === 'string' ? toks(spec) : spec, cx, size, align);
  withA(alpha, () => L.forEach((tok, i) => {
    const q = prog(t, at + i * stagger, 0.4);
    if (q > 0) drawTok(tok, tok.x, y + (1 - eOut(q)) * size * 0.4, size, { alpha: clamp(q * 2), scale: eBack(q), glow: glow ? glow(i) : 0 });
  }));
  return L;
}
function tokCount(spec) { return spec.split('|').length; }
// morph between two token lists (matched by id)
function morph(A, B, p, cx, y, size) {
  const LA = layout(A, cx, size), LB = layout(B, cx, size), e = eInOut(clamp(p));
  const mB = Object.fromEntries(LB.map(o => [o.id, o])), mA = Object.fromEntries(LA.map(o => [o.id, o]));
  const draws = [];
  for (const a of LA) {
    const b = mB[a.id];
    if (b) {
      const jump = b.jump ? Math.sin(Math.PI * e) * size * 1.7 : 0;
      const src = e < 0.5 ? a : b;
      const changed = a.text !== b.text || a.k !== b.k;
      draws.push({ tok: { ...src, w: lerp(a.w, b.w, e) }, x: lerp(a.x, b.x, e), y: y - jump, z: b.jump ? 2 : 0,
        scale: 1 + (b.jump ? 0.1 : changed ? 0.12 : 0) * Math.sin(Math.PI * e) });
    } else {
      const into = LB.find(o => o.absorb === a.id);
      const x = into ? lerp(a.x, into.x, e) : a.x;
      draws.push({ tok: a, x, y: into ? y - Math.sin(Math.PI * e) * size * 0.8 : y, z: 3, alpha: into ? 1 - clamp((e - 0.55) / 0.4) : 1 - clamp(e * 2), scale: into ? 1 - 0.4 * e : 1 - 0.3 * e });
    }
  }
  for (const b of LB) if (!mA[b.id]) {
    const q = clamp((e - 0.3) / 0.7);
    draws.push({ tok: b, x: b.x, y: y - (b.drop ? (1 - eOut(q)) * size * 3 : 0), z: 1, alpha: clamp(q * 2.5), scale: b.drop ? 1 : eBack(q) });
  }
  draws.sort((u, v) => u.z - v.z).forEach(d => drawTok(d.tok, d.x, d.y, size, d));
}
// a sentence that changes through states [{at, spec}]; the first state pops in
function track(t, states, cx, y, size, { dur = 0.9, alpha = 1 } = {}) {
  let i = 0; while (i + 1 < states.length && t >= states[i + 1].at) i++;
  withA(alpha, () => {
    if (i === 0) popSentence(states[0].spec, t, states[0].at, cx, y, size);
    else if (t < states[i].at + dur) morph(toks(states[i - 1].spec), toks(states[i].spec), (t - states[i].at) / dur, cx, y, size);
    else popSentence(states[i].spec, 1e9, 0, cx, y, size);
  });
}
// formula row: "Özne:s|+:o|am / is / are:b|..."
function formula(spec, t, at, y = 190, size = 42) {
  const a = prog(t, at, 0.5);
  withA(a, () => {
    const L = layout(toks(spec), W / 2, size);
    const x0 = L[0].x - L[0].w / 2 - 34, x1 = L[L.length - 1].x + L[L.length - 1].w / 2 + 34;
    card(x0, y - size * 0.95, x1 - x0, size * 2.05, { r: 26, fill: '#FFFDF8', border: C.line, shadow: false });
  });
  popSentence(spec, t, at + 0.1, W / 2, y, size, { stagger: 0.12 });
}

// ---------- icons ----------
function checkIcon(x, y, r, a = 1, s = 1) {
  withA(a, () => around(x, y, s, () => {
    ctx.fillStyle = C.ok; circle(x, y, r); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + r * 0.02); ctx.lineTo(x - r * 0.12, y + r * 0.35); ctx.lineTo(x + r * 0.48, y - r * 0.32); ctx.stroke();
  }));
}
function crossIcon(x, y, r, a = 1, s = 1) {
  withA(a, () => around(x, y, s, () => {
    ctx.fillStyle = C.bad; circle(x, y, r); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    const d = r * 0.36;
    ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
  }));
}
function mark(ok, x, y, r, t, at) { const q = prog(t, at, 0.4); (ok ? checkIcon : crossIcon)(x, y, r, clamp(q * 2), eBack(q)); }
function arrow(x0, y, x1, color = C.soft, a = 1, lw = 7) {
  withA(a, () => {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - lw * 2, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - lw * 3, y - lw * 2.2); ctx.lineTo(x1 - lw * 3, y + lw * 2.2); ctx.closePath(); ctx.fill();
  });
}
function bulb(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#FFD166'; circle(0, -6, 15); ctx.fill();
  ctx.fillStyle = '#9C8F78'; rr(-7, 8, 14, 9, 3); ctx.fill();
  ctx.strokeStyle = '#E9A800'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) { const a = -Math.PI / 2 + i * 0.6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 21, -6 + Math.sin(a) * 21); ctx.lineTo(Math.cos(a) * 28, -6 + Math.sin(a) * 28); ctx.stroke(); }
  ctx.restore();
}
function briefcase(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#7A4E2D'; ctx.lineWidth = 9; rr(-22, -62, 44, 30, 10); ctx.stroke();
  ctx.fillStyle = '#A0673C'; rr(-60, -42, 120, 82, 14); ctx.fill();
  ctx.fillStyle = '#8A5631'; ctx.fillRect(-60, -10, 120, 8);
  ctx.fillStyle = '#FFD166'; rr(-10, -16, 20, 18, 4); ctx.fill();
  ctx.restore();
}
function smiley(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#FFD166'; circle(0, 0, 55); ctx.fill();
  ctx.fillStyle = C.ink; circle(-19, -12, 7); ctx.fill(); circle(19, -12, 7); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 4, 28, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(240,110,110,.45)'; circle(-33, 12, 9); ctx.fill(); circle(33, 12, 9); ctx.fill();
  ctx.restore();
}
function house(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#F7E3C4'; ctx.fillRect(-48, -10, 96, 62);
  ctx.fillStyle = '#E5484D'; ctx.beginPath(); ctx.moveTo(-64, -6); ctx.lineTo(0, -62); ctx.lineTo(64, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3A7BEA'; rr(-14, 14, 28, 38, 5); ctx.fill();
  ctx.fillStyle = '#9FD0FF'; ctx.fillRect(22, 4, 18, 18); ctx.fillRect(-40, 4, 18, 18);
  ctx.restore();
}
function cake(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#F6B8C8'; rr(-55, -10, 110, 56, 10); ctx.fill();
  ctx.fillStyle = '#FFF4E0'; rr(-55, -14, 110, 18, 9); ctx.fill();
  ctx.fillStyle = '#E5484D'; for (let i = -2; i <= 2; i++) { circle(i * 22, 22, 4); ctx.fill(); }
  ctx.fillStyle = '#3A7BEA'; rr(-5, -50, 10, 36, 3); ctx.fill();
  ctx.fillStyle = '#FFB020'; ellipse(0, -60, 7, 12); ctx.fill();
  ctx.restore();
}
function snowflake(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = '#5AA9F5'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -50);
    ctx.moveTo(0, -30); ctx.lineTo(-13, -42); ctx.moveTo(0, -30); ctx.lineTo(13, -42); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
function sun(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = '#FFB020'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 44, Math.sin(a) * 44); ctx.lineTo(Math.cos(a) * 60, Math.sin(a) * 60); ctx.stroke(); }
  ctx.fillStyle = '#FFD166'; circle(0, 0, 34); ctx.fill();
  ctx.restore();
}
function board(x, y, s, label = 'A B C') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#A0673C'; rr(-130, -95, 260, 170, 12); ctx.fill();
  ctx.fillStyle = '#2F5D50'; rr(-118, -83, 236, 146, 8); ctx.fill();
  setFont(56, 600, 'Caveat'); ctx.fillStyle = '#F4F1E8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, -10);
  ctx.restore();
}
function heart(x, y, s, color = '#E5484D') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-26, -6, -14, -30, 0, -16); ctx.bezierCurveTo(14, -30, 26, -6, 0, 12); ctx.fill();
  ctx.restore();
}

// ---------- characters ----------
// person standing with feet at (x, y); ~300 units tall at s = 1
function person(x, y, s, o = {}) {
  const T = o.t || 0, seed = o.seed || 0;
  const skin = o.skin || '#F2C6A0', hair = o.hair || '#3B2A20', shirt = o.shirt || '#5B8DEF', pants = o.pants || '#34405A';
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.fillStyle = 'rgba(60,40,20,.10)'; ellipse(0, 0, 66, 12); ctx.fill();
  ctx.fillStyle = pants; rr(-30, -104, 27, 100, 12); ctx.fill(); rr(3, -104, 27, 100, 12); ctx.fill();
  ctx.fillStyle = C.ink; ellipse(-18, -4, 21, 9); ctx.fill(); ellipse(18, -4, 21, 9); ctx.fill();
  const bob = Math.sin(T * 2.3 + seed * 1.7) * 2.5;
  ctx.translate(0, bob);
  // arms (behind body)
  ctx.strokeStyle = shirt; ctx.lineWidth = 23; ctx.lineCap = 'round';
  const hand = [];
  ctx.beginPath(); ctx.moveTo(-44, -168); ctx.lineTo(-62, -106); ctx.stroke(); hand.push([-62, -106]);
  if (o.wave) {
    const a = Math.sin(T * 7) * 0.25;
    const hx = 44 + Math.sin(0.9 + a) * 70, hy = -168 - Math.cos(0.9 + a) * 70;
    ctx.beginPath(); ctx.moveTo(44, -168); ctx.lineTo(hx, hy); ctx.stroke(); hand.push([hx, hy]);
  } else if (o.point) {
    ctx.beginPath(); ctx.moveTo(44, -168); ctx.quadraticCurveTo(62, -120, 14, -140); ctx.stroke(); hand.push([14, -140]);
  } else { ctx.beginPath(); ctx.moveTo(44, -168); ctx.lineTo(62, -106); ctx.stroke(); hand.push([62, -106]); }
  // body
  ctx.fillStyle = shirt;
  if (o.dress) { ctx.beginPath(); ctx.moveTo(-42, -190); ctx.lineTo(42, -190); ctx.lineTo(62, -82); ctx.lineTo(-62, -82); ctx.closePath(); ctx.fill(); rr(-46, -196, 92, 40, 22); ctx.fill(); }
  else { rr(-54, -194, 108, 108, 34); ctx.fill(); }
  ctx.fillStyle = skin; for (const [hx, hy] of hand) { circle(hx, hy, 12); ctx.fill(); }
  if (o.tie) { ctx.fillStyle = '#E5484D'; ctx.beginPath(); ctx.moveTo(-7, -190); ctx.lineTo(7, -190); ctx.lineTo(10, -140); ctx.lineTo(0, -128); ctx.lineTo(-10, -140); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = skin; rr(-11, -206, 22, 18, 6); ctx.fill();
  // hair behind
  ctx.fillStyle = hair;
  if (o.hairStyle === 'long') { rr(-62, -292, 124, 150, 56); ctx.fill(); }
  // head
  ctx.fillStyle = skin; circle(0, -248, 52); ctx.fill();
  ctx.fillStyle = hair;
  if (o.hairStyle !== 'bald') {
    ctx.beginPath(); ctx.arc(0, -252, 56, Math.PI * 1.0, Math.PI * 2.0); ctx.closePath(); ctx.fill();
    if (o.hairStyle === 'bun') { circle(0, -314, 22); ctx.fill(); }
    if (o.hairStyle === 'curly') for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; circle(Math.cos(a) * 54, -252 + Math.sin(a) * 54, 18); ctx.fill(); }
    if (o.hairStyle === 'long' || o.hairStyle === 'bun') { ctx.beginPath(); ctx.ellipse(-22, -258, 34, 14, -0.35, 0, Math.PI * 2); ctx.fill(); }
  }
  // face
  const mood = o.mood || 'happy';
  const blink = ((T + seed * 1.37) % 3.9) < 0.13;
  ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
  if (blink || mood === 'tired') {
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-26, -244); ctx.lineTo(-12, -244); ctx.moveTo(12, -244); ctx.lineTo(26, -244); ctx.stroke();
  } else {
    const er = mood === 'surprised' ? 7.5 : 6.5;
    circle(-19, -245, er); ctx.fill(); circle(19, -245, er); ctx.fill();
    ctx.fillStyle = '#fff'; circle(-17, -247, 2); ctx.fill(); circle(21, -247, 2); ctx.fill(); ctx.fillStyle = C.ink;
  }
  if (mood === 'sad' || mood === 'surprised') {
    ctx.lineWidth = 4;
    const d = mood === 'sad' ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(-28, -262 - d * 3); ctx.lineTo(-12, -264 + d * 3); ctx.moveTo(12, -264 + d * 3); ctx.lineTo(28, -262 - d * 3); ctx.stroke();
  }
  if (o.glasses) {
    ctx.lineWidth = 4; ctx.strokeStyle = C.ink;
    circle(-19, -245, 15); ctx.stroke(); circle(19, -245, 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -246); ctx.lineTo(4, -246); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(240,110,110,.35)'; circle(-32, -226, 9); ctx.fill(); circle(32, -226, 9); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 5;
  if (mood === 'happy') { ctx.beginPath(); ctx.arc(0, -232, 15, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke(); }
  else if (mood === 'sad') { ctx.beginPath(); ctx.arc(0, -212, 13, 1.22 * Math.PI, 1.78 * Math.PI); ctx.stroke(); }
  else if (mood === 'surprised') { ctx.fillStyle = '#7A3B3B'; ellipse(0, -222, 7, 10); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(-10, -222); ctx.lineTo(10, -222); ctx.stroke(); }
  if (mood === 'tired') { ctx.fillStyle = '#9FB7D9'; setFont(26, 800, 'Montserrat'); ctx.textAlign = 'center'; ctx.fillText('z', 62, -300 - Math.sin(T * 2) * 6); setFont(18, 800, 'Montserrat'); ctx.fillText('z', 80, -330 - Math.sin(T * 2 + 1) * 6); }
  ctx.restore();
}
function cat(x, y, s, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const fur = '#F2A65A', dark = '#D9822B';
  ctx.fillStyle = 'rgba(60,40,20,.10)'; ellipse(0, 0, 80, 12); ctx.fill();
  ctx.strokeStyle = fur; ctx.lineWidth = 16; ctx.lineCap = 'round';
  const sw = Math.sin(t * 2.5) * 14;
  ctx.beginPath(); ctx.moveTo(-60, -40); ctx.quadraticCurveTo(-110, -60, -96 + sw, -130); ctx.stroke();
  ctx.fillStyle = fur; ellipse(-5, -52, 72, 48); ctx.fill();
  ctx.fillStyle = dark; ellipse(-20, -70, 18, 8, 0.4); ctx.fill(); ellipse(-40, -60, 14, 6, 0.4); ctx.fill();
  ctx.fillStyle = fur; rr(-50, -30, 22, 30, 10); ctx.fill(); rr(22, -30, 22, 30, 10); ctx.fill();
  const hy = -118;
  circle(48, hy, 42); ctx.fill();
  ctx.beginPath(); ctx.moveTo(16, hy - 22); ctx.lineTo(20, hy - 66); ctx.lineTo(44, hy - 38); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(56, hy - 40); ctx.lineTo(82, hy - 64); ctx.lineTo(84, hy - 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#F6C7A8'; ellipse(50, hy + 16, 22, 14); ctx.fill();
  ctx.fillStyle = C.ink;
  const blink = (t % 4.3) < 0.13;
  if (blink) { ctx.fillRect(28, hy - 4, 14, 3); ctx.fillRect(58, hy - 4, 14, 3); }
  else { ellipse(35, hy - 4, 5, 8); ctx.fill(); ellipse(65, hy - 4, 5, 8); ctx.fill(); }
  ctx.fillStyle = '#E26D6D'; ctx.beginPath(); ctx.moveTo(44, hy + 8); ctx.lineTo(56, hy + 8); ctx.lineTo(50, hy + 15); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(43,42,51,.55)'; ctx.lineWidth = 2.5;
  for (const d of [-1, 1]) for (const k of [-6, 4]) { ctx.beginPath(); ctx.moveTo(50 + d * 18, hy + 14 + k * 0.4); ctx.lineTo(50 + d * 52, hy + 10 + k); ctx.stroke(); }
  ctx.restore();
}
// the owl teacher; feet at (x, y); ~280 units tall at s = 1
function owl(x, y, s, T, { talk = false, wave = false } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const bob = Math.sin(T * 2.2) * 4 + (talk ? Math.abs(Math.sin(T * 9)) * -4 : 0);
  ctx.fillStyle = 'rgba(60,40,20,.12)'; ellipse(0, 0, 70, 12); ctx.fill();
  ctx.translate(0, bob);
  const body = '#9A6A43', bodyD = '#7E5434', belly = '#F3DDB8';
  // wings
  const flap = talk ? Math.sin(T * 10) * 0.18 : wave ? 0 : 0;
  ctx.fillStyle = bodyD;
  ctx.save(); ctx.translate(-70, -120); ctx.rotate(0.25 + flap); ellipse(0, 30, 26, 56); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(70, -120);
  ctx.rotate(wave ? -2.1 + Math.sin(T * 8) * 0.35 : -0.25 - flap); ellipse(0, 30, 26, 56); ctx.fill(); ctx.restore();
  ctx.fillStyle = body; ellipse(0, -118, 84, 108); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-70, -196); ctx.lineTo(-62, -246); ctx.lineTo(-30, -212); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(70, -196); ctx.lineTo(62, -246); ctx.lineTo(30, -212); ctx.closePath(); ctx.fill();
  ctx.fillStyle = belly; ellipse(0, -92, 56, 70); ctx.fill();
  ctx.strokeStyle = '#D9BC8E'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const [vx, vy] of [[-20, -110], [10, -112], [-6, -86], [22, -84], [-24, -60], [6, -58]]) { ctx.beginPath(); ctx.moveTo(vx - 7, vy - 4); ctx.lineTo(vx, vy + 3); ctx.lineTo(vx + 7, vy - 4); ctx.stroke(); }
  // eyes
  ctx.fillStyle = '#F5B841'; circle(-33, -168, 34); ctx.fill(); circle(33, -168, 34); ctx.fill();
  ctx.fillStyle = '#fff'; circle(-33, -168, 27); ctx.fill(); circle(33, -168, 27); ctx.fill();
  const blink = (T % 4.1) < 0.14;
  if (blink) { ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-48, -168); ctx.lineTo(-18, -168); ctx.moveTo(18, -168); ctx.lineTo(48, -168); ctx.stroke(); }
  else {
    const lx = Math.sin(T * 0.7) * 4;
    ctx.fillStyle = C.ink; circle(-31 + lx, -166, 13); ctx.fill(); circle(35 + lx, -166, 13); ctx.fill();
    ctx.fillStyle = '#fff'; circle(-27 + lx, -171, 4.5); ctx.fill(); circle(39 + lx, -171, 4.5); ctx.fill();
  }
  ctx.fillStyle = '#F28C28';
  const open = talk ? Math.abs(Math.sin(T * 9)) * 6 : 0;
  ctx.beginPath(); ctx.moveTo(-11, -144); ctx.lineTo(11, -144); ctx.lineTo(0, -122 + open); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#F28C28'; ellipse(-24, -6, 16, 8); ctx.fill(); ellipse(24, -6, 16, 8); ctx.fill();
  // graduation cap
  ctx.fillStyle = '#2B2A33';
  rr(-38, -238, 76, 26, 6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -270); ctx.lineTo(78, -246); ctx.lineTo(0, -224); ctx.lineTo(-78, -246); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#FFD166'; ctx.lineWidth = 4;
  const sw = Math.sin(T * 2) * 6;
  ctx.beginPath(); ctx.moveTo(0, -248); ctx.lineTo(52, -242); ctx.lineTo(58 + sw * 0.3, -204); ctx.stroke();
  ctx.fillStyle = '#FFD166'; circle(58 + sw * 0.3, -200, 7); ctx.fill();
  ctx.restore();
}

// ---------- speech bubble for the owl ----------
const OWL = { x: 1790, y: 1060, s: 0.74, talk: false, wave: false };
// lines are rich strings; shown between a and b
function tip(t, a, b, lines, { label = 'İPUCU', size = 38, bottom = 990, right = 1650 } = {}) {
  const q = prog(t, a, 0.45), out = clamp((b - t) / 0.35);
  if (q <= 0 || out <= 0) return;
  if (t < b - 0.2) OWL.talk = ((t - a) % 2.6) < 1.9;
  let w = 0; for (const l of lines) w = Math.max(w, richWidth(l, size));
  const lh = size * 1.45, padX = 40, padY = 30, head = label ? 52 : 0;
  const bw = w + padX * 2, bh = lines.length * lh + padY * 2 + head - (size * 0.25);
  const x0 = right - bw, y0 = bottom - bh;
  withA(clamp(q * 2) * out, () => around(right - 30, bottom, eBack(q) * (0.96 + 0.04 * out), () => {
    ctx.fillStyle = 'rgba(80,60,30,.12)'; rr(x0, y0 + 8, bw, bh, 30); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; rr(x0, y0, bw, bh, 30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(right - 70, bottom - 2); ctx.lineTo(right + 36, bottom - 56); ctx.lineTo(right - 18, bottom - 60); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#F0E4CF'; ctx.lineWidth = 3; rr(x0, y0, bw, bh, 30); ctx.stroke();
    if (label) {
      bulb(x0 + padX + 14, y0 + padY + 14, 0.9);
      txt(label, x0 + padX + 44, y0 + padY + 12, { size: 28, w: 800, fam: 'Montserrat', color: '#E9A800', align: 'left' });
    }
    lines.forEach((l, i) => rich(l, x0 + padX, y0 + padY + head + lh * i + size * 0.5, { size, align: 'left' }));
  }));
}

// ---------- background, header, legend, progress ----------
let dots;
function makeDots() {
  dots = document.createElement('canvas'); dots.width = W; dots.height = H;
  const d = dots.getContext('2d'); d.fillStyle = 'rgba(160,130,90,.13)';
  for (let y = 30; y < H; y += 48) for (let x = 30 + ((y / 48) % 2) * 24; x < W; x += 48) { d.beginPath(); d.arc(x, y, 2.2, 0, Math.PI * 2); d.fill(); }
}
function background(T) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const blobs = [['#FFE6C2', 260, 180, 330], ['#DDEBFF', 1700, 220, 300], ['#DDF3E6', 1580, 900, 360], ['#F1E4FF', 200, 940, 300]];
  blobs.forEach(([c, bx, by, r], i) => {
    ctx.fillStyle = c; ctx.globalAlpha = 0.75;
    circle(bx + Math.sin(T * 0.11 + i * 2) * 40, by + Math.cos(T * 0.09 + i) * 30, r); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.drawImage(dots, 0, 0);
}
function header(sc, a) {
  if (!sc.title) return;
  withA(a, () => {
    const x = 56, y = 58, size = 30;
    setFont(size, 800, 'Montserrat');
    const tw = ctx.measureText(sc.title).width;
    card(x, y - 34, tw + 116, 68, { r: 34 });
    ctx.fillStyle = sc.badge.c; circle(x + 34, y, 26); ctx.fill();
    txt(sc.badge.sym, x + 34, y + 1, { size: sc.badge.sym.length > 1 ? 22 : 30, w: 900, fam: 'Montserrat', color: '#fff' });
    txt(sc.title, x + 76, y + 1, { size, w: 800, fam: 'Montserrat', align: 'left' });
  });
  withA(a * 0.9, () => {
    txt('TO BE', W - 60, 58, { size: 30, w: 900, fam: 'Montserrat', color: K.b[0], align: 'right' });
    txt('am · is · are', W - 60, 92, { size: 20, w: 600, fam: 'Montserrat', color: C.soft, align: 'right' });
  });
}
function legend(sc, a) {
  if (!sc.legend) return;
  const items = [['s', 'Özne'], ['b', 'to be'], ['n', 'not'], ['r', 'devamı']];
  if (sc.legend === 'wh') items.unshift(['w', 'soru kelimesi']);
  withA(a, () => {
    let x = 56; const y = 1036;
    for (const [k, label] of items) {
      ctx.fillStyle = K[k][0]; rr(x, y - 11, 22, 22, 6); ctx.fill();
      txt(label, x + 32, y + 1, { size: 22, w: 600, fam: 'Montserrat', color: C.soft, align: 'left' });
      setFont(22, 600, 'Montserrat'); x += 32 + ctx.measureText(label).width + 30;
    }
  });
}

// ---------- compositor ----------
let SCENES = [], TOTAL = 0;
function defineScenes(list) {
  SCENES = list; let off = 0;
  for (const sc of SCENES) { sc.start = off; off += sc.dur; }
  TOTAL = off;
}
function sceneAt(T) {
  for (const sc of SCENES) if (T < sc.start + sc.dur) return sc;
  return SCENES[SCENES.length - 1];
}
function renderFrame(T) {
  T = clamp(T, 0, TOTAL - 1e-4);
  const sc = sceneAt(T), t = T - sc.start;
  background(T);
  OWL.talk = false; OWL.wave = false;
  const a = clamp(t / 0.45) * clamp((sc.dur - t) / 0.45);
  ctx.save(); ctx.globalAlpha = a; sc.draw(t, T); ctx.restore();
  header(sc, a); legend(sc, a);
  if (sc.owl !== false) {
    const first = SCENES.findIndex(s => s.owl !== false), ownIn = SCENES.indexOf(sc) === first ? eOut(prog(t, 0.3, 0.8)) : 1;
    const last = SCENES.length - 1, ownOut = SCENES.indexOf(sc) === last ? 1 - eInOut(prog(t, sc.dur - 1.2, 1)) : 1;
    owl(OWL.x + (1 - ownIn) * 300 + (1 - ownOut) * 300, OWL.y, OWL.s, T, { talk: OWL.talk, wave: OWL.wave });
  }
  // progress
  ctx.fillStyle = 'rgba(43,42,51,.08)'; ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = K.b[0]; ctx.fillRect(0, H - 6, W * (T / TOTAL), 6);
  // global fade from/to the background colour
  const g = Math.max(1 - clamp(T / 0.6), clamp((T - (TOTAL - 0.8)) / 0.8));
  if (g > 0) { ctx.fillStyle = `rgba(251,245,234,${g})`; ctx.fillRect(0, 0, W, H); }
}
function init(canvas) { ctx = canvas.getContext('2d'); makeDots(); }
function sfxList() {
  const out = [];
  for (const sc of SCENES) for (const [t, type, vol] of (sc.sfx || [])) out.push([+(sc.start + t).toFixed(3), type, vol == null ? 1 : vol]);
  return out.sort((a, b) => a[0] - b[0]);
}
// sfx helpers
const pops = (at, n, st = 0.2, type = 'pop') => Array.from({ length: n }, (_, i) => [at + i * st, type]);
const trackSfx = states => [...pops(states[0].at, tokCount(states[0].spec)), ...states.slice(1).map(s => [s.at, 'whoosh'])];
