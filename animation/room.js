'use strict';
// The room, seen in side elevation with a slightly raised floor plane.
// S.w (0 cold night .. 1 warm morning) drives every colour.

const ROOM = {
  floorLine: 1520, floorFront: 1690,
  win: { x0: 630, x1: 990, y0: 340, y1: 1000 },
  desk: { x0: 600, x1: 1150, top: 1240, front: 1292, apron: 1318, floor: 1604 },
  shelf: { x0: 36, x1: 380, y: 700 },
  shelf2: { x0: 36, x1: 300, y: 948 },
  clock: { x: 205, y: 425, r: 74 }
};

const BOOK_COLS = ['#7b2d26', '#2d4a6b', '#c79a3e', '#3f5e45', '#5a3d5c', '#a35a32', '#1f3b4d', '#8c6d3f'];
const BOOK_GREYS = ['#2a2f3a', '#252a33', '#30353f', '#22262e', '#2c303a', '#272b34', '#2f3440', '#262a31'];

function roomPalette(w) {
  const m = (a, b) => mixc(a, b, w);
  return {
    wallTop: m('#0c111b', '#c9ab7f'), wallMid: m('#141b28', '#e6cfa6'), wallLow: m('#121824', '#dcc098'),
    base: m('#0d1119', '#cdb38c'), floorBack: m('#0b0e15', '#8e6644'), floorFront: m('#121722', '#b48659'),
    board: m('#080b11', '#7b5536'), rug: m('#171c27', '#d8c6a2'), rugStripe: m('#1f2533', '#b5966a'),
    deskTop: m('#1d212b', '#a77650'), deskFront: m('#14171e', '#7f5535'), deskDark: m('#0c0e13', '#5b3a24'),
    frame: m('#232a38', '#f2ebdf'), frameShadow: m('#11151e', '#cbbda6'),
    curtain: m('#192030', '#efe3cc'), curtainDark: m('#0f1420', '#cdb995'),
    wood: m('#1a1d25', '#8a5d3b'), woodDark: m('#101218', '#5f3e27'),
    paper: m('#5e6370', '#f6eedc'), paperShadow: m('#3a3f4a', '#d8c7a6'),
    metal: m('#2a2f3a', '#3a3a3c'), clockFace: m('#4b5263', '#f7f1e3'), clockRim: m('#262c39', '#4a3324'),
    ink: m('#141820', '#2a1f18'), pot: m('#2b2f39', '#c2683f'), potDark: m('#1c1f27', '#8f4a2d'),
    leaf: m('#2c3a36', '#4f8a4a'), leafHi: m('#3c4a46', '#86bd62'), leafDark: m('#1a2321', '#2f5e31'),
    mug: m('#3a404d', '#e9e2d4'), lampCol: m('#1e222b', '#2d3e3a'),
    sky0: m('#070c17', '#a9cde3'), sky1: m('#0f1a2c', '#f2e2bd'), sky2: m('#16243a', '#f8cf8e'),
    city: m('#05080e', '#c49a73'), cityFar: m('#0a101b', '#ddbd92'),
    chair: m('#14171f', '#2e3138'), chairHi: m('#2b313e', '#4a4e57')
  };
}

function drawRoomBack(ctx, S) {
  const w = S.w, R = ROOM, C = roomPalette(w);
  const wi = R.win;

  // ---- wall ----
  let g = ctx.createLinearGradient(0, -600, 0, R.floorLine);
  g.addColorStop(0, rgb(C.wallTop)); g.addColorStop(0.55, rgb(C.wallMid)); g.addColorStop(1, rgb(C.wallLow));
  ctx.fillStyle = g; ctx.fillRect(-900, -900, 2900, R.floorLine + 900);
  // light falloff from the window on the wall
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  g = ctx.createRadialGradient(810, 640, 50, 810, 640, 1100);
  g.addColorStop(0, rgb(mixc('#1b2638', '#fff2d6', w), 0.55 + 0.2 * w));
  g.addColorStop(1, rgb(mixc('#1b2638', '#fff2d6', w), 0));
  ctx.fillStyle = g; ctx.fillRect(-900, -900, 2900, R.floorLine + 900);
  ctx.restore();

  // ---- floor ----
  g = ctx.createLinearGradient(0, R.floorLine, 0, 2400);
  g.addColorStop(0, rgb(C.floorBack)); g.addColorStop(1, rgb(C.floorFront));
  ctx.fillStyle = g; ctx.fillRect(-900, R.floorLine, 2900, 1200);
  ctx.strokeStyle = rgb(C.board, 0.55); ctx.lineWidth = 2;
  for (let k = 1; k < 14; k++) {
    const y = R.floorLine + 900 * Math.pow(k / 14, 1.7);
    ctx.beginPath(); ctx.moveTo(-900, y); ctx.lineTo(2000, y); ctx.stroke();
    for (let j = 0; j < 8; j++) {
      const x = -400 + ((j * 397 + k * 211) % 2400);
      const y2 = R.floorLine + 900 * Math.pow((k + 1) / 14, 1.7);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (x - 540) * 0.08, y2); ctx.stroke();
    }
  }
  // baseboard
  ctx.fillStyle = rgb(C.base); ctx.fillRect(-900, R.floorLine - 26, 2900, 26);
  ctx.fillStyle = rgb(shade(C.base, 0.7)); ctx.fillRect(-900, R.floorLine - 2, 2900, 4);

  // ---- rug ----
  ctx.save();
  const rug = new Path2D();
  rug.moveTo(150, 1600); rug.lineTo(780, 1600); rug.lineTo(860, 1780); rug.lineTo(60, 1780); rug.closePath();
  ctx.fillStyle = rgb(C.rug); ctx.fill(rug);
  ctx.clip(rug);
  ctx.strokeStyle = rgb(C.rugStripe, 0.8); ctx.lineWidth = 6;
  for (const yy of [1622, 1758]) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(900, yy); ctx.stroke(); }
  ctx.lineWidth = 2;
  for (const yy of [1634, 1746]) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(900, yy); ctx.stroke(); }
  ctx.restore();

  drawWindow(ctx, S, C);
  drawShelves(ctx, S, C);
  drawClock(ctx, S, C);
  drawDesk(ctx, S, C);
  drawFloorClutter(ctx, S, C);
}

function drawWindow(ctx, S, C) {
  const w = S.w, wi = ROOM.win, t = S.t;
  const ww = wi.x1 - wi.x0, wh = wi.y1 - wi.y0;
  // sky
  let g = ctx.createLinearGradient(0, wi.y0, 0, wi.y1);
  g.addColorStop(0, rgb(C.sky0)); g.addColorStop(0.6, rgb(C.sky1)); g.addColorStop(1, rgb(C.sky2));
  ctx.fillStyle = g; ctx.fillRect(wi.x0, wi.y0, ww, wh);
  ctx.save();
  ctx.beginPath(); ctx.rect(wi.x0, wi.y0, ww, wh); ctx.clip();
  // night: stars + thin crescent moon
  const night = 1 - w;
  if (night > 0.01) {
    const rnd = mulberry32(7);
    for (let i = 0; i < 40; i++) {
      const x = wi.x0 + rnd() * ww, y = wi.y0 + rnd() * wh * 0.6, s = rnd();
      const tw = 0.6 + 0.4 * Math.sin(t * (1 + s * 2) + i);
      ctx.fillStyle = rgb('#c8d4ee', night * (0.25 + s * 0.5) * tw);
      ctx.fillRect(x, y, 1.5 + s * 1.5, 1.5 + s * 1.5);
    }
    const mx = 720, my = 470;
    ctx.save(); ctx.globalAlpha = night;
    drawGlow(ctx, mx, my, 90, '#8fa6cc', 0.35);
    ctx.fillStyle = '#d9e2f2';
    ctx.beginPath(); ctx.arc(mx, my, 22, 0, TAU); ctx.arc(mx + 10, my - 6, 20, 0, TAU, true); ctx.fill('evenodd');
    ctx.restore();
  }
  // sun glow
  if (w > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    drawGlow(ctx, 930, 860 - w * 120, 420, '#ffd58a', 0.9 * w);
    drawGlow(ctx, 930, 860 - w * 120, 120, '#fff4d8', w);
    ctx.restore();
  }
  // city silhouettes (far and near)
  const rnd2 = mulberry32(21);
  for (const [layerCol, base, hmin, hmax, wmin] of [[C.cityFar, 900, 60, 170, 40], [C.city, 940, 40, 120, 60]]) {
    let x = wi.x0 - 20;
    while (x < wi.x1 + 20) {
      const bw = wmin + rnd2() * 70, bh = hmin + rnd2() * (hmax - hmin);
      ctx.fillStyle = rgb(layerCol);
      ctx.fillRect(x, base - bh + 60, bw, bh + 200);
      // lit windows at night
      if (night > 0.05) {
        for (let k = 0; k < 6; k++) {
          if (rnd2() < 0.45) {
            ctx.fillStyle = rgb('#c9a96a', 0.35 * night);
            ctx.fillRect(x + 6 + rnd2() * (bw - 14), base - bh + 70 + rnd2() * bh * 0.8, 5, 7);
          }
        }
      } else { rnd2(); rnd2(); rnd2(); }
      x += bw + 4;
    }
  }
  // morning: birds
  if (w > 0.3) {
    ctx.strokeStyle = rgb('#4a3a30', (w - 0.3) * 0.8); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const bx = wi.x0 + ((t * 40 + i * 90) % (ww + 100)) - 50, by = 560 + i * 40 + Math.sin(t * 2 + i) * 8;
      const f = Math.sin(t * 12 + i * 2) * 5;
      ctx.beginPath(); ctx.moveTo(bx - 9, by - f); ctx.quadraticCurveTo(bx - 3, by - 3, bx, by); ctx.quadraticCurveTo(bx + 3, by - 3, bx + 9, by - f); ctx.stroke();
    }
  }
  ctx.restore();
  // frame + mullions
  ctx.fillStyle = rgb(C.frame);
  const f = 18;
  ctx.fillRect(wi.x0 - f, wi.y0 - f, ww + 2 * f, f); ctx.fillRect(wi.x0 - f, wi.y1, ww + 2 * f, f);
  ctx.fillRect(wi.x0 - f, wi.y0, f, wh); ctx.fillRect(wi.x1, wi.y0, f, wh);
  ctx.fillRect((wi.x0 + wi.x1) / 2 - 6, wi.y0, 12, wh); ctx.fillRect(wi.x0, wi.y0 + wh * 0.42 - 6, ww, 12);
  ctx.fillStyle = rgb(C.frameShadow, 0.7);
  ctx.fillRect(wi.x0, wi.y0, ww, 6); ctx.fillRect(wi.x0, wi.y0, 6, wh);
  // sill
  ctx.fillStyle = rgb(C.frame); ctx.fillRect(wi.x0 - 40, wi.y1 + f, ww + 80, 16);
  ctx.fillStyle = rgb(C.frameShadow); ctx.fillRect(wi.x0 - 40, wi.y1 + f + 16, ww + 80, 6);
  drawPlant(ctx, S, C, 760, wi.y1 + f);
  drawCurtains(ctx, S, C);
}

function drawCurtains(ctx, S, C) {
  const t = S.t, w = S.w, wi = ROOM.win;
  const gap = lerp(170, 330, S.curtain);
  const cx = 810, top = 292, bottom = 1075;
  ctx.fillStyle = rgb(C.woodDark);
  ctx.fillRect(555, top - 10, 510, 10);
  ctx.beginPath(); ctx.arc(555, top - 5, 9, 0, TAU); ctx.arc(1065, top - 5, 9, 0, TAU); ctx.fill();
  const sway = (k) => Math.sin(t * 1.3 + k) * (3 + 10 * S.breeze);
  for (const side of [-1, 1]) {
    const inner = cx + side * gap / 2, outer = side < 0 ? 560 : 1060;
    const x0 = Math.min(inner, outer), x1 = Math.max(inner, outer);
    const p = new Path2D();
    p.moveTo(x0, top);
    p.lineTo(x1, top);
    const bi = side < 0 ? x1 : x0; // bottom inner edge flares out
    if (side < 0) {
      p.bezierCurveTo(x1 + sway(1), 600, x1 + 22 + sway(2), 900, x1 + 30 + sway(3), bottom);
      p.lineTo(x0 - 10, bottom); p.closePath();
    } else {
      p.lineTo(x1 + 10, bottom); p.lineTo(x0 - 30 + sway(3), bottom);
      p.bezierCurveTo(x0 - 22 + sway(2), 900, x0 + sway(1), 600, x0, top); p.closePath();
    }
    ctx.fillStyle = rgb(C.curtain); ctx.fill(p);
    // folds
    ctx.save(); ctx.clip(p);
    const fw = 34;
    for (let x = x0 - 40; x < x1 + 40; x += fw) {
      const gg = ctx.createLinearGradient(x, 0, x + fw, 0);
      gg.addColorStop(0, rgb(C.curtainDark, 0.0)); gg.addColorStop(0.5, rgb(C.curtainDark, 0.55)); gg.addColorStop(1, rgb(C.curtainDark, 0));
      ctx.fillStyle = gg; ctx.fillRect(x + sway(x) * 0.3, top, fw, bottom - top);
    }
    // sun shining through the linen
    if (w > 0.01) {
      ctx.globalCompositeOperation = 'screen';
      const sg = ctx.createLinearGradient(0, top, 0, bottom);
      sg.addColorStop(0, rgb('#ffdca0', 0.0)); sg.addColorStop(0.5, rgb('#ffdca0', 0.35 * w)); sg.addColorStop(1, rgb('#ffdca0', 0.1 * w));
      ctx.fillStyle = sg; ctx.fillRect(x0 - 40, top, x1 - x0 + 80, bottom - top);
    }
    ctx.restore();
  }
}

function drawPlant(ctx, S, C, x, y) {
  const h = S.plant, t = S.t;
  // pot
  ctx.fillStyle = rgb(C.pot);
  ctx.beginPath(); ctx.moveTo(x - 34, y - 58); ctx.lineTo(x + 34, y - 58); ctx.lineTo(x + 26, y); ctx.lineTo(x - 26, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgb(C.potDark); ctx.fillRect(x - 37, y - 64, 74, 12);
  ctx.fillStyle = rgb(C.potDark, 0.5); ctx.fillRect(x - 30, y - 52, 14, 50);
  // leaves on stems; droop interpolates into upright growth
  const leaves = [
    [-1.25, 92, 1.0], [-0.75, 120, 1.1], [-0.25, 138, 1.15], [0.2, 130, 1.1], [0.7, 112, 1.0], [1.2, 88, 0.9], [-0.05, 160, 0.8]
  ];
  for (let i = 0; i < leaves.length; i++) {
    const [a0, len0, sz] = leaves[i];
    const isNew = i === leaves.length - 1;
    const grow = isNew ? ss(0.55, 1, h) : 1;
    if (grow <= 0.01) continue;
    const sw = Math.sin(t * 1.4 + i) * 0.03 * (0.3 + S.breeze);
    const droop = 1 - h;
    const a = a0 * (1 + droop * 0.5) + sw;            // spread
    const len = len0 * lerp(0.75, 1.0, h) * grow;
    const tipx = x + Math.sin(a) * len * 0.75, tipy = y - 62 - Math.cos(a) * len * lerp(0.35, 1, h) + droop * Math.abs(Math.sin(a)) * 60;
    const midx = x + Math.sin(a) * len * 0.35, midy = y - 62 - len * lerp(0.45, 0.8, h);
    ctx.strokeStyle = rgb(C.leafDark); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + a0 * 6, y - 62); ctx.quadraticCurveTo(midx, midy, tipx, tipy); ctx.stroke();
    // leaf blade
    const ang = Math.atan2(tipy - midy, tipx - midx);
    ctx.save(); ctx.translate(tipx, tipy); ctx.rotate(ang);
    const L = 46 * sz * grow, Wd = 17 * sz * grow;
    const lp = new Path2D();
    lp.moveTo(0, 0); lp.quadraticCurveTo(L * 0.4, -Wd, L, 0); lp.quadraticCurveTo(L * 0.4, Wd, 0, 0);
    ctx.fillStyle = rgb(mixc(C.leafDark, C.leaf, 0.3 + 0.7 * h)); ctx.fill(lp);
    ctx.strokeStyle = rgb(C.leafHi, 0.6); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(L * 0.9, 0); ctx.stroke();
    ctx.restore();
  }
}

function drawShelves(ctx, S, C) {
  const w = S.w;
  for (const sh of [ROOM.shelf, ROOM.shelf2]) {
    ctx.fillStyle = rgb(C.wood); ctx.fillRect(sh.x0, sh.y, sh.x1 - sh.x0, 16);
    ctx.fillStyle = rgb(C.woodDark); ctx.fillRect(sh.x0, sh.y + 16, sh.x1 - sh.x0, 5);
    ctx.fillRect(sh.x0 + 30, sh.y + 16, 8, 30); ctx.fillRect(sh.x1 - 40, sh.y + 16, 8, 30);
  }
  // upper shelf books
  const rnd = mulberry32(5);
  let x = ROOM.shelf.x0 + 14;
  for (let i = 0; i < 11; i++) {
    const bw = 18 + rnd() * 16, bh = 88 + rnd() * 44, lean = i === 7 ? -0.18 : 0;
    const c = mixc(BOOK_GREYS[i % 8], BOOK_COLS[(i * 3) % 8], w);
    drawBookSpine(ctx, x, ROOM.shelf.y, bw, bh, c, lean, w);
    x += bw + 2 + (i === 6 ? 14 : 0);
    if (x > ROOM.shelf.x1 - 40) break;
  }
  // small hourglass on the upper shelf
  const hx = ROOM.shelf.x1 - 30, hy = ROOM.shelf.y;
  ctx.fillStyle = rgb(C.woodDark); ctx.fillRect(hx - 16, hy - 6, 32, 6); ctx.fillRect(hx - 16, hy - 66, 32, 6);
  ctx.fillStyle = rgb(mixc('#3a4152', '#e8dcc0', w), 0.6);
  ctx.beginPath(); ctx.moveTo(hx - 12, hy - 60); ctx.lineTo(hx + 12, hy - 60); ctx.lineTo(hx + 2, hy - 33); ctx.lineTo(hx + 12, hy - 6); ctx.lineTo(hx - 12, hy - 6); ctx.lineTo(hx - 2, hy - 33); ctx.closePath(); ctx.fill();

  // lower shelf: empty-ish when messy; books arrive as the room is tidied
  const tidy = S.tidy;
  x = ROOM.shelf2.x0 + 16;
  const rnd2 = mulberry32(11);
  for (let i = 0; i < 9; i++) {
    const bw = 18 + rnd2() * 14, bh = 80 + rnd2() * 40;
    const appear = ss(i * 0.06, i * 0.06 + 0.4, tidy);
    if (appear > 0.01) {
      ctx.save(); ctx.globalAlpha *= appear;
      drawBookSpine(ctx, x, ROOM.shelf2.y + (1 - appear) * -20, bw, bh, mixc(BOOK_GREYS[(i + 2) % 8], BOOK_COLS[(i * 5 + 1) % 8], w), 0, w);
      ctx.restore();
    }
    x += bw + 2;
  }
  // one lonely tilted book when messy
  if (tidy < 0.99) {
    ctx.save(); ctx.globalAlpha *= 1 - tidy;
    drawBookSpine(ctx, ROOM.shelf2.x0 + 150, ROOM.shelf2.y, 26, 96, mixc(BOOK_GREYS[3], BOOK_COLS[2], w), -0.5, w);
    ctx.restore();
  }
}

function drawBookSpine(ctx, x, baseY, bw, bh, c, lean, w) {
  ctx.save();
  ctx.translate(x, baseY); ctx.rotate(lean);
  ctx.fillStyle = rgb(c); ctx.fillRect(0, -bh, bw, bh);
  ctx.fillStyle = rgb(shade(c, 0.7)); ctx.fillRect(bw - 4, -bh, 4, bh);
  ctx.fillStyle = rgb(mixc('#6b6f7a', '#e2c27a', w), 0.55);
  ctx.fillRect(3, -bh + 12, bw - 7, 3); ctx.fillRect(3, -22, bw - 7, 3);
  ctx.restore();
}

function drawClock(ctx, S, C) {
  const { x, y, r } = ROOM.clock;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(x + 6, y + 8, r + 6, 0, TAU); ctx.fill();
  ctx.fillStyle = rgb(C.clockRim); ctx.beginPath(); ctx.arc(x, y, r + 8, 0, TAU); ctx.fill();
  ctx.fillStyle = rgb(C.clockFace); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgb(C.ink, 0.85);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, l = i % 3 === 0 ? 12 : 6;
    ctx.lineWidth = i % 3 === 0 ? 3.5 : 2;
    ctx.beginPath(); ctx.moveTo(x + Math.sin(a) * (r - 6), y - Math.cos(a) * (r - 6));
    ctx.lineTo(x + Math.sin(a) * (r - 6 - l), y - Math.cos(a) * (r - 6 - l)); ctx.stroke();
  }
  const hrs = S.clockH;
  const ha = (hrs % 12) / 12 * TAU, ma = (hrs % 1) * TAU;
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgb(C.ink); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ha) * r * 0.48, y - Math.cos(ha) * r * 0.48); ctx.stroke();
  ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ma) * r * 0.74, y - Math.cos(ma) * r * 0.74); ctx.stroke();
  // second hand blur when time races
  if (S.clockBlur > 0.01) {
    ctx.save(); ctx.globalAlpha = 0.12 * S.clockBlur;
    for (let k = 1; k < 6; k++) {
      const a2 = ma - k * 0.12 * S.clockBlur;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(a2) * r * 0.74, y - Math.cos(a2) * r * 0.74); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = rgb(mixc('#8a6a3a', '#b8862f', S.w)); ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
}

function drawDesk(ctx, S, C) {
  const d = ROOM.desk, w = S.w;
  // contact shadow
  const sg = ctx.createRadialGradient(870, d.floor, 10, 870, d.floor, 320);
  sg.addColorStop(0, 'rgba(0,0,0,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.fillRect(500, d.floor - 60, 760, 120);
  // legs / drawer unit
  ctx.fillStyle = rgb(C.deskDark); ctx.fillRect(612, d.apron, 24, d.floor - d.apron);
  ctx.fillStyle = rgb(C.deskFront); ctx.fillRect(900, d.apron, 260, d.floor - d.apron);
  ctx.fillStyle = rgb(C.deskDark);
  for (let i = 0; i < 3; i++) {
    const y0 = d.apron + 12 + i * 92;
    ctx.fillRect(912, y0 + 84, 240, 3);
    ctx.fillStyle = rgb(mixc('#454b58', '#d7b46e', w)); ctx.fillRect(1000, y0 + 38, 54, 7);
    ctx.fillStyle = rgb(C.deskDark);
  }
  // top
  ctx.fillStyle = rgb(C.deskTop);
  ctx.beginPath(); ctx.moveTo(d.x0 + 10, d.top); ctx.lineTo(d.x1, d.top); ctx.lineTo(d.x1, d.front); ctx.lineTo(d.x0, d.front); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgb(C.deskFront); ctx.fillRect(d.x0, d.front, d.x1 - d.x0, d.apron - d.front);
  ctx.fillStyle = rgb(mixc('#2b303b', '#c8986a', w), 0.6); ctx.fillRect(d.x0, d.front - 1, d.x1 - d.x0, 2);
}

// objects lying on the desk top (drawn after the character's far side, before near arm)
function drawDeskItems(ctx, S) {
  const w = S.w, C = roomPalette(w), d = ROOM.desk;
  const t = S.t;
  // lamp (back right)
  ctx.save();
  ctx.strokeStyle = rgb(C.lampCol); ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.fillStyle = rgb(C.lampCol);
  ctx.beginPath(); ctx.ellipse(1050, d.top + 10, 40, 9, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1050, d.top + 6); ctx.lineTo(1090, d.top - 150); ctx.lineTo(1010, d.top - 230); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1010, d.top - 230); ctx.lineTo(980, d.top - 262); ctx.lineTo(950, d.top - 196); ctx.closePath(); ctx.fill();
  ctx.restore();

  // book stack: unused/dusty at first; becomes a neat stack of read books, growing over time
  const n = 3 + Math.floor(S.stack);
  const frac = S.stack - Math.floor(S.stack);
  let y = d.front - 8;
  for (let i = 0; i < n + 1; i++) {
    const a = i < n ? 1 : frac;
    if (a <= 0.01) break;
    const bh = 22 + ((i * 7) % 3) * 4, bw = 150 - ((i * 37) % 30);
    const bx = 950 + ((i * 13) % 17) - 8 + (1 - S.tidy) * ((i % 2) ? 14 : -10);
    const c = mixc(BOOK_GREYS[(i + 4) % 8], BOOK_COLS[(i * 3 + 2) % 8], w);
    ctx.save(); ctx.globalAlpha *= a;
    ctx.translate(bx, y - (1 - a) * 30); ctx.rotate((1 - S.tidy) * ((i % 2) ? 0.04 : -0.03));
    ctx.fillStyle = rgb(c); ctx.fillRect(-bw / 2, -bh, bw, bh);
    ctx.fillStyle = rgb(C.paper); ctx.fillRect(bw / 2 - 6, -bh + 4, 6, bh - 8);
    ctx.fillStyle = rgb(mixc('#6b6f7a', '#e2c27a', w), 0.6); ctx.fillRect(-bw / 2 + 10, -bh / 2 - 1.5, bw * 0.5, 3);
    // bookmark ribbon on read books
    if (S.tidy > 0.05 && i % 2 === 0) { ctx.fillStyle = rgb('#b8322a', S.tidy); ctx.fillRect(-bw / 2 + 20, -2, 5, 18); }
    ctx.restore();
    y -= bh;
  }
  // dust specks on the unused stack
  if (w < 0.6) {
    ctx.fillStyle = rgb('#8790a3', 0.25 * (1 - w));
    const rnd = mulberry32(3);
    for (let i = 0; i < 18; i++) ctx.fillRect(890 + rnd() * 120, y + rnd() * 6 - 2, 2, 1.5);
  }

  // mug
  ctx.fillStyle = rgb(C.mug);
  rr(ctx, 840, d.front - 58, 42, 52, 6); ctx.fill();
  ctx.strokeStyle = rgb(C.mug); ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(884, d.front - 34, 12, -1.3, 1.3); ctx.stroke();
  if (w > 0.5) { // steam
    ctx.strokeStyle = rgb('#ffffff', 0.25 * (w - 0.5)); ctx.lineWidth = 3;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath(); const sx = 852 + k * 16;
      ctx.moveTo(sx, d.front - 64);
      ctx.bezierCurveTo(sx + 10 * Math.sin(t * 2 + k), d.front - 90, sx - 10 * Math.sin(t * 2.3 + k), d.front - 110, sx + 4, d.front - 132); ctx.stroke();
    }
  }

  // notebook lying on the desk: half-open (cold) -> opened flat (writing)
  const nbx = 700, nby = d.front - 10;
  const open = S.nbOpen;
  ctx.fillStyle = rgb(mixc('#262a33', '#3d5a73', w));
  ctx.beginPath(); ctx.moveTo(nbx - 10, nby); ctx.lineTo(nbx + 150, nby); ctx.lineTo(nbx + 136, nby - 26); ctx.lineTo(nbx + 4, nby - 26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgb(C.paper);
  ctx.beginPath(); ctx.moveTo(nbx - 4, nby - 5); ctx.lineTo(nbx + 144, nby - 5); ctx.lineTo(nbx + 132, nby - 24); ctx.lineTo(nbx + 8, nby - 24); ctx.closePath(); ctx.fill();
  // cover standing half-open (lies flat as open -> 1)
  const ca = lerp(-0.85, -3.1, open);
  ctx.save(); ctx.translate(nbx - 6, nby - 6); ctx.rotate(ca);
  ctx.fillStyle = rgb(mixc('#2e333e', '#4a6c88', w)); ctx.fillRect(0, -3, 150, 6);
  ctx.restore();
  // pencil
  ctx.save(); ctx.translate(nbx + 170, nby - 6); ctx.rotate(-0.08);
  ctx.globalAlpha *= 1 - S.penHeld;
  ctx.fillStyle = rgb(mixc('#3b3f48', '#d9a441', w)); ctx.fillRect(0, -3, 80, 6);
  ctx.fillStyle = rgb(C.ink); ctx.fillRect(80, -1.5, 8, 3);
  ctx.restore();

  // phone placed face-down on the desk
  if (S.phoneOnDesk > 0.01) {
    ctx.save(); ctx.globalAlpha *= S.phoneOnDesk;
    ctx.fillStyle = '#0d0e12'; rr(ctx, 630, d.front - 16, 70, 9, 3); ctx.fill();
    ctx.restore();
  }
}

function drawChair(ctx, S, x) {
  const C = roomPalette(S.w), seatY = 1440;
  ctx.save();
  // floor contact shadow
  const g = ctx.createRadialGradient(x + 20, 1690, 10, x + 20, 1690, 230);
  g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 240, 1630, 520, 120);
  // base
  ctx.strokeStyle = rgb(C.chair); ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 10, 1636); ctx.lineTo(x - 110, 1662); ctx.moveTo(x + 10, 1636); ctx.lineTo(x + 140, 1662);
  ctx.moveTo(x + 10, 1636); ctx.lineTo(x + 20, 1672); ctx.stroke();
  ctx.fillStyle = rgb(C.chair);
  for (const cx of [x - 110, x + 140, x + 20]) { ctx.beginPath(); ctx.arc(cx, 1676, 11, 0, TAU); ctx.fill(); }
  ctx.fillStyle = rgb(C.chairHi); ctx.fillRect(x + 2, seatY + 30, 16, 1636 - seatY - 30);
  // back support + backrest
  ctx.strokeStyle = rgb(C.chair); ctx.lineWidth = 14;
  ctx.beginPath(); ctx.moveTo(x - 40, seatY + 18); ctx.lineTo(x - 82, seatY + 10); ctx.lineTo(x - 96, seatY - 120); ctx.stroke();
  ctx.save(); ctx.translate(x - 100, seatY - 200); ctx.rotate(-0.14);
  ctx.fillStyle = rgb(C.chair); rr(ctx, -26, -120, 46, 250, 22); ctx.fill();
  ctx.fillStyle = rgb(C.chairHi, 0.6); rr(ctx, -20, -112, 10, 230, 6); ctx.fill();
  ctx.restore();
  // seat
  ctx.fillStyle = rgb(C.chair); rr(ctx, x - 96, seatY, 212, 32, 14); ctx.fill();
  ctx.fillStyle = rgb(C.chairHi, 0.7); rr(ctx, x - 90, seatY + 2, 200, 6, 3); ctx.fill();
  ctx.restore();
}

function drawFloorClutter(ctx, S, C) {
  const a = 1 - S.tidy;
  if (a <= 0.01) return;
  const w = S.w;
  ctx.save(); ctx.globalAlpha *= a;
  // two books stacked carelessly
  for (const [x, y, bw, bh, r, ci] of [[120, 1700, 150, 26, 0.05, 1], [130, 1674, 130, 24, -0.09, 4]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(r);
    ctx.fillStyle = rgb(mixc(BOOK_GREYS[ci], BOOK_COLS[ci], w)); ctx.fillRect(-bw / 2, -bh, bw, bh);
    ctx.fillStyle = rgb(C.paper); ctx.fillRect(bw / 2 - 6, -bh + 4, 6, bh - 8);
    ctx.restore();
  }
  // open book face down (tent)
  ctx.fillStyle = rgb(mixc(BOOK_GREYS[2], BOOK_COLS[0], w));
  ctx.beginPath(); ctx.moveTo(500, 1780); ctx.lineTo(560, 1738); ctx.lineTo(620, 1780); ctx.lineTo(612, 1783); ctx.lineTo(560, 1748); ctx.lineTo(508, 1783); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgb(C.paperShadow);
  ctx.beginPath(); ctx.moveTo(508, 1783); ctx.lineTo(560, 1748); ctx.lineTo(612, 1783); ctx.closePath(); ctx.fill();
  // crumpled paper
  for (const [x, y, r] of [[760, 1730, 17], [222, 1815, 14], [880, 1655, 12]]) {
    ctx.fillStyle = rgb(C.paper);
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      const an = k / 9 * TAU, rr2 = r * (0.8 + 0.3 * hash1(k + x));
      ctx.lineTo(x + Math.cos(an) * rr2, y + Math.sin(an) * rr2 * 0.8);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgb(C.paperShadow); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - 2); ctx.lineTo(x + 2, y + 3); ctx.lineTo(x + r * 0.4, y - 4); ctx.stroke();
  }
  ctx.restore();
}

// god rays from the window (screen blend), drawn over everything in the room
function drawSunRays(ctx, S) {
  const w = S.w * S.sun;
  if (w <= 0.01) return;
  const t = S.t;
  const gap = lerp(170, 330, S.curtain);
  const cx = 810, x0 = cx - gap / 2 - 10, x1 = cx + gap / 2 + 10;
  const dx = -0.62 + S.sunShift * 0.12, dy = 1;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const u0 = i / bands, u1 = (i + 1) / bands;
    const a0x = lerp(x0, x1, u0), a1x = lerp(x0, x1, u1);
    const len = 1500;
    const flick = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 2.1)) * (0.6 + 0.4 * noise1(t * 0.5 + i * 3));
    const g = ctx.createLinearGradient(cx, 360, cx + dx * len * 0.8, 360 + len * 0.8);
    g.addColorStop(0, rgb('#ffe2a8', 0.34 * w * flick));
    g.addColorStop(0.5, rgb('#ffd38a', 0.18 * w * flick));
    g.addColorStop(1, rgb('#ffd38a', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(a0x, 360); ctx.lineTo(a1x, 360);
    ctx.lineTo(a1x + dx * len, 360 + dy * len); ctx.lineTo(a0x + dx * len, 360 + dy * len); ctx.closePath();
    ctx.fill();
  }
  // floor light pool
  const fg = ctx.createRadialGradient(470, 1700, 20, 470, 1700, 420);
  fg.addColorStop(0, rgb('#ffd79a', 0.35 * w)); fg.addColorStop(1, rgb('#ffd79a', 0));
  ctx.save(); ctx.translate(470, 1700); ctx.scale(1, 0.3); ctx.translate(-470, -1700);
  ctx.fillStyle = fg; ctx.fillRect(0, 1200, 1000, 1000);
  ctx.restore();
  // dust motes drifting in the beam
  const rnd = mulberry32(42);
  for (let i = 0; i < 60; i++) {
    const s = rnd(), along = (rnd() + t * 0.02 * (0.5 + s)) % 1, across = rnd();
    const bx = lerp(x0, x1, across) + dx * along * 1100 + Math.sin(t * 0.8 + i) * 12;
    const by = 360 + along * 1100 + Math.cos(t * 0.6 + i * 1.7) * 10;
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 7);
    drawGlow(ctx, bx, by, 4 + s * 5, '#fff0c8', w * 0.6 * tw);
  }
  ctx.restore();
}
