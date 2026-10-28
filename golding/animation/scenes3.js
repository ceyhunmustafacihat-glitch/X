'use strict';
// Scenes 10-13: the war, the hard years, honours, farewell.

function warship(g, x, y, s, colr = '#7d8794', seed = 1, big = false) {
  at(g, x, y, s, 0, () => {
    const hull = big
      ? [[-300, 0], [-280, -40], [300, -40], [340, -60], [320, 0], [280, 34], [-270, 34]]
      : [[-240, 0], [-230, -30], [240, -30], [270, -46], [250, 0], [220, 26], [-215, 26]];
    const p = wpoly(hull, 1.2, seed);
    ink(g, p, colr); inkShade(g, p, -10, -8, 0.2);
    const L = big ? 1.25 : 1;
    ink(g, wpoly([[-90 * L, -30 * L], [-80 * L, -80 * L], [60 * L, -80 * L], [80 * L, -30 * L]], 1, seed + 1), rgb(shade(colr, 1.1)));
    ink(g, wrect(-40 * L, -150 * L, 60 * L, 70 * L, 1, seed + 2), rgb(shade(colr, 1.05)));
    ink(g, wrect(-120 * L, -120 * L, 34 * L, 44 * L, 1, seed + 3), rgb(shade(colr, 0.9)));
    wline(g, [[-10 * L, -150 * L], [-10 * L, -240 * L]], 5, C.ink, seed + 4);
    for (const tx of big ? [-220, -150, 170, 240] : [-180, 160]) {
      ink(g, wround(tx - 26, -58, 52, 28, 8, 0.6, seed + 5 + tx), rgb(shade(colr, 0.85)), 4);
      limb(g, [[tx + (tx > 0 ? 20 : -20), -46], [tx + (tx > 0 ? 80 : -80), -54]], rgb(shade(colr, 0.7)), 7, 3, seed + 6 + tx);
    }
  });
}
function ensign(g, x, y, t, s = 1) {
  at(g, x, y, s, 0, () => {
    const w = Math.sin(t * 6) * 6;
    const p = new Path2D(); p.moveTo(0, 0); p.quadraticCurveTo(40, w, 80, 0); p.lineTo(80, 50); p.quadraticCurveTo(40, 50 + w, 0, 50); p.closePath();
    ink(g, p, C.white, 4);
    g.save(); g.clip(p); g.fillStyle = C.red; g.fillRect(34, 0, 12, 50); g.fillRect(0, 19, 80, 12); g.fillStyle = '#2b4a8a'; g.fillRect(0, 0, 30, 19); g.restore();
    ink(g, p, null, 4);
  });
}
function smoke(g, x, y, t, n = 6, colr = '#d9d6d0', a = 0.8, seed = 1, rise = 60, sc = 1) {
  for (let i = 0; i < n; i++) {
    const u = (t * 0.25 + i / n) % 1;
    alpha(g, a * Math.sin(u * Math.PI), () => ink(g, wellipse(x + u * 80 * sc + Math.sin(i + t) * 10, y - u * rise * 6 * sc, (20 + u * 50) * sc, (18 + u * 44) * sc, 2, seed + i), colr, 3));
  }
}

SCENES.war = (g, lt, sc) => {
  const cu = sc.cues;
  const bA = 1 - ss(4.6, 5.0, lt), bB = win(4.6, 5.0, 9.1, 9.5, lt), bC = win(9.1, 9.5, 14.7, 15.1, lt), bD = ss(14.7, 15.1, lt);
  const navy = { hair: '#6b4428', hairStyle: 'short', seed: 3, bottom: C.navyD };
  if (bA > 0) alpha(g, bA, () => {
    const sk = g.createLinearGradient(0, 0, 0, 1000);
    sk.addColorStop(0, '#9fb3c2'); sk.addColorStop(1, '#d4dde0');
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    cloud(g, 300, 440, 1.3, '#e9eef0', 1201); cloud(g, 820, 360, 1.0, '#e9eef0', 1202);
    g.fillStyle = '#5d7f93'; g.fillRect(0, 960, W, 1000);
    const bob = Math.sin(lt * 1.3) * 8;
    warship(g, 600 + lt * 6, 960 + bob, 1.3, '#8a939e', 1210);
    ensign(g, 820 + lt * 6, 650 + bob, lt, 0.9);
    smoke(g, 570 + lt * 6, 760 + bob, lt, 6, '#e8e4dc', 0.7, 1220);
    if (lt > cu.horn && lt < cu.horn + 1.6) smoke(g, 620 + lt * 6, 740 + bob, (lt - cu.horn) * 3, 4, C.white, 1 - inv(cu.horn, cu.horn + 1.6, lt), 1230, 20);
    waves(g, 1010, 1900, rgb(C.white, 0.35), lt, 5, 56);
    person(g, Object.assign({}, navy, { x: 230, y: 1240, s: 1.5, t: lt, top: C.navy, sailorCollar: true, hat: 'sailor', mouth: 'smile', brow: 0.3,
      armR: lt > cu.horn + 0.6 ? 2.75 : 0.15, elbR: lt > cu.horn + 0.6 ? 2.1 : 0, armL: 0.1 }));
  });
  if (bB > 0) alpha(g, bB, () => {
    g.fillStyle = '#2f4865'; g.fillRect(0, 0, W, H);
    waves(g, 360, 1900, rgb(C.white, 0.08), lt, 6, 80);
    const steps = [[220, 1150, 'Er'], [520, 1010, 'Subay adayı'], [820, 870, 'Teğmen']];
    steps.forEach(([x, y, lab], i) => {
      ink(g, wrect(x - 150, y, 300, 1300, 1.4, 1240 + i), [C.stone, '#c9b98f', C.gold][i], 5);
    });
    const r1 = cu.rank1, r2 = cu.rank2, r3 = cu.rank3;
    const lvl = lt < r2 ? 0 : lt < r3 ? 1 : 2;
    const hopT = lvl === 0 ? lt - r1 : lvl === 1 ? lt - r2 : lt - r3;
    const prev = steps[Math.max(0, lvl - 1)], cur = steps[lvl];
    const u = lvl === 0 ? 1 : ss(0, 0.45, hopT);
    const x = lerp(prev[0], cur[0], u), y = lerp(prev[1], cur[1], u) - Math.sin(clamp(hopT / 0.45) * Math.PI) * (lvl ? 120 : 0);
    const outfit = lvl === 0 ? { top: C.navy, sailorCollar: true, hat: 'sailor' } : lvl === 1 ? { top: C.navy, collar: C.white, tie: C.ink, hat: 'officer', hatCol: C.navy, buttons: true }
      : { top: C.navyD, collar: C.white, tie: C.ink, hat: 'officer', buttons: true, stripes: 2 };
    if (lt > r1 - 0.3) person(g, Object.assign({}, navy, outfit, { x, y: y + 2, s: 1.3, t: lt, mouth: lvl === 2 ? 'grin' : 'smile', eyes: lvl === 2 && hopT > 0.5 ? 'happy' : 'open', brow: 0.5,
      armL: lvl === 2 ? 0.25 : 0.2, armR: lvl === 2 && hopT > 0.5 ? 2.75 : 0.2, elbR: lvl === 2 && hopT > 0.5 ? 2.1 : 0, squash: hopT > 0.42 && hopT < 0.55 ? 0.92 : 1 }));
    for (const rt of [r2, r3]) if (lt > rt + 0.4 && lt < rt + 1.3) {
      const v = inv(rt + 0.4, rt + 1.3, lt);
      for (let i = 0; i < 8; i++) sparkle(g, x + Math.cos(i * 0.8) * (90 + v * 80), y - 220 + Math.sin(i * 0.8) * (110 + v * 60), 20 * (1 - v), 1 - v, C.gold);
    }
  });
  if (bC > 0) alpha(g, bC, () => {
    const lc = lt - cu.chase;
    const sk = g.createLinearGradient(0, 0, 0, 1000);
    sk.addColorStop(0, '#0f1426'); sk.addColorStop(1, '#2d3656');
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    drawGlow(g, 820, 420, 200, '#fff2c0', 0.35);
    ink(g, wellipse(820, 420, 56, 56, 1, 1250), '#eadfb5', 4);
    cloud(g, 760, 470, 0.8, '#3b4466', 1251);
    // searchlights
    g.save(); g.globalCompositeOperation = 'screen';
    for (const [sx, ph] of [[160, 0], [330, 1.4]]) {
      const a = -1.2 + Math.sin(lt * 0.9 + ph) * 0.35;
      const gr = g.createLinearGradient(sx, 940, sx + Math.cos(a) * 900, 940 + Math.sin(a) * 900);
      gr.addColorStop(0, 'rgba(255,248,210,0.35)'); gr.addColorStop(1, 'rgba(255,248,210,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(sx, 940);
      g.lineTo(sx + Math.cos(a - 0.06) * 1000, 940 + Math.sin(a - 0.06) * 1000); g.lineTo(sx + Math.cos(a + 0.06) * 1000, 940 + Math.sin(a + 0.06) * 1000); g.fill();
    }
    g.restore();
    g.fillStyle = '#1d2a40'; g.fillRect(0, 980, W, 1000);
    // British ships (left), Bismarck (right)
    warship(g, 200, 990, 0.62, '#59657a', 1260);
    warship(g, 380, 1040, 0.5, '#4f5a6e', 1270);
    const sink = ss(cu.sink - cu.chase, cu.sink - cu.chase + 1.6, lc);
    g.save(); g.beginPath(); g.rect(0, 0, W, 1000 + sink * 20); g.clip();
    at(g, 790, 990 + sink * 260, 1, sink * 0.35, () => {
      warship(g, 0, 0, 0.82, '#3d4250', 1280, true);
      if (lc > 2.6) for (let i = 0; i < 3; i++) { const f = 0.7 + 0.3 * Math.sin(lt * 20 + i * 2); drawGlow(g, -120 + i * 110, -60, 70 * f, '#ff8a3a', 0.9); ink(g, wellipse(-120 + i * 110, -70, 18 * f, 26 * f, 1, 1290 + i), '#ffb24a', 3); }
    });
    g.restore();
    if (lc > 2.6) smoke(g, 760, 900, lt, 8, '#55525a', 0.85, 1295, 80, 1.6);
    // salvos: muzzle flash, glowing shell arc, splash or hit
    cu.fire.forEach((ft, k) => {
      const v = (lt - ft) / 1.0;
      if (v < 0 || v > 1.8) return;
      const sx = k % 2 ? 380 : 200, sy = k % 2 ? 1010 : 950;
      if (v < 0.2) drawGlow(g, sx + 60, sy - 20, 110 * (1 - v * 4), '#ffd27a', 1);
      if (v < 1) {
        const px = lerp(sx + 60, 700 + k * 40, v), py = lerp(sy - 20, 960, v) - Math.sin(v * Math.PI) * 420;
        drawGlow(g, px, py, 40, '#ffcf6a', 1);
        ink(g, wellipse(px, py, 7, 7, 0.3, 1310 + k), '#fff2c0', 0);
      } else {
        const w = v - 1;
        alpha(g, 1 - w / 0.8, () => {
          ink(g, wpoly([[660 + k * 40, 990], [690 + k * 40, 990 - 220 * Math.sin(Math.min(1, w * 3) * Math.PI / 2)], [720 + k * 40, 990]], 2, 1320 + k), '#cfe0ea', 4);
          if (k >= 2) drawGlow(g, 700 + k * 40, 940, 160, '#ff8a3a', 1 - w);
        });
      }
    });
    waves(g, 1000, 1900, rgb('#9fb3d0', 0.18), lt, 7, 60);
  });
  if (bD > 0) alpha(g, bD, () => {
    const sk = g.createLinearGradient(0, 0, 0, 1050);
    sk.addColorStop(0, '#4a3a3e'); sk.addColorStop(1, '#a8746a');
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    const ruins = [[-20, 1060], [-20, 760], [60, 760], [80, 700], [120, 780], [160, 640], [230, 640], [230, 820], [300, 820], [330, 720], [380, 760], [420, 600], [470, 640], [500, 590], [540, 900],
      [620, 900], [640, 700], [700, 720], [740, 660], [790, 760], [860, 760], [880, 620], [940, 680], [960, 800], [W + 20, 800], [W + 20, 1060]];
    ink(g, wpoly(ruins, 2, 1350), '#3a2f33');
    for (const x of [180, 450, 870]) smoke(g, x, 660, lt, 6, '#5a4d50', 0.7, 1360 + x, 70, 1.4);
    ink(g, wrect(-10, 1050, W + 20, 900, 1.4, 1370), '#5a4a45');
    for (let i = 0; i < 7; i++) wline(g, [[i * 170, 1140 + (i % 2) * 30], [i * 170 + 40, 1120 + (i % 2) * 30], [i * 170 + 80, 1146 + (i % 2) * 30]], 3, rgb(C.ink, 0.4), 1371 + i);
    g.strokeStyle = rgb('#d8d4e0', 0.35); g.lineWidth = 2.5;
    for (let i = 0; i < 50; i++) { const x = (i * 67) % W, y = ((lt * 900 + i * 131) % 1500) + 250; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 34); g.stroke(); }
    person(g, Object.assign({}, navy, { x: 470, y: 1250, s: 1.6, t: lt, top: C.navyD, collar: C.white, tie: C.ink, hat: 'officer', buttons: true, stripes: 2,
      mouth: 'frown', sad: 1, eyes: 'open', lookY: 1, brow: 0, armL: 0.08, armR: 0.08, headTilt: 0.06 }));
  });
};

// ------------------------------------------------------------------ hard times
function bobDylanPuppet(g, x, y, s, t, rot = 0) {
  at(g, x, y, s, rot, () => {
    person(g, { shadow: false, x: 0, y: 0, s: 0.8, t, hair: '#3a2a20', hairStyle: 'curly', top: '#3a3a44', bottom: '#2a3550', seed: 61, mouth: 'flat', eyes: 'open', armL: 0.5, armR: 0.5, elbL: 1.3, elbR: 1.3,
      handR: (gg, hx, hy) => { ink(gg, wellipse(hx - 20, hy + 10, 44, 34, 1, 1401), '#c07a3a', 4); limb(gg, [[hx - 10, hy], [hx + 60, hy - 60]], C.brown, 8, 3, 1402); } });
    // harmonica on its neck rack
    wline(g, [[-30, -270], [-30, -230], [30, -230], [30, -270]], 3, '#bfc4c8', 1403);
    ink(g, wrect(-24, -238, 48, 12, 0.4, 1404), '#d8dde0', 3);
    // strings to the cross bar
    g.strokeStyle = rgb(C.ink, 0.6); g.lineWidth = 2;
    for (const [hx, hy] of [[-40, -340], [40, -340], [-60, -170], [60, -170]]) { g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx * 0.5, -520); g.stroke(); }
    limb(g, [[-70, -520], [70, -520]], C.wood, 10, 3, 1405);
  });
}
SCENES.hard = (g, lt, sc) => {
  const cu = sc.cues;
  const bAB = 1 - ss(8.2, 8.6, lt), bC = ss(8.2, 8.6, lt);
  if (bAB > 0) alpha(g, bAB, () => {
    const tilt = Math.sin(lt * 1.7) * 0.03 * ss(4.8, 6.0, lt);
    g.save(); g.translate(540, 900); g.rotate(tilt); g.translate(-540, -900);
    g.fillStyle = '#2f3a55'; g.fillRect(-200, -200, W + 400, H + 400);
    ink(g, wrect(120, 330, 280, 340, 1.2, 1410), '#1a2036', 6);
    ink(g, wellipse(260, 440, 46, 46, 1, 1411), '#eadfb5', 3);
    // clock spinning through the night
    ink(g, wellipse(800, 450, 90, 90, 1.2, 1412), C.cream, 6);
    const ha = lt * 1.2, ma = lt * 9;
    wline(g, [[800, 450], [800 + Math.sin(ha) * 44, 450 - Math.cos(ha) * 44]], 6, C.ink, 1413);
    wline(g, [[800, 450], [800 + Math.sin(ma) * 70, 450 - Math.cos(ma) * 70]], 4, C.ink, 1414);
    const drunk = ss(cu.bottles[0], cu.bottles[3] + 0.5, lt);
    person(g, Object.assign({}, WILL.old, { x: 540, y: 1175, s: 1.45, t: lt, coat: '#5a4a3a', top: '#e9e3d4', tie: '#6f4a8e', look: lt < 4.8 ? 0 : Math.sin(lt * 2) * 0.6,
      eyes: drunk > 0.4 ? 'sleepy' : 'open', mouth: drunk > 0.4 ? 'wavy' : lt > cu.crumple ? 'frown' : 'flat', sad: lt < 4.8 ? 0.8 : 0.3, blush: drunk,
      armR: lt < 4.8 ? 2.6 + Math.sin(lt * 9) * 0.08 : 1.2, elbR: lt < 4.8 ? 1.9 : 1.2, armL: 1.0, elbL: 1.2, headTilt: Math.sin(lt * 2) * 0.12 * drunk,
      handR: drunk > 0.3 ? (gg, x, y) => { ink(gg, wpoly([[x - 16, y - 40], [x + 16, y - 40], [x + 12, y + 6], [x - 12, y + 6]], 0.6, 1415), rgb('#e8f3f2', 0.9), 3); gg.fillStyle = rgb(C.mustard, 0.8); gg.fillRect(x - 12, y - 18, 24, 22); } : null }));
    // desk + typewriter with its blank page
    ink(g, wrect(60, 1100, 960, 50, 1.2, 1420), C.wood);
    ink(g, wrect(110, 1150, 60, 400, 1, 1421), '#8a5a35'); ink(g, wrect(910, 1150, 60, 400, 1, 1422), '#8a5a35');
    ink(g, wpoly([[400, 1100], [680, 1100], [660, 980], [420, 980]], 1.2, 1423), '#5f7f6a');
    ink(g, wrect(450, 860, 180, 130, 1, 1424), C.white, 4);
    for (let i = 0; i < 4; i++) for (let k = 0; k < 7; k++) ink(g, wellipse(445 + k * 32, 1010 + i * 22, 9, 7, 0.3, 1425 + i * 7 + k), '#2d3a33', 2);
    // crumpled pages
    const nb = Math.min(6, Math.floor(lt * 1.4));
    for (let i = 0; i < nb; i++) ink(g, wellipse(170 + i * 46 + (i % 2) * 20, 1530 - (i % 3) * 18, 26, 22, 4, 1440 + i), C.white, 4);
    ink(g, wpoly([[820, 1560], [930, 1560], [915, 1420], [835, 1420]], 1, 1450), '#8f969c');
    if (lt > cu.crumple && lt < cu.crumple + 1.4) {
      const v = inv(cu.crumple, cu.crumple + 1.0, lt);
      const bx = lerp(600, 960, v), by = lerp(900, 1520, v) - Math.sin(v * Math.PI) * 260;
      ink(g, wellipse(bx, by, 24, 22, 4, 1451), C.white, 4);
    }
    // bottles popping up one by one
    cu.bottles.forEach((bt, i) => {
      const p = pop(bt, lt, 0.4);
      if (p > 0) propBottle(g, 210 + i * 70 + (i > 1 ? 520 : 0), 1100, 1.25 * p, ['#4e7a3c', '#7a4a2a', '#4e7a3c', '#3b5a7a'][i], (i % 2 ? 0.05 : -0.05));
    });
    g.restore();
  });
  if (bC > 0) alpha(g, bC, () => {
    g.fillStyle = '#25223a'; g.fillRect(0, 0, W, H);
    ink(g, wrect(120, 380, 260, 320, 1.2, 1460), '#151a30', 6);
    ink(g, wellipse(250, 480, 40, 40, 1, 1461), '#eadfb5', 3);
    ink(g, wrect(-10, 1180, W + 20, 800, 1.4, 1462), '#3b2f3e');
    drawGlow(g, 250, 600, 520, '#9fb3e0', 0.22);
    const gasp = lt > cu.gasp, atk = lt - cu.attack;
    // shadow on the wall: puppet -> devil
    const dv = ss(cu.gasp - 0.2, cu.gasp + 0.8, lt) * (1 - ss(cu.attack, cu.attack + 0.4, lt));
    if (dv > 0) alpha(g, 0.85 * dv, () => at(g, 800, 1000, 1 + dv * 0.9, 0, () => {
      const p = wcurve([[-120, 0], [-150, -240], [-110, -420], [-150, -560], [-80, -470], [0, -500], [80, -470], [150, -560], [110, -420], [150, -240], [120, 0]], 3, 1470);
      ink(g, p, '#140f1f', 0);
      for (const sd of [-1, 1]) { drawGlow(g, sd * 40, -360, 40, '#ff3b2a', 1); ink(g, wellipse(sd * 40, -360, 14, 8, 0.4, 1471 + sd), '#ff5a3a', 0); }
      wline(g, [[120, -40], [220, -120], [260, -60], [300, -110]], 10, '#140f1f', 1473, true);
    }));
    // bed
    ink(g, wrect(40, 1060, 620, 160, 1.2, 1480), C.wood);
    ink(g, wrect(40, 900, 40, 320, 1, 1481), '#8a5a35');
    // the puppet on its chair, later flung away
    const fly = atk > 0.3 ? Math.min(1.6, atk - 0.3) : 0;
    if (fly < 1.5) {
      ink(g, wrect(760, 1080, 180, 30, 1, 1490), C.wood); ink(g, wrect(770, 1110, 24, 120, 1, 1491), C.wood); ink(g, wrect(906, 1110, 24, 120, 1, 1492), C.wood);
      bobDylanPuppet(g, 850 + fly * 400, 1080 - Math.sin(fly * 2) * 300, 1, lt, fly * 6);
    } else {
      ink(g, wrect(760, 1080, 180, 30, 1, 1490), C.wood); ink(g, wrect(770, 1110, 24, 120, 1, 1491), C.wood); ink(g, wrect(906, 1110, 24, 120, 1, 1492), C.wood);
    }
    const awake = lt > cu.wake;
    if (atk < 0.15) {
      person(g, Object.assign({}, WILL.old, { x: 330, y: 1220, s: 1.35, t: lt, top: '#9fb6d6', bottom: '#9fb6d6', eyes: !awake ? 'closed' : gasp ? 'wide' : 'sleepy',
        mouth: gasp ? 'scream' : 'flat', brow: gasp ? 1.2 : 0, look: awake ? 1 : 0, armL: 0.3, armR: gasp ? 2.4 : 0.3, elbR: gasp ? 0.4 : 0, bob: gasp ? Math.abs(Math.sin(lt * 30)) * 6 : 0 }));
      ink(g, wpoly([[60, 1070], [600, 1070], [640, 1220], [40, 1220]], 1.4, 1500), '#d8cce0');
      if (!awake) for (let i = 0; i < 3; i++) { const v = (lt * 0.5 + i / 3) % 1; alpha(g, 1 - v, () => text(g, 'z', 420 + v * 80, 780 - v * 160, `700 ${40 + v * 30}px Montserrat`, C.cream)); }
      if (gasp && lt < cu.attack) at(g, 330, 700, pop(cu.gasp, lt, 0.3), 0, () => { ink(g, wpoly([[-14, -80], [14, -80], [6, 0], [-6, 0]], 1, 1501), C.coral, 4); ink(g, wellipse(0, 24, 9, 9, 0.4, 1502), C.coral, 4); });
      ink(g, wpoly([[60, 1070], [600, 1070], [640, 1220], [40, 1220]], 1.4, 1500), null, 5);
    } else {
      // the leap with a pillow
      const jx = lerp(330, 720, ss(0, 0.4, atk)), jy = 1230 - Math.sin(clamp(atk / 0.5) * Math.PI) * 140;
      ink(g, wpoly([[60, 1070], [600, 1070], [640, 1220], [40, 1220]], 1.4, 1500), '#d8cce0');
      person(g, Object.assign({}, WILL.old, { shadow: false, x: jx, y: jy, s: 1.35, t: lt, top: '#9fb6d6', bottom: '#9fb6d6', eyes: 'wide', mouth: 'grin', angry: 1, look: 1, lean: 0.15,
        armL: 2.6 + Math.sin(atk * 14) * 0.5, armR: 2.6 + Math.sin(atk * 14) * 0.5, elbL: 0.2, elbR: 0.2, walk: atk * 10, stride: 0.8,
        handR: (gg, x, y) => ink(gg, wround(x - 40, y - 80, 110, 70, 26, 1.5, 1510), C.white, 4) }));
      if (atk > 0.3 && atk < 1.6) brawl(g, 830, 950, 150, lt, pop(cu.attack + 0.3, lt, 0.25) * (1 - ss(cu.attack + 1.2, cu.attack + 1.6, lt)), 5);
      for (let i = 0; i < 14; i++) {
        const v = clamp((atk - 0.3) / 2.2);
        if (v <= 0) continue;
        const x = 800 + Math.cos(i * 2.4) * v * 360, y = 900 + Math.sin(i * 2.4) * v * 240 + v * v * 300;
        alpha(g, 1 - v, () => at(g, x, y, 1, v * 6 + i, () => ink(g, wellipse(0, 0, 18, 7, 0.4, 1520 + i), C.white, 2.5)));
      }
    }
  });
};

// ------------------------------------------------------------------ honours
function medal(g, x, y, s, t) {
  at(g, x, y, s, Math.sin(t * 1.5) * 0.06, () => {
    ink(g, wpoly([[-60, -230], [-20, -230], [10, -60], [-30, -60]], 1, 1601), C.red);
    ink(g, wpoly([[60, -230], [20, -230], [-10, -60], [30, -60]], 1, 1602), '#3b6fb6');
    drawGlow(g, 0, 40, 220, '#fff0b0', 0.7);
    ink(g, wellipse(0, 40, 120, 120, 1.4, 1603, 20), C.gold, 6);
    ink(g, wellipse(0, 40, 96, 96, 1, 1604, 20), '#f7d36e', 4);
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
      const a = Math.PI / 2 + sd * (0.4 + i * 0.36);
      at(g, Math.cos(a) * 76, 40 + Math.sin(a) * 76, 1, a + sd * 0.6, () => ink(g, wellipse(0, 0, 14, 6, 0.3, 1610 + i), '#c99a2e', 2.5));
    }
    ink(g, starPath(0, 40, 40, 17), '#e0a93a', 4);
    const sh = (t * 0.6) % 1.6;
    g.save(); g.clip(wellipse(0, 40, 120, 120, 0, 1603, 20));
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(-200 + sh * 300, -120); g.lineTo(-160 + sh * 300, -120); g.lineTo(-260 + sh * 300, 200); g.lineTo(-300 + sh * 300, 200); g.fill();
    g.restore();
  });
}
const QUEEN = { hair: '#d8d4cf', hairStyle: 'short', top: '#5b7fbf', skirt: 'long', hat: 'crown', sash: false, skin: '#f4d3b8', seed: 71, bottom: '#5b7fbf' };
SCENES.honors = (g, lt, sc) => {
  const cu = sc.cues;
  const bA = 1 - ss(3.8, 4.3, lt), bB = ss(3.8, 4.3, lt);
  if (bA > 0) alpha(g, bA, () => {
    g.fillStyle = '#3a1f2a'; g.fillRect(0, 0, W, H);
    for (const sd of [-1, 1]) {
      const p = wcurve(sd < 0 ? [[-20, 280], [260, 280], [200, 700], [230, 1100], [-20, 1200]] : [[W + 20, 280], [820, 280], [880, 700], [850, 1100], [W + 20, 1200]], 2, 1620 + sd);
      ink(g, p, '#a3263a');
      for (let i = 0; i < 4; i++) wline(g, [[sd < 0 ? 40 + i * 50 : W - 40 - i * 50, 300], [sd < 0 ? 30 + i * 46 : W - 30 - i * 46, 1100]], 3, rgb(C.ink, 0.3), 1625 + i + sd);
    }
    ink(g, wrect(-10, 260, W + 20, 60, 1, 1630), '#8a1f30');
    g.save(); g.globalCompositeOperation = 'screen';
    const sp = g.createRadialGradient(540, 1100, 20, 540, 900, 700);
    sp.addColorStop(0, 'rgba(255,230,160,0.55)'); sp.addColorStop(1, 'rgba(255,230,160,0)');
    g.fillStyle = sp; g.beginPath(); g.moveTo(470, 260); g.lineTo(610, 260); g.lineTo(820, 1200); g.lineTo(260, 1200); g.fill();
    g.restore();
    ink(g, wrect(-10, 1150, W + 20, 800, 1.4, 1631), '#6b3a2a');
    person(g, Object.assign({}, WILL.old, { x: 540, y: 1220, s: 1.45, t: lt, coat: '#2b2b35', top: C.white, tie: C.ink, mouth: 'grin', eyes: lt > 2 ? 'happy' : 'open', brow: 0.6,
      armL: 2.3, elbL: 0.4, armR: 2.3, elbR: 0.4 }));
    const mp_ = pop(cu.medal, lt, 0.6);
    if (mp_ > 0) medal(g, 540, 560 - (1 - mp_) * 80, mp_ * 0.95, lt);
    // the audience clapping
    for (let i = 0; i < 9; i++) {
      const x = 60 + i * 120, y = 1220 + (i % 2) * 30, c = lt > cu.clap ? Math.abs(Math.sin(lt * 10 + i)) : 0;
      ink(g, wellipse(x, y, 52, 58, 1.5, 1640 + i), '#22161c', 4);
      if (lt > cu.clap) { ink(g, wellipse(x - 14 + c * 8, y - 70, 12, 12, 0.6, 1650 + i), C.skin, 3); ink(g, wellipse(x + 14 - c * 8, y - 70, 12, 12, 0.6, 1660 + i), C.skin, 3); }
    }
    if (lt > cu.clap) for (let i = 0; i < 30; i++) {
      const v = lt - cu.clap, x = (i * 97) % W, y = ((v * (140 + (i % 4) * 50) + i * 61) % 900) + 300;
      at(g, x, y, 1, v * 3 + i, () => ink(g, wrect(-8, -5, 16, 10, 0.4, 1670 + i), [C.gold, C.white, C.coral][i % 3], 2));
    }
  });
  if (bB > 0) alpha(g, bB, () => {
    g.fillStyle = '#5a2f4f'; g.fillRect(0, 0, W, H);
    for (let x = 60; x < W; x += 160) for (let y = 380; y < 1000; y += 160) ink(g, starPath(x + ((y / 160) % 2) * 80, y, 16, 7, 4), rgb(C.gold, 0.35), 0);
    ink(g, wcurve([[700, 1100], [690, 700], [760, 520], [900, 480], [1040, 520], [1100, 700], [1100, 1100]], 1.5, 1700), '#8a1f30');
    ink(g, wrect(-10, 1100, W + 20, 900, 1.4, 1701), '#6a4a3a');
    ink(g, wpoly([[380, 1100], [700, 1100], [860, 1920], [220, 1920]], 1.2, 1702), '#a3263a');
    const k1 = cu.kneel, t1 = cu.tap1, t2 = cu.tap2, sir = cu.sir;
    const up = ss(sir, sir + 0.6, lt);
    const swordA = lt < t1 - 0.4 ? -1.3 : lt < t1 ? lerp(-1.3, -0.2, ss(t1 - 0.4, t1, lt)) : lt < t2 - 0.4 ? lerp(-0.2, -1.6, ss(t1 + 0.1, t1 + 0.4, lt)) : lt < sir ? lerp(-1.6, 0.15, ss(t2 - 0.4, t2, lt)) : -1.3;
    // William kneels on a cushion
    const kneel = lt > k1 && lt < sir + 0.3;
    person(g, Object.assign({}, WILL.old, { x: 380, y: 1230, s: 1.4, t: lt, coat: '#2b2b35', top: C.white, tie: C.ink, kneel: kneel && up < 0.5, mouth: lt > sir ? 'grin' : 'smile',
      eyes: kneel ? 'closed' : lt > sir ? 'happy' : 'open', lookY: kneel ? 1 : 0, look: 1, armL: 0.2, armR: 0.2, headTilt: kneel ? 0.12 : 0,
      pin: lt > sir ? (gg, x, y) => ink(gg, starPath(x, y, 16 * pop(sir, lt, 0.4), 7 * pop(sir, lt, 0.4)), C.gold, 3) : null }));
    if (kneel) ink(g, wround(260, 1200, 240, 50, 20, 1, 1710), '#c9364a');
    // the Queen with the sword
    person(g, Object.assign({}, QUEEN, { x: 790, y: 1230, s: 1.45, t: lt, mouth: 'smile', look: -1, armR: 0.2, armL: 1.6, elbL: 0.2,
      handL: (gg, x, y) => at(gg, x, y, 1, swordA, () => {
        limb(gg, [[0, 0], [-300, 0]], '#d8dde0', 12, 3, 1720);
        ink(gg, wrect(-10, -28, 14, 56, 0.6, 1721), C.gold, 3);
        ink(gg, wrect(4, -8, 36, 16, 0.6, 1722), C.brown, 3);
      }) }));
    for (const tt of [t1, t2]) if (lt > tt && lt < tt + 0.5) { const v = inv(tt, tt + 0.5, lt); for (let i = 0; i < 6; i++) sparkle(g, 420 + Math.cos(i) * 80 * (0.5 + v), 820 + Math.sin(i) * 60 * (0.5 + v), 18 * (1 - v), 1 - v, C.gold); }
    if (lt > sir) for (let i = 0; i < 8; i++) { const v = ((lt - sir) * 0.6 + i / 8) % 1; sparkle(g, 380 + Math.cos(i * 0.8) * 180, 760 - v * 260, 20 * (1 - v), 1 - v, C.gold); }
  });
};

// ------------------------------------------------------------------ farewell
SCENES.end = (g, lt, sc) => {
  const cu = sc.cues;
  const bA = 1 - ss(cu.card - 0.4, cu.card + 0.2, lt);
  if (bA > 0) alpha(g, bA, () => {
    const sk = g.createLinearGradient(0, 200, 0, 1050);
    sk.addColorStop(0, '#5a4a7a'); sk.addColorStop(0.55, '#e88a5a'); sk.addColorStop(1, '#f6c77a');
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    const sunY = 960 + lt * 10;
    drawGlow(g, 640, sunY, 380, '#ffd59a', 0.8);
    g.save(); g.beginPath(); g.rect(0, 0, W, 1000); g.clip(); ink(g, wellipse(640, sunY, 110, 110, 1, 1800), '#ffd27a', 0); g.restore();
    g.fillStyle = '#3f5f7a'; g.fillRect(0, 1000, W, 1000);
    g.fillStyle = rgb('#ffd27a', 0.45);
    for (let i = 0; i < 6; i++) { const w = 220 - i * 30; g.fillRect(640 - w / 2 + Math.sin(lt * 2 + i) * 10, 1020 + i * 30, w, 8); }
    waves(g, 1060, 1900, rgb(C.white, 0.2), lt, 8, 60);
    ink(g, wcurve([[-20, 760], [200, 740], [330, 800], [400, 900], [430, 1020], [460, 1950], [-20, 1950]], 2, 1801), '#4f6a45');
    ink(g, wcurve([[-20, 760], [200, 740], [330, 800], [350, 830], [200, 800], [-20, 810]], 1.4, 1802), C.grass, 4);
    // the cottage
    ink(g, wrect(100, 640, 170, 120, 1, 1803), C.white);
    ink(g, wpoly([[84, 650], [185, 570], [286, 650]], 1, 1804), '#5a4a5a');
    ink(g, wrect(160, 680, 40, 44, 0.6, 1805), rgb('#ffcf6a', 0.9), 4);
    seagull(g, 620 + lt * 10, 560, 1, lt, 6); seagull(g, 720 + lt * 8, 620, 0.7, lt, 7);
  });
  const bB = ss(cu.card - 0.4, cu.card + 0.2, lt);
  if (bB > 0) alpha(g, bB, () => {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    drawGlow(g, 540, 760, 700, '#fff3d6', 0.9);
    const lc = lt - cu.card;
    at(g, 540, 760, 0.85 + 0.03 * lc, 0, () => {
      ink(g, wellipse(0, 0, 330, 330, 2, 11, 24), C.mustard, 6);
      const inner = wellipse(0, 0, 286, 286, 1.6, 12, 24);
      ink(g, inner, C.teal, 5);
      g.save(); g.clip(inner);
      person(g, Object.assign({}, WILL.old, { shadow: false, x: 0, y: 590, s: 1.95, t: lt, mouth: 'smile', eyes: 'happy' }));
      g.restore();
    });
    drawWordmark(g, 1170, ss(cu.card + 0.3, cu.card + 1.2, lt), ss(cu.card + 0.8, cu.card + 1.4, lt), ss(cu.card + 1.1, cu.card + 1.7, lt));
  });
};
