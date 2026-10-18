'use strict';
// Overhead insert: the notebook, the pen, the first word written by hand.

const NB = { cx: 540, cy: 1000, pw: 440, ph: 640, rot: -0.05 };

function drawWoodDesk(g) {
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#a97b51'); gr.addColorStop(0.5, '#8e623d'); gr.addColorStop(1, '#6f4a2c');
  g.fillStyle = gr; g.fillRect(-200, -200, W + 400, H + 400);
  const R = mulberry32(17);
  for (let i = 0; i < 70; i++) {
    const y = -200 + R() * (H + 400), a = 0.05 + R() * 0.08, amp = 6 + R() * 18, ph = R() * 10;
    g.strokeStyle = R() < 0.5 ? `rgba(60,34,16,${a})` : `rgba(255,220,170,${a * 0.6})`;
    g.lineWidth = 1 + R() * 3;
    g.beginPath();
    for (let x = -200; x <= W + 200; x += 40) g.lineTo(x, y + Math.sin(x / 160 + ph) * amp + Math.sin(x / 47 + ph * 2) * amp * 0.2);
    g.stroke();
  }
}

function pagePath(side) {
  // side -1 left page, +1 right page; local coords with spine at x=0
  const { pw, ph } = NB;
  const p = new Path2D();
  const x1 = side * pw;
  p.moveTo(0, -ph / 2 + 6);
  p.quadraticCurveTo(x1 * 0.5, -ph / 2 - 6, x1, -ph / 2);
  p.lineTo(x1, ph / 2);
  p.quadraticCurveTo(x1 * 0.5, ph / 2 - 10, 0, ph / 2 + 4);
  p.closePath();
  return p;
}

function drawPageLines(g, side, alpha = 1) {
  const { pw, ph } = NB;
  g.strokeStyle = `rgba(110,140,180,${0.28 * alpha})`; g.lineWidth = 1.4;
  for (let y = -ph / 2 + 90; y < ph / 2 - 30; y += 44) {
    g.beginPath(); g.moveTo(side > 0 ? 24 : -pw + 16, y); g.lineTo(side > 0 ? pw - 16 : -24, y); g.stroke();
  }
  if (side > 0) { g.strokeStyle = `rgba(200,90,80,${0.35 * alpha})`; g.beginPath(); g.moveTo(70, -ph / 2 + 10); g.lineTo(70, ph / 2 - 10); g.stroke(); }
}

function inkText(g, txt, x, y, size, reveal, color = '#1e2b47', font = 'Caveat') {
  // handwriting revealed left -> right
  g.save();
  g.font = `600 ${size}px "${font}"`;
  g.textBaseline = 'alphabetic';
  const wdt = g.measureText(txt).width;
  g.beginPath(); g.rect(x - 10, y - size * 1.2, (wdt + 20) * reveal, size * 1.8); g.clip();
  g.fillStyle = color; g.fillText(txt, x, y);
  g.restore();
  return x + wdt * reveal;
}

function drawSpread(g, t, page2) {
  const { pw, ph } = NB;
  for (const side of [-1, 1]) {
    const p = pagePath(side);
    g.fillStyle = '#f8f1e1'; g.fill(p);
    g.save(); g.clip(p);
    // gutter shading near the spine
    const sg = g.createLinearGradient(0, 0, side * 120, 0);
    sg.addColorStop(0, 'rgba(120,90,50,0.35)'); sg.addColorStop(1, 'rgba(120,90,50,0)');
    g.fillStyle = sg; g.fillRect(side > 0 ? 0 : -120, -ph, 120, ph * 2);
    drawPageLines(g, side);
    g.restore();
  }
  if (!page2) {
    // left page: old notes, abandoned half-way
    g.save(); g.globalAlpha = 0.7;
    inkText(g, 'yapılacaklar:', -pw + 40, -ph / 2 + 128, 44, 1, '#3d4a63');
    inkText(g, '– kitap bitir', -pw + 56, -ph / 2 + 172, 40, 1, '#3d4a63');
    inkText(g, '– düzenli uyu', -pw + 56, -ph / 2 + 216, 40, 1, '#3d4a63');
    g.strokeStyle = 'rgba(61,74,99,0.6)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-pw + 50, -ph / 2 + 160); g.lineTo(-pw + 250, -ph / 2 + 158); g.stroke();
    g.restore();
    // right page: the new word
    const wr = clamp((t - TL.writeStart) / (TL.writeEnd - TL.writeStart));
    let penX = inkText(g, 'inşirah', 92, -ph / 2 + 210, 118, easeInOut(wr));
    let penY = -ph / 2 + 190;
    const mr = clamp((t - TL.writeEnd - 0.02) / 0.5);
    if (mr > 0) { penX = inkText(g, 'iç açılması,', 96, -ph / 2 + 300, 44, mr, '#33415f'); penY = -ph / 2 + 290; }
    const mr2 = clamp((t - TL.writeEnd - 0.5) / 0.4);
    if (mr2 > 0) { penX = inkText(g, 'ferahlık ✦', 96, -ph / 2 + 348, 44, mr2, '#33415f'); penY = -ph / 2 + 334; }
    // underline flourish
    const ul = clamp((t - TL.writeEnd + 0.15) / 0.3);
    if (ul > 0 && mr <= 0) {
      g.strokeStyle = '#1e2b47'; g.lineWidth = 3.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(96, -ph / 2 + 228);
      g.quadraticCurveTo(96 + 160 * ul, -ph / 2 + 240, 96 + 330 * ul, -ph / 2 + 222); g.stroke();
    }
    return [penX, penY, wr];
  }
  // the spread after time has passed: pages full of new words
  g.save(); g.globalAlpha = 0.95;
  const L = [['merak', 'öğrenme isteği'], ['tefekkür', 'derin düşünme'], ['irfan', 'bilgi, anlayış'], ['sebat', 'kararlılık'], ['ufuk', 'görüş alanı'], ['hezarfen', 'pek çok hünerli']];
  L.forEach(([wd, mn], i) => {
    const side = i < 3 ? -1 : 1, row = i % 3;
    const x0 = side < 0 ? -pw + 50 : 90, y0 = -ph / 2 + 130 + row * 170;
    inkText(g, wd, x0, y0, 64, 1, '#1e2b47');
    inkText(g, mn, x0 + 12, y0 + 52, 38, 1, '#4a5874');
  });
  g.restore();
  return [0, 0, 1];
}

function renderInsert(g, t) {
  g.save();
  const enter = 1 - easeOut(inv(22.5, 23.0, t));
  const sc = 1 + enter * 0.3 + inv(22.5, 25.3, t) * 0.07;
  g.translate(W / 2, H / 2); g.scale(sc, sc); g.rotate(-0.02 + inv(22.5, 25.3, t) * 0.02); g.translate(-W / 2, -H / 2);
  drawWoodDesk(g);

  // props around the notebook
  // phone face-down (top-left)
  g.save(); g.translate(170, 260); g.rotate(-0.35);
  g.shadowColor = 'rgba(40,20,5,0.45)'; g.shadowBlur = 30; g.shadowOffsetX = -14; g.shadowOffsetY = 18;
  g.fillStyle = '#16171b'; rr(g, -90, -180, 180, 360, 30); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = '#26272c'; rr(g, -70, -160, 60, 90, 18); g.fill();
  g.restore();
  // tea glass (top-right)
  g.save(); g.translate(900, 300);
  g.shadowColor = 'rgba(40,20,5,0.4)'; g.shadowBlur = 30; g.shadowOffsetX = -16; g.shadowOffsetY = 20;
  g.fillStyle = '#efe6d6'; g.beginPath(); g.arc(0, 0, 120, 0, TAU); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = '#b5481f'; g.beginPath(); g.arc(0, 0, 62, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,190,120,0.5)'; g.beginPath(); g.arc(-14, -16, 22, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(200,170,120,0.8)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 70, 0, TAU); g.stroke();
  g.restore();
  // a book stack at the bottom left
  g.save(); g.translate(150, 1700); g.rotate(0.12);
  g.shadowColor = 'rgba(40,20,5,0.4)'; g.shadowBlur = 30; g.shadowOffsetX = -12; g.shadowOffsetY = 16;
  g.fillStyle = '#7b2d26'; rr(g, -150, -210, 300, 420, 10); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = '#c79a3e'; g.fillRect(-150, -210, 300, 26);
  g.fillStyle = '#e8c27a'; g.font = '600 34px "Cormorant Garamond"'; g.textAlign = 'center'; g.fillText('Türkçe Sözlük', 0, -60);
  g.restore();

  // notebook
  const turn = clamp((t - TL.pageTurn) / 0.42);
  g.save();
  g.translate(NB.cx, NB.cy); g.rotate(NB.rot);
  // cover + shadow
  g.shadowColor = 'rgba(40,20,5,0.5)'; g.shadowBlur = 40; g.shadowOffsetX = -18; g.shadowOffsetY = 24;
  g.fillStyle = '#3d5a73'; rr(g, -NB.pw - 14, -NB.ph / 2 - 14, NB.pw * 2 + 28, NB.ph + 28, 12); g.fill();
  g.shadowColor = 'transparent';
  // page stack edges
  g.fillStyle = '#e6dcc6'; rr(g, -NB.pw - 4, -NB.ph / 2 - 2, NB.pw * 2 + 8, NB.ph + 8, 4); g.fill();
  const page2 = turn >= 1;
  let pen = drawSpread(g, t, page2 && t > TL.pageTurn);
  if (turn > 0 && turn < 1) {
    // the new spread is underneath; the right page turns over the spine
    const under = layer('nbUnder', NB.pw * 2 + 40, NB.ph + 60);
    under.g.translate(NB.pw + 20, NB.ph / 2 + 30);
    drawSpread(under.g, t, true);
    g.save(); g.beginPath(); g.rect(0, -NB.ph / 2 - 20, NB.pw + 10, NB.ph + 40); g.clip();
    g.drawImage(under.c, -NB.pw - 20, -NB.ph / 2 - 30);
    g.restore();
    const a = easeInOut(turn) * Math.PI;
    const cx = Math.cos(a);
    g.save();
    g.scale(cx === 0 ? 0.001 : cx, 1);
    const p = pagePath(1);
    g.fillStyle = cx > 0 ? '#f8f1e1' : '#efe5cf'; g.fill(p);
    g.save(); g.clip(p);
    const sh = g.createLinearGradient(0, 0, NB.pw, 0);
    sh.addColorStop(0, `rgba(90,60,30,${0.15 + 0.35 * Math.sin(a)})`); sh.addColorStop(1, 'rgba(90,60,30,0)');
    g.fillStyle = sh; g.fillRect(0, -NB.ph, NB.pw, NB.ph * 2);
    if (cx > 0) drawPageLines(g, 1);
    g.restore();
    g.restore();
    // the turning page's shadow onto the right side
    g.fillStyle = `rgba(60,40,20,${0.18 * Math.sin(a)})`;
    g.fillRect(0, -NB.ph / 2, NB.pw * Math.max(0, cx) + 40 * Math.sin(a), NB.ph);
  }
  // spine
  g.strokeStyle = 'rgba(110,80,40,0.45)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -NB.ph / 2); g.lineTo(0, NB.ph / 2); g.stroke();

  // gold sparkle from the fresh ink
  if (!page2) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const R = mulberry32(12);
    for (let i = 0; i < 26; i++) {
      const bx = 92 + R() * 330, born = TL.writeStart + (bx - 92) / 330 * (TL.writeEnd - TL.writeStart);
      const life = (t - born) / 1.2;
      if (life < 0 || life > 1) continue;
      drawGlow(g, bx + Math.sin(t * 3 + i) * 6, -NB.ph / 2 + 180 - life * 120 - R() * 30, 6 + R() * 6, '#ffd27a', Math.sin(life * Math.PI) * 0.8);
    }
    g.restore();
  }

  // hand + pen (writing on the right page)
  if (!page2 && turn <= 0) {
    const [px, py, wr] = pen;
    const tipX = (wr > 0 ? px : 96) + Math.sin(t * 24) * 2, tipY = py + 4 + Math.sin(t * 19) * 3;
    drawWritingHand(g, tipX, tipY, t);
  } else if (turn > 0 && turn < 1) {
    // hand flips the page: rests near the page corner
    drawWritingHand(g, NB.pw * Math.cos(easeInOut(turn) * Math.PI) * 0.9, NB.ph / 2 - 60, t, true);
  }
  g.restore();

  // window light across the desk, with soft leaf shadows
  g.save(); g.globalCompositeOperation = 'soft-light';
  const lg = g.createLinearGradient(W, 0, 0, H);
  lg.addColorStop(0, 'rgba(255,230,180,0.9)'); lg.addColorStop(0.45, 'rgba(255,220,160,0.5)'); lg.addColorStop(1, 'rgba(40,20,10,0.6)');
  g.fillStyle = lg; g.fillRect(-200, -200, W + 400, H + 400);
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply';
  g.filter = 'blur(22px)';
  g.fillStyle = 'rgba(120,80,50,0.22)';
  const sway = Math.sin(t * 1.2) * 12;
  for (const [x, y, rx, ry, r] of [[880, 620, 120, 40, -0.6], [960, 760, 140, 44, -0.2], [820, 840, 110, 36, 0.5]]) {
    g.beginPath(); g.ellipse(x + sway, y, rx, ry, r, 0, TAU); g.fill();
  }
  g.filter = 'none';
  g.restore();
  g.save(); g.globalCompositeOperation = 'screen';
  drawGlow(g, 1000, 120, 900, '#ffd9a0', 0.45);
  g.restore();
  g.restore();
}

function drawWritingHand(g, x, y, t, flat) {
  g.save();
  g.translate(x, y);
  g.rotate(flat ? 0.9 : 0.32);
  if (!flat) {
    // pen: nib at the origin, body running back past the knuckles
    g.fillStyle = 'rgba(40,20,5,0.22)'; rr(g, 4, 12, 300, 18, 9); g.fill();
    g.fillStyle = '#1b1e26'; rr(g, 0, -9, 310, 18, 9); g.fill();
    g.fillStyle = '#c9a25a'; g.fillRect(250, -9, 14, 18); g.fillRect(262, -11, 40, 4);
    g.beginPath(); g.moveTo(1, -6); g.lineTo(-22, 0); g.lineTo(1, 6); g.closePath(); g.fill();
  }
  const hand = new Path2D();
  hand.roundRect(18, -40, 148, 36, 18);               // index finger resting on the pen
  hand.roundRect(22, 8, 118, 34, 17);                 // thumb from the other side
  hand.ellipse(196, 96, 96, 80, 0.25, 0, TAU);        // back of the hand
  hand.roundRect(84, 26, 100, 44, 22);                // curled middle finger
  hand.addPath((() => { const p = new Path2D(); p.roundRect(0, -62, 280, 124, 56); return p; })(),
    new DOMMatrix().translate(232, 120).rotate(34));  // wrist towards the bottom right
  g.shadowColor = 'rgba(50,25,10,0.4)'; g.shadowBlur = 28; g.shadowOffsetX = -16; g.shadowOffsetY = 20;
  g.fillStyle = '#d29a74'; g.fill(hand);
  g.shadowColor = 'transparent';
  g.save(); g.clip(hand);
  const gr = g.createLinearGradient(0, -60, 120, 220);
  gr.addColorStop(0, 'rgba(255,226,190,0.5)'); gr.addColorStop(0.45, 'rgba(255,220,180,0)'); gr.addColorStop(1, 'rgba(120,64,38,0.45)');
  g.fillStyle = gr; g.fillRect(-20, -100, 600, 520);
  g.strokeStyle = 'rgba(130,70,45,0.45)'; g.lineWidth = 3; g.lineCap = 'round';
  for (const [x0, y0, x1, y1] of [[96, -36, 98, -10], [128, -36, 130, -10], [100, 12, 102, 38], [150, 30, 158, 62], [178, 40, 190, 70]]) {
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  g.fillStyle = 'rgba(255,236,220,0.7)'; g.beginPath(); g.ellipse(36, -22, 14, 11, 0, 0, TAU); g.fill();
  g.restore();
  // sleeve
  const sl = new Path2D(); sl.roundRect(0, -92, 260, 184, 30);
  g.save(); g.translate(232, 120); g.rotate(34 * Math.PI / 180); g.translate(200, 0);
  g.fillStyle = '#56687d'; g.fill(sl); g.fillStyle = '#44546a'; g.fillRect(0, -92, 26, 184);
  g.restore();
  g.restore();
}
