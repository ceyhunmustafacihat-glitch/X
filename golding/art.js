// Flat vector illustrations: people, props, places. Everything is drawn around
// its own origin; place it with at(ctx, x, y, scale, alpha, () => thing(ctx, ...)).

// ---------- people ----------
function bust(ctx, o = {}) {
  const skin = o.skin || C.skin, hair = o.hair || '#3B2A20', shirt = o.shirt || C.teal;
  // hair that sits behind the head
  if (o.hairStyle === 'bun') circle(ctx, 0, -84, 34, hair);
  if (o.hairStyle === 'bob') { rr(ctx, -80, -70, 160, 150, 70); ctx.fillStyle = hair; ctx.fill(); }
  // shoulders
  rr(ctx, -170, 96, 340, 240, [110, 110, 20, 20]); ctx.fillStyle = shirt; ctx.fill();
  rr(ctx, -24, 40, 48, 70, 14); ctx.fillStyle = C.skinD; ctx.fill();
  if (o.collar === 'tie') {
    poly(ctx, [-42, 96, 0, 150, 42, 96, 26, 92, 0, 120, -26, 92], C.white);
    poly(ctx, [-11, 120, 11, 120, 16, 200, 0, 220, -16, 200], o.tie || C.coral);
    poly(ctx, [-60, 100, -10, 170, -40, 330, -110, 330], 'rgba(0,0,0,0.12)');
    poly(ctx, [60, 100, 10, 170, 40, 330, 110, 330], 'rgba(0,0,0,0.12)');
  } else if (o.collar === 'v') {
    poly(ctx, [-36, 98, 0, 150, 36, 98], skin);
  } else if (o.collar === 'round') {
    ctx.beginPath(); ctx.ellipse(0, 100, 46, 22, 0, 0, Math.PI); ctx.fillStyle = C.skinD; ctx.fill();
  } else if (o.collar === 'lab') {
    poly(ctx, [-170, 330, -170, 200, -40, 96, 0, 210, 40, 96, 170, 200, 170, 330], C.white);
    poly(ctx, [-40, 96, 0, 210, 40, 96, 0, 120], o.inner || C.plum);
    line(ctx, 0, 210, 0, 330, '#D9DEE3', 4);
  } else if (o.collar === 'navy') {
    poly(ctx, [-90, 100, 0, 190, 90, 100, 120, 160, 0, 240, -120, 160], '#E9EEF5');
    poly(ctx, [-22, 190, 22, 190, 0, 228], C.white);
    line(ctx, -100, 150, 0, 220, '#3A5A8C', 5); line(ctx, 100, 150, 0, 220, '#3A5A8C', 5);
  }
  if (o.sash) { // suffragette sash: purple, white, green
    ctx.save(); rr(ctx, -170, 96, 340, 240, [110, 110, 20, 20]); ctx.clip();
    ctx.translate(-30, 200); ctx.rotate(-0.85);
    ['#7B3F98', '#FFFFFF', '#3E8E41'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-200, -27 + i * 18, 400, 18); });
    ctx.restore();
  }
  // ears + head
  ell(ctx, -60, 8, 14, 20, C.skinD); ell(ctx, 60, 8, 14, 20, C.skinD);
  ell(ctx, 0, 0, 62, 72, skin);
  // front hair
  ctx.fillStyle = hair; ctx.beginPath();
  switch (o.hairStyle) {
    case 'side':
      ctx.moveTo(-64, 4); ctx.bezierCurveTo(-74, -70, -20, -96, 18, -86); ctx.bezierCurveTo(60, -80, 76, -40, 64, 4);
      ctx.bezierCurveTo(58, -30, 40, -44, 14, -46); ctx.bezierCurveTo(-10, -30, -40, -40, -52, -30); ctx.lineTo(-56, 6); break;
    case 'wavy':
      ctx.moveTo(-64, 10); ctx.bezierCurveTo(-80, -60, -40, -100, 6, -94); ctx.bezierCurveTo(56, -96, 82, -54, 64, 6);
      ctx.bezierCurveTo(54, -24, 50, -42, 30, -44); ctx.bezierCurveTo(20, -30, 0, -36, -6, -46);
      ctx.bezierCurveTo(-18, -30, -40, -34, -50, -28); ctx.lineTo(-56, 10); break;
    case 'bun':
      ctx.moveTo(-62, 10); ctx.bezierCurveTo(-72, -60, -30, -86, 0, -84); ctx.bezierCurveTo(30, -86, 72, -60, 62, 10);
      ctx.bezierCurveTo(52, -30, 20, -50, 0, -40); ctx.bezierCurveTo(-20, -50, -52, -30, -62, 10); break;
    case 'bob':
      ctx.moveTo(-66, 30); ctx.bezierCurveTo(-74, -64, -20, -92, 10, -88); ctx.bezierCurveTo(60, -84, 76, -40, 66, 30);
      ctx.bezierCurveTo(56, -10, 50, -36, 10, -40); ctx.bezierCurveTo(-30, -36, -50, -10, -66, 30); break;
    case 'kid':
      ctx.moveTo(-62, 0); ctx.bezierCurveTo(-70, -70, -20, -90, 4, -88); ctx.bezierCurveTo(50, -86, 74, -50, 62, 0);
      ctx.lineTo(50, -30); ctx.lineTo(30, -24); ctx.lineTo(16, -36); ctx.lineTo(-4, -26); ctx.lineTo(-20, -38); ctx.lineTo(-40, -26); ctx.lineTo(-54, -30); break;
    case 'old':
      ctx.moveTo(-64, 10); ctx.bezierCurveTo(-76, -40, -60, -70, -36, -74); ctx.bezierCurveTo(-30, -60, -50, -40, -54, 4);
      ctx.moveTo(64, 10); ctx.bezierCurveTo(76, -40, 60, -70, 36, -74); ctx.bezierCurveTo(30, -60, 50, -40, 54, 4);
      ctx.moveTo(-30, -70); ctx.bezierCurveTo(-10, -84, 16, -84, 32, -70); ctx.bezierCurveTo(10, -76, -10, -76, -30, -70); break;
    default: break;
  }
  ctx.fill();
  // face
  const ey = o.eyeY || 6;
  ell(ctx, -22, ey, 6.5, 8.5, C.ink); ell(ctx, 22, ey, 6.5, 8.5, C.ink);
  line(ctx, -32, ey - 20, -12, ey - 22 - (o.brow || 0), o.browC || hair, 5); line(ctx, 32, ey - 20, 12, ey - 22 - (o.brow || 0), o.browC || hair, 5);
  ctx.globalAlpha *= 0.35; circle(ctx, -36, 30, 11, '#E8897A'); circle(ctx, 36, 30, 11, '#E8897A'); ctx.globalAlpha /= 0.35;
  ctx.beginPath(); ctx.arc(0, 20, 7, 0.2, Math.PI - 0.2); ctx.strokeStyle = C.skinD; ctx.lineWidth = 4; ctx.stroke();
  if (o.beard) {
    ctx.fillStyle = o.beard; ctx.beginPath();
    ctx.moveTo(-60, 4); ctx.bezierCurveTo(-64, 70, -30, 112, 0, 116); ctx.bezierCurveTo(30, 112, 64, 70, 60, 4);
    ctx.bezierCurveTo(50, 30, 34, 30, 24, 34); ctx.bezierCurveTo(10, 28, -10, 28, -24, 34); ctx.bezierCurveTo(-34, 30, -50, 30, -60, 4); ctx.fill();
    ell(ctx, 0, 52, 14, 6, '#B9706A');
  } else {
    ctx.beginPath(); ctx.arc(0, 36, 16, 0.25, Math.PI - 0.25); ctx.strokeStyle = '#B9706A'; ctx.lineWidth = 5; ctx.stroke();
  }
  if (o.moustache) { ctx.beginPath(); ctx.ellipse(-12, 34, 16, 7, 0.2, 0, Math.PI * 2); ctx.ellipse(12, 34, 16, 7, -0.2, 0, Math.PI * 2); ctx.fillStyle = o.moustache; ctx.fill(); }
  if (o.glasses) {
    ctx.strokeStyle = o.glasses; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.arc(-22, ey, 17, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(22, ey, 17, 0, Math.PI * 2); ctx.stroke();
    line(ctx, -5, ey, 5, ey, o.glasses, 4); line(ctx, -39, ey - 2, -58, ey - 6, o.glasses, 4); line(ctx, 39, ey - 2, 58, ey - 6, o.glasses, 4);
  }
  if (o.cap === 'sailor') {
    ell(ctx, 0, -64, 70, 18, C.white); rr(ctx, -56, -96, 112, 34, 14); ctx.fillStyle = C.white; ctx.fill();
    rr(ctx, -58, -70, 116, 12, 5); ctx.fillStyle = C.navy; ctx.fill();
  }
}

// Portrait medallion: bust clipped into a circle
function portrait(ctx, r, bg, o) {
  circle(ctx, 8, 12, r + 14, 'rgba(30,42,58,0.18)');
  circle(ctx, 0, 0, r + 14, C.paper); circle(ctx, 0, 0, r, bg);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  ctx.translate(0, r * 0.05); ctx.scale(r / 190, r / 190); bust(ctx, o); ctx.restore();
}

// Full-body child. origin = between the feet on the ground
function kid(ctx, o = {}) {
  const s = o.swing || 0, skin = o.skin || C.skin;
  const legL = Math.sin(s) * 0.45, legR = -Math.sin(s) * 0.45;
  const leg = (a, x) => { ctx.save(); ctx.translate(x, -120); ctx.rotate(a); line(ctx, 0, 0, 0, 104, o.pants || C.ink2, 26); ell(ctx, 6, 112, 22, 11, C.ink); ctx.restore(); };
  leg(legL, -16); leg(legR, 16);
  const arm = (a, x, prop) => {
    ctx.save(); ctx.translate(x, -230); ctx.rotate(a); line(ctx, 0, 0, 0, 92, o.shirt || C.coral, 22); circle(ctx, 0, 100, 13, skin);
    if (prop === 'stick') { line(ctx, 0, 100, 0, -40, '#8B5A2B', 9); }
    ctx.restore();
  };
  arm(o.armL ?? 0.25, -38, o.propL); arm(-(o.armR ?? 0.25), 38, o.propR);
  rr(ctx, -46, -250, 92, 140, [30, 30, 14, 14]); ctx.fillStyle = o.shirt || C.coral; ctx.fill();
  circle(ctx, 0, -300, 50, skin);
  ctx.fillStyle = o.hair || '#4A3020'; ctx.beginPath(); ctx.arc(0, -306, 52, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
  ell(ctx, -16, -296, 5, 6.5, C.ink); ell(ctx, 16, -296, 5, 6.5, C.ink);
  ctx.beginPath();
  if (o.mood === 'angry') { line(ctx, -26, -316, -8, -308, C.ink, 4); line(ctx, 26, -316, 8, -308, C.ink, 4); ctx.arc(0, -268, 10, Math.PI + 0.3, -0.3); }
  else ctx.arc(0, -282, 12, 0.3, Math.PI - 0.3);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.stroke();
  if (o.shield) { circle(ctx, 40, -170, 58, '#8B5A2B'); circle(ctx, 40, -170, 44, '#B07A45'); circle(ctx, 40, -170, 12, C.mustard); }
}

// ---------- props ----------
function flask(ctx, liquid = C.teal) {
  poly(ctx, [-22, -110, 22, -110, 22, -40, 80, 70, -80, 70, -22, -40], 'rgba(255,255,255,0.85)');
  poly(ctx, [-56, 26, 56, 26, 80, 70, -80, 70], liquid);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  poly(ctx, [-22, -110, 22, -110, 22, -40, 80, 70, -80, 70, -22, -40]); ctx.stroke();
  line(ctx, -32, -112, 32, -112, C.ink, 9);
  circle(ctx, -10, 46, 8, 'rgba(255,255,255,0.6)'); circle(ctx, 18, 36, 5, 'rgba(255,255,255,0.6)');
}
function atom(ctx, t = 0, col = C.coral) {
  ctx.strokeStyle = col; ctx.lineWidth = 6;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 70, 24, i * Math.PI / 3, 0, Math.PI * 2); ctx.stroke(); }
  circle(ctx, 0, 0, 14, col);
  for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1, r = i * Math.PI / 3; circle(ctx, Math.cos(a) * 70 * Math.cos(r) - Math.sin(a) * 24 * Math.sin(r), Math.cos(a) * 70 * Math.sin(r) + Math.sin(a) * 24 * Math.cos(r), 8, C.ink); }
}
function bookClosed(ctx, w, h, col, o = {}) {
  rr(ctx, -w / 2 + 8, -h / 2 + 10, w, h, 10); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
  rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.fillStyle = col; ctx.fill();
  rr(ctx, w / 2 - 16, -h / 2 + 8, 10, h - 16, 3); ctx.fillStyle = '#FFF6E0'; ctx.fill();
  rr(ctx, -w / 2, -h / 2, 18, h, [10, 0, 0, 10]); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
  if (o.band) { ctx.fillStyle = o.band; ctx.fillRect(-w / 2 + 18, -h * 0.18, w - 34, h * 0.1); ctx.fillRect(-w / 2 + 18, h * 0.08, w - 34, h * 0.05); }
}
function bookOpen(ctx, w, h, col = C.coral) {
  poly(ctx, [-w / 2 - 12, -h / 2 + 10, 0, -h / 2 + 30, w / 2 + 12, -h / 2 + 10, w / 2 + 12, h / 2 + 12, 0, h / 2 + 30, -w / 2 - 12, h / 2 + 12], col);
  ctx.fillStyle = C.paper;
  ctx.beginPath(); ctx.moveTo(0, -h / 2 + 18); ctx.quadraticCurveTo(-w / 4, -h / 2 - 6, -w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2); ctx.quadraticCurveTo(-w / 4, h / 2 - 6, 0, h / 2 + 18); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -h / 2 + 18); ctx.quadraticCurveTo(w / 4, -h / 2 - 6, w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.quadraticCurveTo(w / 4, h / 2 - 6, 0, h / 2 + 18); ctx.fill();
  line(ctx, 0, -h / 2 + 18, 0, h / 2 + 18, 'rgba(0,0,0,0.15)', 3);
}
function textLines(ctx, x, y, w, n, gap, col, k = 1) {
  for (let i = 0; i < n; i++) { const lw = w * (i % 4 === 3 ? 0.55 : 0.92 - rnd(i + x) * 0.15) * clamp(k * n - i); if (lw > 0) line(ctx, x, y + i * gap, x + lw, y + i * gap, col, 6); }
}
function ring(ctx, col = C.gold, gem = true) {
  ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.stroke();
  if (gem) { poly(ctx, [-20, -58, 20, -58, 30, -46, 0, -24, -30, -46], '#9ADBF0'); poly(ctx, [-20, -58, 0, -58, 0, -24, -30, -46], '#C8EEF8'); }
}
function heart(ctx, r, col = C.coral) {
  ctx.beginPath(); ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.7, -r * 1.3, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.7, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9); ctx.fillStyle = col; ctx.fill();
}
function palm(ctx, h, lean, t = 0) {
  ctx.strokeStyle = '#7A5230'; ctx.lineWidth = 20; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(lean * 0.3, -h * 0.6, lean, -h); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.62 + Math.sin(t * 1.3 + i) * 0.04, L = 150;
    ctx.save(); ctx.translate(lean, -h); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -40, L, 30); ctx.quadraticCurveTo(L * 0.5, -6, 0, 0);
    ctx.fillStyle = i % 2 ? C.greenD : C.green; ctx.fill(); ctx.restore();
  }
  circle(ctx, lean - 8, -h + 12, 13, '#6B4423'); circle(ctx, lean + 12, -h + 16, 13, '#6B4423');
}
function conch(ctx) {
  ctx.beginPath(); ctx.moveTo(-110, 20); ctx.bezierCurveTo(-90, -70, 40, -90, 110, -20); ctx.bezierCurveTo(70, 0, 60, 50, 20, 60);
  ctx.bezierCurveTo(-30, 70, -90, 50, -110, 20); ctx.fillStyle = '#F7D7C4'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(110, -20); ctx.bezierCurveTo(60, -10, 40, 30, 20, 60); ctx.bezierCurveTo(50, 50, 80, 20, 110, -20); ctx.fillStyle = '#F2A99A'; ctx.fill();
  ctx.strokeStyle = '#D9927F'; ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-90 + i * 30, 30 - i * 6); ctx.quadraticCurveTo(-70 + i * 30, -40 + i * 4, -40 + i * 34, -56 + i * 6); ctx.stroke(); }
  poly(ctx, [-110, 20, -150, 0, -140, 30], '#F2C4B3');
}
function specs(ctx, col = C.ink) {
  ctx.strokeStyle = col; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(-46, 0, 36, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(46, 0, 36, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-12, -4); ctx.quadraticCurveTo(0, -16, 12, -4); ctx.stroke();
  ctx.fillStyle = 'rgba(200,235,245,0.45)'; ctx.beginPath(); ctx.arc(-46, 0, 32, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(46, 0, 32, 0, Math.PI * 2); ctx.fill();
  line(ctx, -36, -14, -22, 8, 'rgba(255,255,255,0.8)', 4); // crack in one lens
  line(ctx, -22, 8, -30, 22, 'rgba(255,255,255,0.8)', 4);
}
function fly(ctx, t = 0) {
  const fl = Math.sin(t * 60) * 0.35;
  ctx.save(); ctx.rotate(-0.5 + fl); ell(ctx, -14, -22, 26, 12, 'rgba(220,240,255,0.75)'); ctx.restore();
  ctx.save(); ctx.rotate(0.5 - fl); ell(ctx, 14, -22, 26, 12, 'rgba(220,240,255,0.75)'); ctx.restore();
  ell(ctx, 0, 0, 14, 22, '#1F2A2E'); circle(ctx, 0, -22, 12, '#1F2A2E'); circle(ctx, -6, -26, 5, '#B03A2E'); circle(ctx, 6, -26, 5, '#B03A2E');
}
function cloudPuff(ctx, r, col) { [[-r, 0, r * 0.8], [0, -r * 0.4, r], [r, 0, r * 0.8], [r * 0.4, r * 0.3, r * 0.7], [-r * 0.4, r * 0.3, r * 0.7]].forEach(([x, y, rr_]) => circle(ctx, x, y, rr_, col)); }
function star(ctx, r, col, n = 5) {
  ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr_ = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr_, Math.sin(a) * rr_); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function arrow(ctx, x1, y1, x2, y2, col, w = 10, k = 1) {
  const x = lerp(x1, x2, k), y = lerp(y1, y2, k); if (k <= 0) return;
  line(ctx, x1, y1, x, y, col, w); const a = Math.atan2(y2 - y1, x2 - x1);
  poly(ctx, [x + Math.cos(a) * 14, y + Math.sin(a) * 14, x + Math.cos(a + 2.5) * 30, y + Math.sin(a + 2.5) * 30, x + Math.cos(a - 2.5) * 30, y + Math.sin(a - 2.5) * 30], col);
}

// ---------- places ----------
function church(ctx, col = '#2B3A63', win_ = '#F6D27A') {
  rr(ctx, -130, -200, 260, 200, 4); ctx.fillStyle = col; ctx.fill();
  poly(ctx, [-150, -200, 0, -300, 150, -200], col);
  rr(ctx, 120, -330, 110, 330, 4); ctx.fill();
  poly(ctx, [110, -330, 175, -520, 240, -330], col);
  line(ctx, 175, -520, 175, -580, col, 8, 'butt'); line(ctx, 150, -555, 200, -555, col, 8, 'butt');
  ctx.fillStyle = win_; rr(ctx, -40, -170, 80, 110, [40, 40, 0, 0]); ctx.fill();
  rr(ctx, 155, -280, 40, 70, [20, 20, 0, 0]); ctx.fill();
}
function grave(ctx, kind, col = '#3D4B78') {
  if (kind === 0) { rr(ctx, -40, -110, 80, 110, [40, 40, 0, 0]); ctx.fillStyle = col; ctx.fill(); }
  else if (kind === 1) { line(ctx, 0, 0, 0, -130, col, 22, 'butt'); line(ctx, -40, -90, 40, -90, col, 22, 'butt'); }
  else { rr(ctx, -50, -80, 100, 80, 8); ctx.fillStyle = col; ctx.fill(); }
}
function house(ctx, wall, roof, lit) {
  rr(ctx, -200, -300, 400, 300, 4); ctx.fillStyle = wall; ctx.fill();
  poly(ctx, [-230, -300, 0, -470, 230, -300], roof);
  rr(ctx, 110, -460, 50, 110, 2); ctx.fillStyle = roof; ctx.fill();
  [[-130, -250], [50, -250]].forEach(([x, y]) => { rr(ctx, x, y, 80, 90, 6); ctx.fillStyle = lit; ctx.fill(); line(ctx, x + 40, y, x + 40, y + 90, wall, 6, 'butt'); line(ctx, x, y + 45, x + 80, y + 45, wall, 6, 'butt'); });
  rr(ctx, -40, -140, 80, 140, [40, 40, 0, 0]); ctx.fillStyle = roof; ctx.fill();
}
function schoolBuilding(ctx) {
  rr(ctx, -360, -330, 720, 330, 6); ctx.fillStyle = C.brick; ctx.fill();
  poly(ctx, [-390, -330, 0, -470, 390, -330], '#7E3B2A');
  rr(ctx, -70, -420, 140, 420, 6); ctx.fillStyle = '#C46A4F'; ctx.fill();
  poly(ctx, [-90, -420, 0, -520, 90, -420], '#7E3B2A');
  circle(ctx, 0, -360, 40, C.paper); line(ctx, 0, -360, 0, -388, C.ink, 6); line(ctx, 0, -360, 20, -350, C.ink, 6);
  ctx.fillStyle = '#F7E3B5';
  for (let i = 0; i < 4; i++) { const x = i < 2 ? -320 + i * 120 : 120 + (i - 2) * 120; rr(ctx, x, -270, 80, 100, [40, 40, 0, 0]); ctx.fill(); rr(ctx, x, -130, 80, 90, 4); ctx.fill(); }
  rr(ctx, -44, -170, 88, 170, [44, 44, 0, 0]); ctx.fillStyle = '#5B2C1F'; ctx.fill();
}
function oxfordSkyline(ctx, col) {
  ctx.fillStyle = col;
  // Radcliffe Camera style dome
  rr(ctx, -120, -260, 240, 260, 4); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -260, 110, Math.PI, 0); ctx.fill(); rr(ctx, -14, -400, 28, 50, 6); ctx.fill();
  const spire = (x, w, h) => { rr(ctx, x - w / 2, -h * 0.55, w, h * 0.55, 2); ctx.fill(); poly(ctx, [x - w / 2 - 6, -h * 0.55, x, -h, x + w / 2 + 6, -h * 0.55], col); };
  spire(-300, 70, 560); spire(260, 60, 480); spire(-470, 50, 380); spire(430, 80, 300);
  rr(ctx, -560, -200, 1120, 200, 2); ctx.fill();
  for (let x = -540; x < 540; x += 40) ctx.fillRect(x, -224, 22, 26);
}
function warship(ctx, o = {}) {
  const hull = o.hull || '#5D6D7E', sup = o.sup || '#7F8C9A';
  poly(ctx, [-360, -50, 380, -50, 340, 30, -330, 30, -360, -10], hull);
  rr(ctx, -200, -120, 300, 72, 6); ctx.fillStyle = sup; ctx.fill();
  rr(ctx, -110, -190, 140, 72, 6); ctx.fill();
  rr(ctx, -60, -270, 40, 82, 4); ctx.fill(); line(ctx, -40, -270, -40, -330, sup, 6);
  rr(ctx, 30, -170, 60, 60, [10, 10, 0, 0]); ctx.fillStyle = hull; ctx.fill(); // funnel
  [[-270, -66], [180, -66], [250, -66]].forEach(([x, y]) => { rr(ctx, x - 34, y - 26, 68, 34, 10); ctx.fillStyle = sup; ctx.fill(); line(ctx, x + 20, y - 12, x + 100, y - 18, sup, 9); });
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-340, 0, 670, 30);
  if (o.flag) { line(ctx, -330, -50, -330, -120, '#333', 4); rr(ctx, -330, -120, 60, 36, 2); ctx.fillStyle = C.white; ctx.fill(); line(ctx, -300, -120, -300, -84, C.red, 7, 'butt'); line(ctx, -330, -102, -270, -102, C.red, 7, 'butt'); }
}
function biplane(ctx, col = '#C7CFD6') {
  rr(ctx, -70, -10, 140, 22, 10); ctx.fillStyle = col; ctx.fill();
  rr(ctx, -40, -40, 90, 10, 4); ctx.fill(); rr(ctx, -40, 20, 90, 10, 4); ctx.fill();
  line(ctx, -30, -30, -30, 20, col, 4); line(ctx, 40, -30, 40, 20, col, 4);
  poly(ctx, [-70, -10, -92, -34, -80, 0], col); circle(ctx, 76, 1, 8, '#555');
}

// ---------- Great Britain outline (lon, lat), simplified ----------
const GB = [[-5.7, 50.07], [-5.2, 49.96], [-4.6, 50.32], [-4.1, 50.35], [-3.64, 50.22], [-3.4, 50.6], [-2.45, 50.58], [-1.95, 50.7], [-1.3, 50.78],
  [-0.8, 50.73], [-0.1, 50.82], [0.25, 50.73], [0.97, 50.91], [1.38, 51.13], [1.45, 51.38], [0.6, 51.5], [0.9, 51.62], [1.15, 51.8], [1.3, 51.95],
  [1.75, 52.47], [1.3, 52.93], [0.5, 52.95], [0.2, 52.8], [0.35, 53.15], [0.12, 53.58], [-0.08, 54.12], [-0.6, 54.49], [-1.2, 54.69], [-1.42, 55.02],
  [-2.0, 55.77], [-2.13, 55.9], [-2.5, 56.0], [-3.2, 56.0], [-2.58, 56.28], [-2.9, 56.45], [-2.45, 56.7], [-2.08, 57.15], [-1.8, 57.6], [-2.0, 57.69],
  [-3.3, 57.72], [-4.0, 57.55], [-3.77, 57.86], [-3.08, 58.43], [-3.03, 58.64], [-3.37, 58.67], [-5.0, 58.62], [-5.3, 58.3], [-5.4, 57.9],
  [-5.8, 57.5], [-5.7, 57.28], [-5.83, 56.99], [-6.22, 56.73], [-5.47, 56.41], [-5.8, 55.3], [-5.5, 55.65], [-4.9, 55.9], [-4.63, 55.46],
  [-4.95, 55.0], [-4.86, 54.63], [-4.4, 54.73], [-3.6, 54.95], [-3.4, 54.6], [-3.63, 54.49], [-3.2, 54.1], [-2.9, 54.07], [-3.05, 53.82],
  [-3.05, 53.42], [-3.3, 53.35], [-3.8, 53.32], [-4.6, 53.4], [-4.4, 53.15], [-4.75, 52.8], [-4.1, 52.6], [-4.08, 52.41], [-4.7, 52.1],
  [-5.3, 51.88], [-5.1, 51.7], [-4.3, 51.65], [-4.3, 51.55], [-3.95, 51.6], [-3.17, 51.45], [-2.65, 51.6], [-2.95, 51.45], [-3.0, 51.33],
  [-3.5, 51.2], [-4.2, 51.2], [-4.53, 51.02], [-4.75, 50.75], [-4.95, 50.55], [-5.08, 50.42], [-5.48, 50.21]];
const PLACES = { newquay: [-5.08, 50.415], marlborough: [-1.73, 51.42], oxford: [-1.26, 51.75], perran: [-5.12, 50.21] };
// cam: {lon, lat, scale} -> screen centre (W/2, cy)
function proj(cam, lon, lat, cy) { return [W / 2 + (lon - cam.lon) * cam.scale * 0.6, cy - (lat - cam.lat) * cam.scale]; }
function drawGB(ctx, cam, cy, land = C.sand, edge = C.sandD) {
  const path = () => { ctx.beginPath(); GB.forEach(([lo, la], i) => { const [x, y] = proj(cam, lo, la, cy); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
  ctx.save(); ctx.translate(10, 14); path(); ctx.fillStyle = 'rgba(20,72,92,0.25)'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = land; ctx.fill(); ctx.lineJoin = 'round'; ctx.strokeStyle = edge; ctx.lineWidth = 5; ctx.stroke();
}
function pin(ctx, col = C.coral) {
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-14, -26, -40, -46, -40, -78); ctx.arc(0, -78, 40, Math.PI, 0); ctx.bezierCurveTo(40, -46, 14, -26, 0, 0);
  ctx.fillStyle = col; ctx.fill(); circle(ctx, 0, -78, 15, C.paper);
}
function tag(ctx, txt, col = C.ink, bg = C.paper, size = 36) {
  ctx.font = `700 ${size}px Montserrat`; const w = ctx.measureText(txt).width + 44, h = size + 30;
  rr(ctx, 6, -h / 2 + 8, w, h, h / 2); ctx.fillStyle = 'rgba(30,42,58,0.2)'; ctx.fill();
  rr(ctx, 0, -h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = col; ctx.textBaseline = 'middle'; ctx.fillText(txt, 22, 2); ctx.textBaseline = 'alphabetic';
}
