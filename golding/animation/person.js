'use strict';
// The cast: one parametric storybook character (front-facing, ink outline,
// flat colour) that covers every person in the film, from baby William to
// the bearded Nobel laureate.

const SKINS = { a: C.skin, b: '#eebd96', c: '#f5d2b2' };

function person(g, o) {
  const d = Object.assign({
    x: 0, y: 0, s: 1, kid: false, skin: C.skin, hair: '#5a3b26', hairStyle: 'short',
    top: C.navy, bottom: '#3b3a48', shoe: C.ink, sleeve: null, beard: null, mustache: null,
    glasses: false, hat: null, hatCol: null, armL: 0.12, armR: 0.12, elbL: 0, elbR: 0,
    mouth: 'smile', eyes: 'open', look: 0, lookY: 0, brow: 0, angry: 0, sad: 0, blush: 0,
    skirt: null, walk: 0, stride: 0, lean: 0, seed: 1, t: 0, tie: null, collar: null,
    sailorCollar: false, stripes: 0, buttons: false, handL: null, handR: null, bob: 0, squash: 1,
    sash: false, coat: null, flip: false, headTilt: 0, bodyW: 1, pin: null, shorts: false, socks: C.white
  }, o);
  g.save();
  g.translate(d.x, d.y);
  g.scale(d.s * (d.flip ? -1 : 1), d.s * d.squash);
  g.rotate(d.lean);
  g.translate(0, -d.bob);
  const P = d.kid
    ? { leg: 74, torso: 90, R: 54, sw: 62, hw: 54, arm: 78, lw: 19, legw: 21, hand: 10 }
    : { leg: 122, torso: 130, R: 47, sw: 80 * d.bodyW, hw: 68 * d.bodyW, arm: 112, lw: 22, legw: 24, hand: 11 };
  const R = P.R, hipY = -P.leg, shY = hipY - P.torso, hY = shY - R * 0.92;
  const seed = d.seed * 13;
  const out = {};
  if (d.kneel) g.translate(0, P.leg * 0.62);

  // ---- legs
  const hx = P.hw * 0.26;
  const ph = d.walk, st = d.stride;
  const sw = Math.sin(ph) * P.leg * 0.3 * st;
  const lf = [-hx * 1.1 + sw, -Math.max(0, Math.sin(ph)) * 14 * st];
  const rf = [hx * 1.1 - sw, -Math.max(0, -Math.sin(ph)) * 14 * st];
  if (d.kneel) {
    limb(g, [[-hx, hipY + 6], [-hx * 1.5, hipY + P.leg * 0.4]], d.bottom, P.legw, INKW, seed + 1);
    limb(g, [[hx, hipY + 6], [hx * 1.5, hipY + P.leg * 0.4]], d.bottom, P.legw, INKW, seed + 2);
  } else if (d.shorts) {
    limb(g, [[-hx, hipY + 6], lf], d.skin, P.legw * 0.82, INKW, seed + 1);
    limb(g, [[hx, hipY + 6], rf], d.skin, P.legw * 0.82, INKW, seed + 2);
    limb(g, [[-hx + sw * 0.25, hipY + P.leg * 0.72], lf], d.socks, P.legw * 0.86, INKW, seed + 5);
    limb(g, [[hx - sw * 0.25, hipY + P.leg * 0.72], rf], d.socks, P.legw * 0.86, INKW, seed + 6);
    const sh = wpoly([[-P.hw / 2 - 2, hipY - 10], [P.hw / 2 + 2, hipY - 10], [P.hw / 2 + 6, hipY + P.leg * 0.36], [3, hipY + P.leg * 0.36], [0, hipY + 14], [-3, hipY + P.leg * 0.36], [-P.hw / 2 - 6, hipY + P.leg * 0.36]], 1.2, seed + 7);
    ink(g, sh, d.bottom);
  } else if (!d.skirt || d.skirt === 'short') {
    limb(g, [[-hx, hipY + 6], lf], d.bottom, P.legw, INKW, seed + 1);
    limb(g, [[hx, hipY + 6], rf], d.bottom, P.legw, INKW, seed + 2);
  } else {
    limb(g, [[-hx, hipY + 40], lf], d.skin, P.legw * 0.7, INKW, seed + 1);
    limb(g, [[hx, hipY + 40], rf], d.skin, P.legw * 0.7, INKW, seed + 2);
  }
  if (!d.kneel) for (const [f, sd] of [[lf, -1], [rf, 1]]) ink(g, wellipse(f[0] + sd * 6, f[1] - 4, P.legw * 0.78, P.legw * 0.42, 1, seed + 3 + sd), d.shoe, 4);

  // ---- skirt / dress
  if (d.skirt) {
    const sl = d.skirt === 'short' ? P.leg * 0.32 : P.leg * 0.62;
    const sk = wpoly([[-P.hw * 0.5, hipY - 16], [P.hw * 0.5, hipY - 16], [P.hw * 0.95, hipY + sl], [-P.hw * 0.95, hipY + sl]], 1.4, seed + 4);
    ink(g, sk, d.skirt === 'short' ? d.bottom : d.top);
    inkShade(g, sk, -10, -6, 0.13);
  }

  // ---- back hair (long styles)
  if (d.hairStyle === 'long') {
    ink(g, wcurve([[-R * 1.1, hY - R * 0.3], [-R * 0.9, hY - R * 1.05], [R * 0.9, hY - R * 1.05], [R * 1.1, hY - R * 0.3], [R * 1.15, hY + R * 1.25], [-R * 1.15, hY + R * 1.25]], 1.3, seed + 5), d.hair);
  }
  if (d.hairStyle === 'bun') ink(g, wellipse(0, hY - R * 1.12, R * 0.48, R * 0.4, 1, seed + 6), d.hair);
  if (d.hat === 'veil') {
    alpha(g, 0.8, () => ink(g, wcurve([[-R * 0.9, hY - R * 0.9], [R * 0.9, hY - R * 0.9], [R * 1.5, hY + R * 1.8], [-R * 1.5, hY + R * 1.8]], 1.2, seed + 7), C.white, 3));
  }

  // ---- torso
  const tp = wpoly([[-P.sw / 2 + 8, shY], [P.sw / 2 - 8, shY], [P.sw / 2, shY + 16], [P.hw / 2 + 3, hipY + 14], [-P.hw / 2 - 3, hipY + 14], [-P.sw / 2, shY + 16]], 1.3, seed + 8);
  ink(g, tp, d.top);
  if (d.coat) { // open coat over a shirt
    const cl = wpoly([[-P.sw / 2 + 8, shY], [-4, shY], [-2, hipY + 14], [-P.hw / 2 - 3, hipY + 14], [-P.sw / 2, shY + 16]], 1.2, seed + 9);
    const cr = wpoly([[P.sw / 2 - 8, shY], [4, shY], [2, hipY + 14], [P.hw / 2 + 3, hipY + 14], [P.sw / 2, shY + 16]], 1.2, seed + 10);
    ink(g, cl, d.coat, 4); ink(g, cr, d.coat, 4);
  }
  inkShade(g, tp, -12, -6, 0.14);
  if (d.collar) {
    ink(g, wpoly([[-16, shY - 2], [0, shY + 22], [16, shY - 2]], 1, seed + 11), d.collar, 4);
  }
  if (d.sailorCollar) {
    const sc = wpoly([[-P.sw / 2 + 6, shY + 2], [P.sw / 2 - 6, shY + 2], [P.sw / 2 - 4, shY + 34], [0, shY + 52], [-P.sw / 2 + 4, shY + 34]], 1.2, seed + 12);
    ink(g, sc, C.navyD, 4);
    wline(g, [[-P.sw / 2 + 10, shY + 28], [0, shY + 44], [P.sw / 2 - 10, shY + 28]], 3, C.white, seed + 13);
    ink(g, wpoly([[-9, shY + 46], [9, shY + 46], [4, shY + 70], [-4, shY + 70]], 1, seed + 14), C.white, 3);
  }
  if (d.tie) ink(g, wpoly([[-6, shY + 6], [6, shY + 6], [9, shY + 66], [0, shY + 78], [-9, shY + 66]], 1, seed + 15), d.tie, 3.5);
  if (d.buttons) for (let i = 0; i < 3; i++) ink(g, wellipse(d.tie ? 18 : 0, shY + 34 + i * 30, 4.5, 4.5, 0.4, seed + 16 + i), C.gold, 2.5);
  if (d.sash) {
    const sp = wpoly([[-P.sw / 2 + 4, shY + 10], [-P.sw / 2 + 26, shY + 2], [P.hw / 2 + 4, hipY + 2], [P.hw / 2 - 18, hipY + 14]], 1, seed + 19);
    ink(g, sp, C.purple, 3.5);
    g.save(); g.clip(sp);
    g.fillStyle = C.white; g.fillRect(-200, hipY - P.torso * 0.45, 400, 14);
    g.fillStyle = C.green; g.fillRect(-200, hipY - P.torso * 0.45 + 14, 400, 18);
    g.restore();
  }
  if (d.pin) d.pin(g, -P.sw * 0.22, shY + 40);

  // ---- arms
  const shL = [-P.sw / 2 + 10, shY + 18], shR = [P.sw / 2 - 10, shY + 18];
  const arm = (sh, a, e, side) => {
    const el = [sh[0] + side * Math.sin(a) * P.arm * 0.5, sh[1] + Math.cos(a) * P.arm * 0.5];
    const hd = [el[0] + side * Math.sin(a + e) * P.arm * 0.5, el[1] + Math.cos(a + e) * P.arm * 0.5];
    limb(g, [sh, el, hd], d.sleeve || d.coat || d.top, P.lw, INKW, seed + 20 + side);
    if (d.stripes) for (let k = 0; k < d.stripes; k++) {
      const u = 0.78 - k * 0.09, cx = lerp(el[0], hd[0], u), cy = lerp(el[1], hd[1], u);
      const ang = Math.atan2(hd[1] - el[1], hd[0] - el[0]) + Math.PI / 2;
      wline(g, [[cx - Math.cos(ang) * 12, cy - Math.sin(ang) * 12], [cx + Math.cos(ang) * 12, cy + Math.sin(ang) * 12]], 4, C.gold, seed + 30 + k);
    }
    ink(g, wellipse(hd[0], hd[1], P.hand, P.hand, 0.8, seed + 22 + side), d.skin, 4);
    return hd;
  };
  const hl = arm(shL, d.armL, d.elbL, -1), hr = arm(shR, d.armR, d.elbR, 1);

  // ---- neck & head
  ink(g, wrect(-11, hY + R * 0.6, 22, shY - hY - R * 0.55, 0.8, seed + 40), d.skin, 4);
  g.save();
  g.translate(0, hY); g.rotate(d.headTilt); g.translate(0, -hY);
  ink(g, wellipse(-R * 0.98, hY + 4, 9, 12, 0.6, seed + 41), d.skin, 4);
  ink(g, wellipse(R * 0.98, hY + 4, 9, 12, 0.6, seed + 42), d.skin, 4);
  const head = wellipse(0, hY, R, R * 1.02, 1.1, seed + 43, 16);
  ink(g, head, d.skin);
  inkShade(g, head, -9, -7, 0.1);
  drawHair(g, d, R, hY, seed);
  drawFace(g, d, R, hY, seed);
  drawHat(g, d, R, hY, seed);
  g.restore();

  if (d.handL) d.handL(g, hl[0], hl[1]);
  if (d.handR) d.handR(g, hr[0], hr[1]);
  out.head = [0, hY]; out.R = R;
  g.restore();
  return out;
}

function drawHair(g, d, R, hY, seed) {
  const h = d.hair, st = d.hairStyle;
  if (st === 'bald' || d.hat === 'sailor' && st === 'short') {
    if (st !== 'bald') ink(g, wcurve([[-R * 1.02, hY - R * 0.05], [-R * 0.9, hY - R * 0.5], [-R * 0.6, hY - R * 0.4], [-R * 0.7, hY + R * 0.1]], 1, seed + 50), h, 3.5);
    return;
  }
  if (st === 'curly') {
    for (let i = 0; i < 13; i++) {
      const a = Math.PI * (0.92 + i / 12 * 1.16);
      ink(g, wellipse(Math.cos(a) * R * 1.0, hY + Math.sin(a) * R * 1.0 - 4, R * 0.32, R * 0.3, 1.2, seed + 60 + i), h, 3.5);
    }
    return;
  }
  if (st === 'white') { // older William: swept white hair with side tufts
    ink(g, wcurve([[-R * 1.04, hY - R * 0.05], [-R * 1.08, hY - R * 0.55], [-R * 0.6, hY - R * 1.08], [R * 0.1, hY - R * 1.16], [R * 0.75, hY - R * 0.98], [R * 1.08, hY - R * 0.5], [R * 1.04, hY - R * 0.05], [R * 0.82, hY - R * 0.48], [R * 0.2, hY - R * 0.72], [-R * 0.5, hY - R * 0.62], [-R * 0.86, hY - R * 0.4]], 1.4, seed + 51), h);
    for (const sd of [-1, 1]) ink(g, wcurve([[sd * R * 0.92, hY - R * 0.3], [sd * R * 1.22, hY - R * 0.2], [sd * R * 1.18, hY + R * 0.18], [sd * R * 0.96, hY + R * 0.3]], 1.2, seed + 52 + sd), h, 4);
    return;
  }
  const pts = [[-R * 1.03, hY + R * 0.12], [-R * 1.07, hY - R * 0.45], [-R * 0.62, hY - R * 1.07], [0, hY - R * 1.16], [R * 0.62, hY - R * 1.07], [R * 1.07, hY - R * 0.45], [R * 1.03, hY + R * 0.12],
    [R * 0.86, hY - R * 0.34], [R * 0.32, hY - R * 0.56], [-R * 0.18, hY - R * 0.46], [-R * 0.86, hY - R * 0.3]];
  if (st === 'kid') pts.splice(3, 0, [-R * 0.12, hY - R * 1.18], [R * 0.05, hY - R * 1.42], [R * 0.16, hY - R * 1.15]);
  if (st === 'long' || st === 'bun') { pts[0] = [-R * 1.08, hY + R * 0.45]; pts[6] = [R * 1.08, hY + R * 0.45]; }
  ink(g, wcurve(pts, 1.3, seed + 53), h);
  inkShade(g, wcurve(pts, 1.3, seed + 53), -6, -5, 0.12);
}

function drawFace(g, d, R, hY, seed) {
  const ex = R * 0.36, ey = hY + 3, lx = d.look * 4, ly = d.lookY * 3;
  const blink = d.eyes === 'open' && ((d.t + d.seed * 1.37) % 3.9) < 0.12;
  g.lineCap = 'round';
  for (const sd of [-1, 1]) {
    const e = blink ? 'closed' : d.eyes === 'wink' ? (sd > 0 ? 'happy' : 'open') : d.eyes;
    const x = sd * ex + lx, y = ey + ly;
    if (e === 'open' || e === 'sleepy') {
      ink(g, wellipse(x, y, 5.8, 7.8, 0.4, seed + 70 + sd), C.ink, 0);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 1.8, y - 2.6, 1.9, 0, TAU); g.fill();
      if (e === 'sleepy') {
        ink(g, wellipse(x, y - 6, 9, 6.5, 0.3, seed + 72 + sd), d.skin, 0);
        wline(g, [[x - 8, y - 1], [x + 8, y - 1]], 3, C.ink, seed + 74 + sd);
      }
    } else if (e === 'wide') {
      ink(g, wellipse(x, y, 12, 13, 0.6, seed + 70 + sd), '#fff', 3);
      ink(g, wellipse(x + lx * 0.6, y + ly * 0.6, 5, 5.5, 0.3, seed + 76 + sd), C.ink, 0);
    } else if (e === 'happy') {
      wline(g, [[x - 7, y + 2], [x, y - 5], [x + 7, y + 2]], 3.6, C.ink, seed + 70 + sd, true);
    } else { // closed
      wline(g, [[x - 7, y], [x, y + 3], [x + 7, y]], 3.4, C.ink, seed + 70 + sd, true);
    }
    // brows
    const by = ey - 17 - d.brow * 7;
    const inner = d.angry * 6 - d.sad * 6;
    wline(g, [[sd * (ex + 9) + lx * 0.5, by - d.sad * 2], [sd * (ex - 9) + lx * 0.5, by + inner]], 3.6, d.hairStyle === 'white' ? '#9b948a' : C.ink, seed + 78 + sd);
  }
  if (d.glasses) {
    g.strokeStyle = C.ink; g.lineWidth = 3.2;
    for (const sd of [-1, 1]) { g.beginPath(); g.arc(sd * ex, ey, 13, 0, TAU); g.stroke(); }
    g.beginPath(); g.moveTo(-ex + 13, ey); g.quadraticCurveTo(0, ey - 5, ex - 13, ey); g.stroke();
  }
  // nose
  wline(g, [[-2, ey + 9], [4, ey + 17], [-3, ey + 19]], 3, rgb(shade(d.skin, 0.6)), seed + 80, true);
  if (d.blush > 0) alpha(g, d.blush * 0.55, () => {
    for (const sd of [-1, 1]) { g.fillStyle = C.pink; g.beginPath(); g.ellipse(sd * R * 0.6, ey + 17, 10, 6, 0, 0, TAU); g.fill(); }
  });
  if (d.beard) {
    const b = [[-R * 0.99, hY + R * 0.02], [-R * 0.95, hY + R * 0.62], [-R * 0.55, hY + R * 1.22], [0, hY + R * 1.48], [R * 0.55, hY + R * 1.22], [R * 0.95, hY + R * 0.62], [R * 0.99, hY + R * 0.02],
      [R * 0.75, hY + R * 0.42], [R * 0.3, hY + R * 0.42], [0, hY + R * 0.36], [-R * 0.3, hY + R * 0.42], [-R * 0.75, hY + R * 0.42]];
    ink(g, wcurve(b, 1.5, seed + 81), d.beard);
    // beard texture
    g.strokeStyle = rgb(shade(d.beard, 0.8)); g.lineWidth = 2.2;
    for (let i = 0; i < 6; i++) { const x = (i - 2.5) * R * 0.28; g.beginPath(); g.moveTo(x, hY + R * 0.8); g.lineTo(x * 0.9, hY + R * 1.1); g.stroke(); }
  }
  const my = hY + R * (d.beard ? 0.6 : 0.5);
  const m = d.mouth;
  if (m === 'smile') wline(g, [[-13, my - 2], [0, my + 7], [13, my - 2]], 3.8, C.ink, seed + 83, true);
  else if (m === 'grin' || m === 'laugh') {
    const p = new Path2D(); p.moveTo(-17, my - 4); p.quadraticCurveTo(0, my + (m === 'laugh' ? 30 : 24), 17, my - 4); p.closePath();
    ink(g, p, '#7a2e25', 3.5);
    g.save(); g.clip(p); g.fillStyle = '#fff'; g.fillRect(-17, my - 6, 34, 7); g.restore();
  } else if (m === 'o') ink(g, wellipse(0, my + 2, 6.5, 8.5, 0.4, seed + 84), '#7a2e25', 3);
  else if (m === 'scream') ink(g, wellipse(0, my + 6, 12, 17, 0.6, seed + 84), '#7a2e25', 3.5);
  else if (m === 'flat') wline(g, [[-11, my + 1], [11, my + 1]], 3.6, C.ink, seed + 85);
  else if (m === 'frown') wline(g, [[-12, my + 5], [0, my - 3], [12, my + 5]], 3.6, C.ink, seed + 85, true);
  else if (m === 'wavy') wline(g, [[-13, my + 2], [-6, my - 2], [0, my + 2], [6, my - 2], [13, my + 2]], 3.2, C.ink, seed + 85, true);
  else if (m === 'smirk') wline(g, [[-11, my + 2], [4, my + 3], [13, my - 4]], 3.6, C.ink, seed + 85, true);
  if (d.mustache) {
    const p = new Path2D();
    p.moveTo(0, my - 9); p.quadraticCurveTo(-14, my - 14, -23, my - 1); p.quadraticCurveTo(-12, my - 4, 0, my - 4);
    p.quadraticCurveTo(12, my - 4, 23, my - 1); p.quadraticCurveTo(14, my - 14, 0, my - 9); p.closePath();
    ink(g, p, d.mustache, 3);
  }
}

function drawHat(g, d, R, hY, seed) {
  const k = d.hat;
  if (!k || k === 'veil') {
    if (k === 'veil') for (let i = 0; i < 5; i++) ink(g, wellipse((i - 2) * R * 0.32, hY - R * 0.95 + Math.abs(i - 2) * 4, 9, 9, 0.5, seed + 90 + i), [C.white, C.pink, C.white, C.pink, C.white][i], 3);
    return;
  }
  if (k === 'sailor') {
    ink(g, wellipse(0, hY - R * 0.98, R * 1.12, R * 0.3, 1, seed + 91), d.hatCol || C.navyD);
    ink(g, wrect(-R * 0.86, hY - R * 0.95, R * 1.72, R * 0.32, 1, seed + 92), C.ink, 3);
    text(g, 'H.M.S.', 0, hY - R * 0.79, `700 ${R * 0.2}px Montserrat`, C.gold, 'center', 2);
  } else if (k === 'officer') {
    ink(g, wcurve([[-R * 1.18, hY - R * 0.95], [-R * 0.6, hY - R * 1.32], [R * 0.6, hY - R * 1.32], [R * 1.18, hY - R * 0.95], [R * 0.85, hY - R * 0.78], [-R * 0.85, hY - R * 0.78]], 1, seed + 93), d.hatCol || C.white);
    ink(g, wrect(-R * 0.86, hY - R * 0.86, R * 1.72, R * 0.3, 1, seed + 94), C.ink, 3);
    ink(g, wellipse(0, hY - R * 0.8, R * 0.18, R * 0.2, 0.6, seed + 95), C.gold, 2.5);
    ink(g, wcurve([[-R * 0.9, hY - R * 0.56], [0, hY - R * 0.42], [R * 0.9, hY - R * 0.56], [0, hY - R * 0.62]], 0.8, seed + 96), C.ink, 3);
  } else if (k === 'school') {
    ink(g, wcurve([[-R * 1.05, hY - R * 0.45], [-R * 0.85, hY - R * 1.05], [0, hY - R * 1.25], [R * 0.85, hY - R * 1.05], [R * 1.05, hY - R * 0.45], [0, hY - R * 0.55]], 1.1, seed + 97), d.hatCol || C.coral);
    wline(g, [[0, hY - R * 1.24], [0, hY - R * 0.55]], 3, C.gold, seed + 98);
    ink(g, wcurve([[-R * 0.75, hY - R * 0.5], [0, hY - R * 0.32], [R * 0.75, hY - R * 0.5], [0, hY - R * 0.58]], 0.8, seed + 99), d.hatCol || C.coral, 3.5);
  } else if (k === 'mortar') {
    ink(g, wcurve([[-R * 0.85, hY - R * 0.62], [-R * 0.8, hY - R * 1.0], [R * 0.8, hY - R * 1.0], [R * 0.85, hY - R * 0.62]], 0.8, seed + 100), C.ink, 3);
    ink(g, wpoly([[-R * 1.35, hY - R * 1.08], [0, hY - R * 1.38], [R * 1.35, hY - R * 1.08], [0, hY - R * 0.84]], 1, seed + 101), '#2b2b35', 3.5);
    wline(g, [[0, hY - R * 1.1], [R * 0.95, hY - R * 1.05], [R * 1.05, hY - R * 0.6]], 3, C.gold, seed + 102);
    ink(g, wellipse(R * 1.05, hY - R * 0.52, 5, 8, 0.4, seed + 103), C.gold, 2);
  } else if (k === 'crown') {
    const pts = [[-R * 0.8, hY - R * 0.72], [-R * 0.9, hY - R * 1.5], [-R * 0.45, hY - R * 1.1], [0, hY - R * 1.62], [R * 0.45, hY - R * 1.1], [R * 0.9, hY - R * 1.5], [R * 0.8, hY - R * 0.72]];
    ink(g, wpoly(pts, 1, seed + 104), C.gold, 4);
    for (const [x, c] of [[-R * 0.45, C.red], [0, '#3b6fb6'], [R * 0.45, C.red]]) ink(g, wellipse(x, hY - R * 0.9, 6, 6, 0.4, seed + 105 + x), c, 2.5);
  } else if (k === 'bowler') {
    ink(g, wellipse(0, hY - R * 0.72, R * 1.3, R * 0.2, 1, seed + 106), C.ink, 3);
    ink(g, wcurve([[-R * 0.85, hY - R * 0.72], [-R * 0.8, hY - R * 1.35], [0, hY - R * 1.6], [R * 0.8, hY - R * 1.35], [R * 0.85, hY - R * 0.72]], 1, seed + 107), '#3a3436', 4);
  }
}

// small helpers for common hand props
function propBook(g, x, y, s = 1, colr = C.red, r = 0) {
  at(g, x, y, s, r, () => {
    const p = wround(-34, -24, 68, 48, 6, 1, 301);
    ink(g, p, colr);
    ink(g, wrect(-28, -18, 56, 36, 0.8, 302), null, 0);
    wline(g, [[-34, -24], [-34, 24]], 9, rgb(shade(colr, 0.7)), 303);
    ink(g, wrect(-12, -8, 30, 10, 0.6, 304), C.gold, 2.5);
  });
}
function propFlask(g, x, y, s = 1, liquid = '#6cc4a1', t = 0) {
  at(g, x, y, s, 0, () => {
    const p = wpoly([[-9, -52], [9, -52], [9, -24], [30, 18], [-30, 18], [-9, -24]], 1, 311);
    ink(g, p, '#e8f3f2');
    g.save(); g.clip(p);
    g.fillStyle = liquid; g.fillRect(-40, -4 + Math.sin(t * 6) * 2, 80, 40);
    g.restore();
    ink(g, p, null, 4.5);
    for (let i = 0; i < 3; i++) {
      const u = ((t * 0.9 + i / 3) % 1);
      alpha(g, 1 - u, () => ink(g, wellipse(Math.sin(i * 2 + t * 3) * 8, -56 - u * 60, 5 + u * 5, 5 + u * 5, 0.5, 312 + i), liquid, 3));
    }
  });
}
function propNotebook(g, x, y, s = 1, t = 0, writing = 0) {
  at(g, x, y, s, -0.15, () => {
    ink(g, wrect(-30, -40, 60, 78, 1, 321), C.cream);
    for (let i = 0; i < 5; i++) {
      const w = clamp(writing * 5 - i) * 40;
      if (w > 1) wline(g, [[-20, -26 + i * 13], [-20 + w * 0.5, -28 + i * 13], [-20 + w, -26 + i * 13]], 2.5, C.navy, 322 + i, true);
    }
    // pencil
    const px = -20 + ((writing * 5) % 1) * 40, py = -26 + Math.min(4, Math.floor(writing * 5)) * 13;
    at(g, px + 10, py - 14, 1, 0.6, () => { ink(g, wrect(-4, -30, 8, 30, 0.5, 327), C.mustard, 3); ink(g, wpoly([[-4, 0], [4, 0], [0, 9]], 0.4, 328), C.ink, 2); });
  });
}
function propBottle(g, x, y, s = 1, colr = '#4e7a3c', r = 0) {
  at(g, x, y, s, r, () => {
    const p = wpoly([[-6, -70], [6, -70], [7, -46], [16, -30], [16, 0], [-16, 0], [-16, -30], [-7, -46]], 0.9, 331);
    ink(g, p, colr);
    ink(g, wrect(-13, -26, 26, 18, 0.6, 332), C.cream, 3);
    alpha(g, 0.4, () => wline(g, [[-10, -36], [-10, -6]], 4, '#fff', 333));
  });
}
