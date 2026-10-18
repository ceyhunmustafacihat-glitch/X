'use strict';
// End card: gold line-art book, quill and crescent-star drawn on black,
// then the name, the page's motto and its handle.

function strokeReveal(g, path, len, k) {
  if (k <= 0) return;
  g.setLineDash([len * k, len * 2]);
  g.lineDashOffset = 0;
  g.stroke(path);
  g.setLineDash([]);
}

function renderLogo(g, t) {
  const t0 = TL.logo[0];
  const a = ss(t0, t0 + 0.4, t);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H);
  const cx = W / 2, cy = 820;
  const breathe = 1 + 0.012 * Math.sin((t - t0) * 1.4);
  g.translate(cx, cy); g.scale(breathe, breathe); g.translate(-cx, -cy);

  // faint gold dust settling in
  g.save(); g.globalCompositeOperation = 'lighter';
  const R = mulberry32(64);
  for (let i = 0; i < 90; i++) {
    const ang = R() * TAU, r0 = 600 + R() * 500, s = R();
    const k = easeInOut(clamp((t - t0 - s * 0.6) / 1.6));
    const r = lerp(r0, 40 + R() * 260, k);
    const x = cx + Math.cos(ang + k * 1.2) * r, y = cy + Math.sin(ang + k * 1.2) * r * 0.8;
    drawGlow(g, x, y, 3 + s * 5, '#ffd27a', (1 - k * 0.7) * 0.7 * ss(t0, t0 + 0.6, t));
  }
  g.restore();

  // line art
  g.lineCap = 'round'; g.lineJoin = 'round';
  const gold = g.createLinearGradient(cx - 220, cy - 260, cx + 220, cy + 120);
  gold.addColorStop(0, '#f6dea0'); gold.addColorStop(0.5, '#d9b26a'); gold.addColorStop(1, '#a8792f');
  g.strokeStyle = gold;
  g.shadowColor = 'rgba(240,190,100,0.55)'; g.shadowBlur = 18;
  // open book
  const book = new Path2D();
  const by = cy + 80;
  for (const s of [-1, 1]) {
    book.moveTo(cx, by + 40);
    book.bezierCurveTo(cx + s * 50, by + 4, cx + s * 150, by - 4, cx + s * 230, by + 26);
    book.lineTo(cx + s * 230, by - 84);
    book.bezierCurveTo(cx + s * 160, by - 124, cx + s * 60, by - 120, cx, by - 78);
  }
  book.moveTo(cx, by - 78); book.lineTo(cx, by + 40);
  // inner page lines
  const pages = new Path2D();
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
    const o = 16 + i * 14;
    pages.moveTo(cx + s * 6, by + 40 + o * 0.0 + 14 + i * 12);
    pages.bezierCurveTo(cx + s * 60, by + 22 + o, cx + s * 150, by + 18 + o, cx + s * (230 - i * 2), by + 40 + o);
  }
  const kb = easeInOut(inv(t0 + 0.15, t0 + 1.0, t));
  g.lineWidth = 4.5; strokeReveal(g, book, 1500, kb);
  g.lineWidth = 2.5; strokeReveal(g, pages, 1400, easeInOut(inv(t0 + 0.45, t0 + 1.15, t)));

  // quill rising from the book's centre
  const q = new Path2D();
  q.moveTo(cx + 6, by - 40);
  q.bezierCurveTo(cx + 40, by - 150, cx + 90, by - 250, cx + 150, by - 330);   // shaft
  const qv = new Path2D();
  qv.moveTo(cx + 150, by - 330);
  qv.bezierCurveTo(cx + 60, by - 300, cx + 20, by - 200, cx + 30, by - 110);
  qv.bezierCurveTo(cx + 70, by - 160, cx + 140, by - 230, cx + 150, by - 330);
  qv.moveTo(cx + 150, by - 330);
  qv.bezierCurveTo(cx + 175, by - 260, cx + 140, by - 170, cx + 62, by - 112);
  const kq = easeInOut(inv(t0 + 0.5, t0 + 1.3, t));
  g.lineWidth = 3.2; strokeReveal(g, q, 400, kq);
  g.lineWidth = 2.6; strokeReveal(g, qv, 900, easeInOut(inv(t0 + 0.65, t0 + 1.45, t)));

  // crescent + star (top left of the quill)
  const kc = easeInOut(inv(t0 + 0.8, t0 + 1.55, t));
  const mx = cx - 92, my = by - 250;
  const moon = new Path2D();
  moon.arc(mx, my, 46, 0.55, TAU - 0.55, false);
  moon.arc(mx + 18, my, 38, TAU - 0.8, 0.8, true);
  moon.closePath();
  g.lineWidth = 3.2; strokeReveal(g, moon, 520, kc);
  if (kc > 0.6) {
    const ka = ss(0.6, 1, kc);
    g.save(); g.globalAlpha = ka;
    g.fillStyle = gold;
    const sx = mx + 34, sy = my;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = Math.PI + i * Math.PI / 5, rr2 = i % 2 ? 7 : 17;
      g.lineTo(sx + Math.cos(an) * rr2, sy + Math.sin(an) * rr2);
    }
    g.closePath(); g.fill();
    g.restore();
  }
  g.shadowBlur = 0;

  // name
  const kn = ss(TL.logoText, TL.logoText + 0.8, t);
  if (kn > 0) {
    g.save();
    g.globalAlpha = kn;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '600 112px "Cormorant Garamond"';
    const tg = g.createLinearGradient(0, cy + 200, 0, cy + 310);
    tg.addColorStop(0, '#f8e3a8'); tg.addColorStop(1, '#c08d3e');
    g.fillStyle = tg;
    g.shadowColor = 'rgba(240,190,100,0.45)'; g.shadowBlur = 24;
    spacedText(g, 'sözlükdeus', cx + lerp(14, 7, kn), cy + 300, lerp(28, 14, kn));
    g.shadowBlur = 0;
    // fine rule
    g.strokeStyle = rgb(GOLD, 0.6 * kn); g.lineWidth = 1.4;
    const rw = 170 * easeOut(kn);
    g.beginPath(); g.moveTo(cx - rw, cy + 352); g.lineTo(cx - 14, cy + 352); g.moveTo(cx + 14, cy + 352); g.lineTo(cx + rw, cy + 352); g.stroke();
    g.save(); g.translate(cx, cy + 352); g.rotate(Math.PI / 4); g.fillStyle = rgb(GOLD, kn); g.fillRect(-5, -5, 10, 10); g.restore();
    g.restore();
  }
  // slogan
  const ks = ss(TL.slogan, TL.slogan + 0.7, t);
  if (ks > 0) {
    g.save();
    g.globalAlpha = ks;
    g.textAlign = 'center';
    g.fillStyle = '#efe4cc';
    g.font = 'italic 500 58px "Cormorant Garamond"';
    const y = cy + 450 + (1 - ks) * 16;
    g.fillText('“Türk dili, Türk milletinin', cx, y);
    g.fillText('kalbidir, zihnidir.”', cx, y + 74);
    g.restore();
  }
  // the page's handle
  const kh = ss(TL.slogan + 0.5, TL.slogan + 1.0, t);
  if (kh > 0) {
    g.save();
    g.globalAlpha = kh * 0.8;
    g.textAlign = 'center'; g.fillStyle = GOLD;
    g.font = '500 30px Montserrat';
    spacedText(g, '@sozlukdeus', cx + 3, cy + 640, 6);
    g.restore();
  }
  // a slow light sweep across the emblem
  const sw = inv(t0 + 2.4, t0 + 3.5, t);
  if (sw > 0 && sw < 1) {
    g.save(); g.globalCompositeOperation = 'lighter';
    drawGlow(g, lerp(cx - 300, cx + 300, sw), by - 120, 180, '#ffe6b0', 0.35 * Math.sin(sw * Math.PI));
    g.restore();
  }
  g.restore();
}
