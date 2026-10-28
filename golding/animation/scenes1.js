'use strict';
// Scenes 1-4: title, birth (map), family, the house by the churchyard.

// The grown-up and the boy William share these looks across scenes.
const WILL = {
  kid: { kid: true, hair: '#6b4428', hairStyle: 'kid', top: '#3f7f7a', bottom: '#4a3d33', shorts: true, socks: '#d8cdb6', seed: 2 },
  young: { hair: '#6b4428', hairStyle: 'short', top: '#36404f', bottom: '#2f3540', collar: C.white, tie: C.red, seed: 3 },
  old: { hair: '#f1ede4', hairStyle: 'white', beard: '#f4f0e8', top: '#4a4f5c', bottom: '#33363f', collar: C.white, tie: '#6f4a8e', seed: 4 }
};
const ALEC = { hair: '#4f3424', hairStyle: 'short', glasses: true, mustache: '#4f3424', top: '#e9e3d4', coat: '#8a6a45', bottom: '#4a3a2c', tie: C.teal, seed: 7 };
const MILDRED = { hair: '#7a3e24', hairStyle: 'bun', top: '#5d4c7a', skirt: 'long', skin: '#f4cdab', sash: true, seed: 8 };

// draw a shape set into its own layer so it can fade as one flat image
// (dim > 0 greys the group out toward the paper instead of making it see-through)
function withLayer(g, name, a, fn, dim = 0, dimCol = '#e9dcbc') {
  if (a <= 0.003) return;
  const L = layer(name);
  L.g.setTransform(g.getTransform());
  fn(L.g);
  if (dim > 0.003) {
    L.g.setTransform(1, 0, 0, 1, 0, 0);
    L.g.globalCompositeOperation = 'source-atop';
    L.g.fillStyle = rgb(dimCol, 0.55 * dim); L.g.fillRect(0, 0, W, H);
    L.g.globalCompositeOperation = 'source-over';
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha *= clamp(a); g.drawImage(L.c, 0, 0); g.restore();
}

function waves(g, y0, y1, colr, t, seed = 1, gap = 46, amp = 9, speed = 30) {
  g.strokeStyle = colr; g.lineWidth = 4; g.lineCap = 'round';
  let row = 0;
  for (let y = y0; y < y1; y += gap, row++) {
    const off = ((t * speed * (row % 2 ? 1 : -0.7)) % 140 + 140) % 140;
    for (let x = -140 + off + (row % 2) * 70; x < W + 140; x += 140) {
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 18, y - amp, x + 36, y); g.quadraticCurveTo(x + 54, y + amp, x + 72, y); g.stroke();
    }
  }
}
function seagull(g, x, y, s, t, seed = 0) {
  const f = Math.sin(t * 7 + seed) * 0.5;
  wline(g, [[x - 26 * s, y - 8 * s * (1 + f)], [x - 10 * s, y - 2 * s], [x, y + 6 * s], [x + 10 * s, y - 2 * s], [x + 26 * s, y - 8 * s * (1 + f)]], 4, C.ink, 600 + seed, true);
}
function cloud(g, x, y, s, colr = C.white, seed = 1) {
  at(g, x, y, s, 0, () => {
    const p = wcurve([[-90, 20], [-80, -10], [-45, -35], [-5, -50], [35, -38], [70, -15], [95, 15], [60, 30], [-60, 30]], 1.5, seed);
    ink(g, p, colr, 4);
  });
}

// ------------------------------------------------------------------ title
SCENES.title = (g, lt, sc) => {
  const cu = sc.cues;
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
  drawGlow(g, 540, 700, 700, '#fff3d6', 0.9);

  // medallion portrait
  const s = pop(cu.ink, lt, 0.7);
  at(g, 540, 690, s, 0, () => {
    g.fillStyle = 'rgba(42,33,29,0.22)'; g.beginPath(); g.arc(12, 16, 330, 0, TAU); g.fill();
    ink(g, wellipse(0, 0, 330, 330, 2, 11, 24), C.mustard, 6);
    const inner = wellipse(0, 0, 286, 286, 1.6, 12, 24);
    ink(g, inner, C.teal, 5);
    g.save(); g.clip(inner);
    person(g, Object.assign({}, WILL.old, { shadow: false, x: 0, y: 590, s: 1.95, t: lt, armL: 0.1, armR: 0.1, mouth: 'smile' }));
    g.restore();
  });
  drawWordmark(g, 1170, ss(cu.name, cu.name + 1.0, lt), ss(cu.years, cu.years + 0.6, lt), ss(cu.tag, cu.tag + 0.6, lt));
};

function drawIcon(g, k, t) {
  if (k === 'book') {
    ink(g, wpoly([[-60, -30], [0, -18], [60, -30], [60, 34], [0, 46], [-60, 34]], 1.2, 31), C.cream);
    wline(g, [[0, -18], [0, 46]], 4, C.ink, 32);
    for (let i = 0; i < 3; i++) { wline(g, [[-48, -10 + i * 14], [-12, -2 + i * 14]], 3, C.grey, 33 + i); wline(g, [[12, -2 + i * 14], [48, -10 + i * 14]], 3, C.grey, 36 + i); }
  } else if (k === 'ship') {
    ink(g, wpoly([[-70, 0], [70, 0], [50, 30], [-55, 30]], 1.2, 41), C.navy);
    ink(g, wrect(-30, -28, 50, 28, 1, 42), C.stone);
    ink(g, wrect(-8, -52, 14, 24, 0.8, 43), C.grey);
    alpha(g, 0.6, () => { for (let i = 0; i < 3; i++) ink(g, wellipse(4 + i * 14, -64 - i * 16 - (t * 20 % 16), 8 + i * 3, 7 + i * 3, 0.8, 44 + i), C.white, 3); });
  } else if (k === 'quill') {
    at(g, 0, 0, 1, -0.6, () => {
      ink(g, wcurve([[0, 70], [-14, 20], [-22, -30], [-8, -80], [6, -40], [10, 10]], 1.2, 51), C.white);
      wline(g, [[0, 70], [-6, -50]], 3, C.grey, 52);
    });
    ink(g, wellipse(30, 60, 26, 14, 1, 53), C.ink, 0);
  } else if (k === 'star') {
    ink(g, starPath(0, 0, 46, 20), C.gold, 5);
  }
}

// ------------------------------------------------------------------ birth
const GB = [[-5.7, 50.07], [-5.2, 49.96], [-4.6, 50.32], [-4.1, 50.35], [-3.64, 50.22], [-3.4, 50.6], [-2.45, 50.56], [-1.6, 50.72], [-1.0, 50.78], [-0.1, 50.82], [0.9, 50.92], [1.35, 51.12],
  [1.45, 51.38], [0.7, 51.47], [1.0, 51.62], [1.25, 51.85], [1.6, 52.1], [1.75, 52.48], [1.6, 52.82], [1.3, 52.95], [0.55, 52.95], [0.25, 52.8], [0.35, 53.15], [0.15, 53.45], [0.1, 53.6],
  [-0.2, 54.0], [-0.08, 54.12], [-0.6, 54.49], [-1.2, 54.7], [-1.42, 55.02], [-1.6, 55.5], [-2.0, 55.77], [-2.6, 56.0], [-3.2, 56.05], [-2.6, 56.28], [-2.85, 56.45], [-2.4, 56.75], [-2.08, 57.15],
  [-1.82, 57.6], [-2.6, 57.7], [-3.4, 57.72], [-4.2, 57.5], [-3.8, 57.85], [-3.6, 58.1], [-3.1, 58.4], [-3.03, 58.64], [-3.6, 58.66], [-4.4, 58.58], [-5.0, 58.62], [-5.2, 58.25], [-5.6, 57.9],
  [-5.7, 57.4], [-5.65, 57.0], [-6.0, 56.65], [-5.6, 56.4], [-5.5, 56.0], [-5.75, 55.35], [-5.4, 55.7], [-4.9, 55.75], [-4.65, 55.45], [-5.05, 55.05], [-4.86, 54.64], [-4.4, 54.85],
  [-3.6, 54.95], [-3.45, 54.6], [-3.15, 54.15], [-2.95, 53.75], [-3.05, 53.4], [-3.4, 53.35], [-4.0, 53.3], [-4.6, 53.3], [-4.4, 53.05], [-4.75, 52.8], [-4.1, 52.6], [-4.05, 52.3],
  [-4.6, 52.1], [-5.3, 51.88], [-5.05, 51.62], [-4.3, 51.66], [-3.9, 51.55], [-3.2, 51.42], [-2.75, 51.55], [-3.0, 51.25], [-3.8, 51.22], [-4.25, 51.18], [-4.53, 51.0], [-4.65, 50.75],
  [-4.85, 50.55], [-5.05, 50.42], [-5.4, 50.2]];
const IRL = [[-6.0, 52.2], [-6.05, 52.8], [-6.2, 53.35], [-6.1, 53.9], [-5.6, 54.3], [-5.65, 54.7], [-6.05, 55.2], [-7.2, 55.3], [-8.3, 55.15], [-8.6, 54.65], [-10.0, 54.25], [-9.9, 53.45],
  [-9.4, 53.1], [-9.9, 52.3], [-10.4, 51.9], [-9.6, 51.5], [-8.3, 51.75], [-7.0, 52.1]];
const PLACES = { newquay: [-5.08, 50.415], marlborough: [-1.73, 51.42], perran: [-5.12, 50.21], oxford: [-1.26, 51.75], salisbury: [-1.8, 51.07] };
const mp = (lon, lat, k = 96) => [(lon + 2.6) * 0.588 * k, -(lat - 54.3) * k];

function drawMap(g, cx, cy, z, focus, t, opts = {}) {
  g.save();
  g.translate(cx, cy); g.scale(z, z); g.translate(-focus[0], -focus[1]);
  const lw = 4.5 / z;
  ink(g, wpoly(IRL.map(p => mp(...p)), 1.2 / z, 61), '#b9c79f', lw);
  const gb = wpoly(GB.map(p => mp(...p)), 1.0 / z, 62);
  g.save(); g.strokeStyle = rgb(C.white, 0.45); g.lineWidth = 22 / z; g.lineJoin = 'round'; g.stroke(gb); g.restore();
  ink(g, gb, C.sage, lw);
  inkShade(g, gb, -10 / z, -10 / z, 0.12);
  // a few hills / trees to make it feel like a storybook map
  const marks = [[-2.2, 52.4], [-3.6, 52.0], [-1.6, 53.6], [-4.2, 56.8], [-3.2, 57.2], [-1.0, 52.1], [-2.6, 54.6], [-4.6, 50.55]];
  marks.forEach(([lo, la], i) => {
    const [x, y] = mp(lo, la), k = 1 / Math.pow(z, 0.75);
    ink(g, wpoly([[x - 14 * k, y + 7 * k], [x, y - 12 * k], [x + 14 * k, y + 7 * k]], 0.8 / z, 70 + i), C.grassD, 3 / z);
  });
  if (opts.labels > 0) alpha(g, opts.labels, () => {
    for (const [nm, lo, la] of [['İNGİLTERE', -1.3, 52.6], ['GALLER', -3.6, 52.25], ['İSKOÇYA', -4.0, 57.0], ['İRLANDA', -8.0, 53.2]]) {
      const [x, y] = mp(lo, la);
      text(g, nm, x, y, `700 ${22 / z}px Montserrat`, rgb(C.ink, 0.7), 'center', 4 / z);
    }
  });
  if (opts.after) opts.after(g, z);
  g.restore();
}

function pin(g, x, y, s, colr = C.red) {
  at(g, x, y, s, 0, () => {
    g.fillStyle = 'rgba(42,33,29,0.25)'; g.beginPath(); g.ellipse(4, 2, 16, 6, 0, 0, TAU); g.fill();
    const p = new Path2D(); p.moveTo(0, 0); p.bezierCurveTo(-34, -46, -32, -92, 0, -92); p.bezierCurveTo(32, -92, 34, -46, 0, 0); p.closePath();
    ink(g, p, colr, 5);
    ink(g, wellipse(0, -62, 13, 13, 0.6, 81), C.white, 4);
  });
}
function babyBundle(g, x, y, s, t, cry = 0) {
  at(g, x, y, s, Math.sin(t * 3) * 0.06, () => {
    ink(g, wcurve([[-46, 30], [-52, -10], [-30, -46], [10, -50], [44, -24], [50, 20], [20, 44], [-20, 44]], 1.2, 91), '#f2d7e0');
    ink(g, wellipse(-2, -18, 26, 25, 0.8, 92), C.skin, 4);
    if (cry > 0.5) { ink(g, wellipse(-2, -8, 7, 8, 0.4, 93), '#7a2e25', 3); wline(g, [[-14, -22], [-8, -20]], 3, C.ink, 94); wline(g, [[4, -20], [10, -22]], 3, C.ink, 95); }
    else { wline(g, [[-14, -22], [-8, -20], [-2, -22]], 3, C.ink, 94, true); wline(g, [[4, -22], [10, -20], [16, -22]], 3, C.ink, 95, true); wline(g, [[-6, -8], [-1, -5], [4, -8]], 3, C.ink, 96, true); }
    wline(g, [[-30, 10], [30, 0]], 4, C.pink, 97);
  });
}

SCENES.birth = (g, lt, sc) => {
  const cu = sc.cues;
  g.fillStyle = C.sea; g.fillRect(0, 0, W, H);
  waves(g, 300, 1900, rgb(C.white, 0.2), lt, 3, 64, 8, 14);
  const nq = mp(...PLACES.newquay), mb = mp(...PLACES.marlborough);
  // camera: whole island -> Newquay -> pull back to show the move to Marlborough
  const e1 = easeInOut(ss(cu.zoom, cu.pin - 0.3, lt)), e2 = easeInOut(ss(cu.move, cu.move + 1.6, lt));
  const mid = [(nq[0] + mb[0]) / 2, (nq[1] + mb[1]) / 2 - 20];
  const z = lerp(lerp(1.0, 3.2, e1), 2.2, e2);
  const f0 = [lerp(-90, nq[0] + 20, e1), lerp(-20, nq[1] - 60, e1)];
  const f = [lerp(f0[0], mid[0], e2), lerp(f0[1], mid[1] - 30, e2)];
  drawMap(g, 540, 760, z, f, lt);
  const S_ = p => [540 + (p[0] - f[0]) * z, 760 + (p[1] - f[1]) * z];
  const nqS = S_(nq), mbS = S_(mb);
  // the route, drawn as a dotted line
  const route = ss(cu.move + 0.8, cu.house, lt);
  if (route > 0) {
    g.strokeStyle = C.red; g.lineWidth = 6; g.lineCap = 'round'; g.setLineDash([2, 18]);
    const cx = (nqS[0] + mbS[0]) / 2, cy = Math.min(nqS[1], mbS[1]) - 120;
    g.beginPath();
    for (let i = 0; i <= 40 * route; i++) {
      const u = i / 40, x = (1 - u) * (1 - u) * nqS[0] + 2 * u * (1 - u) * cx + u * u * mbS[0], y = (1 - u) * (1 - u) * nqS[1] + 2 * u * (1 - u) * cy + u * u * mbS[1];
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke(); g.setLineDash([]);
  }
  if (lt > cu.pin) pin(g, nqS[0], nqS[1] - (1 - bounce(cu.pin, lt, 0.8)) * 500, 1.0);
  const bp = pop(cu.baby, lt, 0.5) * (1 - ss(cu.move, cu.move + 0.5, lt));
  if (bp > 0) babyBundle(g, nqS[0] + 10, nqS[1] + 110, 1.4 * bp, 0, 0);
  // a little house appears at Marlborough
  const hp = pop(cu.house, lt, 0.5);
  if (hp > 0) at(g, mbS[0], mbS[1], hp, 0, () => {
    g.fillStyle = 'rgba(42,33,29,0.25)'; g.beginPath(); g.ellipse(4, 4, 46, 10, 0, 0, TAU); g.fill();
    ink(g, wrect(-36, -56, 72, 56, 0.8, 115), C.cream, 4.5);
    ink(g, wpoly([[-46, -52], [0, -92], [46, -52]], 0.8, 116), C.red, 4.5);
    ink(g, wrect(-10, -30, 20, 30, 0.5, 117), C.brown, 3.5);
  });
};

// ------------------------------------------------------------------ family: one page per person
function familyRoom(g, wall, glowX = 540) {
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  drawGlow(g, glowX, 760, 520, '#fff6dc', 0.35);
  ink(g, wrect(-10, 1180, W + 20, 800, 0, 123), rgb(shade(wall, 0.72)), 0);
  wline(g, [[0, 1180], [W, 1180]], 5, C.ink, 124);
}
// the whole family on one page; whoever the caption is about stands out
SCENES.family = (g, lt, sc) => {
  const cu = sc.cues;
  const wall = '#e9dcc4';
  familyRoom(g, wall);
  const fA = win(cu.alec - 0.2, cu.alec + 0.3, cu.mildred - 0.3, cu.mildred, lt);
  const fM = win(cu.mildred - 0.3, cu.mildred, cu.jose - 0.3, cu.jose, lt);
  const fJ = ss(cu.jose - 0.3, cu.jose, lt);
  const pA = pop(cu.alec, lt, 0.55), pM = pop(cu.mildred, lt, 0.55), pJ = pop(cu.jose, lt, 0.55);
  if (pA > 0) withLayer(g, 'fA', 1, L => {
    for (let i = 0; i < 3; i++) {
      const u = ((lt - cu.alec) * 0.22 + i / 3) % 1;
      alpha(L, fA * Math.sin(u * Math.PI), () => at(L, 250 + (i - 1) * 100, 500 - u * 130, 0.9, 0, () => drawSci(L, i, lt)));
    }
    at(L, 230, 1190, 1, 0, () => {
      L.scale(1, pA);
      person(L, Object.assign({}, ALEC, { s: 1.55, t: lt, armL: 0.12, armR: 1.9, elbR: 0.9, mouth: 'smile', brow: 0.4 * fA, look: 0.4,
        handR: (gg, x, y) => propFlask(gg, x + 6, y - 6, 0.9, '#7ad1b0', lt) }));
    });
  }, 1 - fA, wall);
  if (pM > 0) withLayer(g, 'fM', 1, L => {
    at(L, 540, 1190, 1, 0, () => {
      L.scale(1, pM);
      person(L, Object.assign({}, MILDRED, { s: 1.55, t: lt, armR: 2.6, elbR: 0.4, armL: 0.2, mouth: fM > 0.5 ? 'grin' : 'smile', brow: 0.5 * fM,
        handR: (gg, x, y) => placard(gg, x, y, lt, 0) }));
    });
  }, 1 - fM, wall);
  if (pJ > 0) withLayer(g, 'fJ', 1, L => {
    const look = ss(cu.baby + 0.4, cu.baby + 1.0, lt);
    at(L, 870, 1190, 1, 0, () => {
      L.scale(1, pJ);
      person(L, { kid: true, hair: '#3e2a1c', hairStyle: 'kid', top: C.coral, bottom: C.navy, shorts: true, hat: 'school', hatCol: C.navy, seed: 9,
        s: 1.6, t: lt, armL: lerp(0.15, 1.1, look), armR: 0.15, mouth: 'grin', look: -look });
    });
    // baby William beside his big brother
    const pb = pop(cu.baby, lt, 0.6);
    if (pb > 0) at(L, 700, 1192, pb * 0.95, 0, () => {
      L.fillStyle = 'rgba(42,33,29,0.18)'; L.beginPath(); L.ellipse(0, 4, 90, 10, 0, 0, TAU); L.fill();
      ink(L, wpoly([[-80, -70], [80, -70], [64, 0], [-64, 0]], 1.2, 131), '#c99a5b');
      for (let i = 0; i < 5; i++) wline(L, [[-70 + i * 35, -66], [-58 + i * 30, -4]], 3, rgb(C.ink, 0.45), 132 + i);
      babyBundle(L, 0, -88, 1.1, 0, 0);
    });
  }, 1 - fJ, wall);
};

function drawSci(g, i, t) {
  if (i === 0) { // atom
    for (let k = 0; k < 3; k++) { g.save(); g.rotate(k * Math.PI / 3); g.strokeStyle = C.teal; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 40, 14, 0, 0, TAU); g.stroke(); g.restore(); }
    ink(g, wellipse(0, 0, 8, 8, 0.4, 141), C.coral, 3);
  } else if (i === 1) { // gear
    const p = new Path2D();
    for (let k = 0; k < 16; k++) { const r = k % 2 ? 26 : 34, a = k / 16 * TAU; k ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(r, 0); }
    p.closePath(); ink(g, p, C.mustard, 4); ink(g, wellipse(0, 0, 9, 9, 0.4, 142), '#e9dcbc', 3);
  } else { // magnifier
    ink(g, wellipse(0, 0, 24, 24, 0.6, 143), rgb(C.sky, 0.8), 5);
    limb(g, [[17, 17], [40, 40]], C.brown, 8, 4, 144);
  }
}
function placard(g, x, y, t, wave) {
  at(g, x, y, 1, wave * 0.6, () => {
    limb(g, [[0, 30], [0, -110]], C.wood, 8, 4, 151);
    ink(g, wrect(-100, -240, 200, 130, 1.2, 152), C.white, 5);
    g.fillStyle = C.purple; g.fillRect(-96, -236, 192, 16);
    g.fillStyle = C.green; g.fillRect(-96, -130, 192, 16);
    // a ballot box with a vote going in
    ink(g, wrect(-34, -200, 68, 52, 0.6, 153), C.cream, 4);
    wline(g, [[-16, -200], [16, -200]], 6, C.ink, 154);
    ink(g, wrect(-12, -236, 24, 30, 0.4, 155), C.white, 3);
    wline(g, [[-6, -222], [-1, -215], [8, -230]], 3.5, C.red, 156);
  });
}

// ------------------------------------------------------------------ house by the churchyard
function gravestone(g, x, y, s, r, kind, seed) {
  at(g, x, y, s, r, () => {
    if (kind === 0) {
      const p = wcurve([[-34, 0], [-34, -70], [-24, -96], [0, -104], [24, -96], [34, -70], [34, 0]], 1.2, seed);
      ink(g, p, '#9aa0a6'); inkShade(g, p, -8, -6, 0.2);
      wline(g, [[-12, -62], [12, -62]], 4, rgb(C.ink, 0.6), seed + 1); wline(g, [[0, -76], [0, -44]], 4, rgb(C.ink, 0.6), seed + 2);
    } else {
      const p = wpoly([[-8, 0], [-8, -66], [-30, -66], [-30, -82], [-8, -82], [-8, -106], [8, -106], [8, -82], [30, -82], [30, -66], [8, -66], [8, 0]], 1, seed);
      ink(g, p, '#8f969c'); inkShade(g, p, -6, -6, 0.2);
    }
  });
}
SCENES.house = (g, lt, sc) => {
  const cu = sc.cues;
  const pan = easeInOut(ss(cu.cellar - 0.6, cu.cellar + 0.7, lt)) * 640;
  g.save(); g.translate(0, -pan);
  // night sky
  const sk = g.createLinearGradient(0, 0, 0, 1150);
  sk.addColorStop(0, '#141c33'); sk.addColorStop(1, '#3a4d74');
  g.fillStyle = sk; g.fillRect(0, -100, W, 1260);
  const rnd = mulberry32(5);
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W, y = rnd() * 900, tw = 0.5 + 0.5 * Math.sin(lt * 3 + i);
    sparkle(g, x, y, 3 + rnd() * 6 * tw, 0.5 + 0.5 * tw, '#fff3c4');
  }
  drawGlow(g, 840, 430, 260, '#fff2c0', 0.5);
  ink(g, wellipse(840, 430, 86, 86, 1.2, 160), '#fbf0c8', 5);
  ink(g, wellipse(812, 410, 14, 12, 0.6, 161), '#e8dca8', 3); ink(g, wellipse(862, 458, 10, 9, 0.5, 162), '#e8dca8', 3);
  // church
  const ch = wpoly([[60, 1150], [60, 760], [200, 640], [340, 760], [340, 1150]], 1.4, 163);
  ink(g, ch, '#5b6378'); inkShade(g, ch, -12, -8, 0.2);
  const sp = wpoly([[150, 760], [150, 560], [200, 360], [250, 560], [250, 760]], 1.2, 164);
  ink(g, sp, '#525a6e');
  wline(g, [[200, 360], [200, 300]], 5, C.ink, 165); wline(g, [[180, 322], [220, 322]], 5, C.ink, 166);
  const wa = 0.85;
  ink(g, wcurve([[170, 980], [170, 880], [200, 840], [230, 880], [230, 980]], 1, 167), rgb('#f6c55e', wa), 4);
  // graveyard, with headstones leaning on the garden wall
  ink(g, wrect(-10, 1140, W + 20, 30, 1, 187), '#2f3f33', 0);
  const stones = [[70, 1160, 0.85, -0.08, 0], [180, 1172, 1.0, 0.06, 1], [290, 1158, 0.8, -0.14, 0], [372, 1164, 0.8, 0.34, 0], [418, 1160, 0.7, 0.42, 1]];
  stones.forEach(([x, y, s, r, k], i) => gravestone(g, x, y, s, r, k, 190 + i * 5));
  const wall = wpoly([[436, 1150], [436, 1000], [482, 1000], [482, 1150]], 1.2, 196);
  ink(g, wall, '#9a8f86'); inkShade(g, wall, -8, -6, 0.2);
  for (let y = 1030; y < 1150; y += 30) wline(g, [[436, y], [482, y]], 2.5, rgb(C.ink, 0.4), 197 + y);
  ink(g, wrect(428, 990, 62, 16, 0.8, 198), '#aaa096', 4);
  // the garden lawn he would not step on
  ink(g, wrect(482, 1128, 210, 24, 1, 199), '#3f5a3c', 4);
  // chestnut tree in the garden, owl on top
  limb(g, [[570, 1140], [575, 920], [545, 790], [500, 700]], '#3d3330', 26, 5, 168);
  limb(g, [[573, 930], [640, 870], [690, 850]], '#3d3330', 16, 5, 169);
  limb(g, [[550, 800], [610, 730]], '#3d3330', 12, 5, 170);
  for (const [lx, ly, i] of [[505, 690, 0], [615, 722, 1], [690, 845, 2], [470, 735, 3]]) ink(g, wellipse(lx, ly, 34, 24, 1.5, 165 + i, 10, i), '#4b5f3b', 4);
  const ob = pop(cu.owl, lt, 0.5);
  if (ob > 0) at(g, 520, 700, ob, 0, () => {
    ink(g, wellipse(0, -34, 30, 38, 1, 171), '#8a6a4a');
    ink(g, wpoly([[-24, -64], [-16, -84], [-6, -64]], 0.6, 172), '#8a6a4a', 4); ink(g, wpoly([[24, -64], [16, -84], [6, -64]], 0.6, 173), '#8a6a4a', 4);
    const bl = ((lt * 0.8) % 2.6) < 0.15;
    for (const sd of [-1, 1]) {
      ink(g, wellipse(sd * 12, -44, 11, 11, 0.4, 174 + sd), '#ffd55a', 3);
      if (!bl) ink(g, wellipse(sd * 12, -44, 4.5, 6, 0.2, 176 + sd), C.ink, 0); else wline(g, [[sd * 12 - 9, -44], [sd * 12 + 9, -44]], 3, C.ink, 178);
    }
    ink(g, wpoly([[-5, -34], [5, -34], [0, -24]], 0.3, 179), C.mustard, 2.5);
  });
  // the house on The Green
  const hs = wpoly([[690, 1150], [690, 700], [1010, 700], [1010, 1150]], 1.4, 180);
  ink(g, hs, '#d9c7a3'); inkShade(g, hs, -14, -8, 0.18);
  ink(g, wpoly([[662, 712], [850, 540], [1038, 712]], 1.4, 181), '#7b4a3a');
  // roof tiles
  for (let k = 0; k < 5; k++) wline(g, [[700 + k * 34, 700 - k * 31], [1000 - k * 34, 700 - k * 31]], 2.5, rgb(C.ink, 0.25), 189 + k);
  ink(g, wrect(940, 560, 42, 100, 1, 182), '#8f5a45');
  for (const [wx, wy] of [[725, 760], [905, 760], [725, 940], [905, 940]]) {
    ink(g, wrect(wx, wy, 76, 100, 1, 183 + wx + wy), rgb('#f6c55e', 0.9), 5);
    wline(g, [[wx + 38, wy], [wx + 38, wy + 100]], 4, C.ink, 184 + wx); wline(g, [[wx, wy + 50], [wx + 76, wy + 50]], 4, C.ink, 185 + wy);
  }
  ink(g, wrect(818, 1040, 64, 110, 1, 186), '#6a4630');
  // little William watching the graves from the upstairs window
  if (lt < cu.cellar - 0.3) {
    const peek = ss(0.8, 1.6, lt);
    g.save(); g.beginPath(); g.rect(725, 760, 76, 100); g.clip();
    person(g, Object.assign({}, WILL.kid, { x: 763, y: 1060 - peek * 54, s: 0.55, t: lt, eyes: lt > 2.6 ? 'wide' : 'open', mouth: lt > 2.6 ? 'o' : 'flat', look: -1, shadow: false }));
    g.restore();
  }
  // drifting fog
  for (let i = 0; i < 4; i++) alpha(g, 0.35, () => cloud(g, ((i * 330 + lt * 22) % 1400) - 200, 1130 + (i % 2) * 20, 1.4, '#c9d3e6', 200 + i));
  // underground cross-section
  ink(g, wrect(-10, 1170, W + 20, 1500, 1.5, 210), '#5a3f2e');
  const r2 = mulberry32(9);
  for (let i = 0; i < 26; i++) ink(g, wellipse(r2() * W, 1200 + r2() * 650, 10 + r2() * 14, 7 + r2() * 9, 0.8, 211 + i), '#6d5140', 3);
  // the cellar
  const cel = wrect(560, 1230, 470, 540, 1.4, 240);
  ink(g, cel, '#2b2433');
  g.save(); g.clip(cel);
  for (let y = 1250; y < 1780; y += 50) for (let x = 560 + ((y / 50) % 2) * 40; x < 1040; x += 80) ink(g, wrect(x, y, 76, 46, 1, 241 + x + y), '#3a3142', 2.5);
  // stairs from the trapdoor at top-left
  for (let k = 0; k < 7; k++) ink(g, wrect(570 + k * 44, 1260 + k * 60, 54, 60, 0.8, 250 + k), '#6b5040', 3.5);
  ink(g, wellipse(930, 1700, 56, 70, 1.2, 258), '#5a4232'); ink(g, wellipse(840, 1720, 46, 54, 1, 259), '#5a4232');
  wline(g, [[1030, 1240], [960, 1300], [1030, 1340]], 2, rgb('#ddd', 0.6), 260); wline(g, [[1000, 1240], [990, 1290]], 2, rgb('#ddd', 0.6), 261);
  // glowing eyes in the dark corner
  const eA = ss(cu.eyes, cu.eyes + 0.4, lt) * (1 - ss(cu.jump + 1.2, cu.jump + 1.8, lt));
  // darkness with a candle-light hole
  const cx = lerp(640, 620, ss(cu.jump, cu.jump + 0.8, lt)), cy = lerp(1330, 1180, ss(cu.jump + 0.2, cu.jump + 1.2, lt));
  const D = layer('dark');
  D.g.setTransform(g.getTransform());
  D.g.fillStyle = 'rgba(8,6,14,0.82)'; D.g.fillRect(540, 1220, 520, 580);
  D.g.globalCompositeOperation = 'destination-out';
  const fl = 1 + 0.06 * Math.sin(lt * 23) + 0.04 * Math.sin(lt * 37);
  const hg = D.g.createRadialGradient(cx, cy - 40, 10, cx, cy - 40, 260 * fl);
  hg.addColorStop(0, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
  D.g.fillStyle = hg; D.g.fillRect(cx - 300, cy - 340, 600, 600);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(D.c, 0, 0); g.restore();
  if (eA > 0) for (const [ex, ey, s] of [[930, 1560, 1], [985, 1470, 0.7]]) {
    const bl = ((lt + ex) % 2.2) < 0.12;
    for (const sd of [-1, 1]) {
      drawGlow(g, ex + sd * 20 * s, ey, 26 * s, '#ffd84a', eA * 0.8);
      if (!bl) alpha(g, eA, () => ink(g, wellipse(ex + sd * 20 * s, ey, 11 * s, 7 * s, 0.3, 270 + sd), '#ffe46a', 0));
    }
  }
  g.restore();
  ink(g, cel, null, 6);
  // William on the stairs with a candle; jumps and runs up
  const jmp = lt - cu.jump;
  const hop = jmp > 0 && jmp < 0.6 ? Math.sin(jmp / 0.6 * Math.PI) * 80 : 0;
  const run = ss(cu.jump + 0.4, cu.jump + 1.6, lt);
  const shiver = lt > cu.cellar && lt < cu.jump ? Math.sin(lt * 40) * 2.5 : 0;
  const scared = lt > cu.eyes + 0.3;
  if (lt > cu.cellar - 0.2) person(g, Object.assign({}, WILL.kid, { x: lerp(650, 590, run) + shiver, y: lerp(1385, 1230, run) - hop, s: 0.95, t: lt,
    top: '#c7d9e6', bottom: '#c7d9e6', shorts: false, eyes: scared ? 'wide' : 'open', mouth: lt > cu.jump ? 'scream' : scared ? 'wavy' : 'flat',
    brow: scared ? 1 : 0.3, look: 0.9, armL: 0.3, armR: lt > cu.jump ? 2.6 : 1.2, elbR: lt > cu.jump ? 0 : 1.1, squash: jmp > 0 && jmp < 0.15 ? 0.9 : 1,
    handR: (gg, x, y) => candle(gg, x, y, lt) }));
  if (lt > cu.jump && lt < cu.jump + 1.2) at(g, 700, 1080 - hop, pop(cu.jump, lt, 0.3), 0.1, () => {
    ink(g, wpoly([[-14, -70], [14, -70], [6, 0], [-6, 0]], 1, 280), C.gold, 4); ink(g, wellipse(0, 22, 9, 9, 0.4, 281), C.gold, 4);
  });
  g.restore();
};
function candle(g, x, y, t) {
  ink(g, wrect(x - 8, y - 46, 16, 40, 0.6, 291), C.cream, 3.5);
  ink(g, wellipse(x, y - 4, 22, 7, 0.5, 292), C.mustard, 3);
  const f = 1 + 0.15 * Math.sin(t * 25);
  drawGlow(g, x, y - 62, 70 * f, '#ffd27a', 0.8);
  const p = new Path2D(); p.moveTo(x, y - 46); p.quadraticCurveTo(x - 10 * f, y - 58, x, y - 78 * f); p.quadraticCurveTo(x + 10 * f, y - 58, x, y - 46);
  ink(g, p, '#ffb63b', 2.5);
}
