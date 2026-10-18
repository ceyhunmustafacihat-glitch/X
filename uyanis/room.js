'use strict';
// The room, in two skins drawn on the same layout: the dark den (w = 0) and the
// enlightened study (w = 1). Props with their own transformation (bones, sword,
// flies, cobwebs) are drawn separately so they can dissolve on cue.

const FLOOR_Y = 1390;
const WIN = { x: 92, y: 300, w: 300, h: 470 };

function drawRoomSkin(g, w) {
  const R = mulberry32(17);
  // ---- back wall ----
  if (w < 0.5) {
    g.fillStyle = '#3e4441'; g.fillRect(-200, -200, W + 400, FLOOR_Y + 200);
    // stone blocks
    for (let row = 0; row < 18; row++) {
      const y = -120 + row * 84, off = (row % 2) * 70;
      for (let x = -200 - off; x < W + 200; x += 140) {
        const v = 0.85 + R() * 0.3;
        g.fillStyle = rgb(shade('#4a514d', v));
        rr(g, x + 4, y + 4, 132 + R() * 4, 76, 6); g.fill();
      }
    }
    // stains, damp and soot
    for (let i = 0; i < 26; i++) {
      const x = R() * W, y = R() * FLOOR_Y, r = 60 + R() * 220;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(12,16,10,${0.25 + R() * 0.3})`); gr.addColorStop(1, 'rgba(12,16,10,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // drips
    g.strokeStyle = 'rgba(15,20,14,0.55)';
    for (let i = 0; i < 14; i++) {
      const x = R() * W, y = 60 + R() * 300, l = 120 + R() * 380;
      g.lineWidth = 3 + R() * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 8 - 4, y + l); g.stroke();
    }
    // cracks
    g.strokeStyle = 'rgba(8,8,8,0.8)'; g.lineWidth = 2.4;
    for (const [x0, y0] of [[560, 160], [980, 760], [700, 1100], [240, 1030]]) {
      let x = x0, y = y0; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += R() * 50 - 25; y += 20 + R() * 30; g.lineTo(x, y); }
      g.stroke();
    }
    // ceiling beam
    g.fillStyle = '#231f1a'; g.fillRect(-200, 120, W + 400, 54);
    g.strokeStyle = '#0e0c0a'; g.lineWidth = 3; g.strokeRect(-200, 120, W + 400, 54);
  } else {
    // warm plaster upper wall, wooden wainscot below
    const gr = g.createLinearGradient(0, 0, 0, FLOOR_Y);
    gr.addColorStop(0, '#d9c7a4'); gr.addColorStop(1, '#cbb48c');
    g.fillStyle = gr; g.fillRect(-200, -200, W + 400, FLOOR_Y + 200);
    for (let i = 0; i < 40; i++) {
      const x = R() * W, y = R() * 1000, r = 80 + R() * 200;
      const sg = g.createRadialGradient(x, y, 0, x, y, r);
      sg.addColorStop(0, `rgba(255,248,230,${0.08 + R() * 0.08})`); sg.addColorStop(1, 'rgba(255,248,230,0)');
      g.fillStyle = sg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.fillStyle = '#7a5434'; g.fillRect(-200, 1010, W + 400, FLOOR_Y - 1010);
    g.fillStyle = '#8e6440'; g.fillRect(-200, 1000, W + 400, 22);
    g.strokeStyle = '#5a3c24'; g.lineWidth = 3;
    for (let x = -60; x < W + 200; x += 180) { rr(g, x, 1050, 150, 290, 6); g.stroke(); }
    g.fillStyle = '#6b4a2e'; g.fillRect(-200, 120, W + 400, 54);
    g.strokeStyle = '#4e3520'; g.strokeRect(-200, 120, W + 400, 54);
    // a framed calligraphic ornament (abstract, no words)
    g.save(); g.translate(735, 470);
    rr(g, -120, -150, 240, 300, 8); g.fillStyle = '#5a3c24'; g.fill();
    rr(g, -102, -132, 204, 264, 4); g.fillStyle = '#efe3c6'; g.fill();
    g.strokeStyle = '#2b2b33'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-60, 40); g.bezierCurveTo(-40, -80, 30, -90, 50, -10); g.bezierCurveTo(60, 40, 0, 70, -20, 20); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(30, -60, 6, 0, TAU); g.stroke();
    g.strokeStyle = '#a8792f'; g.lineWidth = 2; g.strokeRect(-88, -118, 176, 236);
    g.restore();
  }

  // ---- window ----
  drawWindow(g, w);

  // ---- floor ----
  if (w < 0.5) {
    g.fillStyle = '#26231f'; g.fillRect(-200, FLOOR_Y, W + 400, H - FLOOR_Y + 200);
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3;
    for (let i = 0; i < 9; i++) { const y = FLOOR_Y + 20 + i * i * 9; g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); }
    for (let i = 0; i < 30; i++) {
      const x = R() * W, y = FLOOR_Y + 30 + R() * 500, r = 40 + R() * 140;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(5,6,4,0.45)'); gr.addColorStop(1, 'rgba(5,6,4,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // debris: shards and pebbles
    g.fillStyle = '#121110';
    for (let i = 0; i < 40; i++) { const x = R() * W, y = FLOOR_Y + 40 + R() * 480; g.beginPath(); g.ellipse(x, y, 4 + R() * 10, 2 + R() * 4, R() * 3, 0, TAU); g.fill(); }
    // broken bottle
    g.save(); g.translate(760, 1830); g.rotate(1.3);
    rr(g, -18, -60, 36, 90, 8); g.fillStyle = '#20302a'; g.fill(); g.strokeStyle = '#4c6a5c'; g.lineWidth = 2; g.stroke();
    g.restore();
  } else {
    const gr = g.createLinearGradient(0, FLOOR_Y, 0, H);
    gr.addColorStop(0, '#8a6038'); gr.addColorStop(1, '#a87a4a');
    g.fillStyle = gr; g.fillRect(-200, FLOOR_Y, W + 400, H - FLOOR_Y + 200);
    g.strokeStyle = 'rgba(70,45,25,0.5)'; g.lineWidth = 2.4;
    for (let i = -12; i < 14; i++) { g.beginPath(); g.moveTo(W / 2 + i * 40, FLOOR_Y); g.lineTo(W / 2 + i * 150, H + 100); g.stroke(); }
    // rug
    g.save(); g.translate(W / 2 - 40, 1730); g.scale(1, 0.3);
    g.beginPath(); g.ellipse(0, 0, 520, 520, 0, 0, TAU); g.fillStyle = '#7d2f24'; g.fill();
    g.lineWidth = 26; g.strokeStyle = '#c99a4a'; g.beginPath(); g.ellipse(0, 0, 460, 460, 0, 0, TAU); g.stroke();
    g.lineWidth = 12; g.strokeStyle = '#2f3a5a'; g.beginPath(); g.ellipse(0, 0, 360, 360, 0, 0, TAU); g.stroke();
    g.restore();
  }
  g.fillStyle = w < 0.5 ? '#151413' : '#5a3c24'; g.fillRect(-200, FLOOR_Y - 8, W + 400, 16);

  drawShelf(g, w);
  if (w > 0.5) drawLightProps(g);
  drawChair(g, w);
}

function drawWindow(g, w) {
  const { x, y, w: ww, h } = WIN;
  const arch = new Path2D();
  arch.moveTo(x, y + h); arch.lineTo(x, y + ww / 2); arch.arc(x + ww / 2, y + ww / 2, ww / 2, Math.PI, 0); arch.lineTo(x + ww, y + h); arch.closePath();
  g.save(); g.clip(arch);
  if (w < 0.5) {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, '#0a0f17'); gr.addColorStop(1, '#162230');
    g.fillStyle = gr; g.fillRect(x, y, ww, h);
    // a sick, pale moon behind haze
    drawGlow(g, x + ww * 0.68, y + 120, 90, '#9fb3c8', 0.35);
    g.fillStyle = '#7d8d9a'; g.beginPath(); g.arc(x + ww * 0.68, y + 120, 22, 0, TAU); g.fill();
  } else {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, '#7fb2d8'); gr.addColorStop(0.55, '#f2d7a6'); gr.addColorStop(1, '#ffcf86');
    g.fillStyle = gr; g.fillRect(x, y, ww, h);
    drawGlow(g, x + ww * 0.5, y + h * 0.78, 240, '#fff1c8', 0.95);
    // distant hills
    g.fillStyle = '#9a8a74';
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + h * 0.82); g.quadraticCurveTo(x + ww * 0.3, y + h * 0.72, x + ww * 0.55, y + h * 0.8);
    g.quadraticCurveTo(x + ww * 0.8, y + h * 0.86, x + ww, y + h * 0.76); g.lineTo(x + ww, y + h); g.fill();
    g.fillStyle = '#6f8a5a';
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + h * 0.92); g.quadraticCurveTo(x + ww * 0.5, y + h * 0.85, x + ww, y + h * 0.93); g.lineTo(x + ww, y + h); g.fill();
  }
  g.restore();
  // frame / bars
  if (w < 0.5) {
    g.strokeStyle = '#121212'; g.lineWidth = 12;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + i * ww / 4, y); g.lineTo(x + i * ww / 4, y + h); g.stroke(); }
    g.beginPath(); g.moveTo(x, y + h * 0.55); g.lineTo(x + ww, y + h * 0.55); g.stroke();
    g.strokeStyle = '#1b1a18'; g.lineWidth = 18; g.stroke(arch);
    // broken pane
    g.strokeStyle = 'rgba(150,170,190,0.25)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x + 160, y + 300); g.lineTo(x + 200, y + 360); g.lineTo(x + 170, y + 420); g.moveTo(x + 200, y + 360); g.lineTo(x + 240, y + 350); g.stroke();
  } else {
    g.strokeStyle = '#6b4a2e'; g.lineWidth = 10;
    g.beginPath(); g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + h); g.moveTo(x, y + h * 0.55); g.lineTo(x + ww, y + h * 0.55); g.stroke();
    g.lineWidth = 18; g.stroke(arch);
    // curtains
    for (const s of [0, 1]) {
      const cx = s ? x + ww + 30 : x - 30;
      const c = new Path2D();
      c.moveTo(cx - 50, y - 30); c.lineTo(cx + 50, y - 30);
      c.quadraticCurveTo(cx + (s ? -10 : 30), y + h * 0.5, cx + (s ? 20 : -20), y + h + 60);
      c.lineTo(cx + (s ? -40 : -60), y + h + 60); c.quadraticCurveTo(cx - 40, y + h * 0.5, cx - 50, y - 30); c.closePath();
      g.fillStyle = '#8e3b2c'; g.fill(c); g.strokeStyle = '#5e2218'; g.lineWidth = 3; g.stroke(c);
    }
    g.fillStyle = '#6b4a2e'; g.fillRect(x - 90, y - 44, ww + 180, 16);
  }
  // sill
  g.fillStyle = w < 0.5 ? '#1e1c19' : '#7a5434'; g.fillRect(x - 24, y + h, ww + 48, 22);
}

function drawShelf(g, w) {
  const x = 60, y = 1000, sw = 300;
  g.fillStyle = w < 0.5 ? '#231e18' : '#6b4a2e';
  g.fillRect(x, y, sw, 18);
  g.fillRect(x + 20, y + 18, 12, 30); g.fillRect(x + sw - 32, y + 18, 12, 30);
  if (w < 0.5) {
    // skulls and dead candles
    drawSkull(g, x + 70, y - 46, 0.9, '#8d8a80');
    drawSkull(g, x + 170, y - 40, 0.75, '#7b786e');
    g.fillStyle = '#5c584e'; rr(g, x + 236, y - 50, 22, 50, 3); g.fill();
    g.fillStyle = '#4b473f'; rr(g, x + 264, y - 30, 18, 30, 3); g.fill();
    g.strokeStyle = '#d6d6d6'; g.globalAlpha = 0.3; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x + 247, y - 50); g.lineTo(x + 250, y - 56); g.stroke(); g.globalAlpha = 1;
  } else {
    const cols = ['#8e2f2a', '#2f4a6e', '#3d6a4a', '#a8792f', '#5a3a6a', '#2a2a2a', '#9a5a2a', '#3a5a7a'];
    let bx = x + 40;
    for (let i = 0; i < 8; i++) {
      const bw = 20 + (i * 7) % 12, bh = 76 + (i * 13) % 30;
      g.fillStyle = cols[i]; g.fillRect(bx, y - bh, bw, bh);
      g.fillStyle = 'rgba(255,230,170,0.6)'; g.fillRect(bx + 3, y - bh + 12, bw - 6, 3); g.fillRect(bx + 3, y - 18, bw - 6, 3);
      bx += bw + 2;
    }
    // candle (its flame is drawn in the emissive pass)
    g.fillStyle = '#efe3c6'; rr(g, x + 8, y - 62, 24, 62, 3); g.fill();
    // a small plant
    g.fillStyle = '#9a5a3a'; rr(g, x + 268, y - 44, 30, 44, 5); g.fill();
    g.strokeStyle = '#4f7a3a'; g.lineWidth = 5; g.lineCap = 'round';
    for (const a of [-0.6, -0.2, 0.2, 0.6, 0]) { g.beginPath(); g.moveTo(x + 283, y - 44); g.quadraticCurveTo(x + 283 + a * 40, y - 80, x + 283 + a * 70, y - 110 + Math.abs(a) * 30); g.stroke(); }
  }
}

function drawLightProps(g) {
  // tidy stack of books where the sword used to lean
  const x = 960, y = FLOOR_Y + 60;
  const cols = ['#8e2f2a', '#2f4a6e', '#a8792f', '#3d6a4a'];
  for (let i = 0; i < 4; i++) {
    const bw = 170 - i * 14, bh = 34;
    g.fillStyle = cols[i]; rr(g, x - bw / 2 + (i % 2) * 8, y - (i + 1) * bh, bw, bh - 2, 4); g.fill();
    g.fillStyle = '#efe3c6'; g.fillRect(x + bw / 2 - 16 + (i % 2) * 8, y - (i + 1) * bh + 5, 8, bh - 12);
  }
  // little writing table with an inkwell
  g.fillStyle = '#6b4a2e'; g.fillRect(830, 1240, 230, 18);
  g.fillRect(846, 1258, 14, 130); g.fillRect(1030, 1258, 14, 130);
  g.fillStyle = '#1e2a3a'; rr(g, 1000, 1210, 34, 30, 6); g.fill();
}

function drawChair(g, w) {
  const cx = ORC_ROOT[0], top = ORC_ROOT[1] - 330, seat = ORC_ROOT[1] + 450;
  const dark = w < 0.5;
  // high back behind the shoulders
  const back = new Path2D();
  back.moveTo(cx - 290, seat); back.lineTo(cx - 280, top + 70); back.quadraticCurveTo(cx, top - 70, cx + 280, top + 70); back.lineTo(cx + 290, seat); back.closePath();
  const gr = g.createLinearGradient(cx - 290, 0, cx + 290, 0);
  if (dark) { gr.addColorStop(0, '#1b1611'); gr.addColorStop(0.5, '#2e251c'); gr.addColorStop(1, '#1b1611'); }
  else { gr.addColorStop(0, '#5a3820'); gr.addColorStop(0.5, '#86562f'); gr.addColorStop(1, '#5a3820'); }
  g.fillStyle = gr; g.fill(back); g.strokeStyle = dark ? '#090807' : '#3e2614'; g.lineWidth = 5; g.stroke(back);
  if (dark) {
    // crude planks and spikes
    g.strokeStyle = '#0d0b09'; g.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 110, top + 10 + Math.abs(i) * 20); g.lineTo(cx + i * 112, seat); g.stroke(); }
    g.fillStyle = '#3a3630';
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
      const x = cx + s * (210 + k * 60), y = top + 40 + k * 30;
      g.beginPath(); g.moveTo(x - 12, y + 20); g.lineTo(x + s * 10, y - 70); g.lineTo(x + 12, y + 20); g.closePath(); g.fill();
      g.strokeStyle = '#8a857a'; g.lineWidth = 1.5; g.stroke();
    }
    // a ragged fur draped over the back
    g.fillStyle = '#2a2520';
    g.beginPath(); g.moveTo(cx - 250, top + 90);
    for (let i = 0; i <= 12; i++) g.lineTo(cx - 250 + i * 42, top + 90 + (i % 2 ? 50 : 20));
    g.lineTo(cx + 254, top + 70); g.quadraticCurveTo(cx, top - 20, cx - 250, top + 90); g.fill();
  } else {
    // cushion and carved trim
    rr(g, cx - 230, top + 90, 460, seat - top - 120, 40); g.fillStyle = '#6e2a22'; g.fill();
    g.strokeStyle = '#c99a4a'; g.lineWidth = 4; g.stroke();
    g.strokeStyle = '#c99a4a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cx - 260, top + 76); g.quadraticCurveTo(cx, top - 50, cx + 260, top + 76); g.stroke();
  }
  // armrests
  for (const s of [-1, 1]) {
    g.fillStyle = dark ? '#241d16' : '#7a4e2a';
    rr(g, cx + s * 310 - 50, seat - 40, 100, 34, 10); g.fill();
    g.fillRect(cx + s * 310 - 20, seat - 10, 40, 320);
  }
}

function drawSkull(g, x, y, s, c) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = c;
  g.beginPath(); g.arc(0, -8, 34, Math.PI * 0.9, Math.PI * 2.1); g.lineTo(26, 18); g.lineTo(16, 34); g.lineTo(-16, 34); g.lineTo(-26, 18); g.closePath(); g.fill();
  g.strokeStyle = '#1a1916'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#121110';
  g.beginPath(); g.ellipse(-13, 4, 9, 11, 0, 0, TAU); g.ellipse(13, 4, 9, 11, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(0, 14); g.lineTo(-5, 24); g.lineTo(5, 24); g.closePath(); g.fill();
  g.strokeStyle = '#121110'; g.lineWidth = 2;
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 6, 28); g.lineTo(i * 6, 34); g.stroke(); }
  g.restore();
}
function drawBone(g, x, y, len, a, c) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.strokeStyle = c; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-len / 2, 0); g.lineTo(len / 2, 0); g.stroke();
  g.fillStyle = c;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(s * len / 2, -7, 10, 0, TAU); g.arc(s * len / 2, 7, 10, 0, TAU); g.fill(); }
  g.restore();
}

// ---------- the props that transform ----------
// bones & skulls on the floor (fade with k: 0 present .. 1 gone)
const BONES = [
  { t: 'skull', x: 150, y: 1610, s: 1.1, a: -0.2 }, { t: 'bone', x: 250, y: 1660, l: 150, a: 0.4 },
  { t: 'bone', x: 110, y: 1700, l: 130, a: -0.9 }, { t: 'skull', x: 300, y: 1590, s: 0.8, a: 0.3 },
  { t: 'bone', x: 200, y: 1560, l: 110, a: 1.7 }, { t: 'skull', x: 880, y: 1760, s: 1.0, a: 0.15 },
  { t: 'bone', x: 980, y: 1800, l: 160, a: -0.3 }, { t: 'bone', x: 790, y: 1700, l: 120, a: 0.9 },
  { t: 'bone', x: 660, y: 1860, l: 140, a: 0.1 }
];
function drawBones(g, k) {
  for (let i = 0; i < BONES.length; i++) {
    const b = BONES[i];
    const kk = clamp(k * 1.6 - i * 0.07);
    if (kk >= 1) continue;
    g.save(); g.globalAlpha *= 1 - kk;
    g.translate(0, -kk * 30);
    if (b.t === 'skull') { g.save(); g.translate(b.x, b.y); g.rotate(b.a); drawSkull(g, 0, 0, b.s, '#9a968a'); g.restore(); }
    else drawBone(g, b.x, b.y, b.l, b.a, '#a29e91');
    g.restore();
  }
}
function bonesDust(k) { return BONES.map((b, i) => ({ x: b.x, y: b.y, k: clamp(k * 1.6 - i * 0.07) })); }

// rusty sword leaning on the wall (dissolves: k 0..1)
const SWORD = { x: 1000, y: FLOOR_Y + 70, a: -0.08, len: 520 };
function drawSword(g, k, glow) {
  if (k >= 1) return;
  g.save(); g.translate(SWORD.x, SWORD.y); g.rotate(SWORD.a);
  g.globalAlpha *= 1 - k;
  const L = SWORD.len;
  const blade = new Path2D();
  blade.moveTo(-18, -110); blade.lineTo(-16, -L + 40); blade.lineTo(0, -L); blade.lineTo(16, -L + 40); blade.lineTo(18, -110); blade.closePath();
  const gr = g.createLinearGradient(-18, 0, 18, 0); gr.addColorStop(0, '#4a4c4e'); gr.addColorStop(0.5, '#8c9094'); gr.addColorStop(1, '#3a3c3e');
  g.fillStyle = gr; g.fill(blade); g.strokeStyle = '#141414'; g.lineWidth = 2.5; g.stroke(blade);
  // rust & notches
  g.fillStyle = 'rgba(90,40,20,0.6)';
  for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse((i % 2 ? 6 : -6), -150 - i * 55, 6, 12, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#1e1d1b'; g.fillRect(-60, -118, 120, 18);
  g.fillStyle = '#2b2118'; g.fillRect(-12, -100, 24, 90);
  g.beginPath(); g.arc(0, -4, 16, 0, TAU); g.fillStyle = '#1e1d1b'; g.fill();
  if (glow > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = glow * (1 - k) * 0.7; g.fillStyle = '#ffcf7a'; g.fill(blade); }
  g.restore();
}
function swordPoints(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const [dx, dy] = rot((hash1(i * 3.1) - 0.5) * 26, -u * SWORD.len, SWORD.a);
    out.push([SWORD.x + dx, SWORD.y + dy]);
  }
  return out;
}

// cobwebs in the upper corners and chains from the beam
function drawCobwebs(g, a) {
  if (a <= 0.01) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(200,205,200,0.45)'; g.lineWidth = 1.2;
  for (const [cx, cy, sx] of [[0, 174, 1], [W, 174, -1]]) {
    for (let i = 0; i < 7; i++) { const an = i / 6 * Math.PI / 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * Math.cos(an) * 230, cy + Math.sin(an) * 230); g.stroke(); }
    for (let r = 40; r < 230; r += 38) {
      g.beginPath();
      for (let i = 0; i <= 6; i++) { const an = i / 6 * Math.PI / 2; const rr2 = r * (i % 2 ? 0.92 : 1); const px = cx + sx * Math.cos(an) * rr2, py = cy + Math.sin(an) * rr2; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
    }
  }
  g.restore();
}
function drawChains(g, a, t) {
  if (a <= 0.01) return;
  g.save(); g.globalAlpha *= a;
  for (const [x0, len, ph] of [[560, 420, 0], [640, 300, 1.7]]) {
    const sw = Math.sin(t * 0.9 + ph) * 0.03;
    g.save(); g.translate(x0, 174); g.rotate(sw);
    g.strokeStyle = '#2c2b29'; g.lineWidth = 5;
    for (let y = 0; y < len; y += 26) { g.beginPath(); g.ellipse(0, y + 13, (y / 26) % 2 ? 3 : 9, 14, 0, 0, TAU); g.stroke(); }
    if (x0 === 560) { g.beginPath(); g.arc(0, len + 30, 26, 0.3, Math.PI * 2 - 0.3); g.lineWidth = 7; g.stroke(); }
    g.restore();
  }
  g.restore();
}
// flies circling the bones
function drawFlies(g, t, a) {
  if (a <= 0.01) return;
  g.save(); g.globalAlpha *= a; g.fillStyle = '#0a0a0a';
  for (let i = 0; i < 7; i++) {
    const cx = i < 4 ? 210 : 880, cy = i < 4 ? 1560 : 1700;
    const ph = i * 2.1, sp = 2.4 + hash1(i) * 1.6;
    const x = cx + Math.sin(t * sp + ph) * (60 + 20 * hash1(i + 3)) + Math.sin(t * 7.3 + i) * 8;
    const y = cy - 60 + Math.cos(t * sp * 1.3 + ph) * 40 + Math.sin(t * 9.1 + i) * 6;
    g.beginPath(); g.ellipse(x, y, 4, 3, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(200,200,200,0.35)'; g.beginPath(); g.ellipse(x - 3, y - 4, 4, 2, -0.6 + Math.sin(t * 60 + i), 0, TAU); g.fill();
    g.fillStyle = '#0a0a0a';
  }
  g.restore();
}
