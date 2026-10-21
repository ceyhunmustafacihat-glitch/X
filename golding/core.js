// Shared helpers: timing, easing, palette, shapes and the caption/header system.
const W = 1080, H = 1920, FPS = 30;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const eIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eOut = t => 1 - Math.pow(1 - t, 3);
const eBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// 0→1 appear over d seconds starting at a
const ap = (t, a, d = 0.6) => eOut(P(t, a, a + d));
const apB = (t, a, d = 0.6) => eBack(P(t, a, a + d));
// window: fades in at a, out at b
const win = (t, a, b, f = 0.45) => Math.min(eOut(P(t, a, a + f)), 1 - eIO(P(t, b - f, b)));
const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const C = {
  ink: '#1E2A3A', ink2: '#2C3E50', cream: '#F6EEDC', paper: '#FBF5E8', sand: '#E8C98E', sandD: '#C99A5B',
  teal: '#2A9D8F', tealD: '#1D6F68', sea: '#1F6F8B', seaD: '#14485C', seaL: '#5FA8BF', sky: '#A8D8E0', skyL: '#DCEFF0',
  coral: '#E76F51', orange: '#F4A261', mustard: '#E9C46A', green: '#6A994E', greenD: '#3F6E45', greenL: '#A7C957',
  plum: '#6D4C7D', grey: '#8D99A6', greyD: '#56636F', red: '#C0392B', brick: '#B5563C', skin: '#F2C7A5', skinD: '#DFA37E',
  night: '#16213A', night2: '#22305A', white: '#FFFFFF', navy: '#1B2B4B', gold: '#D9A441',
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
function ell(ctx, x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
function poly(ctx, pts, fill) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
function line(ctx, x1, y1, x2, y2, color, w, cap = 'round') {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = cap; ctx.stroke();
}
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}
function fillBg(ctx, fill) { ctx.fillStyle = fill; ctx.fillRect(0, 0, W, H); }
// Scale/rotate/fade a drawing around (x, y)
function at(ctx, x, y, s, alpha, fn, rot = 0) {
  if (alpha <= 0.001 || s <= 0.001) return;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s);
  ctx.globalAlpha *= clamp(alpha); fn(); ctx.restore();
}
// Wave band filled down to the bottom of the frame
function waveBand(ctx, y, amp, len, phase, fill, x0 = -20, x1 = W + 20) {
  ctx.beginPath(); ctx.moveTo(x0, H + 10);
  for (let x = x0; x <= x1; x += 12) ctx.lineTo(x, y + Math.sin(x / len * Math.PI * 2 + phase) * amp);
  ctx.lineTo(x1, H + 10); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}

// ---- rich text: **bold** segments are emphasised ----
function layoutRich(ctx, str, maxW, o) {
  const words = [];
  str.split('**').forEach((seg, i) => seg.split(/(\s+)/).forEach(w => { if (w && !/^\s+$/.test(w)) words.push({ w, b: i % 2 === 1 }); else if (w) words.push({ sp: true }); }));
  const fN = `${o.weight || 500} ${o.size}px ${o.family || 'Montserrat'}`, fB = `${o.bweight || 800} ${o.size}px ${o.family || 'Montserrat'}`;
  ctx.font = fN; const sp = ctx.measureText(' ').width;
  const lines = []; let cur = [], cw = 0, pendingSp = false;
  for (const t of words) {
    if (t.sp) { pendingSp = true; continue; }
    ctx.font = t.b ? fB : fN; const ww = ctx.measureText(t.w).width;
    let gap = cur.length && pendingSp ? sp : 0;
    // break only at spaces so "Cornwall'da" style suffixes stay attached
    if (cur.length && pendingSp && cw + gap + ww > maxW) { lines.push({ items: cur, w: cw }); cur = []; cw = 0; gap = 0; }
    cur.push({ ...t, x: cw + gap, ww }); cw += gap + ww; pendingSp = false;
  }
  if (cur.length) lines.push({ items: cur, w: cw });
  return { lines, fN, fB };
}
function drawRich(ctx, L, cx, y, o) {
  ctx.textBaseline = 'alphabetic';
  L.lines.forEach((ln, i) => {
    const x0 = o.align === 'left' ? cx : cx - ln.w / 2;
    for (const it of ln.items) {
      ctx.font = it.b ? L.fB : L.fN; ctx.fillStyle = it.b ? (o.hl || C.coral) : (o.color || C.ink);
      ctx.fillText(it.w, x0 + it.x, y + i * o.lh);
    }
  });
}
function rich(ctx, str, cx, y, maxW, o) { const L = layoutRich(ctx, str, maxW, o); drawRich(ctx, L, cx, y, o); return L.lines.length * o.lh; }

// Caption card in the lower-middle area (kept above the Reels UI zone)
function caption(ctx, t, a, b, str, o = {}) {
  const k = win(t, a, b, 0.5);
  if (k <= 0) return;
  const size = o.size || 46, lh = Math.round(size * 1.36), maxW = 860;
  const L = layoutRich(ctx, str, maxW, { size, weight: 500, bweight: 800 });
  const h = L.lines.length * lh + 76, w = 960, x = (W - w) / 2;
  const cy = o.y || 1360, y = cy - h / 2 + (1 - k) * 40;
  ctx.save(); ctx.globalAlpha = k;
  const dark = o.dark;
  rr(ctx, x + 10, y + 14, w, h, 34); ctx.fillStyle = dark ? 'rgba(0,0,0,0.35)' : 'rgba(30,42,58,0.16)'; ctx.fill();
  rr(ctx, x, y, w, h, 34); ctx.fillStyle = dark ? '#243246' : C.paper; ctx.fill();
  ctx.fillStyle = o.accent || C.coral; rr(ctx, x, y + 28, 10, h - 56, 5); ctx.fill();
  drawRich(ctx, L, W / 2, y + 38 + size, { lh, color: dark ? '#F3EAD8' : C.ink, hl: o.hl || (dark ? C.orange : C.coral) });
  ctx.restore();
}

// Section label at the top of the frame
function header(ctx, label, alpha, o = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = '800 34px Montserrat'; ctx.letterSpacing = '7px'; ctx.textAlign = 'center';
  ctx.fillStyle = o.color || C.ink; ctx.fillText(label, W / 2 + 3.5, 262);
  ctx.letterSpacing = '0px';
  rr(ctx, W / 2 - 40, 288, 80 * clamp(alpha), 8, 4); ctx.fillStyle = o.accent || C.coral; ctx.fill();
  ctx.restore(); ctx.textAlign = 'left';
}
// Big year/number chip
function chip(ctx, txt, x, y, k, o = {}) {
  if (k <= 0) return;
  at(ctx, x, y, 0.6 + 0.4 * k, k, () => {
    ctx.font = `800 ${o.size || 64}px Montserrat`; const w = ctx.measureText(txt).width + 70, h = (o.size || 64) + 44;
    rr(ctx, -w / 2 + 6, -h / 2 + 8, w, h, h / 2); ctx.fillStyle = 'rgba(30,42,58,0.18)'; ctx.fill();
    rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = o.bg || C.coral; ctx.fill();
    ctx.fillStyle = o.color || C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 3);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  });
}
