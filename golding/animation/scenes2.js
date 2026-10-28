'use strict';
// Scenes 5-9: school, the dark confession, Oxford, love, teaching.

// cartoon brawl: a dust cloud with fists, feet and stars popping out
function brawl(g, x, y, r, t, a = 1, seed = 1) {
  if (a <= 0) return;
  alpha(g, a, () => {
    for (let i = 0; i < 5; i++) {
      const ang = t * 7 + i * TAU / 5 + seed, rr = r * 0.82;
      const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr * 0.7;
      if (i % 2) limb(g, [[x + Math.cos(ang) * r * 0.4, y + Math.sin(ang) * r * 0.3], [px, py]], i % 4 === 1 ? C.teal : '#c95a3a', 20, 5, 700 + i);
      ink(g, wellipse(px, py, 16, 16, 1, 710 + i), i % 2 ? C.skin : C.ink, 4);
    }
    const pts = [];
    for (let i = 0; i < 14; i++) {
      const ang = i / 14 * TAU, k = 1 + 0.16 * Math.sin(i * 2.3 + t * 9);
      pts.push([x + Math.cos(ang) * r * k, y + Math.sin(ang) * r * 0.72 * k]);
    }
    const p = wcurve(pts, 4, 720 + seed);
    ink(g, p, '#efe2c4', 6);
    inkShade(g, p, -16, -12, 0.12);
    for (let i = 0; i < 4; i++) {
      const ang = -t * 4 + i * TAU / 4;
      at(g, x + Math.cos(ang) * r * 0.45, y + Math.sin(ang) * r * 0.3, 1, ang, () => ink(g, starPath(0, 0, 22, 9), C.gold, 4));
    }
  });
}
function plaster(g, x, y, s = 1, r = 0.5) {
  at(g, x, y, s, r, () => { ink(g, wround(-18, -7, 36, 14, 6, 0.4, 731), '#f0c9a0', 3); wline(g, [[-4, 0], [4, 0]], 2, C.ink, 732); wline(g, [[0, -4], [0, 4]], 2, C.ink, 733); });
}

SCENES.school = (g, lt, sc) => {
  const cu = sc.cues;
  const toClass = ss(cu.class - 0.4, cu.class + 0.2, lt);
  if (toClass < 1) {
    // ---- schoolyard
    g.fillStyle = C.sky; g.fillRect(0, 0, W, H);
    cloud(g, 200 + lt * 8, 420, 1.1, C.white, 801); cloud(g, 820 - lt * 6, 520, 0.9, C.white, 802);
    // school building
    ink(g, wrect(120, 470, 840, 560, 1.4, 803), '#c9794f');
    for (let y = 490; y < 1030; y += 36) for (let x = 120 + ((y / 36) % 2) * 30; x < 960; x += 60) wline(g, [[x, y], [x + 40, y]], 2, rgb(C.ink, 0.18), 804 + x + y);
    ink(g, wpoly([[100, 480], [540, 330], [980, 480]], 1.4, 805), '#6d4a3d');
    ink(g, wellipse(540, 420, 44, 44, 1, 806), C.white, 4);
    wline(g, [[540, 420], [540, 392]], 4, C.ink, 807); wline(g, [[540, 420], [560, 430]], 4, C.ink, 808);
    for (const x of [180, 340, 640, 800]) { ink(g, wrect(x, 560, 100, 130, 1, 809 + x), '#bfe3ea', 5); wline(g, [[x + 50, 560], [x + 50, 690]], 4, C.ink, 810 + x); }
    ink(g, wcurve([[480, 1030], [480, 860], [540, 810], [600, 860], [600, 1030]], 1, 811), '#6d4a3d');
    ink(g, wrect(-10, 1030, W + 20, 900, 1.5, 812), '#d6c6a0');
    for (let i = 0; i < 6; i++) wline(g, [[i * 200, 1100 + (i % 2) * 40], [i * 200 + 60, 1104 + (i % 2) * 40]], 3, rgb(C.ink, 0.2), 813 + i);

    const bA = 1 - ss(5.0, 5.4, lt);   // fight beat
    const bB = ss(5.0, 5.4, lt);       // prize beat
    // kids playing at the back (beat A) / clapping (beat B)
    const kidsBack = [[640, 1045, C.mustard, '#3e2a1c', 21], [790, 1050, C.purple, '#a0522d', 22], [930, 1040, C.green, '#2b1d14', 23]];
    kidsBack.forEach(([x, y, top, hair, sd], i) => {
      const clap = bB > 0.5 ? Math.abs(Math.sin(lt * 9 + i)) : 0;
      person(g, { kid: true, x, y, s: 0.8, t: lt, top, hair, hairStyle: 'kid', bottom: C.navy, shorts: true, seed: sd,
        armL: bB > 0.5 ? 2.0 - clap * 0.5 : 0.4 + Math.sin(lt * 4 + i) * 0.3, armR: bB > 0.5 ? 2.0 - clap * 0.5 : 0.4 - Math.sin(lt * 4 + i) * 0.3, elbL: bB > 0.5 ? 0.9 : 0, elbR: bB > 0.5 ? 0.9 : 0,
        mouth: 'grin', bob: bA > 0.5 ? Math.abs(Math.sin(lt * 5 + i)) * 12 : 0, look: i === 2 ? -1 : 1 });
    });
    if (bA > 0.5) { // bouncing ball
      const u = (lt * 1.1) % 1;
      ink(g, wellipse(720 + Math.sin(lt * 2.2) * 120, 1030 - Math.abs(Math.sin(u * Math.PI)) * 160, 22, 22, 0.8, 820), C.red, 4);
    }

    if (bA > 0.01) alpha(g, bA, () => {
      const f0 = cu.fight;
      const inFight = lt > f0 + 0.4 && lt < f0 + 2.9;
      const bullyX = lerp(1150, 470, ss(f0 - 0.6, f0 + 0.3, lt));
      if (!inFight) {
        person(g, Object.assign({}, WILL.kid, { x: 260, y: 1200, s: 1.35, t: lt, mouth: lt > f0 ? 'frown' : 'flat', angry: lt > f0 ? 1 : 0, look: lt > f0 - 0.5 ? 1 : -0.6,
          armL: 0.1, armR: 0.1, sad: lt < f0 - 0.5 ? 0.6 : 0 }));
        if (lt > f0) person(g, { kid: true, x: bullyX, y: 1200, s: 1.45, t: lt, hair: '#c27a3a', hairStyle: 'kid', top: '#8a5a8f', bottom: '#3b3a48', shorts: true, seed: 24,
          mouth: 'frown', angry: 1, look: -1, armL: 0.5, armR: 0.5, elbL: 1.6, elbR: 1.6 });
        if (lt > f0 + 2.9) { plaster(g, 300, 800, 1.3, 0.5); plaster(g, bullyX - 40, 790, 1.3, -0.4); }
      } else brawl(g, 380, 900, 230, lt, pop(f0 + 0.4, lt, 0.3), 1);
    });
    if (bB > 0.01) alpha(g, bB, () => {
      // proud walk with the prize book held high
      const b0 = cu.book, sp = cu.proud;
      const walkX = lerp(220, 520, ss(sp, sp + 3.6, lt));
      const got = lt > b0 + 0.5;
      if (got) drawGlow(g, walkX + 30, 660, 260, '#fff1b8', 0.8);
      person(g, Object.assign({}, WILL.kid, { x: walkX, y: 1200, s: 1.4, t: lt, walk: lt * 7, stride: lt > sp ? 0.6 : 0, lean: lt > sp ? -0.04 : 0,
        mouth: got ? 'grin' : 'o', eyes: lt > sp ? 'happy' : 'open', brow: 0.6, headTilt: lt > sp ? -0.12 : 0,
        armR: got ? 2.9 : 0.4, elbR: got ? 0.3 : 0, armL: got ? 0.6 : 0.4,
        handR: got ? (gg, x, y) => propBook(gg, x + 6, y - 22, 1.2, C.red, -0.1) : null, blush: got ? 0.8 : 0 }));
      if (!got) { // the book flies in
        const u = ss(b0, b0 + 0.5, lt);
        propBook(g, lerp(900, walkX + 40, u), lerp(700, 760, u) - Math.sin(u * Math.PI) * 160, 1.6, C.red, u * TAU);
      }
      if (lt > sp) for (let i = 0; i < 6; i++) {
        const u = ((lt - sp) * 0.7 + i / 6) % 1;
        sparkle(g, walkX + Math.cos(i * 1.7) * 140, 680 - u * 220 + Math.sin(i) * 40, 16 + 8 * Math.sin(u * 9), 1 - u, C.gold);
      }
    });
  }
  if (toClass > 0) alpha(g, toClass, () => {
    // ---- classroom: the science teacher is his own father
    g.fillStyle = '#d8c9a3'; g.fillRect(0, 0, W, H);
    ink(g, wrect(-10, 1040, W + 20, 900, 1.4, 840), '#9c6b42');
    for (let y = 1090; y < 1920; y += 60) wline(g, [[0, y], [W, y]], 3, rgb(C.ink, 0.3), 841 + y);
    ink(g, wrect(140, 380, 800, 430, 1.4, 842), '#8a5a35', 7);
    ink(g, wrect(165, 405, 750, 380, 1.2, 843), '#2f4a3d', 4);
    const ch = ss(cu.class + 0.6, cu.class + 2.6, lt);
    g.save(); g.beginPath(); g.rect(165, 405, 750 * ch + 20, 380); g.clip();
    g.strokeStyle = rgb('#f1efe2', 0.9); g.lineWidth = 4; g.lineCap = 'round';
    at(g, 290, 600, 1.4, 0, () => { g.beginPath(); g.moveTo(-14, -60); g.lineTo(-14, -20); g.lineTo(-44, 40); g.lineTo(44, 40); g.lineTo(14, -20); g.lineTo(14, -60); g.stroke(); });
    for (let k = 0; k < 3; k++) { g.save(); g.translate(560, 560); g.rotate(k * Math.PI / 3); g.beginPath(); g.ellipse(0, 0, 80, 26, 0, 0, TAU); g.stroke(); g.restore(); }
    g.beginPath(); g.arc(560, 560, 9, 0, TAU); g.stroke();
    // a molecule
    for (const [x1, y1, x2, y2] of [[780, 580, 720, 520], [780, 580, 850, 530], [780, 580, 790, 670]]) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    for (const [x, y, r] of [[780, 580, 26], [720, 520, 16], [850, 530, 16], [790, 670, 16]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
    g.restore();
    // Alec at the board
    const wink = lt > cu.wink && lt < cu.wink + 1.1;
    person(g, Object.assign({}, ALEC, { x: 860, y: 1110, s: 1.35, t: lt, armL: lt < cu.wink ? 2.3 : 0.3, elbL: 0.5, armR: 0.2, mouth: wink ? 'smirk' : 'smile', eyes: wink ? 'wink' : 'open', look: lt > cu.wink - 0.5 ? -1 : -0.3 }));
    // desks and pupils
    const kids = [[200, C.mustard, '#3e2a1c', 31], [700, C.purple, '#a0522d', 32]];
    kids.forEach(([x, top, hair, sd]) => person(g, { kid: true, x, y: 1170, s: 1.05, t: lt, top, hair, hairStyle: 'kid', bottom: C.navy, seed: sd, look: 0.8, mouth: 'smile', armL: 0.6, armR: 0.6, elbL: 1.2, elbR: 1.2 }));
    const shock = lt > cu.class + 1.2;
    const sink = ss(cu.wink + 0.2, cu.wink + 0.8, lt) * 26;
    person(g, Object.assign({}, WILL.kid, { x: 450, y: 1190 + sink, s: 1.2, t: lt, eyes: shock && lt < cu.wink ? 'wide' : 'open', mouth: lt > cu.wink ? 'wavy' : shock ? 'o' : 'smile',
      brow: shock ? 1 : 0, look: 1, blush: ss(cu.wink, cu.wink + 0.5, lt), armL: 0.6, armR: 0.6, elbL: 1.2, elbR: 1.2 }));
    for (const x of [200, 450, 700]) {
      ink(g, wrect(x - 120, 1090, 240, 34, 1, 850 + x), C.wood, 5);
      ink(g, wrect(x - 100, 1124, 200, 120, 1, 851 + x), '#8a5a35', 5);
    }
    if (shock && lt < cu.wink) at(g, 560, 870, pop(cu.class + 1.2, lt, 0.35), 0.1, () => {
      ink(g, wpoly([[-12, -70], [12, -70], [6, 0], [-6, 0]], 1, 860), C.coral, 4); ink(g, wellipse(0, 20, 8, 8, 0.4, 861), C.coral, 4);
    });
  });
};

// ------------------------------------------------------------------ the dark confession
SCENES.dark = (g, lt, sc) => {
  const cu = sc.cues;
  g.fillStyle = '#2b2c38'; g.fillRect(0, 0, W, H);
  // rainy window
  ink(g, wrect(640, 330, 300, 380, 1.2, 900), '#1b2030', 6);
  g.save(); g.beginPath(); g.rect(645, 335, 290, 370); g.clip();
  g.strokeStyle = rgb('#9fb0d0', 0.4); g.lineWidth = 2.5;
  for (let i = 0; i < 24; i++) { const x = 640 + (i * 53) % 300, y = ((lt * 600 + i * 97) % 460) + 300; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 30); g.stroke(); }
  g.restore();
  wline(g, [[790, 330], [790, 710]], 6, C.ink, 901); wline(g, [[640, 520], [940, 520]], 6, C.ink, 902);
  // lamp glow
  drawGlow(g, 300, 700, 560, '#f4c470', 0.35);
  ink(g, wrect(-10, 980, W + 20, 1000, 1.4, 903), '#4a3528');
  limb(g, [[260, 990], [260, 760], [330, 640]], '#3b3a3a', 10, 4, 904);
  ink(g, wpoly([[270, 590], [400, 590], [440, 690], [230, 690]], 1, 905), '#6b5a3a');
  // the open diary
  const dg = pop(cu.page, lt, 0.6);
  at(g, 560, 1080, dg, -0.05, () => {
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill(wround(-370, -210, 760, 420, 20, 1, 906));
    ink(g, wpoly([[-380, -220], [0, -195], [380, -220], [380, 190], [0, 210], [-380, 190]], 1.4, 907), '#ece2c8', 5);
    wline(g, [[0, -195], [0, 210]], 4, rgb(C.ink, 0.7), 908);
    const wr = ss(0.6, 3.6, lt);
    g.strokeStyle = rgb(C.navy, 0.75); g.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const side = i < 5 ? -1 : 1, row = i < 5 ? i : i - 5;
      const y0 = -90 + row * 52 + (side > 0 ? -50 : 0), x0 = side < 0 ? -330 : 40;
      const len = clamp(wr * 9 - i) * 290;
      if (len <= 0) continue;
      g.beginPath(); g.moveTo(x0, y0);
      for (let x = 0; x < len; x += 8) g.lineTo(x0 + x, y0 + Math.sin(x * 0.35 + i) * 6 + Math.sin(x * 0.11) * 3);
      g.stroke();
    }
    // ink blot spreading over the right page
    const bl = ss(cu.blot, cu.blot + 2.2, lt);
    if (bl > 0) {
      const pts = [];
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = (40 + 130 * bl) * (1 + 0.25 * Math.sin(i * 3.3) + 0.12 * Math.sin(i * 7.1)); pts.push([190 + Math.cos(a) * r, 20 + Math.sin(a) * r * 0.8]); }
      ink(g, curve(new Path2D(), pts, true), '#16141f', 0);
      for (let i = 0; i < 5; i++) ink(g, wellipse(190 + Math.cos(i * 1.9) * (190 * bl), 20 + Math.sin(i * 1.9) * (150 * bl), 10 * bl, 10 * bl, 0.5, 910 + i), '#16141f', 0);
    }
  });
  // quill in its ink pot
  ink(g, wellipse(880, 1210, 54, 22, 1, 920), '#1a1a22', 4);
  ink(g, wpoly([[836, 1210], [924, 1210], [916, 1140], [844, 1140]], 1, 921), '#26263a', 4);
  at(g, 900, 1100, 1, 0.5, () => ink(g, wcurve([[0, 60], [-12, 10], [-18, -50], [-4, -110], [8, -50], [8, 10]], 1.2, 922), '#d8d0c0'));
};

// ------------------------------------------------------------------ Oxford
function skyline(g, base, colr, seed = 1) {
  const b = base;
  const pts = [[-20, b], [-20, b - 120], [60, b - 120], [60, b - 260], [80, b - 330], [100, b - 260], [100, b - 140], [190, b - 140], [190, b - 210], [240, b - 210],
    [240, b - 160], [300, b - 160], [300, b - 260], [330, b - 320], [360, b - 330], [390, b - 320], [420, b - 260], [420, b - 180], [470, b - 180], [470, b - 300],
    [490, b - 300], [505, b - 430], [520, b - 300], [540, b - 300], [540, b - 170], [620, b - 170], [620, b - 240], [700, b - 240], [700, b - 150], [760, b - 150],
    [760, b - 280], [775, b - 280], [790, b - 380], [805, b - 280], [820, b - 280], [820, b - 140], [920, b - 140], [920, b - 220], [990, b - 220], [990, b - 130], [W + 20, b - 130], [W + 20, b]];
  ink(g, wpoly(pts, 1.2, seed), colr);
  // the dome (a Radcliffe Camera nod)
  ink(g, wcurve([[290, b - 260], [300, b - 330], [360, b - 370], [420, b - 330], [430, b - 260]], 1, seed + 1), colr);
  ink(g, wrect(352, b - 400, 16, 34, 0.6, seed + 2), colr, 4);
}
SCENES.oxford = (g, lt, sc) => {
  const cu = sc.cues;
  const sk = g.createLinearGradient(0, 200, 0, 1100);
  sk.addColorStop(0, '#f3b26b'); sk.addColorStop(0.6, '#f6d39a'); sk.addColorStop(1, '#fbe6bd');
  g.fillStyle = sk; g.fillRect(0, 0, W, H);
  drawGlow(g, 760, 760, 300, '#fff1c2', 0.8);
  ink(g, wellipse(760, 760, 90, 90, 1.2, 950), '#fbe3a0', 0);
  skyline(g, 1020, '#9a6f84', 951);
  ink(g, wrect(-10, 1010, W + 20, 900, 1.4, 960), C.grass);
  ink(g, wpoly([[440, 1010], [640, 1010], [900, 1920], [180, 1920]], 1.2, 961), '#e6d3a8', 4);
  for (let i = 0; i < 7; i++) ink(g, wellipse(80 + i * 160, 1060 + (i % 2) * 30, 40, 18, 1, 962 + i), C.grassD, 0);

  const pf = cu.poof;
  const after = lt > pf;
  const W0 = Object.assign({}, WILL.young, { coat: '#1f1f26', top: C.white, tie: '#2e4a7a', hat: 'mortar' });
  // the father he wants to please, in a thought bubble
  const bb = pop(cu.bubble, lt, 0.5) * (1 - ss(pf - 0.9, pf - 0.4, lt));
  if (bb > 0) at(g, 720, 560, bb, 0, () => {
    for (const [x, y, r] of [[-230, 230, 14], [-190, 170, 22]]) ink(g, wellipse(x, y, r, r, 0.6, 970 + r), C.white, 4);
    ink(g, wcurve([[-150, 40], [-160, -60], [-90, -140], [10, -150], [110, -120], [160, -30], [140, 70], [40, 120], [-80, 110]], 2, 972), C.white, 5);
    g.save(); g.beginPath(); g.rect(-150, -150, 310, 230); g.clip();
    person(g, Object.assign({}, ALEC, { shadow: false, x: 0, y: 300, s: 0.95, t: lt, mouth: 'grin', eyes: 'happy', armL: 0.2, armR: 2.6, elbR: 0.6 }));
    g.restore();
    // thumbs up
    ink(g, wround(70, -100, 40, 44, 12, 0.6, 973), C.skin, 4); ink(g, wround(80, -134, 18, 40, 9, 0.5, 974), C.skin, 4);
  });
  const bookOpen = ss(pf, pf + 0.5, lt);
  person(g, Object.assign({}, W0, { x: 400, y: 1230, s: 1.55, t: lt, mouth: after ? 'grin' : 'flat', eyes: after && lt > pf + 0.6 ? 'happy' : 'open', sad: after ? 0 : 0.7,
    brow: after ? 0.8 : 0, look: after ? 0.3 : 0.9, armR: 1.75, elbR: 0.9, armL: after ? 1.2 : 0.15, elbL: after ? 1.3 : 0,
    handR: (gg, x, y) => { if (!after) propFlask(gg, x + 4, y - 4, 1.0, '#9ad66a', lt); else propBook(gg, x + 10, y - 16, 1.25 * bookOpen + 0.01, '#2e6a8a', -0.2); } }));
  // poof + letters flying out of the book
  if (lt > pf - 0.1 && lt < pf + 0.8) {
    const u = inv(pf - 0.1, pf + 0.8, lt);
    alpha(g, 1 - u, () => { for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ink(g, wellipse(560 + Math.cos(a) * 90 * u, 820 + Math.sin(a) * 70 * u, 40 * (1 - u * 0.5), 40 * (1 - u * 0.5), 2, 980 + i), C.white, 4); } });
  }
  // pages drift up from the open book
  if (lt > pf + 0.3) for (let i = 0; i < 5; i++) {
    const u = ((lt - pf - 0.3) * 0.3 + i / 5) % 1;
    const x = 600 + i * 70 + u * 60, y = 840 - u * 460;
    alpha(g, Math.sin(u * Math.PI) * 0.9, () => at(g, x, y, 1, -0.3 + u * 0.6 + i * 0.2, () => {
      ink(g, wrect(-26, -34, 52, 68, 0.6, 985 + i), C.white, 3.5);
      for (let k = 0; k < 4; k++) wline(g, [[-16, -20 + k * 13], [16, -20 + k * 13]], 2.5, rgb(C.navy, 0.5), 986 + i * 4 + k);
    }));
  }
};

// ------------------------------------------------------------------ love
const MOLLY = { hair: '#b8562e', hairStyle: 'long', top: '#5f8f5a', skirt: 'long', skin: '#f6d3b4', seed: 41 };
const ANN = { hair: '#2e2420', hairStyle: 'bun', top: '#3f7f7a', coat: C.white, skirt: 'long', skin: '#f1c9a6', seed: 42 };
const FIANCE = { hair: '#5a3b26', hairStyle: 'short', mustache: '#5a3b26', top: '#6b6f7a', bottom: '#45474f', hat: 'bowler', collar: C.white, tie: C.mustard, seed: 43 };
function ring(g, x, y, s, broken = 0, seed = 1) {
  at(g, x, y, s, 0, () => {
    const sp = broken * 40;
    for (const sd of broken > 0 ? [-1, 1] : [0]) {
      g.save(); g.translate(sd * sp, broken * broken * 220); g.rotate(sd * broken * 1.2);
      g.strokeStyle = C.ink; g.lineWidth = 16; g.beginPath();
      if (sd === 0) g.arc(0, 0, 30, 0, TAU); else g.arc(0, 0, 30, sd < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, sd < 0 ? Math.PI * 1.5 : Math.PI * 0.5);
      g.stroke(); g.strokeStyle = C.gold; g.lineWidth = 8; g.stroke();
      if (sd <= 0) ink(g, wpoly([[-14, -36], [14, -36], [0, -16]], 0.5, seed), '#bfe9f5', 3);
      g.restore();
    }
  });
}
SCENES.love = (g, lt, sc) => {
  const cu = sc.cues;
  const sk = g.createLinearGradient(0, 200, 0, 1100);
  sk.addColorStop(0, '#f6b8a8'); sk.addColorStop(1, '#fde2c8');
  g.fillStyle = sk; g.fillRect(0, 0, W, H);
  cloud(g, 260, 460, 1.0, '#fff4ea', 1001); cloud(g, 860, 380, 0.8, '#fff4ea', 1002);
  for (const [x, s] of [[110, 1.1], [960, 1.25]]) {
    limb(g, [[x, 1110], [x, 760]], C.brown, 30, 5, 1003 + x);
    ink(g, wcurve([[x - 150 * s, 760], [x - 120 * s, 600], [x - 30 * s, 520], [x + 80 * s, 540], [x + 150 * s, 640], [x + 140 * s, 770], [x, 820]], 2, 1004 + x), C.sage);
  }
  ink(g, wrect(-10, 1100, W + 20, 900, 1.4, 1005), C.grass);
  const brk = cu.break, wed = cu.wed;
  const leave = ss(brk + 0.6, brk + 2.0, lt);
  // the original engagements
  const mx = lerp(200, -260, leave), fx = lerp(890, 1340, leave);
  const annIn = ss(cu.meet - 0.4, cu.meet + 0.9, lt);
  const wx = lerp(lerp(370, 340, annIn), 450, ss(brk + 0.8, wed, lt));
  const ax = lerp(lerp(1300, 720, annIn), 630, ss(brk + 0.8, wed, lt));
  const spark = lt > cu.spark;
  const married = lt > wed;
  person(g, Object.assign({}, MOLLY, { x: mx, y: 1230, s: 1.4, t: lt, flip: leave > 0.02, walk: lt * 8, stride: leave > 0.02 && leave < 0.98 ? 0.6 : 0,
    mouth: spark ? (lt > brk ? 'frown' : 'o') : 'smile', angry: lt > brk ? 0.8 : 0, armR: lt < cu.meet ? 0.7 : 0.15, look: spark ? 1 : 0.6 }));
  if (annIn > 0) person(g, Object.assign({}, FIANCE, { x: fx, y: 1230, s: 1.45, t: lt, walk: lt * 8, stride: (annIn < 0.98 || (leave > 0.02 && leave < 0.98)) ? 0.6 : 0,
    mouth: spark ? (lt > brk ? 'frown' : 'o') : 'smile', angry: lt > brk ? 0.8 : 0, look: spark ? -1 : -0.6 }));
  person(g, Object.assign({}, WILL.young, { x: wx, y: 1230, s: 1.5, t: lt, mouth: married ? 'grin' : spark ? 'o' : 'smile', eyes: married ? 'happy' : 'open', blush: spark ? 0.9 : 0.2,
    brow: spark ? 0.9 : 0, look: annIn > 0.5 ? 1 : -0.6, armL: lt < cu.meet ? 0.7 : 0.15, armR: married ? 0.8 : 0.12 }));
  if (annIn > 0) person(g, Object.assign({}, ANN, { x: ax, y: 1230, s: 1.42, t: lt, hat: married ? 'veil' : null, mouth: married ? 'grin' : spark ? 'smile' : 'smile', eyes: married ? 'happy' : 'open',
    blush: spark ? 0.9 : 0.2, brow: spark ? 0.8 : 0, look: -1, walk: lt * 8, stride: annIn < 0.98 ? 0.6 : 0, armL: married ? 0.8 : 1.6, elbL: married ? 0 : 1.0,
    handL: married ? (gg, x, y) => { for (let i = 0; i < 5; i++) ink(gg, wellipse(x + Math.cos(i * 1.3) * 16, y - 10 + Math.sin(i * 1.3) * 12, 11, 11, 0.4, 1010 + i), i % 2 ? C.pink : C.white, 3); }
      : (gg, x, y) => propFlask(gg, x - 4, y - 4, 0.75, '#c08ad6', lt) }));
  // rings over the first couple and over Ann's engagement
  const r1 = pop(cu.ring, lt, 0.45);
  if (r1 > 0 && leave < 0.3) ring(g, (mx + wx) / 2, 610 - Math.sin(lt * 2) * 8, r1 * 1.2, ss(brk, brk + 0.8, lt), 1020);
  const r2 = pop(cu.meet + 0.8, lt, 0.45);
  if (r2 > 0 && leave < 0.3) ring(g, (ax + fx) / 2, 600 - Math.sin(lt * 2 + 1) * 8, r2 * 1.1, ss(brk, brk + 0.8, lt), 1021);
  // the spark between William and Ann
  if (spark && !married) {
    const u = ss(cu.spark, cu.spark + 0.4, lt);
    const ya = 860;
    g.save(); g.globalAlpha = u;
    const pts = []; for (let i = 0; i <= 8; i++) pts.push([lerp(wx + 50, ax - 50, i / 8), ya + (i % 2 ? -22 : 22) * Math.sin(lt * 20 + i)]);
    wline(g, pts, 9, C.ink, 1030); wline(g, pts, 5, C.gold, 1030);
    g.restore();
    for (let i = 0; i < 4; i++) {
      const v = ((lt - cu.spark) * 0.8 + i / 4) % 1;
      heart(g, (wx + ax) / 2 + Math.sin(i * 2 + v * 5) * 50, ya - 40 - v * 240, 1.1 + 0.3 * Math.sin(v * 7), C.coral, (1 - v) * u);
    }
  }
  if (married) {
    const v = lt - wed;
    for (let i = 0; i < 40; i++) {
      const x = (i * 73) % W, y = ((v * (160 + (i % 5) * 40) + i * 47) % 900) + 300, a = v * 3 + i;
      at(g, x + Math.sin(a) * 20, y, 1, a, () => ink(g, wrect(-8, -5, 16, 10, 0.4, 1040 + i), [C.coral, C.gold, C.teal, C.pink, C.white][i % 5], 2));
    }
    heart(g, (wx + ax) / 2, 520 + Math.sin(lt * 3) * 10, 2.6 * pop(wed, lt, 0.5), C.red);
  }
};

// ------------------------------------------------------------------ teacher
SCENES.teacher = (g, lt, sc) => {
  const cu = sc.cues;
  g.fillStyle = '#cfe6e3'; g.fillRect(0, 0, W, H);
  cloud(g, 220 + lt * 6, 420, 1.0, C.white, 1101); cloud(g, 880 - lt * 5, 520, 0.7, C.white, 1102);
  // distant downs and Salisbury's spire
  ink(g, wcurve([[-20, 800], [200, 720], [450, 760], [700, 700], [1100, 760], [1100, 900], [-20, 900]], 2, 1103), '#a9c39a');
  ink(g, wpoly([[860, 760], [872, 560], [884, 760]], 0.6, 1104), '#8a8f9a', 3);
  ink(g, wrect(838, 720, 70, 50, 0.6, 1105), '#8a8f9a', 3);
  // the earthwork ring (hill fort)
  ink(g, wcurve([[-20, 1000], [300, 960], [520, 830], [700, 780], [900, 800], [1100, 860], [1100, 1950], [-20, 1950]], 2, 1106), C.grass);
  ink(g, wcurve([[480, 860], [600, 770], [760, 740], [920, 760], [1100, 820], [1100, 860], [920, 820], [760, 800], [620, 830]], 1.6, 1107), C.grassD, 4);
  const split = ss(cu.split, cu.split + 0.8, lt);
  const kidsA = [[640, 830, 51], [760, 800, 52], [880, 812, 53], [990, 840, 54]];   // defenders on the rampart
  const kidsB = [[150, 1120, 55], [280, 1150, 56], [410, 1110, 57], [90, 1190, 58]]; // attackers
  const charge = ss(cu.charge, cu.clash, lt);
  const clash = lt > cu.clash;
  kidsA.forEach(([x, y, sd], i) => {
    const sx = lerp(300 + i * 140, x, split), sy = lerp(1150, y, split);
    person(g, { kid: true, x: sx, y: sy, s: 0.8, t: lt, top: lerp(0, 1, split) > 0.5 ? C.red : C.cream, hair: ['#3e2a1c', '#a0522d', '#2b1d14', '#c27a3a'][i], hairStyle: 'kid',
      bottom: C.navy, shorts: true, seed: sd, mouth: split > 0.5 ? 'grin' : 'smile', angry: split * 0.7, look: -1,
      armL: split > 0.5 ? 2.6 + Math.sin(lt * 6 + i) * 0.2 : 0.3, armR: split > 0.5 ? 0.6 : 0.3, bob: split > 0.5 ? Math.abs(Math.sin(lt * 6 + i)) * 10 : 0,
      handL: split > 0.5 ? (gg, hx, hy) => { limb(gg, [[hx, hy + 20], [hx, hy - 70]], C.wood, 6, 3, 1110 + i); ink(gg, wpoly([[hx, hy - 70], [hx + 46, hy - 56], [hx, hy - 42]], 0.6, 1111 + i), C.red, 3); } : null });
  });
  kidsB.forEach(([x, y, sd], i) => {
    if (split <= 0.01) return;
    const sx = lerp(x, 520 + i * 70, charge * 0.75), sy = lerp(y, 960 - i * 10, charge * 0.75);
    alpha(g, split, () => person(g, { kid: true, x: sx, y: sy, s: 0.85, t: lt, top: C.navy, hair: ['#2b1d14', '#c27a3a', '#3e2a1c', '#a0522d'][i], hairStyle: 'kid', bottom: '#4a3d33', shorts: true, seed: sd,
      mouth: lt > cu.charge ? 'grin' : 'smile', angry: 0.8, look: 1, walk: lt * 12 + i, stride: lt > cu.charge && !clash ? 0.9 : 0, lean: lt > cu.charge ? 0.12 : 0,
      armR: 2.6, armL: 0.9, handR: (gg, hx, hy) => { limb(gg, [[hx, hy + 20], [hx, hy - 70]], C.wood, 6, 3, 1120 + i); ink(gg, wpoly([[hx, hy - 70], [hx + 46, hy - 56], [hx, hy - 42]], 0.6, 1121 + i), '#3b6fb6', 3); } }));
  });
  if (clash) brawl(g, 680, 900, 170, lt, pop(cu.clash, lt, 0.3), 3);
  // Golding watches and takes notes
  const writing = (lt - cu.write) * 0.3;
  person(g, Object.assign({}, WILL.young, { x: 170, y: 1240, s: 1.5, t: lt, coat: '#7a6a4f', top: '#e9e3d4', tie: C.green, look: 1, brow: lt > cu.charge ? 0.9 : 0.3,
    mouth: lt > cu.clash ? 'smirk' : 'flat', armR: 1.3, elbR: 1.4, armL: 1.1, elbL: 1.2,
    handR: (gg, x, y) => propNotebook(gg, x - 20, y - 10, 1.15, lt, clamp(writing % 1.2)) }));
};

