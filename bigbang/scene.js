'use strict';
// Big Bang trial reel. Every scene is drawn procedurally and keyed to the
// narration phrases in bigbang/timeline.js. Uses helpers from animation/core.js.

const BB = {};
const PH = TL.phrases;
const CX = W / 2, CY = H / 2;

// ---------- noise ----------
function vn2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (i, j) => { const q = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return q - Math.floor(q); };
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
function fbm2(x, y, seed, oct = 5) {
  let a = 0.5, f = 1, s = 0, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vn2(x * f, y * f, seed + i * 17); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}
function ramp(stops, v) {
  v = clamp(v);
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i], [b, cb] = stops[i + 1];
    if (v <= b) return mixc(ca, cb, (v - a) / (b - a));
  }
  return hex(stops[stops.length - 1][1]);
}

// ---------- prepared textures ----------
function paintNebula(w, h) {
  const c = makeCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w * 3, v = y / h * 5.3;
    const q = fbm2(u, v, 3, 4);
    const n = fbm2(u + q * 1.4, v + q * 1.1, 9, 6);
    const m = fbm2(u * 1.7 + 4, v * 1.7, 21, 4);
    const dens = clamp((n - 0.42) * 2.6);
    const col = mixc(mixc('#2a1450', '#0c4a5c', m), '#7a3d16', clamp((n - 0.62) * 4));
    const k = (y * w + x) * 4;
    d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = dens * 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
function paintGalaxy(size, seed) {
  const c = makeCanvas(size, size), g = c.getContext('2d'), R = mulberry32(seed), r0 = size * 0.42;
  g.translate(size / 2, size / 2);
  g.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 700; i++) {
    const r = Math.pow(R(), 0.8), th = arm * Math.PI + r * 4.2 + (R() - 0.5) * 0.5;
    const x = Math.cos(th) * r * r0, y = Math.sin(th) * r * r0;
    g.fillStyle = rgb(mixc('#ffe6b8', '#9fc0ff', r), 0.12 + (1 - r) * 0.25);
    const s = 1 + R() * 2.2;
    g.fillRect(x, y, s, s);
  }
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r0 * 0.4);
  gr.addColorStop(0, 'rgba(255,240,210,0.95)'); gr.addColorStop(1, 'rgba(255,200,140,0)');
  g.fillStyle = gr; g.fillRect(-r0, -r0, r0 * 2, r0 * 2);
  return c;
}
function paintCMB(w, h) {
  // mottled temperature map in the familiar blue-to-red palette
  const c = makeCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const stops = [[0, '#13207a'], [0.28, '#2a6fd0'], [0.45, '#8fd3e8'], [0.55, '#f4e27a'], [0.72, '#f08a32'], [1, '#b8261f']];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = fbm2(x / w * 18, y / h * 6, 31, 5) * 0.75 + fbm2(x / w * 60, y / h * 20, 41, 3) * 0.25;
    const col = ramp(stops, (n - 0.28) * 2.2);
    const k = (y * w + x) * 4;
    d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function initBB() {
  if (!GrainTiles.length) buildGrain();
  const R = mulberry32(17);
  BB.stars = Array.from({ length: 1300 }, () => ({ x: (R() - 0.5) * 2.4, y: (R() - 0.5) * 4.2, z: 0.08 + R() * 1.2, m: R(), tint: R() }));
  BB.gal = [
    { x: -0.32, y: -0.62, z: 0.75, s: 0.55, rot: 0.6, tilt: 0.42, spr: paintGalaxy(320, 3) },
    { x: 0.38, y: 0.42, z: 0.95, s: 0.45, rot: -0.4, tilt: 0.6, spr: paintGalaxy(320, 5) },
    { x: -0.18, y: 0.95, z: 0.6, s: 0.35, rot: 1.9, tilt: 0.35, spr: paintGalaxy(320, 9) },
    { x: 0.3, y: -1.15, z: 1.1, s: 0.4, rot: 2.6, tilt: 0.5, spr: paintGalaxy(320, 13) }
  ];
  BB.neb = paintNebula(270, 480);
  BB.cmb = paintCMB(480, 120);
  BB.burst = Array.from({ length: 420 }, () => ({ a: R() * TAU, sp: 0.25 + Math.pow(R(), 0.6), s: R(), hot: R() }));
  BB.coneStars = Array.from({ length: 520 }, () => ({ u: R(), v: Math.pow(R(), 0.7), s: R() }));
  BB.coneGal = Array.from({ length: 26 }, (_, i) => ({ u: R(), v: 0.15 + R() * 0.85, s: R(), rot: R() * TAU, k: i % 4 }));
}

// ---------- typography helpers ----------
function wordsOf(p) { return p.text.split(' '); }
// time each word starts, spreading the phrase duration by syllable count
function wordTimes(p) {
  const total = p.syl.reduce((a, b) => a + b, 0), out = [];
  let acc = 0;
  for (const s of p.syl) { out.push(p.t[0] + (p.t[1] - p.t[0]) * acc / total); acc += s; }
  return out;
}
function drawSupText(g, base, sup, x, y, size, align = 'left') {
  // e.g. "10" with a raised "-43": avoids relying on superscript glyphs in the font
  g.font = `600 ${size}px Montserrat`;
  const bw = g.measureText(base).width;
  g.font = `600 ${size * 0.6}px Montserrat`;
  const sw = g.measureText(sup).width;
  const total = bw + sw;
  let x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  g.textAlign = 'left';
  g.font = `600 ${size}px Montserrat`; g.fillText(base, x0, y);
  g.font = `600 ${size * 0.6}px Montserrat`; g.fillText(sup, x0 + bw + 1, y - size * 0.42);
  return total;
}

// ---------- scene 1-3: stars, rewind, singularity ----------
function drawSpace(g, t) {
  g.fillStyle = '#020309'; g.fillRect(0, 0, W, H);
  const rw = easeIn(inv(TL.rewind[0], TL.rewind[1], t));     // 0 -> 1 as time rewinds
  const c = 1 - rw;                                           // spatial scale of the universe
  const drift = t * 0.05;
  const F = 330;
  // nebula, shrinking with everything else
  if (c > 0.02) {
    g.save();
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = 0.55 * c;
    const sc = (1.15 + t * 0.02) * c;
    g.translate(CX, CY); g.scale(sc, sc); g.rotate(rw * 0.6);
    g.filter = 'blur(6px)';
    g.drawImage(BB.neb, -W / 2, -H / 2, W, H);
    g.filter = 'none';
    g.restore();
  }
  // galaxies
  for (const gx of BB.gal) {
    const z = gx.z - drift * 0.6;
    const px = CX + gx.x / z * F * c, py = CY + gx.y / z * F * c;
    const s = gx.s / z * 260 * Math.max(0.05, c);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.75 * (0.4 + 0.6 * c);
    g.translate(px, py); g.rotate(gx.rot + rw * 3); g.scale(1, gx.tilt);
    g.drawImage(gx.spr, -s / 2, -s / 2, s, s);
    g.restore();
  }
  // stars: drift forward; during the rewind they stream into one point
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  const prevC = 1 - easeIn(inv(TL.rewind[0], TL.rewind[1], t - 0.07));
  for (const s of BB.stars) {
    let z = s.z - drift; while (z < 0.06) z += 1.2;
    const sx = s.x / z * F, sy = s.y / z * F;
    const x = CX + sx * c, y = CY + sy * c;
    if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
    const hot = rw;
    const col = mixc(mixc('#cfe0ff', '#fff4dc', s.tint), '#ffd9a0', hot);
    const a = (0.35 + 0.65 * s.m) * Math.min(1, 0.25 / z + 0.2) * (1 + hot * 1.5);
    const r = (0.6 + s.m * 1.6) * Math.min(2.2, 0.35 / z + 0.5);
    if (rw > 0.01 && rw < 0.999) {
      g.strokeStyle = rgb(col, Math.min(1, a) * 0.8); g.lineWidth = r;
      g.beginPath(); g.moveTo(CX + sx * prevC, CY + sy * prevC); g.lineTo(x, y); g.stroke();
    } else {
      g.fillStyle = rgb(col, Math.min(1, a)); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
  }
  g.restore();
  // the singularity: everything gathers into a point of light
  const sing = ss(TL.rewind[1] - 0.6, TL.rewind[1] + 0.1, t);
  if (sing > 0.001) {
    const pulse = 1 + 0.08 * Math.sin(t * 5.2);
    const zoom = easeIn(inv(PH[3].t[0], TL.burst, t));          // approaching it
    const R0 = (90 + zoom * 1500) * pulse;
    g.save(); g.globalCompositeOperation = 'lighter';
    drawGlow(g, CX, CY, R0 * 3.2, '#ff9e4a', 0.35 * sing);
    drawGlow(g, CX, CY, R0 * 1.4, '#ffd9a0', 0.75 * sing);
    drawGlow(g, CX, CY, R0 * 0.35, '#ffffff', sing);
    // anamorphic streak
    const sg = g.createLinearGradient(0, CY, W, CY);
    sg.addColorStop(0, 'rgba(255,200,140,0)'); sg.addColorStop(0.5, `rgba(255,236,200,${0.55 * sing})`); sg.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = sg; g.fillRect(0, CY - 2 - zoom * 20, W, 4 + zoom * 40);
    g.restore();
    // "Peki, sebebi ne?" — a faint question mark of light behind the point
    const q = win(PH[2].t[0] - 0.1, PH[2].t[0] + 0.4, PH[3].t[0] + 0.3, PH[3].t[0] + 0.9, t);
    if (q > 0.01) {
      g.save();
      g.globalCompositeOperation = 'screen';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '800 620px Montserrat';
      g.shadowColor = 'rgba(255,190,110,0.8)'; g.shadowBlur = 60;
      g.fillStyle = `rgba(255,214,160,${0.13 * q})`;
      g.fillText('?', CX, CY - 20 + (1 - q) * 30);
      g.restore();
    }
  }
}

// title: "Big Bang'den önce / ne vardı?" builds word by word, then lifts away
function drawTitle(g, t) {
  const p = PH[0], times = wordTimes(p), words = wordsOf(p);
  const out = ss(TL.rewind[0] + 0.1, TL.rewind[0] + 0.8, t);
  if (t < p.t[0] - 0.2 || out >= 1) return;
  const lines = [words.slice(0, 3), words.slice(3)];
  g.save();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = '800 96px Montserrat';
  g.shadowColor = 'rgba(160,190,255,0.55)'; g.shadowBlur = 30;
  let wi = 0;
  lines.forEach((ln, li) => {
    const full = ln.join(' ');
    const lw = g.measureText(full).width;
    let x = CX - lw / 2;
    const y = 840 + li * 112 - out * 60;
    for (const w of ln) {
      const k = ss(times[wi], times[wi] + 0.25, t);
      g.globalAlpha = k * (1 - out);
      g.fillStyle = '#ffffff';
      g.fillText(w, x, y + (1 - k) * 18);
      x += g.measureText(w + ' ').width;
      wi++;
    }
  });
  g.restore();
}

// rewind counter: "Bugün" -> "13,8 milyar yıl önce"
function drawCounter(g, t) {
  const a = win(TL.rewind[0] + 0.2, TL.rewind[0] + 0.6, TL.rewind[1] - 0.1, TL.rewind[1] + 0.35, t);
  if (a <= 0.01) return;
  const k = easeIn(inv(TL.rewind[0] + 0.4, TL.rewind[1] - 0.2, t));
  const val = 13.8 * k;
  g.save();
  g.globalAlpha = a; g.textAlign = 'center';
  g.fillStyle = 'rgba(220,230,255,0.75)'; g.font = '500 30px Montserrat';
  spacedText(g, 'ZAMANI GERİ SARIYORUZ', CX + 4, 560, 6);
  g.fillStyle = '#ffffff'; g.font = '700 64px Montserrat';
  g.shadowColor = 'rgba(255,200,140,0.6)'; g.shadowBlur = 24;
  g.fillText(k < 0.02 ? 'Bugün' : `${val.toFixed(1).replace('.', ',')} milyar yıl önce`, CX, 640);
  g.restore();
}

// ---------- scene 4: the burst ----------
function drawBurst(g, t) {
  const b = t - TL.burst;
  if (b < -0.05 || b > 1.6) return;
  const k = clamp(b / 1.4);
  g.save(); g.globalCompositeOperation = 'lighter';
  // expanding hot sphere
  const R = easeOut(k) * 1500;
  const gr = g.createRadialGradient(CX, CY, R * 0.1, CX, CY, Math.max(1, R));
  gr.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`); gr.addColorStop(0.4, `rgba(255,190,110,${0.55 * (1 - k)})`);
  gr.addColorStop(0.8, `rgba(200,80,40,${0.3 * (1 - k)})`); gr.addColorStop(1, 'rgba(120,40,30,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // shock rings
  for (const [d, wdt] of [[0, 26], [0.12, 12]]) {
    const kk = clamp((b - d) / 1.2);
    if (kk <= 0) continue;
    g.strokeStyle = `rgba(255,226,180,${0.6 * (1 - kk)})`; g.lineWidth = wdt * (1 - kk) + 1;
    g.beginPath(); g.arc(CX, CY, easeOut(kk) * 1300, 0, TAU); g.stroke();
  }
  // matter flung outward
  g.lineCap = 'round';
  for (const p of BB.burst) {
    const r0 = easeOut(clamp((b - 0.02) / 1.5)) * p.sp * 1500, r1 = Math.max(0, r0 - 40 - p.sp * 120 * (1 - k));
    const col = mixc('#ffffff', p.hot < 0.5 ? '#ffb15a' : '#9fc0ff', clamp(k * 1.4));
    g.strokeStyle = rgb(col, (1 - k) * (0.5 + p.s * 0.5)); g.lineWidth = 1 + p.s * 2.5;
    g.beginPath(); g.moveTo(CX + Math.cos(p.a) * r1, CY + Math.sin(p.a) * r1); g.lineTo(CX + Math.cos(p.a) * r0, CY + Math.sin(p.a) * r0); g.stroke();
  }
  g.restore();
  // the white-out
  const flash = win(-0.22, 0.03, 0.12, 0.55, b);
  if (flash > 0.001) { g.fillStyle = `rgba(255,250,240,${flash})`; g.fillRect(0, 0, W, H); }
}

// ---------- scenes 5-8: the history of the universe as a cone ----------
const CONE = { top: 330, bottom: 1480, planck: 420, cmb: 700, darkEnd: 880 };
function coneHW(y) {
  const u = clamp((y - CONE.top) / (CONE.bottom - CONE.top));
  return 380 * Math.pow(u, 0.72) + 55 * (1 - Math.exp(-u * 18));
}
function camCone(t) {
  const keys = [
    { t: 0, x: 540, y: 960, z: 1.0 },
    { t: TL.focusCMB[0], x: 540, y: 960, z: 1.0 },
    { t: TL.focusCMB[0] + 0.6, x: 540, y: 770, z: 1.45, ease: smoother },
    { t: TL.focusPlanck[0], x: 540, y: 760, z: 1.5, ease: sstep },
    { t: TL.focusPlanck[0] + 0.55, x: 540, y: 470, z: 1.75, ease: smoother },
    { t: TL.outro[0], x: 540, y: 465, z: 1.8, ease: sstep },
    { t: TL.outro[0] + 1.2, x: 540, y: 740, z: 0.8, ease: smoother },
    { t: 99, x: 540, y: 730, z: 0.78, ease: sstep }
  ];
  const k = keyed(keys, t);
  k.x += fbm(t * 0.3, 3) * 3; k.y += fbm(t * 0.27, 4) * 3;
  return k;
}
function toScreen(cam, x, y) { return [CX + (x - cam.x) * cam.z, CY + (y - cam.y) * cam.z]; }

function drawCone(g, t) {
  const cam = camCone(t);
  const draw = easeInOut(inv(TL.coneDraw[0], TL.coneDraw[1], t));
  g.fillStyle = '#03040b'; g.fillRect(0, 0, W, H);
  // faint background stars
  g.save(); g.globalCompositeOperation = 'lighter';
  const R = mulberry32(77);
  for (let i = 0; i < 260; i++) {
    const x = R() * W, y = R() * H, m = R();
    g.fillStyle = `rgba(200,215,255,${(0.15 + m * 0.4) * (0.6 + 0.4 * Math.sin(t * (1 + m) + i))})`;
    g.fillRect(x, y, 1 + m * 1.5, 1 + m * 1.5);
  }
  g.restore();
  g.save();
  g.translate(CX, CY); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y);
  // reveal from the top down
  const yMax = CONE.top + draw * (CONE.bottom - CONE.top + 60);
  g.save();
  g.beginPath(); g.rect(-2000, -2000, 5000, yMax + 2000); g.clip();
  // body
  const body = new Path2D();
  body.moveTo(CX, CONE.top);
  for (let y = CONE.top; y <= CONE.bottom; y += 6) body.lineTo(CX + coneHW(y), y);
  for (let y = CONE.bottom; y >= CONE.top; y -= 6) body.lineTo(CX - coneHW(y), y);
  body.closePath();
  let gr = g.createLinearGradient(0, CONE.top, 0, CONE.bottom);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.05, '#fff0c4'); gr.addColorStop(0.17, '#ffb14e');
  gr.addColorStop(0.32, '#e2672a'); gr.addColorStop(0.34, '#2a1626'); gr.addColorStop(0.47, '#120f22');
  gr.addColorStop(0.6, '#101634'); gr.addColorStop(1, '#0c1430');
  g.fillStyle = gr; g.fill(body);
  g.save(); g.clip(body);
  // plasma haze above the first light, stars and galaxies after the dark ages
  g.globalCompositeOperation = 'lighter';
  for (const s of BB.coneStars) {
    const y = CONE.darkEnd + s.v * (CONE.bottom - CONE.darkEnd), hw = coneHW(y);
    const x = CX + (s.u * 2 - 1) * hw * 0.95;
    g.fillStyle = `rgba(210,225,255,${0.25 + s.s * 0.55})`;
    g.fillRect(x, y, 1.2 + s.s * 1.8, 1.2 + s.s * 1.8);
  }
  for (const gx of BB.coneGal) {
    const y = CONE.darkEnd + 40 + gx.v * (CONE.bottom - CONE.darkEnd - 60), hw = coneHW(y);
    const x = CX + (gx.u * 2 - 1) * hw * 0.85, s = 26 + gx.s * 30 + gx.v * 20;
    g.save(); g.globalAlpha = 0.6; g.translate(x, y); g.rotate(gx.rot); g.scale(1, 0.5);
    g.drawImage(BB.gal[gx.k].spr, -s / 2, -s / 2, s, s); g.restore();
  }
  g.globalCompositeOperation = 'source-over';
  // cross-section rings give the funnel some depth
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1.5;
  for (let y = CONE.top + 60; y < CONE.bottom; y += 90) {
    const hw = coneHW(y);
    g.beginPath(); g.ellipse(CX, y, hw, hw * 0.16, 0, 0, TAU); g.stroke();
  }
  g.restore();
  // rim
  g.strokeStyle = 'rgba(190,210,255,0.55)'; g.lineWidth = 2;
  g.stroke(body);
  g.save(); g.globalCompositeOperation = 'lighter';
  drawGlow(g, CX, CONE.top, 120, '#fff4dc', 0.9);
  drawGlow(g, CX, CONE.top, 34, '#ffffff', 1);
  g.restore();
  g.restore(); // reveal clip
  // the two limits
  const wa = TL.walls;
  drawPlanckWall(g, t, ss(wa[0], wa[0] + 0.45, t));
  drawCMBWall(g, t, ss(wa[1], wa[1] + 0.45, t));
  // the question above the beginning (outro)
  const qa = ss(TL.outro[0] + 0.3, TL.outro[0] + 1.1, t);
  if (qa > 0.01) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, CX, CONE.top - 160, 230, '#9f8cff', 0.35 * qa);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 190px Montserrat';
    g.shadowColor = 'rgba(190,170,255,0.9)'; g.shadowBlur = 40;
    g.fillStyle = `rgba(235,228,255,${0.9 * qa})`;
    g.fillText('?', CX, CONE.top - 160 + Math.sin(t * 1.6) * 6);
    g.restore();
  }
  g.restore(); // camera
  drawConeLabels(g, t, cam);
}

function drawPlanckWall(g, t, a) {
  if (a <= 0.01) return;
  const y = CONE.planck, rx = 290 * easeOut(a), ry = 44 * easeOut(a);
  const focus = win(TL.focusPlanck[0], TL.focusPlanck[0] + 0.4, TL.outro[0] + 0.3, TL.outro[0] + 1.0, t);
  g.save();
  // warped space-time grid around the beginning; it jitters when in focus
  g.strokeStyle = `rgba(150,200,255,${(0.12 + 0.35 * focus) * a})`; g.lineWidth = 1.2;
  const glitch = focus > 0.2 ? Math.floor(t * 14) : 0;
  for (let k = -8; k <= 8; k++) {
    const jx = glitch && hash1(glitch * 31 + k) > 0.8 ? (hash1(glitch + k) - 0.5) * 18 : 0;
    g.beginPath();
    for (let s = 0; s <= 30; s++) {
      const yy = CONE.top - 120 + s * 10, xx = CX + k * 34;
      const dx = CX - xx, dy = CONE.top - yy, dist = Math.hypot(dx, dy);
      const pull = 0.5 * Math.exp(-dist / 110);
      g.lineTo(xx + dx * pull + jx, yy + dy * pull);
    }
    g.stroke();
  }
  for (let r = 0; r <= 12; r++) {
    g.beginPath();
    for (let s = -8; s <= 8; s++) {
      const xx = CX + s * 34, yy = CONE.top - 120 + r * 25;
      const dx = CX - xx, dy = CONE.top - yy, dist = Math.hypot(dx, dy);
      const pull = 0.5 * Math.exp(-dist / 110);
      g.lineTo(xx + dx * pull, yy + dy * pull);
    }
    g.stroke();
  }
  // the barrier itself: a thin violet membrane
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(CX, y, 0, CX, y, rx);
  gr.addColorStop(0, `rgba(170,140,255,${0.35 * a})`); gr.addColorStop(1, `rgba(120,90,255,${0.08 * a})`);
  g.fillStyle = gr;
  g.beginPath(); g.ellipse(CX, y, rx, ry, 0, 0, TAU); g.fill();
  g.strokeStyle = `rgba(200,180,255,${0.9 * a})`; g.lineWidth = 2.5 + focus * 2;
  g.beginPath(); g.ellipse(CX, y, rx, ry, 0, 0, TAU); g.stroke();
  g.restore();
}

function drawCMBWall(g, t, a) {
  if (a <= 0.01) return;
  const y = CONE.cmb, rx = 380 * easeOut(a), ry = 62 * easeOut(a);
  const focus = win(TL.focusCMB[0], TL.focusCMB[0] + 0.4, TL.focusPlanck[0] + 0.2, TL.focusPlanck[0] + 0.7, t);
  g.save();
  // light from our side travels up and stops at the wall
  if (focus > 0.01) {
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const x = CX - 300 + i * 75, y0 = CONE.bottom - 40;
      const ph = (t * 0.9 + i * 0.37) % 1;
      const gr = g.createLinearGradient(0, y0, 0, y + ry);
      gr.addColorStop(0, 'rgba(255,230,170,0)'); gr.addColorStop(1, `rgba(255,230,170,${0.35 * focus})`);
      g.strokeStyle = gr; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y + ry * 0.6); g.stroke();
      drawGlow(g, x, lerp(y0, y + ry * 0.6, ph), 10, '#ffe6b0', focus * 0.8);
      drawGlow(g, x, y + ry * 0.6, 22, '#ffd08a', focus * 0.6);
    }
    g.globalCompositeOperation = 'source-over';
  }
  // the map of the first light on the wall
  g.save();
  g.beginPath(); g.ellipse(CX, y, rx, ry, 0, 0, TAU); g.clip();
  g.globalAlpha = 0.92 * a;
  g.drawImage(BB.cmb, CX - rx, y - ry, rx * 2, ry * 2);
  const sh = g.createRadialGradient(CX, y, 0, CX, y, rx);
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = sh; g.fillRect(CX - rx, y - ry, rx * 2, ry * 2);
  g.restore();
  g.strokeStyle = `rgba(255,214,160,${0.9 * a})`; g.lineWidth = 2.5 + focus * 2;
  g.beginPath(); g.ellipse(CX, y, rx, ry, 0, 0, TAU); g.stroke();
  g.restore();
}

// time labels and the focus captions (screen space so they stay crisp)
function drawConeLabels(g, t, cam) {
  const show = ss(TL.coneDraw[1] - 0.3, TL.coneDraw[1] + 0.3, t);
  if (show <= 0.01) return;
  g.save();
  g.fillStyle = 'rgba(225,232,255,0.85)';
  const lab = (y, fn, a) => {
    const [, sy] = toScreen(cam, 0, y);
    if (sy < 140 || sy > 1560 || a <= 0.01) return;
    g.globalAlpha = a * show;
    const lx = toScreen(cam, CX - coneHW(y) - 26, y)[0];
    fn(Math.max(150, lx), sy);
  };
  const outro = ss(TL.outro[0] + 0.6, TL.outro[0] + 1.4, t);
  const small = 28;
  g.textBaseline = 'middle';
  lab(CONE.top, (x, y) => { g.textAlign = 'right'; g.font = `600 ${small}px Montserrat`; g.fillText('Big Bang', x - 30, y); }, 1);
  lab(CONE.planck, (x, y) => { g.fillStyle = 'rgba(205,190,255,0.95)'; drawSupText(g, '10', '-43', x - 10, y + 10, small, 'right'); g.font = `500 ${small * 0.8}px Montserrat`; g.textAlign = 'right'; g.fillText('saniye', x - 10, y + 40); }, ss(TL.walls[0], TL.walls[0] + 0.5, t));
  lab(CONE.cmb, (x, y) => { g.fillStyle = 'rgba(255,220,170,0.95)'; g.textAlign = 'right'; g.font = `600 ${small}px Montserrat`; g.fillText('380.000', x - 10, y); g.font = `500 ${small * 0.8}px Montserrat`; g.fillText('yıl', x - 10, y + 30); }, ss(TL.walls[1], TL.walls[1] + 0.5, t));
  lab(CONE.bottom - 30, (x, y) => { g.fillStyle = 'rgba(225,232,255,0.85)'; g.textAlign = 'right'; g.font = `600 ${small}px Montserrat`; g.fillText('Bugün', x + 10, y - 16); g.font = `500 ${small * 0.8}px Montserrat`; g.fillText('13,8 milyar yıl', x + 10, y + 14); }, 1);
  // outro: name both limits beside their walls
  if (outro > 0.01) {
    g.globalAlpha = outro;
    g.textAlign = 'left'; g.font = '700 30px Montserrat';
    const [px, py] = toScreen(cam, CX + 300, CONE.planck); g.fillStyle = '#d6c8ff'; g.fillText('Kuramsal sınır', Math.min(px + 14, 700), py);
    const [cxs, cys] = toScreen(cam, CX + 380, CONE.cmb); g.fillStyle = '#ffd9a8'; g.fillText('Gözlemsel sınır', Math.min(cxs + 14, 700), cys);
  }
  g.restore();
  // focus cards
  focusCard(g, t, cam, TL.focusCMB, CONE.cmb + 62, '#ffd9a8', 'Gözlemsel sınır',
    ['Evrenin ilk ışığı', 'Big Bang\'den yaklaşık 380.000 yıl sonra'], 'Öncesini ışıkla göremiyoruz.');
  focusCard(g, t, cam, TL.focusPlanck, CONE.top, '#d6c8ff', 'Kuramsal sınır',
    ['Planck zamanı', null], 'Bilinen fizik yasaları burada yetersiz kalır.', true);
}

function focusCard(g, t, cam, span, wy, col, title, lines, note, above = false) {
  const a = win(span[0] + 0.25, span[0] + 0.6, span[1] - 0.05, span[1] + 0.25, t);
  if (a <= 0.01) return;
  const [, sy] = toScreen(cam, 0, wy);
  // below the wall, or in the dark space above the beginning
  const y0 = above ? sy - 250 : sy + 110;
  g.save();
  g.globalAlpha = a;
  const scr = g.createLinearGradient(0, y0 - 80, 0, y0 + 230);
  scr.addColorStop(0, 'rgba(3,4,11,0)'); scr.addColorStop(0.25, 'rgba(3,4,11,0.72)'); scr.addColorStop(0.8, 'rgba(3,4,11,0.72)'); scr.addColorStop(1, 'rgba(3,4,11,0)');
  g.fillStyle = scr; g.fillRect(0, y0 - 80, W, 310);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 12;
  g.fillStyle = col; g.font = '800 70px Montserrat';
  g.fillText(title, CX, y0 + (1 - a) * 20);
  g.fillStyle = 'rgba(240,242,255,0.95)'; g.font = '600 36px Montserrat';
  if (lines[1]) {
    g.fillText(lines[0], CX, y0 + 62);
    g.font = '500 30px Montserrat'; g.fillText(lines[1], CX, y0 + 104);
  } else {
    const w0 = (() => { g.font = '600 36px Montserrat'; return g.measureText(lines[0] + ' · ').width; })();
    g.font = '600 36px Montserrat';
    const supW = (() => { g.font = '600 36px Montserrat'; const b = g.measureText('10').width; g.font = '600 21.6px Montserrat'; return b + g.measureText('-43').width; })();
    g.font = '600 36px Montserrat'; const sw = g.measureText(' saniye').width;
    let x = CX - (w0 + supW + sw) / 2;
    g.textAlign = 'left'; g.fillText(lines[0] + ' · ', x, y0 + 62); x += w0;
    drawSupText(g, '10', '-43', x, y0 + 62, 36); x += supW;
    g.font = '600 36px Montserrat'; g.fillText(' saniye', x, y0 + 62);
    g.textAlign = 'center';
  }
  g.fillStyle = 'rgba(220,226,245,0.85)'; g.font = 'italic 500 30px Montserrat';
  g.fillText(note, CX, y0 + 156);
  g.restore();
}

// ---------- captions (spoken words, word by word) ----------
function drawCaptions(g, t) {
  for (let i = 1; i <= 5; i++) {
    const p = PH[i];
    // hold a little after the phrase, but clear the line before the next one starts
    const end = Math.min(p.t[1] + 0.4, PH[i + 1] ? PH[i + 1].t[0] - 0.02 : 99);
    const a = ss(p.t[0] - 0.15, p.t[0] + 0.05, t) * (1 - ss(end - 0.2, end, t));
    if (a <= 0.01) continue;
    const words = wordsOf(p), times = wordTimes(p);
    g.save();
    g.font = '800 54px Montserrat'; g.textBaseline = 'alphabetic';
    const space = g.measureText(' ').width, maxW = 880;
    const lines = [[]]; let lw = 0;
    words.forEach((w, k) => {
      const ww = g.measureText(w).width;
      if (lw && lw + space + ww > maxW) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push(k); lw += (lw ? space : 0) + ww;
    });
    const y0 = 1330 - (lines.length - 1) * 33;
    lines.forEach((ln, li) => {
      const full = ln.map(k => words[k]).join(' ');
      let x = CX - g.measureText(full).width / 2;
      for (const k of ln) {
        const on = ss(times[k] - 0.05, times[k] + 0.12, t);
        const next = k + 1 < times.length ? times[k + 1] : p.t[1];
        const active = t >= times[k] && t < next + 0.05;
        g.globalAlpha = a * (0.25 + 0.75 * on);
        g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 14; g.shadowOffsetY = 3;
        g.fillStyle = active ? '#ffc86e' : '#ffffff';
        g.fillText(words[k], x, y0 + li * 66 + (1 - on) * 8);
        x += g.measureText(words[k] + ' ').width;
      }
    });
    g.restore();
  }
}

// ---------- compositor ----------
let OUT = null;
function initScene(canvas) { OUT = { c: canvas, g: canvas.getContext('2d') }; initBB(); }

function renderFrame(t) {
  const S = layer('scene'), g = S.g;
  const coneA = ss(TL.burst + 0.1, TL.burst + 0.7, t);
  if (coneA < 1) drawSpace(g, t);
  if (coneA > 0.001) {
    const C = layer('cone');
    drawCone(C.g, t);
    g.globalAlpha = coneA; g.drawImage(C.c, 0, 0); g.globalAlpha = 1;
  }
  drawBurst(g, t);
  drawTitle(g, t);
  drawCounter(g, t);
  drawCaptions(g, t);
  // final title (outro)
  const ft = ss(TL.finalTitle, TL.finalTitle + 0.7, t);
  if (ft > 0.01) {
    g.save();
    g.globalAlpha = ft; g.textAlign = 'center';
    g.shadowColor = 'rgba(150,170,255,0.6)'; g.shadowBlur = 26;
    g.fillStyle = '#ffffff'; g.font = '800 78px Montserrat';
    g.fillText('Big Bang\'den önce', CX, 300 + (1 - ft) * 16);
    g.fillText('ne vardı?', CX, 392 + (1 - ft) * 16);
    g.restore();
  }

  // grade: bloom, vignette, grain, fades
  const o = OUT.g;
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
  o.filter = 'contrast(1.05) saturate(1.08)';
  o.drawImage(S.c, 0, 0);
  o.filter = 'none';
  const B = layer('bloom', W / 6, H / 6);
  B.g.filter = 'brightness(0.8) contrast(2.2) blur(5px)';
  B.g.drawImage(S.c, 0, 0, W / 6, H / 6); B.g.filter = 'none';
  o.globalCompositeOperation = 'screen'; o.globalAlpha = 0.55;
  o.imageSmoothingQuality = 'high'; o.drawImage(B.c, 0, 0, W, H);
  o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
  const vg = o.createRadialGradient(CX, H * 0.5, H * 0.28, CX, H * 0.5, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  o.fillStyle = vg; o.fillRect(0, 0, W, H);
  const black = 1 - ss(0, 0.45, t) + ss(TL.fadeOut[0], TL.fadeOut[1], t);
  if (black > 0.001) { o.fillStyle = `rgba(0,0,0,${clamp(black)})`; o.fillRect(0, 0, W, H); }
  const fi = Math.floor(t * 15), tile = GrainTiles[fi % GrainTiles.length];
  o.globalCompositeOperation = 'overlay'; o.globalAlpha = 0.05;
  o.save(); o.translate(-((fi * 137) % 384), -((fi * 251) % 384));
  o.fillStyle = o.createPattern(tile, 'repeat'); o.fillRect(0, 0, W + 384, H + 384);
  o.restore();
  o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
}
