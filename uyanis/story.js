'use strict';
// Pose, wizard, camera and light state as pure functions of time.

const ORC_KEYS = fillKeys([
  { t: 0, slouch: 1, lookDown: 1, jaw: 0.5, brow: -0.55, lid: 0.55, red: 1, savage: 1, smile: 0, tilt: -0.05, gazeX: 0, gazeY: 1, phoneDX: 0, phoneUp: 0, phoneRot: 0 },
  { t: 3.8, jaw: 0.62, brow: -0.6 },
  { t: 6.2, jaw: 0.7, lid: 0.48 },
  { t: 12.5, jaw: 0.55, brow: -0.3, lid: 0.55 },
  { t: 13.4, jaw: 0.1, brow: 0.85, lid: 1.0, red: 0.85, slouch: 0.85, phoneUp: 0.35, tilt: 0.02 },
  { t: 14.6, jaw: 0.04, brow: 0.7, red: 0.75 },
  { t: 16.6, red: 0.55, savage: 0.75, slouch: 0.65, brow: 0.6 },
  { t: 19.0, red: 0.12, savage: 0.35, slouch: 0.3, brow: 0.45, jaw: 0, smile: 0.25, lid: 0.9, tilt: 0 },
  { t: 21.6, red: 0, savage: 0.06, slouch: 0.05, lookDown: 0.6, brow: 0.25, smile: 0.65, lid: 0.85, phoneUp: 0.25 },
  { t: 23.6, savage: 0, slouch: 0, lookDown: 0.5, smile: 0.7 },
  { t: 24.5, lookDown: 0.08, gazeY: -0.5, gazeX: -0.7, smile: 0.95, tilt: -0.03, brow: 0.35 },
  { t: 25.9, lookDown: 0.1 },
  { t: 26.6, lookDown: 0.55, gazeY: 1, gazeX: 0, smile: 0.8, tilt: 0 },
  { t: 29.0, lookDown: 0.5, smile: 0.85 },
  { t: 31.5, lookDown: 0.35, gazeY: 0.4, smile: 0.95 }
], {});
const BLINKS = [2.2, 5.1, 13.0, 13.9, 19.6, 22.8, 25.2, 29.9];

function orcAt(t) {
  const P = keyed(ORC_KEYS, t);
  let b = 1;
  for (const bt of BLINKS) b = Math.min(b, 1 - win(bt - 0.07, bt, bt + 0.03, bt + 0.13, t));
  P.blink = b;
  P.breath = Math.sin(t * 1.7);
  P.quill = ss(TL.blade[0] + 0.3, TL.blade[1], t);
  P.book = ss(TL.sword[1] - 0.5, TL.sword[1] + 0.3, t);
  P.sticker = ss(19.0, 20.5, t);
  // the thumb's flicks make the phone twitch
  for (const f of TL.roomFlicks) P.phoneRot += 0.03 * win(f - 0.1, f, f + 0.05, f + 0.25, t);
  return P;
}

function wizardAt(t) {
  const appear = ss(TL.wizardIn[0], TL.wizardIn[1], t);
  const out = ss(TL.wizardOut[0], TL.wizardOut[1], t);
  return {
    x: WIZ_ROOT[0], y: WIZ_ROOT[1] + Math.sin(t * 1.1) * 6 + (1 - appear) * 30 - out * 20, s: WIZ_SCALE,
    point: ss(TL.point[0], TL.point[1], t) * (1 - ss(TL.nod + 0.2, TL.nod + 1.0, t)),
    nod: win(TL.nod - 0.25, TL.nod, TL.nod + 0.15, TL.nod + 0.6, t),
    staffTilt: -0.5 * ss(TL.point[0], TL.point[1], t) * (1 - ss(TL.nod, TL.nod + 1, t)),
    appear, out
  };
}

// light & transformation progress
function revealAt(t) { return easeInOut(inv(TL.reveal[0], TL.reveal[1], t)); }
function warmAt(t) { return ss(TL.postStop, TL.postStop + 0.8, t); }

function headCam(t, z) {
  const P = orcAt(t);
  const h = orcHeadToWorld(P, 0, 10);
  return { x: h[0] + Math.sin(t * 0.7) * 4, y: h[1] + 40 + Math.cos(t * 0.5) * 3, z, r: Math.sin(t * 0.4) * 0.006 };
}
function cameraAt(t) {
  if (t < TL.wide1[1]) {
    const k = easeInOut(inv(0, TL.wide1[1], t));
    return { x: lerp(540, 500, k), y: lerp(960, 1000, k), z: lerp(1.0, 1.16, k), r: 0 };
  }
  if (t < TL.face1[1]) return headCam(t, lerp(2.7, 3.0, inv(TL.face1[0], TL.face1[1], t)));
  if (t < TL.face2[1]) return headCam(t, lerp(2.75, 2.35, easeOut(inv(TL.face2[0], TL.face2[1], t))));
  if (t < TL.change[1]) {
    const k = easeInOut(inv(TL.change[0], 18.2, t));
    const push = easeInOut(inv(21.6, TL.change[1], t));
    return { x: lerp(470, 545, k), y: lerp(960, 965, k), z: lerp(1.32, 1.0, k) + 0.05 * push, r: 0 };
  }
  if (t < TL.medium[1]) {
    const k = easeInOut(inv(TL.medium[0], TL.medium[1], t));
    return { x: lerp(470, 455, k), y: lerp(930, 900, k), z: lerp(1.72, 1.86, k), r: 0 };
  }
  if (t < TL.pov2[1]) return { x: 470, y: 960, z: 1.9, r: 0 };   // blurred background for the phone shot
  const k = easeInOut(inv(TL.end[0], TL.duration, t));
  return { x: lerp(500, 540, k), y: lerp(1000, 960, k), z: lerp(1.2, 1.0, k), r: 0 };
}

function applyCam(g, cam, k = 1) {
  g.setTransform(k, 0, 0, k, 0, 0);
  g.translate(W / 2, H / 2); g.rotate(cam.r || 0); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y);
}
function worldToScreen(cam, x, y) {
  const [rx, ry] = rot((x - cam.x) * cam.z, (y - cam.y) * cam.z, cam.r || 0);
  return [W / 2 + rx, H / 2 + ry];
}

// lights in world space: { x, y, r, c, a }
function lightsAt(t, P, lit) {
  const ph = orcPhoneWorld(P);
  const warm = warmAt(t);
  const sl = screenLight(t);
  const grow = ss(TL.glow, 17.5, t);
  const L = [];
  if (!lit) {
    L.push({ x: ph[0], y: ph[1] - 120, r: lerp(700, 1150, grow), c: mixc(sl.c, '#ffcf8a', warm), a: lerp(sl.a * 0.95, 1.25, warm) });
    L.push({ x: 240, y: 520, r: 900, c: hex('#2c3f56'), a: 1.0 });
    // the wizard's own light
    const wz = ss(TL.wizardIn[0], TL.wizardIn[1], t) * (1 - ss(TL.wizardOut[0], TL.wizardOut[1], t));
    if (wz > 0) L.push({ x: WIZ_ROOT[0], y: WIZ_ROOT[1] + 100, r: 900, c: hex('#ffe0a8'), a: 0.8 * wz });
    return { amb: hex('#2b333b'), L };
  }
  L.push({ x: 230, y: 560, r: 1700, c: hex('#ffe2b4'), a: 0.75 });
  L.push({ x: ph[0], y: ph[1] - 120, r: 700, c: hex('#ffd8a0'), a: 0.35 });
  return { amb: hex('#bdae9a'), L };
}
