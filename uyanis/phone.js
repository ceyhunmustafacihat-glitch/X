'use strict';
// The phone: a loud, violent feed, then the sözlükdeus post and profile.
// Screen content is drawn in native screen units (SW x SH), then placed in the shot.

const SW = 900, SH = 1950;
const FEEDP = { top: 150, postH: 1340, mediaY: 100, mediaH: 1125, K: 8, landY: 250 };
const PostArt = {};
let AvatarImg = null;

function loadAvatar() {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => { AvatarImg = im; res(); };
    im.onerror = () => res();
    im.src = 'assets/avatar.jpg';
  });
}

// ---------- the page's three posts, painted once ----------
const POSTS = {
  abadi: {
    word: '“Abadi”',
    def: [{ t: 'Açık saman renginde, ipekten yapılan, yarı mat, kalınca bir ' }, { t: 'yazı kâğıdı', b: 1 }, { t: ' türü. Adını Hindistan\'ın ' },
      { t: 'Devletâbâd', b: 1 }, { t: ' şehrinden alan bu kâğıt, geçmişte yazı yazmak ve hat sanatında kullanılmıştır.' }],
    ex: [{ t: '“Hattat, özenle hazırladığı ' }, { t: 'abadi', b: 1 }, { t: ' kâğıdının üzerine zarif harfler işledi.”' }]
  },
  aba: {
    word: '“Aba”',
    def: [{ t: 'Yünden yapılan kalın ve kaba ' }, { t: 'kumaş', b: 1 }, { t: ' veya bu kumaştan üretilen geleneksel üst ' }, { t: 'giysi', b: 1 }, { t: '.' }],
    ex: [{ t: '“Yaşlı derviş, sırtındaki eski ' }, { t: 'abasına', b: 1 }, { t: ' sarınarak soğuk kış gecesinde ağır adımlarla yoluna devam etti.”' }]
  },
  ab: {
    word: '“Ab”',
    def: [{ t: 'Farsça kökenli bir kelime olup ' }, { t: '"su"', b: 1 }, { t: ' demektir.' }],
    ex: [{ t: '“Kelâm, gönülden doğmadıkça dudaklarda kurur; gönülden doğarsa, çorak ruhlara ' }, { t: 'âb', b: 1 }, { t: ' olur.”' }]
  }
};

function paintBg(kind, w, h) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const R = mulberry32(kind.length * 99 + 3);
  g.save(); g.scale(w / 300, h / 400);
  if (kind === 'abadi') {
    // dark desk, a stack of cream paper, an inkwell and a lantern glow
    let gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#1c140d'); gr.addColorStop(1, '#2e2016');
    g.fillStyle = gr; g.fillRect(0, 0, 300, 400);
    drawGlow(g, 270, 60, 140, '#c98a3a', 0.55);
    g.fillStyle = '#3a2a1c'; g.fillRect(0, 250, 300, 150);
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${0.15 + R() * 0.1})`; g.fillRect(0, 262 + i * 22, 300, 2); }
    g.save(); g.translate(78, 400); g.scale(0.72, 0.72); g.rotate(-0.06); g.globalAlpha = 0.75;
    for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#d9c8a0' : '#cdb98e'; g.fillRect(-90, -40 - i * 4, 190, 60); }
    g.fillStyle = '#e6d6b0'; g.fillRect(-90, -72, 190, 56);
    g.restore();
    g.fillStyle = '#0d0b09'; g.beginPath(); g.ellipse(40, 268, 18, 8, 0, 0, TAU); g.fill(); g.fillRect(24, 240, 32, 28);
    g.fillStyle = '#2a201a'; g.fillRect(250, 20, 40, 90);
    drawGlow(g, 270, 60, 40, '#ffd28a', 0.9);
  } else if (kind === 'aba') {
    let gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#16120e'); gr.addColorStop(1, '#2a221a');
    g.fillStyle = gr; g.fillRect(0, 0, 300, 400);
    drawGlow(g, 150, 160, 160, '#8a6a46', 0.35);
    g.fillStyle = '#2a2018'; g.fillRect(146, 10, 8, 380); g.fillRect(100, 26, 100, 8);
    const cl = new Path2D(); cl.moveTo(110, 40); cl.lineTo(190, 40); cl.lineTo(230, 330); cl.lineTo(70, 330); cl.closePath();
    gr = g.createLinearGradient(70, 0, 230, 0); gr.addColorStop(0, '#3e3226'); gr.addColorStop(0.5, '#6a5844'); gr.addColorStop(1, '#3a2e22');
    g.fillStyle = gr; g.fill(cl);
    g.strokeStyle = 'rgba(20,14,10,0.6)'; g.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(112 + i * 9, 44); g.lineTo(80 + i * 18, 328); g.stroke(); }
    g.fillStyle = '#1a140f'; g.beginPath(); g.ellipse(40, 360, 26, 34, 0, 0, TAU); g.fill();
    g.fillStyle = '#4a2a1e'; g.fillRect(0, 370, 300, 30);
  } else {
    let gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#5a6a78'); gr.addColorStop(0.35, '#2e3a40'); gr.addColorStop(1, '#141c1e');
    g.fillStyle = gr; g.fillRect(0, 0, 300, 400);
    g.fillStyle = '#c8d0d4'; g.beginPath(); g.moveTo(40, 120); g.lineTo(110, 40); g.lineTo(170, 110); g.lineTo(220, 60); g.lineTo(290, 130); g.lineTo(40, 130); g.fill();
    g.fillStyle = '#26342e'; g.beginPath(); g.moveTo(0, 140); for (let x = 0; x <= 300; x += 15) g.lineTo(x, 120 + R() * 30); g.lineTo(300, 200); g.lineTo(0, 200); g.fill();
    g.fillStyle = '#3a3c38'; g.fillRect(0, 170, 300, 120);
    gr = g.createLinearGradient(0, 160, 0, 300); gr.addColorStop(0, '#e8f0f2'); gr.addColorStop(1, '#8aa0a8');
    g.fillStyle = gr; g.fillRect(120, 160, 60, 140);
    gr = g.createLinearGradient(0, 290, 0, 400); gr.addColorStop(0, '#2a4a50'); gr.addColorStop(1, '#0e1a1c');
    g.fillStyle = gr; g.fillRect(0, 290, 300, 110);
    g.fillStyle = 'rgba(220,235,240,0.4)'; for (let i = 0; i < 30; i++) g.fillRect(R() * 300, 300 + R() * 90, 10 + R() * 20, 2);
  }
  g.restore();
  // darken behind the type, like the page's template
  const sh = g.createLinearGradient(0, 0, 0, h);
  sh.addColorStop(0, 'rgba(0,0,0,0.35)'); sh.addColorStop(0.5, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = sh; g.fillRect(0, 0, w, h);
  return c;
}

function wrapRuns(g, runs, maxW, font, boldFont) {
  const words = [];
  for (const r of runs) for (const [i, wd] of r.t.split(' ').entries()) { if (i > 0) words.push({ sp: 1 }); if (wd) words.push({ t: wd, b: r.b }); }
  const lines = [[]]; let x = 0;
  for (const wd of words) {
    if (wd.sp) { if (x > 0) { g.font = font; x += g.measureText(' ').width; lines[lines.length - 1].push({ t: ' ' }); } continue; }
    g.font = wd.b ? boldFont : font;
    const ww = g.measureText(wd.t).width;
    if (x + ww > maxW && x > 0) { const L = lines[lines.length - 1]; if (L.length && L[L.length - 1].t === ' ') L.pop(); lines.push([]); x = 0; }
    lines[lines.length - 1].push(wd); x += ww;
  }
  return lines;
}
function drawRunLine(g, line, x, y, font, boldFont, align) {
  let tw = 0;
  for (const r of line) { g.font = r.b ? boldFont : font; tw += g.measureText(r.t).width; }
  let cx = align === 'center' ? x - tw / 2 : x;
  g.textAlign = 'left';
  for (const r of line) { g.font = r.b ? boldFont : font; g.fillText(r.t, cx, y); cx += g.measureText(r.t).width; }
}

function paintPost(kind, w, h) {
  const c = paintBg(kind, w, h), g = c.getContext('2d');
  const P = POSTS[kind], u = w / 300;
  g.fillStyle = '#ffffff'; g.textBaseline = 'alphabetic'; g.textAlign = 'center';
  g.font = `700 ${17 * u}px Montserrat`; g.fillText(P.word, w / 2, 122 * u);
  g.font = `italic 400 ${5 * u}px Montserrat`; g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillText('Sözlük', w / 2, 132 * u);
  g.fillStyle = 'rgba(255,255,255,0.95)';
  const f = `400 ${7.4 * u}px Montserrat`, fb = `700 ${7.4 * u}px Montserrat`;
  const lines = wrapRuns(g, P.def, 240 * u, f, fb);
  const y0 = 172 * u, lh = 9.6 * u;
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(22 * u, y0 - 8 * u, 1.4 * u, lines.length * lh + 2 * u);
  g.fillStyle = '#ffffff';
  lines.forEach((L, i) => drawRunLine(g, L, 30 * u, y0 + i * lh, f, fb, 'left'));
  const ex = wrapRuns(g, P.ex, 230 * u, `400 ${7.6 * u}px Montserrat`, `700 ${7.6 * u}px Montserrat`);
  ex.forEach((L, i) => drawRunLine(g, L, w / 2, 256 * u + i * 10 * u, `400 ${7.6 * u}px Montserrat`, `700 ${7.6 * u}px Montserrat`, 'center'));
  drawOpenBook(g, w / 2, 372 * u, 14 * u, '#ffffff', 1.4 * u);
  return c;
}

function warmPhone() {
  PostArt.feed = paintPost('abadi', SW, FEEDP.mediaH);
  PostArt.grid = ['abadi', 'aba', 'ab'].map(k => paintPost(k, 296, 395));
}

// ---------- junk content: loud, violent, empty (no words) ----------
function drawJunk(g, idx, x, y, w, h, t) {
  const kind = idx % 8;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const cx = x + w / 2, cy = y + h / 2;
  const shake = Math.sin(t * 40 + idx) * 6;
  if (kind === 0) {          // brawl: two silhouettes trading punches, impact burst
    g.fillStyle = '#7a0f12'; g.fillRect(x, y, w, h);
    drawGlow(g, cx, cy - 60, 420, '#ff3a20', 0.6);
    g.fillStyle = '#120404';
    for (const s of [-1, 1]) {
      g.save(); g.translate(cx + s * 170 + shake * s, cy + 80);
      g.beginPath(); g.arc(0, -300, 70, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-90, -220); g.lineTo(90, -220); g.lineTo(70, 120); g.lineTo(-70, 120); g.closePath(); g.fill();
      g.lineCap = 'round'; g.strokeStyle = '#120404'; g.lineWidth = 56;
      g.beginPath(); g.moveTo(0, -180); g.lineTo(-s * 150, -230 + Math.sin(t * 14 + s) * 30); g.stroke();
      g.beginPath(); g.moveTo(-40, 110); g.lineTo(-70, 420); g.moveTo(40, 110); g.lineTo(80, 420); g.stroke();
      g.restore();
    }
    drawBurst(g, cx, cy - 170, 120 + 30 * Math.sin(t * 20), '#ffe14a', '#ff7a1a');
  } else if (kind === 1) {   // explosion
    g.fillStyle = '#1a0a04'; g.fillRect(x, y, w, h);
    for (let i = 0; i < 9; i++) drawGlow(g, cx + Math.cos(i * 0.7) * 160, cy + Math.sin(i * 1.3) * 120, 300, i % 2 ? '#ff6a10' : '#ffb020', 0.8);
    drawGlow(g, cx, cy, 200, '#fff3b0', 1);
    g.fillStyle = '#2a1810'; g.fillRect(x, y + h - 220, w, 220);
    g.fillStyle = '#100804'; for (let i = 0; i < 6; i++) g.fillRect(x + 60 + i * 140, y + h - 320 - (i % 3) * 60, 90, 320);
  } else if (kind === 2) {   // screaming face
    g.fillStyle = '#d02a8a'; g.fillRect(x, y, w, h);
    g.fillStyle = '#f2c09a'; g.beginPath(); g.ellipse(cx + shake, cy, 300, 380, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx - 110, cy - 110, 70, 80, 0, 0, TAU); g.ellipse(cx + 110, cy - 110, 70, 80, 0, 0, TAU); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(cx - 110, cy - 100, 18, 0, TAU); g.arc(cx + 110, cy - 100, 18, 0, TAU); g.fill();
    g.fillStyle = '#3a0808'; g.beginPath(); g.ellipse(cx, cy + 160, 120, 150 + 20 * Math.sin(t * 18), 0, 0, TAU); g.fill();
    g.strokeStyle = '#6a2a10'; g.lineWidth = 16; g.beginPath(); g.moveTo(cx - 180, cy - 210); g.lineTo(cx - 50, cy - 170); g.moveTo(cx + 180, cy - 210); g.lineTo(cx + 50, cy - 170); g.stroke();
  } else if (kind === 3) {   // car crash with sparks
    g.fillStyle = '#2a3440'; g.fillRect(x, y, w, h);
    g.fillStyle = '#3a3a3a'; g.fillRect(x, cy + 120, w, h);
    g.fillStyle = '#d42a2a'; rr(g, cx - 380, cy - 20, 360, 150, 30); g.fill();
    g.save(); g.translate(cx + 200, cy + 30); g.rotate(-0.35); g.fillStyle = '#2a6ad4'; rr(g, -160, -70, 330, 150, 30); g.fill(); g.restore();
    for (let i = 0; i < 18; i++) { const a = i * 0.9 + t * 3; g.strokeStyle = '#ffd24a'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cy + 40); g.lineTo(cx + Math.cos(a) * (120 + (i % 4) * 60), cy + 40 + Math.sin(a) * (90 + (i % 3) * 50)); g.stroke(); }
    drawGlow(g, cx, cy + 40, 220, '#ffcf5a', 0.9);
  } else if (kind === 4) {   // crowd around a cage fight
    g.fillStyle = '#101010'; g.fillRect(x, y, w, h);
    drawGlow(g, cx, cy - 200, 500, '#ffffff', 0.35);
    g.strokeStyle = '#555'; g.lineWidth = 4;
    for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(x + i * 70, y + 200); g.lineTo(x + i * 70, cy + 200); g.stroke(); }
    g.fillStyle = '#c03030'; g.beginPath(); g.arc(cx - 80 + shake, cy - 40, 60, 0, TAU); g.fill(); g.fillRect(cx - 130 + shake, cy + 20, 100, 200);
    g.fillStyle = '#3050c0'; g.beginPath(); g.arc(cx + 100 - shake, cy - 10, 60, 0, TAU); g.fill(); g.fillRect(cx + 50 - shake, cy + 50, 100, 200);
    g.fillStyle = '#050505';
    for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(x + 30 + i * 60, y + h - 120 + (i % 2) * 20, 46, 0, TAU); g.fill(); }
    for (let i = 0; i < 16; i++) { g.save(); g.translate(x + 30 + i * 60, y + h - 170); g.rotate(Math.sin(t * 9 + i) * 0.4); g.fillRect(-8, -110, 16, 110); g.restore(); }
  } else if (kind === 5) {   // raging gamer, flames
    g.fillStyle = '#200606'; g.fillRect(x, y, w, h);
    for (let i = 0; i < 12; i++) drawGlow(g, x + i * 80, y + h - 60 - Math.abs(Math.sin(t * 6 + i)) * 160, 180, '#ff4a10', 0.7);
    g.fillStyle = '#e0a07a'; g.beginPath(); g.arc(cx + shake, cy - 80, 210, 0, TAU); g.fill();
    g.fillStyle = '#111'; rr(g, cx - 260, cy - 130, 520, 60, 30); g.fill();
    g.fillStyle = '#5a0a0a'; g.beginPath(); g.ellipse(cx + shake, cy + 50, 110, 70, 0, 0, Math.PI); g.fill();
    g.strokeStyle = '#111'; g.lineWidth = 22; g.beginPath(); g.moveTo(cx - 140, cy - 180); g.lineTo(cx - 40, cy - 140); g.moveTo(cx + 140, cy - 180); g.lineTo(cx + 40, cy - 140); g.stroke();
  } else if (kind === 6) {   // flashing siren
    const on = Math.sin(t * 22) > 0;
    g.fillStyle = on ? '#c01010' : '#1030c0'; g.fillRect(x, y, w, h);
    drawGlow(g, cx, cy, 520, on ? '#ff5050' : '#5070ff', 0.9);
    g.fillStyle = '#1a1a1a'; rr(g, cx - 220, cy + 60, 440, 120, 20); g.fill();
    g.fillStyle = on ? '#ff8080' : '#80a0ff'; g.beginPath(); g.arc(cx, cy + 60, 180, Math.PI, 0); g.fill();
  } else {                   // someone smashing a screen with a bat
    g.fillStyle = '#3a3a2a'; g.fillRect(x, y, w, h);
    g.fillStyle = '#111'; rr(g, cx - 260, cy, 520, 330, 16); g.fill();
    g.strokeStyle = '#ddd'; g.lineWidth = 4;
    for (let i = 0; i < 9; i++) { const a = i * 0.7; g.beginPath(); g.moveTo(cx, cy + 160); g.lineTo(cx + Math.cos(a) * 240, cy + 160 + Math.sin(a) * 150); g.stroke(); }
    g.save(); g.translate(cx + 220, cy - 200); g.rotate(-0.9 + Math.sin(t * 12) * 0.5);
    g.fillStyle = '#8a5a2a'; rr(g, -20, -320, 40, 340, 18); g.fill(); g.restore();
    drawBurst(g, cx + 60, cy + 120, 90, '#ffffff', '#ffcc00');
  }
  g.restore();
}
function drawBurst(g, x, y, r, c1, c2) {
  g.save(); g.translate(x, y);
  for (const [rr2, c] of [[r, c2], [r * 0.6, c1]]) {
    g.fillStyle = c; g.beginPath();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, rad = i % 2 ? rr2 : rr2 * 0.5; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    g.closePath(); g.fill();
  }
  g.restore();
}
const JUNK_LIGHT = ['#ff4030', '#ff9a30', '#ff60c0', '#ffd060', '#c0c8ff', '#ff5a20', '#6080ff', '#e0e0c0'];

// ---------- UI ----------
function uiIcons(g, x, y, s, c) {
  g.strokeStyle = c; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
  // heart
  g.beginPath(); g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.35, y - s * 0.85, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.35, y - s * 0.85, x + s * 0.9, y - s * 0.25, x, y + s * 0.35); g.stroke();
  // bubble
  g.beginPath(); g.arc(x + 90, y, s * 0.5, 0.9, TAU + 0.5); g.lineTo(x + 90 + s * 0.55, y + s * 0.55); g.closePath(); g.stroke();
  // plane
  const px = x + 180;
  g.beginPath(); g.moveTo(px - s * 0.5, y - s * 0.1); g.lineTo(px + s * 0.55, y - s * 0.5); g.lineTo(px + s * 0.1, y + s * 0.55); g.lineTo(px - 0.05 * s, y + 0.05 * s); g.closePath(); g.stroke();
  // bookmark
  const bx = SW - 60;
  g.beginPath(); g.moveTo(bx - s * 0.35, y - s * 0.5); g.lineTo(bx + s * 0.35, y - s * 0.5); g.lineTo(bx + s * 0.35, y + s * 0.5); g.lineTo(bx, y + s * 0.22); g.lineTo(bx - s * 0.35, y + s * 0.5); g.closePath(); g.stroke();
}
function drawAvatar(g, x, y, r, ring) {
  g.save();
  if (ring) { g.strokeStyle = ring; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 5, 0, TAU); g.stroke(); }
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
  if (AvatarImg) g.drawImage(AvatarImg, x - r, y - r, r * 2, r * 2);
  else { g.fillStyle = '#111'; g.fillRect(x - r, y - r, r * 2, r * 2); drawOpenBook(g, x, y, r, '#fff', 2); }
  g.restore();
}
function statusBar(g, clock) {
  g.fillStyle = '#ffffff'; g.font = '600 38px Inter'; g.textAlign = 'left'; g.fillText(clock, 36, 58);
  g.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) g.fillRect(SW - 190 + i * 14, 52 - i * 8, 9, 8 + i * 8);
  rr(g, SW - 112, 30, 64, 32, 9); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
  g.fillRect(SW - 106, 36, 30, 20);
}
function navBar(g, bg) {
  g.fillStyle = bg; g.fillRect(0, SH - 120, SW, 120);
  g.strokeStyle = '#ffffff'; g.lineWidth = 4;
  const y = SH - 64;
  for (let i = 0; i < 5; i++) {
    const x = 90 + i * 180;
    if (i === 0) { g.beginPath(); g.moveTo(x - 22, y + 18); g.lineTo(x - 22, y - 6); g.lineTo(x, y - 26); g.lineTo(x + 22, y - 6); g.lineTo(x + 22, y + 18); g.closePath(); g.stroke(); }
    else if (i === 1) { g.beginPath(); g.arc(x - 4, y - 4, 18, 0, TAU); g.moveTo(x + 10, y + 10); g.lineTo(x + 24, y + 24); g.stroke(); }
    else if (i === 2) { rr(g, x - 24, y - 24, 48, 48, 12); g.stroke(); g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x, y + 12); g.moveTo(x - 12, y); g.lineTo(x + 12, y); g.stroke(); }
    else if (i === 3) { rr(g, x - 24, y - 24, 48, 48, 12); g.stroke(); g.beginPath(); g.moveTo(x - 6, y - 10); g.lineTo(x + 10, y); g.lineTo(x - 6, y + 10); g.closePath(); g.stroke(); }
    else { g.beginPath(); g.arc(x, y, 22, 0, TAU); g.stroke(); }
  }
}

function feedScroll(t) {
  const fl = TL.feedFlicks, PH = FEEDP.postH;
  const dist = [0.9, 1.1, 1.3, 1.5, 1.6, 1.7, 1.8];
  let s = 0.25 * PH + Math.max(0, t - TL.pov[0]) * 30;
  let total = 0.25 * PH + (fl[0] - TL.pov[0]) * 30;
  for (let i = 0; i < fl.length; i++) {
    const d = dist[i] * PH;
    s += d * expOut(clamp((t - fl[i]) / (0.62 - i * 0.04)));
    total += d;
  }
  const target = FEEDP.K * PH - FEEDP.landY + FEEDP.top;
  const k = clamp((t - TL.postArrive) / (TL.postStop - TL.postArrive));
  s += (target - total) * (1 - Math.pow(1 - k, 3.4));
  return s;
}
function feedVelocity(t) { return (feedScroll(t + 0.01) - feedScroll(t - 0.01)) / 0.02; }

// light colour the screen throws onto the room / his face
function screenLight(t) {
  if (t < TL.pov[0]) {
    const fl = TL.roomFlicks;
    let i = 0; for (let k = 0; k < fl.length; k++) if (t > fl[k]) i = k + 1;
    const c = hex(JUNK_LIGHT[(i * 3) % 8]);
    const flick = i > 0 ? 1 - ss(0, 0.25, t - fl[i - 1]) : 0;
    const strobe = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7);
    return { c, a: (0.9 + 0.4 * flick) * strobe };
  }
  // after the post: warm, steady
  return { c: hex('#ffd59a'), a: 1.0 };
}

function drawFeedScreen(g, t) {
  g.fillStyle = '#000'; g.fillRect(0, 0, SW, SH);
  const s = feedScroll(t);
  const v = Math.abs(feedVelocity(t));
  const PH = FEEDP.postH;
  const stopK = ss(TL.postArrive, TL.postStop + 0.3, t);
  const i0 = Math.floor((s - FEEDP.top) / PH) - 1;
  for (let i = Math.max(0, i0); i < i0 + 4; i++) {
    const top = FEEDP.top + i * PH - s;
    if (top > SH || top + PH < 0) continue;
    if (i === FEEDP.K) drawSozPost(g, top, t);
    else {
      g.save();
      // everything else dims when the post arrives
      g.globalAlpha = 1 - 0.75 * stopK * (i === FEEDP.K ? 0 : 1);
      g.fillStyle = '#333'; g.beginPath(); g.arc(50, top + 50, 30, 0, TAU); g.fill();
      g.fillStyle = '#555'; rr(g, 96, top + 34, 160 + (i * 37) % 120, 18, 9); g.fill();
      g.fillStyle = '#3a3a3a'; rr(g, 96, top + 62, 100, 12, 6); g.fill();
      drawJunk(g, i, 0, top + FEEDP.mediaY, SW, FEEDP.mediaH, t);
      uiIcons(g, 50, top + FEEDP.mediaY + FEEDP.mediaH + 56, 40, '#ddd');
      g.fillStyle = '#555'; rr(g, 30, top + FEEDP.mediaY + FEEDP.mediaH + 110, 420, 16, 8); g.fill();
      rr(g, 30, top + FEEDP.mediaY + FEEDP.mediaH + 140, 640, 16, 8); g.fill();
      g.restore();
    }
  }
  // motion smear while flicking
  if (v > 1500) {
    const k = clamp((v - 1500) / 9000);
    g.save(); g.globalAlpha = 0.5 * k; g.filter = `blur(${(k * 14).toFixed(1)}px)`;
    g.drawImage(g.canvas, 0, 0, SW, SH, 0, -k * 40, SW, SH);
    g.restore();
  }
  // top bar
  g.fillStyle = '#000'; g.fillRect(0, 0, SW, FEEDP.top);
  statusBar(g, '03:47');
  g.strokeStyle = '#fff'; g.lineWidth = 4;
  uiHeartTop(g, SW - 150, 112);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(70, 108, 6, 0, TAU); g.arc(96, 108, 6, 0, TAU); g.arc(122, 108, 6, 0, TAU); g.fill();
  navBar(g, '#000');
}
function uiHeartTop(g, x, y) {
  const s = 40;
  g.beginPath(); g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.35, y - s * 0.85, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.35, y - s * 0.85, x + s * 0.9, y - s * 0.25, x, y + s * 0.35); g.stroke();
  g.beginPath(); g.moveTo(x + 70, y - 20); g.lineTo(x + 110, y - 2); g.lineTo(x + 70, y + 16); g.stroke();
}

function drawSozPost(g, top, t) {
  const glowK = ss(TL.postArrive, TL.postStop + 0.4, t);
  drawAvatar(g, 50, top + 50, 30, '#d9b26a');
  g.fillStyle = '#fff'; g.font = '600 32px Inter'; g.textAlign = 'left'; g.fillText('sozlukdeus', 98, top + 61);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(SW - 70, top + 50, 4, 0, TAU); g.arc(SW - 50, top + 50, 4, 0, TAU); g.arc(SW - 30, top + 50, 4, 0, TAU); g.fill();
  g.drawImage(PostArt.feed, 0, top + FEEDP.mediaY);
  // a slow, warm breath of light across the post once the thumb stops
  if (glowK > 0) {
    const sweep = inv(TL.postStop, TL.postStop + 1.6, t);
    g.save(); g.beginPath(); g.rect(0, top + FEEDP.mediaY, SW, FEEDP.mediaH); g.clip();
    g.globalCompositeOperation = 'screen';
    const gx = lerp(-300, SW + 300, sweep);
    const gr = g.createLinearGradient(gx - 260, top, gx + 260, top + 300);
    gr.addColorStop(0, 'rgba(255,214,150,0)'); gr.addColorStop(0.5, `rgba(255,214,150,${0.22 * glowK})`); gr.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = gr; g.fillRect(0, top, SW, FEEDP.postH);
    g.restore();
  }
  uiIcons(g, 50, top + FEEDP.mediaY + FEEDP.mediaH + 56, 40, '#fff');
  g.fillStyle = '#fff'; g.font = '600 30px Inter'; g.fillText('sozlukdeus', 30, top + FEEDP.mediaY + FEEDP.mediaH + 124);
  g.fillStyle = '#bbb'; g.font = '400 30px Inter'; g.fillText('Abadi · Sözlük', 200, top + FEEDP.mediaY + FEEDP.mediaH + 124);
}

// profile, laid out after the page's own screen (scaled from a 923 px wide capture)
function drawProfileScreen(g, t, followK) {
  const f = SW / 923;
  g.fillStyle = '#0d1117'; g.fillRect(0, 0, SW, SH);
  g.save(); g.scale(f, f);
  statusBar(g, '03:52');
  g.strokeStyle = '#fff'; g.lineWidth = 4.4; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(80, 150); g.lineTo(36, 150); g.moveTo(56, 128); g.lineTo(34, 150); g.lineTo(56, 172); g.stroke();
  g.fillStyle = '#fff'; g.font = '700 40px Inter'; g.textAlign = 'left'; g.fillText('sozlukdeus', 156, 164);
  g.beginPath(); g.arc(845, 134, 5, 0, TAU); g.arc(845, 150, 5, 0, TAU); g.arc(845, 166, 5, 0, TAU); g.fill();
  // avatar with a soft halo
  const halo = 0.5 + 0.5 * Math.sin(t * 2.2);
  drawGlow(g, 145, 322, 150, '#d9b26a', 0.12 + 0.1 * halo);
  drawAvatar(g, 145, 322, 84);
  g.strokeStyle = '#30343c'; g.lineWidth = 2; g.beginPath(); g.arc(145, 322, 86, 0, TAU); g.stroke();
  g.fillStyle = '#fff'; g.font = '600 27px Inter'; g.fillText('SÖZLÜKDEUS', 290, 286);
  const followers = followK > 0.5 ? '22' : '21';
  g.font = '500 34px Inter';
  g.fillText('3', 290, 343); g.fillText(followers, 513, 343); g.fillText('2', 724, 343);
  g.font = '400 28px Inter';
  g.fillText('gönderi', 290, 380); g.fillText('takipçi', 513, 380); g.fillText('takip', 724, 380);
  g.font = 'italic 500 34px Caveat'; g.fillText('"Türk dili, Türk milletinin kalbidir, zihnidir."', 40, 458);
  // buttons
  const press = win(TL.follow - 0.08, TL.follow, TL.follow + 0.05, TL.follow + 0.2, t);
  g.save(); g.translate(218, 542); g.scale(1 - press * 0.04, 1 - press * 0.04);
  rr(g, -190, -38, 381, 76, 14); g.fillStyle = rgb(mixc('#4f5bf0', '#2a2d33', followK)); g.fill();
  g.fillStyle = '#fff'; g.font = '600 30px Inter'; g.textAlign = 'center';
  g.fillText(followK > 0.5 ? 'Takiptesin' : 'Takip Et', 0, 11);
  g.restore();
  rr(g, 424, 504, 380, 76, 14); g.fillStyle = '#2a2d33'; g.fill();
  g.fillStyle = '#fff'; g.font = '600 30px Inter'; g.textAlign = 'center'; g.fillText('Mesaj', 614, 553);
  rr(g, 818, 504, 78, 76, 14); g.fillStyle = '#2a2d33'; g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 3.4;
  g.beginPath(); g.arc(862, 532, 11, 0, TAU); g.stroke();
  g.beginPath(); g.arc(862, 566, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  g.beginPath(); g.moveTo(838, 536); g.lineTo(838, 556); g.moveTo(828, 546); g.lineTo(848, 546); g.stroke();
  // tabs
  g.strokeStyle = '#fff'; g.lineWidth = 4;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { g.fillStyle = '#fff'; rr(g, 133 + c * 16, 615 + r * 16, 13, 13, 2); g.fill(); }
  rr(g, 436, 616, 50, 48, 12); g.stroke(); g.beginPath(); g.moveTo(454, 628); g.lineTo(472, 640); g.lineTo(454, 652); g.closePath(); g.stroke();
  rr(g, 744, 616, 50, 48, 12); g.stroke(); g.beginPath(); g.arc(769, 634, 9, 0, TAU); g.stroke();
  g.fillStyle = '#fff'; g.fillRect(77, 689, 154, 4);
  g.fillStyle = '#20242c'; g.fillRect(0, 693, 923, 2);
  // grid
  PostArt.grid.forEach((c, i) => g.drawImage(c, i * 310 + (i ? 2 : 0), 697, 303, 405));
  g.restore();
  navBar(g, '#0d1117');
}

// what the phone shows at time t (native screen units)
function drawScreen(g, t) {
  const pin = TL.profileIn;
  if (t < pin[0]) { drawFeedScreen(g, t); return; }
  const k = easeInOut(inv(pin[0], pin[1], t));
  if (k < 1) {
    g.save(); g.translate(-k * SW * 0.3, 0); drawFeedScreen(g, pin[0]); g.restore();
    g.fillStyle = `rgba(0,0,0,${0.5 * k})`; g.fillRect(0, 0, SW, SH);
  }
  g.save(); g.translate((1 - k) * SW, 0);
  drawProfileScreen(g, t, ss(TL.follow, TL.follow + 0.12, t));
  g.restore();
}

// ---------- POV shots ----------
// screen-space placement of the phone in a POV shot
function povLayout(t) {
  if (t < TL.pov[1]) {
    const k = ss(TL.pov[0], TL.pov[0] + 0.6, t);
    const lean = ss(TL.postStop, TL.postStop + 1.2, t);
    return { cx: 540, cy: lerp(1040, 990, k), s: lerp(0.9, 0.93, k) + 0.03 * lean, r: lerp(0.05, 0.01, k) };
  }
  const k = inv(TL.pov2[0], TL.pov2[1], t);
  return { cx: 560, cy: lerp(980, 960, k), s: lerp(0.74, 0.8, sstep(k)), r: lerp(-0.04, -0.02, k) };
}
function povScreenToFrame(L, x, y) {
  const [rx, ry] = rot((x - SW / 2) * L.s, (y - SH / 2) * L.s, L.r);
  return [L.cx + rx, L.cy + ry];
}

function drawPhoneDevice(g, t, L) {
  const S = layer('screen', SW, SH);
  drawScreen(S.g, t);
  g.save(); g.translate(L.cx, L.cy); g.rotate(L.r); g.scale(L.s, L.s);
  rr(g, -SW / 2 - 34, -SH / 2 - 34, SW + 68, SH + 68, 96); g.fillStyle = '#0c0d0f'; g.fill();
  g.strokeStyle = '#3a3e44'; g.lineWidth = 5; g.stroke();
  g.save(); rr(g, -SW / 2, -SH / 2, SW, SH, 70); g.clip();
  g.drawImage(S.c, -SW / 2, -SH / 2);
  g.restore();
  g.fillStyle = '#000'; rr(g, -70, -SH / 2 + 18, 140, 40, 20); g.fill();
  g.restore();
}

// his grey thumb, with a dark claw nail; flicks up on each scroll, taps the avatar and the follow button
function thumbPos(t) {
  const L = povLayout(t);
  let x = 720, y = 1500, lift = 0;
  if (t < TL.pov[1]) {
    for (const f of TL.feedFlicks) {
      const k = (t - f + 0.18) / 0.42;
      if (k > 0 && k < 1) { y -= Math.sin(k * Math.PI) * 300 * (k < 0.5 ? 1 : 1); lift = Math.sin(k * Math.PI); }
    }
    const toTap = ss(TL.tap - 0.4, TL.tap - 0.08, t) * (1 - ss(TL.tap + 0.12, TL.tap + 0.45, t));
    const av = povScreenToFrame(L, 50, FEEDP.landY + 50);
    x = lerp(x, av[0] + 40, toTap); y = lerp(y, av[1] + 60, toTap);
    lift = Math.max(lift, toTap * (1 - win(TL.tap - 0.06, TL.tap, TL.tap + 0.04, TL.tap + 0.12, t)) * 0.4);
    // rests lower while he stares
    const rest = ss(TL.postStop, TL.postStop + 0.4, t) * (1 - toTap);
    y += rest * 120;
  } else {
    const fb = povScreenToFrame(L, 218 * SW / 923, 542 * SW / 923);
    const k = ss(TL.follow - 0.7, TL.follow - 0.1, t) * (1 - ss(TL.follow + 0.25, TL.follow + 0.8, t));
    x = lerp(800, fb[0] + 50, k); y = lerp(1560, fb[1] + 70, k);
  }
  return { x, y, lift };
}
function drawThumb(g, t, savage) {
  const p = thumbPos(t);
  const C = { d: mixc('#4b5149', '#5f5850', 1 - savage), m: mixc('#8a9086', '#a0998f', 1 - savage), h: mixc('#c0c4b9', '#d8d1c6', 1 - savage) };
  g.save();
  g.filter = savage < 0.5 ? 'brightness(0.72) sepia(0.25)' : 'none';
  g.translate(p.x, p.y);
  g.rotate(-0.55);
  g.scale(1 + p.lift * 0.06, 1 + p.lift * 0.06);
  const th = limbPath([0, 0], [40, 560], 104, 140, 1.05);
  const gr = g.createLinearGradient(-60, 0, 80, 0);
  gr.addColorStop(0, rgb(C.d)); gr.addColorStop(0.6, rgb(C.m)); gr.addColorStop(1, rgb(C.h));
  g.fillStyle = gr; g.fill(th); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(th);
  // knuckle creases
  strokeLine(g, [[-30, 150], [0, 160], [34, 152]], 3, INK, 0.6);
  strokeLine(g, [[-26, 175], [4, 184], [30, 176]], 2.4, INK, 0.4);
  // claw nail
  g.fillStyle = rgb(mixc('#1e1b17', '#7a7064', 1 - savage));
  g.beginPath(); g.moveTo(-30, 20); g.quadraticCurveTo(0, -60 * (0.4 + 0.6 * savage), 30, 20); g.quadraticCurveTo(0, 40, -30, 20); g.fill();
  g.strokeStyle = '#000'; g.lineWidth = 2; g.stroke();
  g.restore();
}
