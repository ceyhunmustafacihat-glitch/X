'use strict';
// Phone POV: an endless, grey feed — until the sözlükdeus post stops the thumb.

const FEED = {
  sx: 104, sy: 54, sw: 872, sh: 1880,      // screen rect
  postH: 1420, mediaY: 112, mediaH: 1090,
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

// ---- the sözlükdeus post (media area) ----
function drawSozlukPost(g, x, y, w, h, t) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#09090b'; g.fillRect(x, y, w, h);
  const cx = x + w / 2;
  let gr = g.createRadialGradient(cx, y + h * 0.45, 40, cx, y + h * 0.45, h * 0.75);
  gr.addColorStop(0, 'rgba(60,44,18,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  // fine gold dust
  const R = mulberry32(77);
  for (let i = 0; i < 70; i++) {
    const px = x + R() * w, py = y + R() * h, s = R();
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + s) + i));
    g.fillStyle = rgb('#e8c27a', 0.12 + 0.25 * s * tw);
    g.fillRect(px, py, 1.5 + s * 1.5, 1.5 + s * 1.5);
  }
  // double frame + corner ornaments
  g.strokeStyle = rgb(GOLD, 0.85); g.lineWidth = 2.2;
  g.strokeRect(x + 34, y + 34, w - 68, h - 68);
  g.strokeStyle = rgb(GOLD, 0.4); g.lineWidth = 1;
  g.strokeRect(x + 46, y + 46, w - 92, h - 92);
  g.fillStyle = rgb(GOLD);
  for (const [ox, oy] of [[34, 34], [w - 34, 34], [34, h - 34], [w - 34, h - 34]]) {
    g.save(); g.translate(x + ox, y + oy); g.rotate(Math.PI / 4); g.fillRect(-7, -7, 14, 14); g.restore();
  }
  // book icon
  const by = y + 150;
  g.strokeStyle = rgb(GOLD); g.lineWidth = 2.5; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(cx, by + 26); g.quadraticCurveTo(cx - 30, by + 10, cx - 62, by + 18); g.lineTo(cx - 62, by - 18); g.quadraticCurveTo(cx - 30, by - 26, cx, by - 10); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(cx, by + 26); g.quadraticCurveTo(cx + 30, by + 10, cx + 62, by + 18); g.lineTo(cx + 62, by - 18); g.quadraticCurveTo(cx + 30, by - 26, cx, by - 10); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(cx, by - 10); g.lineTo(cx, by + 26); g.stroke();
  // label
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = rgb(GOLD, 0.9); g.font = '600 30px "Cormorant Garamond"';
  spacedText(g, 'GÜNÜN KELİMESİ', cx + 5, y + 238, 9);
  // the word
  const wy = y + 470;
  g.font = '600 178px "Cormorant Garamond"';
  gr = g.createLinearGradient(x, wy - 150, x, wy + 20);
  gr.addColorStop(0, '#f8e3a8'); gr.addColorStop(0.5, '#e0b562'); gr.addColorStop(1, '#a8772c');
  g.fillStyle = gr;
  g.shadowColor = 'rgba(230,180,90,0.45)'; g.shadowBlur = 30;
  g.fillText('İnşirah', cx, wy);
  g.shadowBlur = 0;
  // shimmer sweep
  const sweep = ((t - TL.postStop - 0.2) % 2.6) / 2.6;
  if (t > TL.postStop) {
    const sx = x - 300 + sweep * (w + 600);
    // draw the sweep only inside the glyphs
    const T = layer('shimmer', w, 240);
    T.g.font = g.font; T.g.textAlign = 'center'; T.g.fillStyle = '#fff';
    T.g.fillText('İnşirah', w / 2, 200);
    T.g.globalCompositeOperation = 'source-in';
    const sg2 = T.g.createLinearGradient(sx - x - 120, 0, sx - x + 120, 0);
    sg2.addColorStop(0, 'rgba(255,250,230,0)'); sg2.addColorStop(0.5, 'rgba(255,250,230,0.85)'); sg2.addColorStop(1, 'rgba(255,250,230,0)');
    T.g.fillStyle = sg2; T.g.fillRect(0, 0, w, 240);
    g.globalCompositeOperation = 'lighter';
    g.drawImage(T.c, x, wy - 200);
    g.globalCompositeOperation = 'source-over';
  }
  g.fillStyle = rgb(CREAM, 0.6); g.font = 'italic 500 40px "Cormorant Garamond"';
  g.fillText('in·şi·rah  ·  isim', cx, wy + 72);
  // divider
  const dy = wy + 140;
  g.strokeStyle = rgb(GOLD, 0.7); g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(cx - 220, dy); g.lineTo(cx - 22, dy); g.moveTo(cx + 22, dy); g.lineTo(cx + 220, dy); g.stroke();
  g.save(); g.translate(cx, dy); g.rotate(Math.PI / 4); g.fillStyle = rgb(GOLD); g.fillRect(-6, -6, 12, 12); g.restore();
  // meaning
  g.fillStyle = rgb(CREAM, 0.95); g.font = '500 60px "Cormorant Garamond"';
  g.fillText('Ferahlık, iç açılması;', cx, dy + 104);
  g.fillText('gönül açılması.', cx, dy + 176);
  g.fillStyle = rgb(CREAM, 0.55); g.font = 'italic 400 38px "Cormorant Garamond"';
  g.fillText('“Sabahın ilk ışığı içime inşirah verdi.”', cx, dy + 262);
  // footer: star · quill · crescent + name
  const fy = y + h - 110;
  g.fillStyle = rgb(GOLD, 0.85);
  drawStar(g, cx - 70, fy - 6, 9, 4);
  g.strokeStyle = rgb(GOLD, 0.85); g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx - 12, fy + 8); g.quadraticCurveTo(cx + 2, fy - 12, cx + 16, fy - 22); g.stroke();
  g.beginPath(); g.arc(cx + 70, fy - 6, 11, 0, TAU); g.arc(cx + 75, fy - 9, 9, 0, TAU, true); g.fill('evenodd');
  g.font = '500 30px "Cormorant Garamond"'; g.fillStyle = rgb(GOLD, 0.75);
  spacedText(g, 'sözlükdeus', cx + 4, fy + 60, 6);
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

// mini avatar logo for the post header
function drawAvatarLogo(g, x, y, r) {
  g.fillStyle = '#0b0b0d'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = rgb(GOLD); g.lineWidth = 2; g.beginPath(); g.arc(x, y, r - 1, 0, TAU); g.stroke();
  g.lineWidth = 1.8;
  g.beginPath(); g.moveTo(x, y + 9); g.quadraticCurveTo(x - 9, y + 4, x - 17, y + 7); g.lineTo(x - 17, y - 5); g.quadraticCurveTo(x - 9, y - 9, x, y - 3); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(x, y + 9); g.quadraticCurveTo(x + 9, y + 4, x + 17, y + 7); g.lineTo(x + 17, y - 5); g.quadraticCurveTo(x + 9, y - 9, x, y - 3); g.closePath(); g.stroke();
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
  g.fillStyle = isS ? '#f1e6cf' : '#e8e8ea'; g.font = '600 32px Inter'; g.textAlign = 'left';
  g.fillText(isS ? 'sözlükdeus' : FEED_NAMES[idx % 8], x + 116, top + 52);
  g.fillStyle = 'rgba(230,230,235,0.5)'; g.font = '400 24px Inter';
  g.fillText(isS ? 'Önerilen · Günün kelimesi' : (idx % 3 === 0 ? 'Sponsorlu' : 'Önerilen'), x + 116, top + 84);
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
  iconHeart(g, x + 52, ay, 40); iconBubble(g, x + 130, ay, 40); iconPlane(g, x + 206, ay, 40); iconMark(g, x + w - 52, ay, 40);
  // caption
  g.fillStyle = '#eceaf0'; g.font = '600 28px Inter';
  g.fillText(isS ? '2.418 beğenme' : `${(mulberry32(idx)() * 90 + 3).toFixed(1)} B beğenme`, x + 30, ay + 70);
  g.font = '400 28px Inter';
  if (isS) {
    g.fillStyle = '#eceaf0';
    g.fillText('sözlükdeus  Bir kelime, bir kapı. Kaydet, unutma ✦', x + 30, ay + 112);
  } else {
    g.fillStyle = 'rgba(236,234,240,0.55)';
    rr(g, x + 30, ay + 92, 520 - (idx % 3) * 90, 24, 12); g.fill();
    rr(g, x + 30, ay + 130, 340 + (idx % 2) * 80, 24, 12); g.fill();
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
  const fx = W / 2, fy = lerp(H / 2, F.sy + F.landY + F.mediaY + 470 - 60, ss(10.6, 11.2, t));
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
  g.fillStyle = 'rgba(12,12,15,0.96)'; g.fillRect(F.sx, F.sy, F.sw, 190);
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
