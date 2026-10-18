'use strict';
// The young man, drawn in profile facing right. All shapes are procedural so
// the camera can travel from a wide shot right into his eye without losing detail.

const U = 128;                       // head height in world px
const BODY = { torso: 236, ua: 120, fa: 112, thigh: 182, shin: 172 };

// ---- head geometry (head-local units, origin ~ centre of skull, facing +x) ----
const HEAD_PTS = [
  [-0.19, 0.66], [-0.20, 0.42], [-0.27, 0.27], [-0.37, 0.12], [-0.415, -0.08],
  [-0.37, -0.32], [-0.22, -0.49], [0.00, -0.55], [0.17, -0.50], [0.28, -0.39],
  [0.33, -0.25], [0.35, -0.135], [0.338, -0.07], [0.362, -0.005], [0.405, 0.066],
  [0.441, 0.112], [0.428, 0.142], [0.392, 0.150], [0.366, 0.160], [0.373, 0.197],
  [0.366, 0.222], [0.369, 0.247], [0.352, 0.281], [0.331, 0.299], [0.341, 0.343],
  [0.332, 0.392], [0.293, 0.428], [0.205, 0.446], [0.118, 0.455], [0.080, 0.50],
  [0.088, 0.66]
];
const LOWER_FACE_FROM = 21; // indices >= this belong to jaw (move when mouth opens)
const HAIR_PTS = [
  [0.318, -0.262], [0.272, -0.318], [0.316, -0.392], [0.262, -0.452], [0.236, -0.556],
  [0.10, -0.640], [-0.08, -0.648], [-0.27, -0.585], [-0.42, -0.44], [-0.475, -0.22],
  [-0.455, 0.0], [-0.385, 0.145], [-0.29, 0.21], [-0.235, 0.10], [-0.16, -0.035],
  [-0.06, -0.085], [0.015, -0.055], [0.04, 0.045], [0.07, -0.08], [0.13, -0.205],
  [0.215, -0.282]
];
const EAR_PTS = [[-0.02, -0.075], [0.022, -0.05], [0.028, 0.02], [0.012, 0.09], [-0.012, 0.135],
  [-0.05, 0.142], [-0.078, 0.10], [-0.085, 0.02], [-0.07, -0.05]];

function headPath(mouth) {
  const pts = HEAD_PTS.map((p, i) => {
    if (i >= LOWER_FACE_FROM && i <= 28) {
      const k = i <= 22 ? 0.6 : 1;
      return [p[0] - mouth * 0.012 * k, p[1] + mouth * 0.03 * k];
    }
    return p;
  });
  return curvePath(pts, true, 0.42);
}
const HAIR_PATH = curvePath(HAIR_PTS, true, 0.45);
const EAR_PATH = curvePath(EAR_PTS, true, 0.5);

// ---- lit fill: base + rim light crescent + form shadow ----
// ldx/ldy: direction *towards* the light (unit-ish). rim: px width of the rim (local units)
function litFill(ctx, path, base, rimCol, ldx, ldy, rim, rimAlpha, shadowCol, shadowAlpha, bounds) {
  ctx.fillStyle = rgb(base);
  ctx.fill(path);
  ctx.save();
  ctx.clip(path);
  if (shadowAlpha > 0.01 && bounds) {
    const [x0, y0, x1, y1] = bounds;
    const g = ctx.createLinearGradient(x0 + (x1 - x0) * (0.5 + ldx * 0.5), y0 + (y1 - y0) * (0.5 + ldy * 0.5),
      x0 + (x1 - x0) * (0.5 - ldx * 0.5), y0 + (y1 - y0) * (0.5 - ldy * 0.5));
    g.addColorStop(0, rgb(shadowCol, 0));
    g.addColorStop(0.55, rgb(shadowCol, shadowAlpha * 0.35));
    g.addColorStop(1, rgb(shadowCol, shadowAlpha));
    ctx.fillStyle = g;
    const pad = Math.max(x1 - x0, y1 - y0);
    ctx.fillRect(x0 - pad, y0 - pad, (x1 - x0) + pad * 2, (y1 - y0) + pad * 2);
  }
  if (rimAlpha > 0.01) {
    // rim crescent = path minus the path shifted away from the light
    const m = ctx.getTransform(), px = rim * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    const crescent = k => {
      const cres = new Path2D();
      cres.rect(-1e5, -1e5, 2e5, 2e5);
      cres.addPath(path, new DOMMatrix().translate(-ldx * rim * k, -ldy * rim * k));
      return cres;
    };
    if (px > 7) {
      // close-ups: one soft, blurred rim instead of visible steps
      ctx.filter = `blur(${(px * 0.3).toFixed(1)}px)`;
      ctx.fillStyle = rgb(rimCol, rimAlpha * 0.95);
      ctx.fill(crescent(0.8), 'evenodd');
      ctx.filter = 'none';
    } else {
      for (const [k, a] of [[1, 0.22], [0.78, 0.3], [0.55, 0.42], [0.32, 0.7]]) {
        ctx.fillStyle = rgb(rimCol, rimAlpha * a);
        ctx.fill(crescent(k), 'evenodd');
      }
    }
  }
  ctx.restore();
}

// two-bone IK; bend = +1 elbow/knee goes "down/back", -1 the other way
function ik(sx, sy, tx, ty, l1, l2, bend) {
  let dx = tx - sx, dy = ty - sy;
  let d = Math.hypot(dx, dy);
  const maxd = (l1 + l2) * 0.999;
  if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
  const a = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const ang = a + bend * Math.acos(cosA);
  const ex = sx + Math.cos(ang) * l1, ey = sy + Math.sin(ang) * l1;
  return [ex, ey, sx + dx, sy + dy];
}

// ---- character colours by lighting state ----
function charPalette(L) {
  const w = L.w;
  return {
    skin: mixc('#5d6170', '#cf9873', w),
    skinShadow: mixc('#1a1d29', '#6d3c2a', w),
    skinRim: L.rimCol,
    hair: mixc('#101119', '#2a1c17', w),
    hairHi: mixc('#5a6a86', '#a8774a', w),
    hood: mixc('#202838', '#4f6176', w),
    hoodDark: mixc('#131924', '#33404f', w),
    hoodShadow: mixc('#06080d', '#1c2129', w),
    pants: mixc('#14161d', '#2b2f38', w),
    pantsDark: mixc('#0b0c11', '#1c1f26', w),
    shoe: mixc('#4d5462', '#e9e1d2', w),
    shoeSole: mixc('#2b2f38', '#b8ab97', w),
    lip: mixc('#58505e', '#b46f5c', w),
    eyeWhite: mixc('#8c93a6', '#f3ece4', w),
    iris: mixc('#2a2620', '#4a2c18', w),
    brow: mixc('#0c0d12', '#24170f', w),
    line: mixc('#0b0d14', '#4a2a1d', w)
  };
}

// ---- head (incl. neck) ----
function drawHead(ctx, P, L, C) {
  const mouth = P.mouth || 0;
  const hp = headPath(mouth);
  const lx = L.ldx, ly = L.ldy;
  const sil = L.silhouette || 0;

  // neck shadow (under jaw) is part of the base fill via gradient
  litFill(ctx, hp, C.skin, C.skinRim, lx, ly, 0.018, L.rimA, C.skinShadow, 0.75, [-0.45, -0.6, 0.45, 0.66]);

  withClip(ctx, hp, () => {
    // jaw shadow onto neck
    ctx.fillStyle = rgb(C.skinShadow, 0.45);
    ctx.beginPath();
    ctx.moveTo(-0.25, 0.30); ctx.quadraticCurveTo(0.05, 0.36, 0.30, 0.44);
    ctx.lineTo(0.30, 0.75); ctx.lineTo(-0.25, 0.75); ctx.closePath();
    ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
    // cheek warmth
    if (L.w > 0.05) drawGlowLocal(ctx, 0.2, 0.12, 0.16, '#e0745a', 0.18 * L.w);
    // soft key light pooled on the face
    if (L.keyA > 0.01) {
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(L.kx, L.ky, 0, L.kx, L.ky, L.kr);
      g.addColorStop(0, rgb(L.keyCol, L.keyA));
      g.addColorStop(1, rgb(L.keyCol, 0));
      ctx.fillStyle = g; ctx.fillRect(-0.6, -0.8, 1.2, 1.6);
      ctx.globalCompositeOperation = 'source-over';
    }
    // smile line / cheek
    if ((P.smile || 0) > 0.02) {
      ctx.strokeStyle = rgb(C.skinShadow, 0.45 * P.smile);
      ctx.lineWidth = 0.008; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0.352, 0.168); ctx.quadraticCurveTo(0.318, 0.19, 0.322, 0.232 - P.smile * 0.012); ctx.stroke();
    }
  });

  // ear
  litFill(ctx, EAR_PATH, shade(C.skin, 0.94), C.skinRim, lx, ly, 0.012, L.rimA * 0.8, C.skinShadow, 0.6, [-0.09, -0.08, 0.03, 0.15]);
  ctx.strokeStyle = rgb(C.skinShadow, 0.55); ctx.lineWidth = 0.007; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-0.01, -0.035); ctx.quadraticCurveTo(-0.06, -0.03, -0.062, 0.03);
  ctx.quadraticCurveTo(-0.06, 0.08, -0.03, 0.105); ctx.stroke();

  drawFace(ctx, P, L, C, mouth, hp);

  // hair
  litFill(ctx, HAIR_PATH, C.hair, C.hairHi, lx, ly, 0.02, L.rimA * 0.9 + 0.08, '#000000', 0.5, [-0.48, -0.65, 0.32, 0.2]);
  withClip(ctx, HAIR_PATH, () => {
    ctx.strokeStyle = rgb(C.hairHi, 0.18 + L.rimA * 0.12);
    ctx.lineWidth = 0.006; ctx.lineCap = 'round';
    const strands = [
      [[-0.30, -0.50], [-0.05, -0.60], [0.22, -0.50]],
      [[-0.38, -0.30], [-0.15, -0.52], [0.20, -0.42]],
      [[-0.40, -0.05], [-0.30, -0.30], [0.05, -0.47]],
      [[0.00, -0.30], [0.15, -0.38], [0.29, -0.30]],
      [[-0.20, -0.15], [-0.10, -0.35], [0.12, -0.40]]
    ];
    for (const s of strands) { ctx.beginPath(); ctx.moveTo(...s[0]); ctx.quadraticCurveTo(...s[1], ...s[2]); ctx.stroke(); }
  });

  if (sil > 0.001) {
    // the mind scene: the head becomes a dark window into the brain
    const outline = new Path2D(); outline.addPath(hp); outline.addPath(HAIR_PATH);
    ctx.save();
    ctx.fillStyle = rgb('#05070d', sil * 0.92);
    ctx.fill(hp); ctx.fill(HAIR_PATH);
    ctx.restore();
  }
}

function drawGlowLocal(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgb(color, a)); g.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawFace(ctx, P, L, C, mouth, hp) {
  const lid = clamp(P.lid);           // 0 closed .. 1 wide
  const brow = P.brow || 0;           // -1 .. 1
  const smile = P.smile || 0;
  const gaze = P.gaze || 0;           // -1 down .. +1 up

  // ---- eye ----
  const ex = 0.285, ey = -0.032;
  const open = lerp(0.002, 0.05, lid);
  const upper = (u) => ey - open * 0.62 * Math.sin(Math.PI * (0.15 + u * 0.75)) - 0.004;
  const lower = (u) => ey + 0.012 + open * 0.18 * Math.sin(Math.PI * (0.1 + u * 0.8)) - smile * 0.007;
  // eye opening as path: from outer corner (u=0) to front (u=1)
  const eyeP = new Path2D();
  const x0 = 0.238, x1 = 0.318;
  eyeP.moveTo(x0, ey + 0.004);
  for (let i = 1; i <= 12; i++) { const u = i / 12; eyeP.lineTo(lerp(x0, x1, u), upper(u)); }
  eyeP.lineTo(x1 + 0.004, ey + 0.004);
  for (let i = 12; i >= 0; i--) { const u = i / 12; eyeP.lineTo(lerp(x0, x1, u) - 0.002, lower(u)); }
  eyeP.closePath();
  // socket shadow
  drawGlowLocal(ctx, 0.29, -0.05, 0.075, C.skinShadow, 0.55);
  ctx.fillStyle = rgb(C.eyeWhite); ctx.fill(eyeP);
  withClip(ctx, eyeP, () => {
    // shade at top of eyeball
    ctx.fillStyle = rgb(C.skinShadow, 0.45);
    ctx.fillRect(x0 - 0.01, ey - 0.08, 0.1, 0.05);
    const ix = 0.304 + (P.look || 0) * 0.004, iy = ey - 0.003 - gaze * 0.012;
    const pr = 0.0105 + (P.pupil || 0) * 0.004;
    // iris
    ctx.fillStyle = rgb(C.iris);
    ctx.beginPath(); ctx.ellipse(ix, iy, 0.0145, 0.025, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath(); ctx.ellipse(ix + 0.003, iy, pr * 0.55, pr, 0, 0, TAU); ctx.fill();
    // gold reflection of the post in the pupil
    const ge = P.goldEye || 0;
    if (ge > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      drawGlowLocal(ctx, ix + 0.006, iy + 0.006, 0.03, '#f2c46a', 0.55 * ge);
      ctx.fillStyle = rgb('#ffd98a', 0.85 * ge);
      ctx.beginPath(); ctx.ellipse(ix + 0.0065, iy + 0.007, 0.0035, 0.0065, 0.3, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    // catchlight from the screen
    ctx.fillStyle = rgb(L.catchCol, 0.9);
    ctx.beginPath(); ctx.ellipse(ix + 0.008, iy - 0.007, 0.0028, 0.0042, 0.4, 0, TAU); ctx.fill();
  });
  // upper lid line + lashes
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgb(C.line, 0.95); ctx.lineWidth = 0.0085;
  ctx.beginPath(); ctx.moveTo(x0, ey + 0.002);
  for (let i = 1; i <= 12; i++) { const u = i / 12; ctx.lineTo(lerp(x0, x1, u), upper(u)); }
  ctx.stroke();
  ctx.lineWidth = 0.0045;
  for (let i = 0; i < 4; i++) {
    const u = 0.62 + i * 0.11, px = lerp(x0, x1, u), py = upper(u);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 0.011 + i * 0.002, py - 0.011 + i * 0.002); ctx.stroke();
  }
  // lower lid
  ctx.strokeStyle = rgb(C.skinShadow, 0.5); ctx.lineWidth = 0.004;
  ctx.beginPath(); ctx.moveTo(x0 + 0.01, lower(0.1) + 0.002);
  for (let i = 2; i <= 11; i++) { const u = i / 12; ctx.lineTo(lerp(x0, x1, u), lower(u) + 0.002); }
  ctx.stroke();
  // lid crease (tired eyes show heavier crease / bags)
  ctx.strokeStyle = rgb(C.skinShadow, 0.32); ctx.lineWidth = 0.004;
  ctx.beginPath(); ctx.moveTo(0.248, ey - 0.036 - lid * 0.012);
  ctx.quadraticCurveTo(0.282, ey - 0.06 - lid * 0.02, 0.31, ey - 0.05 - lid * 0.012); ctx.stroke();
  const tired = clamp(1 - lid * 1.4);
  if (tired > 0.01) {
    ctx.strokeStyle = rgb(C.skinShadow, 0.22 * tired); ctx.lineWidth = 0.005;
    ctx.beginPath(); ctx.moveTo(0.252, ey + 0.03); ctx.quadraticCurveTo(0.28, ey + 0.045, 0.305, ey + 0.032); ctx.stroke();
  }

  // ---- eyebrow ----
  const by = -0.112 - brow * 0.022, tilt = brow * 0.01;
  ctx.fillStyle = rgb(C.brow);
  ctx.beginPath();
  ctx.moveTo(0.228, by + 0.016 + tilt);
  ctx.quadraticCurveTo(0.27, by - 0.012 - brow * 0.01, 0.338, by + 0.002 - tilt);
  ctx.quadraticCurveTo(0.345, by + 0.013, 0.334, by + 0.018 - tilt);
  ctx.quadraticCurveTo(0.28, by + 0.012, 0.23, by + 0.024 + tilt);
  ctx.closePath(); ctx.fill();

  // ---- mouth ----
  const cx = 0.33 - smile * 0.008, cy = 0.234 - smile * 0.026 + mouth * 0.012;
  ctx.strokeStyle = rgb(C.line, 0.75); ctx.lineWidth = 0.0065;
  ctx.beginPath(); ctx.moveTo(0.366, 0.222 + mouth * 0.004);
  ctx.quadraticCurveTo(0.35, 0.229 + mouth * 0.01 + smile * 0.004, cx, cy); ctx.stroke();
  if (mouth > 0.05) {
    ctx.fillStyle = rgb('#140b0d', 0.8 * mouth);
    ctx.beginPath(); ctx.moveTo(0.367, 0.222); ctx.quadraticCurveTo(0.355, 0.23 + mouth * 0.02, 0.366, 0.222 + mouth * 0.03);
    ctx.lineTo(0.37, 0.222 + mouth * 0.02); ctx.closePath(); ctx.fill();
  }
  withClip(ctx, hp, () => {
    // lips tint
    ctx.fillStyle = rgb(C.lip, 0.4);
    ctx.beginPath(); ctx.ellipse(0.364, 0.21, 0.014, 0.01, 0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.362, 0.252 + mouth * 0.025, 0.013, 0.013, -0.2, 0, TAU); ctx.fill();
    // nostril
    ctx.strokeStyle = rgb(C.skinShadow, 0.55); ctx.lineWidth = 0.007;
    ctx.beginPath(); ctx.moveTo(0.37, 0.142); ctx.quadraticCurveTo(0.385, 0.128, 0.405, 0.138); ctx.stroke();
  });
}

// ---- hands ----
function drawHand(ctx, x, y, ang, C, L, kind, scale = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang); ctx.scale(scale, scale);
  const p = new Path2D();
  if (kind === 'hold') {
    // fist wrapped around an object: palm, curled fingers, thumb on top
    p.ellipse(8, 2, 19, 15, 0.1, 0, TAU);
    for (let i = 0; i < 4; i++) { p.moveTo(30, -6 + i * 7.5); p.roundRect(16, -9 + i * 7.5, 18, 8, 4); }
    p.moveTo(30, -14); p.ellipse(20, -14, 13, 6.5, -0.35, 0, TAU);
  } else if (kind === 'pen') {
    p.ellipse(8, 0, 20, 14, 0.15, 0, TAU);
    p.moveTo(14, 8); p.ellipse(26, 6, 11, 7, 0.6, 0, TAU);
  } else if (kind === 'book') {
    p.ellipse(8, 0, 20, 15, 0, 0, TAU);
    p.moveTo(14, -10); p.ellipse(24, -14, 13, 6, -0.6, 0, TAU);
  } else {
    p.ellipse(12, 2, 22, 13, 0.2, 0, TAU);
  }
  litFill(ctx, p, C.skin, C.skinRim, L.ldx, L.ldy, 3.2, L.rimA, C.skinShadow, 0.6, [-15, -25, 40, 20]);
  ctx.strokeStyle = rgb(C.skinShadow, 0.55); ctx.lineWidth = 1.2;
  if (kind === 'hold') { for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(18, -9 + i * 7.5); ctx.lineTo(33, -9 + i * 7.5); ctx.stroke(); } }
  else { ctx.beginPath(); ctx.moveTo(18, 4); ctx.lineTo(28, 6); ctx.moveTo(16, 10); ctx.lineTo(25, 12); ctx.stroke(); }
  ctx.restore();
}

// sleeve/limb as a tapered stroke along joints
function limb(ctx, pts, w0, w1, color, rimCol, rimA, L) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgb(color);
  // draw as segments with interpolated width
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    ctx.lineWidth = lerp(w0, w1, (i + 0.5) / n);
    ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]); ctx.stroke();
  }
  if (rimA > 0.01) {
    ctx.strokeStyle = rgb(rimCol, rimA * 0.8);
    for (let i = 0; i < n; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      let nx = -(by - ay), ny = bx - ax; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      if (nx * L.ldx + ny * L.ldy < 0) { nx = -nx; ny = -ny; }
      const wv = lerp(w0, w1, (i + 0.5) / n) * 0.5 - 3;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha *= 0.6;
      const k0 = 0.12, k1 = 0.88;
      ctx.beginPath(); ctx.moveTo(lerp(ax, bx, k0) + nx * wv, lerp(ay, by, k0) + ny * wv); ctx.lineTo(lerp(ax, bx, k1) + nx * wv, lerp(ay, by, k1) + ny * wv); ctx.stroke();
      ctx.globalAlpha /= 0.6;
    }
  }
}

// ---- full figure ----
// P: pose; L: lighting; world coordinates
function drawCharacter(ctx, P, L) {
  const C = charPalette(L);
  const hip = [P.hx, P.hy];
  const ta = P.torso;                         // + leans forward
  const tl = (x, y) => { const r = rot(x, y, ta); return [hip[0] + r[0], hip[1] + r[1]]; };
  const breathe = Math.sin(P.time * 1.6) * 1.5;
  const hunch = P.hunch;
  const shoulder = tl(6 + hunch * 10, -206 + breathe + hunch * 8);
  const shoulderFar = tl(-4 + hunch * 10, -212 + breathe + hunch * 8);
  const neckBase = tl(10 + hunch * 16, -238 + breathe + hunch * 8);
  const floorY = P.floorY;

  // ---- far leg ----
  const fHip = [hip[0] - 4, hip[1] - 6];
  const fFoot = [hip[0] + P.footFar, floorY - 14];
  const fk = ik(fHip[0], fHip[1], fFoot[0], fFoot[1], BODY.thigh, BODY.shin, -1);
  limb(ctx, [fHip, [fk[0], fk[1]], [fk[2], fk[3]]], 52, 40, C.pantsDark, C.skinRim, 0, L);
  drawShoe(ctx, fk[2], fk[3], C, L, 0.82);

  // ---- far arm ----
  const fh = [hip[0] + P.fhx, hip[1] + P.fhy];
  const fe = ik(shoulderFar[0], shoulderFar[1], fh[0], fh[1], BODY.ua, BODY.fa, 1);
  limb(ctx, [shoulderFar, [fe[0], fe[1]], [fe[2], fe[3]]], 40, 34, C.hoodDark, C.skinRim, 0, L);

  // ---- torso ----
  const h = hunch;
  const tPts = [
    [-60, 22], [-66, -50], [-66 - 8 * h, -130], [-56 - 16 * h, -192], [-36 - 10 * h, -232],
    [-6 + 6 * h, -250], [26 + 12 * h, -246], [48 + 10 * h, -226], [58 + 6 * h, -172],
    [56, -105], [52, -40], [60, 12], [20, 30]
  ].map(p => tl(p[0], p[1] + (p[1] < -150 ? breathe : 0)));
  const torsoP = curvePath(tPts, true, 0.5);
  litFill(ctx, torsoP, C.hood, L.rimCol, L.ldx, L.ldy, 5, L.rimA * 0.7, C.hoodShadow, 0.7,
    [hip[0] - 80, hip[1] - 260, hip[0] + 80, hip[1] + 30]);
  // hoodie details: pocket seam, hem band
  ctx.strokeStyle = rgb(C.hoodShadow, 0.55); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(...tl(56, -40)); ctx.quadraticCurveTo(...tl(18, -48), ...tl(10, -10)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(...tl(-62, -8)); ctx.quadraticCurveTo(...tl(0, -2), ...tl(58, -6)); ctx.stroke();
  // hood bunched behind the neck
  const hoodP = curvePath([
    [-30, -204], [-54 - 8 * h, -214], [-58 - 8 * h, -238], [-38, -256], [-10, -250], [-16, -226]
  ].map(p => tl(p[0], p[1] + breathe)), true, 0.5);
  litFill(ctx, hoodP, C.hoodDark, L.rimCol, L.ldx, L.ldy, 3, L.rimA * 0.35, C.hoodShadow, 0.6,
    [hip[0] - 80, hip[1] - 280, hip[0] + 10, hip[1] - 200]);

  // ---- near leg ----
  const nHip = [hip[0] + 6, hip[1] + 2];
  const nFoot = [hip[0] + P.footNear, floorY];
  const nk = ik(nHip[0], nHip[1], nFoot[0], nFoot[1], BODY.thigh, BODY.shin, -1);
  limb(ctx, [nHip, [nk[0], nk[1]], [nk[2], nk[3]]], 58, 44, C.pants, L.rimCol, L.rimA * 0.4, L);
  drawShoe(ctx, nk[2], nk[3], C, L, 1);

  // ---- head ----
  ctx.save();
  ctx.translate(neckBase[0], neckBase[1]);
  ctx.rotate(ta * 0.35 + P.neck);
  ctx.scale(U, U);
  ctx.translate(0.05, -0.55);   // neck base at head-local (-0.05, 0.55)
  const LH = headLight(L, ctx);
  drawHead(ctx, P, LH, C);
  if (L.mind) L.mind(ctx);       // neural network inside the head (head-local)
  ctx.restore();

  // collar over the neck
  const collar = curvePath([[-24, -246], [-8, -256], [22, -254], [38, -238], [20, -232], [-10, -236]]
    .map(p => tl(p[0] + hunch * 16, p[1] + breathe + hunch * 8)), true, 0.5);
  litFill(ctx, collar, C.hoodDark, L.rimCol, L.ldx, L.ldy, 3, L.rimA * 0.6, C.hoodShadow, 0.4,
    [hip[0] - 40, hip[1] - 270, hip[0] + 50, hip[1] - 230]);
  ctx.strokeStyle = rgb(mixc(C.hood, '#ffffff', 0.18), 0.8); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  const s0 = tl(30 + hunch * 16, -240 + breathe), s1 = tl(36 + hunch * 14, -196 + breathe);
  ctx.beginPath(); ctx.moveTo(...s0); ctx.lineTo(s1[0], s1[1]); ctx.stroke();

  // ---- props held between the hands (behind near arm) ----
  const nh = [hip[0] + P.nhx, hip[1] + P.nhy];
  if (P.phone > 0.01) drawHeldPhone(ctx, nh[0] + 8, nh[1] - 14, P.phoneAng, L, P.phone);
  if (P.book > 0.01) drawHeldBook(ctx, nh[0] + 14, nh[1] - 6, P, L, C);

  // far hand (on top of prop when holding)
  drawHand(ctx, fe[2], fe[3], Math.atan2(fe[3] - fe[1], fe[2] - fe[0]), Object.assign({}, C, { skin: shade(C.skin, 0.8) }), L,
    P.handFar || 'hold', 0.95);

  // ---- near arm ----
  const ne = ik(shoulder[0], shoulder[1], nh[0], nh[1], BODY.ua, BODY.fa, 1);
  limb(ctx, [shoulder, [ne[0], ne[1]], [ne[2], ne[3]]], 46, 38, C.hood, L.rimCol, L.rimA * 0.7, L);
  // cuff
  const ca = Math.atan2(ne[3] - ne[1], ne[2] - ne[0]);
  ctx.strokeStyle = rgb(C.hoodDark); ctx.lineWidth = 36; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(ne[2] - Math.cos(ca) * 14, ne[3] - Math.sin(ca) * 14); ctx.lineTo(ne[2] - Math.cos(ca) * 2, ne[3] - Math.sin(ca) * 2); ctx.stroke();
  ctx.lineCap = 'round';
  if (P.pen > 0.01) drawPen(ctx, ne[2], ne[3], ca, P);
  drawHand(ctx, ne[2], ne[3], ca + (P.handTilt || 0), C, L, P.handNear || 'hold', 1);

  return { neckBase, headAngle: ta * 0.35 + P.neck, hand: [ne[2], ne[3]] };
}

// transform world light into head-local light params
function headLight(L, ctx) {
  const m = ctx.getTransform().inverse();
  const lp = m.transformPoint(new DOMPoint(L.px, L.py));
  const d = Math.hypot(lp.x, lp.y) || 1;
  return Object.assign({}, L, { kx: lp.x, ky: lp.y, kr: L.keyR / U, ldx: lp.x / d, ldy: lp.y / d });
}

function drawShoe(ctx, x, y, C, L, k) {
  ctx.save(); ctx.translate(x, y);
  const p = new Path2D();
  p.moveTo(-18, -16); p.quadraticCurveTo(-10, -26, 10, -20); p.quadraticCurveTo(46, -14, 54, 2);
  p.quadraticCurveTo(56, 12, 40, 12); p.lineTo(-20, 12); p.quadraticCurveTo(-28, 0, -18, -16); p.closePath();
  litFill(ctx, p, shade(C.shoe, k), L.rimCol, L.ldx, L.ldy, 2.5, L.rimA * 0.5, '#000000', 0.35, [-30, -30, 60, 14]);
  ctx.fillStyle = rgb(shade(C.shoeSole, k)); ctx.fillRect(-21, 7, 70, 6);
  ctx.restore();
}

function drawHeldPhone(ctx, x, y, ang, L, a) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(x, y); ctx.rotate(ang);
  // phone seen nearly edge-on; screen faces up-left towards his face
  ctx.fillStyle = '#0a0b10';
  rr(ctx, -62, -6, 124, 13, 4); ctx.fill();
  ctx.fillStyle = rgb(L.screenCol, 0.95);
  rr(ctx, -58, -7, 116, 3.2, 1.6); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const [ox, oy] = rot(0, -10, ang);
  drawGlow(ctx, x + ox, y + oy, 120, L.screenCol, 0.35 * a * L.screenA);
  ctx.restore();
}

function drawHeldBook(ctx, x, y, P, L, C) {
  // an open book held up towards his face, seen from the side: the near cover
  // (foreshortened), the fanned page block facing him and a sliver of the far cover
  ctx.save(); ctx.globalAlpha *= P.book;
  ctx.translate(x, y); ctx.rotate(P.bookAng || 0.28);
  const cover = rgb(mixc('#3a2420', '#8a2f25', L.w)), coverDark = rgb(mixc('#24160f', '#5e1f18', L.w));
  const page = rgb(mixc('#8a8578', '#f6ecd8', L.w)), pageLine = rgb(mixc('#55524a', '#cdb999', L.w), 0.9);
  const flip = P.pageFlip || 0;
  ctx.fillStyle = coverDark;
  ctx.beginPath(); ctx.moveTo(-20, 4); ctx.lineTo(-16, 4); ctx.lineTo(-10, -118); ctx.lineTo(-15, -118); ctx.closePath(); ctx.fill();
  ctx.fillStyle = page;
  ctx.beginPath(); ctx.moveTo(-16, 4); ctx.quadraticCurveTo(-6, 0, 2, 2); ctx.lineTo(10, -114); ctx.quadraticCurveTo(0, -118, -10, -118); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = pageLine; ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-15 + i * 4, 3); ctx.lineTo(-9 + i * 4.6, -116); ctx.stroke(); }
  // a page lifting during a page turn
  if (flip > 0.01) {
    ctx.fillStyle = page;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-40 * Math.sin(flip * Math.PI), -60, -6, -116); ctx.lineTo(6, -114); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = cover;
  ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(28, -2); ctx.lineTo(36, -112); ctx.lineTo(10, -114); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgb(mixc('#6b5a3a', '#e2c27a', L.w), 0.8);
  ctx.beginPath(); ctx.moveTo(14, -88); ctx.lineTo(30, -90); ctx.lineTo(31, -84); ctx.lineTo(15, -82); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawPen(ctx, x, y, ca, P) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ca + 0.9);
  ctx.globalAlpha *= P.pen;
  ctx.fillStyle = '#1b1e26'; rr(ctx, 6, -2.5, 58, 5, 2.5); ctx.fill();
  ctx.fillStyle = '#c9a25a'; ctx.fillRect(56, -2.5, 6, 5);
  ctx.restore();
}
