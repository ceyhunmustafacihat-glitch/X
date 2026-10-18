'use strict';
// Phone POV: an endless, grey feed — until the sözlükdeus post stops the thumb.

const FEED = {
  sx: 104, sy: 54, sw: 872, sh: 1880,      // screen rect
  postH: 1480, mediaY: 112, mediaH: 1163,   // 3:4 media, like the page's posts
  K: 11,                                    // index of the sözlükdeus post
  landY: 236                                // where that post's top settles on screen
};

function feedScroll(t) {
  const fl = TL.flicksFeed, PH = FEED.postH;
  const dist = [1.0, 1.25, 1.5, 1.7, 1.9, 2.1];
  const s0 = 0.18 * PH;
  let s = s0 + Math.max(0, Math.min(t, fl[0]) - TL.feed[0]) * 40;
  let total = s0 + (fl[0] - TL.feed[0]) * 40;
  for (let i = 0; i < fl.length; i++) {
    const dur = 0.85 - i * 0.05;
    const d = dist[i] * PH;
    s += d * expOut(clamp((t - fl[i]) / dur));
    total += d;
  }
  const target = FEED.K * PH + 190 - FEED.landY;
  const last = target - total;
  const k = clamp((t - TL.postArrive) / (TL.postStop - TL.postArrive));
  s += last * (1 - Math.pow(1 - k, 3.2));
  return s;
}

// ---- tiny UI icons ----
function iconHeart(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.35, y - s * 0.85, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.35, y - s * 0.85, x + s * 0.9, y - s * 0.25, x, y + s * 0.35);
  g.stroke();
}
function iconBubble(g, x, y, s) { g.beginPath(); g.arc(x, y, s * 0.5, 0.9, TAU + 0.5); g.lineTo(x + s * 0.55, y + s * 0.55); g.closePath(); g.stroke(); }
function iconPlane(g, x, y, s) { g.beginPath(); g.moveTo(x - s * 0.5, y - s * 0.1); g.lineTo(x + s * 0.55, y - s * 0.5); g.lineTo(x + s * 0.1, y + s * 0.55); g.lineTo(x - 0.05 * s, y + 0.05 * s); g.closePath(); g.stroke(); }
function iconRepost(g, x, y, s) {
  g.beginPath(); g.moveTo(x - s * 0.42, y + s * 0.05); g.lineTo(x - s * 0.42, y - s * 0.12); g.quadraticCurveTo(x - s * 0.42, y - s * 0.3, x - s * 0.22, y - s * 0.3); g.lineTo(x + s * 0.38, y - s * 0.3);
  g.moveTo(x + s * 0.22, y - s * 0.46); g.lineTo(x + s * 0.4, y - s * 0.3); g.lineTo(x + s * 0.22, y - s * 0.14);
  g.moveTo(x + s * 0.42, y - s * 0.05); g.lineTo(x + s * 0.42, y + s * 0.12); g.quadraticCurveTo(x + s * 0.42, y + s * 0.3, x + s * 0.22, y + s * 0.3); g.lineTo(x - s * 0.38, y + s * 0.3);
  g.moveTo(x - s * 0.22, y + s * 0.46); g.lineTo(x - s * 0.4, y + s * 0.3); g.lineTo(x - s * 0.22, y + s * 0.14);
  g.stroke();
}
function iconMark(g, x, y, s) { g.beginPath(); g.moveTo(x - s * 0.35, y - s * 0.5); g.lineTo(x + s * 0.35, y - s * 0.5); g.lineTo(x + s * 0.35, y + s * 0.5); g.lineTo(x, y + s * 0.22); g.lineTo(x - s * 0.35, y + s * 0.5); g.closePath(); g.stroke(); }

// ---- junk media (deliberately loud and samey) ----
function drawJunk(g, idx, x, y, w, h, t) {
  const kind = idx % 8;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const cx = x + w / 2, cy = y + h / 2;
  const R = mulberry32(idx * 31 + 7);
  if (kind === 0) {           // meme
    g.fillStyle = '#7d8a99'; g.fillRect(x, y, w, h);
    g.fillStyle = '#c9a07a'; g.beginPath(); g.arc(cx, cy + 40, 230, 0, TAU); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(cx - 80, cy, 22, 0, TAU); g.arc(cx + 80, cy, 22, 0, TAU); g.fill();
    g.lineWidth = 14; g.strokeStyle = '#222'; g.beginPath(); g.arc(cx, cy + 120, 70, 0.1, Math.PI - 0.1); g.stroke();
    g.fillStyle = '#fff'; g.fillRect(x, y, w, 190); g.fillRect(x, y + h - 190, w, 190);
    g.fillStyle = '#111'; g.textAlign = 'center'; g.font = '800 74px Inter';
    g.fillText("GECE 3'TE BEN:", cx, y + 122);
    g.fillText('SADECE 1 VİDEO DAHA', cx, y + h - 70);
  } else if (kind === 1) {    // ad
    const gr = g.createLinearGradient(x, y, x + w, y + h);
    gr.addColorStop(0, '#ff3d7f'); gr.addColorStop(1, '#ffb13d');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 210px Inter';
    g.fillText('%70', cx, cy - 20); g.font = '800 96px Inter'; g.fillText('İNDİRİM', cx, cy + 110);
    g.fillStyle = '#111'; rr(g, cx - 210, cy + 210, 420, 110, 55); g.fill();
    g.fillStyle = '#fff'; g.font = '700 54px Inter'; g.fillText('HEMEN AL', cx, cy + 284);
  } else if (kind === 2) {    // laughing faces
    g.fillStyle = '#3b3f8f'; g.fillRect(x, y, w, h);
    for (let i = 0; i < 6; i++) {
      const fx = x + 150 + (i % 2) * 560 + R() * 30, fy = y + 180 + Math.floor(i / 2) * 340;
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(fx, fy, 120, 0, TAU); g.fill();
      g.strokeStyle = '#5a3a00'; g.lineWidth = 12;
      g.beginPath(); g.arc(fx - 40, fy - 20, 22, Math.PI + 0.3, -0.3); g.stroke();
      g.beginPath(); g.arc(fx + 40, fy - 20, 22, Math.PI + 0.3, -0.3); g.stroke();
      g.fillStyle = '#5a3a00'; g.beginPath(); g.arc(fx, fy + 30, 55, 0, Math.PI); g.fill();
      g.fillStyle = '#5ec8ff'; g.beginPath(); g.ellipse(fx - 95, fy + 10, 14, 26, 0.3, 0, TAU); g.fill();
    }
  } else if (kind === 3) {    // food
    g.fillStyle = '#2f6e5a'; g.fillRect(x, y, w, h);
    g.fillStyle = '#f2efe8'; g.beginPath(); g.arc(cx, cy, 360, 0, TAU); g.fill();
    g.fillStyle = '#d98b3a'; rr(g, cx - 240, cy - 170, 480, 120, 60); g.fill();
    g.fillStyle = '#5b3420'; g.fillRect(cx - 250, cy - 40, 500, 70);
    g.fillStyle = '#7cc04a'; g.fillRect(cx - 260, cy - 55, 520, 20);
    g.fillStyle = '#e8b04a'; rr(g, cx - 240, cy + 40, 480, 90, 40); g.fill();
  } else if (kind === 4) {    // selfie
    g.fillStyle = '#ff7fb8'; g.fillRect(x, y, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 40; g.beginPath(); g.arc(cx, cy - 120, 300, 0, TAU); g.stroke();
    g.fillStyle = '#3a2430'; g.beginPath(); g.arc(cx, cy - 80, 170, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(cx, cy + 380, 340, 260, 0, Math.PI, TAU); g.fill();
    g.fillStyle = '#fff'; g.font = '700 64px Inter'; g.textAlign = 'center'; g.fillText('#günaydın ✨', cx, y + h - 60);
  } else if (kind === 5) {    // clickbait
    g.fillStyle = '#556070'; g.fillRect(x, y, w, h);
    g.fillStyle = '#8a95a3'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(cx - 100, cy - 100); g.lineTo(cx + 200, cy + 100); g.lineTo(x + w, y + h); g.fill();
    g.strokeStyle = '#ff2a2a'; g.lineWidth = 18; g.beginPath(); g.arc(cx + 120, cy - 40, 140, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(x + 120, y + 180); g.lineTo(cx - 40, cy - 120); g.stroke();
    g.fillStyle = '#ffeb3b'; g.font = '800 92px Inter'; g.textAlign = 'center';
    g.fillText('İNANAMAYACAKSINIZ', cx, y + h - 120);
  } else if (kind === 6) {    // dance video
    const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#6a2bd9'); gr.addColorStop(1, '#14c4c4');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.beginPath(); g.arc(cx, cy - 250, 80, 0, TAU); g.fill();
    g.lineCap = 'round'; g.lineWidth = 70; g.strokeStyle = 'rgba(0,0,0,0.55)';
    const k = Math.sin(t * 9 + idx);
    g.beginPath(); g.moveTo(cx, cy - 160); g.lineTo(cx, cy + 120); g.lineTo(cx - 120, cy + 400); g.moveTo(cx, cy + 120); g.lineTo(cx + 140, cy + 380);
    g.moveTo(cx, cy - 100); g.lineTo(cx - 200, cy - 200 + k * 60); g.moveTo(cx, cy - 100); g.lineTo(cx + 210, cy - 40 - k * 60); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.moveTo(cx - 50, cy - 70); g.lineTo(cx + 70, cy); g.lineTo(cx - 50, cy + 70); g.fill();
    g.font = '700 48px Inter'; g.textAlign = 'left'; g.fillText('▶ 1,2 Mn', x + 36, y + h - 44);
  } else {                    // cat
    g.fillStyle = '#c9b49a'; g.fillRect(x, y, w, h);
    g.fillStyle = '#4a4440';
    g.beginPath(); g.ellipse(cx, cy + 140, 300, 230, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(cx, cy - 170, 170, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(cx - 150, cy - 250); g.lineTo(cx - 120, cy - 420); g.lineTo(cx - 40, cy - 320); g.fill();
    g.beginPath(); g.moveTo(cx + 150, cy - 250); g.lineTo(cx + 120, cy - 420); g.lineTo(cx + 40, cy - 320); g.fill();
    g.fillStyle = '#9be36a'; g.beginPath(); g.arc(cx - 60, cy - 180, 26, 0, TAU); g.arc(cx + 60, cy - 180, 26, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.font = '800 80px Inter'; g.textAlign = 'center'; g.fillText('POV: pazartesi', cx, y + 120);
  }
  g.restore();
}

const FEED_NAMES = ['gundem.tv', 'komik.anlar', 'firsat.market', 'lezzet.durağı', 'ayse.vlog', 'sok.haber', 'dans.akımı', 'kedi.dünyası'];

// ---- the sözlükdeus post (media area), in the page's own template ----
// A dark, cinematic photo-like painting; the word in quotes; "Sözlük"; a definition
// with a bar on its left; an example sentence; the open-book mark at the bottom.

// lucide-style open book (24x24 viewbox), the page's avatar mark
const BOOK_ICON = [new Path2D('M12 7v14'),
  new Path2D('M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z')];
function drawBookIcon(g, cx, cy, size, color = '#ffffff', lw = 1.8) {
  g.save();
  g.translate(cx - size / 2, cy - size / 2); g.scale(size / 24, size / 24);
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const p of BOOK_ICON) g.stroke(p);
  g.restore();
}

// ridge line for a mountain layer (deterministic fractal noise, sharpened peaks)
function ridge(u, seed, oct = 5) {
  let v = 0, a = 1, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    const r = 1 - Math.abs(noise1(u * 3 * f + seed * 13.7 + i * 7.1));
    v += r * r * a; n += a; a *= 0.5; f *= 2.1;
  }
  return v / n;
}

// "İnşirah": dawn breaking through heavy clouds behind layered mountains, mirrored in a still lake
function paintInsirah(PW, PH) {
  const c = makeCanvas(PW, PH), g = c.getContext('2d');
  const R = mulberry32(404);
  const hz = PH * 0.6;                       // horizon / lake line
  const sunX = PW * 0.6, sunY = PH * 0.505;
  const blur = px => (g.filter = px > 0 ? `blur(${(px * PW).toFixed(1)}px)` : 'none');
  // sky
  let gr = g.createLinearGradient(0, 0, 0, hz);
  gr.addColorStop(0, '#0d1119'); gr.addColorStop(0.3, '#1f2533'); gr.addColorStop(0.55, '#4f4650');
  gr.addColorStop(0.75, '#b5774a'); gr.addColorStop(0.9, '#eeb36d'); gr.addColorStop(1, '#ffdca0');
  g.fillStyle = gr; g.fillRect(0, 0, PW, hz + 4);
  // sun glow
  g.globalCompositeOperation = 'screen';
  for (const [r, a] of [[0.9, 0.35], [0.45, 0.45], [0.18, 0.7], [0.06, 0.95]]) {
    gr = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, PW * r);
    gr.addColorStop(0, `rgba(255,222,160,${a})`); gr.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = gr; g.fillRect(0, 0, PW, hz + 4);
  }
  g.globalCompositeOperation = 'source-over';
  // cloud masses: soft dark bodies, parted around the sun, with sunlit undersides
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const x = R() * PW * 1.3 - PW * 0.15, y = PH * (0.03 + Math.pow(R(), 1.3) * 0.38);
    const d = Math.hypot((x - sunX) / PW, (y - sunY) / PH * 1.8);
    clouds.push({ x, y, rx: PW * (0.16 + R() * 0.28), ry: PH * (0.035 + R() * 0.05), open: clamp(d * 2.3 - 0.3), d });
  }
  blur(0.035);
  for (const cl of clouds) {
    g.fillStyle = `rgba(20,23,32,${0.75 * cl.open})`;
    g.beginPath(); g.ellipse(cl.x, cl.y, cl.rx, cl.ry, 0, 0, TAU); g.fill();
  }
  blur(0.012);
  g.globalCompositeOperation = 'screen';
  for (const cl of clouds) {
    const lit = clamp(1.1 - cl.d * 1.5);
    g.fillStyle = `rgba(255,178,104,${0.45 * lit * cl.open})`;
    g.beginPath(); g.ellipse(cl.x + (sunX - cl.x) * 0.05, cl.y + cl.ry * 0.65, cl.rx * 0.75, cl.ry * 0.28, 0, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  blur(0.005);
  for (let i = 0; i < 160; i++) {          // texture in the cloud bodies
    const cl = clouds[(R() * clouds.length) | 0];
    g.fillStyle = `rgba(${R() < 0.5 ? '12,14,20' : '70,62,70'},${0.18 * cl.open})`;
    g.beginPath(); g.ellipse(cl.x + (R() - 0.5) * cl.rx * 1.6, cl.y + (R() - 0.5) * cl.ry * 1.4, cl.rx * (0.1 + R() * 0.2), cl.ry * (0.2 + R() * 0.3), 0, 0, TAU); g.fill();
  }
  // crepuscular rays fanning up through the gaps
  blur(0.01);
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 18; i++) {
    const a0 = -Math.PI + 0.35 + i * 0.135 + (R() - 0.5) * 0.05, wdt = 0.015 + R() * 0.03;
    g.fillStyle = `rgba(255,214,150,${0.04 + R() * 0.07})`;
    g.beginPath(); g.moveTo(sunX, sunY);
    g.lineTo(sunX + Math.cos(a0) * PW * 1.5, sunY + Math.sin(a0) * PW * 1.5);
    g.lineTo(sunX + Math.cos(a0 + wdt) * PW * 1.5, sunY + Math.sin(a0 + wdt) * PW * 1.5);
    g.closePath(); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  blur(0);
  // backlit mountain layers with glowing valley mist between them
  const layers = [
    { base: 0.545, amp: 0.13, col: '#a07e72', seed: 1, oct: 4 },
    { base: 0.565, amp: 0.11, col: '#6b5359', seed: 2, oct: 5 },
    { base: 0.585, amp: 0.085, col: '#3a2f37', seed: 3, oct: 5, trees: 0.006 },
    { base: 0.6, amp: 0.05, col: '#17141b', seed: 4, oct: 5, trees: 0.01 }
  ];
  for (const L of layers) {
    // mist glowing in the valley before this layer
    gr = g.createLinearGradient(0, PH * (L.base - L.amp * 0.6), 0, PH * L.base);
    gr.addColorStop(0, 'rgba(255,196,130,0)'); gr.addColorStop(1, 'rgba(255,196,130,0.38)');
    g.fillStyle = gr; g.fillRect(0, PH * (L.base - L.amp * 0.6), PW, PH * L.amp * 0.6);
    const pts = [];
    for (let i = 0; i <= 220; i++) {
      const u = i / 220;
      pts.push([u * PW, PH * (L.base - L.amp * ridge(u * 1.2, L.seed, L.oct) * (0.65 + 0.35 * Math.sin(u * 3 + L.seed)))]);
    }
    const p = new Path2D(); p.moveTo(0, hz + 2); pts.forEach(q => p.lineTo(q[0], q[1])); p.lineTo(PW, hz + 2); p.closePath();
    g.fillStyle = L.col; g.fill(p);
    g.save(); g.clip(p);
    // haze thinning towards the foot, warmer near the sun
    gr = g.createLinearGradient(0, PH * (L.base - L.amp), 0, hz);
    gr.addColorStop(0, 'rgba(255,190,130,0.0)'); gr.addColorStop(1, 'rgba(255,190,130,0.16)');
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    gr = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, PW * 0.5);
    gr.addColorStop(0, 'rgba(255,200,140,0.35)'); gr.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    // gullies / rock texture
    g.lineWidth = Math.max(1, PW * 0.0012);
    for (let i = 0; i < 260; i++) {
      const idx = (R() * 220) | 0, q = pts[idx], len = PH * L.amp * (0.2 + R() * 0.6);
      g.strokeStyle = R() < 0.6 ? 'rgba(0,0,0,0.12)' : 'rgba(255,210,170,0.06)';
      g.beginPath(); g.moveTo(q[0], q[1] + 2); g.lineTo(q[0] + (R() - 0.5) * len * 0.5, q[1] + len); g.stroke();
    }
    g.restore();
    // rim light where the sun grazes the ridge
    g.save();
    blur(0.0015);
    for (let i = 1; i < pts.length; i++) {
      const q0 = pts[i - 1], q = pts[i];
      const k = clamp(1 - Math.abs(q[0] - sunX) / (PW * 0.35));
      if (k <= 0.02) continue;
      g.strokeStyle = `rgba(255,214,150,${0.75 * k * k})`; g.lineWidth = PW * 0.0025;
      g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q[0], q[1]); g.stroke();
    }
    blur(0);
    g.restore();
    if (L.trees) {
      g.fillStyle = L.col;
      for (let i = 0; i < 700; i++) {
        const idx = (R() * 220) | 0, q = pts[idx], h = PH * L.trees * (0.6 + R() * 0.9);
        g.beginPath(); g.moveTo(q[0], q[1] - h); g.lineTo(q[0] + h * 0.2, q[1] + 1); g.lineTo(q[0] - h * 0.2, q[1] + 1); g.closePath(); g.fill();
      }
    }
  }
  // lake: a soft, darker mirror of everything above the horizon
  g.save();
  g.beginPath(); g.rect(0, hz, PW, PH - hz); g.clip();
  g.filter = `blur(${(PW * 0.004).toFixed(1)}px)`;
  g.translate(0, hz * 2); g.scale(1, -1);
  g.drawImage(c, 0, 0);
  g.restore();
  gr = g.createLinearGradient(0, hz, 0, PH);
  gr.addColorStop(0, 'rgba(14,12,16,0.35)'); gr.addColorStop(0.45, 'rgba(10,10,14,0.7)'); gr.addColorStop(1, 'rgba(6,6,9,0.92)');
  g.fillStyle = gr; g.fillRect(0, hz, PW, PH - hz);
  // ripples and the sun's glittering path
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 420; i++) {
    const v = R(), y = hz + 3 + Math.pow(v, 1.5) * (PH - hz);
    const spread = PW * (0.02 + Math.pow(v, 1.1) * 0.2);
    const x = sunX + (R() + R() - 1) * spread, len = PW * (0.006 + R() * 0.04) * (1 - v * 0.4);
    g.fillStyle = `rgba(255,${196 + (R() * 50) | 0},140,${(0.7 - v * 0.6) * (0.3 + R() * 0.7)})`;
    g.fillRect(x - len / 2, y, len, Math.max(1, PH * 0.0016));
  }
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
  for (let i = 0; i < 70; i++) { const y = hz + Math.pow(R(), 1.3) * (PH - hz); g.beginPath(); g.moveTo(0, y); g.lineTo(PW, y + (R() - 0.5) * 3); g.stroke(); }
  // dark shoreline with reeds in the foreground
  blur(0.002);
  g.fillStyle = '#07070a';
  g.beginPath(); g.moveTo(0, PH);
  for (let i = 0; i <= 40; i++) { const u = i / 40; g.lineTo(u * PW, PH * (0.93 + 0.035 * Math.sin(u * 5.3 + 1) + 0.02 * noise1(u * 9))); }
  g.lineTo(PW, PH); g.closePath(); g.fill();
  g.strokeStyle = '#07070a'; g.lineWidth = Math.max(1.2, PW * 0.0018);
  for (let i = 0; i < 90; i++) {
    const x = R() * PW, base = PH * (0.94 + 0.03 * Math.sin(x / PW * 5.3 + 1)), hh = PH * (0.02 + R() * 0.05);
    g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + (R() - 0.5) * hh * 0.4, base - hh * 0.6, x + (R() - 0.5) * hh * 0.5, base - hh); g.stroke();
  }
  blur(0);
  // the page's look: darkened for white type, vignette, a touch of grain
  g.fillStyle = 'rgba(6,7,10,0.3)'; g.fillRect(0, 0, PW, PH);
  gr = g.createRadialGradient(PW / 2, PH * 0.5, PW * 0.35, PW / 2, PH * 0.5, PH * 0.78);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
  const img = g.getImageData(0, 0, PW, PH), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  return c;
}

// rich text: runs of {t, b} wrapped to maxW; returns lines of runs
function wrapRuns(g, runs, maxW, font, boldFont) {
  const words = [];
  for (const r of runs) for (const [i, w] of r.t.split(' ').entries()) {
    if (i > 0) words.push({ sp: true });
    if (w) words.push({ t: w, b: r.b });
  }
  const lines = [[]]; let lw = 0;
  const width = w => { g.font = w.b ? boldFont : font; return g.measureText(w.t).width; };
  g.font = font; const spW = g.measureText(' ').width;
  for (const w of words) {
    if (w.sp) { if (lines[lines.length - 1].length) lw += spW; continue; }
    const ww = width(w);
    if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    const L = lines[lines.length - 1];
    if (L.length) L.push({ t: ' ', b: false, w: spW });
    L.push(Object.assign({ w: ww }, w)); lw += ww + (L.length > 1 ? 0 : 0);
    lw = L.reduce((s2, r) => s2 + r.w, 0);
  }
  return lines;
}
function drawRunLine(g, line, x, y, font, boldFont, align = 'left') {
  const total = line.reduce((s2, r) => s2 + r.w, 0);
  let cx = align === 'center' ? x - total / 2 : x;
  g.textAlign = 'left';
  for (const r of line) { g.font = r.b ? boldFont : font; g.fillText(r.t, cx, y); cx += r.w; }
}

const POST_ART = {};
function drawSozlukPost(g, x, y, w, h, t) {
  const k = 1.6;  // paint at higher resolution so the transition zoom stays crisp
  if (!POST_ART.c) POST_ART.c = paintInsirah(Math.round(w * k), Math.round(h * k));
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.drawImage(POST_ART.c, x, y, w, h);
  // a slow breath of light from the sun (the post is a video)
  g.globalCompositeOperation = 'screen';
  drawGlow(g, x + w * 0.6, y + h * 0.545, w * (0.5 + 0.04 * Math.sin(t * 1.3)), '#ffcf8a', 0.18 + 0.05 * Math.sin(t * 0.9));
  g.globalCompositeOperation = 'source-over';
  const cx = x + w / 2;
  g.fillStyle = '#ffffff';
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 10; g.shadowOffsetY = 2;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  // the word
  const wy = y + h * 0.297 + 22;
  g.font = '700 60px Montserrat';
  g.fillText('“İnşirah”', cx, wy);
  // shimmer sweep across the word
  if (t > TL.postStop) {
    const sweep = ((t - TL.postStop - 0.2) % 2.6) / 2.6;
    const T = layer('shimmer', w, 120);
    T.g.font = g.font; T.g.textAlign = 'center'; T.g.fillStyle = '#fff';
    T.g.fillText('“İnşirah”', w / 2, 90);
    T.g.globalCompositeOperation = 'source-in';
    const sx = -300 + sweep * (w + 600);
    const sg2 = T.g.createLinearGradient(sx - 110, 0, sx + 110, 0);
    sg2.addColorStop(0, 'rgba(255,214,150,0)'); sg2.addColorStop(0.5, 'rgba(255,214,150,0.9)'); sg2.addColorStop(1, 'rgba(255,214,150,0)');
    T.g.fillStyle = sg2; T.g.fillRect(0, 0, w, 120);
    g.save(); g.shadowBlur = 0; g.shadowOffsetY = 0; g.globalCompositeOperation = 'source-atop';
    g.drawImage(T.c, x, wy - 90);
    g.restore();
  }
  g.font = 'italic 400 21px Montserrat';
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.fillText('Sözlük', cx, wy + 34);
  // definition with the bar on its left
  g.fillStyle = '#ffffff';
  const df = '400 27px Montserrat', dfb = '700 27px Montserrat';
  const defLines = wrapRuns(g, [{ t: 'Arapça kökenli bir kelime olup ', b: false }, { t: '"iç açılması, ferahlık"', b: true }, { t: ' demektir.', b: false }], w * 0.76, df, dfb);
  const dy0 = y + h * 0.448 - (defLines.length - 1) * 19;
  defLines.forEach((ln, i) => drawRunLine(g, ln, x + w * 0.135, dy0 + i * 38, df, dfb));
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillRect(x + w * 0.103, dy0 - 46, 2.5, (defLines.length - 1) * 38 + 72);
  g.shadowBlur = 10; g.shadowOffsetY = 2;
  // example sentence
  const ef = '400 30px Montserrat', efb = '700 30px Montserrat';
  const exLines = wrapRuns(g, [{ t: '"Sabahın ilk ışığı, daralmış gönlüme ', b: false }, { t: 'inşirah', b: true }, { t: ' verdi."', b: false }], w * 0.74, ef, efb);
  exLines.forEach((ln, i) => drawRunLine(g, ln, cx, y + h * 0.645 + i * 40, ef, efb, 'center'));
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  // the page's mark
  drawBookIcon(g, cx, y + h * 0.935, 58, '#ffffff', 1.5);
  // muted-video badge
  g.fillStyle = 'rgba(30,30,34,0.75)'; g.beginPath(); g.arc(x + w - 44, y + h - 46, 24, 0, TAU); g.fill();
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 2.2;
  const mx = x + w - 50, my = y + h - 46;
  g.beginPath(); g.moveTo(mx - 9, my - 4); g.lineTo(mx - 4, my - 4); g.lineTo(mx + 3, my - 10); g.lineTo(mx + 3, my + 10); g.lineTo(mx - 4, my + 4); g.lineTo(mx - 9, my + 4); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(mx + 8, my - 5); g.lineTo(mx + 16, my + 5); g.moveTo(mx + 16, my - 5); g.lineTo(mx + 8, my + 5); g.stroke();
  g.restore();
}

function drawStar(g, x, y, r, inner = 0.45) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * (inner > 1 ? 1 / inner : inner) : r;
    g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
  }
  g.closePath(); g.fill();
}

// avatar: black circle with the white open book (the page's profile picture)
function drawAvatarLogo(g, x, y, r) {
  g.fillStyle = '#050506'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  drawBookIcon(g, x, y, r * 1.05, '#ffffff', 1.9);
}

function drawPost(g, idx, top, t, junkFilter) {
  const F = FEED, x = F.sx, w = F.sw;
  if (top > F.sy + F.sh + 20 || top + F.postH < F.sy - 20) return;
  const isS = idx === F.K;
  // header
  if (isS) drawAvatarLogo(g, x + 64, top + 56, 34);
  else {
    const R = mulberry32(idx * 13);
    g.fillStyle = `hsl(${(R() * 360) | 0},55%,55%)`; g.beginPath(); g.arc(x + 64, top + 56, 34, 0, TAU); g.fill();
  }
  g.fillStyle = '#eeeef0'; g.font = '600 32px Inter'; g.textAlign = 'left';
  g.fillText(isS ? 'sozlukdeus' : FEED_NAMES[idx % 8], x + 116, top + 52);
  g.fillStyle = 'rgba(230,230,235,0.75)'; g.font = '400 24px Inter';
  if (isS) {
    g.fillText('♫  sozlukdeus · Orijinal ses', x + 116, top + 86);
  } else g.fillText(idx % 3 === 0 ? 'Sponsorlu' : 'Önerilen', x + 116, top + 84);
  g.fillStyle = 'rgba(230,230,235,0.8)';
  for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + w - 70 + k * 14, top + 56, 3.5, 0, TAU); g.fill(); }
  // media
  const my = top + F.mediaY;
  if (isS) drawSozlukPost(g, x, my, w, F.mediaH, t);
  else {
    g.save(); g.filter = junkFilter; drawJunk(g, idx, x, my, w, F.mediaH, t); g.restore();
  }
  // actions
  const ay = my + F.mediaH + 62;
  g.strokeStyle = '#eceaf0'; g.lineWidth = 3.4; g.lineJoin = 'round'; g.lineCap = 'round';
  g.fillStyle = '#eceaf0'; g.font = '600 28px Inter'; g.textAlign = 'left';
  const R2 = mulberry32(idx * 7 + 3);
  const counts = isS ? ['2.418', '96', '312', '1.204'] : [`${(R2() * 90 + 3).toFixed(1)} B`, `${(R2() * 900) | 0}`, `${(R2() * 300) | 0}`, `${(R2() * 2000) | 0}`];
  let ix = x + 46;
  const icons = [iconHeart, iconBubble, iconRepost, iconPlane];
  icons.forEach((fn, i) => {
    fn(g, ix, ay, 40);
    g.fillText(counts[i], ix + 30, ay + 10);
    ix += 62 + g.measureText(counts[i]).width + 20;
  });
  iconMark(g, x + w - 52, ay, 40);
  // caption
  g.font = '400 28px Inter';
  if (isS) {
    g.font = '600 28px Inter'; g.fillStyle = '#eceaf0';
    g.fillText('sozlukdeus', x + 30, ay + 76);
    const nw = g.measureText('sozlukdeus ').width;
    g.font = '400 28px Inter';
    g.fillText('Sözlüğümüzden yeni bir kelime: “inşirah”.', x + 30 + nw, ay + 76);
    g.fillText('Arapça kökenli bu sözcük, “iç açılması”…', x + 30, ay + 114);
    g.fillStyle = 'rgba(236,234,240,0.55)';
    g.fillText(' devamı', x + 30 + g.measureText('Arapça kökenli bu sözcük, “iç açılması”…').width, ay + 114);
  } else {
    g.fillStyle = 'rgba(236,234,240,0.55)';
    rr(g, x + 30, ay + 62, 520 - (idx % 3) * 90, 24, 12); g.fill();
    rr(g, x + 30, ay + 100, 340 + (idx % 2) * 80, 24, 12); g.fill();
  }
}

function drawFeedContent(g, s, t, junkFilter) {
  const F = FEED;
  g.fillStyle = '#0c0c0f'; g.fillRect(F.sx, F.sy, F.sw, F.sh);
  const first = Math.max(0, Math.floor((s - 300) / F.postH));
  for (let i = first; i < first + 4; i++) {
    const top = F.sy + 190 + i * F.postH - s;
    drawPost(g, i, top, t, junkFilter);
  }
}

function drawPovHands(g, t, warm) {
  const skin = mixc('#5e6372', '#b9876a', warm), skinHi = mixc('#c6d4ee', '#ffd9a0', warm), shadow = mixc('#151820', '#4a2a1c', warm);
  // left hand: palm in shadow at the edge, fingertips curling over the bezel
  g.save();
  const palm = new Path2D();
  palm.moveTo(-40, 560); palm.quadraticCurveTo(60, 600, 70, 760); palm.lineTo(80, 1260); palm.quadraticCurveTo(40, 1400, -40, 1440); palm.closePath();
  g.fillStyle = rgb(shadow); g.fill(palm);
  for (const [y, len, rot] of [[690, 128, -0.12], [850, 138, -0.05], [1005, 130, 0.03], [1150, 112, 0.1]]) {
    g.save(); g.translate(30, y); g.rotate(rot);
    const f = new Path2D(); f.roundRect(-30, -30, len, 60, 30);
    g.fillStyle = rgb(skin); g.fill(f);
    g.save(); g.clip(f);
    const gr = g.createLinearGradient(-30, 0, len - 30, 0);
    gr.addColorStop(0, rgb(shadow, 0.9)); gr.addColorStop(0.6, rgb(shadow, 0.15)); gr.addColorStop(1, rgb(skinHi, 0.5));
    g.fillStyle = gr; g.fillRect(-40, -40, len + 20, 80);
    g.fillStyle = rgb(shadow, 0.45); g.fillRect(-40, 12, len + 20, 30);
    g.restore();
    g.restore();
  }
  g.restore();
  // thumb from bottom right; flicks drag it upward
  let flickY = 0;
  for (const f of TL.flicksFeed.concat([TL.postArrive])) {
    const d = t - f;
    if (d > 0 && d < 0.32) flickY = Math.max(flickY, Math.sin(Math.min(1, d / 0.16) * Math.PI / 2) * 300 * (d < 0.16 ? 1 : 1 - (d - 0.16) / 0.16));
  }
  const away = ss(TL.postStop - 0.1, TL.postStop + 0.6, t);
  const tx = 800 + away * 180, ty = 1560 - flickY + away * 340;
  g.save();
  g.translate(tx, ty); g.rotate(-0.5 + away * 0.15);
  const p = new Path2D();
  p.moveTo(-52, 30); p.bezierCurveTo(-60, -60, -36, -96, 2, -98); p.bezierCurveTo(44, -98, 62, -60, 58, -10);
  p.bezierCurveTo(66, 120, 96, 260, 150, 640); p.lineTo(-90, 640); p.bezierCurveTo(-70, 300, -48, 160, -52, 30); p.closePath();
  g.fillStyle = rgb(skin); g.fill(p);
  g.save(); g.clip(p);
  let gr = g.createLinearGradient(-70, 0, 80, 0);
  gr.addColorStop(0, rgb(shadow, 0.7)); gr.addColorStop(0.45, rgb(skin, 0)); gr.addColorStop(0.85, rgb(skinHi, 0.35)); gr.addColorStop(1, rgb(skinHi, 0.1));
  g.fillStyle = gr; g.fillRect(-100, -120, 280, 800);
  gr = g.createLinearGradient(0, -100, 0, 500);
  gr.addColorStop(0, rgb(skinHi, 0.25)); gr.addColorStop(0.3, rgb(skinHi, 0)); gr.addColorStop(1, rgb(shadow, 0.7));
  g.fillStyle = gr; g.fillRect(-100, -120, 280, 800);
  // knuckle crease
  g.strokeStyle = rgb(shadow, 0.5); g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-30, 130); g.quadraticCurveTo(0, 122, 34, 132); g.stroke();
  g.restore();
  // nail
  const nail = new Path2D(); nail.roundRect(-30, -84, 58, 72, [26, 26, 14, 14]);
  g.fillStyle = rgb(mixc(skin, '#ffffff', 0.22)); g.fill(nail);
  g.fillStyle = rgb(skinHi, 0.35); g.beginPath(); g.ellipse(-8, -58, 8, 18, 0, 0, TAU); g.fill();
  g.restore();
}

function renderFeed(g, t) {
  const F = FEED;
  const goldK = ss(TL.postArrive, TL.postStop + 0.4, t);
  // dark room behind the phone, out of focus
  g.fillStyle = '#05070b'; g.fillRect(0, 0, W, H);
  drawGlow(g, 980, 300, 380, '#25344f', 0.6);
  drawGlow(g, 120, 1500, 300, '#1a2233', 0.5);

  // push-in on the post after it stops, then zoom into the word for the transition
  const push = ss(TL.postStop, TL.feed[1], t) * 0.05 + easeIn(inv(10.75, 11.45, t)) * 1.4;
  const enter = 1 - easeOut(inv(5.45, 5.95, t));
  const sc = 1 + push + enter * 0.35;
  const fx = W / 2, fy = lerp(H / 2, F.sy + F.landY + F.mediaY + F.mediaH * 0.297, ss(10.6, 11.2, t));
  g.save();
  g.translate(fx, fy); g.scale(sc, sc); g.translate(-fx, -fy);

  // phone body
  g.fillStyle = '#0b0c10'; rr(g, 86, 36, 908, 1940, 96); g.fill();
  g.strokeStyle = rgb(mixc('#3a4152', '#8a6c3a', goldK), 0.9); g.lineWidth = 3; rr(g, 87, 37, 906, 1938, 95); g.stroke();
  // screen content with motion smear
  const s = feedScroll(t);
  const v = (feedScroll(t + 0.01) - feedScroll(t - 0.01)) / 0.02;
  const blurLen = Math.min(260, Math.abs(v) / 60);
  const grey = ss(6.6, 8.4, t);
  const junkFilter = `saturate(${lerp(0.9, 0.25, grey).toFixed(2)}) brightness(${lerp(0.95, 0.72, grey + goldK * 0.3).toFixed(2)})`;
  const C = layer('feedContent');
  drawFeedContent(C.g, s, t, junkFilter);
  // ghost echoes: contents bleeding into each other as time blurs
  const ghost = ss(6.4, 8.2, t) * (1 - goldK);
  if (ghost > 0.01) {
    C.g.globalAlpha = 0.22 * ghost; drawFeedContent(C.g, s + F.postH * 0.5, t, junkFilter);
    C.g.globalAlpha = 0.14 * ghost; drawFeedContent(C.g, s - F.postH * 0.33, t, junkFilter);
    C.g.globalAlpha = 1;
  }
  g.save();
  rr(g, F.sx, F.sy, F.sw, F.sh, 80); g.clip();
  const n = blurLen > 4 ? 7 : 1;
  for (let i = 0; i < n; i++) {
    g.globalAlpha = 1 / (i + 1) * (n > 1 ? 1 : 1);
    const off = n > 1 ? (i / (n - 1) - 0.5) * blurLen : 0;
    if (i === 0) { g.globalAlpha = 1; g.drawImage(C.c, 0, off); }
    else { g.globalAlpha = 1 / (i + 1); g.drawImage(C.c, 0, off); }
  }
  g.globalAlpha = 1;
  // status + app bars (fixed)
  g.fillStyle = '#0c0c0f'; g.fillRect(F.sx, F.sy, F.sw, 190);
  g.fillStyle = '#e8e8ea'; g.font = '600 30px Inter'; g.textAlign = 'left';
  g.fillText('03:47', F.sx + 70, F.sy + 52);
  g.fillRect(F.sx + F.sw - 120, F.sy + 32, 48, 22); g.fillRect(F.sx + F.sw - 70, F.sy + 38, 4, 10);
  g.font = '600 46px Inter'; g.fillText('Keşfet', F.sx + 36, F.sy + 150);
  g.strokeStyle = '#e8e8ea'; g.lineWidth = 3.4;
  iconHeart(g, F.sx + F.sw - 140, F.sy + 134, 42); iconPlane(g, F.sx + F.sw - 60, F.sy + 134, 40);
  g.fillStyle = 'rgba(12,12,15,0.96)'; g.fillRect(F.sx, F.sy + F.sh - 140, F.sw, 140);
  g.strokeStyle = '#e8e8ea'; g.lineWidth = 3.4;
  for (let k = 0; k < 5; k++) { rr(g, F.sx + 80 + k * 172, F.sy + F.sh - 104, 44, 44, 12); g.stroke(); }
  // the post glows a little once it is noticed
  if (goldK > 0.01) {
    g.globalCompositeOperation = 'screen';
    const gy = F.sy + 190 + F.K * F.postH - s + F.mediaY + F.mediaH * 0.45;
    drawGlow(g, W / 2, gy, 700, '#b8862f', 0.25 * goldK);
    g.globalCompositeOperation = 'source-over';
    // dim everything outside the post
    g.fillStyle = `rgba(0,0,0,${0.45 * goldK})`;
    const top = F.sy + 190 + F.K * F.postH - s;
    g.fillRect(F.sx, F.sy, F.sw, Math.max(0, top - F.sy));
    g.fillRect(F.sx, top + F.mediaY + F.mediaH + 160, F.sw, 2000);
  }
  // glass reflection
  const gl = g.createLinearGradient(F.sx, F.sy, F.sx + F.sw, F.sy + F.sh);
  gl.addColorStop(0, 'rgba(255,255,255,0.05)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0.02)');
  g.fillStyle = gl; g.fillRect(F.sx, F.sy, F.sw, F.sh);
  g.restore();
  drawPovHands(g, t, goldK * 0.5);
  g.restore();

  // gold motes beginning to lift off the post
  const mot = ss(TL.postStop + 0.3, TL.feed[1], t);
  if (mot > 0.01) {
    g.globalCompositeOperation = 'lighter';
    const R = mulberry32(5);
    for (let i = 0; i < 40; i++) {
      const s0 = R(), life = (t * (0.15 + s0 * 0.2) + R()) % 1;
      const x = 160 + R() * 760 + Math.sin(t + i) * 20, y = 1300 - life * 900;
      drawGlow(g, x, y, 6 + s0 * 8, '#ffd27a', mot * Math.sin(life * Math.PI) * 0.8);
    }
    g.globalCompositeOperation = 'source-over';
  }
  // emerging from the white flash of the push-in
  const wf = 1 - ss(5.62, 6.05, t);
  if (wf > 0.001) { g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(200,220,255,${wf * 0.85})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  // transition flare into the eye
  const fl = win(10.95, 11.35, 11.4, 11.6, t);
  if (fl > 0.001) { g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,214,140,${fl * 0.9})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
}
