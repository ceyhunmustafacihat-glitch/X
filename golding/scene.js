'use strict';
// William Golding sample reel: photos with gentle camera moves, a house that draws
// itself, a line-art conch for "Sineklerin Tanrısı", and animated typography.
// Uses helpers from animation/core.js.

const G = {};
const CX = W / 2;
const INK = '#0b0d14', PAPER = '#f4ead6';

function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}
async function initGolding(canvas) {
  G.out = { c: canvas, g: canvas.getContext('2d') };
  if (!GrainTiles.length) buildGrain();
  G.portrait = await loadImage(IMAGES.portrait);
  G.house = await loadImage(IMAGES.house);
  G.sketch = await loadImage(IMAGES.houseSketch);
  // blurred, darkened backdrops made once
  G.portraitBg = backdrop(G.portrait);
  G.houseBg = backdrop(G.house);
}
function backdrop(im) {
  const c = makeCanvas(W / 4, H / 4), g = c.getContext('2d');
  const s = Math.max(c.width / im.width, c.height / im.height);
  g.filter = 'blur(10px) brightness(0.42) saturate(0.85)';
  g.drawImage(im, (c.width - im.width * s) / 2, (c.height - im.height * s) / 2, im.width * s, im.height * s);
  return c;
}

// ---------- typography ----------
function wrap(g, text, maxW) {
  const words = text.split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function label(g, text, y, a, color = '#d9b26a') {
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.fillStyle = color;
  g.font = '600 26px Montserrat';
  spacedText(g, text, CX + 4, y, 7);
  g.restore();
}
// a text block that rises and fades in, then out
function card(g, t, span, items) {
  const a = win(span[0], span[0] + 0.45, span[1] - 0.35, span[1], t);
  if (a <= 0.01) return;
  const rise = (1 - easeOut(clamp((t - span[0]) / 0.6))) * 26;
  g.save();
  g.translate(0, rise);
  for (const it of items) {
    const k = ss(span[0] + (it.d || 0), span[0] + (it.d || 0) + 0.45, t) * a;
    if (k <= 0.01) continue;
    if (it.label) { label(g, it.label, it.y, k); continue; }
    g.globalAlpha = k; g.textAlign = 'center'; g.fillStyle = it.color || PAPER; g.font = it.font;
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 12;
    const lines = it.maxW ? wrap(g, it.text, it.maxW) : [it.text];
    lines.forEach((ln, i) => g.fillText(ln, CX, it.y + i * (it.lh || 0)));
    g.shadowBlur = 0;
  }
  g.restore();
}

// ---------- motifs ----------
function drawWaves(g, t, y0, amp, alpha, n = 5) {
  g.save();
  g.lineWidth = 1.6;
  for (let i = 0; i < n; i++) {
    const y = y0 + i * 26, ph = t * (0.6 + i * 0.12) + i * 1.7;
    g.strokeStyle = `rgba(217,178,106,${alpha * (1 - i / (n + 1))})`;
    g.beginPath();
    for (let x = -20; x <= W + 20; x += 12) g.lineTo(x, y + Math.sin(x / 120 + ph) * amp * (1 - i * 0.12) + Math.sin(x / 47 - ph * 1.3) * amp * 0.25);
    g.stroke();
  }
  g.restore();
}
function framedPhoto(g, im, x, y, w, h, kb, enter) {
  // kb: Ken Burns progress 0..1; enter: 0..1 slide/fade in
  g.save();
  g.globalAlpha *= enter;
  g.translate(0, (1 - easeOut(enter)) * 60);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
  g.fillStyle = PAPER; g.fillRect(x - 12, y - 12, w + 24, h + 24);
  g.shadowColor = 'transparent';
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const s = 1.02 + kb * 0.07, cx = x + w / 2 + (kb - 0.5) * 18, cy = y + h / 2 - kb * 12;
  g.translate(cx, cy); g.scale(s, s);
  g.filter = 'contrast(1.06) saturate(0.95) sepia(0.12)';
  g.drawImage(im, -w / 2, -h / 2, w, h);
  g.filter = 'none';
  g.restore();
  const vg = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = vg; g.fillRect(x, y, w, h);
  g.restore();
}
function fullBg(g, c, zoom) {
  g.save();
  g.translate(CX, H / 2); g.scale(zoom, zoom);
  g.drawImage(c, -W / 2, -H / 2, W, H);
  g.restore();
}

// ---------- scenes ----------
function sceneIntro(g, t) {
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  drawWaves(g, t, 1460, 14, 0.35);
  const name = 'William Golding';
  g.save();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = '600 124px "Cormorant Garamond"';
  const total = g.measureText(name).width;
  let x = CX - total / 2;
  [...name].forEach((ch, i) => {
    const t0 = 0.3 + i * 0.06, k = ss(t0, t0 + 0.5, t);
    g.globalAlpha = k;
    g.fillStyle = PAPER;
    g.shadowColor = 'rgba(217,178,106,0.35)'; g.shadowBlur = 24;
    g.fillText(ch, x, 860 + (1 - k) * 24);
    x += g.measureText(ch).width;
  });
  g.restore();
  // rule and years
  const r = easeInOut(inv(1.0, 1.6, t));
  g.strokeStyle = 'rgba(217,178,106,0.85)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(CX - 200 * r, 920); g.lineTo(CX + 200 * r, 920); g.stroke();
  g.save(); g.globalAlpha = ss(1.2, 1.7, t); g.textAlign = 'center'; g.fillStyle = '#d9b26a'; g.font = '500 34px Montserrat';
  spacedText(g, '1911 – 1993', CX + 5, 985, 10); g.restore();
  // typed subtitle
  const sub = "Sineklerin Tanrısı'nın yazarı";
  const n = Math.floor(sub.length * inv(TL.subtitleType[0], TL.subtitleType[1], t));
  if (n > 0) {
    g.save(); g.textAlign = 'center'; g.fillStyle = PAPER; g.font = 'italic 500 54px "Cormorant Garamond"';
    const shown = sub.slice(0, n), fullW = g.measureText(sub).width;
    g.textAlign = 'left'; g.fillText(shown, CX - fullW / 2, 1085);
    if (t < TL.subtitleType[1] + 0.6 && Math.floor(t * 3) % 2 === 0) {
      g.fillStyle = '#d9b26a'; g.fillRect(CX - fullW / 2 + g.measureText(shown).width + 6, 1046, 3, 46);
    }
    g.restore();
  }
}

function scenePortrait(g, t) {
  const [a, b] = TL.portrait;
  fullBg(g, G.portraitBg, 1.08 + 0.04 * inv(a, b, t));
  drawWaves(g, t, 1640, 10, 0.2, 4);
  const fw = 860, fh = Math.round(fw * G.portrait.height / G.portrait.width);
  framedPhoto(g, G.portrait, CX - fw / 2, 250, fw, fh, inv(a, b, t), ss(a, a + 0.7, t));
  const ty = 250 + fh + 120;
  card(g, t, TL.cards[0], [
    { label: 'DOĞUM', y: ty },
    { font: '600 72px "Cormorant Garamond"', text: '19 Eylül 1911', y: ty + 82, d: 0.1 },
    { font: '400 32px Montserrat', text: 'Newquay, Cornwall · İngiltere', y: ty + 136, d: 0.25, color: 'rgba(244,234,214,0.85)' }
  ]);
  card(g, t, TL.cards[1], [
    { label: 'HAYATI', y: ty },
    { font: '600 68px "Cormorant Garamond"', text: 'Öğretmen ve denizci', y: ty + 82, d: 0.1 },
    { font: '400 30px Montserrat', text: "Salisbury'de öğretmenlik yaptı; II. Dünya Savaşı'nda Kraliyet Donanması'nda görev aldı.", y: ty + 136, d: 0.25, maxW: 820, lh: 42, color: 'rgba(244,234,214,0.85)' }
  ]);
}

// the conch from "Lord of the Flies", drawn in gold line art
const CONCH = (() => {
  const P = s => new Path2D(s);
  return [
    { p: P('M -220 -10 C -170 -40 -110 -70 -40 -95 C 20 -115 90 -150 150 -140 C 200 -130 232 -90 212 -40 C 198 0 230 40 242 80 C 200 70 140 72 90 82 C 20 96 -60 72 -122 42 C -170 20 -200 6 -220 -10 Z'), len: 1500 },
    { p: P('M 44 -78 C 110 -112 176 -96 186 -42 C 192 8 170 48 120 60 C 92 30 62 -20 44 -78 Z'), len: 600, glow: true },
    { p: P('M -186 -26 C -180 -10 -178 4 -184 14 M -152 -44 C -144 -22 -142 2 -150 22 M -114 -62 C -104 -32 -102 6 -112 36 M -72 -80 C -60 -40 -58 10 -70 52'), len: 700 },
    { p: P('M -40 -95 C -30 -112 -16 -112 -8 -100 M 4 -106 C 14 -124 30 -124 38 -112 M 50 -120 C 62 -138 80 -138 88 -126'), len: 300 },
    { p: P('M -150 8 C -80 -6 0 -10 60 2 M -120 30 C -60 22 0 22 70 40 M -60 54 C 0 50 40 56 90 70'), len: 600 }
  ];
})();
function sceneBook(g, t) {
  const [a, b] = TL.book;
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  // horizon of a lonely island
  const hz = 1330;
  const sea = g.createLinearGradient(0, hz, 0, H);
  sea.addColorStop(0, '#101828'); sea.addColorStop(1, '#070a12');
  g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
  g.save(); g.globalCompositeOperation = 'screen';
  drawGlow(g, CX, hz - 10, 520, '#3b4f7a', 0.5);
  g.restore();
  drawWaves(g, t, hz + 30, 9, 0.45, 7);
  // conch
  const cx = CX, cy = 640, sc = 1.45 + 0.04 * inv(a, b, t);
  g.save();
  g.translate(cx, cy); g.scale(sc, sc); g.rotate(-0.32 + 0.02 * Math.sin(t * 0.8));
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(240,190,100,0.7)'; g.shadowBlur = 14;
  CONCH.forEach((s, i) => {
    const k = easeInOut(inv(TL.conch[0] + i * 0.18, TL.conch[0] + i * 0.18 + 1.0, t));
    if (k <= 0) return;
    if (s.glow && k >= 1) {
      g.save(); g.shadowBlur = 0;
      const gr = g.createLinearGradient(40, -110, 190, 60);
      gr.addColorStop(0, `rgba(255,200,170,${0.28 * ss(TL.conch[1], TL.conch[1] + 0.6, t)})`); gr.addColorStop(1, 'rgba(255,200,170,0)');
      g.fillStyle = gr; g.fill(s.p); g.restore();
    }
    g.strokeStyle = '#e6c27a'; g.lineWidth = 2.6 / sc * 1.4;
    g.setLineDash([s.len * k, s.len * 2]);
    g.stroke(s.p);
  });
  g.setLineDash([]);
  g.restore();
  card(g, t, [a + 0.4, b], [
    { label: 'İLK ROMANI · 1954', y: 960 },
    { font: '600 92px "Cormorant Garamond"', text: 'Sineklerin Tanrısı', y: 1060, d: 0.15 },
    { font: 'italic 500 38px "Cormorant Garamond"', text: 'Lord of the Flies', y: 1112, d: 0.3, color: 'rgba(217,178,106,0.9)' },
    { font: '400 30px Montserrat', text: 'Issız bir adaya düşen çocukların hikâyesi; insan doğasının karanlık yüzüne dair bir klasik.', y: 1195, d: 0.6, maxW: 800, lh: 42, color: 'rgba(244,234,214,0.88)' }
  ]);
}

function sceneHouse(g, t) {
  const [a, b] = TL.house;
  fullBg(g, G.houseBg, 1.06 + 0.04 * inv(a, b, t));
  const fw = 900, fh = Math.round(fw * G.house.height / G.house.width), x = CX - fw / 2, y = 330;
  const enter = ss(a, a + 0.5, t), kb = inv(a, b, t);
  // the frame and the drawing come first, the photograph fades in under the lines
  g.save();
  g.globalAlpha = enter;
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
  g.fillStyle = PAPER; g.fillRect(x - 12, y - 12, fw + 24, fh + 24);
  g.shadowColor = 'transparent';
  g.fillStyle = '#0d1018'; g.fillRect(x, y, fw, fh);
  g.restore();
  const photoA = ss(TL.photo[0], TL.photo[1], t);
  if (photoA > 0.001) { g.save(); g.globalAlpha = photoA; framedPhoto(g, G.house, x, y, fw, fh, kb, 1); g.restore(); }
  const sk = inv(TL.sketch[0], TL.sketch[1], t), skA = enter * (1 - ss(TL.photo[1] - 0.2, TL.photo[1] + 0.5, t));
  if (sk > 0 && skA > 0.01) {
    // reveal the traced lines with a soft diagonal sweep
    const L = layer('sketch', fw, fh);
    const s = 1.02 + kb * 0.07;
    L.g.translate(fw / 2 + (kb - 0.5) * 18, fh / 2 - kb * 12); L.g.scale(s, s);
    L.g.drawImage(G.sketch, -fw / 2, -fh / 2, fw, fh);
    L.g.setTransform(1, 0, 0, 1, 0, 0);
    L.g.globalCompositeOperation = 'destination-in';
    const pos = easeInOut(sk) * (fw + fh + 400) - 200;
    const gr = L.g.createLinearGradient(pos - 200, pos - 200, pos + 200, pos + 200);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    L.g.fillStyle = gr; L.g.fillRect(0, 0, fw, fh);
    g.save(); g.globalAlpha = skA; g.drawImage(L.c, x, y); g.restore();
  }
  const ty = y + fh + 150;
  // location pin
  const pa = ss(TL.photo[0] + 0.4, TL.photo[0] + 0.9, t) * (1 - ss(b - 0.35, b, t));
  if (pa > 0.01) {
    g.save(); g.globalAlpha = pa;
    const px = CX, py = ty - 70 - (1 - easeOut(pa)) * 30;
    g.fillStyle = '#d9b26a';
    g.beginPath(); g.arc(px, py - 18, 18, Math.PI, 0); g.lineTo(px, py + 14); g.closePath(); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(px, py - 18, 7, 0, TAU); g.fill();
    g.restore();
  }
  card(g, t, [TL.photo[0] + 0.5, b], [
    { label: 'ÇOCUKLUĞUNUN GEÇTİĞİ EV', y: ty },
    { font: '600 64px "Cormorant Garamond"', text: '29 The Green, Marlborough', y: ty + 78, d: 0.12 },
    { font: '400 30px Montserrat', text: "Babasının öğretmen olduğu Marlborough'da büyüdü. Bugün evin duvarında mavi bir hatıra plaketi var.", y: ty + 138, d: 0.35, maxW: 840, lh: 42, color: 'rgba(244,234,214,0.88)' }
  ]);
}

function sceneAwards(g, t) {
  const [a, b] = TL.awards;
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'screen';
  drawGlow(g, CX, 900, 700, '#2a2440', 0.6);
  g.restore();
  card(g, t, [a + 0.05, b], [{ label: 'ÖDÜLLER', y: 600 }]);
  const items = [['1980', 'Booker Ödülü'], ['1983', 'Nobel Edebiyat Ödülü'], ['1988', '“Sir” unvanı']];
  const x0 = 260, y0 = 760, gap = 210;
  const out = 1 - ss(b - 0.35, b, t);
  // the line grows down the page
  const lineK = easeInOut(inv(TL.awardItems[0] - 0.2, TL.awardItems[2] + 0.3, t));
  g.save(); g.globalAlpha = out;
  g.strokeStyle = 'rgba(217,178,106,0.6)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x0, y0 - 40); g.lineTo(x0, y0 - 40 + lineK * (gap * 2 + 80)); g.stroke();
  items.forEach(([yr, txt], i) => {
    const k = ss(TL.awardItems[i], TL.awardItems[i] + 0.45, t);
    if (k <= 0.01) return;
    const y = y0 + i * gap;
    g.globalAlpha = out * k;
    g.fillStyle = '#d9b26a'; g.beginPath(); g.arc(x0, y, 10 * easeOut(k) + 2, 0, TAU); g.fill();
    g.save(); g.globalCompositeOperation = 'screen'; drawGlow(g, x0, y, 50, '#d9b26a', 0.5 * k); g.restore();
    g.textAlign = 'left';
    g.fillStyle = '#d9b26a'; g.font = '600 40px Montserrat';
    g.fillText(yr, x0 + 50 + (1 - k) * 30, y - 10);
    g.fillStyle = PAPER; g.font = '600 62px "Cormorant Garamond"';
    g.fillText(txt, x0 + 50 + (1 - k) * 30, y + 58);
  });
  g.restore();
  drawWaves(g, t, 1560, 10, 0.22, 4);
}

function sceneOutro(g, t) {
  const [a] = TL.outro;
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  const k = ss(a, a + 0.8, t);
  // the portrait in a round gold frame
  const cx = CX, cy = 760, r = 210;
  g.save();
  g.globalAlpha = k;
  g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  const im = G.portrait, s = 1.6 * (1 + 0.04 * inv(a, TL.duration, t));
  // centre on the face (about 66% across, 49% down the photo)
  const fw = 420 * s, fh = fw * im.height / im.width;
  g.filter = 'sepia(0.25) contrast(1.05)';
  g.drawImage(im, cx - fw * 0.66, cy - fh * 0.47, fw, fh);
  g.filter = 'none';
  g.restore();
  g.save(); g.globalAlpha = k;
  g.strokeStyle = '#d9b26a'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r + 10, -Math.PI / 2, -Math.PI / 2 + TAU * easeInOut(k)); g.stroke();
  g.restore();
  card(g, t, [a + 0.35, TL.duration + 1], [
    { font: '600 104px "Cormorant Garamond"', text: 'William Golding', y: 1115 },
    { font: '500 32px Montserrat', text: '19 Eylül 1911 – 19 Haziran 1993', y: 1185, d: 0.25, color: '#d9b26a' }
  ]);
  drawWaves(g, t, 1440, 12, 0.3 * k);
}

// ---------- compositor ----------
const SCENES = [
  ['intro', sceneIntro], ['portrait', scenePortrait], ['book', sceneBook],
  ['house', sceneHouse], ['awards', sceneAwards], ['outro', sceneOutro]
];
function renderFrame(t) {
  const S = layer('scene'), g = S.g;
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  SCENES.forEach(([key, fn], i) => {
    const [a, b] = TL[key];
    const next = SCENES[i + 1] ? TL[SCENES[i + 1][0]][0] : 99;
    const fadeIn = i === 0 ? 1 : ss(a, a + 0.35, t);
    const fadeOut = next < 99 ? 1 - ss(next, Math.min(b, next + 0.35), t) : 1;
    const alpha = fadeIn * fadeOut;
    if (t < a - 0.01 || alpha <= 0.002) return;
    const L = layer('s_' + key);
    fn(L.g, t);
    g.globalAlpha = alpha; g.drawImage(L.c, 0, 0); g.globalAlpha = 1;
  });
  // warm light leak on each cut
  for (const key of ['portrait', 'book', 'house', 'awards', 'outro']) {
    const lk = win(TL[key][0] - 0.15, TL[key][0] + 0.1, TL[key][0] + 0.15, TL[key][0] + 0.6, t);
    if (lk > 0.01) { g.save(); g.globalCompositeOperation = 'screen'; drawGlow(g, W * 0.85, H * 0.2, 900, '#ffb870', 0.35 * lk); g.restore(); }
  }
  const o = G.out.g;
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
  o.drawImage(S.c, 0, 0);
  const vg = o.createRadialGradient(CX, H * 0.5, H * 0.3, CX, H * 0.5, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  o.fillStyle = vg; o.fillRect(0, 0, W, H);
  const black = 1 - ss(0, 0.4, t) + ss(TL.fadeOut[0], TL.fadeOut[1], t);
  if (black > 0.001) { o.fillStyle = `rgba(0,0,0,${clamp(black)})`; o.fillRect(0, 0, W, H); }
  const fi = Math.floor(t * 15), tile = GrainTiles[fi % GrainTiles.length];
  o.globalCompositeOperation = 'overlay'; o.globalAlpha = 0.06;
  o.save(); o.translate(-((fi * 137) % 384), -((fi * 251) % 384));
  o.fillStyle = o.createPattern(tile, 'repeat'); o.fillRect(0, 0, W + 384, H + 384);
  o.restore();
  o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
}
