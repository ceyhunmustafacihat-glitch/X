'use strict';
// Frame composer: shots, transitions and the final grade.

let MAIN = null;

function init(canvas) {
  MAIN = { c: canvas, g: canvas.getContext('2d') };
  if (!GrainTiles.length) buildGrain();
  if (typeof initEffects === 'function') initEffects();
  if (typeof warmFeed === 'function') warmFeed();
}

// ---------- the room shot (with cold -> warm radial reveal) ----------
function renderRoomWorld(g, t, cam, pose, w, opts = {}) {
  const S = roomStateAt(t, w);
  const L = lightAt(t, pose, w);
  const dof = clamp((cam.z - 1.7) / 2.2, 0, 1);

  // background (blurred when the camera is close)
  if (dof > 0.02) {
    const k = 1 + dof * 7;
    const B = layer('bgBlur', W / k, H / k);
    B.g.setTransform(1 / k, 0, 0, 1 / k, 0, 0);
    B.g.translate(W / 2, H / 2); B.g.rotate(cam.r); B.g.scale(cam.z, cam.z); B.g.translate(-cam.x, -cam.y);
    drawRoomBack(B.g, S);
    drawChair(B.g, S, 360 + pose.chairX);
    drawDeskItems(B.g, S);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingQuality = 'high';
    g.filter = `blur(${(dof * 3).toFixed(2)}px)`;
    g.drawImage(B.c, 0, 0, B.c.width, B.c.height, -4, -4, W + 8, H + 8);
    g.filter = 'none';
    g.restore();
    applyCam(g, cam);
  } else {
    applyCam(g, cam);
    drawRoomBack(g, S);
    drawChair(g, S, 360 + pose.chairX);
    drawDeskItems(g, S);
  }
  applyCam(g, cam);
  // ambient light pool from the phone on the surroundings
  if (w < 0.5 && pose.phone > 0.01) {
    const ph = phoneWorld(pose);
    g.save(); g.globalCompositeOperation = 'screen';
    drawGlow(g, ph[0], ph[1] - 30, 420, L.screenCol, 0.22 * L.screenA);
    g.restore();
  }
  if (opts.mind) L.mind = opts.mind;
  drawCharacter(g, pose, L);
  if (w > 0.5) drawSunRays(g, S);
  if (opts.after) opts.after(g, S, L);
  return { S, L };
}

function renderRoomShot(g, t) {
  const pose = poseAt(t);
  const cam = cameraAt(t, pose);
  const r0 = TL.warm[0], r1 = r0 + 2.2;
  const reveal = 1 - Math.pow(1 - inv(r0, r1, t), 2.2);
  const opts = {
    mind: typeof drawMind === 'function' ? (ctx) => drawMind(ctx, t) : null,
    after: typeof drawWorldEffects === 'function' ? (ctx, S, L) => drawWorldEffects(ctx, t, pose, S, L) : null
  };
  if (reveal <= 0) {
    renderRoomWorld(g, t, cam, pose, 0, opts);
  } else if (reveal >= 1) {
    renderRoomWorld(g, t, cam, pose, 1, opts);
  } else {
    renderRoomWorld(g, t, cam, pose, 0, opts);
    const Wm = layer('warm');
    renderRoomWorld(Wm.g, t, cam, pose, 1, opts);
    // radial mask expanding from his head
    const hc = worldToScreen(cam, ...headToWorld(pose, 0.0, -0.2));
    const R = reveal * 2600;
    Wm.g.setTransform(1, 0, 0, 1, 0, 0);
    Wm.g.globalCompositeOperation = 'destination-in';
    const mg = Wm.g.createRadialGradient(hc[0], hc[1], Math.max(0, R - 380), hc[0], hc[1], R + 10);
    mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
    Wm.g.fillStyle = mg; Wm.g.fillRect(0, 0, W, H);
    Wm.g.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(Wm.c, 0, 0);
    // the travelling edge of light
    g.globalCompositeOperation = 'screen';
    const eg = g.createRadialGradient(hc[0], hc[1], Math.max(0, R - 240), hc[0], hc[1], R + 60);
    eg.addColorStop(0, 'rgba(255,196,110,0)'); eg.addColorStop(0.75, `rgba(255,196,110,${0.22 * (1 - reveal)})`); eg.addColorStop(1, 'rgba(255,196,110,0)');
    g.fillStyle = eg; g.fillRect(0, 0, W, H);
    g.restore();
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { pose, cam };
}

// ---------- grade ----------
function saturationAt(t) {
  if (t < TL.roomCold[1]) return lerp(0.82, 0.5, inv(0, TL.roomCold[1], t));
  if (t < TL.postArrive) return lerp(0.5, 0.32, inv(TL.feed[0], TL.postArrive, t));
  if (t < TL.warm[0]) return lerp(0.32, 1.0, ss(TL.postArrive, TL.postStop + 0.2, t));
  return 1.12;
}
function bloomAt(t) {
  return 0.22 + 0.25 * win(9.0, 9.6, 10.8, 11.6, t) + 0.35 * win(13.3, 14.2, 16.8, 17.4, t) +
    0.3 * win(17.2, 18.4, 19.2, 19.6, t) + 0.8 * win(19.3, 19.48, 19.55, 20.1, t) + 0.25 * ss(20, 21, t) +
    0.45 * ss(TL.logo[0], TL.logo[0] + 1, t);
}

function post(t, src) {
  const g = MAIN.g;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const sat = saturationAt(t);
  const cold = 1 - ss(TL.warm[0], TL.warm[0] + 2, t);
  const contrast = lerp(1.07, 0.98, cold * (t < TL.feed[0] ? 1 : 0));
  const lift = 1 + 0.14 * (1 - ss(TL.warm[0], TL.warm[0] + 1, t)) * (t < TL.feed[0] || t > TL.feed[1] ? 1 : 0.4);
  g.filter = `saturate(${sat.toFixed(3)}) contrast(${contrast.toFixed(3)}) brightness(${lift.toFixed(3)})`;
  g.drawImage(src, 0, 0);
  g.filter = 'none';

  // bloom
  const bl = bloomAt(t);
  if (bl > 0.01) {
    const B = layer('bloom', W / 6, H / 6);
    B.g.filter = 'brightness(0.75) contrast(2.4) blur(5px)';
    B.g.drawImage(src, 0, 0, W / 6, H / 6);
    B.g.filter = 'none';
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = clamp(bl, 0, 1);
    g.imageSmoothingQuality = 'high';
    g.drawImage(B.c, 0, 0, W, H);
    if (bl > 1) { g.globalAlpha = bl - 1; g.drawImage(B.c, 0, 0, W, H); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  // colour wash: cold blue tint early, warm cream after the change
  const warmK = ss(TL.warm[0], TL.warm[0] + 2.5, t);
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = rgb(mixc('#33507a', '#e2b170', warmK), 0.18 + 0.06 * warmK);
  if (t < TL.logo[0]) g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';

  // vignette
  const vg = g.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.5, H * 0.72);
  const vs = lerp(0.62, 0.38, warmK) + 0.2 * win(17, 18, 19.2, 19.6, t);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${vs})`);
  g.fillStyle = vg; g.fillRect(0, 0, W, H);

  // global fades
  const black = 1 - ss(TL.fadeIn[0], TL.fadeIn[1], t);
  if (black > 0.001) { g.fillStyle = `rgba(0,0,0,${clamp(black)})`; g.fillRect(0, 0, W, H); }

  // grain
  const fi = Math.floor(t * 15);
  const tile = GrainTiles[fi % GrainTiles.length];
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.05;
  const ox = (fi * 137) % 384, oy = (fi * 251) % 384;
  g.save(); g.translate(-ox, -oy);
  g.fillStyle = g.createPattern(tile, 'repeat');
  g.fillRect(0, 0, W + 384, H + 384);
  g.restore();
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

// ---------- main entry ----------
function renderFrame(t) {
  const Sc = layer('scene');
  const g = Sc.g;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);

  const roomA = win(-1, 0, 5.62, 5.8, t) + win(11.28, 11.42, 22.62, 22.85, t) + win(25.02, 25.3, TL.fadeOut[0], TL.fadeOut[1], t);
  if (roomA > 0.001) {
    const R = layer('room');
    renderRoomShot(R.g, t);
    // flash into the phone light
    const flash = win(5.0, 5.7, 5.7, 5.9, t);
    if (flash > 0) { R.g.globalCompositeOperation = 'screen'; R.g.fillStyle = `rgba(200,220,255,${flash * 0.85})`; R.g.fillRect(0, 0, W, H); R.g.globalCompositeOperation = 'source-over'; }
    g.globalAlpha = clamp(roomA); g.drawImage(R.c, 0, 0); g.globalAlpha = 1;
  }
  if (typeof renderFeed === 'function') {
    const fa = win(5.6, 5.8, 11.33, 11.5, t);
    if (fa > 0.001) { const F = layer('feed'); renderFeed(F.g, t); g.globalAlpha = fa; g.drawImage(F.c, 0, 0); g.globalAlpha = 1; }
  }
  if (typeof renderInsert === 'function') {
    const ia = win(22.5, 22.82, 25.02, 25.32, t);
    if (ia > 0.001) { const I = layer('insert'); renderInsert(I.g, t); g.globalAlpha = ia; g.drawImage(I.c, 0, 0); g.globalAlpha = 1; }
  }
  if (typeof renderLogo === 'function' && t > TL.logo[0]) {
    renderLogo(g, t);
  }
  post(t, Sc.c);
}
