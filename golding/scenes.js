// The film, scene by scene. Each scene draws a full frame from its local time t.

function sunsetSea(ctx, t, o = {}) {
  fillBg(ctx, vgrad(ctx, 0, 1130, ['#1F3B4D', '#2D6A79', '#D98E5F', '#F5C58C']));
  const sy = 1060 - eOut(clamp(t / 6)) * 70;
  circle(ctx, W / 2, sy, 230, 'rgba(252,227,168,0.18)'); circle(ctx, W / 2, sy, 175, 'rgba(252,227,168,0.25)'); circle(ctx, W / 2, sy, 130, '#FCE3A8');
  for (let i = 0; i < 2; i++) { const x = ((t * 18 + i * 620) % 1400) - 200; at(ctx, x, 900 + i * 60, 0.6, 0.22, () => cloudPuff(ctx, 60, '#FBE7D0')); }
  waveBand(ctx, 1100, 8, 260, t * 0.9, '#2E7F94');
  // island
  ell(ctx, 790, 1110, 250, 46, '#D9B477'); ell(ctx, 790, 1100, 220, 34, C.sand);
  at(ctx, 730, 1100, 0.95, 1, () => palm(ctx, 300, 70, t)); at(ctx, 850, 1105, 0.75, 1, () => palm(ctx, 260, -60, t + 1));
  waveBand(ctx, 1190, 10, 320, t * 1.1 + 1, '#1F6F8B');
  // sun glitter on water
  for (let i = 0; i < 9; i++) { const y = 1150 + i * 30, w = 160 - i * 12 + Math.sin(t * 3 + i) * 20; ctx.globalAlpha = 0.35; line(ctx, W / 2 - w / 2, y, W / 2 + w / 2, y, '#FCE3A8', 6); ctx.globalAlpha = 1; }
  waveBand(ctx, 1330, 12, 380, t * 1.3 + 2, '#14485C');
  waveBand(ctx, 1500, 14, 420, t * 1.6, '#F6EEDC');
  waveBand(ctx, 1525, 10, 520, t * 0.4, C.sand);
  ell(ctx, 830, 1760, 300, 60, '#DDB97E');
  at(ctx, 300, 1690, 1.0, 1, () => conch(ctx), -0.15);
  at(ctx, 770, 1700, 0.95, 1, () => specs(ctx, C.ink), 0.12);
  const fx = 300 + Math.cos(t * 1.7) * 150, fy = 1560 + Math.sin(t * 2.3) * 60;
  at(ctx, fx, fy, 0.75, 1, () => fly(ctx, t));
}

const S = [];
const scene = (dur, draw) => S.push({ dur, draw });

// 0 — title
scene(7, (ctx, t) => {
  sunsetSea(ctx, t);
  const k = ap(t, 0.8, 1.2), k2 = ap(t, 1.6, 1), k3 = ap(t, 2.4, 1);
  ctx.textAlign = 'center';
  ctx.globalAlpha = k; ctx.font = 'italic 500 150px "Cormorant Garamond"'; ctx.fillStyle = '#FFF6E6'; ctx.fillText('William Golding', W / 2, 470 + (1 - k) * 30);
  ctx.globalAlpha = k2; ctx.font = '600 46px Montserrat'; ctx.letterSpacing = '12px'; ctx.fillText('1911 – 1993', W / 2 + 6, 560); ctx.letterSpacing = '0px';
  line(ctx, W / 2 - 60 * k3, 610, W / 2 + 60 * k3, 610, C.orange, 6);
  ctx.globalAlpha = k3; ctx.font = '500 40px Montserrat'; ctx.fillStyle = '#FBE3C4'; ctx.fillText('“Sineklerin Tanrısı”nın yazarı', W / 2, 680);
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  ctx.fillStyle = `rgba(0,0,0,${1 - ap(t, 0, 1.2)})`; ctx.fillRect(0, 0, W, H);
});

// 1 — birth: map of Great Britain
scene(12, (ctx, t) => {
  fillBg(ctx, '#BFE3E6');
  ctx.globalAlpha = 0.35; for (let i = 0; i < 14; i++) for (let j = 0; j < 6; j++) {
    const x = j * 200 + (i % 2) * 100 + Math.sin(t + i) * 8, y = 320 + i * 70;
    ctx.beginPath(); ctx.arc(x, y, 18, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.stroke();
  } ctx.globalAlpha = 1;
  const z = eIO(P(t, 0.4, 2.4));
  const cam = { lon: -3.2, lat: lerp(54.6, 51.25, z), scale: lerp(92, 230, z) }, cy = 760;
  drawGB(ctx, cam, cy);
  const nq = proj(cam, ...PLACES.newquay, cy), mb = proj(cam, ...PLACES.marlborough, cy);
  // journey Newquay -> Marlborough
  const jk = eIO(P(t, 6.3, 7.8));
  if (jk > 0) {
    const cx = (nq[0] + mb[0]) / 2, cyy = Math.min(nq[1], mb[1]) - 170;
    ctx.save(); ctx.setLineDash([18, 16]); ctx.lineDashOffset = -t * 30; ctx.beginPath();
    for (let i = 0; i <= 40 * jk; i++) { const u = i / 40, x = (1 - u) * (1 - u) * nq[0] + 2 * u * (1 - u) * cx + u * u * mb[0], y = (1 - u) * (1 - u) * (nq[1] - 78) + 2 * u * (1 - u) * cyy + u * u * (mb[1] - 78); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
  }
  const p1 = apB(t, 2.2, 0.7);
  at(ctx, nq[0], nq[1] - (1 - p1) * 160, 1, ap(t, 2.2, 0.3), () => pin(ctx, C.coral));
  at(ctx, nq[0] + 56, nq[1] - 78, 1, ap(t, 2.8, 0.5) * (1 - 0.6 * ap(t, 6.3, 0.6)), () => tag(ctx, 'Newquay · Cornwall'));
  const p2 = apB(t, 7.7, 0.7);
  at(ctx, mb[0], mb[1] - (1 - p2) * 160, 1, ap(t, 7.7, 0.3), () => pin(ctx, C.teal));
  ctx.font = '700 36px Montserrat'; const tw = ctx.measureText('Marlborough · Wiltshire').width + 44;
  at(ctx, mb[0] - 56 - tw, mb[1] - 78, 1, ap(t, 8.2, 0.5), () => tag(ctx, 'Marlborough · Wiltshire'));
  chip(ctx, '19 Eylül 1911', W / 2, 410, win(t, 2.6, 6.4));
  header(ctx, 'DOĞUM VE AİLE', ap(t, 0.2, 0.8));
  caption(ctx, t, 2.6, 6.4, '**19 Eylül 1911**’de İngiltere’nin güneybatısındaki **Cornwall** bölgesinde, **Newquay** kasabasında doğdu.');
  caption(ctx, t, 8.2, 12, 'Çocukluğunun büyük bölümünü ailesiyle birlikte **Wiltshire**’daki **Marlborough**’da geçirdi.');
});

// 2 — family carousel
scene(15, (ctx, t) => {
  fillBg(ctx, '#F3E7D3');
  circle(ctx, 120, 470, 260, '#EEDDC2'); circle(ctx, 980, 1050, 300, '#EEDDC2'); circle(ctx, 900, 380, 90, '#F0D6B8');
  const f = eIO(P(t, 4.8, 5.6)) + eIO(P(t, 9.8, 10.6));
  const people = [
    { bg: '#BFE0DC', o: { hairStyle: 'side', hair: '#3B2A20', shirt: '#6B5B4B', collar: 'tie', tie: C.teal, glasses: C.ink, moustache: '#3B2A20' } },
    { bg: '#E5D0EA', o: { hairStyle: 'bun', hair: '#6B3A22', shirt: '#4E6E5D', collar: 'round', sash: true } },
    { bg: '#F7D9B4', o: { hairStyle: 'kid', hair: '#4A3020', shirt: C.coral, collar: 'round' } },
  ];
  // draw the far ones first
  const order = [0, 1, 2].sort((a, b) => Math.abs(b - f) - Math.abs(a - f));
  for (const i of order) {
    const d = i - f, ad = Math.min(1, Math.abs(d));
    const x = W / 2 + d * 520, s = (1 - 0.42 * ad) * apB(t, 0.2 + i * 0.15, 0.7);
    at(ctx, x, 720, s, 1 - 0.4 * ad, () => portrait(ctx, 230, people[i].bg, people[i].o));
  }
  const near = i => clamp(1 - Math.abs(i - f) * 2.5) * ap(t, 0.8, 0.6);
  // father: science
  let k = near(0);
  at(ctx, 300, 520, 0.9 * k, k, () => flask(ctx, C.teal), -0.2);
  at(ctx, 790, 470, 0.9 * k, k, () => atom(ctx, t, C.coral));
  // mother: votes for women + stories
  k = near(1);
  at(ctx, 790, 500, k, k, () => {
    rr(ctx, -80, -40, 160, 110, 12); ctx.fillStyle = C.plum; ctx.fill(); rr(ctx, -50, -46, 100, 12, 6); ctx.fillStyle = C.ink; ctx.fill();
    const y = -100 + Math.sin(t * 2) * 10; rr(ctx, -34, y, 68, 80, 6); ctx.fillStyle = C.white; ctx.fill();
    line(ctx, -14, y + 40, -2, y + 54, C.green, 8); line(ctx, -2, y + 54, 20, y + 22, C.green, 8);
  });
  at(ctx, 290, 520, 0.85 * k, k, () => bookOpen(ctx, 170, 120, C.teal), -0.15);
  // brother: five years older
  k = near(2);
  chip(ctx, '+5 yaş', 790, 480, k, { bg: C.teal });
  header(ctx, 'DOĞUM VE AİLE', 1);
  caption(ctx, t, 0.8, 4.8, 'Babası **Alec Golding**, bilime ve akılcı düşünceye çok bağlı bir **fen bilimleri öğretmeniydi**.');
  caption(ctx, t, 5.6, 9.8, 'Annesi **Mildred Golding**, kadınların oy hakkını savunan **suffragette** hareketini destekledi; hikâyelere ve insan gözlemine ilgi duyardı.');
  caption(ctx, t, 10.6, 15, 'Kendisinden yaklaşık **beş yaş büyük** bir ağabeyi vardı: **José**.');
});

// 3 — the house by the churchyard
scene(8, (ctx, t) => {
  fillBg(ctx, vgrad(ctx, 0, 1200, ['#0F1830', '#1D2A52', '#34406E']));
  for (let i = 0; i < 40; i++) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i * 7)); ctx.globalAlpha = a; circle(ctx, rnd(i) * W, 330 + rnd(i + 50) * 600, 2 + rnd(i + 9) * 3, '#F8F1D8'); }
  ctx.globalAlpha = 1;
  circle(ctx, 800, 520, 150, 'rgba(248,241,216,0.08)'); circle(ctx, 800, 520, 85, '#F8F1D8'); circle(ctx, 836, 500, 76, '#1D2A52');
  ell(ctx, 300, 1180, 600, 150, '#1C2748'); ell(ctx, 900, 1200, 500, 130, '#212D52');
  at(ctx, 260, 1150, 0.82, 1, () => church(ctx, '#2B3A63', '#F6D27A'));
  at(ctx, 790, 1150, 0.8, 1, () => house(ctx, '#3A4A7A', '#26335A', '#F6D27A'));
  // a small face at the window
  at(ctx, 722, 1150 - 0.8 * 205, 0.8, ap(t, 1.2, 1), () => { circle(ctx, 0, 0, 22, '#2B2B3A'); circle(ctx, 0, 30, 22, '#2B2B3A'); });
  fillBgRect(ctx, 0, 1150, W, H, '#18223F');
  // cellar hatch with eyes in the dark
  at(ctx, 930, 1150, 1, 1, () => {
    poly(ctx, [-70, 0, 70, 0, 54, 40, -54, 40], '#0B1022');
    const blink = (Math.sin(t * 2.2) > 0.94) ? 0.15 : 1;
    ctx.globalAlpha *= ap(t, 2.2, 0.8); ell(ctx, -16, 20, 6, 6 * blink, '#F6D27A'); ell(ctx, 16, 20, 6, 6 * blink, '#F6D27A');
  });
  const gx = [70, 170, 280, 390, 500, 600];
  gx.forEach((x, i) => at(ctx, x, 1180 + (i % 2) * 30, 0.9, 1, () => grave(ctx, i % 3, '#3D4B78')));
  for (let i = 0; i < 4; i++) { const x = ((t * 40 + i * 330) % 1500) - 250; ctx.globalAlpha = 0.12; ell(ctx, x, 1170 + i * 25, 260, 40, '#DCE3F2'); }
  ctx.globalAlpha = 1;
  header(ctx, 'ÇOCUKLUK VE GENÇLİK YILLARI', ap(t, 0.2, 0.8), { color: '#F3EAD8', accent: C.orange });
  caption(ctx, t, 0.8, 8, 'Ailenin evi bir **kilise mezarlığının** hemen yanındaydı. Golding mezarlıktan ve özellikle evin **mahzeninden** çok korkardı.', { dark: true });
});
function fillBgRect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

// 4 — primary school: fights, then the prize book
scene(14, (ctx, t) => {
  fillBg(ctx, vgrad(ctx, 0, 1100, ['#BFE3EA', '#E6F3F1']));
  at(ctx, 220, 470, 1, 0.8, () => cloudPuff(ctx, 50, C.white)); at(ctx, 820, 560, 0.8, 0.8, () => cloudPuff(ctx, 50, C.white));
  at(ctx, 540, 1000, 0.75, 1, () => schoolBuilding(ctx));
  fillBgRect(ctx, 0, 1000, W, H, '#8DBF6A'); fillBgRect(ctx, 0, 1000, W, 16, '#79A85A');
  for (let x = 20; x < W; x += 70) { rr(ctx, x, 940, 16, 70, [8, 8, 0, 0]); ctx.fillStyle = '#F2E6CF'; ctx.fill(); }
  fillBgRect(ctx, 0, 960, W, 12, '#F2E6CF');
  const b2 = eIO(P(t, 6.8, 7.6));
  // beat 1: other kids play, William scuffles
  ctx.globalAlpha = 1 - b2;
  at(ctx, 170, 1190, 0.62, 1, () => kid(ctx, { shirt: C.teal, swing: t * 6, armL: 0.6, armR: 0.6 }));
  at(ctx, 330, 1175, 0.6, 1, () => kid(ctx, { shirt: C.mustard, swing: t * 6 + 2, armL: 0.6, armR: 1.2 }));
  circle(ctx, 250 + Math.sin(t * 3) * 70, 1020 - Math.abs(Math.sin(t * 3)) * 120, 26, C.coral);
  const fk = win(t, 2.0, 6.6, 0.5);
  if (fk > 0) at(ctx, 760, 1060, fk, fk, () => {
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + t * 4; circle(ctx, Math.cos(a) * 110, Math.sin(a) * 70, 70 + Math.sin(t * 9 + i) * 8, i % 2 ? '#FFF7E8' : '#F1E3CC'); }
    circle(ctx, 0, 0, 110, '#FFF7E8');
    for (let i = 0; i < 4; i++) at(ctx, Math.cos(t * 5 + i * 1.6) * 150, Math.sin(t * 5 + i * 1.6) * 100 - 40, 0.5, 1, () => star(ctx, 40, C.mustard));
    ell(ctx, -60, 90, 40, 18, C.ink); ell(ctx, 70, 100, 40, 18, C.ink); line(ctx, -120, 10, -190, -20, C.skin, 22); line(ctx, 130, 0, 190, -40, C.skin, 22);
  });
  at(ctx, 760, 1190, 0.62, 1 - fk, () => kid(ctx, { shirt: '#3A5A8C', mood: 'angry', armL: 0.3, armR: 0.3 }));
  ctx.globalAlpha = 1;
  // beat 2: eight years old, proud of his prize book
  if (b2 > 0) {
    ctx.globalAlpha = b2; circle(ctx, W / 2, 800, 330, 'rgba(255,248,230,0.8)'); ctx.globalAlpha = 1;
    const hop = Math.abs(Math.sin(t * 3)) * 14;
    at(ctx, W / 2, 1140 - hop, 1.1 * eBack(b2), b2, () => {
      kid(ctx, { shirt: '#3A5A8C', armL: 0.25, armR: 2.6, hair: '#4A3020' });
      at(ctx, 90, -322, 1, 1, () => bookClosed(ctx, 120, 150, C.coral, { band: C.mustard }), -0.2);
    });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 0.8, r = 300 + Math.sin(t * 2 + i) * 20; at(ctx, W / 2 + 110 + Math.cos(a) * r * 0.6, 560 + Math.sin(a) * r * 0.4, 0.5 + 0.2 * Math.sin(t * 4 + i), b2, () => star(ctx, 34, C.mustard)); }
    chip(ctx, '8 yaş', 250, 520, ap(t, 7.4, 0.6), { bg: C.teal });
  }
  header(ctx, 'ÇOCUKLUK VE GENÇLİK YILLARI', 1);
  caption(ctx, t, 0.6, 6.6, 'İlkokulda diğer çocuklarla nasıl iletişim kuracağını bilemedi ve sık sık **kavgalara** karıştı.');
  caption(ctx, t, 7.6, 14, '8 yaşında başarısı için verilen bir kitabı **büyük bir gururla** taşıdı: küçük yaşta **onaylanmaya** çok hassastı.');
});

// 5 — Marlborough Grammar School, 1921
scene(8, (ctx, t) => {
  fillBg(ctx, vgrad(ctx, 0, 1100, ['#BFE3EA', '#EAF4F0']));
  at(ctx, 220, 470, 1, 0.8, () => cloudPuff(ctx, 50, C.white));
  at(ctx, 540, 1080, 1.05, 1, () => schoolBuilding(ctx));
  fillBgRect(ctx, 0, 1080, W, H, '#8DBF6A'); fillBgRect(ctx, 0, 1080, W, 16, '#79A85A');
  rr(ctx, 470, 1080, 140, 600, 0); ctx.fillStyle = '#D9C9A8'; ctx.fill();
  const wk = P(t, 0.5, 6.5);
  at(ctx, lerp(150, 470, eIO(wk)), 1250 - eIO(wk) * 60, lerp(0.6, 0.42, wk), 1, () => kid(ctx, { shirt: '#3A5A8C', swing: t * 7 * (wk < 1 ? 1 : 0), armL: 0.3, armR: 0.3 }));
  chip(ctx, '1921', 250, 470, apB(t, 0.5, 0.7), { size: 84, bg: C.coral });
  at(ctx, 840, 540, apB(t, 1.4, 0.7), 1, () => {
    portrait(ctx, 120, '#BFE0DC', { hairStyle: 'side', hair: '#3B2A20', shirt: '#6B5B4B', collar: 'tie', tie: C.teal, glasses: C.ink, moustache: '#3B2A20' });
    at(ctx, 105, -95, 0.45, 1, () => flask(ctx, C.teal), 0.2);
  });
  header(ctx, 'ÇOCUKLUK VE GENÇLİK YILLARI', 1);
  caption(ctx, t, 0.6, 8, '**1921**’de, yaklaşık 10 yaşında **Marlborough Grammar School**’a başladı. Babası Alec Golding aynı okulda **fen bilimleri öğretmeniydi**.');
});

// 6 — Oxford: science, then English literature
scene(10, (ctx, t) => {
  fillBg(ctx, vgrad(ctx, 0, 1150, ['#F5E6CC', '#F9EFDF']));
  circle(ctx, 820, 470, 120, '#F7D9A0');
  at(ctx, 540, 1150, 0.9, 1, () => oxfordSkyline(ctx, '#E2C79A'));
  at(ctx, 470, 1150, 0.62, 1, () => oxfordSkyline(ctx, '#C9A574'));
  fillBgRect(ctx, 0, 1150, W, H, '#B8915F');
  // flask -> book
  const b = ap(t, 4.9, 0.6), cross = ap(t, 4.6, 0.5);
  at(ctx, lerp(540, 280, eIO(P(t, 4.4, 5.0))), 720, apB(t, 0.6, 0.7) * lerp(1.3, 0.95, eIO(P(t, 4.4, 5.0))), 1 - 0.45 * cross, () => {
    flask(ctx, C.teal);
    if (cross > 0) { ctx.globalAlpha = cross; line(ctx, -90, -90, 90, 90, C.red, 16); line(ctx, 90, -90, -90, 90, C.red, 16); }
  });
  arrow(ctx, 410, 720, 610, 720, C.ink, 12, ap(t, 5.0, 0.5));
  at(ctx, 790, 720, apB(t, 5.3, 0.7) * 1.15, 1, () => { bookOpen(ctx, 260, 180, C.coral); textLines(ctx, -110, -50, 90, 4, 28, '#C9B796'); textLines(ctx, 20, -50, 90, 4, 28, '#C9B796'); });
  if (t > 5.6) for (let i = 0; i < 5; i++) { const a = t * 1.2 + i * 1.25; at(ctx, 790 + Math.cos(a) * 210, 690 + Math.sin(a) * 140, 0.45, ap(t, 5.6, 0.6), () => star(ctx, 30, C.mustard)); }
  at(ctx, 300, 520, 0.8 * ap(t, 1.6, 0.6) * (1 - cross), 1, () => heart(ctx, 40, C.coral));
  header(ctx, 'OXFORD YILLARI', ap(t, 0.2, 0.8));
  caption(ctx, t, 0.6, 4.6, 'Oxford Üniversitesi’nde **Doğa Bilimleri** okumaya başladı; bu bölümü büyük ölçüde **babasını memnun etmek** için seçmişti.');
  caption(ctx, t, 5.2, 10, 'Bilimin kendisine göre olmadığını fark edince bölüm değiştirdi ve **İngiliz Dili ve Edebiyatı** okudu.');
});

// 7 — a dark confession in his own writing
scene(8, (ctx, t) => {
  fillBg(ctx, '#1A2230');
  const g = ctx.createRadialGradient(540, 700, 40, 540, 700, 620); g.addColorStop(0, 'rgba(244,196,120,0.30)'); g.addColorStop(1, 'rgba(244,196,120,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  at(ctx, 540, 760, 1.6, ap(t, 0.2, 1), () => {
    bookOpen(ctx, 360, 250, '#5A3A2A');
    ctx.save(); ctx.globalAlpha *= 0.9;
    const k = P(t, 0.8, 5.5);
    textLines(ctx, -165, -95, 140, 7, 28, '#4E5B78', clamp(k * 2));
    textLines(ctx, 18, -95, 140, 7, 28, '#4E5B78', clamp(k * 2 - 1));
    ctx.restore();
    const k2 = clamp(P(t, 0.8, 5.5) * 2 - 1), pk = k2 > 0 ? k2 : clamp(P(t, 0.8, 5.5) * 2);
    const px = (k2 > 0 ? 18 : -165) + 140 * ((pk * 7) % 1), py = -95 + Math.floor(Math.min(6.99, pk * 7)) * 28;
    at(ctx, px + 20, py - 50, 1, 1, () => { line(ctx, 0, 0, 60, -90, '#2C2C2C', 12); poly(ctx, [-6, 6, 4, -6, -4, 14], '#C9A86A'); }, 0);
  });
  header(ctx, 'OXFORD YILLARI', 1, { color: '#F3EAD8', accent: C.orange });
  caption(ctx, t, 0.8, 8, 'Kendi yazılı anlatımına göre, Oxford’daki ilk yılında tatildeyken **15 yaşındaki Dora**’ya **tecavüz etmeye çalıştı**; kız karşı koyarak kurtuldu. Golding bunu yıllar sonra yazılarında **itiraf etti**.', { dark: true, size: 42 });
});

// 8 — engagements and marriage
scene(13, (ctx, t) => {
  fillBg(ctx, '#F6E3DA');
  circle(ctx, 540, 640, 380, '#F1D4C7');
  const will = { hairStyle: 'wavy', hair: '#3B2A20', shirt: '#3A5A8C', collar: 'tie', tie: C.mustard };
  const close = eIO(P(t, 9.0, 10.0));
  at(ctx, lerp(290, 350, close), 760, 0.85 * apB(t, 0.2, 0.7), 1, () => bust(ctx, will));
  // Mollie Evans
  const mOut = eIO(P(t, 4.8, 5.6));
  at(ctx, 790 + mOut * 400, 760, 0.85 * apB(t, 0.5, 0.7), 1 - mOut, () => bust(ctx, { hairStyle: 'bun', hair: '#9A5B34', shirt: C.mustard, collar: 'round' }));
  // the first ring breaks
  const br = ap(t, 4.8, 1.0);
  if (t < 7) at(ctx, 540, 520, apB(t, 1.0, 0.6), 1 - br, () => {
    ctx.save(); ctx.translate(-br * 60, br * 140); ctx.rotate(-br * 0.8); ctx.beginPath(); ctx.rect(-80, -90, 80, 180); ctx.clip(); ring(ctx); ctx.restore();
    ctx.save(); ctx.translate(br * 60, br * 140); ctx.rotate(br * 0.8); ctx.beginPath(); ctx.rect(0, -90, 80, 180); ctx.clip(); ring(ctx); ctx.restore();
  });
  // Ann Brookfield (analytic chemist) and her fiancé, who fades away
  const aIn = eOut(P(t, 5.0, 5.9)), aX = lerp(1200, 790, aIn) - close * 60;
  const fOut = ap(t, 7.4, 0.8);
  at(ctx, aX + 150, 700, 0.7, 0.5 * aIn * (1 - fOut), () => bust(ctx, { hairStyle: 'side', hair: '#555', shirt: '#7A8590', collar: 'tie', tie: '#999' }));
  if (fOut > 0 && fOut < 1) at(ctx, aX + 150, 560, 1, 1 - fOut, () => { line(ctx, -30, -40, 10, 0, C.red, 10); line(ctx, 10, 0, -10, 20, C.red, 10); line(ctx, -10, 20, 30, 60, C.red, 10); });
  at(ctx, aX, 760, 0.85, aIn, () => bust(ctx, { hairStyle: 'bob', hair: '#2E1F1A', collar: 'lab', inner: C.teal, shirt: C.white }));
  at(ctx, aX + 180, 930, 0.5 * aIn, aIn, () => flask(ctx, C.plum), 0.2);
  // together
  const hk = apB(t, 9.4, 0.7);
  at(ctx, 540, 500 + Math.sin(t * 2.5) * 8, hk, hk, () => { heart(ctx, 90, C.coral); at(ctx, -28, 150, 0.7, 1, () => ring(ctx, C.gold, false)); at(ctx, 28, 150, 0.7, 1, () => ring(ctx, C.gold, false)); });
  chip(ctx, '≈ 5 ay', 540, 1130, ap(t, 10, 0.5), { bg: C.teal });
  header(ctx, 'OXFORD YILLARI', 1);
  caption(ctx, t, 0.6, 4.8, 'Mezun olduktan sonraki yıllarda **Mollie Evans** ile nişanlandı.', { y: 1330 });
  caption(ctx, t, 5.4, 9.0, 'Sonra analitik kimyager **Ann Brookfield** ile tanıştı. İkisi de başkasıyla nişanlıydı ama **nişanlarını bozdular**.', { y: 1360 });
  caption(ctx, t, 9.4, 13, 'Tanışmalarından yaklaşık **beş ay sonra evlendiler**.', { y: 1330 });
});

// 9 — the teacher who watched
scene(12, (ctx, t) => {
  const b = eIO(P(t, 5.0, 5.8));
  const teacher = { hairStyle: 'wavy', hair: '#3B2A20', shirt: '#6B5B4B', collar: 'tie', tie: C.coral };
  if (b < 1) {
    ctx.globalAlpha = 1;
    fillBg(ctx, '#EADBC2');
    rr(ctx, 120, 360, 840, 420, 20); ctx.fillStyle = '#7A5A3A'; ctx.fill(); rr(ctx, 140, 380, 800, 380, 12); ctx.fillStyle = '#2F5446'; ctx.fill();
    ctx.globalAlpha = 0.85; textLines(ctx, 190, 450, 420, 4, 60, '#E8F0EA', P(t, 0.3, 3)); ctx.globalAlpha = 1;
    fillBgRect(ctx, 0, 1150, W, H, '#C9A37A');
    for (let i = 0; i < 3; i++) {
      const x = 520 + i * 200, y = 1060;
      at(ctx, x, y + 120, 0.8, 1, () => { circle(ctx, 0, -300, 50, C.skin); ctx.fillStyle = ['#4A3020', '#8B4A2B', '#2E1F1A'][i]; ctx.beginPath(); ctx.arc(0, -306, 52, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); rr(ctx, -46, -250, 92, 140, 30); ctx.fillStyle = [C.coral, C.teal, C.mustard][i]; ctx.fill(); ell(ctx, -16, -296, 5, 6.5, C.ink); ell(ctx, 16, -296, 5, 6.5, C.ink); });
      rr(ctx, x - 90, y, 180, 30, 6); ctx.fillStyle = '#8B5A2B'; ctx.fill(); line(ctx, x - 70, y + 30, x - 70, y + 140, '#6B4423', 10); line(ctx, x + 70, y + 30, x + 70, y + 140, '#6B4423', 10);
    }
    at(ctx, 230, 860, 0.85, 1, () => { bust(ctx, teacher); rr(ctx, 30, 170, 130, 160, 8); ctx.fillStyle = C.paper; ctx.fill(); textLines(ctx, 50, 210, 90, 4, 28, '#9AA6B2', P(t, 1, 4)); });
    // eye: observing
    at(ctx, 230, 560, apB(t, 1, 0.6), 1, () => { ell(ctx, 0, 0, 70, 40, C.white); circle(ctx, 10 + Math.sin(t * 1.4) * 14, 0, 24, C.sea); circle(ctx, 10 + Math.sin(t * 1.4) * 14, 0, 11, C.ink); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, 0, 70, 40, 0, 0, Math.PI * 2); ctx.stroke(); });
  }
  if (b > 0) {
    ctx.save(); ctx.globalAlpha = b;
    fillBg(ctx, vgrad(ctx, 0, 1000, ['#BFE3EA', '#EAF4F0']));
    // Golding watching from behind the hill
    at(ctx, 540, 700, 0.55, ap(t, 6, 0.6), () => { bust(ctx, teacher); rr(ctx, 30, 170, 130, 160, 8); ctx.fillStyle = C.paper; ctx.fill(); textLines(ctx, 50, 210, 90, 4, 28, '#9AA6B2', P(t, 6.5, 11)); });
    ell(ctx, 200, 1000, 500, 160, '#9CC97A'); ell(ctx, 900, 980, 420, 140, '#8DBF6A');
    fillBgRect(ctx, 0, 1000, W, H, '#8DBF6A');
    for (let i = 0; i < 4; i++) at(ctx, 80 + i * 280, 960, 0.8, 1, () => { rr(ctx, -12, -120, 24, 120, 6); ctx.fillStyle = '#7A5230'; ctx.fill(); cloudPuff(ctx, 50, C.greenD); }, 0);
    // defenders behind a log wall
    for (let i = 0; i < 3; i++) at(ctx, 150 + i * 105, 1110 - (i % 2) * 30, 0.55, 1, () => kid(ctx, { shirt: C.teal, shield: true, armL: 0.2, armR: 0.9 }));
    rr(ctx, 70, 1050, 360, 60, 30); ctx.fillStyle = '#8B5A2B'; ctx.fill(); rr(ctx, 90, 1090, 330, 54, 27); ctx.fillStyle = '#A06A35'; ctx.fill();
    // attackers charging
    const run = ((t - 5) * 40) % 1;
    for (let i = 0; i < 3; i++) {
      const x = lerp(1000, 690, eOut(P(t, 5.8, 9))) + i * 110 + Math.sin(t * 8 + i) * 6, y = 1130 + (i % 2) * 30;
      at(ctx, x, y, 0.55, 1, () => kid(ctx, { shirt: C.coral, swing: t * 10 + i, armL: -0.6, armR: 2.3, propR: 'stick', mood: 'angry' }));
    }
    for (let i = 0; i < 3; i++) line(ctx, 960 + i * 20 + run * 10, 960 + i * 40, 1040 + i * 20, 960 + i * 40, 'rgba(255,255,255,0.7)', 6);
    ctx.restore();
  }
  header(ctx, 'ÖĞRETMENLİK YILLARI', ap(t, 0.2, 0.8));
  caption(ctx, t, 0.6, 5.0, 'Öğretmenlik yaptığı yıllarda öğrencilerinin davranışlarını dikkatle **gözlemliyordu**.');
  caption(ctx, t, 5.6, 12, 'Bir okul gezisinde öğrencilerin iki gruba ayrılmasına izin verdi: bir grup **savunma** yaparken diğeri **saldırdı**. Golding çocukların bu mücadeledeki davranışlarını izledi.', { y: 1420, size: 42 });
});

// 10 — Royal Navy: from sailor to lieutenant
scene(10, (ctx, t) => {
  fillBg(ctx, vgrad(ctx, 0, 1080, ['#A9CCDC', '#E4EFF2']));
  at(ctx, 200, 820, 1, 0.7, () => cloudPuff(ctx, 50, C.white)); at(ctx, 880, 860, 0.8, 0.7, () => cloudPuff(ctx, 50, C.white));
  waveBand(ctx, 1080, 8, 300, t, '#3E7F99');
  at(ctx, 560 + Math.sin(t * 0.5) * 10, 1100 + Math.sin(t * 1.4) * 5, 0.95, ap(t, 0.2, 0.8), () => warship(ctx, { flag: true }), Math.sin(t * 1.2) * 0.012);
  waveBand(ctx, 1120, 10, 360, t * 1.4 + 1, '#2B6580');
  waveBand(ctx, 1230, 12, 420, t * 1.7 + 2, '#1D4F66');
  const xs = [200, 540, 880];
  [0, 1, 2].forEach(i => {
    const k = apB(t, 0.8 + i * 1.6, 0.7);
    at(ctx, xs[i], 520, k, k, () => {
      circle(ctx, 6, 10, 118, 'rgba(30,42,58,0.2)'); circle(ctx, 0, 0, 118, C.paper); circle(ctx, 0, 0, 102, ['#CFE3EE', '#F4E3C6', '#1B2B4B'][i]);
      if (i === 0) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 102, 0, Math.PI * 2); ctx.clip(); at(ctx, 0, 6, 0.52, 1, () => bust(ctx, { hairStyle: 'wavy', hair: '#3B2A20', shirt: C.navy, collar: 'navy', cap: 'sailor' })); ctx.restore(); }
      if (i === 1) { rr(ctx, -50, -62, 100, 124, 8); ctx.fillStyle = C.white; ctx.fill(); textLines(ctx, -32, -32, 64, 4, 22, '#9AA6B2'); at(ctx, 40, 30, 1, 1, () => { line(ctx, 0, 0, 40, -60, C.ink, 10); poly(ctx, [-4, 6, 6, -4, -6, 12], C.mustard); }); }
      if (i === 2) { rr(ctx, -80, -18, 160, 14, 4); ctx.fillStyle = C.gold; ctx.fill(); rr(ctx, -80, 14, 160, 14, 4); ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(0, -36, 22, 16, 0, 0, Math.PI * 2); ctx.stroke(); }
    });
    at(ctx, xs[i], 700, 1, k, () => { ctx.font = '800 36px Montserrat'; ctx.textAlign = 'center'; ctx.fillStyle = C.ink; ctx.fillText(['Er', 'Subaylık', 'Teğmen'][i], 0, 0); ctx.textAlign = 'left'; });
    if (i < 2) arrow(ctx, xs[i] + 130, 520, xs[i + 1] - 135, 520, C.coral, 9, ap(t, 1.6 + i * 1.6, 0.6));
  });
  header(ctx, 'II. DÜNYA SAVAŞI', ap(t, 0.2, 0.8));
  caption(ctx, t, 0.6, 10, 'Savaş sırasında **İngiliz Kraliyet Donanması**’na katıldı. Sıradan bir **er** olarak başladı, subaylığa başvurdu ve **teğmenliğe** kadar yükseldi.', { y: 1420 });
});

// 11 — the hunt for the Bismarck
scene(8, (ctx, t) => {
  fillBg(ctx, vgrad(ctx, 0, 1100, ['#2F3B4C', '#5B6878', '#8494A3']));
  for (let i = 0; i < 4; i++) { const x = ((t * 25 + i * 380) % 1500) - 250; at(ctx, x, 380 + i * 90, 1.2, 0.35, () => cloudPuff(ctx, 70, '#3D4A5B')); }
  for (let i = 0; i < 3; i++) { const x = lerp(-200, 1300, P(t, 0.3 + i * 0.5, 5.5 + i * 0.5)); at(ctx, x, 500 + i * 70, 0.8, 1, () => biplane(ctx, '#AEB8C2'), 0.05); }
  waveBand(ctx, 1060, 10, 280, t * 1.3, '#2C4558');
  const sink = eIO(P(t, 3.5, 8));
  // flashes of gunfire at the horizon
  for (let i = 0; i < 4; i++) { const ft = (t * 1.3 + i * 0.37) % 1; if (ft < 0.12) circle(ctx, 80 + i * 70, 1050, 30 * (1 - ft / 0.12) + 10, 'rgba(255,190,90,0.8)'); }
  // smoke
  for (let i = 0; i < 9; i++) { const u = (t * 0.25 + i / 9) % 1; ctx.globalAlpha = (1 - u) * (0.3 + sink * 0.4); circle(ctx, 600 + Math.sin(i * 2) * 60 + u * 140, 900 - u * 450, 50 + u * 120, '#2B2F36'); }
  ctx.globalAlpha = 1;
  at(ctx, 600, 1090 + sink * 140, 1.15, 1, () => warship(ctx, { hull: '#434C55', sup: '#5D666F' }), sink * 0.14 + Math.sin(t * 1.3) * 0.01);
  // splash columns
  for (let i = 0; i < 3; i++) { const st = (t - 1 - i * 1.7); if (st > 0 && st < 1.2) { const h = Math.sin(st / 1.2 * Math.PI) * 220; ell(ctx, 280 + i * 330, 1110 - h / 2, 24, h / 2, 'rgba(230,240,245,0.85)'); } }
  waveBand(ctx, 1110, 12, 340, t * 1.6 + 1, '#22394A');
  waveBand(ctx, 1220, 14, 420, t * 1.9 + 2, '#182B38');
  at(ctx, 250, 820, 1, ap(t, 1.0, 0.6) * (1 - ap(t, 7, 0.5)), () => tag(ctx, 'Bismarck', C.white, '#B03A2E'));
  header(ctx, 'II. DÜNYA SAVAŞI', 1, { color: '#F3EAD8', accent: C.orange });
  caption(ctx, t, 0.6, 8, 'Almanların ünlü dev savaş gemisi **Bismarck**’ın takip edilip batırılmasıyla sonuçlanan operasyonda yer aldı.', { dark: true });
});

// 12 — the end of optimism
scene(8, (ctx, t) => {
  fillBg(ctx, vgrad(ctx, 0, H, ['#22262E', '#3A2E2E', '#22262E']));
  const dim = eIO(P(t, 1.5, 6.5));
  at(ctx, 520, 820, 1.25, ap(t, 0.2, 0.8), () => {
    ctx.beginPath(); ctx.ellipse(-20, -60, 230, 250, 0, 0, Math.PI * 2);
    ctx.moveTo(150, -150); ctx.lineTo(205, -40); ctx.lineTo(250, 14); ctx.lineTo(205, 34); ctx.lineTo(218, 62); ctx.lineTo(202, 82); ctx.lineTo(206, 122); ctx.lineTo(150, 175); ctx.lineTo(60, 190); ctx.lineTo(40, 330); ctx.lineTo(-150, 330); ctx.lineTo(-170, 120); ctx.lineTo(0, 0);
    ctx.fillStyle = '#3E4656'; ctx.fill('nonzero');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-20, -60, 215, 235, 0, 0, Math.PI * 2); ctx.clip();
    const sun = lerp(1, 0.25, dim);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t * 0.2; ctx.globalAlpha = sun; line(ctx, -20 + Math.cos(a) * 110, -60 + Math.sin(a) * 110, -20 + Math.cos(a) * 170, -60 + Math.sin(a) * 170, C.mustard, 14); }
    ctx.globalAlpha = 1; circle(ctx, -20, -60, 90, `rgba(233,196,106,${sun})`); circle(ctx, -20, -60, 90, `rgba(120,70,60,${1 - sun})`);
    for (let i = 0; i < 10; i++) { const r = 60 + rnd(i) * 70, x = -230 + rnd(i + 3) * 420, y = lerp(260, -140 + rnd(i + 7) * 200, dim); ctx.globalAlpha = 0.85; circle(ctx, x, y, r, i % 2 ? '#2A2F38' : '#33363F'); }
    ctx.restore();
  });
  // barbed wire
  ctx.globalAlpha = ap(t, 2, 1);
  line(ctx, 0, 1140, W, 1140, '#6E6A6A', 5); line(ctx, 0, 1150, W, 1150, '#6E6A6A', 5);
  for (let x = 40; x < W; x += 110) { line(ctx, x - 16, 1128, x + 16, 1162, '#8A8585', 5); line(ctx, x + 16, 1128, x - 16, 1162, '#8A8585', 5); }
  ctx.globalAlpha = 1;
  header(ctx, 'II. DÜNYA SAVAŞI', 1, { color: '#F3EAD8', accent: C.orange });
  caption(ctx, t, 0.6, 8, 'Nazi Almanyası’nın katliamları ve savaşın şiddeti, Golding’i insanın doğuştan yalnızca **iyi ve medeni** olduğuna dair **iyimser düşüncelerden uzaklaştırdı**.', { dark: true });
});

// typewritten manuscript used by the next three scenes
function manuscript(ctx, title, k, o = {}) {
  rr(ctx, -290, -380, 600, 780, 6); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
  rr(ctx, -300, -390, 600, 780, 6); ctx.fillStyle = '#FFFCF4'; ctx.fill();
  ctx.font = '700 40px "DejaVu Sans Mono", monospace'; ctx.fillStyle = C.ink; ctx.textAlign = 'center';
  const n = Math.floor(title.length * clamp(k));
  ctx.fillText(title.slice(0, n), 0, -270);
  ctx.save(); ctx.font = '500 26px "DejaVu Sans Mono", monospace'; ctx.globalAlpha *= clamp(k * 3 - 2); ctx.fillText('William Golding', 0, -215); ctx.restore();
  ctx.textAlign = 'left';
  textLines(ctx, -230, -120, 460, 14, 34, '#A3ACB6', o.lines ?? 1);
}
function stamp(ctx, txt) {
  ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 9; rr(ctx, -150, -55, 300, 110, 12); ctx.stroke();
  ctx.font = '800 64px Montserrat'; ctx.fillStyle = '#C0392B'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 4);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function desk(ctx) {
  fillBg(ctx, '#C59B6D');
  ctx.globalAlpha = 0.18; for (let i = 0; i < 26; i++) line(ctx, 0, 330 + i * 60 + Math.sin(i) * 10, W, 330 + i * 60 + Math.cos(i) * 14, '#7A5230', 4); ctx.globalAlpha = 1;
}

// 13 — the first title, and the rejections
scene(10, (ctx, t) => {
  desk(ctx);
  at(ctx, 540, 760, 0.95, ap(t, 0.2, 0.6), () => {
    manuscript(ctx, 'STRANGERS FROM WITHIN', P(t, 0.6, 2.6), { lines: P(t, 2.0, 4) });
    ctx.globalAlpha *= ap(t, 2.8, 0.8); ctx.font = '600 52px Caveat'; ctx.fillStyle = '#2E5E9E'; ctx.textAlign = 'center';
    ctx.fillText('“İçimizdeki Yabancılar”', 0, -158); ctx.textAlign = 'left';
  }, -0.03);
  const st = [[400, 720, -0.25], [690, 860, 0.2], [420, 1000, 0.1], [680, 1090, -0.12]];
  st.forEach(([x, y, r], i) => { const a = 5.4 + i * 0.75, k = P(t, a, a + 0.18); if (k > 0) at(ctx, x, y, lerp(1.8, 1, eOut(k)), k, () => stamp(ctx, 'RED'), r); });
  header(ctx, 'SAVAŞ SONRASI', ap(t, 0.2, 0.8));
  caption(ctx, t, 0.6, 5.0, 'Savaştan sonra bugün **Sineklerin Tanrısı** olarak bildiğimiz romanı yazdı. İlk adı **Strangers from Within**, yani “İçimizdeki Yabancılar”dı.', { y: 1420 });
  caption(ctx, t, 5.4, 10, 'Romanı birçok yayınevine gönderdi ancak **defalarca reddedildi**.', { y: 1420 });
});

// 14 — Faber & Faber and Charles Monteith
scene(10, (ctx, t) => {
  fillBg(ctx, '#EADDC8');
  fillBgRect(ctx, 0, 1080, W, H, '#8B6A4A'); fillBgRect(ctx, 0, 1080, W, 18, '#6E5238');
  at(ctx, 540, 450, apB(t, 0.2, 0.7), 1, () => {
    rr(ctx, -300, -70, 600, 140, 14); ctx.fillStyle = '#23463A'; ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 5; rr(ctx, -286, -56, 572, 112, 10); ctx.stroke();
    ctx.font = '600 72px "Cormorant Garamond"'; ctx.fillStyle = '#E9C97A'; ctx.textAlign = 'center'; ctx.fillText('Faber & Faber', 0, 24); ctx.textAlign = 'left';
  });
  // pile of rejected manuscripts
  for (let i = 0; i < 9; i++) { const y = 1070 - i * 26, x = 680 + Math.sin(i * 2.3) * 22; rr(ctx, x - 190, y - 22, 380, 24, 3); ctx.fillStyle = i % 2 ? '#FFFCF4' : '#F1EBDD'; ctx.fill(); ctx.strokeStyle = '#CDBFA6'; ctx.lineWidth = 2; ctx.stroke(); }
  at(ctx, 720, 830, 0.42, ap(t, 0.8, 0.3) * (1 - ap(t, 5.2, 0.4)), () => stamp(ctx, 'RED'), -0.15);
  // the chosen manuscript rises out of the pile
  const up = eIO(P(t, 5.4, 7.0));
  const mx = lerp(680, 470, up), my = lerp(840, 700, up);
  if (up > 0) { const g = ctx.createRadialGradient(mx, my, 20, mx, my, 330); g.addColorStop(0, `rgba(255,236,170,${0.6 * up})`); g.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  at(ctx, mx, my, lerp(0.15, 0.42, up), 1, () => manuscript(ctx, 'STRANGERS FROM WITHIN', 1), lerp(0.04, -0.08, up));
  if (up > 0.5) for (let i = 0; i < 5; i++) { const a = t * 1.5 + i * 1.25; at(ctx, mx + Math.cos(a) * 200, my + Math.sin(a) * 210, 0.4, ap(t, 6.5, 0.5), () => star(ctx, 30, C.mustard)); }
  // Charles Monteith, the young editor
  const mIn = eOut(P(t, 4.8, 5.8));
  at(ctx, lerp(-200, 190, mIn), 960, 0.8, mIn, () => bust(ctx, { hairStyle: 'side', hair: '#2E1F1A', shirt: '#2F4858', collar: 'tie', tie: C.coral, glasses: C.ink }));
  at(ctx, 190, 650, apB(t, 7.2, 0.6), 1, () => { circle(ctx, 0, 0, 52, '#FCE3A8'); circle(ctx, 0, 0, 38, C.mustard); rr(ctx, -18, 40, 36, 28, 6); ctx.fillStyle = C.greyD; ctx.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; line(ctx, Math.cos(a) * 66, Math.sin(a) * 66, Math.cos(a) * 88, Math.sin(a) * 88, C.mustard, 7); } });
  header(ctx, 'SAVAŞ SONRASI', 1);
  caption(ctx, t, 0.6, 4.8, 'Sonunda metin **Faber & Faber** yayınevine ulaştı; burada da ilk başta **reddedildi**.', { y: 1400 });
  caption(ctx, t, 5.4, 10, 'Ancak genç editör **Charles Monteith**, reddedilen dosyaların arasından kitabı okuyup **potansiyelini fark etti**.', { y: 1400 });
});

// 15 — edits, a new title, the book
scene(10, (ctx, t) => {
  desk(ctx);
  const cv = eIO(P(t, 5.6, 6.6));
  at(ctx, 540, 760, 0.95 * (1 - cv * 0.2), 1 - cv, () => {
    manuscript(ctx, 'STRANGERS FROM WITHIN', 1);
    // red pen edits: strike-throughs and cuts
    [[0, 0.6, 1.4], [3, 1.0, 1.8], [4, 1.2, 2.0], [8, 1.6, 2.4], [11, 1.9, 2.7]].forEach(([row, a, b]) => {
      const k = P(t, a, b); if (k > 0) line(ctx, -240, -120 + row * 34, -240 + 470 * k, -120 + row * 34 - 4, '#D0342C', 7);
    });
    ctx.globalAlpha *= ap(t, 2.0, 0.5); ctx.strokeStyle = '#D0342C'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(250, 140); ctx.bezierCurveTo(290, 160, 290, 260, 250, 280); ctx.stroke(); ctx.globalAlpha = 1;
    const sk = P(t, 2.8, 3.4); if (sk > 0) line(ctx, -270, -282, -270 + 540 * sk, -276, '#D0342C', 9);
    const wk = P(t, 3.4, 4.8);
    if (wk > 0) { ctx.save(); ctx.beginPath(); ctx.rect(-300, -400, 600 * wk, 120); ctx.clip(); ctx.font = '600 66px Caveat'; ctx.fillStyle = '#D0342C'; ctx.textAlign = 'center'; ctx.fillText('Lord of the Flies', 0, -324); ctx.restore(); ctx.textAlign = 'left'; }
  }, -0.03);
  // the published book
  if (cv > 0) at(ctx, 540, 760, lerp(0.7, 1, eBack(cv)), cv, () => {
    rr(ctx, -250, -370, 520, 760, 14); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
    rr(ctx, -260, -380, 520, 760, 14); ctx.fillStyle = '#1F6F68'; ctx.fill();
    ctx.save(); rr(ctx, -260, -380, 520, 760, 14); ctx.clip();
    fillBgRect(ctx, -260, -60, 520, 500, '#14485C'); ell(ctx, 0, 140, 210, 60, C.sand); at(ctx, -30, 130, 0.55, 1, () => palm(ctx, 300, 50, t)); at(ctx, 60, 140, 0.45, 1, () => palm(ctx, 260, -40, t + 1));
    waveBand(ctx, 210, 6, 120, t, '#1F6F8B', -260, 260);
    at(ctx, 120 + Math.cos(t * 2) * 30, 40 + Math.sin(t * 2.6) * 20, 0.8, 1, () => fly(ctx, t));
    rr(ctx, -260, -380, 26, 760, 0); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
    ctx.restore();
    ctx.textAlign = 'center'; ctx.fillStyle = '#F6EEDC'; ctx.font = '800 64px Montserrat'; ctx.fillText('LORD OF', 0, -250); ctx.fillText('THE FLIES', 0, -175);
    ctx.font = 'italic 500 44px "Cormorant Garamond"'; ctx.fillText('William Golding', 0, -110); ctx.textAlign = 'left';
    const sh = (t * 0.6) % 2; ctx.save(); rr(ctx, -260, -380, 520, 760, 14); ctx.clip(); ctx.globalAlpha = 0.18; ctx.translate(-400 + sh * 600, 0); ctx.rotate(0.35); ctx.fillStyle = C.white; ctx.fillRect(-40, -700, 80, 1400); ctx.restore();
  });
  header(ctx, 'SAVAŞ SONRASI', 1);
  caption(ctx, t, 0.6, 5.4, 'Monteith bazı bölümlerin **değiştirilmesini** ve **kısaltılmasını** istedi.', { y: 1400 });
  caption(ctx, t, 5.8, 10, 'Düzenlemelerin ardından kitabın adı **Lord of the Flies** olarak değiştirildi ve eser **yayımlandı**.', { y: 1400 });
});

// 16 — closing
scene(8, (ctx, t) => {
  sunsetSea(ctx, t + 7);
  ctx.fillStyle = 'rgba(20,30,45,0.25)'; ctx.fillRect(0, 0, W, H);
  const k = ap(t, 0.4, 1.2), k2 = ap(t, 1.2, 1), k3 = ap(t, 2.0, 1);
  ctx.textAlign = 'center';
  ctx.globalAlpha = k; ctx.font = 'italic 500 140px "Cormorant Garamond"'; ctx.fillStyle = '#FFF6E6'; ctx.fillText('William Golding', W / 2, 450 + (1 - k) * 30);
  ctx.globalAlpha = k2; ctx.font = '600 40px Montserrat'; ctx.fillText('19 Eylül 1911 – 19 Haziran 1993', W / 2, 540);
  line(ctx, W / 2 - 60 * k3, 590, W / 2 + 60 * k3, 590, C.orange, 6);
  ctx.globalAlpha = k3; ctx.font = '500 36px Montserrat'; ctx.fillStyle = '#FBE3C4'; ctx.fillText('Newquay  →  Perranarworthal, Cornwall', W / 2, 655);
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  ctx.fillStyle = `rgba(0,0,0,${ap(t, 6.6, 1.4)})`; ctx.fillRect(0, 0, W, H);
});

let t0 = 0; for (const s of S) { s.start = t0; t0 += s.dur; }
const DURATION = t0;
