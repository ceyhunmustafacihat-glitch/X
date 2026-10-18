'use strict';
// Story state: poses, camera, light and room state as pure functions of time.

const FLOOR_Y = 1690;

// ---------- character poses ----------
const POSE_BASE = {
  hx: 360, hy: 1425, torso: -0.14, hunch: 0.7, neck: 0.55,
  nhx: 150, nhy: -150, fhx: 138, fhy: -142, phone: 1, phoneAng: -0.95,
  lid: 0.42, brow: -0.35, smile: 0, mouth: 0, gaze: -0.7, pupil: 0, goldEye: 0, look: 0,
  footNear: 150, footFar: 112, book: 0, bookAng: 0.3, pen: 0, handTilt: 0, chairX: 0
};
const P = (t, o) => Object.assign({ t }, o);
const POSE_KEYS = fillKeys([
  P(0, {}),
  P(8.6, {}),
  P(9.25, { torso: -0.06, neck: 0.5, nhx: 166, nhy: -178, fhx: 154, fhy: -170, phoneAng: -1.0, lid: 0.5, brow: -0.2 }),
  P(11.3, { torso: -0.05, neck: 0.49, nhx: 167, nhy: -180, fhx: 155, fhy: -172, phoneAng: -1.0, lid: 0.48, brow: -0.2, gaze: -0.7, goldEye: 0, pupil: 0 }),
  P(11.85, { torso: -0.04, neck: 0.48, nhx: 168, nhy: -182, fhx: 156, fhy: -174, phoneAng: -1.0, lid: 0.56, brow: -0.1, gaze: -0.68, goldEye: 0.85, pupil: 0.45 }),
  P(12.9, { torso: -0.02, neck: 0.42, nhx: 170, nhy: -186, fhx: 158, fhy: -178, phoneAng: -1.0, lid: 0.95, brow: 0.55, pupil: 1, goldEye: 1, gaze: -0.55, mouth: 0.12 }),
  P(13.6, { torso: -0.01, hunch: 0.5, neck: 0.3, nhx: 172, nhy: -170, fhx: 160, fhy: -164, phoneAng: -0.8, lid: 1, brow: 0.6, pupil: 1, goldEye: 1, gaze: -0.2, mouth: 0.15 }),
  P(14.6, { torso: 0.02, hunch: 0.2, neck: -0.22, nhx: 176, nhy: -128, fhx: 164, fhy: -122, phoneAng: -0.45, lid: 1, brow: 0.75, pupil: 1, goldEye: 1, gaze: 0.65, mouth: 0.35 }),
  P(15.6, { torso: 0.03, hunch: 0.15, neck: -0.32, nhx: 176, nhy: -126, fhx: 164, fhy: -120, phoneAng: -0.45, lid: 1, brow: 0.8, pupil: 1, goldEye: 0.8, gaze: 0.8, mouth: 0.3, look: 0.5 }),
  P(16.6, { torso: 0.03, hunch: 0.15, neck: -0.18, nhx: 176, nhy: -126, fhx: 164, fhy: -120, phoneAng: -0.45, lid: 1, brow: 0.7, pupil: 1, goldEye: 0.8, gaze: 0.5, mouth: 0.3, look: 0 }),
  P(17.6, { torso: 0.03, hunch: 0.1, neck: -0.02, nhx: 176, nhy: -126, fhx: 164, fhy: -120, phoneAng: -0.45, lid: 1, brow: 0.55, pupil: 1, goldEye: 1, gaze: 0.1, mouth: 0.18, smile: 0.1 }),
  P(19.3, { torso: 0.03, hunch: 0.05, neck: -0.04, nhx: 176, nhy: -126, fhx: 164, fhy: -120, phoneAng: -0.45, lid: 1, brow: 0.6, pupil: 1, goldEye: 1, gaze: 0.15, mouth: 0.1, smile: 0.45 }),
  P(20.1, { torso: 0.06, hunch: 0.0, neck: 0.02, nhx: 200, nhy: -130, fhx: 170, fhy: -120, phoneAng: -0.4, lid: 0.92, brow: 0.45, pupil: 0.6, goldEye: 0.3, gaze: 0.0, mouth: 0.0, smile: 0.7 }),
  P(20.75, { torso: 0.22, hunch: 0.0, neck: 0.15, nhx: 300, nhy: -150, fhx: 200, fhy: -125, phoneAng: 0.0, lid: 0.85, brow: 0.3, pupil: 0.3, goldEye: 0, gaze: -0.3, smile: 0.6, phone: 1 }),
  P(20.85, { torso: 0.22, hunch: 0.0, neck: 0.15, nhx: 300, nhy: -150, fhx: 200, fhy: -125, phoneAng: 0.0, lid: 0.85, brow: 0.3, gaze: -0.3, smile: 0.6, phone: 0 }),
  P(21.3, { hx: 420, chairX: 60, torso: 0.18, hunch: 0, neck: 0.2, nhx: 260, nhy: -150, fhx: 230, fhy: -140, phone: 0, lid: 0.85, brow: 0.3, gaze: -0.5, smile: 0.5, handNearK: 0 }),
  P(21.7, { hx: 420, chairX: 60, torso: 0.3, hunch: 0, neck: 0.3, nhx: 300, nhy: -152, fhx: 250, fhy: -142, phone: 0, lid: 0.8, brow: 0.3, gaze: -0.6, smile: 0.45 }),
  P(22.2, { hx: 420, chairX: 60, torso: 0.36, hunch: 0.1, neck: 0.36, nhx: 345, nhy: -150, fhx: 262, fhy: -146, phone: 0, pen: 1, lid: 0.8, brow: 0.35, gaze: -0.6, smile: 0.4 }),
  P(24.9, { hx: 420, chairX: 60, torso: 0.36, hunch: 0.1, neck: 0.36, nhx: 360, nhy: -150, fhx: 262, fhy: -146, phone: 0, pen: 1, lid: 0.8, brow: 0.35, gaze: -0.6, smile: 0.4 }),
  P(25.1, { hx: 420, chairX: 60, torso: 0.0, hunch: 0, neck: 0.22, nhx: 192, nhy: -196, fhx: 182, fhy: -190, phone: 0, pen: 0, book: 1, bookAng: 0.3, lid: 0.72, brow: 0.25, gaze: -0.45, smile: 0.55 }),
  P(28.6, { hx: 420, chairX: 60, torso: 0.0, hunch: 0, neck: 0.2, nhx: 192, nhy: -198, fhx: 182, fhy: -192, phone: 0, pen: 0, book: 1, bookAng: 0.3, lid: 0.74, brow: 0.3, gaze: -0.42, smile: 0.62 })
], POSE_BASE);
const BLINKS = [2.2, 4.1, 7.0, 10.3, 12.25, 18.0, 21.9, 26.0, 27.7];

function poseAt(t) {
  const p = Object.assign({}, POSE_BASE, keyed(POSE_KEYS, t));
  p.time = t; p.floorY = FLOOR_Y;
  // thumb flicks while scrolling (tiny hand motion)
  let flick = 0;
  for (const f of TL.flicksRoom.concat(TL.flicksFeed)) { const d = t - f; if (d > 0 && d < 0.35) flick += Math.sin(d / 0.35 * Math.PI); }
  p.nhy -= flick * 4; p.nhx += flick * 2;
  // idle micro motion
  p.neck += fbm(t * 0.35, 1) * 0.025;
  p.torso += fbm(t * 0.25, 2) * 0.012;
  // blinks
  for (const b of BLINKS) { const d = Math.abs(t - b); if (d < 0.11) p.lid *= d / 0.11; }
  // reading: page turn wrist motion
  for (const pt of TL.readPageTurns) { const d = t - pt; if (d > 0 && d < 0.5) { p.nhy -= Math.sin(d / 0.5 * Math.PI) * 6; p.pageFlip = d / 0.5; } }
  // writing: hand travels along the line
  if (t > 22.2 && t < 24.9) {
    const k = inv(TL.writeStart, TL.writeEnd, t);
    p.nhx += k * 26 + Math.sin(t * 22) * 1.6; p.nhy += Math.sin(t * 17) * 1.4;
  }
  p.handNear = p.book > 0.5 ? 'book' : (p.pen > 0.5 ? 'pen' : (p.phone > 0.5 ? 'hold' : 'relaxed'));
  p.handFar = p.book > 0.5 ? 'book' : (p.phone > 0.5 ? 'hold' : 'relaxed');
  return p;
}

// world position of a head-local point (mirrors drawCharacter's transforms)
function headToWorld(p, lx, ly) {
  const breathe = Math.sin(p.time * 1.6) * 1.5;
  const nb = rot(10 + p.hunch * 16, -238 + breathe + p.hunch * 8, p.torso);
  const nx = p.hx + nb[0], ny = p.hy + nb[1];
  const a = p.torso * 0.35 + p.neck;
  const r = rot((lx + 0.05) * U, (ly - 0.55) * U, a);
  return [nx + r[0], ny + r[1]];
}
function phoneWorld(p) { return [p.hx + p.nhx + 8, p.hy + p.nhy - 20]; }

// ---------- camera ----------
// lock: 0 = free (x,y), 1 = follow face (eye + offset fx,fy in world px), 2 = phone
const CAM_KEYS = [
  { t: 0, x: 540, y: 990, z: 1.0, face: 0, fx: 0, fy: 0, ph: 0 },
  { t: 1.4, x: 540, y: 1000, z: 1.03, face: 0, fx: 0, fy: 0, ph: 0, ease: sstep },
  { t: 4.5, x: 470, y: 1150, z: 1.55, face: 0, fx: 0, fy: 0, ph: 0, ease: sstep },
  { t: 5.75, x: 470, y: 1150, z: 7.5, face: 0, fx: 0, fy: 0, ph: 1, ease: easeIn },
  { t: 11.3, x: 470, y: 1150, z: 36, face: 1, fx: 1.5, fy: 0, ph: 0, ease: t => (t < 1 ? 0 : 1) },
  { t: 11.8, x: 470, y: 1150, z: 27, face: 1, fx: 2, fy: 1, ph: 0, ease: sstep },
  { t: 12.85, x: 470, y: 1150, z: 4.3, face: 1, fx: 34, fy: 40, ph: 0, ease: t => 1 - Math.pow(1 - smoother(t), 1.6) },
  { t: 13.45, x: 470, y: 1150, z: 3.9, face: 1, fx: 38, fy: 44, ph: 0, ease: sstep },
  { t: 15.0, x: 470, y: 860, z: 1.55, face: 0, fx: 0, fy: 0, ph: 0, ease: smoother },
  { t: 16.9, x: 480, y: 900, z: 1.62, face: 0, fx: 0, fy: 0, ph: 0, ease: sstep },
  { t: 19.25, x: 480, y: 900, z: 3.7, face: 1, fx: -30, fy: -30, ph: 0, ease: easeInOut },
  { t: 19.5, x: 480, y: 900, z: 3.75, face: 1, fx: -30, fy: -30, ph: 0, ease: sstep },
  { t: 21.0, x: 545, y: 1010, z: 1.0, face: 0, fx: 0, fy: 0, ph: 0, ease: smoother },
  { t: 22.0, x: 660, y: 1170, z: 1.35, face: 0, fx: 0, fy: 0, ph: 0, ease: sstep },
  { t: 22.8, x: 770, y: 1265, z: 5.0, face: 0, fx: 0, fy: 0, ph: 0, ease: easeIn },
  { t: 25.0, x: 600, y: 1130, z: 2.5, face: 1, fx: 60, fy: 40, ph: 0, ease: t => (t < 1 ? 0 : 1) },
  { t: 28.3, x: 560, y: 1010, z: 0.9, face: 0, fx: 0, fy: 0, ph: 0, ease: t => sstep(t) * 0.65 + (1 - Math.pow(1 - t, 2)) * 0.35 }
];
// zoom is interpolated in log space so push-ins and pull-backs feel even
const CAM_KEYS_LOG = CAM_KEYS.map(k => Object.assign({}, k, { z: Math.log(k.z) }));
function cameraAt(t, pose) {
  const k = keyed(CAM_KEYS_LOG, t);
  k.z = Math.exp(k.z);
  const eye = headToWorld(pose, 0.29, -0.03);
  const ph = phoneWorld(pose);
  let x = k.x, y = k.y;
  x = lerp(x, eye[0] + k.fx, k.face); y = lerp(y, eye[1] + k.fy, k.face);
  x = lerp(x, ph[0], k.ph); y = lerp(y, ph[1], k.ph);
  // gentle handheld drift, smaller when zoomed in
  const amp = 5 / Math.sqrt(k.z);
  x += fbm(t * 0.3, 11) * amp; y += fbm(t * 0.27, 12) * amp;
  const r = fbm(t * 0.2, 13) * 0.004;
  return { x, y, z: k.z, r };
}
function applyCam(g, cam) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(W / 2, H / 2); g.rotate(cam.r); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y);
}
function worldToScreen(cam, x, y) {
  const r = rot((x - cam.x) * cam.z, (y - cam.y) * cam.z, cam.r);
  return [W / 2 + r[0], H / 2 + r[1]];
}

// ---------- lighting ----------
function lightAt(t, pose, w) {
  const ph = phoneWorld(pose);
  const goldScreen = ss(TL.postArrive, TL.postStop + 0.3, t);
  const screenCol = mixc('#cfe0ff', '#ffd68c', goldScreen);
  const letters = win(13.3, 14.2, 17.2, 18.0, t);
  if (w < 0.5) {
    const head = headToWorld(pose, 0, -0.2);
    // in the letters scene the key light comes from the swirling glyphs above
    const lpx = lerp(ph[0], head[0] + 160, letters), lpy = lerp(ph[1], head[1] - 260, letters);
    const phoneOn = pose.phone;
    return {
      w: 0, px: lpx, py: lpy,
      ldx: 0.7, ldy: 0.7,
      rimA: (0.85 * phoneOn * (1 - letters) + 0.9 * letters) * (1 - 0.6 * ss(17.2, 18.2, t) * (1 - ss(19.3, 19.8, t))),
      rimCol: mixc(screenCol, '#ffd98f', letters),
      keyCol: mixc(mixc('#7aa0e8', '#ffc870', goldScreen), '#ffcf7a', letters),
      keyA: (0.32 + 0.18 * goldScreen) * Math.max(phoneOn, letters), keyR: 170 + 140 * letters,
      catchCol: mixc('#e8f2ff', '#fff0c8', goldScreen),
      screenCol, screenA: 1 - 0.35 * goldScreen,
      silhouette: ss(17.15, 17.9, t) * (1 - ss(19.35, 19.9, t))
    };
  }
  return {
    w: 1, px: 980, py: 420, ldx: 0.7, ldy: -0.6,
    rimA: 0.8, rimCol: hex('#ffe0a6'), keyCol: hex('#ffdba2'), keyA: 0.18, keyR: 420,
    catchCol: hex('#fff6e6'), screenCol, screenA: 1, silhouette: 0
  };
}

// ---------- room state ----------
function roomStateAt(t, w) {
  // clock: 23:10 racing to ~03:50 while scrolling; ~06:40 at sunrise, then a productive day passes
  let h;
  if (t < 11) h = 23.17 + easeIn(inv(0, 9.0, t)) * 4.6 + inv(9, 11, t) * 0.05;
  else if (t < 19.4) h = 27.82 + inv(11, 19.4, t) * 0.3;
  else h = 30.67 + inv(19.4, 25, t) * 0.6 + easeInOut(inv(25.0, 28.6, t)) * 5.5;
  return {
    t, w,
    clockH: h, clockBlur: (t < 9 ? ss(0.5, 3, t) : 0) + win(25, 25.6, 27.6, 28.4, t),
    curtain: w > 0.5 ? ss(19.6, 22.0, t) : 0,
    breeze: w > 0.5 ? win(19.6, 20.5, 22, 24, t) : 0,
    sun: 1, sunShift: inv(25, 28.6, t),
    plant: w > 0.5 ? ss(19.9, 22.6, t) * 0.75 + ss(25.2, 28.0, t) * 0.25 : 0,
    tidy: ss(25.15, 26.3, t),
    stack: ss(25.4, 27.4, t) * 2.4,
    nbOpen: ss(21.35, 21.75, t),
    penHeld: t > 21.95 && t < 25.0 ? 1 : 0,
    phoneOnDesk: t > TL.phoneDown ? 1 : 0
  };
}
