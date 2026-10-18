'use strict';
// The orc. Front view, seated. Local origin = base of the neck (world ORC_ROOT).
// P (from orcAt) drives posture and expression:
//   slouch 1..0, lookDown 1..0, jaw (open), brow -1 angry .. +1 raised, lid (eye opening),
//   red (eye glow), savage 1..0 (teeth, wrinkles, sickly tint), smile, blade->quill, book on lap.

const ORC_ROOT = [380, 980];
const INK = '#151515';

// ---------- geometry shared with the lighting / effects ----------
function orcGeom(P) {
  const sl = P.slouch;
  const shY = 52 + sl * 24, shX = 236 - sl * 14;
  const waistY = 440 - sl * 28;
  const head = [0, -172 + 40 * P.lookDown + 16 * sl];
  const phone = [-18 + P.phoneDX, 262 + 26 * sl - 22 * P.phoneUp];
  const elbowL = [-shX - 34, shY + 300 - sl * 10];
  const elbowR = [shX + 50, waistY - 10];
  const cuff = [shX + 118 - 14 * (1 - P.savage), shY + 40 + 30 * (1 - P.savage)];
  return { sl, shY, shX, waistY, head, phone, elbowL, elbowR, cuff, fy: 14 * P.lookDown, tilt: P.tilt };
}
function orcToWorld(P, x, y) { return [ORC_ROOT[0] + x, ORC_ROOT[1] + y]; }
function orcHeadToWorld(P, x, y) {
  const G = orcGeom(P);
  const r = rot(x, y, G.tilt);
  return orcToWorld(P, G.head[0] + r[0], G.head[1] + r[1]);
}
function orcEyesWorld(P) {
  const G = orcGeom(P);
  return [orcHeadToWorld(P, -52, -16 + G.fy), orcHeadToWorld(P, 52, -16 + G.fy)];
}
function orcPhoneWorld(P) { const G = orcGeom(P); return orcToWorld(P, G.phone[0], G.phone[1]); }
function orcLapWorld(P) { const G = orcGeom(P); return orcToWorld(P, 40, G.waistY + 95); }
function orcCuffWorld(P) { const G = orcGeom(P); return orcToWorld(P, G.cuff[0], G.cuff[1]); }

function skinCols(P) {
  const w = 1 - P.savage;
  return { d: mixc('#4b5149', '#5f5850', w), m: mixc('#8a9086', '#a0998f', w), h: mixc('#c0c4b9', '#d8d1c6', w) };
}

// tapered, slightly bulging limb a -> b
function limbPath(a, b, wa, wb, bulge = 1.08) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const an = Math.atan2(ny, nx);
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], wm = (wa + wb) / 2 * bulge;
  const p = new Path2D();
  p.moveTo(a[0] + nx * wa / 2, a[1] + ny * wa / 2);
  p.quadraticCurveTo(m[0] + nx * wm / 2 * 1.08, m[1] + ny * wm / 2 * 1.08, b[0] + nx * wb / 2, b[1] + ny * wb / 2);
  p.arc(b[0], b[1], wb / 2, an, an - Math.PI, true);
  p.quadraticCurveTo(m[0] - nx * wm / 2 * 1.08, m[1] - ny * wm / 2 * 1.08, a[0] - nx * wa / 2, a[1] - ny * wa / 2);
  p.arc(a[0], a[1], wa / 2, an + Math.PI, an, true);
  p.closePath();
  return p;
}
function strokeLine(g, pts, w, color, alpha = 1, tension = 0.5) {
  g.save(); g.globalAlpha *= alpha; g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.stroke(curve(new Path2D(), pts, false, tension)); g.restore();
}
function hGrad(g, x0, x1, C) {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, rgb(C.d)); gr.addColorStop(0.55, rgb(C.m)); gr.addColorStop(1, rgb(C.h));
  return gr;
}

// ---------- body ----------
function drawOrcLegs(g, P, G) {
  const y0 = G.waistY;
  const pants = '#2b2a28', pantsHi = '#46433f';
  for (const s of [-1, 1]) {
    // thigh (foreshortened: coming toward camera), then shin and boot
    const thigh = curvePath([[s * 18, y0 - 10], [s * 200, y0 - 14], [s * 222, y0 + 70], [s * 196, y0 + 168], [s * 40, y0 + 176], [s * 12, y0 + 80]], true, 0.45);
    const gr = g.createLinearGradient(0, y0, 0, y0 + 180);
    gr.addColorStop(0, pantsHi); gr.addColorStop(1, pants);
    g.fillStyle = gr; g.fill(thigh);
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke(thigh);
    const shin = limbPath([s * 118, y0 + 170], [s * 140, y0 + 395], 120, 92, 1.05);
    g.fillStyle = pants; g.fill(shin); g.stroke(shin);
    // boot
    const boot = curvePath([[s * 78, y0 + 360], [s * 196, y0 + 352], [s * 214, y0 + 430], [s * 150, y0 + 452], [s * 70, y0 + 440]], true, 0.5);
    g.fillStyle = '#1d1c1b'; g.fill(boot); g.stroke(boot);
    strokeLine(g, [[s * 84, y0 + 380], [s * 200, y0 + 376]], 2, '#55524d', 0.8);
    // knee crease
    strokeLine(g, [[s * 60, y0 + 140], [s * 120, y0 + 160], [s * 180, y0 + 150]], 2, '#151413', 0.7);
  }
  // ragged cloth flap between the legs
  const sv = P.savage;
  const pts = [[-120, y0 - 20], [120, y0 - 20], [110, y0 + 150]];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const x = lerp(110, -110, i / n);
    const jag = (i % 2 ? 28 : -10) * sv;
    pts.push([x, y0 + 165 + jag]);
  }
  pts.push([-120, y0 + 150]);
  const flap = new Path2D();
  flap.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) flap.lineTo(p[0], p[1]);
  flap.closePath();
  g.fillStyle = col('#3a342c', '#4a3a2a', 1 - sv); g.fill(flap);
  g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(flap);
}

function drawOrcTorso(g, P, G, C) {
  const { shX, shY, waistY } = G;
  const torso = curvePath([[-80, -40], [-150, 6], [-shX, shY], [-shX + 4, shY + 130], [-206, 268], [-176, waistY + 6],
    [176, waistY + 6], [206, 268], [shX - 4, shY + 130], [shX, shY], [150, 6], [80, -40]], true, 0.42);
  g.fillStyle = hGrad(g, -shX, shX, C); g.fill(torso);
  g.strokeStyle = INK; g.lineWidth = 3.2; g.stroke(torso);
  // anatomy lines (hand-drawn feel, like the reference)
  const a = 0.75;
  strokeLine(g, [[-60, 12], [-120, 40], [-190, shY + 6]], 2.4, INK, a);
  strokeLine(g, [[60, 12], [120, 40], [190, shY + 6]], 2.4, INK, a);
  strokeLine(g, [[-188, 150], [-110, 226], [-12, 200]], 2.6, INK, a);
  strokeLine(g, [[188, 150], [110, 226], [12, 200]], 2.6, INK, a);
  strokeLine(g, [[0, 120], [0, waistY - 10]], 2.2, INK, a * 0.8);
  for (const y of [282, 340]) {
    strokeLine(g, [[-110, y + 8], [-55, y - 4], [-6, y]], 2, INK, a * 0.7);
    strokeLine(g, [[110, y + 8], [55, y - 4], [6, y]], 2, INK, a * 0.7);
  }
  strokeLine(g, [[-150, 300], [-170, 380]], 2, INK, 0.5);
  // belt
  const belt = new Path2D();
  belt.moveTo(-182, waistY - 30); belt.quadraticCurveTo(0, waistY - 14, 182, waistY - 30);
  belt.lineTo(184, waistY + 14); belt.quadraticCurveTo(0, waistY + 28, -184, waistY + 14); belt.closePath();
  g.fillStyle = '#211f1d'; g.fill(belt); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(belt);
  // diagonal strap across the chest
  const st = new Path2D();
  st.moveTo(-shX + 30, shY - 18); st.lineTo(-shX + 92, shY - 34);
  st.quadraticCurveTo(40, 220, shX - 10, 300); st.lineTo(shX - 26, 352);
  st.quadraticCurveTo(10, 268, -shX + 30, shY - 18); st.closePath();
  g.fillStyle = '#1b1b1b'; g.fill(st); g.strokeStyle = '#3c3c3c'; g.lineWidth = 2; g.stroke(st);
  g.strokeStyle = '#9a9a9a'; g.lineWidth = 2.4; g.beginPath(); g.arc(shX - 70, 300, 7, 0, TAU); g.stroke();
}

function drawPauldron(g, G) {
  const { shX, shY } = G;
  for (let i = 2; i >= 0; i--) {
    const y = shY - 40 + i * 46, x0 = -shX - 74 + i * 6, x1 = -shX + 128 - i * 10;
    const p = new Path2D();
    p.moveTo(x0, y + 26); p.quadraticCurveTo(x0 + 40, y - 34, x1, y - 6);
    p.lineTo(x1 - 6, y + 50); p.quadraticCurveTo(x0 + 50, y + 18, x0 + 8, y + 86); p.closePath();
    const gr = g.createLinearGradient(x0, y, x1, y + 60);
    gr.addColorStop(0, '#2a2a2a'); gr.addColorStop(0.5, '#4a4a4a'); gr.addColorStop(1, '#262626');
    g.fillStyle = gr; g.fill(p);
    g.strokeStyle = '#d6d6d6'; g.lineWidth = 2.2; g.stroke(p);
    // hatching
    g.save(); g.clip(p); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1.5;
    for (let k = -8; k < 14; k++) { g.beginPath(); g.moveTo(x0 + k * 16, y - 40); g.lineTo(x0 + k * 16 - 60, y + 100); g.stroke(); }
    g.restore();
    if (i === 0) { g.strokeStyle = '#cfcfcf'; g.lineWidth = 2; g.beginPath(); g.arc(x1 - 32, y + 16, 6, 0, TAU); g.stroke(); }
  }
}

function drawPhoneArm(g, P, G, C) {
  const S = [-G.shX + 6, G.shY + 34], E = G.elbowL, ph = G.phone;
  const wrist = [ph[0] - 70, ph[1] + 30];
  drawUpperArm(g, S, E, -1, C);
  const fore = limbPath(E, wrist, 92, 74, 1.16);
  g.fillStyle = hGrad(g, E[0] - 40, wrist[0] + 40, { d: shade(C.d, 0.85), m: shade(C.m, 0.9), h: C.m }); g.fill(fore);
  g.strokeStyle = INK; g.lineWidth = 3; g.stroke(fore);
  strokeLine(g, [[E[0] + 40, E[1] - 30], [lerp(E[0], wrist[0], 0.55), lerp(E[1], wrist[1], 0.55) - 30]], 2, INK, 0.55);
  // the phone, seen from the back, gripped by grey fingers
  g.save();
  g.translate(ph[0], ph[1]); g.rotate(-0.12 + P.phoneRot);
  const pw = 120, phh = 236;
  rr(g, -pw / 2, -phh / 2, pw, phh, 18);
  g.fillStyle = '#17191c'; g.fill(); g.strokeStyle = '#5a5e64'; g.lineWidth = 2.5; g.stroke();
  rr(g, pw / 2 - 52, -phh / 2 + 12, 40, 62, 10); g.fillStyle = '#0d0e10'; g.fill(); g.strokeStyle = '#3c4046'; g.stroke();
  for (const [x, y] of [[pw / 2 - 32, -phh / 2 + 28], [pw / 2 - 32, -phh / 2 + 58]]) {
    g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fillStyle = '#050506'; g.fill(); g.strokeStyle = '#6a7078'; g.lineWidth = 1.6; g.stroke();
  }
  // small book mark on the case appears with the change (a sticker of the page)
  if (P.sticker > 0.01) { g.globalAlpha = P.sticker; drawOpenBook(g, 0, 30, 46, '#d9c79a', 2.2); g.globalAlpha = 1; }
  // palm on the left edge, fingers wrapped across the back
  const palm = curvePath([[-pw / 2 - 44, -40], [-pw / 2 + 8, -60], [-pw / 2 + 10, 70], [-pw / 2 - 40, 96], [-pw / 2 - 58, 30]], true, 0.5);
  g.fillStyle = rgb(C.m); g.fill(palm); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(palm);
  for (let i = 0; i < 4; i++) {
    const y = -46 + i * 36, len = 74 - Math.abs(i - 1.3) * 10;
    const f = limbPath([-pw / 2 - 6, y], [-pw / 2 + len - 18, y + 6], 32, 26, 1);
    g.fillStyle = rgb(mixc(C.m, C.h, 0.25)); g.fill(f); g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke(f);
    // dark claw nails
    g.fillStyle = rgb(mixc('#2a2620', '#6c645a', 1 - P.savage));
    g.beginPath(); g.ellipse(-pw / 2 + len - 14, y + 6, 9, 7 + 3 * P.savage, 0, 0, TAU); g.fill();
  }
  g.restore();
}

function drawBladeArm(g, P, G, C) {
  const S = [G.shX - 6, G.shY + 34], E = G.elbowR, cf = G.cuff;
  drawUpperArm(g, S, E, 1, C);
  const fore = limbPath(E, [cf[0], cf[1] + 50], 96, 84, 1.14);
  g.fillStyle = hGrad(g, E[0] - 50, E[0] + 70, { d: shade(C.d, 0.8), m: shade(C.m, 0.88), h: shade(C.h, 0.92) }); g.fill(fore);
  g.strokeStyle = INK; g.lineWidth = 3; g.stroke(fore);
  strokeLine(g, [[E[0] - 26, E[1] - 50], [cf[0] - 34, cf[1] + 130]], 2, INK, 0.5);
  strokeLine(g, [[E[0] + 30, E[1] - 30], [cf[0] + 30, cf[1] + 140]], 1.6, INK, 0.35);
  // cuff (bracer) with the open-book emblem, as in the reference
  g.save(); g.translate(cf[0], cf[1]); g.rotate(0.06 - 0.05 * (1 - P.savage));
  const cuff = new Path2D(); cuff.moveTo(-60, -50); cuff.lineTo(58, -58); cuff.lineTo(66, 58); cuff.lineTo(-66, 62); cuff.closePath();
  const gr = g.createLinearGradient(-60, 0, 66, 0); gr.addColorStop(0, '#1e1e1e'); gr.addColorStop(1, '#3a3a3a');
  g.fillStyle = gr; g.fill(cuff); g.strokeStyle = '#cfcfcf'; g.lineWidth = 2.4; g.stroke(cuff);
  strokeLine(g, [[-62, -16], [60, -22]], 1.6, '#8a8a8a', 0.8);
  strokeLine(g, [[-64, 36], [64, 32]], 1.6, '#8a8a8a', 0.8);
  drawOpenBook(g, 0, 8, 46, '#e8e8e8', 2.4);
  g.restore();
}

// shoulder cap + upper arm with a bicep bulge (s = -1 left, +1 right side of the picture)
function drawUpperArm(g, S, E, s, C) {
  const dx = E[0] - S[0], dy = E[1] - S[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const P = (a, b) => [S[0] + ux * a + nx * b, S[1] + uy * a + ny * b];
  const arm = curvePath([P(-40, 0), P(-10, 74), P(L * 0.35, 70), P(L * 0.7, 56), P(L + 30, 46), P(L + 46, 0), P(L + 30, -46), P(L * 0.6, -54), P(L * 0.25, -66), P(-10, -70)], true, 0.5);
  g.fillStyle = hGrad(g, Math.min(S[0], E[0]) - 70, Math.max(S[0], E[0]) + 70, C); g.fill(arm);
  g.strokeStyle = INK; g.lineWidth = 3; g.stroke(arm);
  // deltoid and bicep lines
  strokeLine(g, [P(L * 0.05, s * 40), P(L * 0.3, s * 20), P(L * 0.42, s * 50)], 2.2, INK, 0.6);
  strokeLine(g, [P(L * 0.55, -s * 30), P(L * 0.75, -s * 10), P(L * 0.9, -s * 24)], 2, INK, 0.45);
}

// the blade on the prosthetic (before) and the quill (after); drawn in the emissive pass too
function drawBladeShape(g, P, G, alpha = 1) {
  const cf = G.cuff;
  const k = P.quill; // 0 blade .. 1 quill
  g.save(); g.translate(cf[0], cf[1] - 54); g.rotate(0.06 - 0.05 * (1 - P.savage));
  if (k < 0.999) {
    g.globalAlpha = alpha * (1 - k);
    const blade = new Path2D();
    blade.moveTo(-22, 4); blade.lineTo(-14, -60); blade.quadraticCurveTo(-12, -250, 0, -330);
    blade.quadraticCurveTo(14, -250, 16, -60); blade.lineTo(22, 4); blade.closePath();
    g.fillStyle = '#0b0b0b'; g.fill(blade);
    g.strokeStyle = '#e8eef4'; g.lineWidth = 3.2; g.stroke(blade);
    strokeLine(g, [[0, -10], [0, -300]], 1.2, '#6a6f75', 1);
    for (const s of [-1, 1]) {
      const prong = new Path2D();
      prong.moveTo(s * 18, -30); prong.quadraticCurveTo(s * 70, -50, s * 84, -110);
      prong.quadraticCurveTo(s * 92, -150, s * 74, -190); prong.quadraticCurveTo(s * 70, -120, s * 30, -64); prong.closePath();
      g.fillStyle = '#0b0b0b'; g.fill(prong); g.strokeStyle = '#e8eef4'; g.lineWidth = 3; g.stroke(prong);
    }
  }
  if (k > 0.001) {
    g.globalAlpha = alpha * k;
    drawQuill(g, 0, 0, 1);
  }
  g.restore();
}
function drawQuill(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.18);
  const vane = new Path2D();
  vane.moveTo(0, -20); vane.bezierCurveTo(-46, -90, -40, -220, 10, -320);
  vane.bezierCurveTo(30, -230, 40, -110, 0, -20); vane.closePath();
  const gr = g.createLinearGradient(-40, 0, 40, 0); gr.addColorStop(0, '#d9d2c2'); gr.addColorStop(1, '#fbf6ea');
  g.fillStyle = gr; g.fill(vane); g.strokeStyle = '#6f6656'; g.lineWidth = 2; g.stroke(vane);
  g.strokeStyle = '#8a816f'; g.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    const yy = -40 - i * 19;
    g.beginPath(); g.moveTo(1 + i * 0.5, yy); g.lineTo(-20 + i * 0.3, yy - 26); g.stroke();
    g.beginPath(); g.moveTo(1 + i * 0.5, yy); g.lineTo(18 + i * 0.4, yy - 22); g.stroke();
  }
  strokeLine(g, [[0, 10], [2, -150], [8, -300]], 2.4, '#5a5244', 1);
  g.restore();
}

// open book outline (the page's mark) centred at x,y
function drawOpenBook(g, x, y, w, color, lw) {
  g.save(); g.translate(x, y); g.scale(w / 24, w / 24);
  g.strokeStyle = color; g.lineWidth = lw * 24 / w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(0, -5.5); g.bezierCurveTo(-2.5, -7.2, -6, -7.7, -9.5, -6.8); g.lineTo(-9.5, 6.6); g.bezierCurveTo(-6, 5.8, -2.5, 6.3, 0, 8);
  g.bezierCurveTo(2.5, 6.3, 6, 5.8, 9.5, 6.6); g.lineTo(9.5, -6.8); g.bezierCurveTo(6, -7.7, 2.5, -7.2, 0, -5.5); g.lineTo(0, 8); g.stroke();
  g.restore();
}

// ---------- head ----------
function drawOrcHead(g, P, G, C) {
  const fy = G.fy, sv = P.savage;
  // ears (behind the skull)
  for (const s of [-1, 1]) {
    const droop = 16 * P.slouch;
    const ear = new Path2D();
    ear.moveTo(s * 108, -40); ear.quadraticCurveTo(s * 170, -110 + droop, s * 236, -124 + droop * 2);
    ear.quadraticCurveTo(s * 196, -40 + droop, s * 112, 60); ear.closePath();
    g.fillStyle = rgb(s < 0 ? C.d : C.m); g.fill(ear);
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke(ear);
    strokeLine(g, [[s * 124, -20], [s * 186, -90 + droop * 1.6], [s * 214, -110 + droop * 2]], 2, INK, 0.6);
  }
  const skull = curvePath([[0, -212], [62, -204], [103, -164], [121, -86], [121, 0], [111, 72], [88, 126], [48, 158], [0, 166],
    [-48, 158], [-88, 126], [-111, 72], [-121, 0], [-121, -86], [-103, -164], [-62, -204]], true, 0.5);
  const gr = g.createLinearGradient(-123, -100, 123, 60);
  gr.addColorStop(0, rgb(C.d)); gr.addColorStop(0.45, rgb(C.m)); gr.addColorStop(0.8, rgb(C.h)); gr.addColorStop(1, rgb(C.m));
  g.fillStyle = gr; g.fill(skull);
  // jaw shadow & crown highlight
  g.save(); g.clip(skull);
  let rg = g.createRadialGradient(0, 210, 10, 0, 210, 200);
  rg.addColorStop(0, 'rgba(0,0,0,0.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(-130, -220, 260, 400);
  strokeLine(g, [[52, -190], [86, -150], [98, -100]], 6, '#ffffff', 0.25);
  g.restore();
  g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(skull);

  // forehead wrinkles
  const wr = 0.35 + 0.45 * sv;
  strokeLine(g, [[-46, -128 + fy * 0.5], [-10, -134 + fy * 0.5], [36, -128 + fy * 0.5]], 1.8, INK, wr);
  strokeLine(g, [[-36, -112 + fy * 0.5], [0, -117 + fy * 0.5], [30, -112 + fy * 0.5]], 1.6, INK, wr * 0.8);
  // eye sockets
  for (const s of [-1, 1]) {
    const sg = g.createRadialGradient(s * 52, -14 + fy, 4, s * 52, -14 + fy, 58);
    sg.addColorStop(0, `rgba(10,10,10,${0.55 + 0.2 * sv})`); sg.addColorStop(1, 'rgba(10,10,10,0)');
    g.fillStyle = sg; g.beginPath(); g.ellipse(s * 52, -14 + fy, 58, 34, 0, 0, TAU); g.fill();
  }
  // eyes
  for (const s of [-1, 1]) drawOrcEye(g, P, s * 52, -16 + fy, s);
  // brows: heavy ridge shadow + the white brow strokes of the reference
  const b = P.brow;
  for (const s of [-1, 1]) {
    const inner = [s * 18, -40 + fy - 14 * b + 10 * Math.max(0, -b)];
    const mid = [s * 56, -50 + fy - 18 * b];
    const outer = [s * 98, -44 + fy - 8 * b - 6 * Math.max(0, -b)];
    strokeLine(g, [[inner[0], inner[1] + 6], [mid[0], mid[1] + 8], [outer[0], outer[1] + 6]], 8, '#2a2a2a', 0.45);
    strokeLine(g, [inner, mid, outer], 4.6, '#f2f2f2', 0.95);
  }
  // frown lines between the brows (fade with the anger)
  const fr = clamp(-b) * 0.8 + 0.15 * sv;
  strokeLine(g, [[-8, -46 + fy], [-12, -26 + fy]], 2, INK, fr);
  strokeLine(g, [[8, -46 + fy], [12, -26 + fy]], 2, INK, fr);
  // nose
  const ny = 40 + fy;
  strokeLine(g, [[-10, -8 + fy], [-14, ny - 10], [-28, ny + 4]], 2.4, INK, 0.8);
  strokeLine(g, [[-28, ny + 4], [-14, ny + 12], [0, ny + 8], [14, ny + 12], [28, ny + 4]], 2.6, INK, 0.9);
  g.fillStyle = 'rgba(15,15,15,0.85)';
  g.beginPath(); g.ellipse(-12, ny + 4, 6, 4, 0.3, 0, TAU); g.ellipse(12, ny + 4, 6, 4, -0.3, 0, TAU); g.fill();
  // nasolabial lines
  strokeLine(g, [[-36, ny], [-62, ny + 34], [-78, ny + 60]], 2.2, INK, 0.35 + 0.4 * sv);
  strokeLine(g, [[36, ny], [62, ny + 34], [78, ny + 60]], 2.2, INK, 0.35 + 0.4 * sv);
  // cheek lines (reference)
  strokeLine(g, [[-110, -2 + fy], [-84, 4 + fy], [-60, 2 + fy]], 1.8, INK, 0.5 * sv + 0.15);
  strokeLine(g, [[110, -2 + fy], [84, 4 + fy], [60, 2 + fy]], 1.8, INK, 0.5 * sv + 0.15);
  drawOrcMouth(g, P, 0, 96 + fy);
  // chin line
  strokeLine(g, [[-34, 146], [0, 152], [34, 146]], 2, INK, 0.5);
  // scars
  const scars = [
    [[-40, -196], [-50, -150], [-62, -104], [-80, -56]],
    [[30, -204], [36, -176], [42, -142]],
    [[54, -128], [66, -78], [70, -40]],
    [[66, 18], [70, 60], [58, 104], [44, 132]],
    [[84, -116], [96, -70], [100, -36]],
    [[90, 22], [92, 60], [80, 100]]
  ];
  const sa = 0.55 + 0.45 * sv;
  for (const sc of scars) {
    const p = sc.map(([x, y]) => [x, y + (y > -60 ? fy * 0.6 : 0)]);
    strokeLine(g, p.map(([x, y]) => [x + 3, y]), 2.2, '#dcdcd4', sa * 0.5);
    strokeLine(g, p, 3.4, INK, sa);
  }
}

function drawOrcEye(g, P, cx, cy, s) {
  const lid = clamp(P.lid * P.blink, 0.05, 1.1);
  const w = 34, hUp = 15 * lid, hDn = 9;
  const eye = new Path2D();
  eye.moveTo(cx - w, cy + 2);
  eye.quadraticCurveTo(cx - s * 4, cy - hUp * 2 + (s > 0 ? 2 : 0), cx + w, cy - 1);
  eye.quadraticCurveTo(cx, cy + hDn * 1.6, cx - w, cy + 2);
  eye.closePath();
  const red = P.red;
  g.fillStyle = rgb(mixc('#efe9dc', '#2a1512', red * 0.85)); g.fill(eye);
  g.save(); g.clip(eye);
  const ix = cx + P.gazeX * 10, iy = cy + 2 + P.gazeY * 6;
  const ir = 12.5;
  g.fillStyle = rgb(mixc('#7a5226', '#ff2414', red));
  g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fill();
  g.fillStyle = rgb(mixc('#3d2610', '#ffd0a0', red * 0.9));
  g.beginPath(); g.arc(ix, iy, ir * 0.52, 0, TAU); g.fill();
  g.fillStyle = rgb(mixc('#0c0806', '#400202', red));
  g.beginPath(); g.arc(ix, iy, ir * (0.42 - 0.18 * red), 0, TAU); g.fill();
  if (red < 0.9) { g.fillStyle = `rgba(255,255,255,${0.9 * (1 - red)})`; g.beginPath(); g.arc(ix + 4, iy - 4, 3.2, 0, TAU); g.fill(); }
  // upper lid shadow
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(cx - w, cy - 30, w * 2, 12);
  g.restore();
  g.strokeStyle = INK; g.lineWidth = 3; g.stroke(eye);
  strokeLine(g, [[cx - w + 4, cy - hUp * 1.4 - 6], [cx, cy - hUp * 1.9 - 7], [cx + w - 4, cy - hUp * 1.2 - 6]], 1.6, INK, 0.5);
}

function drawOrcMouth(g, P, cx, cy) {
  const sv = P.savage, j = P.jaw, sm = P.smile;
  const hw = lerp(62, 86, sv);
  const cornerY = cy - 4 - 14 * sm + 6 * (1 - sm) * (1 - sv);
  if (j > 0.02) {
    const open = 52 * j;
    const up = new Path2D();
    up.moveTo(cx - hw, cornerY); up.quadraticCurveTo(cx, cy - 12, cx + hw, cornerY);
    const mouth = new Path2D();
    mouth.moveTo(cx - hw, cornerY); mouth.quadraticCurveTo(cx, cy - 12, cx + hw, cornerY);
    mouth.quadraticCurveTo(cx, cy + open * 1.6, cx - hw, cornerY); mouth.closePath();
    g.fillStyle = '#120808'; g.fill(mouth);
    g.save(); g.clip(mouth);
    // gums
    g.fillStyle = '#3a1c1c'; g.fillRect(cx - hw, cy - 20, hw * 2, 10);
    const tl = (10 + 16 * sv) * clamp(j * 2.2);
    g.fillStyle = '#f1ede0'; g.strokeStyle = '#2a2a2a'; g.lineWidth = 1.2;
    const nU = 12;
    for (let i = 0; i < nU; i++) {
      const u = (i + 0.5) / nU, x = lerp(cx - hw + 8, cx + hw - 8, u);
      const yTop = lerp(cornerY, cy - 12, 1 - Math.pow(2 * u - 1, 2)) + 2;
      const canine = (i === 2 || i === nU - 3) ? 1.6 : 1;
      const wT = (hw * 2 - 16) / nU * 0.5;
      g.beginPath(); g.moveTo(x - wT, yTop - 2); g.lineTo(x, yTop + tl * canine); g.lineTo(x + wT, yTop - 2); g.closePath(); g.fill(); g.stroke();
    }
    const nL = 10;
    for (let i = 0; i < nL; i++) {
      const u = (i + 0.5) / nL, x = lerp(cx - hw + 16, cx + hw - 16, u);
      const yB = lerp(cornerY, cy + open * 0.8, 1 - Math.pow(2 * u - 1, 2)) - 1;
      const canine = (i === 1 || i === nL - 2) ? 1.5 : 1;
      const wT = (hw * 2 - 32) / nL * 0.5;
      g.beginPath(); g.moveTo(x - wT, yB + 2); g.lineTo(x, yB - tl * 0.9 * canine); g.lineTo(x + wT, yB + 2); g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(mouth);
    // lower lip line
    strokeLine(g, [[cx - hw * 0.6, cy + open * 0.95 + 10], [cx, cy + open * 1.05 + 12], [cx + hw * 0.6, cy + open * 0.95 + 10]], 2, INK, 0.5);
  }
  // closed mouth line (visible as the jaw closes)
  const ca = clamp(1 - j * 5);
  if (ca > 0.01) {
    g.save(); g.globalAlpha *= ca;
    strokeLine(g, [[cx - hw, cornerY], [cx - hw * 0.5, cy + 2 - 6 * sm], [cx, cy + 4 - 4 * sm], [cx + hw * 0.5, cy + 2 - 6 * sm], [cx + hw, cornerY]], 3.4, INK, 1);
    // two small lower tusks keep him recognisable
    g.fillStyle = '#cfc9ba'; g.strokeStyle = INK; g.lineWidth = 2;
    for (const s of [-1, 1]) {
      const x = cx + s * hw * 0.62, y = cy + 2 - 5 * sm;
      const tl = 10 + 6 * sv;
      g.beginPath(); g.moveTo(x - 6, y + 3); g.lineTo(x + s * 1, y - tl); g.lineTo(x + 6, y + 3); g.closePath(); g.fill(); g.stroke();
    }
    // smile creases
    strokeLine(g, [[cx - hw - 6, cornerY - 10], [cx - hw - 2, cornerY + 6]], 2, INK, 0.6 * sm);
    strokeLine(g, [[cx + hw + 6, cornerY - 10], [cx + hw + 2, cornerY + 6]], 2, INK, 0.6 * sm);
    g.restore();
  }
}

// ---------- the whole orc ----------
function drawOrc(g, P) {
  const G = orcGeom(P), C = skinCols(P);
  g.save();
  g.translate(ORC_ROOT[0], ORC_ROOT[1] + P.breath * 2);
  drawOrcLegs(g, P, G);
  drawOrcTorso(g, P, G, C);
  // neck
  const neck = curvePath([[-86, -150 + G.head[1] + 170], [86, -150 + G.head[1] + 170], [98, 10], [-98, 10]], true, 0.2);
  g.fillStyle = hGrad(g, -100, 100, C); g.fill(neck);
  strokeLine(g, [[-70, -40], [-96, 20]], 3, INK, 0.9);
  strokeLine(g, [[70, -40], [96, 20]], 3, INK, 0.9);
  strokeLine(g, [[-40, -10], [-20, 40]], 2, INK, 0.5);
  strokeLine(g, [[40, -10], [20, 40]], 2, INK, 0.5);
  // shadow under the jaw
  const sh = g.createRadialGradient(0, G.head[1] + 150, 10, 0, G.head[1] + 150, 160);
  sh.addColorStop(0, 'rgba(0,0,0,0.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(-160, G.head[1] + 60, 320, 200);
  // head
  g.save(); g.translate(G.head[0], G.head[1] - P.breath); g.rotate(G.tilt);
  drawOrcHead(g, P, G, C);
  g.restore();
  drawBladeArm(g, P, G, C);
  drawBladeShape(g, P, G);
  drawPauldron(g, G);
  // the book on the lap (made from the sword)
  if (P.book > 0.01) drawLapBook(g, P, [40, G.waistY + 96]);
  drawPhoneArm(g, P, G, C);
  g.restore();
}

function drawLapBook(g, P, at) {
  const k = P.book;
  g.save(); g.translate(at[0], at[1]); g.scale(lerp(0.6, 1, easeOut(k)), lerp(0.6, 1, easeOut(k)));
  g.globalAlpha *= clamp(k * 1.5);
  // cover
  rr(g, -150, -44, 300, 104, 10); g.fillStyle = '#5a3a22'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  // pages (open), arched like the page's mark
  for (const s of [-1, 1]) {
    const p = new Path2D();
    p.moveTo(0, -30); p.quadraticCurveTo(s * 60, -52, s * 140, -38); p.lineTo(s * 140, 46); p.quadraticCurveTo(s * 60, 32, 0, 52); p.closePath();
    g.fillStyle = s < 0 ? '#e8dcc0' : '#f4ead2'; g.fill(p); g.strokeStyle = '#4a3a28'; g.lineWidth = 2; g.stroke(p);
    g.strokeStyle = 'rgba(60,45,30,0.45)'; g.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) { const y = -22 + i * 11; g.beginPath(); g.moveTo(s * 18, y + 2); g.lineTo(s * 122, y - 4 + i * 0.6); g.stroke(); }
  }
  strokeLine(g, [[0, -30], [0, 52]], 2.4, '#4a3a28', 1);
  g.restore();
}
