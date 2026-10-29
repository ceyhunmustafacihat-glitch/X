'use strict';
// Satranç Dersi 01 — Satranç Tahtası. Every frame is a pure function of time t (seconds).
// buildCues() returns the sound-effect cue list on the same clock; audio/compose.py renders it.
(function () {
  const W = 1080, H = 1920, D = TL.duration;
  const BS = 108, BX = (W - 8 * BS) / 2, BY = 572;     // board: 864 px, x 108–972, y 572–1436
  const C = {
    // only the logo's two colours and their tones: brown #4E3220 and the pawn's gold #E2C890 → #C9A86E
    bg0: '#4E3220', bg1: '#5A3A25', bg2: '#3F2819', card: '#4E3220', cardDark: '#452B1B', shade: '#1f130b', light: '#EEDDB8', dark: '#A97F52', frame: '#2b1e15',
    gold: '#E5BE6E', caramel: '#B9814A', caramelText: '#E8A95E', cream: '#F3E4C2', choc: '#2A1A0E',
    white: '#F6ECD8', muted: '#CDB28A', ink: '#24160c',
  };
  const FILES = 'abcdefgh';
  const FONT = 'Montserrat';

  // ------------------------------------------------------------------ helpers
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eIn = x => x * x * x;
  const eIO = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eBack = x => { const c1 = 1.9, c3 = c1 + 1; return x <= 0 ? 0 : x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const win = (t, a, b, fi = 0.35, fo = 0.35) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));
  const sqX = f => BX + f * BS, sqY = r => BY + (7 - r) * BS;
  const cx = f => sqX(f) + BS / 2, cy = r => sqY(r) + BS / 2;
  const isLight = (f, r) => (f + r) % 2 === 1;
  const sq = name => [FILES.indexOf(name[0]), parseInt(name.slice(1), 10) - 1];
  const name = (f, r) => FILES[f] + (r + 1);
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  let ctx;
  function font(weight, size) { ctx.font = `${weight} ${size}px ${FONT}`; }
  function fitSize(text, weight, size, maxW, spacing = 0) {
    font(weight, size); ctx.letterSpacing = spacing + 'px';
    const w = ctx.measureText(text).width;
    ctx.letterSpacing = '0px';
    return w > maxW ? Math.floor(size * maxW / w) : size;
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  }
  function text(str, x, y, { weight = 700, size = 40, color = C.white, align = 'center', alpha = 1, spacing = 0, base = 'middle' } = {}) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    font(weight, size); ctx.letterSpacing = spacing + 'px';
    ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function pill(label, x, y, { size = 30, color = C.gold, fg = C.ink, alpha = 1, padX = 26, h = 58, spacing = 4, weight = 800, scale = 1 } = {}) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y); ctx.scale(scale, scale);
    font(weight, size); ctx.letterSpacing = spacing + 'px';
    const w = ctx.measureText(label).width - spacing + padX * 2;
    rrect(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = color; ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fg;
    ctx.fillText(label, spacing / 2, 2);
    ctx.restore();
    return w;
  }

  // ------------------------------------------------------------------ script
  const T = {
    build: 3.3, frameIn: 3.1,
    count: [9.5, 11.1], rows: 12.2, cols: 15.0, lights: 17.9, darks: 19.5,
    axisLetters: 24.5, axisNumbers: 25.3, filesGlow: 28.3, ranksGlow: 29.8,
    walk: 31.9, colE: 35.9, row4: 36.5, e4: 37.1, ripple: 39.7,
    spot: 45.1, center: 51.5, ext: 56.5, king: 61.9, queen: 66.1, divider: 68.6,
    boardOut: 72.9, titleIn: D - 1.6,
  };
  const STEP = { rows: 0.26, cols: 0.26, walk: 0.36, center: 0.22, ext: 0.16, labels: 0.14 };
  const CENTER = ['d4', 'e4', 'd5', 'e5'];
  const EXT = ['c6', 'c5', 'c4', 'c3', 'd3', 'e3', 'f3', 'f4', 'f5', 'f6', 'e6', 'd6'];
  const lightOrder = [], darkOrder = [];
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) (isLight(f, r) ? lightOrder : darkOrder).push([f, r]);

  const CAPS = [
    { a: 3.7, b: 9.3, text: 'Satranç tahtası, birbirini takip eden *açık* ve *koyu* renkli karelerden oluşan, *kare biçiminde* bir oyun alanıdır.' },
    { a: 24.2, b: 28.0, text: 'Her karenin kendine özgü bir *koordinatı* vardır.' },
    { a: 28.0, b: 31.6, text: 'Sütunlar *harflerle* (a–h), satırlar *sayılarla* (1–8) adlandırılır.' },
    { a: 31.6, b: 35.6, text: 'Kare adı = *sütun harfi* + *satır numarası*' },
    { a: 35.6, b: 39.6, text: 'Örneğin *e* sütunu ile *4.* satırın kesiştiği kare: *e4*' },
    { a: 39.6, b: 42.0, text: 'Tahtadaki 64 karenin her birinin *kendi adı* vardır.' },
    { a: 42.3, b: 45.0, text: 'Oyuna başlamadan önce bilmen gereken *en önemli* ayrıntılardan biri:' },
    { a: 45.0, b: 48.4, text: 'Sağ alt köşedeki kare mutlaka *açık renkli* olmalıdır.' },
    { a: 51.2, b: 56.0, text: '*d4, e4, d5* ve *e5* kareleri *merkez* karelerdir.' },
    { a: 56.0, b: 61.6, text: 'Onları çevreleyen 12 kare ise *genişletilmiş merkez* kareleridir.', hl: C.caramelText },
    { a: 61.8, b: 66.0, text: '*e, f, g* ve *h* sütunları *şah kanadı* olarak adlandırılır.' },
    { a: 66.0, b: 68.5, text: '*a, b, c* ve *d* sütunları ise *vezir kanadıdır.*', hl: C.caramelText },
    { a: 68.5, b: 70.5, text: 'Tahta ikiye ayrılır: ~vezir kanadı~ ve *şah kanadı*', hl2: C.caramelText },
    { a: 70.6, b: 72.9, text: 'Tahta bu kadar!', size: 92, sub: 'Artık satranç tahtasını tanıyorsun.' },
  ];
  // The chapter-1 card plays between the cover and the board: from CUT on, every layer except
  // the cover and this card runs on scene time (real time minus INS), so the rest keeps its timing.
  // HOLDS pause scene time at moments where a caption or heading is fully on screen and settled,
  // giving the viewer time to read: [scene time, seconds].
  const CUT = 3.0, INS = 4.8;
  const HOLDS = [[8.85, 4.0], [20.85, 2.3], [22.6, 1.5], [27.55, 1.5], [31.15, 1.5], [35.15, 1.5], [38.9, 2.0], [41.5, 3.0],
    [44.55, 3.5], [47.9, 2.0], [49.8, 1.5], [55.5, 1.0], [65.5, 2.5], [68.0, 3.5], [70.0, 3.5], [72.4, 1.0]];
  const sceneT = t => {
    if (t < CUT) return t;
    let x = t - INS;
    for (const [at, dur] of HOLDS) {
      if (x <= at) break;
      if (x < at + dur) return at;
      x -= dur;
    }
    return Math.max(CUT, x);
  };
  const realT = x => x + INS + HOLDS.reduce((sum, [at, dur]) => (at < x ? sum + dur : sum), 0);
  const INTRO_CARD = { a: 3.3, b: 7.8, flipAt: 3.3, kicker: 'BÖLÜM 01', lines: ['TAHTANIN', 'YAPISI'] };
  const CARDS = [
    { a: 21.0, b: 24.1, kicker: 'BÖLÜM 02', lines: ['TAHTANIN', 'KONUMLANDIRILMASI'] },
    { a: 48.4, b: 51.1, kicker: 'BÖLÜM 03', lines: ['TAHTANIN', 'BÖLGELERİ'] },
  ];

  // ------------------------------------------------------------------ background
  function background(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.bg1); g.addColorStop(0.55, C.bg0); g.addColorStop(1, C.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // faint drifting checker pattern; drifts exactly two tiles per loop so the video loops seamlessly
    const tile = 150, drift = (t / D) * tile * 2;
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(-0.21);
    ctx.fillStyle = 'rgba(255,230,190,0.03)';
    for (let i = -10; i < 10; i++) for (let j = -12; j < 12; j++) {
      if ((i + j) & 1) continue;
      ctx.fillRect(i * tile + drift % (tile * 2) - tile * 2, j * tile + drift % (tile * 2) - tile * 2, tile, tile);
    }
    ctx.restore();
    const rg = ctx.createRadialGradient(W / 2, 980, 60, W / 2, 980, 900);
    rg.addColorStop(0, 'rgba(229,190,110,0.10)'); rg.addColorStop(1, 'rgba(229,190,110,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  function vignette() {
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,4,0.38)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  // ------------------------------------------------------------------ cover (loop point)
  // Drawn in the chapter-card style. Fully shown at t = 0 and leaves by COVER.b; re-enters over the
  // last second and lands exactly at t = D (= 0), so the video loops seamlessly.
  const COVER = { a: -1.6, b: 3.6, holdOut: true, tilesUntil: INTRO_CARD.flipAt, soft: true, kicker: '', lines: ['SATRANÇ', 'TAHTASI'] };
  function title(t) {
    if (t < T.titleIn) card(t, COVER);
    else card(t - D, COVER);
  }

  // ------------------------------------------------------------------ board
  function boardScale(t) {
    // the board recedes slightly while a chapter card is up
    let k = 0;
    for (const c of CARDS) k = Math.max(k, win(t, c.a, c.b, 0.4, 0.45));
    return 1 - 0.07 * eIO(k);
  }
  function sqPresence(t, f, r) {
    const pin = eBack(seg(t, T.build + (f + (7 - r)) * 0.06, T.build + (f + (7 - r)) * 0.06 + 0.38));
    const po = eIn(seg(t, T.boardOut + ((7 - f) + r) * 0.04, T.boardOut + ((7 - f) + r) * 0.04 + 0.36));
    return pin * (1 - po);
  }

  function board(t) {
    if (t < T.frameIn || t > T.boardOut + 1.1) return;
    const bs = boardScale(t);
    ctx.save();
    ctx.translate(W / 2, BY + 4 * BS); ctx.scale(bs, bs); ctx.translate(-W / 2, -(BY + 4 * BS));

    // frame
    const fin = eOut(seg(t, T.frameIn, T.frameIn + 0.5)) * (1 - eIn(seg(t, T.boardOut + 0.5, T.boardOut + 1.0)));
    if (fin > 0) {
      ctx.save();
      ctx.globalAlpha = fin;
      ctx.translate(W / 2, BY + 4 * BS); ctx.scale(0.9 + 0.1 * fin, 0.9 + 0.1 * fin); ctx.translate(-W / 2, -(BY + 4 * BS));
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
      rrect(BX - 18, BY - 18, 8 * BS + 36, 8 * BS + 36, 20); ctx.fillStyle = C.frame; ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(229,190,110,0.35)'; ctx.lineWidth = 2;
      rrect(BX - 9, BY - 9, 8 * BS + 18, 8 * BS + 18, 12); ctx.stroke();
      ctx.restore();
    }

    // squares
    const ld = lightDark(t);
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      const p = sqPresence(t, f, r);
      if (p <= 0.001) continue;
      const light = isLight(f, r);
      let lift = 0, dim = 0;
      if (ld) {
        const mine = light ? ld.light[f + r * 8] : ld.dark[f + r * 8];
        lift = mine; dim = (light ? ld.dimLight : ld.dimDark);
      }
      const x = sqX(f), y = sqY(r);
      ctx.save();
      ctx.translate(x + BS / 2, y + BS / 2 - lift * 8);
      ctx.scale(p * (1 + lift * 0.06), p * (1 + lift * 0.06));
      ctx.globalAlpha = clamp(p);
      if (lift > 0.01) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18 * lift; ctx.shadowOffsetY = 10 * lift; }
      ctx.fillStyle = light ? C.light : C.dark;
      ctx.fillRect(-BS / 2, -BS / 2, BS, BS);
      ctx.shadowColor = 'transparent';
      if (dim > 0) { ctx.fillStyle = `rgba(31,19,11,${0.62 * dim})`; ctx.fillRect(-BS / 2, -BS / 2, BS, BS); }
      ctx.restore();
    }

    countNumbers(t);
    rowsCols(t);
    regions(t);
    coordinates(t);
    rule(t);
    centers(t);
    ctx.restore();
  }

  // 32 light / 32 dark: each colour lifts in turn while the other dims
  function lightDark(t) {
    if (t < T.lights - 0.1 || t > 21.2) return null;
    const light = new Float32Array(64), dark = new Float32Array(64);
    const out = 1 - seg(t, 20.86, 21.1);
    lightOrder.forEach(([f, r], i) => { light[f + r * 8] = eOut(seg(t, T.lights + i * 0.04, T.lights + i * 0.04 + 0.25)) * (1 - seg(t, T.darks - 0.1, T.darks + 0.2)); });
    darkOrder.forEach(([f, r], i) => { dark[f + r * 8] = eOut(seg(t, T.darks + i * 0.035, T.darks + i * 0.035 + 0.25)) * out; });
    const dimDark = eIO(seg(t, T.lights, T.lights + 0.4)) * (1 - eIO(seg(t, T.darks - 0.1, T.darks + 0.3)));
    const dimLight = eIO(seg(t, T.darks - 0.1, T.darks + 0.3)) * out;
    return { light, dark, dimLight, dimDark };
  }

  function sqLabel(f, r, str, { a = 1, s = 1, size = 34, color, weight = 800 } = {}) {
    if (a <= 0) return;
    ctx.save();
    ctx.translate(cx(f), cy(r)); ctx.scale(s, s);
    text(str, 0, 2, { size, weight, alpha: a, color: color || (isLight(f, r) ? '#6b4a2c' : '#fbefdc') });
    ctx.restore();
  }
  function sqFill(f, r, color, a, inset = 0, radius = 0, glow = 0) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.fillStyle = color;
    if (radius) { rrect(sqX(f) + inset, sqY(r) + inset, BS - 2 * inset, BS - 2 * inset, radius); ctx.fill(); }
    else ctx.fillRect(sqX(f) + inset, sqY(r) + inset, BS - 2 * inset, BS - 2 * inset);
    ctx.restore();
  }
  function sqRing(f, r, color, a, width = 7, inset = 5, glow = 24) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.shadowColor = color; ctx.shadowBlur = glow;
    ctx.strokeStyle = color; ctx.lineWidth = width;
    rrect(sqX(f) + inset, sqY(r) + inset, BS - 2 * inset, BS - 2 * inset, 12); ctx.stroke();
    ctx.restore();
  }

  // 1…64 counted across the board, bottom row first
  function countNumbers(t) {
    const [a, b] = T.count;
    if (t < a || t > b + 1.0) return;
    const fade = 1 - seg(t, b + 0.4, b + 0.9);
    for (let i = 0; i < 64; i++) {
      const f = i % 8, r = Math.floor(i / 8);
      const ti = a + (i / 63) * (b - a);
      const p = seg(t, ti, ti + 0.18);
      if (p <= 0) continue;
      sqFill(f, r, C.gold, (1 - seg(t, ti, ti + 0.5)) * 0.75);
      sqLabel(f, r, String(i + 1), { a: p * fade, s: 0.6 + 0.4 * eBack(p), size: 36 });
    }
  }
  function countAt(t) { return clamp(Math.floor(((t - T.count[0]) / (T.count[1] - T.count[0])) * 63) + 1, 0, 64); }

  function rowsCols(t) {
    if (t > T.rows - 0.2 && t < T.cols + 3) {
      for (let r = 0; r < 8; r++) {
        const a = T.rows + r * STEP.rows;
        const k = win(t, a, a + 0.75, 0.1, 0.55);
        if (k <= 0) continue;
        ctx.save(); ctx.globalAlpha = k;
        ctx.fillStyle = rgba(C.gold, 0.85); ctx.fillRect(BX, sqY(r), 8 * BS, BS);
        ctx.strokeStyle = C.gold; ctx.lineWidth = 5; ctx.shadowColor = C.gold; ctx.shadowBlur = 20;
        ctx.strokeRect(BX + 2.5, sqY(r) + 2.5, 8 * BS - 5, BS - 5);
        ctx.restore();
      }
      for (let f = 0; f < 8; f++) {
        const a = T.cols + f * STEP.cols;
        const k = win(t, a, a + 0.75, 0.1, 0.55);
        if (k <= 0) continue;
        ctx.save(); ctx.globalAlpha = k;
        ctx.fillStyle = rgba(C.caramel, 0.85); ctx.fillRect(sqX(f), BY, BS, 8 * BS);
        ctx.strokeStyle = C.caramelText; ctx.lineWidth = 5; ctx.shadowColor = C.caramelText; ctx.shadowBlur = 20;
        ctx.strokeRect(sqX(f) + 2.5, BY + 2.5, BS - 5, 8 * BS - 5);
        ctx.restore();
      }
    }
  }
  const rowsAt = t => clamp(Math.floor((t - T.rows) / STEP.rows) + 1, 0, 8);
  const colsAt = t => clamp(Math.floor((t - T.cols) / STEP.cols) + 1, 0, 8);

  // ------------------------------------------------------------------ coordinates
  function axisEmph(t) {
    const files = new Float32Array(8), ranks = new Float32Array(8);
    for (let i = 0; i < 8; i++) {
      files[i] = Math.max(win(t, T.filesGlow + i * 0.12, T.filesGlow + 1.4 + i * 0.05, 0.2, 0.4) * 0.8);
      ranks[i] = win(t, T.ranksGlow + i * 0.12, T.ranksGlow + 1.4 + i * 0.05, 0.2, 0.4) * 0.8;
    }
    files[0] = Math.max(files[0], win(t, T.walk, T.walk + 3.5, 0.25, 0.4));
    files[4] = Math.max(files[4], win(t, T.colE, 39.5, 0.3, 0.4));
    ranks[3] = Math.max(ranks[3], win(t, T.row4, 39.5, 0.3, 0.4));
    for (let i = 0; i < 8; i++) ranks[i] = Math.max(ranks[i], win(t, T.walk + i * STEP.walk, T.walk + i * STEP.walk + 0.6, 0.12, 0.35));
    return { files, ranks };
  }
  function coordinates(t) {
    if (t < T.axisLetters) return;
    const fade = 1 - seg(t, T.boardOut - 0.3, T.boardOut + 0.2);
    const em = axisEmph(t);
    for (let i = 0; i < 8; i++) {
      const pl = eBack(seg(t, T.axisLetters + i * 0.09, T.axisLetters + i * 0.09 + 0.4));
      const e = em.files[i];
      ctx.save();
      ctx.translate(cx(i), BY + 8 * BS + 58 - (1 - pl) * 40);
      ctx.scale(1 + 0.35 * e, 1 + 0.35 * e);
      text(FILES[i], 0, 0, { size: 42, weight: 800, alpha: clamp(pl) * fade, color: e > 0.05 ? mix(C.white, C.gold, e) : C.white });
      ctx.restore();
      const pn = eBack(seg(t, T.axisNumbers + i * 0.09, T.axisNumbers + i * 0.09 + 0.4));
      const en = em.ranks[i];
      ctx.save();
      ctx.translate(BX - 52 + (1 - pn) * -40, cy(i));
      ctx.scale(1 + 0.35 * en, 1 + 0.35 * en);
      text(String(i + 1), 0, 0, { size: 42, weight: 800, alpha: clamp(pn) * fade, color: en > 0.05 ? mix(C.white, C.caramelText, en) : C.white });
      ctx.restore();
    }
    // files / ranks sweep glow on the board
    for (let i = 0; i < 8; i++) {
      const kf = win(t, T.filesGlow + i * 0.12, T.filesGlow + 1.4 + i * 0.05, 0.2, 0.4);
      if (kf > 0) { ctx.save(); ctx.globalAlpha = kf * 0.6; ctx.fillStyle = C.gold; ctx.fillRect(sqX(i), BY, BS, 8 * BS); ctx.restore(); }
      const kr = win(t, T.ranksGlow + i * 0.12, T.ranksGlow + 1.4 + i * 0.05, 0.2, 0.4);
      if (kr > 0) { ctx.save(); ctx.globalAlpha = kr * 0.6; ctx.fillStyle = C.caramel; ctx.fillRect(BX, sqY(i), 8 * BS, BS); ctx.restore(); }
    }
    // a1 → a8 walk
    if (t > T.walk - 0.1 && t < T.walk + 3.9) {
      const fadeW = 1 - seg(t, T.walk + 3.3, T.walk + 3.8);
      const pos = clamp((t - T.walk) / STEP.walk, 0, 7.0);
      for (let i = 0; i < 8; i++) {
        const p = seg(t, T.walk + i * STEP.walk, T.walk + i * STEP.walk + 0.2);
        if (p <= 0) continue;
        sqFill(0, i, C.gold, 0.22 * fadeW);
        sqLabel(0, i, name(0, i), { a: p * fadeW, s: 0.7 + 0.3 * eBack(p), size: 36 });
      }
      const i0 = Math.floor(pos), fr = eIO(pos - i0);
      const my = sqY(i0) - fr * BS * (i0 < 7 ? 1 : 0);
      ctx.save(); ctx.globalAlpha = seg(t, T.walk - 0.1, T.walk + 0.15) * fadeW;
      ctx.strokeStyle = C.gold; ctx.lineWidth = 7; ctx.shadowColor = C.gold; ctx.shadowBlur = 26;
      rrect(BX + 5, my + 5, BS - 10, BS - 10, 12); ctx.stroke(); ctx.restore();
    }
    // e4 = column e × row 4
    if (t > T.colE && t < 39.7) {
      const kc = win(t, T.colE, 39.5, 0.35, 0.4), kr = win(t, T.row4, 39.5, 0.35, 0.4);
      ctx.save();
      ctx.globalAlpha = kc; ctx.fillStyle = rgba(C.gold, 0.8); ctx.fillRect(sqX(4), BY, BS, 8 * BS * eOut(seg(t, T.colE, T.colE + 0.45)));
      ctx.globalAlpha = kr; ctx.fillStyle = rgba(C.caramel, 0.8); ctx.fillRect(BX, sqY(3), 8 * BS * eOut(seg(t, T.row4, T.row4 + 0.45)), BS);
      ctx.restore();
      const p = seg(t, T.e4, T.e4 + 0.4), out = 1 - seg(t, 39.1, 39.5);
      if (p > 0) {
        const pulse = 1 + 0.04 * Math.sin((t - T.e4) * 7);
        ctx.save(); ctx.translate(cx(4), cy(3)); ctx.scale(eBack(p) * pulse, eBack(p) * pulse); ctx.translate(-cx(4), -cy(3));
        sqFill(4, 3, C.white, out, -10, 16, 40);
        sqLabel(4, 3, 'e4', { a: out, size: 52, color: C.ink, weight: 900 });
        ctx.restore();
      }
    }
    // every square named, rippling out from a1
    if (t > T.ripple && t < 42.2) {
      const out = 1 - seg(t, 41.6, 42.1);
      for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
        const d = T.ripple + (f + r) * 0.05;
        const p = seg(t, d, d + 0.3);
        if (p <= 0) continue;
        sqFill(f, r, C.gold, (1 - seg(t, d, d + 0.6)) * 0.6);
        sqLabel(f, r, name(f, r), { a: p * out, s: 0.6 + 0.4 * eBack(p), size: 30, weight: 700 });
      }
    }
  }
  function mix(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = s => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  // ------------------------------------------------------------------ the h1 rule
  function rule(t) {
    if (t < T.spot - 0.1 || t > 48.8) return;
    const k = win(t, T.spot, 48.7, 0.45, 0.35);
    ctx.save();
    ctx.globalAlpha = k * 0.7; ctx.fillStyle = C.shade;
    ctx.beginPath(); ctx.rect(BX, BY, 8 * BS, 8 * BS); ctx.rect(sqX(7) + BS, sqY(0), -BS, BS); ctx.fill('evenodd');
    ctx.restore();
    const p = eBack(seg(t, T.spot + 0.25, T.spot + 0.7));
    const pulse = 0.5 + 0.5 * Math.sin((t - T.spot) * 6);
    ctx.save(); ctx.translate(cx(7), cy(0)); ctx.scale(p, p); ctx.translate(-cx(7), -cy(0));
    sqRing(7, 0, C.gold, k, 8, -6, 30 + 20 * pulse);
    sqLabel(7, 0, 'h1', { a: k, size: 40, weight: 900 });
    ctx.restore();
    // callout under the board with an arrow up to h1
    const pc = eOut(seg(t, T.spot + 0.6, T.spot + 1.0)) * k;
    if (pc > 0) {
      const y = BY + 8 * BS + 118, x2 = BX + 8 * BS;
      ctx.save(); ctx.globalAlpha = pc;
      font(800, 34); ctx.letterSpacing = '2px';
      const label = 'SAĞ ALT = AÇIK KARE';
      const w = ctx.measureText(label).width + 110;
      rrect(x2 - w, y - 36, w, 72, 36); ctx.fillStyle = C.light; ctx.fill();
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(x2 - w + 40, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x2 - w + 29, y + 1); ctx.lineTo(x2 - w + 37, y + 9); ctx.lineTo(x2 - w + 52, y - 8); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.ink;
      ctx.fillText(label, x2 - w + 76, y + 2);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------ centre and extended centre
  function centers(t) {
    if (t < T.center || t > 61.9) return;
    const out = 1 - seg(t, 61.3, 61.8);
    // with a single palette, emphasis comes from dimming the rest of the board
    const kd = win(t, T.center, 61.8, 0.4, 0.5);
    ctx.save(); ctx.globalAlpha = kd * 0.5; ctx.fillStyle = C.shade; ctx.fillRect(BX, BY, 8 * BS, 8 * BS); ctx.restore();
    EXT.forEach((n, i) => {
      const [f, r] = sq(n);
      const a = T.ext + i * STEP.ext, p = seg(t, a, a + 0.32);
      if (p <= 0) return;
      ctx.save(); ctx.translate(cx(f), cy(r)); ctx.scale(eBack(p), eBack(p)); ctx.translate(-cx(f), -cy(r));
      sqFill(f, r, C.caramel, out, 5, 12, 18);
      sqLabel(f, r, n, { a: out, size: 36, color: C.white, weight: 800 });
      ctx.restore();
    });
    CENTER.forEach((n, i) => {
      const [f, r] = sq(n);
      const a = T.center + i * STEP.center, p = seg(t, a, a + 0.35);
      if (p <= 0) return;
      ctx.save(); ctx.translate(cx(f), cy(r)); ctx.scale(eBack(p), eBack(p)); ctx.translate(-cx(f), -cy(r));
      sqFill(f, r, C.gold, out, 5, 12, 26);
      sqLabel(f, r, n, { a: out, size: 40, color: C.ink, weight: 900 });
      ctx.restore();
    });
    // outline around the 2×2 centre once all four are in
    const ko = seg(t, T.center + 1.1, T.center + 1.5) * out;
    if (ko > 0) {
      ctx.save(); ctx.globalAlpha = ko; ctx.strokeStyle = C.gold; ctx.lineWidth = 5; ctx.shadowColor = C.gold; ctx.shadowBlur = 24;
      rrect(sqX(3) - 6, sqY(4) - 6, 2 * BS + 12, 2 * BS + 12, 16); ctx.stroke(); ctx.restore();
    }
    const ke = seg(t, T.ext + 12 * STEP.ext, T.ext + 12 * STEP.ext + 0.4) * out;
    if (ke > 0) {
      ctx.save(); ctx.globalAlpha = ke; ctx.strokeStyle = C.caramelText; ctx.lineWidth = 5; ctx.shadowColor = C.caramelText; ctx.shadowBlur = 24;
      rrect(sqX(2) - 6, sqY(5) - 6, 4 * BS + 12, 4 * BS + 12, 18); ctx.stroke(); ctx.restore();
    }
  }

  // ------------------------------------------------------------------ king side / queen side
  function regions(t) {
    if (t < T.king || t > T.boardOut + 0.2) return;
    const out = 1 - seg(t, T.boardOut - 0.5, T.boardOut);
    side(t, T.king, 4, C.cream, C.ink, 'ŞAH KANADI', drawKing, out, +1);
    side(t, T.queen, 0, C.choc, C.cream, 'VEZİR KANADI', drawQueen, out, -1);
    const kd = seg(t, T.divider, T.divider + 0.6) * out;
    if (kd > 0) {
      const x = sqX(4), h = 8 * BS * eIO(kd);
      ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = 6; ctx.shadowColor = C.white; ctx.shadowBlur = 24; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, BY + 4 * BS - h / 2 - 14); ctx.lineTo(x, BY + 4 * BS + h / 2 + 14); ctx.stroke(); ctx.restore();
    }
  }
  function side(t, a, f0, color, fg, label, icon, out, dir) {
    const k = eIO(seg(t, a, a + 0.8));
    if (k <= 0) return;
    const x0 = sqX(f0), w = 4 * BS;
    ctx.save(); ctx.globalAlpha = out;
    ctx.beginPath();
    if (dir > 0) ctx.rect(x0 + w * (1 - k), BY, w * k, 8 * BS); else ctx.rect(x0, BY, w * k, 8 * BS);
    ctx.clip();
    ctx.fillStyle = rgba(color, 0.55); ctx.fillRect(x0, BY, w, 8 * BS);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 6; ctx.strokeRect(x0 + 3, BY + 3, w - 6, 8 * BS - 6);
    ctx.restore();
    const pi = eBack(seg(t, a + 0.6, a + 1.1)) * out;
    if (pi > 0) {
      ctx.save(); ctx.translate(x0 + w / 2, BY + 4 * BS + 10); ctx.scale(pi * 2.9, pi * 2.9);
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      icon(); ctx.restore();
      pill(label, x0 + w / 2, BY + BS * 0.55, { color, fg, size: 28, h: 56, spacing: 3, alpha: clamp(pi), scale: 0.8 + 0.2 * clamp(pi) });
    }
    for (let i = 0; i < 4; i++) {
      const p = seg(t, a + 1.0 + i * STEP.labels, a + 1.0 + i * STEP.labels + 0.3);
      if (p <= 0) continue;
      const f = f0 + i;
      ctx.save(); ctx.translate(cx(f), cy(0)); ctx.scale(eBack(p), eBack(p)); ctx.translate(-cx(f), -cy(0));
      sqFill(f, 0, color, out, 8, 12, 20);
      sqLabel(f, 0, name(f, 0), { a: out, size: 36, color: fg, weight: 900 });
      ctx.restore();
    }
  }
  // simple piece silhouettes drawn in a 100×100 box centred on the origin
  let pieceFill = C.white, pieceStroke = C.ink;
  function pieceStyle() { ctx.fillStyle = pieceFill; ctx.strokeStyle = pieceStroke; ctx.lineWidth = 4; ctx.lineJoin = 'round'; }
  function base() {
    ctx.beginPath(); ctx.roundRect(-34, 30, 68, 14, 5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-26, 22, 52, 10, 4); ctx.fill(); ctx.stroke();
  }
  function drawKing() {
    ctx.translate(0, -6); pieceStyle();
    ctx.beginPath();
    ctx.moveTo(-24, 22); ctx.bezierCurveTo(-26, 4, -38, -2, -36, -14); ctx.bezierCurveTo(-34, -30, -10, -30, 0, -14);
    ctx.bezierCurveTo(10, -30, 34, -30, 36, -14); ctx.bezierCurveTo(38, -2, 26, 4, 24, 22); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22, 8); ctx.quadraticCurveTo(0, 0, 22, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, -16); ctx.lineTo(-5, -30); ctx.lineTo(-12, -30); ctx.lineTo(-12, -38); ctx.lineTo(-5, -38); ctx.lineTo(-5, -46);
    ctx.lineTo(5, -46); ctx.lineTo(5, -38); ctx.lineTo(12, -38); ctx.lineTo(12, -30); ctx.lineTo(5, -30); ctx.lineTo(5, -16); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent';
    base();
  }
  function drawQueen() {
    ctx.translate(0, -4); pieceStyle();
    const tops = [[-38, -22], [-19, -32], [0, -38], [19, -32], [38, -22]];
    ctx.beginPath();
    ctx.moveTo(-26, 22); ctx.lineTo(tops[0][0], tops[0][1]);
    ctx.lineTo(-24, 0); ctx.lineTo(tops[1][0], tops[1][1]);
    ctx.lineTo(-8, -4); ctx.lineTo(tops[2][0], tops[2][1]);
    ctx.lineTo(8, -4); ctx.lineTo(tops[3][0], tops[3][1]);
    ctx.lineTo(24, 0); ctx.lineTo(tops[4][0], tops[4][1]);
    ctx.lineTo(26, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent';
    for (const [x, y] of tops) { ctx.beginPath(); ctx.arc(x, y - 4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-23, 10); ctx.quadraticCurveTo(0, 4, 23, 10); ctx.stroke();
    base();
  }

  // ------------------------------------------------------------------ captions / stats / cards
  function caption(t, c) {
    const k = win(t, c.a, c.b, 0.01, 0.35);
    if (k <= 0) return;
    const size = c.size || 54, hl = c.hl || C.gold, lh = size * 1.32, maxW = 930;
    font(800, size);
    const words = [];
    // *gold* (or c.hl) and ~second colour~ (c.hl2) highlight runs
    let on = 0;
    for (let w of c.text.split(' ')) {
      if (w[0] === '*' || w[0] === '~') { on = w[0] === '*' ? 1 : 2; w = w.slice(1); }
      const ends = /[*~]/.test(w);
      w = w.replace(/[*~]/g, '');
      words.push({ w, hl: on, width: ctx.measureText(w).width });
      if (ends) on = 0;
    }
    const space = ctx.measureText(' ').width;
    const lines = [[]]; let lw = 0;
    for (const wd of words) {
      if (lw + wd.width > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push(wd); lw += wd.width + space;
    }
    const subH = c.sub ? 80 : 0;
    const y0 = 400 - ((lines.length - 1) * lh + subH) / 2;
    const exit = seg(t, c.b - 0.35, c.b);
    let i = 0;
    lines.forEach((ln, li) => {
      const total = ln.reduce((s, wd) => s + wd.width, 0) + space * (ln.length - 1);
      let x = W / 2 - total / 2;
      for (const wd of ln) {
        const p = eOut(seg(t, c.a + i * 0.045, c.a + i * 0.045 + 0.35));
        const y = y0 + li * lh + (1 - p) * 26 - exit * 30;
        ctx.save();
        ctx.globalAlpha = p * (1 - exit);
        if (wd.hl) {
          const s = 1 + 0.12 * (1 - eBack(p));
          ctx.translate(x + wd.width / 2, y); ctx.scale(s, s); ctx.translate(-(x + wd.width / 2), -y);
        }
        font(800, size); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(25,14,6,0.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
        ctx.fillStyle = wd.hl === 2 ? c.hl2 : wd.hl ? hl : C.white;
        ctx.fillText(wd.w, x, y);
        ctx.restore();
        x += wd.width + space; i++;
      }
    });
    if (c.sub) {
      const p = eOut(seg(t, c.a + 0.5, c.a + 0.9));
      text(c.sub, W / 2, y0 + (lines.length - 1) * lh + 90 + (1 - p) * 20 - exit * 30, { size: 44, weight: 600, color: C.muted, alpha: p * (1 - exit) });
    }
  }

  function stat(t, a, b, num, label, { fo = 0.3, x = W / 2, color = C.gold, numSize = 200, pop = 0, swatch } = {}) {
    const k = win(t, a, b, 0.3, fo);
    if (k <= 0) return;
    const p = eBack(seg(t, a, a + 0.45));
    ctx.save(); ctx.globalAlpha = k;
    ctx.translate(x, 380); ctx.scale(p * (1 + pop * 0.08), p * (1 + pop * 0.08));
    font(900, numSize); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = rgba(color, 0.45); ctx.shadowBlur = 40;
    ctx.fillStyle = color; ctx.fillText(String(num), 0, 0);
    ctx.restore();
    const pl = eOut(seg(t, a + 0.2, a + 0.6));
    ctx.save(); ctx.globalAlpha = k * pl;
    font(800, 40); ctx.letterSpacing = '5px';
    const w = ctx.measureText(label).width;
    let lx = x - w / 2;
    if (swatch) {
      lx += 28;
      rrect(lx - 64, 498 - 18, 36, 36, 6); ctx.fillStyle = swatch; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.white;
    ctx.fillText(label, lx, 500 + (1 - pl) * 16);
    ctx.restore();
  }
  function stats(t) {
    const n64 = countAt(t);
    stat(t, 9.3, 12.0, n64, 'KARE', { pop: n64 === 64 ? 1 - seg(t, T.count[1], T.count[1] + 0.4) : 0 });
    stat(t, 12.0, 14.85, rowsAt(t), 'YATAY SIRA  (SATIR)');
    stat(t, 14.85, 17.7, colsAt(t), 'DİKEY SÜTUN', { color: C.caramelText });
    const nl = clamp(Math.floor((t - T.lights) / 0.04) + 1, 0, 32), nd = clamp(Math.floor((t - T.darks) / 0.035) + 1, 0, 32);
    stat(t, 17.7, 21.0, nl, 'AÇIK', { fo: 0.14, x: 300, color: C.light, numSize: 180, swatch: C.light });
    stat(t, 17.7, 21.0, nd, 'KOYU', { fo: 0.14, x: 780, color: '#C99A66', numSize: 180, swatch: C.dark });
    const kv = win(t, 17.9, 21.0, 0.4, 0.14);
    text('+', W / 2, 380, { size: 110, weight: 300, color: C.muted, alpha: kv });
  }

  // Main-heading transition: two pieces collide in the middle of the screen and board squares spread
  // out from the impact, each turning into place like a piece set down. Every other transition (a
  // heading leaving, the cover coming back at the end of the loop) is a soft fade.
  const TILE = 120, TCOLS = 9, TROWS = 16, TILE_IN = 0.45, WAVE = 0.75, FLIP = 0.4, SOFT = 0.8;
  const IMPACT_X = W / 2, IMPACT_Y = 960, TMAXR = Math.hypot(W / 2 + TILE, 960 + TILE);
  function tiles(t, c) {
    if (c.tilesUntil !== undefined && t >= c.tilesUntil) return;
    const fadeIn = c.soft ? eIO(seg(t, c.a, c.a + SOFT)) : 1;
    const fadeOut = c.holdOut ? 1 : 1 - eIO(seg(t, c.b - SOFT, c.b));
    ctx.save();
    ctx.globalAlpha = fadeIn * fadeOut;
    for (let i = 0; i < TCOLS; i++) for (let j = 0; j < TROWS; j++) {
      const x = i * TILE + TILE / 2, y = j * TILE + TILE / 2;
      const d = (Math.hypot(x - IMPACT_X, y - IMPACT_Y) / TMAXR) * WAVE;
      const base = (i + j) % 2 ? C.card : C.cardDark, inv = (i + j) % 2 ? C.cardDark : C.card;
      ctx.save();
      ctx.translate(x, y);
      if (c.soft) {
        ctx.fillStyle = base; ctx.fillRect(-TILE / 2 - 0.6, -TILE / 2 - 0.6, TILE + 1.2, TILE + 1.2);
      } else if (c.flipAt !== undefined) {
        // chained from the cover: the cover's squares flip over to the inverted pattern
        const fp = seg(t, c.flipAt + d, c.flipAt + d + FLIP * 1.3);
        ctx.fillStyle = '#3c2617'; ctx.fillRect(-TILE / 2 - 0.6, -TILE / 2 - 0.6, TILE + 1.2, TILE + 1.2);
        ctx.scale(Math.max(0.02, Math.abs(Math.cos(fp * Math.PI))), 1);
        ctx.fillStyle = fp < 0.5 ? base : inv; ctx.fillRect(-TILE / 2 - 0.6, -TILE / 2 - 0.6, TILE + 1.2, TILE + 1.2);
        if (fp > 0 && fp < 1) { ctx.strokeStyle = rgba(C.gold, 0.3); ctx.lineWidth = 3; ctx.strokeRect(-TILE / 2 + 2, -TILE / 2 + 2, TILE - 4, TILE - 4); }
      } else {
        const pin = eBack(seg(t, c.a + d, c.a + d + FLIP));
        if (pin > 0.001) {
          ctx.rotate((1 - clamp(pin)) * -Math.PI / 2);
          ctx.scale(pin, pin);
          ctx.fillStyle = base; ctx.fillRect(-TILE / 2 - 0.6, -TILE / 2 - 0.6, TILE + 1.2, TILE + 1.2);
          if (pin < 0.98) { ctx.strokeStyle = rgba(C.gold, 0.5 * (1 - clamp(pin))); ctx.lineWidth = 3; ctx.strokeRect(-TILE / 2 + 2, -TILE / 2 + 2, TILE - 4, TILE - 4); }
        }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // the two pieces that collide to open a main heading; impact at time tc
  const PIECE_S = 2.5;
  function collision(t, tc, flip) {
    if (t < tc - 1.0 || t > tc + 1.2) return;
    const left = flip ? drawQueen : drawKing, right = flip ? drawKing : drawQueen;
    const approach = eIn(seg(t, tc - 0.9, tc));
    const recoil = eOut(seg(t, tc, tc + 0.5));
    const fade = 1 - eIO(seg(t, tc + 0.4, tc + 0.85));
    const gap = 84 * PIECE_S;   // centres when the two bases touch
    const lx = -160 + (IMPACT_X - gap / 2 + 160) * approach - recoil * 70;
    const rx = W + 160 - (W + 160 - IMPACT_X - gap / 2) * approach + recoil * 70;
    const piece = (x, draw, dark, tilt) => {
      if (fade <= 0) return;
      ctx.save(); ctx.globalAlpha = fade;
      ctx.translate(x, IMPACT_Y); ctx.rotate(tilt * recoil); ctx.scale(PIECE_S * (1 - 0.15 * recoil), PIECE_S * (1 - 0.15 * recoil));
      ctx.shadowColor = 'rgba(20,10,4,0.55)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
      pieceFill = dark ? C.choc : C.white; pieceStroke = dark ? C.gold : C.ink;
      draw();
      ctx.restore();
    };
    piece(lx, left, flip, -0.35);
    piece(rx, right, !flip, 0.35);
    pieceFill = C.white; pieceStroke = C.ink;
    if (t < tc) return;
    const p = seg(t, tc, tc + 0.9);
    // flash
    const fl = Math.pow(1 - seg(t, tc, tc + 0.3), 2);
    if (fl > 0) {
      const g = ctx.createRadialGradient(IMPACT_X, IMPACT_Y, 10, IMPACT_X, IMPACT_Y, 420);
      g.addColorStop(0, rgba(C.white, 0.85 * fl)); g.addColorStop(0.35, rgba(C.gold, 0.45 * fl)); g.addColorStop(1, rgba(C.gold, 0));
      ctx.fillStyle = g; ctx.fillRect(0, IMPACT_Y - 420, W, 840);
    }
    // shock ring
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = C.gold; ctx.lineWidth = 12 * (1 - p) + 1;
    ctx.beginPath(); ctx.arc(IMPACT_X, IMPACT_Y, 30 + 650 * eOut(p), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    // shards: small board squares thrown out of the impact
    for (let i = 0; i < 18; i++) {
      const h = Math.sin(i * 12.9898 + tc * 78.233) * 43758.5453, rnd = h - Math.floor(h);
      const ang = (i / 18) * Math.PI * 2 + rnd * 0.5, sp = 520 + rnd * 520, dt = t - tc;
      const x = IMPACT_X + Math.cos(ang) * sp * dt, y = IMPACT_Y + Math.sin(ang) * sp * dt + 900 * dt * dt;
      const sz = 14 + rnd * 16;
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.translate(x, y); ctx.rotate(dt * (6 + rnd * 8) * (i % 2 ? 1 : -1));
      ctx.fillStyle = i % 3 === 0 ? C.gold : i % 3 === 1 ? C.light : C.dark;
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.restore();
    }
  }
  function shake(t, collisions) {
    let dx = 0, dy = 0;
    for (const tc of collisions) {
      const dt = t - tc;
      if (dt < 0 || dt > 0.4) continue;
      const amp = 18 * Math.exp(-dt / 0.09);
      dx += amp * Math.sin(dt * 95); dy += amp * 0.6 * Math.cos(dt * 73);
    }
    return [dx, dy];
  }
  // real-time instants of every collision: chapter 1 (off the cover) and the chapter cards
  const collisions = () => [INTRO_CARD.flipAt, ...CARDS.map(c => realT(c.a))];

  function card(t, c) {
    if (t < c.a || t > c.b) return;
    tiles(t, c);
    // text leaves before the squares clear; a chained card keeps its squares, so its text can stay longer
    const lead = c.holdOut ? 1.25 : 1.0;   // the cover clears before the pieces arrive
    const yC = 960;
    const reveal = (k, delay, y, h, draw) => {
      const pin = eOut(seg(t, c.a + TILE_IN + delay, c.a + TILE_IN + delay + 0.5));
      const po = eIn(seg(t, c.b - lead + delay * 0.3, c.b - lead + 0.3 + delay * 0.3));
      ctx.save(); ctx.beginPath(); ctx.rect(0, y - h / 2, W, h); ctx.clip();
      ctx.translate(0, (1 - pin) * h - po * h);
      draw(); ctx.restore();
    };
    reveal(0, 0.15, yC - 190, 70, () => text(c.kicker, W / 2, yC - 190, { size: 34, weight: 800, color: C.gold, spacing: 10 }));
    const s1 = fitSize(c.lines[1], 900, 150, 960);
    const s0 = Math.min(fitSize(c.lines[0], 900, 150, 960), s1 * 1.15);
    reveal(1, 0.25, yC - 70, s0 * 1.2, () => text(c.lines[0], W / 2, yC - 70, { size: s0, weight: 900 }));
    reveal(2, 0.35, yC + 70, s1 * 1.2, () => text(c.lines[1], W / 2, yC + 70, { size: s1, weight: 900, color: C.gold }));
  }

  // ------------------------------------------------------------------ frame
  function renderFrame(t) {
    t = ((t % D) + D) % D;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.letterSpacing = '0px'; ctx.filter = 'none';
    background(t);
    const cols = collisions();
    const [sx, sy] = shake(t, cols);
    ctx.save(); ctx.translate(sx, sy);
    const o = sceneT(t);
    board(o);
    for (const c of CAPS) caption(o, c);
    stats(o);
    for (const c of CARDS) card(o, c);
    card(t, INTRO_CARD);
    title(t);
    cols.forEach((tc, i) => collision(t, tc, i % 2 === 1));
    ctx.restore();
    vignette();
  }

  // ------------------------------------------------------------------ sound cues (same clock)
  // a short run of wooden taps that follows the square wave in and out
  function tileCues(a, add) {
    for (let k = 1; k < 7; k++) add(a + 0.05 + k * (WAVE / 6), 'tock', { pitch: 0.85 + k * 0.05, gain: 0.28 });
  }
  function buildCues() {
    const q = [];
    // cue times are written in scene time and shifted onto the real clock past the cut
    const put = (t, type, o) => q.push(Object.assign({ t: +t.toFixed(4), type }, o));
    const add = (t, type, o = {}) => put(t >= CUT ? realT(t) : t, type, o);
    for (const tc of collisions()) {
      put(tc - 0.8, 'swish', { gain: 0.45, dur: 0.8 });
      put(tc, 'tock', { pitch: 0.55, gain: 0.6, soft: 1 }); put(tc + 0.012, 'hit', { gain: 0.6 }); put(tc + 0.02, 'shimmer', { gain: 0.25 });
      tileCues(tc, put);
    }
    put(INTRO_CARD.b - SOFT, 'whoosh', { gain: 0.35, dur: 0.6, rev: 1 });
    put(COVER.a + D, 'whoosh', { gain: 0.4, dur: 0.8 });
    add(0.07, 'shimmer', { gain: 0.35 });
    add(T.frameIn, 'thud', { gain: 0.6 });
    for (let k = 0; k <= 14; k++) add(T.build + k * 0.06 + 0.05, 'tock', { pitch: 1 + k * 0.035, gain: 0.55 });
    for (const c of CAPS) add(c.a, 'blip', { gain: 0.22 });
    for (let i = 0; i < 64; i += 2) add(T.count[0] + (i / 63) * (T.count[1] - T.count[0]), 'tick', { pitch: 1 + i / 64, gain: 0.35 });
    add(T.count[1] + 0.03, 'ding', { note: 'A5', gain: 0.55 });
    const pent = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6'];
    for (let r = 0; r < 8; r++) { add(T.rows + r * STEP.rows, 'swish', { gain: 0.35, dur: 0.3 }); add(T.rows + r * STEP.rows + 0.02, 'pluck', { note: pent[r], gain: 0.4 }); }
    for (let f = 0; f < 8; f++) { add(T.cols + f * STEP.cols, 'swish', { gain: 0.35, dur: 0.3 }); add(T.cols + f * STEP.cols + 0.02, 'pluck', { note: pent[f], gain: 0.4 }); }
    for (let i = 0; i < 32; i += 2) add(T.lights + i * 0.04, 'pop', { pitch: 1.25 + i * 0.012, gain: 0.32 });
    add(T.lights + 1.35, 'ding', { note: 'D6', gain: 0.45 });
    for (let i = 0; i < 32; i += 2) add(T.darks + i * 0.035, 'pop', { pitch: 0.8 + i * 0.01, gain: 0.32 });
    add(T.darks + 1.35, 'ding', { note: 'A5', gain: 0.45 });
    for (const c of CARDS) add(c.b - SOFT, 'whoosh', { gain: 0.35, dur: 0.6, rev: 1 });
    for (let i = 0; i < 8; i++) add(T.axisLetters + i * 0.09 + 0.1, 'click', { pitch: 1 + i * 0.05, gain: 0.45 });
    for (let i = 0; i < 8; i++) add(T.axisNumbers + i * 0.09 + 0.1, 'click', { pitch: 1.2 + i * 0.05, gain: 0.45 });
    add(T.filesGlow, 'sweep', { gain: 0.3, dur: 1.3 }); add(T.ranksGlow, 'sweep', { gain: 0.3, dur: 1.3 });
    for (let i = 0; i < 8; i++) add(T.walk + i * STEP.walk, 'tock', { pitch: 1.2 + i * 0.06, gain: 0.5 });
    add(T.colE, 'swish', { gain: 0.45, dur: 0.45 }); add(T.row4, 'swish', { gain: 0.45, dur: 0.45 });
    add(T.e4, 'ding', { note: 'E6', gain: 0.6 }); add(T.e4, 'pop', { pitch: 1.1, gain: 0.5 });
    add(T.ripple, 'shimmer', { gain: 0.45 });
    add(42.25, 'alert', { gain: 0.5 });
    add(T.spot, 'thud', { gain: 0.6 }); add(T.spot + 0.3, 'success', { gain: 0.55 });
    CENTER.forEach((_, i) => add(T.center + i * STEP.center, 'pop', { pitch: 1 + i * 0.12, gain: 0.5 }));
    add(T.center + 1.15, 'ding', { note: 'D6', gain: 0.45 });
    EXT.forEach((_, i) => add(T.ext + i * STEP.ext, 'pop', { pitch: 0.9 + i * 0.04, gain: 0.35 }));
    add(T.ext + 12 * STEP.ext + 0.05, 'ding', { note: 'A5', gain: 0.4 });
    for (const [a] of [[T.king], [T.queen]]) {
      add(a, 'sweep', { gain: 0.45, dur: 0.8 });
      add(a + 0.65, 'royal', { gain: 0.5, key: a === T.king ? 'D' : 'G' });
      for (let i = 0; i < 4; i++) add(a + 1.0 + i * STEP.labels, 'click', { pitch: 1 + i * 0.08, gain: 0.45 });
    }
    add(T.divider, 'swish', { gain: 0.5, dur: 0.6 });
    add(70.6, 'success', { gain: 0.55 });
    for (let k = 0; k <= 14; k++) add(T.boardOut + k * 0.04 + 0.1, 'tock', { pitch: 1.5 - k * 0.035, gain: 0.4 });
    return q.sort((a, b) => a.t - b.t);
  }

  window.init = canvas => { ctx = canvas.getContext('2d'); };
  window.renderFrame = renderFrame;
  window.buildCues = buildCues;
})();
