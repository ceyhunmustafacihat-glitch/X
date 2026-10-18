'use strict';
// Frame composer: world shots (dark den -> lit study), phone POV shots, effects and grade.

let MAIN = null;
const Masks = [];          // dissolve masks: noise thresholded at 33 levels

function init(canvas) {
  MAIN = { c: canvas, g: canvas.getContext('2d') };
  if (!GrainTiles.length) buildGrain();
  warmPhone();
  buildMasks();
}

function buildMasks() {
  const mw = 160, mh = 280;
  const N = new Float32Array(mw * mh);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    N[y * mw + x] = fbm2(x / 26, y / 26, 5, 5) * 0.8 + 0.2 * (1 - y / mh);   // dissolves from the top down a little
  }
  let lo = 1, hi = 0; for (const v of N) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  for (let i = 0; i <= 32; i++) {
    const th = lerp(-0.1, 1.1, i / 32);
    const c = makeCanvas(mw, mh), g = c.getContext('2d');
    const img = g.createImageData(mw, mh);
    for (let k = 0; k < N.length; k++) {
      const v = (N[k] - lo) / (hi - lo);
      img.data[k * 4 + 3] = 255 * sstep(clamp((v - th + 0.07) / 0.14));
    }
    g.putImageData(img, 0, 0);
    Masks.push(c);
  }
}
// visible fraction k (0 = gone, 1 = solid)
function maskFor(k) { return Masks[Math.round(clamp(1 - k) * 32)]; }

// ---------- lighting ----------
function lightMap(t, cam, P, lit, k) {
  const M = layer(lit ? 'lmL' : 'lmD', W * k, H * k);
  const S = lightsAt(t, P, lit);
  M.g.fillStyle = rgb(S.amb); M.g.fillRect(0, 0, W * k, H * k);
  M.g.globalCompositeOperation = 'lighter';
  for (const L of S.L) {
    const [x, y] = worldToScreen(cam, L.x, L.y);
    const r = L.r * cam.z;
    const gr = M.g.createRadialGradient(x * k, y * k, 0, x * k, y * k, r * k);
    const c = L.c, a = L.a;
    gr.addColorStop(0, rgb([c[0] * a, c[1] * a, c[2] * a]));
    gr.addColorStop(0.3, rgb([c[0] * a * 0.6, c[1] * a * 0.6, c[2] * a * 0.6]));
    gr.addColorStop(0.65, rgb([c[0] * a * 0.18, c[1] * a * 0.18, c[2] * a * 0.18]));
    gr.addColorStop(1, 'rgba(0,0,0,1)');
    M.g.fillStyle = gr; M.g.fillRect(0, 0, W * k, H * k);
  }
  M.g.globalCompositeOperation = 'source-over';
  return M.c;
}

// the wizard: drawn into his own layer, dissolving through a noise mask; composited
// into the world behind the orc (he stands at the back of the room)
function buildWizard(t, cam, k) {
  const Q = wizardAt(t);
  const vis = Q.appear * (1 - Q.out);
  if (vis <= 0.005) return null;
  const WZ = layer('wiz', W * k, H * k);
  applyCam(WZ.g, cam, k);
  drawWizard(WZ.g, Q);
  WZ.g.setTransform(1, 0, 0, 1, 0, 0);
  if (vis < 0.999) {
    applyCam(WZ.g, cam, k);
    WZ.g.globalCompositeOperation = 'destination-in';
    WZ.g.drawImage(maskFor(vis), Q.x - 380 * Q.s, Q.y - 440 * Q.s, 760 * Q.s, 1400 * Q.s);
    WZ.g.setTransform(1, 0, 0, 1, 0, 0);
  }
  WZ.g.globalCompositeOperation = 'source-atop';
  WZ.g.fillStyle = 'rgba(255,214,150,0.16)'; WZ.g.fillRect(0, 0, W * k, H * k);
  WZ.g.globalCompositeOperation = 'source-over';
  return { c: WZ.c, vis };
}
function drawWizardLayer(g, Z, k) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 0.92 * Math.min(1, Z.vis * 1.6);
  g.drawImage(Z.c, 0, 0);
  g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.25 * Z.vis;
  g.filter = `blur(${(10 * k).toFixed(1)}px)`; g.drawImage(Z.c, 0, 0); g.filter = 'none';
  g.restore();
}

// props that change, drawn into both skins
function drawProps(g, t) {
  const bones = ss(TL.bones[0], TL.bones[1], t);
  const sword = ss(TL.sword[0] + 0.5, TL.sword[1] - 0.4, t);
  const swordGlow = win(TL.sword[0], TL.sword[0] + 0.5, TL.sword[1] - 0.6, TL.sword[1], t);
  const dark = 1 - ss(TL.reveal[0], TL.reveal[0] + 2.2, t);
  drawCobwebs(g, dark);
  drawChains(g, dark, t);
  drawBones(g, bones);
  drawSword(g, sword, swordGlow);
  drawFlies(g, t, 1 - ss(TL.bones[0] - 0.3, TL.bones[0] + 0.6, t));
}

function renderWorldSkin(name, t, cam, P, lit, k, CH, WZ) {
  const L = layer(name, W * k, H * k);
  applyCam(L.g, cam, k);
  drawRoomSkin(L.g, lit ? 1 : 0);
  drawProps(L.g, t);
  L.g.setTransform(1, 0, 0, 1, 0, 0);
  if (WZ) drawWizardLayer(L.g, WZ, k);
  L.g.drawImage(CH.c, 0, 0);
  L.g.globalCompositeOperation = 'multiply';
  L.g.drawImage(lightMap(t, cam, P, lit, k), 0, 0);
  L.g.globalCompositeOperation = 'source-over';
  return L;
}

function renderWorld(g, t, cam, k = 1) {
  const P = orcAt(t);
  const CH = layer('chars', W * k, H * k);
  applyCam(CH.g, cam, k);
  drawOrc(CH.g, P);
  const WZ = buildWizard(t, cam, k);
  const rv = revealAt(t);
  const R0 = rv < 1 ? renderWorldSkin('darkW', t, cam, P, false, k, CH, WZ) : null;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (R0) g.drawImage(R0.c, 0, 0, W * k, H * k);
  if (rv > 0) {
    const R1 = renderWorldSkin('litW', t, cam, P, true, k, CH, WZ);
    const ph = worldToScreen(cam, ...orcPhoneWorld(P));
    if (rv < 1) {
      const R = rv * 2300 * cam.z;
      R1.g.setTransform(1, 0, 0, 1, 0, 0);
      R1.g.globalCompositeOperation = 'destination-in';
      const mg = R1.g.createRadialGradient(ph[0] * k, ph[1] * k, Math.max(0, R - 420) * k, ph[0] * k, ph[1] * k, (R + 10) * k);
      mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
      R1.g.fillStyle = mg; R1.g.fillRect(0, 0, W * k, H * k);
      R1.g.globalCompositeOperation = 'source-over';
    }
    g.drawImage(R1.c, 0, 0, W * k, H * k);
    if (rv < 1) {
      // the travelling edge of light
      const R = rv * 2300 * cam.z;
      g.save(); g.scale(k, k); g.globalCompositeOperation = 'screen';
      const eg = g.createRadialGradient(ph[0], ph[1], Math.max(0, R - 260), ph[0], ph[1], R + 80);
      eg.addColorStop(0, 'rgba(255,200,120,0)'); eg.addColorStop(0.75, `rgba(255,200,120,${0.3 * (1 - rv)})`); eg.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = eg; g.fillRect(0, 0, W, H);
      g.restore();
    }
  }
  g.setTransform(k, 0, 0, k, 0, 0);
  drawEmissive(g, t, cam, P, rv, k);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return P;
}

// ---------- emissive things & magic (screen space, already scaled by k) ----------
function drawEmissive(g, t, cam, P, rv, k) {
  const S = (x, y) => worldToScreen(cam, x, y);
  const z = cam.z;
  g.save(); g.globalCompositeOperation = 'screen';
  // phone: light leaking around the case
  const ph = S(...orcPhoneWorld(P));
  const sl = screenLight(t), warm = warmAt(t);
  drawGlow(g, ph[0], ph[1], 190 * z, mixc(sl.c, '#ffd59a', warm), 0.35 + 0.25 * warm);
  // red eyes
  const eyes = orcEyesWorld(P).map(e => S(...e));
  const open = clamp(P.lid * P.blink);
  for (const e of eyes) {
    drawGlow(g, e[0], e[1] + 2 * z, 46 * z, '#ff2a10', 0.85 * P.red * open);
    drawGlow(g, e[0], e[1] + 2 * z, 14 * z, '#ffb08a', 0.7 * P.red * open);
    // warm reflection of the page in his eyes
    if (warm > 0 && t > TL.face2[0] - 0.1) {
      g.globalAlpha = 0.55 * warm * open * (1 - rv * 0.6);
      g.fillStyle = '#ffe2b0';
      g.fillRect(e[0] - 3 * z + P.gazeX * 10 * z, e[1] + 2 * z, 5 * z, 8 * z);
      g.globalAlpha = 1;
    }
  }
  // the blade's cold glint, then the quill's sparkle
  const cuff = S(...orcCuffWorld(P));
  drawGlow(g, cuff[0], cuff[1] - 200 * z, 160 * z, '#c8d8ff', 0.18 * (1 - P.quill) * (1 - rv));
  const bl = win(TL.blade[0], TL.blade[0] + 0.4, TL.blade[1] - 0.4, TL.blade[1] + 0.3, t);
  if (bl > 0) {
    drawGlow(g, cuff[0], cuff[1] - 200 * z, 260 * z, '#ffd890', 0.8 * bl);
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU + t * 1.5, r = (60 + 140 * hash1(i)) * z * (0.6 + bl);
      drawGlow(g, cuff[0] + Math.cos(a) * r * 0.5, cuff[1] - 200 * z + Math.sin(a) * r, 12 * z, '#fff0c8', bl);
    }
  }
  // candle on the shelf (lit room)
  if (rv > 0.3) {
    const c = S(308, 930);
    const fl = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29);
    drawGlow(g, c[0], c[1], 150 * z * fl, '#ffb050', 0.5 * ss(0.3, 0.7, rv));
    g.globalAlpha = ss(0.3, 0.7, rv); g.fillStyle = '#fff2c0';
    g.beginPath(); g.ellipse(c[0], c[1] - 4 * z, 6 * z, 15 * z * fl, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
  }
  // sun rays through the window
  if (rv > 0) {
    const a = ss(0.25, 1, rv) * (0.85 + 0.15 * Math.sin(t * 0.8));
    for (let i = 0; i < 5; i++) {
      const x0 = WIN.x + 40 + i * 55, y0 = WIN.y + 120 + i * 40;
      const p = [S(x0, y0), S(x0 + 50, y0), S(x0 + 820, FLOOR_Y + 420), S(x0 + 600, FLOOR_Y + 420)];
      const gr = g.createLinearGradient(p[0][0], p[0][1], p[2][0], p[2][1]);
      gr.addColorStop(0, `rgba(255,226,170,${0.16 * a})`); gr.addColorStop(1, 'rgba(255,226,170,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(...p[0]); g.lineTo(...p[1]); g.lineTo(...p[2]); g.lineTo(...p[3]); g.closePath(); g.fill();
    }
  }
  // dust: cold grey specks in the den, gold motes in the light
  for (let i = 0; i < 46; i++) {
    const sx = hash1(i * 1.7) * 1200 - 60, sy = hash1(i * 2.3 + 1) * 1900;
    const x = sx + Math.sin(t * 0.3 + i) * 30, y = (sy - t * (8 + 10 * hash1(i))) % 1900;
    const p = S(x, y < 0 ? y + 1900 : y);
    drawGlow(g, p[0], p[1], (5 + 5 * hash1(i * 5)) * z, rv > 0.5 ? '#ffe2a0' : '#8a98a8', (0.25 + 0.3 * rv) * (0.5 + 0.5 * Math.sin(t * 1.3 + i)));
  }
  g.restore();
  drawMagic(g, t, cam, P, rv, k);
}

function drawMagic(g, t, cam, P, rv, k) {
  const S = (x, y) => worldToScreen(cam, x, y);
  const z = cam.z;
  const Q = wizardAt(t);
  const present = Q.appear * (1 - Q.out);
  g.save(); g.globalCompositeOperation = 'screen';
  // smoke & light where he gathers
  const smoke = win(TL.wizardIn[0] - 0.4, TL.wizardIn[0] + 0.8, TL.wizardIn[1], TL.wizardIn[1] + 1.2, t) + win(TL.wizardOut[0] - 0.2, TL.wizardOut[0] + 0.6, TL.wizardOut[1] - 0.6, TL.wizardOut[1] + 0.3, t) * 0.8;
  if (smoke > 0) {
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4 + t * (0.4 + 0.2 * hash1(i)), r = 120 + 200 * hash1(i * 3.3);
      const p = S(WIZ_ROOT[0] + Math.cos(a) * r * 0.8, WIZ_ROOT[1] + 260 + Math.sin(a) * r * 1.6 - (t % 4) * 10);
      drawGlow(g, p[0], p[1], (160 + 120 * hash1(i)) * z, i % 3 ? '#8c8a84' : '#e8c890', 0.16 * smoke);
    }
  }
  if (present > 0.01) drawGlow(g, ...S(WIZ_ROOT[0], WIZ_ROOT[1] + 200), 620 * z, '#ffd8a0', 0.28 * present);
  // stream from the staff's book to the phone
  const stream = ss(TL.point[0] + 0.2, TL.point[1] + 0.3, t) * (1 - ss(TL.nod - 0.2, TL.nod + 0.6, t));
  if (stream > 0.01) {
    const a = wizStaffTop(Q), b = orcPhoneWorld(P);
    const cpt = [lerp(a[0], b[0], 0.5) + 60, Math.min(a[1], b[1]) - 120];
    for (let i = 0; i < 40; i++) {
      const u = (t * 0.55 + i / 40) % 1;
      const x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * cpt[0] + u * u * b[0] + Math.sin(t * 3 + i) * 14 * (1 - u);
      const y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * cpt[1] + u * u * b[1] + Math.cos(t * 2.6 + i * 1.7) * 14 * (1 - u);
      const p = S(x, y);
      drawGlow(g, p[0], p[1], (10 + 8 * hash1(i)) * z, i % 4 ? '#ffe2a8' : '#ffffff', stream * Math.sin(u * Math.PI) * 0.9);
    }
    drawGlow(g, ...S(...b), 160 * z, '#ffd890', stream * 0.45);
  }
  if (present > 0.01) {
    const st = S(...wizStaffTop(Q));
    drawGlow(g, st[0], st[1], 220 * z * Q.s, '#fff4d8', 0.55 * present * (0.85 + 0.15 * Math.sin(t * 3)));
  }
  // the sword becomes light that flies to his lap
  const sw0 = TL.sword[0];
  if (t > sw0 && t < TL.sword[1] + 0.6) {
    const pts = swordPoints(60), lap = orcLapWorld(P);
    for (let i = 0; i < pts.length; i++) {
      const ts = sw0 + 0.5 + 0.7 * hash1(i * 7.7), u = clamp((t - ts) / 1.0);
      if (t < ts - 0.4) continue;
      const e = easeInOut(u);
      const c = [lerp(pts[i][0], lap[0], 0.5), Math.min(pts[i][1], lap[1]) - 260 - 120 * hash1(i)];
      const x = (1 - e) * (1 - e) * pts[i][0] + 2 * (1 - e) * e * c[0] + e * e * (lap[0] + (hash1(i) - 0.5) * 120);
      const y = (1 - e) * (1 - e) * pts[i][1] + 2 * (1 - e) * e * c[1] + e * e * lap[1];
      const a = u <= 0 ? ss(ts - 0.4, ts, t) * 0.6 : (1 - ss(0.85, 1, u));
      drawGlow(g, ...S(x, y), 16 * z, '#ffd890', a);
    }
    drawGlow(g, ...S(...lap), 240 * z, '#ffe0a0', 0.5 * win(TL.sword[1] - 0.6, TL.sword[1] - 0.1, TL.sword[1] + 0.1, TL.sword[1] + 0.7, t));
  }
  // bones crumble into rising dust
  for (const d of bonesDust(ss(TL.bones[0], TL.bones[1], t))) {
    if (d.k <= 0 || d.k >= 1) continue;
    for (let j = 0; j < 8; j++) {
      const p = S(d.x + (hash1(j + d.x) - 0.5) * 120 + Math.sin(t * 2 + j) * 10, d.y - d.k * (80 + 120 * hash1(j * 3 + d.y)));
      drawGlow(g, p[0], p[1], 10 * z, j % 2 ? '#d8d0c0' : '#ffd890', Math.sin(d.k * Math.PI) * 0.8);
    }
  }
  // as he leaves: motes rising from where he stood
  if (Q.out > 0 && Q.out < 1) {
    for (let i = 0; i < 40; i++) {
      const p = S(WIZ_ROOT[0] + (hash1(i) - 0.5) * 420, WIZ_ROOT[1] + 700 * hash1(i * 2.1) - 200 - Q.out * (200 + 300 * hash1(i * 4.4)));
      drawGlow(g, p[0], p[1], 12 * z, '#ffe8b8', Math.sin(Q.out * Math.PI) * 0.9);
    }
  }
  g.restore();
}

// ---------- POV shots ----------
function renderPov(g, t) {
  const L = povLayout(t);
  const late = t > TL.pov2[0];
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (!late) {
    // the dark room, out of focus behind the phone
    const gr = g.createRadialGradient(540, 1100, 100, 540, 1000, 1300);
    gr.addColorStop(0, '#1a1d22'); gr.addColorStop(1, '#050607');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const sl = screenLight(t), warm = warmAt(t);
    g.save(); g.globalCompositeOperation = 'screen';
    drawGlow(g, L.cx, L.cy, 1100, mixc(sl.c, '#ffd59a', warm), 0.25 + 0.25 * warm);
    g.restore();
  } else {
    const B = layer('povBg', W / 4, H / 4);
    renderWorld(B.g, t, cameraAt(t), 0.25);
    g.save(); g.filter = 'blur(14px)'; g.drawImage(B.c, -20, -20, W + 40, H + 40); g.filter = 'none'; g.restore();
  }
  // shadow under the phone
  g.save(); g.globalAlpha = 0.5; g.filter = 'blur(30px)'; g.fillStyle = '#000';
  g.translate(L.cx + 30, L.cy + 40); g.rotate(L.r); rr(g, -SW * L.s / 2, -SH * L.s / 2, SW * L.s, SH * L.s, 80); g.fill();
  g.restore();
  drawPhoneDevice(g, t, L);
  // tap ripple
  for (const [tt, sx, sy] of [[TL.tap, 50, FEEDP.landY + 50], [TL.follow, 218 * SW / 923, 542 * SW / 923]]) {
    const k = inv(tt, tt + 0.45, t);
    if (k > 0 && k < 1) {
      const p = povScreenToFrame(L, sx, sy);
      g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; g.lineWidth = 4;
      g.beginPath(); g.arc(p[0], p[1], 20 + k * 90, 0, TAU); g.stroke();
    }
  }
  drawThumb(g, t, late ? 0 : 1);
}

// ---------- grade ----------
function post(t, src) {
  const g = MAIN.g;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const rv = revealAt(t);
  const lit = t > TL.change[0] ? rv : 0;
  const sat = lerp(0.8, 1.08, lit);
  const con = lerp(1.1, 1.02, lit);
  g.filter = `saturate(${sat.toFixed(3)}) contrast(${con.toFixed(3)})`;
  g.drawImage(src, 0, 0);
  g.filter = 'none';

  const bl = 0.25 + 0.2 * win(TL.postStop - 0.2, TL.postStop + 0.5, TL.face2[1], TL.face2[1] + 0.5, t) + 0.3 * win(15, 17, 20.5, 22.5, t) + 0.25 * lit;
  const B = layer('bloom', W / 6, H / 6);
  B.g.filter = 'brightness(0.8) contrast(2.2) blur(6px)';
  B.g.drawImage(src, 0, 0, W / 6, H / 6);
  B.g.filter = 'none';
  g.globalCompositeOperation = 'screen'; g.globalAlpha = clamp(bl);
  g.imageSmoothingQuality = 'high'; g.drawImage(B.c, 0, 0, W, H);
  g.globalAlpha = 1;

  // cold green-blue wash in the den, warm gold once lit
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = rgb(mixc('#2c4a56', '#e6b672', lit), 0.22);
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';

  const vg = g.createRadialGradient(W / 2, H * 0.48, H * 0.22, W / 2, H * 0.5, H * 0.74);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${lerp(0.75, 0.35, lit)})`);
  g.fillStyle = vg; g.fillRect(0, 0, W, H);

  const black = (1 - ss(TL.fadeIn[0], TL.fadeIn[1], t)) + ss(TL.fadeOut[0], TL.fadeOut[1], t);
  if (black > 0.001) { g.fillStyle = `rgba(0,0,0,${clamp(black)})`; g.fillRect(0, 0, W, H); }

  const fi = Math.floor(t * 15);
  const tile = GrainTiles[fi % GrainTiles.length];
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = lerp(0.08, 0.045, lit);
  g.save(); g.translate(-((fi * 137) % 384), -((fi * 251) % 384));
  g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, W + 384, H + 384);
  g.restore();
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

// ---------- main entry ----------
function isPov(t) { return (t >= TL.pov[0] && t < TL.pov[1]) || (t >= TL.pov2[0] && t < TL.pov2[1]); }
function renderShot(g, t) {
  if (isPov(t)) renderPov(g, t);
  else renderWorld(g, t, cameraAt(t));
}
function renderFrame(t) {
  const Sc = layer('scene');
  const g = Sc.g;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  renderShot(g, t);
  // short dissolves at the cuts
  const cuts = [TL.face1[0], TL.pov[0], TL.face2[0], TL.change[0], TL.medium[0], TL.pov2[0], TL.end[0]];
  for (const c of cuts) {
    const d = 0.16;
    if (t >= c && t < c + d) {
      const P = layer('prev');
      renderShot(P.g, c - 0.001);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1 - (t - c) / d; g.drawImage(P.c, 0, 0); g.globalAlpha = 1;
    }
  }
  // a flash of screen light as we dive into the phone
  const fl = win(TL.pov[0] - 0.2, TL.pov[0], TL.pov[0], TL.pov[0] + 0.2, t);
  if (fl > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,120,90,${0.6 * fl})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  post(t, Sc.c);
}

// 2D value noise + fBm (dissolve masks)
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
