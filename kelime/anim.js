// Günün kelimesi: 9:16 döngü animasyonu (1080 × 1920).
// Her kare koddan çizilir. renderFrame(t) yalnızca zamana bağlıdır; t = 0 ile t = T aynı kareyi verir,
// böylece Instagram videoyu başa sardığında geçiş görünmez.
(function () {
'use strict';
const W = 1080, H = 1920;
const TL = window.TIMELINE, T = TL.duration;
const WORD = window.WORD;

const C = {
  bg0: '#a3161f', bg1: '#6c0a12', bg2: '#240204',
  red: '#ab1720', redDark: '#760b13', redDeep: '#470509',
  cream: '#f8ecd3', paper: '#f6ecd6', ink: '#3a1712', inkRed: '#7a0f16',
};

// ------------------------------------------------------------------ yardımcılar
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = k => k * k * (3 - 2 * k);
const ease = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = k => 1 - Math.pow(1 - k, 3);
const prog = (t, [a, b]) => clamp((t - a) / (b - a));
// 0'dan 1'e çıkıp tekrar 0'a inen pencere
const win = (t, a, b, c, d) => smooth(prog(t, [a, b])) * (1 - smooth(prog(t, [c, d])));
const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function goldGrad(g, y0, y1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, '#fff0bf');
  gr.addColorStop(0.38, '#e8bf64');
  gr.addColorStop(0.52, '#b7843a');
  gr.addColorStop(0.66, '#dcae55');
  gr.addColorStop(1, '#f7dc96');
  return gr;
}
// ------------------------------------------------------------------ kitap ölçüleri
const BW = 500, BH = 700;           // kapak
const PW = 484, PH = 676;           // sayfa
const TS = 2;                       // doku çözünürlüğü
const D = { x: 12, y: 16 };         // kalınlık yönü (sağ alt)
let TEX = {}, AB_ENTRY = null, BG = null, DOT = null, SCR = null, PARTICLES = [];

function leather(g, w, h, base, seed) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < w * h / 160; i++) {
    const x = r() * w, y = r() * h, s = 0.6 + r() * 2.2;
    g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.05 + r() * 0.07})` : `rgba(255,190,170,${0.025 + r() * 0.04})`;
    g.fillRect(x, y, s, s);
  }
  const sh = g.createLinearGradient(0, 0, w, h);
  sh.addColorStop(0, 'rgba(255,170,150,0.10)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.28)');
  g.fillStyle = sh; g.fillRect(0, 0, w, h);
}

function makeCoverFront() {
  const c = canvas(BW * TS, BH * TS), g = c.getContext('2d');
  g.scale(TS, TS);
  leather(g, BW, BH, C.red, 11);
  // sırt kıvrımı
  const sp = g.createLinearGradient(0, 0, 40, 0);
  sp.addColorStop(0, 'rgba(0,0,0,0.45)'); sp.addColorStop(0.45, 'rgba(0,0,0,0.15)');
  sp.addColorStop(0.55, 'rgba(255,200,180,0.10)'); sp.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sp; g.fillRect(0, 0, 40, BH);
  // başlık
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = '800 54px Montserrat'; g.letterSpacing = '9px';
  const cx = (36 + BW) / 2 + 4.5;
  for (const [txt, y] of [['TÜRKÇE', 330], ['SÖZLÜK', 400]]) {
    g.fillStyle = 'rgba(40,0,0,0.55)'; g.fillText(txt, cx + 1.5, y + 2.5);
    g.fillStyle = goldGrad(g, y - 44, y + 4); g.fillText(txt, cx, y);
  }
  g.letterSpacing = '0px';
  return c;
}

function makeEndpaper() {
  // kapağın iç yüzü; sol sayfa gibi durur (sırt sağda)
  const c = canvas(BW * TS, BH * TS), g = c.getContext('2d');
  g.scale(TS, TS);
  leather(g, BW, BH, C.redDark, 23);
  g.save();
  g.beginPath(); g.rect(14, 14, BW - 14, BH - 28); g.clip();
  g.fillStyle = '#5c0a10'; g.fillRect(0, 0, BW, BH);
  const gut = g.createLinearGradient(BW, 0, BW - 70, 0);
  gut.addColorStop(0, 'rgba(0,0,0,0.5)'); gut.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gut; g.fillRect(BW - 70, 0, 70, BH);
  g.restore();
  return c;
}

function paper(g, side, seed) {
  g.fillStyle = C.paper; g.fillRect(0, 0, PW, PH);
  const r = rng(seed);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(120,80,40,${0.02 + r() * 0.03})`;
    g.fillRect(r() * PW, r() * PH, 1 + r() * 1.5, 1 + r() * 1.5);
  }
  const gx = side === 'R' ? 0 : PW, dir = side === 'R' ? 1 : -1;
  const gut = g.createLinearGradient(gx, 0, gx + dir * 80, 0);
  gut.addColorStop(0, 'rgba(90,50,20,0.38)'); gut.addColorStop(0.35, 'rgba(90,50,20,0.10)'); gut.addColorStop(1, 'rgba(90,50,20,0)');
  g.fillStyle = gut; g.fillRect(0, 0, PW, PH);
  const edge = g.createRadialGradient(PW / 2, PH / 2, PH * 0.35, PW / 2, PH / 2, PH * 0.75);
  edge.addColorStop(0, 'rgba(150,100,50,0)'); edge.addColorStop(1, 'rgba(150,100,50,0.16)');
  g.fillStyle = edge; g.fillRect(0, 0, PW, PH);
}
function bars(g, x, y, w, n, lh, r, firstIndent = 0) {
  g.fillStyle = 'rgba(70,45,35,0.30)';
  for (let i = 0; i < n; i++) {
    const x0 = x + (i === 0 ? firstIndent : 0), full = x + w - x0;
    const len = i === n - 1 ? full * (0.25 + r() * 0.55) : full * (0.92 + r() * 0.08);
    g.fillRect(x0, y + i * lh - 5, Math.max(10, len), 4.2);
  }
}
function pageTex(side, seed, draw) {
  const c = canvas(PW * TS, PH * TS), g = c.getContext('2d');
  g.scale(TS, TS);
  paper(g, side, seed);
  draw(g, rng(seed + 1));
  return c;
}
function header(g, side, l, r, num) {
  g.fillStyle = C.ink; g.font = '600 12px Montserrat'; g.textBaseline = 'alphabetic';
  const x0 = side === 'R' ? 40 : 30, x1 = side === 'R' ? PW - 30 : PW - 40;
  g.textAlign = 'left'; g.fillText(l, x0, 44);
  g.textAlign = 'right'; g.fillText(r, x1, 44);
  g.textAlign = 'center'; g.font = '500 11px Montserrat'; g.fillText(num, PW / 2, PH - 24);
  g.fillStyle = 'rgba(122,15,22,0.6)'; g.fillRect(x0, 54, x1 - x0, 1.2);
}
function columns(g, side, entries, r, mark) {
  const x0 = side === 'R' ? 40 : 30, x1 = side === 'R' ? PW - 30 : PW - 40;
  const gap = 20, cw = (x1 - x0 - gap) / 2, lh = 15.5;
  let col = 0, y = 82;
  for (const e of entries) {
    const n = e.n;
    if (y + (n - 1) * lh > PH - 50) { col++; y = 82; if (col > 1) break; }
    const x = x0 + col * (cw + gap);
    g.font = '700 14px Montserrat'; g.textAlign = 'left'; g.fillStyle = C.inkRed;
    let hw;
    if (e.w) { g.fillText(e.w, x, y); hw = g.measureText(e.w).width; }
    else { hw = e.bw; g.fillStyle = 'rgba(122,15,22,0.55)'; g.fillRect(x, y - 9, hw, 7); }   // okunmayan madde başı
    if (e.w === mark && !AB_ENTRY) AB_ENTRY = { x: x + hw / 2, y: y, w: hw, size: 14 };
    bars(g, x, y, cw, n, lh, r, hw + 7);
    y += n * lh + 7;
  }
}

function makeTextures() {
  TEX.coverFront = makeCoverFront();
  TEX.endpaper = makeEndpaper();
  TEX.title = pageTex('R', 31, (g) => {
    g.textAlign = 'center'; g.fillStyle = C.inkRed;
    g.font = '700 34px Montserrat'; g.letterSpacing = '8px';
    g.fillText('TÜRKÇE', PW / 2 + 4, 270); g.fillText('SÖZLÜK', PW / 2 + 4, 318);
    g.letterSpacing = '0px';
  });
  TEX.imprint = pageTex('L', 41, (g, r) => {
    for (let i = 0; i < 4; i++) bars(g, PW / 2 - 90, 560 + i * 16, 180, 1, 16, r);
  });
  TEX.prefR = pageTex('R', 51, (g, r) => {
    g.textAlign = 'center'; g.fillStyle = C.inkRed; g.font = '700 18px Montserrat'; g.letterSpacing = '5px';
    g.fillText('ÖNSÖZ', PW / 2 + 2.5, 110); g.letterSpacing = '0px';
    let y = 160;
    for (let p = 0; p < 6; p++) { const n = 4 + Math.floor(r() * 4); bars(g, 54, y, PW - 98, n, 16, r, 20); y += n * 16 + 14; }
  });
  TEX.prefL = pageTex('L', 61, (g, r) => {
    let y = 80;
    for (let p = 0; p < 8; p++) { const n = 4 + Math.floor(r() * 4); bars(g, 44, y, PW - 98, n, 16, r, 20); y += n * 16 + 14; if (y > PH - 80) break; }
  });
  TEX.prefR2 = pageTex('R', 71, (g, r) => {
    let y = 80;
    for (let p = 0; p < 8; p++) { const n = 3 + Math.floor(r() * 5); bars(g, 54, y, PW - 98, n, 16, r, 20); y += n * 16 + 14; if (y > PH - 80) break; }
  });
  // kelimenin bulunduğu harf bölümünün açılış sayfası
  const letter = WORD.word[0].toLocaleUpperCase('tr');
  TEX.letterA = pageTex('L', 81, (g) => {
    g.textAlign = 'center'; g.fillStyle = C.inkRed;
    g.font = `800 ${fitFont(g, 800, 300, 'Montserrat', letter, PW - 80)}px Montserrat`;
    g.fillText(letter, PW / 2, 430);
  });
  // "a" bölümünün ilk sayfası gerçek madde başlarıyla çizilir. Kelime bu sayfada değilse
  // komşu maddeler okunmayan çubuklar olarak çizilir ve yalnızca kelimenin kendisi yazılır.
  let entries = [
    ['a', 2], ['a', 1], ['ab', 2], ['aba', 3], ['aba', 2], ['abacı', 1], ['abadi', 2], ['abajur', 2], ['abajurcu', 1],
    ['abaküs', 3], ['abandone', 2], ['abanmak', 3], ['abanoz', 3], ['abanozlaşmak', 1], ['abartı', 2], ['abartıcı', 1],
    ['abartılı', 2], ['abartılmak', 1], ['abartma', 1], ['abartmacı', 1], ['abartmak', 3], ['abazan', 2], ['abdal', 4],
    ['abdallaşmak', 1], ['abdest', 3], ['abdestli', 1], ['abdestsiz', 2],
  ].map(([w, n]) => ({ w, n }));
  const onFirstPage = entries.some(e => e.w === WORD.word);
  if (!onFirstPage) {
    const r = rng(17);
    entries = Array.from({ length: 26 }, (_, i) => ({ bw: 34 + r() * 60, n: 1 + Math.floor(r() * 3) }));
    entries.splice(2, 0, { w: WORD.word, n: 2 });
  }
  TEX.abPage = pageTex('R', 91, (g, r) => {
    if (onFirstPage) header(g, 'R', 'a', 'abdestsiz', '1');
    else header(g, 'R', WORD.word, '', '');
    columns(g, 'R', entries, r, WORD.word);
  });
  // yaprak sırası: üstteki önce
  TEX.leaves = [
    { front: TEX.title, back: TEX.imprint },
    { front: TEX.prefR, back: TEX.prefL },
    { front: TEX.prefR2, back: TEX.letterA },
  ];
}

function makeBackground() {
  BG = canvas(W, H);
  const g = BG.getContext('2d');
  const rg = g.createRadialGradient(W / 2, 880, 40, W / 2, 900, 1300);
  rg.addColorStop(0, C.bg0); rg.addColorStop(0.5, C.bg1); rg.addColorStop(1, C.bg2);
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  const r = rng(5);
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${r() * 0.06})` : `rgba(255,170,140,${r() * 0.025})`;
    g.fillRect(r() * W, r() * H, 1.5, 1.5);
  }
  DOT = canvas(64, 64);
  const d = DOT.getContext('2d'), dg = d.createRadialGradient(32, 32, 0, 32, 32, 32);
  dg.addColorStop(0, 'rgba(255,240,200,1)'); dg.addColorStop(0.18, 'rgba(250,210,130,0.85)');
  dg.addColorStop(0.5, 'rgba(230,170,80,0.18)'); dg.addColorStop(1, 'rgba(230,170,80,0)');
  d.fillStyle = dg; d.fillRect(0, 0, 64, 64);
  const pr = rng(77);
  for (let i = 0; i < 70; i++) PARTICLES.push({
    x: pr() * W, y: pr() * H, ax: 20 + pr() * 50, ay: 30 + pr() * 90, m: 1 + Math.floor(pr() * 2), n: 1 + Math.floor(pr() * 2),
    p1: pr() * TAU, p2: pr() * TAU, tw: 2 + Math.floor(pr() * 5), p3: pr() * TAU, s: 6 + pr() * 16, a: 0.25 + pr() * 0.6,
  });
  SCR = canvas(W, H);
}

// ------------------------------------------------------------------ zaman çizelgesi -> durum
function state(t) {
  const K = TL;
  const s = {};
  const returning = t >= K.back[0];
  s.coverA = Math.PI * (ease(prog(t, K.coverOpen)) - ease(prog(t, K.coverClose)));
  s.leafA = K.leaves.map((iv, i) => Math.PI * (ease(prog(t, iv)) - ease(prog(t, K.leavesBack[i]))));
  s.curlDir = returning ? -1 : 1;
  const open = (1 - Math.cos(s.coverA)) / 2;
  s.open = open;
  s.spine = 290 + 250 * open;
  const out = ease(prog(t, K.toTop)) - ease(prog(t, K.back));
  s.out = out;
  s.cy = 1010 + out * 1350 + 7 * Math.sin(TAU * 3 * t / T);
  s.sc = 1 - 0.1 * out;
  s.L = returning ? 1 - ease(prog(t, K.sink)) : ease(prog(t, K.lift));
  s.P = out;
  s.entryGlow = clamp(prog(t, K.entryGlow) - prog(t, [K.sink[1] - 0.1, K.sink[1] + 0.25]));
  s.rays = Math.max(win(t, 2.6, 3.3, 4.0, 4.9), win(t, K.back[0] + 0.3, K.back[1] + 0.1, K.sink[0] + 0.6, K.sink[1] + 0.5));
  s.leak = Math.max(win(t, 0.25, 0.85, 1.0, 1.6), win(t, K.coverClose[0] + 0.05, K.coverClose[1] - 0.35, K.coverClose[1] - 0.2, K.coverClose[1] + 0.2));
  const shine = ((t - (K.coverClose[1] - 0.2) + T) % T) / 1.3;
  s.coverShine = shine <= 1 ? shine : -1;
  s.secOut = ease(prog(t, K.out));
  return s;
}
const toScreen = (s, x, y) => ({ x: W / 2 + s.sc * (s.spine - W / 2 + x), y: s.cy + s.sc * y });

// ------------------------------------------------------------------ kitap
function drawLeaf(ctx, front, back, th, w, h, curl, ox, oy) {
  const N = 64, f = 2600;
  const xs = [0], zs = [0], ang = [];
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const a = clamp(th - curl * Math.sin(th) * u * u, 0, Math.PI);
    ang.push(a);
    xs.push(xs[i] + Math.cos(a) * w / N);
    zs.push(zs[i] + Math.sin(a) * w / N);
  }
  const tw = front.width, thh = front.height;
  for (let i = 0; i < N; i++) {
    const sa = f / (f - zs[i]), sb = f / (f - zs[i + 1]);
    const xa = ox + xs[i] * sa, xb = ox + xs[i + 1] * sb;
    const sm = (sa + sb) / 2, hh = h * sm;
    const a = ang[i], frontSide = a < Math.PI / 2;
    const tex = frontSide ? front : back;
    const sx = frontSide ? i / N * tw : (1 - (i + 1) / N) * tw;
    const dl = Math.min(xa, xb), dw = Math.abs(xb - xa) + 0.9;
    if (dw < 0.3) continue;
    ctx.drawImage(tex, sx, 0, tw / N, thh, dl, oy - hh / 2, dw, hh);
    const shade = (1 - Math.abs(Math.cos(a))) * 0.5;
    if (shade > 0.01) { ctx.fillStyle = `rgba(35,6,6,${shade})`; ctx.fillRect(dl, oy - hh / 2, dw, hh); }
  }
}
function leafShadow(ctx, th, w, h, ox, oy) {
  const sn = Math.sin(th);
  if (sn < 0.01) return;
  const dir = Math.cos(th) >= 0 ? 1 : -1;
  const reach = w * (Math.abs(Math.cos(th)) + 0.35 * sn);
  const g = ctx.createLinearGradient(ox, 0, ox + dir * reach, 0);
  g.addColorStop(0, `rgba(30,5,5,${0.32 * sn})`); g.addColorStop(1, 'rgba(30,5,5,0)');
  ctx.fillStyle = g;
  ctx.fillRect(dir > 0 ? ox : ox - reach, oy - h / 2, reach, h);
}
function pageBlock(ctx, side, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  const bw = BW - 6, bh = BH - 10;
  const x0 = side === 'R' ? 0 : -bw;
  for (let k = 0; k <= 6; k++) {
    const m = 0.85 - k * 0.11;
    ctx.fillStyle = k % 2 ? '#efe2c4' : '#e4d3ae';
    ctx.fillRect(x0 + D.x * m, -bh / 2 + D.y * m, bw, bh);
  }
  ctx.restore();
}
function drawBook(ctx, t, s) {
  ctx.save();
  ctx.translate(W / 2, s.cy); ctx.scale(s.sc, s.sc); ctx.translate(s.spine - W / 2, 0);
  // gölge
  const scx = BW / 2 * (1 - s.open), sw = BW * (0.62 + 0.62 * s.open);
  const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  sg.addColorStop(0, 'rgba(20,0,0,0.55)'); sg.addColorStop(1, 'rgba(20,0,0,0)');
  ctx.save(); ctx.translate(scx + 20, BH / 2 + 40); ctx.scale(sw, 70); ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(scx + 26, 30); ctx.scale(sw * 0.95, BH * 0.62); ctx.fillStyle = sg; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();

  // arka kapak (en altta)
  const bb = ctx.createLinearGradient(0, -BH / 2, BW, BH / 2);
  bb.addColorStop(0, C.redDark); bb.addColorStop(1, C.redDeep);
  ctx.fillStyle = bb;
  ctx.beginPath(); ctx.roundRect(D.x, -BH / 2 + D.y, BW, BH, [0, 8, 8, 0]); ctx.fill();
  pageBlock(ctx, 'R', 1);
  // sağdaki taban sayfa
  ctx.drawImage(TEX.abPage, 0, -PH / 2, PW, PH);
  if (s.entryGlow > 0 && AB_ENTRY) {
    const ex = AB_ENTRY.x, ey = AB_ENTRY.y - PH / 2 - 5;
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(240,200,110,${0.55 * s.entryGlow})`;
    ctx.beginPath(); ctx.roundRect(ex - AB_ENTRY.w / 2 - 6, ey - 12, AB_ENTRY.w + 12, 22, 4); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 90);
    eg.addColorStop(0, `rgba(255,200,110,${0.55 * s.entryGlow})`); eg.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = eg; ctx.fillRect(ex - 90, ey - 90, 180, 180);
    ctx.restore();
  }
  // sol yığın: kapak, ardından yapraklar
  const cOff = { x: D.x * (1 - Math.cos(s.coverA)) / 2, y: D.y * (1 - Math.cos(s.coverA)) / 2 };
  if (s.coverA > Math.PI / 2) drawLeaf(ctx, TEX.coverFront, TEX.endpaper, s.coverA, BW, BH, 0, cOff.x, cOff.y);
  pageBlock(ctx, 'L', smooth(clamp((s.leafA[0] - Math.PI / 2) / (Math.PI / 2))));
  s.leafA.forEach((a, i) => {
    if (a > Math.PI / 2) { leafShadow(ctx, a, PW, PH, 0, 0); drawLeaf(ctx, TEX.leaves[i].front, TEX.leaves[i].back, a, PW, PH, 0.55 * s.curlDir, 0, 0); }
  });
  for (let i = s.leafA.length - 1; i >= 0; i--) {
    const a = s.leafA[i];
    if (a <= Math.PI / 2) { if (a > 0.001) leafShadow(ctx, a, PW, PH, 0, 0); drawLeaf(ctx, TEX.leaves[i].front, TEX.leaves[i].back, a, PW, PH, 0.55 * s.curlDir, 0, 0); }
  }
  if (s.coverA <= Math.PI / 2) {
    if (s.coverA > 0.001) leafShadow(ctx, s.coverA, BW, BH, 0, 0);
    drawLeaf(ctx, TEX.coverFront, TEX.endpaper, s.coverA, BW, BH, 0, cOff.x, cOff.y);
    // kapalıyken: parlama ve kenardan sızan ışık
    if (s.coverA < 0.05 && s.coverShine >= 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, -BH / 2, BW, BH); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      const p = lerp(-BW * 0.8, BW * 1.8, ease(s.coverShine));
      const g = ctx.createLinearGradient(p - 160, -BH / 2, p + 160, BH / 2);
      g.addColorStop(0, 'rgba(255,210,150,0)'); g.addColorStop(0.5, 'rgba(255,215,160,0.16)'); g.addColorStop(1, 'rgba(255,210,150,0)');
      ctx.fillStyle = g; ctx.fillRect(0, -BH / 2, BW, BH);
      ctx.restore();
    }
  }
  if (s.leak > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lx = BW + 4 + cOff.x;
    const lg = ctx.createLinearGradient(lx - 10, 0, lx + 70, 0);
    lg.addColorStop(0, `rgba(255,205,120,${0.75 * s.leak})`); lg.addColorStop(1, 'rgba(255,205,120,0)');
    ctx.fillStyle = lg; ctx.fillRect(lx - 10, -BH / 2 + 10, 80, BH - 4);
    const lg2 = ctx.createLinearGradient(0, BH / 2 + 2, 0, BH / 2 + 60);
    lg2.addColorStop(0, `rgba(255,205,120,${0.4 * s.leak})`); lg2.addColorStop(1, 'rgba(255,205,120,0)');
    ctx.fillStyle = lg2; ctx.fillRect(10, BH / 2, BW, 60);
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ ışık, toz, arka plan
function drawBackground(ctx) {
  ctx.drawImage(BG, 0, 0);
}
function drawRays(ctx, s, x, y, k) {
  if (k <= 0.001) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const R = 1100;
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, `rgba(255,214,140,${0.30 * k})`); g.addColorStop(0.35, `rgba(240,170,80,${0.10 * k})`); g.addColorStop(1, 'rgba(240,170,80,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 18; i++) {
    const a = -Math.PI / 2 + (i - 8.5) * 0.17 + 0.03 * Math.sin(i * 7.1), wd = 0.025 + 0.02 * ((i * 37) % 5) / 5;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a - wd) * R, y + Math.sin(a - wd) * R);
    ctx.lineTo(x + Math.cos(a + wd) * R, y + Math.sin(a + wd) * R);
    ctx.closePath();
  }
  ctx.fill();
  const g2 = ctx.createRadialGradient(x, y, 0, x, y, 420);
  g2.addColorStop(0, `rgba(255,220,150,${0.55 * k})`); g2.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = g2; ctx.fillRect(x - 420, y - 420, 840, 840);
  ctx.restore();
}
function drawParticles(ctx, t, boost) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of PARTICLES) {
    const ph = TAU * t / T;
    const x = p.x + p.ax * Math.sin(p.m * ph + p.p1), y = p.y + p.ay * Math.sin(p.n * ph + p.p2);
    const a = p.a * (0.55 + 0.45 * Math.sin(p.tw * ph + p.p3)) * (0.7 + 0.5 * boost);
    ctx.globalAlpha = clamp(a);
    ctx.drawImage(DOT, x - p.s / 2, y - p.s / 2, p.s, p.s);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ metin
function fitFont(ctx, weight, size, family, text, maxW, ls = 0) {
  let sz = size;
  for (;;) {
    ctx.font = `${weight} ${sz}px ${family}`; ctx.letterSpacing = ls + 'px';
    if (ctx.measureText(text).width <= maxW || sz <= 20) break;
    sz -= 2;
  }
  ctx.letterSpacing = '0px';
  return sz;
}
// renkli parçalardan oluşan tek satır, ortalanmış
function runsLine(ctx, runs, cx, y, alpha) {
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let tot = 0;
  for (const r of runs) { ctx.font = r.font; r.wd = r.gap ?? ctx.measureText(r.t).width; tot += r.wd; }
  let x = cx - tot / 2;
  ctx.globalAlpha = alpha;
  for (const r of runs) {
    if (r.t) {
      ctx.font = r.font;
      ctx.fillStyle = r.gold ? goldGrad(ctx, y - r.size * 0.8, y + r.size * 0.15) : (r.color || C.cream);
      if (r.dir) ctx.direction = r.dir;
      ctx.textAlign = r.dir === 'rtl' ? 'right' : 'left';
      ctx.fillText(r.t, r.dir === 'rtl' ? x + r.wd : x, y);
      ctx.direction = 'ltr';
    }
    x += r.wd;
  }
  ctx.restore();
}
function drawLabel(ctx, text, y, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = '600 34px Montserrat'; ctx.letterSpacing = '12px'; ctx.textAlign = 'center';
  ctx.fillStyle = goldGrad(ctx, y - 26, y + 2);
  ctx.fillText(text, W / 2 + 6, y);
  ctx.letterSpacing = '0px';
  ctx.restore();
}
function revealIn(ctx, k, dy, fn) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(0, (1 - easeOut(k)) * dy);
  if (k < 1) ctx.filter = `blur(${(1 - k) * 8}px)`;
  fn(easeOut(k));
  ctx.restore();
}
function sentenceWords(text, hl) {
  // vurguyu ayrı bir kelime olarak ara (ör. "ab", "kervan" ya da "abanmak" içinde değil)
  const isLetter = c => !!c && /\p{L}/u.test(c);
  let i0 = -1;
  for (let i = hl ? text.indexOf(hl) : -1; i >= 0; i = text.indexOf(hl, i + 1))
    if (!isLetter(text[i - 1]) && !isLetter(text[i + hl.length])) { i0 = i; break; }
  if (i0 < 0 && hl) i0 = text.indexOf(hl);
  const i1 = i0 + (hl ? hl.length : 0);
  const words = [];
  let cur = [], run = null;
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i], g = i >= i0 && i < i1;
    if ((ch === ' ' && !g) || ch === undefined) { if (run) cur.push(run); if (cur.length) words.push(cur); cur = []; run = null; continue; }
    if (!run || run.gold !== g) { if (run) cur.push(run); run = { t: '', gold: g }; }
    run.t += ch;
  }
  return words;
}
function drawSentence(ctx, t, t0, cx, y, maxW, alphaAll) {
  const words = sentenceWords('“' + WORD.example.text + '”', WORD.example.highlight);
  const size = 54, lh = 80;
  const fontN = `italic 400 ${size}px Montserrat`, fontG = `italic 700 ${size}px Montserrat`;
  ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.font = fontN; const sp = ctx.measureText(' ').width;
  const meas = words.map(w => w.map(r => { ctx.font = r.gold ? fontG : fontN; return ctx.measureText(r.t).width; }));
  const lines = []; let line = [], lw = 0;
  words.forEach((w, i) => {
    const ww = meas[i].reduce((a, b) => a + b, 0);
    if (line.length && lw + sp + ww > maxW) { lines.push({ line, lw }); line = []; lw = 0; }
    lw += (line.length ? sp : 0) + ww; line.push(i);
  });
  if (line.length) lines.push({ line, lw });
  let n = 0;
  lines.forEach((L, li) => {
    let x = cx - L.lw / 2; const yy = y + li * lh;
    for (const wi of L.line) {
      const k = clamp((t - t0 - n * 0.07) / 0.5); n++;
      if (k > 0) {
        ctx.globalAlpha = alphaAll * easeOut(k);
        let xx = x; const dy = (1 - easeOut(k)) * 18;
        words[wi].forEach((r, ri) => {
          ctx.font = r.gold ? fontG : fontN;
          ctx.fillStyle = r.gold ? goldGrad(ctx, yy - size * 0.8, yy + size * 0.2) : C.cream;
          ctx.fillText(r.t, xx, yy + dy);
          xx += meas[wi][ri];
        });
      }
      x += meas[wi].reduce((a, b) => a + b, 0) + sp;
    }
  });
  ctx.restore();
  return y + (lines.length - 1) * lh;
}
function drawRipples(ctx, t, t0, x, y, alpha) {
  if (alpha <= 0 || t < t0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const st = t0 + (i < 3 ? i * 0.28 : 1.2 + (i - 3) * 1.6);
    const k = (t - st) / 2.4;
    if (k <= 0 || k >= 1) continue;
    const r = 30 + easeOut(k) * 400;
    ctx.strokeStyle = `rgba(240,196,110,${alpha * (1 - k) * (i < 3 ? 0.55 : 0.28)})`;
    ctx.lineWidth = 2.2 * (1 - k) + 0.6;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.13, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}
function drawDrop(ctx, t, t0, x, y0, y1) {
  const k = (t - t0) / 0.42;
  if (k < 0 || k > 1) return;
  const y = lerp(y0, y1, k * k);
  ctx.save();
  ctx.globalAlpha = smooth(clamp(k * 5)) * (1 - smooth(clamp((k - 0.85) / 0.15)));
  ctx.translate(x, y); const s = 1 + k * 0.25;
  ctx.scale(s * 0.85, s * (1 + k * 0.3));
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.bezierCurveTo(6, -12, 15, -2, 15, 8); ctx.arc(0, 8, 15, 0, Math.PI); ctx.bezierCurveTo(-15, -2, -6, -12, 0, -26);
  ctx.fillStyle = goldGrad(ctx, -26, 23); ctx.shadowColor = 'rgba(255,200,110,0.8)'; ctx.shadowBlur = 20; ctx.fill();
  ctx.restore();
}

function drawWord(ctx, t, s) {
  if (s.L <= 0.001) return;
  const e = AB_ENTRY, ep = toScreen(s, e.x, e.y - PH / 2);
  const hover = { x: W / 2, y: 600 }, top = { x: W / 2, y: 440 };
  let x = lerp(ep.x, hover.x, smooth(s.L)), y = lerp(ep.y, hover.y, easeOut(s.L));
  x = lerp(x, top.x, s.P); y = lerp(y, top.y, s.P);
  const big = fitFont(ctx, 700, 300, 'Montserrat', WORD.word, 940, 4);
  const size = lerp(lerp(e.size * s.sc, big, s.L), big * 0.86, s.P);
  ctx.save();
  ctx.font = `700 ${size}px Montserrat`; ctx.letterSpacing = (size * 0.015) + 'px'; ctx.textAlign = 'center';
  ctx.globalAlpha = smooth(clamp(s.L / 0.12));
  const glow = 0.35 + 0.5 * Math.sin(Math.PI * clamp(s.L)) + 0.15 * s.P;
  ctx.shadowColor = `rgba(255,190,100,${glow})`; ctx.shadowBlur = size * 0.22;
  ctx.fillStyle = goldGrad(ctx, y - size * 0.74, y + size * 0.04);
  ctx.fillText(WORD.word, x, y);
  ctx.restore();
  // yukarı yerleşince bir kez parlama
  const sh = prog(t, [5.0, 6.1]);
  if (sh > 0 && sh < 1) {
    const g = SCR.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, 700);
    g.globalCompositeOperation = 'source-over';
    g.font = `700 ${size}px Montserrat`; g.letterSpacing = (size * 0.015) + 'px'; g.textAlign = 'center'; g.fillStyle = '#fff';
    g.fillText(WORD.word, x, y);
    g.globalCompositeOperation = 'source-in';
    const p = lerp(x - size * 1.2, x + size * 1.2, ease(sh));
    const lg = g.createLinearGradient(p - 90, y - size, p + 90, y);
    lg.addColorStop(0, 'rgba(255,250,230,0)'); lg.addColorStop(0.5, 'rgba(255,250,230,0.85)'); lg.addColorStop(1, 'rgba(255,250,230,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, 700);
    g.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8 * (1 - s.secOut);
    ctx.drawImage(SCR, 0, 0, W, 700, 0, 0, W, 700); ctx.restore();
  }
}

// Kısa tanım tek satırda büyük yazılır; sığmazsa iki satıra bölünür (en fazla iki satır, gerekirse küçülür).
function meaningLines(ctx) {
  const m = WORD.meaning, single = fitFont(ctx, 600, 132, 'Montserrat', m, 940);
  if (single >= 88) return [{ t: m, size: single, y: 1080 }];
  const words = m.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    ctx.font = '600 70px Montserrat';
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (!best || w < best.w) best = { a, b, w };
  }
  if (!best) return [{ t: m, size: single, y: 1080 }];
  const size = Math.min(70, Math.floor(70 * 940 / best.w));
  return [{ t: best.a, size, y: 1040 }, { t: best.b, size, y: 1040 + size * 1.2 }];
}
function drawSections(ctx, t, s) {
  const out = s.secOut, A = 1 - out;
  if (A <= 0) return;
  const [t1, t2, t3] = TL.sections;
  ctx.save();
  ctx.translate(0, -out * 30);
  if (out > 0) ctx.filter = `blur(${out * 10}px)`;
  // KÖKEN
  const k1 = prog(t, [t1, t1 + 0.8]);
  drawLabel(ctx, 'KÖKEN', 620, A * smooth(k1));
  revealIn(ctx, prog(t, [t1 + 0.25, t1 + 1.0]), 26, k => {
    const sz = fitFont(ctx, 600, 74, 'Montserrat', WORD.origin.lang, 940);
    runsLine(ctx, [{ t: WORD.origin.lang, font: `600 ${sz}px Montserrat`, size: sz }], W / 2, 712, A * k);
  });
  revealIn(ctx, prog(t, [t1 + 0.55, t1 + 1.35]), 26, k => {
    const runs = [{ t: WORD.origin.translit, font: 'italic 500 58px Montserrat', gold: true, size: 58 }];
    if (WORD.origin.native) runs.push({ gap: 26 }, { t: '·', font: '400 50px Montserrat', color: 'rgba(248,236,211,0.6)' }, { gap: 26 },
      { t: WORD.origin.native, font: '600 72px "Noto Naskh Arabic"', gold: true, size: 72, dir: 'rtl' });
    runsLine(ctx, runs, W / 2, 800, A * k);
  });
  // ANLAM
  const k2 = prog(t, [t2, t2 + 0.8]);
  drawLabel(ctx, 'ANLAM', 950, A * smooth(k2));
  const water = WORD.motif === 'water';
  const mt = t2 + (water ? 0.72 : 0.25);
  if (water) {
    drawDrop(ctx, t, t2 + 0.3, W / 2, 975, 1088);
    drawRipples(ctx, t, t2 + 0.72, W / 2, 1096, A);
  }
  revealIn(ctx, prog(t, [mt, mt + 0.8]), 22, k => {
    const lines = meaningLines(ctx);
    lines.forEach((l, i) => runsLine(ctx, [{ t: l.t, font: `600 ${l.size}px Montserrat`, size: l.size }], W / 2, l.y, A * k));
  });
  // ÖRNEK
  const k3 = prog(t, [t3, t3 + 0.8]);
  drawLabel(ctx, 'ÖRNEK', 1250, A * smooth(k3));
  drawSentence(ctx, t, t3 + 0.3, W / 2, 1345, 940, A);
  ctx.restore();
}

// ------------------------------------------------------------------ kare
let ctx;
window.init = function (cv) {
  ctx = cv.getContext('2d');
  makeTextures();
  makeBackground();
};
// Kapak görseli: kelime (isteğe bağlı olarak altında kökeni), dikey ortada.
// Bütün kapaklarda punto aynıdır, böylece Reels ızgarasında yan yana dizilen kapaklar birbirini tutar.
// Tek satıra sığmayan kelime küçültülmez; hece sınırından (ya da boşluktan) iki satıra bölünür.
const COVER_SIZE = 180, COVER_MAXW = 920;
function syllableBreaks(w) {
  // Türkçe heceleme: ünlüler arasında tek ünsüz sonraki heceye geçer, birden çok ünsüzün sonuncusu geçer.
  const V = /[aeıioöuüâîû]/i, vowels = [];
  for (let i = 0; i < w.length; i++) if (V.test(w[i])) vowels.push(i);
  const out = [];
  for (let k = 1; k < vowels.length; k++) {
    const a = vowels[k - 1], b = vowels[k], gap = w.slice(a + 1, b);
    if (/[^\p{L}]/u.test(gap)) continue;          // tire ya da kesme işareti: o noktadan ayrıca bölünür
    out.push(b - (b - a > 1 ? 1 : 0));
  }
  return out;
}
function coverLines(ctx, word) {
  ctx.font = `700 ${COVER_SIZE}px Montserrat`; ctx.letterSpacing = (COVER_SIZE * 0.015) + 'px';
  const wd = t => ctx.measureText(t).width;
  if (wd(word) <= COVER_MAXW) return [word];
  const cands = [];
  for (let i = 1; i < word.length; i++) {
    if (word[i - 1] === ' ') cands.push([word.slice(0, i - 1), word.slice(i)]);
    else if (word[i - 1] === '-') cands.push([word.slice(0, i), word.slice(i)]);
  }
  if (!cands.length) for (const b of syllableBreaks(word)) cands.push([word.slice(0, b) + '-', word.slice(b)]);
  if (!cands.length) return [word];
  cands.sort((p, q) => Math.max(wd(p[0]), wd(p[1])) - Math.max(wd(q[0]), wd(q[1])));
  return cands[0];
}
window.renderCover = function (withOrigin) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  drawBackground(ctx);
  drawParticles(ctx, 0, 0);
  ctx.save();
  const lines = coverLines(ctx, WORD.word);
  let size = COVER_SIZE;
  const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
  if (widest > COVER_MAXW) size = Math.floor(COVER_SIZE * COVER_MAXW / widest);   // yalnızca çok istisnai uzunlukta
  const lh = size * 1.08, originGap = withOrigin ? 130 : 0;
  const block = (lines.length - 1) * lh + originGap;
  let y = 960 + size * 0.35 - block / 2;
  ctx.font = `700 ${size}px Montserrat`; ctx.letterSpacing = (size * 0.015) + 'px'; ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,190,100,0.5)'; ctx.shadowBlur = size * 0.22;
  for (const l of lines) {
    ctx.fillStyle = goldGrad(ctx, y - size * 0.74, y + size * 0.04);
    ctx.fillText(l, W / 2 + size * 0.0075, y);
    y += lh;
  }
  ctx.restore();
  if (!withOrigin) return;
  const sz = fitFont(ctx, 600, 72, 'Montserrat', WORD.origin.lang, 940);
  runsLine(ctx, [{ t: WORD.origin.lang, font: `600 ${sz}px Montserrat`, size: sz }], W / 2, y - lh + originGap, 1);
};
window.renderFrame = function (t) {
  t = ((t % T) + T) % T;
  const s = state(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  drawBackground(ctx);
  drawParticles(ctx, t, s.rays);
  const rc = toScreen(s, 0, -40);
  drawRays(ctx, s, rc.x, rc.y, s.rays * (1 - 0.4 * s.out));
  drawBook(ctx, t, s);
  drawSections(ctx, t, s);
  drawWord(ctx, t, s);
};
})();
