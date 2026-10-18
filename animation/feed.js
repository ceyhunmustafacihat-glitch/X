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

// the page's open-book mark (24x24 box): arched page tops, pages meeting at the spine
const BOOK_ICON = [
  new Path2D('M12 6.5C9.5 4.8 6 4.3 2.5 5.2V18.6C6 17.8 9.5 18.3 12 20'),
  new Path2D('M12 6.5C14.5 4.8 18 4.3 21.5 5.2V18.6C18 17.8 14.5 18.3 12 20'),
  new Path2D('M12 6.5V20')];
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
// 2D value noise + fBm (for clouds and rock texture)
function vnoise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (i, j) => { const q = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return q - Math.floor(q); };
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
function fbm2(x, y, seed, oct = 5) {
  let a = 0.5, f = 1, sum = 0, n = 0;
  for (let i = 0; i < oct; i++) { sum += a * vnoise2(x * f, y * f, seed + i * 17); n += a; a *= 0.5; f *= 2.03; }
  return sum / n;
}

// "İnşirah": dawn breaking through heavy clouds behind layered mountains, mirrored in a still lake.
// Painted once at load (about the size it is shown at).
function paintInsirah(PW, PH) {
  const c = makeCanvas(PW, PH), g = c.getContext('2d');
  const R = mulberry32(404);
  const hz = PH * 0.665;                     // horizon / lake line
  const sunX = PW * 0.62, sunY = PH * 0.6;   // low, just behind the far range
  const blur = px => (g.filter = px > 0 ? `blur(${(px * PW).toFixed(1)}px)` : 'none');
  // sky: dark above, the warm band kept low near the horizon (white type sits above it)
  let gr = g.createLinearGradient(0, 0, 0, hz);
  gr.addColorStop(0, '#0b0e15'); gr.addColorStop(0.4, '#1c212d'); gr.addColorStop(0.62, '#3c363f');
  gr.addColorStop(0.8, '#9a6a48'); gr.addColorStop(0.92, '#e3a764'); gr.addColorStop(1, '#ffd89a');
  g.fillStyle = gr; g.fillRect(0, 0, PW, hz + 4);
  g.globalCompositeOperation = 'screen';
  for (const [r, a] of [[0.8, 0.22], [0.4, 0.38], [0.16, 0.65], [0.05, 0.95]]) {
    gr = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, PW * r);
    gr.addColorStop(0, `rgba(255,222,160,${a})`); gr.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = gr; g.fillRect(0, 0, PW, hz + 4);
  }
  g.globalCompositeOperation = 'source-over';
  // clouds: domain-warped fBm density at 1/3 resolution, lit on the side facing the sun
  {
    const cw = Math.round(PW / 3), ch = Math.round(hz / 3);
    const cc = makeCanvas(cw, ch), cg = cc.getContext('2d');
    const img = cg.createImageData(cw, ch), d = img.data;
    const sx = sunX / PW, sy = sunY / hz;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const u = x / cw, v = y / ch;
      const q = fbm2(u * 2.2, v * 5.5, 3, 4);
      const dens = fbm2(u * 2.6 + q * 1.1, v * 6.5 + q * 0.7, 7, 6);
      const toward = fbm2((u + (sx - u) * 0.03) * 2.6 + q * 1.1, (v + (sy - v) * 0.03) * 6.5 + q * 0.7, 7, 6);
      const dist = Math.hypot((u - sx) * 1.1, (v - sy) * 0.75);
      const cover = sstep(clamp((0.92 - v) / 0.5)) * clamp(dist * 2.6 - 0.32);
      const a = sstep(clamp((dens - 0.44) / 0.22)) * cover;
      if (a <= 0.003) continue;
      const lit = clamp((dens - toward) * 9 + 0.15) * clamp(1.25 - dist * 1.6);
      const body = clamp(1 - v * 0.6);
      const k = (y * cw + x) * 4;
      d[k] = lerp(lerp(20, 58, 1 - body), 246, lit);
      d[k + 1] = lerp(lerp(23, 50, 1 - body), 176, lit);
      d[k + 2] = lerp(lerp(32, 58, 1 - body), 108, lit);
      d[k + 3] = a * 245;
    }
    cg.putImageData(img, 0, 0);
    g.imageSmoothingQuality = 'high';
    blur(0.002);
    g.drawImage(cc, 0, 0, PW, hz);
    blur(0);
  }
  // soft crepuscular rays through the gaps
  blur(0.03);
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 12; i++) {
    const a0 = -Math.PI + 0.45 + i * 0.19 + (R() - 0.5) * 0.08, wdt = 0.03 + R() * 0.05;
    g.fillStyle = `rgba(255,206,140,${0.035 + R() * 0.045})`;
    g.beginPath(); g.moveTo(sunX, sunY);
    g.lineTo(sunX + Math.cos(a0) * PW * 1.4, sunY + Math.sin(a0) * PW * 1.4);
    g.lineTo(sunX + Math.cos(a0 + wdt) * PW * 1.4, sunY + Math.sin(a0 + wdt) * PW * 1.4);
    g.closePath(); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  blur(0);
  // rock texture used to break up the mountain faces
  const tex = makeCanvas(Math.round(PW / 2), Math.round(PH / 4));
  {
    const tg = tex.getContext('2d'), img = tg.createImageData(tex.width, tex.height), d = img.data;
    for (let y = 0; y < tex.height; y++) for (let x = 0; x < tex.width; x++) {
      const u = x / tex.width, v = y / tex.height;
      const n = fbm2(u * 14, v * 7 + fbm2(u * 6, v * 3, 5, 3) * 1.5, 11, 5);
      const k = (y * tex.width + x) * 4, val = n * 255;
      d[k] = d[k + 1] = d[k + 2] = val; d[k + 3] = 255;
    }
    tg.putImageData(img, 0, 0);
  }
  // backlit mountain layers with glowing mist in the valleys between them
  const layers = [
    { base: 0.6, amp: 0.15, col: '#8d7270', seed: 1, oct: 5, haze: 0.42, fog: 0.004 },
    { base: 0.625, amp: 0.115, col: '#5b4850', seed: 2, oct: 6, haze: 0.26, fog: 0.002 },
    { base: 0.648, amp: 0.085, col: '#30282f', seed: 3, oct: 6, trees: 0.009, haze: 0.12 },
    { base: 0.668, amp: 0.05, col: '#141217', seed: 4, oct: 6, trees: 0.014, haze: 0.04 }
  ];
  for (const L of layers) {
    gr = g.createLinearGradient(0, PH * (L.base - L.amp * 0.7), 0, PH * L.base);
    gr.addColorStop(0, 'rgba(255,190,125,0)'); gr.addColorStop(1, `rgba(255,190,125,${0.2 + L.haze * 0.5})`);
    g.fillStyle = gr; g.fillRect(0, PH * (L.base - L.amp * 0.7), PW, PH * L.amp * 0.7);
    const pts = [];
    for (let i = 0; i <= 260; i++) {
      const u = i / 260;
      const saddle = 1 - 0.55 * Math.exp(-Math.pow((u - sunX / PW) / 0.09, 2)) * (L.seed <= 2 ? 1 : 0.3);
      pts.push([u * PW, PH * (L.base - L.amp * ridge(u * 1.25, L.seed, L.oct) * (0.6 + 0.4 * Math.sin(u * 3 + L.seed)) * saddle)]);
    }
    const p = new Path2D(); p.moveTo(0, hz + 2); pts.forEach(q => p.lineTo(q[0], q[1])); p.lineTo(PW, hz + 2); p.closePath();
    if (L.fog) blur(L.fog);
    g.fillStyle = L.col; g.fill(p);
    blur(0);
    g.save(); g.clip(p);
    g.globalCompositeOperation = 'soft-light';
    g.globalAlpha = 0.55;
    g.drawImage(tex, 0, PH * (L.base - L.amp * 1.1), PW, PH * L.amp * 1.4);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    // aerial perspective: haze thickens towards the foot; warm bloom near the sun
    gr = g.createLinearGradient(0, PH * (L.base - L.amp), 0, hz);
    gr.addColorStop(0, 'rgba(255,190,130,0)'); gr.addColorStop(1, `rgba(255,190,130,${L.haze * 0.6})`);
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    gr = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, PW * 0.42);
    gr.addColorStop(0, `rgba(255,200,140,${0.15 + L.haze * 0.6})`); gr.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    g.restore();
    // rim light where the low sun grazes the ridge
    blur(0.0012);
    for (let i = 1; i < pts.length; i++) {
      const q0 = pts[i - 1], q = pts[i];
      const k = clamp(1 - Math.abs(q[0] - sunX) / (PW * 0.3));
      if (k <= 0.02) continue;
      g.strokeStyle = `rgba(255,214,150,${0.8 * k * k * (0.4 + L.haze)})`; g.lineWidth = PW * 0.0022;
      g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q[0], q[1]); g.stroke();
    }
    blur(0);
    if (L.trees) {
      // clustered conifers with gaps, a little down the slope too, drawn back to front
      const trees = [];
      for (let i = 0; i < 900; i++) {
        const u = R(), idx = Math.round(u * 260), q = pts[idx];
        if (fbm2(u * 18, L.seed, 21, 3) < 0.47) continue;
        trees.push([q[0], q[1] + R() * PH * L.trees * 1.6, PH * L.trees * (0.5 + R() * 1.0)]);
      }
      trees.sort((A, B) => A[1] - B[1]);
      const tc = mixc(L.col, '#000000', 0.25);
      for (const [x, y, h] of trees) {
        g.fillStyle = rgb(tc);
        g.beginPath();
        for (let tier = 0; tier < 3; tier++) {
          const ty = y - h + tier * h * 0.3, tw = h * (0.12 + tier * 0.07);
          g.moveTo(x, ty); g.lineTo(x + tw, ty + h * 0.42); g.lineTo(x - tw, ty + h * 0.42); g.closePath();
        }
        g.fill();
      }
    }
  }
  // lake: the scene above, mirrored with a gentle ripple displacement
  {
    const strip = 3;
    g.save();
    g.beginPath(); g.rect(0, hz, PW, PH - hz); g.clip();
    for (let y = hz; y < PH; y += strip) {
      const depth = (y - hz) / (PH - hz);
      const dx = Math.sin(y * 0.11 + noise1(y * 0.03) * 3) * (1 + depth * 9);
      const srcY = hz - (y - hz) * 1.0 - strip;
      if (srcY < 0) break;
      g.drawImage(c, 0, srcY, PW, strip, dx, y, PW, strip);
    }
    g.restore();
    // flip each strip: drawing rows from above the horizon downward already mirrors them
    gr = g.createLinearGradient(0, hz, 0, PH);
    gr.addColorStop(0, 'rgba(14,12,16,0.3)'); gr.addColorStop(0.4, 'rgba(10,10,14,0.68)'); gr.addColorStop(1, 'rgba(6,6,9,0.93)');
    g.fillStyle = gr; g.fillRect(0, hz, PW, PH - hz);
    // glitter: soft elongated highlights in a column under the sun, longer towards us
    g.globalCompositeOperation = 'screen';
    const spr = glowSprite('#ffd496');
    for (let i = 0; i < 320; i++) {
      const v = Math.pow(R(), 1.4), y = hz + 2 + v * (PH - hz) * 0.85;
      const spread = PW * (0.015 + v * 0.16);
      const x = sunX + (R() + R() - 1) * spread;
      const len = PW * (0.008 + R() * 0.03) * (0.5 + v * 1.6), th = PH * (0.002 + v * 0.004);
      g.globalAlpha = (0.75 - v * 0.55) * (0.35 + R() * 0.65);
      g.drawImage(spr, x - len / 2, y - th / 2, len, th);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
  // dark shoreline with reeds in the foreground
  blur(0.0018);
  g.fillStyle = '#07070a';
  g.beginPath(); g.moveTo(0, PH);
  for (let i = 0; i <= 40; i++) { const u = i / 40; g.lineTo(u * PW, PH * (0.94 + 0.03 * Math.sin(u * 5.3 + 1) + 0.015 * noise1(u * 9))); }
  g.lineTo(PW, PH); g.closePath(); g.fill();
  g.strokeStyle = '#07070a'; g.lineWidth = Math.max(1.2, PW * 0.0018);
  for (let i = 0; i < 90; i++) {
    const x = R() * PW, base = PH * (0.945 + 0.03 * Math.sin(x / PW * 5.3 + 1)), hh = PH * (0.015 + R() * 0.045);
    g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + (R() - 0.5) * hh * 0.4, base - hh * 0.6, x + (R() - 0.5) * hh * 0.5, base - hh); g.stroke();
  }
  blur(0);
  // the page's look: darkened for white type (more behind the text blocks), vignette, grain
  g.fillStyle = 'rgba(6,7,10,0.28)'; g.fillRect(0, 0, PW, PH);
  for (const [cy, ry, a] of [[0.27, 0.06, 0.35], [0.445, 0.07, 0.42], [0.655, 0.06, 0.3]]) {
    gr = g.createRadialGradient(PW / 2, PH * cy, 0, PW / 2, PH * cy, PW * 0.55);
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(PW / 2, PH * cy); g.scale(1, ry / 0.55 * (PH / PW) * 1.8); g.translate(-PW / 2, -PH * cy);
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH * 2); g.restore();
  }
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
  // split runs into words, remembering where real spaces were
  const words = [];
  for (const r of runs) r.t.split(/( )/).forEach(w => { if (w === ' ') words.push({ sp: true }); else if (w) words.push({ t: w, b: r.b }); });
  g.font = font; const spW = g.measureText(' ').width;
  const lines = [[]]; let lw = 0, space = false;
  for (const w of words) {
    if (w.sp) { space = true; continue; }
    g.font = w.b ? boldFont : font;
    const ww = g.measureText(w.t).width;
    let L = lines[lines.length - 1];
    if (space && L.length && lw + spW + ww > maxW) { lines.push([]); L = lines[lines.length - 1]; lw = 0; }
    else if (space && L.length) { L.push({ t: ' ', b: false, w: spW }); lw += spW; }
    L.push({ t: w.t, b: w.b, w: ww }); lw += ww;
    space = false;
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
// paint the post's background once, at load, instead of mid-playback
function warmFeed() { if (!POST_ART.c) POST_ART.c = paintInsirah(FEED.sw, FEED.mediaH); }
function drawSozlukPost(g, x, y, w, h, t) {
  warmFeed();
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.drawImage(POST_ART.c, x, y, w, h);
  // a slow breath of light from the sun (the post is a video)
  g.globalCompositeOperation = 'screen';
  drawGlow(g, x + w * 0.62, y + h * 0.6, w * (0.42 + 0.03 * Math.sin(t * 1.3)), '#ffcf8a', 0.12 + 0.04 * Math.sin(t * 0.9));
  g.globalCompositeOperation = 'source-over';
  const cx = x + w / 2;
  g.fillStyle = '#ffffff';
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 10; g.shadowOffsetY = 2;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  // the word
  const wy = y + h * 0.297 + 22;
  g.font = '800 60px Montserrat';
  g.letterSpacing = '-0.5px';
  g.fillText('“İnşirah”', cx, wy);
  g.letterSpacing = '0px';
  // shimmer sweep across the word
  if (t > TL.postStop) {
    const sweep = ((t - TL.postStop - 0.2) % 2.6) / 2.6;
    const T = layer('shimmer', w, 120);
    T.g.font = '800 60px Montserrat'; T.g.letterSpacing = '-0.5px'; T.g.textAlign = 'center'; T.g.fillStyle = '#fff';
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
  drawBookIcon(g, x, y, r * 0.95, '#ffffff', 1.6);
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
    // filled double note, then the audio line
    g.save(); g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineWidth = 2.4;
    const nx = x + 118, ny = top + 86;
    g.beginPath(); g.ellipse(nx + 3, ny - 1, 4.6, 3.6, -0.4, 0, TAU); g.ellipse(nx + 15, ny - 4, 4.6, 3.6, -0.4, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(nx + 7, ny - 2); g.lineTo(nx + 7, ny - 19); g.lineTo(nx + 19, ny - 22); g.lineTo(nx + 19, ny - 5); g.stroke();
    g.fillRect(nx + 6, ny - 21, 14, 4);
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.fillText('sozlukdeus · Orijinal ses', x + 146, top + 86);
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
  const tr = n => n.toLocaleString('tr-TR');
  const counts = isS ? ['2.418', '96', '312', '1.204'] : [`${(R2() * 90 + 3).toFixed(1).replace('.', ',')} B`, tr((R2() * 900) | 0), tr((R2() * 300) | 0), tr((R2() * 2000) | 0)];
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
  const ghost = ss(6.4, 8.2, t) * (1 - ss(TL.postArrive, TL.postStop - 0.15, t));
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
    const gy = F.sy + 190 + F.K * F.postH - s + F.mediaY + F.mediaH * 0.62;
    drawGlow(g, W / 2, gy, 640, '#b8862f', 0.16 * goldK);
    g.globalCompositeOperation = 'source-over';
    // dim everything outside the post
    g.fillStyle = `rgba(0,0,0,${0.45 * goldK})`;
    const top = F.sy + 190 + F.K * F.postH - s;
    g.fillRect(F.sx, F.sy, F.sw, Math.max(0, top - F.sy));
    g.fillRect(F.sx, top + F.postH, F.sw, 2000);
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
