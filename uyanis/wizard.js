'use strict';
// The wise old man (the page's face): pointed hat with a bent tip, long grey hair,
// long white beard, dark robe, staff crowned with the open book.
// Local origin = centre of the face. Q: {x, y, s, point (0..1), nod, sway, glow}

const WIZ_ROOT = [862, 600];
const WIZ_SCALE = 0.74;

function wizToWorld(Q, x, y) { return [Q.x + x * Q.s, Q.y + y * Q.s]; }
function wizStaffTop(Q) { return wizToWorld(Q, 222 + Q.staffTilt * 40, -250); }
function wizPalm(Q) { const a = wizArm(Q); return wizToWorld(Q, a.hand[0], a.hand[1]); }

function wizArm(Q) {
  const k = easeInOut(clamp(Q.point));
  const sh = [-150, 150];
  const hand = [lerp(-120, -370, k), lerp(430, 470, k)];
  const elbow = [lerp(-190, -280, k), lerp(320, 340, k)];
  return { k, sh, elbow, hand };
}

function drawWizard(g, Q) {
  const WL = '#e9e9e9';
  g.save();
  g.translate(Q.x, Q.y); g.scale(Q.s, Q.s);
  const nod = Q.nod;
  // ---- staff (behind the robe sleeve) ----
  const stX = 222 + Q.staffTilt * 40;
  g.save(); g.translate(stX, 260); g.rotate(Q.staffTilt * 0.12); g.translate(-stX, -260);
  const sg = g.createLinearGradient(stX - 12, 0, stX + 12, 0);
  sg.addColorStop(0, '#3a3a3a'); sg.addColorStop(0.5, '#9a9a9a'); sg.addColorStop(1, '#2a2a2a');
  g.fillStyle = sg; g.beginPath(); g.moveTo(stX - 10, -200); g.lineTo(stX + 10, -200); g.lineTo(stX + 13, 900); g.lineTo(stX - 13, 900); g.closePath(); g.fill();
  g.strokeStyle = '#d8d8d8'; g.lineWidth = 2; g.stroke();
  // book crown
  drawStaffBook(g, stX, -255, 1);
  g.restore();

  // ---- hair behind the shoulders ----
  for (const s of [-1, 1]) {
    const hair = curvePath([[s * 40, -74], [s * 100, -66], [s * 128, 60], [s * 132, 250], [s * 96, 300], [s * 60, 120]], true, 0.5);
    const hg = g.createLinearGradient(s * 40, 0, s * 130, 0);
    hg.addColorStop(0, '#5c5c5c'); hg.addColorStop(1, '#a9a9a9');
    g.fillStyle = hg; g.fill(hair); g.strokeStyle = '#cfcfcf'; g.lineWidth = 1.6; g.stroke(hair);
    g.strokeStyle = 'rgba(30,30,30,0.6)'; g.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) { const x = s * (62 + i * 14); g.beginPath(); g.moveTo(x, -50); g.quadraticCurveTo(x + s * 10, 100, x + s * 4, 260 - i * 20); g.stroke(); }
  }
  // ---- robe ----
  const robe = curvePath([[-70, 70], [-200, 140], [-250, 420], [-300, 860], [300, 860], [250, 420], [200, 140], [70, 70]], true, 0.35);
  const rg = g.createLinearGradient(-300, 0, 300, 0);
  rg.addColorStop(0, '#1a1a1a'); rg.addColorStop(0.6, '#2d2d2d'); rg.addColorStop(1, '#232323');
  g.fillStyle = rg; g.fill(robe); g.strokeStyle = '#8a8a8a'; g.lineWidth = 2.2; g.stroke(robe);
  g.strokeStyle = 'rgba(160,160,160,0.35)'; g.lineWidth = 1.6;
  for (const [x0, x1] of [[-160, -230], [-90, -120], [100, 140], [170, 240]]) { g.beginPath(); g.moveTo(x0, 300); g.quadraticCurveTo((x0 + x1) / 2 + 10, 560, x1, 850); g.stroke(); }

  // ---- staff arm (left hand on the staff) ----
  const sleeveR = curvePath([[140, 130], [200, 180], [262, 330], [222, 400], [170, 360], [140, 260]], true, 0.4);
  g.fillStyle = '#2a2a2a'; g.fill(sleeveR); g.strokeStyle = '#8a8a8a'; g.lineWidth = 2; g.stroke(sleeveR);
  drawWizHand(g, stX - 4, 300, 1, true);

  // ---- face ----
  g.save(); g.translate(0, nod * 10); g.rotate(nod * 0.03);
  const face = curvePath([[-44, -66], [44, -66], [48, -10], [36, 40], [0, 58], [-36, 40], [-48, -10]], true, 0.45);
  const fg = g.createLinearGradient(-48, 0, 48, 0);
  fg.addColorStop(0, '#6a6a6a'); fg.addColorStop(0.6, '#b6b6b6'); fg.addColorStop(1, '#8a8a8a');
  g.fillStyle = fg; g.fill(face);
  // shadow from the brim
  const bs = g.createLinearGradient(0, -70, 0, -20);
  bs.addColorStop(0, 'rgba(0,0,0,0.65)'); bs.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = bs; g.fillRect(-50, -70, 100, 50);
  g.strokeStyle = '#d0d0d0'; g.lineWidth = 1.6; g.stroke(face);
  // eyes (calm, knowing)
  const ey = -18 + nod * 4;
  for (const s of [-1, 1]) {
    g.fillStyle = '#f0f0f0'; g.beginPath(); g.ellipse(s * 19, ey, 10, 4.2, 0, 0, TAU); g.fill();
    g.fillStyle = '#121212'; g.beginPath(); g.arc(s * 19 + 1, ey + 0.5, 3.6, 0, TAU); g.fill();
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(s * 30, ey - 1); g.quadraticCurveTo(s * 18, ey - 7 - nod * 2, s * 7, ey - 2); g.stroke();
    // bushy white brows, angled
    const br = new Path2D();
    br.moveTo(s * 6, -30); br.quadraticCurveTo(s * 22, -42, s * 46, -36); br.lineTo(s * 44, -30); br.quadraticCurveTo(s * 24, -34, s * 8, -24); br.closePath();
    g.fillStyle = '#f4f4f4'; g.fill(br);
  }
  // nose
  g.strokeStyle = '#2a2a2a'; g.lineWidth = 1.8;
  g.beginPath(); g.moveTo(-2, -26); g.lineTo(-6, 14); g.quadraticCurveTo(0, 20, 7, 14); g.stroke();
  g.restore();

  // ---- beard & moustache ----
  g.save(); g.translate(0, nod * 10);
  const beard = curvePath([[-50, 14], [-64, 120], [-58, 260], [-38, 380], [-6, 470], [16, 500], [10, 420], [44, 300], [62, 160], [52, 14], [0, 30]], true, 0.45);
  const bg = g.createLinearGradient(-64, 0, 64, 0);
  bg.addColorStop(0, '#bdbdbd'); bg.addColorStop(0.5, '#fbfbfb'); bg.addColorStop(1, '#cfcfcf');
  g.fillStyle = bg; g.fill(beard); g.strokeStyle = '#1e1e1e'; g.lineWidth = 2; g.stroke(beard);
  g.save(); g.clip(beard);
  g.strokeStyle = 'rgba(70,70,70,0.6)'; g.lineWidth = 1.3;
  for (let i = 0; i < 9; i++) { const x = -44 + i * 11; g.beginPath(); g.moveTo(x, 40); g.quadraticCurveTo(x * 0.7 + 4, 260, x * 0.3 + 6, 470); g.stroke(); }
  g.restore();
  const mus = new Path2D();
  mus.moveTo(0, 18); mus.bezierCurveTo(-26, 10, -52, 24, -58, 62); mus.quadraticCurveTo(-40, 36, -6, 34);
  mus.lineTo(6, 34); mus.quadraticCurveTo(40, 36, 58, 62); mus.bezierCurveTo(52, 24, 26, 10, 0, 18); mus.closePath();
  g.fillStyle = WL; g.fill(mus); g.strokeStyle = '#1e1e1e'; g.lineWidth = 1.6; g.stroke(mus);
  g.restore();

  // ---- hat ----
  g.save(); g.translate(0, nod * 8); g.rotate(nod * 0.04);
  const cone = new Path2D();
  cone.moveTo(-100, -84); cone.bezierCurveTo(-64, -170, -40, -270, -26, -330);
  cone.quadraticCurveTo(-46, -366, -96, -380); cone.quadraticCurveTo(-14, -378, 16, -322);
  cone.bezierCurveTo(46, -236, 76, -154, 104, -84); cone.closePath();
  const cg = g.createLinearGradient(-100, 0, 104, 0);
  cg.addColorStop(0, '#141414'); cg.addColorStop(0.65, '#2e2e2e'); cg.addColorStop(1, '#202020');
  g.fillStyle = cg; g.fill(cone); g.strokeStyle = '#9a9a9a'; g.lineWidth = 2.2; g.stroke(cone);
  g.save(); g.clip(cone); g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1.4;
  for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(-20 + i * 9, -380); g.lineTo(30 + i * 9, -80); g.stroke(); }
  g.restore();
  g.fillStyle = '#0e0e0e'; g.beginPath(); g.moveTo(-104, -96); g.lineTo(106, -96); g.lineTo(110, -76); g.lineTo(-108, -76); g.closePath(); g.fill();
  g.strokeStyle = '#6a6a6a'; g.lineWidth = 1.6; g.stroke();
  const brim = new Path2D(); brim.ellipse(0, -72, 236, 32, -0.03, 0, TAU);
  const brg = g.createLinearGradient(-236, 0, 236, 0);
  brg.addColorStop(0, '#191919'); brg.addColorStop(0.7, '#323232'); brg.addColorStop(1, '#262626');
  g.fillStyle = brg; g.fill(brim); g.strokeStyle = '#a8a8a8'; g.lineWidth = 2.4; g.stroke(brim);
  g.restore();

  // ---- pointing arm (right hand), in front of the beard ----
  const A = wizArm(Q);
  const sleeve = new Path2D();
  const sh = A.sh, el = A.elbow, hd = A.hand;
  const dx = hd[0] - el[0], dy = hd[1] - el[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  sleeve.moveTo(sh[0] + 50, sh[1] - 10);
  sleeve.quadraticCurveTo(el[0] + 10, el[1] - 60, hd[0] + dx / L * -30 + nx * 34, hd[1] + dy / L * -30 + ny * 34);
  sleeve.lineTo(hd[0] + dx / L * -30 - nx * 90, hd[1] + dy / L * -30 - ny * 90 + 40);
  sleeve.quadraticCurveTo(el[0] + 40, el[1] + 160, sh[0] + 40, sh[1] + 170);
  sleeve.closePath();
  g.fillStyle = '#2b2b2b'; g.fill(sleeve); g.strokeStyle = '#9a9a9a'; g.lineWidth = 2.2; g.stroke(sleeve);
  g.strokeStyle = 'rgba(160,160,160,0.3)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(sh[0] + 30, sh[1] + 60); g.quadraticCurveTo(el[0] + 20, el[1] + 40, hd[0] + dx / L * -40, hd[1] + dy / L * -40 + 20); g.stroke();
  drawWizHand(g, hd[0], hd[1], -1, false, A.k);
  g.restore();
}

// hand: either gripping the staff, or an open palm offered toward the phone
function drawWizHand(g, x, y, s, grip, k = 1) {
  g.save(); g.translate(x, y);
  const skin = g.createLinearGradient(-30, 0, 30, 0);
  skin.addColorStop(0, '#7a7a7a'); skin.addColorStop(1, '#c4c4c4');
  g.fillStyle = skin; g.strokeStyle = '#1e1e1e'; g.lineWidth = 2;
  if (grip) {
    for (let i = 0; i < 4; i++) { rr(g, -22, -28 + i * 15, 44, 15, 7); g.fill(); g.stroke(); }
    rr(g, -30, -36, 18, 34, 8); g.fill(); g.stroke();
  } else {
    // open palm, fingers together, tilted toward the lower left
    g.rotate(lerp(0.9, 0.35, k));
    const palm = curvePath([[-26, -20], [20, -24], [26, 14], [6, 30], [-24, 22]], true, 0.5);
    g.fill(palm); g.stroke(palm);
    for (let i = 0; i < 4; i++) {
      const fy = -18 + i * 11;
      rr(g, -70 + Math.abs(i - 1.5) * 6, fy, 52, 11, 5.5); g.fill(); g.stroke();
    }
    rr(g, -20, 18, 30, 12, 6); g.fill(); g.stroke();
  }
  g.restore();
}

function drawStaffBook(g, x, y, glow) {
  g.save(); g.translate(x, y);
  const lw = 7;
  for (const s of [-1, 1]) {
    const p = new Path2D();
    p.moveTo(0, -50); p.quadraticCurveTo(s * 40, -68, s * 92, -52); p.lineTo(s * 92, 40);
    p.quadraticCurveTo(s * 40, 28, 0, 46); p.closePath();
    g.fillStyle = '#060606'; g.fill(p);
    g.strokeStyle = '#ffffff'; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(p);
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(s * 12, -36); g.quadraticCurveTo(s * 44, -48, s * 80, -40); g.stroke();
  }
  // the two stems curling into the staff (reference)
  g.strokeStyle = '#ffffff'; g.lineWidth = lw;
  g.beginPath(); g.moveTo(-60, 44); g.quadraticCurveTo(-8, 44, -6, 90); g.moveTo(60, 44); g.quadraticCurveTo(8, 44, 6, 90); g.stroke();
  g.restore();
}
