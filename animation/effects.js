'use strict';
// Letters leaving the screen, the shapes they build, the lit neural network
// inside his head, and the quieter floating words of the final scene.

const FX = {};
const ALPHABET = 'abcçdefgğhıijklmnoöprsştuüvyz';
const WORD = 'İnşirah';

function initEffects() {
  const rnd = mulberry32(2024);
  const anchor = poseAt(14.6);
  const hc = headToWorld(anchor, 0.0, -0.15);
  FX.hc = hc;
  // ---- word letters: measure real glyph advances ----
  const m = makeCanvas(10, 10).getContext('2d');
  m.font = '700 56px Montserrat';   // same typeface as the post
  const total = m.measureText(WORD).width;
  let acc = -total / 2;
  FX.word = [...WORD].map((ch, k) => {
    const wch = m.measureText(ch).width;
    const o = { ch, dx: acc + wch / 2, k };
    acc += wch;
    return o;
  });
  FX.wordCenter = [hc[0] + 120, hc[1] - 330];

  // ---- shapes (world coords) ----
  const shapes = [];
  // 0: open book
  {
    const c = [hc[0] - 190, hc[1] - 300], pts = [], lines = [];
    const page = (sgn) => {
      const p = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8; p.push([c[0] + sgn * u * 120, c[1] + 46 - Math.sin(u * Math.PI) * 14 - u * 8]); }
      for (let i = 1; i <= 4; i++) p.push([c[0] + sgn * 120, c[1] + 38 - i * 21]);
      for (let i = 7; i >= 0; i--) { const u = i / 8; p.push([c[0] + sgn * u * 120, c[1] - 46 - Math.sin(u * Math.PI) * 14 + (1 - u) * 6]); }
      return p;
    };
    const L = page(-1), R = page(1);
    pts.push(...L, ...R);
    lines.push(L, R, [[c[0], c[1] - 40], [c[0], c[1] + 46]]);
    for (const sgn of [-1, 1]) for (let r = 0; r < 3; r++) {
      const ln = [[c[0] + sgn * 22, c[1] - 18 + r * 20], [c[0] + sgn * 98, c[1] - 22 + r * 20]];
      lines.push(ln); pts.push(ln[0], ln[1]);
    }
    shapes.push({ pts, lines, c, t: TL.shapes[0] });
  }
  // 1: constellation
  {
    const c = [hc[0] - 10, hc[1] - 560], stars = [[-150, 40], [-90, -20], [-20, 10], [50, -40], [120, -10], [150, 60], [70, 70]];
    const pts = [], lines = [];
    const S2 = stars.map(s => [c[0] + s[0], c[1] + s[1]]);
    for (const s of S2) for (let k = 0; k < 4; k++) pts.push([s[0] + (rnd() - 0.5) * 6, s[1] + (rnd() - 0.5) * 6]);
    lines.push(S2.slice(0, 6)); lines.push([S2[5], S2[6], S2[3]]);
    shapes.push({ pts, lines, c, stars: S2, t: TL.shapes[1] });
  }
  // 2: knowledge network
  {
    const c = [hc[0] + 300, hc[1] - 350], nodes = [[0, 0]];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3; nodes.push([Math.cos(a) * (80 + (i % 2) * 30), Math.sin(a) * (80 + (i % 2) * 30)]); }
    const N = nodes.map(n => [c[0] + n[0], c[1] + n[1]]);
    const pts = [], lines = [];
    for (const n of N) for (let k = 0; k < 3; k++) pts.push([n[0] + (rnd() - 0.5) * 5, n[1] + (rnd() - 0.5) * 5]);
    for (let i = 1; i < 9; i++) { lines.push([N[0], N[i]]); lines.push([N[i], N[i % 8 + 1]]); }
    shapes.push({ pts, lines, c, nodes: N, t: TL.shapes[2] });
  }
  // 3: thought balloon (cloud + trailing bubbles towards his head)
  {
    const c = [hc[0] + 250, hc[1] - 620], pts = [], lines = [];
    const lobes = [[-70, 10, 46], [-25, -28, 52], [35, -30, 48], [78, 8, 42], [30, 38, 44], [-30, 40, 42]];
    const outline = [];
    for (let i = 0; i < 72; i++) {
      const a = i / 72 * TAU; let best = 0;
      for (const [lx, ly, lr] of lobes) {
        const dx = Math.cos(a), dy = Math.sin(a), b = dx * lx + dy * ly, cc = lx * lx + ly * ly - lr * lr;
        const d = b + Math.sqrt(Math.max(0, b * b - cc)); if (d > best) best = d;
      }
      outline.push([c[0] + Math.cos(a) * best, c[1] + Math.sin(a) * best * 0.85]);
    }
    outline.push(outline[0]);
    lines.push(outline);
    for (let i = 0; i < outline.length - 1; i += 2) pts.push(outline[i]);
    const b0 = [hc[0] + 120, hc[1] - 210];
    for (let j = 0; j < 3; j++) {
      const u = (j + 1) / 4, r = 8 + j * 6;
      const bc = [lerp(b0[0], c[0] - 20, u), lerp(b0[1], c[1] + 60, u)];
      const ring = [];
      for (let i = 0; i <= 12; i++) ring.push([bc[0] + Math.cos(i / 12 * TAU) * r, bc[1] + Math.sin(i / 12 * TAU) * r]);
      lines.push(ring); pts.push(ring[0], ring[4], ring[8]);
    }
    shapes.push({ pts, lines, c, t: TL.shapes[3] });
  }
  FX.shapes = shapes;

  // ---- glyph particles assigned to shape points ----
  FX.parts = [];
  shapes.forEach((sh, si) => {
    sh.pts.forEach((pt, j) => {
      FX.parts.push({
        si, target: pt, ch: ALPHABET[(rnd() * ALPHABET.length) | 0],
        emit: 13.45 + rnd() * 1.2 + si * 0.12, arrive: sh.t + 0.25 + rnd() * 0.5,
        size: 13 + rnd() * 10, spin: (rnd() - 0.5) * 2, c1: [(rnd() - 0.5) * 520, -220 - rnd() * 380],
        c2: [(rnd() - 0.5) * 260, (rnd() - 0.5) * 260], intoHead: 16.75 + rnd() * 0.75, seed: rnd() * 100,
        dot: rnd() < 0.3
      });
    });
  });
  // ---- loose dust from the screen ----
  FX.dust = [];
  for (let i = 0; i < 160; i++) FX.dust.push({ t0: 12.3 + rnd() * 5.6, life: 1.4 + rnd() * 1.6, vx: (rnd() - 0.5) * 160, vy: -120 - rnd() * 220, s: rnd(), seed: rnd() * 50 });

  // ---- neural network inside the head (head-local units) ----
  const nodes = [];
  let guard = 0;
  while (nodes.length < 115 && guard++ < 20000) {
    const x = -0.36 + rnd() * 0.66, y = -0.52 + rnd() * 0.50;
    const ex = (x + 0.03) / 0.33, ey = (y + 0.25) / 0.255;
    if (ex * ex + ey * ey > 1) continue;
    if (x > 0.22 && y > -0.12) continue;
    if (nodes.some(n => Math.hypot(n[0] - x, n[1] - y) < 0.043)) continue;
    nodes.push([x, y]);
  }
  const edges = new Map();
  nodes.forEach((n, i) => {
    const d = nodes.map((m2, j) => [Math.hypot(m2[0] - n[0], m2[1] - n[1]), j]).filter(e => e[1] !== i).sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < 3; k++) { const j = d[k][1]; const key = i < j ? i + '-' + j : j + '-' + i; edges.set(key, [Math.min(i, j), Math.max(i, j), d[k][0]]); }
  });
  // activation: Dijkstra from the node nearest the forehead
  let start = 0, bd = 9;
  nodes.forEach((n, i) => { const d = Math.hypot(n[0] - 0.24, n[1] + 0.32); if (d < bd) { bd = d; start = i; } });
  const adj = nodes.map(() => []);
  for (const [a, b, l] of edges.values()) { adj[a].push([b, l]); adj[b].push([a, l]); }
  const dist = nodes.map(() => Infinity); dist[start] = 0;
  const done = new Set();
  for (let it = 0; it < nodes.length; it++) {
    let u = -1, best = Infinity;
    dist.forEach((d, i) => { if (!done.has(i) && d < best) { best = d; u = i; } });
    if (u < 0) break; done.add(u);
    for (const [v, l] of adj[u]) if (dist[u] + l < dist[v]) dist[v] = dist[u] + l;
  }
  const maxd = Math.max(...dist.filter(isFinite));
  FX.net = {
    nodes, edges: [...edges.values()],
    on: dist.map(d => 17.35 + (isFinite(d) ? d / maxd : 1) * 1.65 + rnd() * 0.08),
    // extra long-range "new connections" appearing late
    links: Array.from({ length: 22 }, () => { const a = (rnd() * nodes.length) | 0, b = (rnd() * nodes.length) | 0; return [a, b, 18.4 + rnd() * 0.9]; })
      .filter(([a, b]) => a !== b && Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]) > 0.18)
  };

  // ---- final scene: floating words, pages, thought bubbles ----
  FX.words = [
    ['merak', 25.25, 300, 930], ['tefekkür', 25.55, 690, 880], ['irfan', 25.85, 250, 1110],
    ['ufuk', 26.15, 760, 1060], ['sebat', 26.45, 330, 770], ['hezarfen', 26.75, 640, 720], ['azim', 27.05, 470, 640]
  ];
}

function bez(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
}

function drawGlyph(g, ch, x, y, size, alpha, rotA = 0, sans = false) {
  if (alpha <= 0.01) return;
  const spr = sans ? glyphSprite(ch, '700', 48, 'Montserrat, sans-serif') : glyphSprite(ch, '600', 48);
  const k = size / 48;
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); if (rotA) g.rotate(rotA);
  g.drawImage(spr, -spr.width * k / 2, -spr.height * k / 2, spr.width * k, spr.height * k);
  g.restore();
}

// world-space effects (camera transform already applied)
function drawWorldEffects(g, t, pose, S, L) {
  const ph = phoneWorld(pose);
  const entry = headToWorld(pose, 0.26, -0.3);
  g.save();
  g.globalCompositeOperation = 'lighter';

  // ---- dust rising from the phone screen ----
  if (t > 12.3 && t < 20) {
    for (const d of FX.dust) {
      const a = (t - d.t0) / d.life;
      if (a < 0 || a > 1) continue;
      const tt = t - d.t0;
      let x = ph[0] + d.vx * tt * 0.6 + Math.sin(tt * 2 + d.seed) * 14, y = ph[1] - 8 + d.vy * tt * 0.6;
      // drawn towards his head once the mind wakes up
      const pull = ss(16.8, 17.8, t);
      x = lerp(x, entry[0], pull * a); y = lerp(y, entry[1], pull * a);
      drawGlow(g, x, y, 3 + d.s * 6, '#ffd585', Math.sin(a * Math.PI) * (0.5 + d.s * 0.5) * (1 - ss(18.5, 19.4, t)));
    }
  }

  // ---- shapes: connecting lines ----
  if (t > 14.3 && t < 17.6) {
    for (const sh of FX.shapes) {
      const a = ss(sh.t + 0.35, sh.t + 0.95, t) * (1 - ss(16.75, 17.2, t));
      if (a <= 0.01) continue;
      g.lineWidth = 1.6; g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = rgb('#f3cf86', 0.55 * a);
      g.shadowColor = 'rgba(255,200,110,0.8)'; g.shadowBlur = 10;
      for (const ln of sh.lines) {
        const prog = ss(sh.t + 0.3, sh.t + 1.1, t);
        const n = Math.max(2, Math.ceil(ln.length * prog));
        g.beginPath(); g.moveTo(ln[0][0], ln[0][1]);
        for (let i = 1; i < n; i++) g.lineTo(ln[i][0], ln[i][1]);
        g.stroke();
      }
      g.shadowBlur = 0;
      if (sh.stars) for (const s of sh.stars) { drawGlow(g, s[0], s[1], 26, '#ffe2a0', a * 0.8); g.fillStyle = rgb('#fff6dc', a); drawStar(g, s[0], s[1], 7, 0.4); }
      if (sh.nodes) for (const n of sh.nodes) drawGlow(g, n[0], n[1], 18, '#ffd27a', a * 0.7);
    }
  }

  // ---- glyph particles ----
  if (t > 13.4 && t < 18.2) {
    for (const p of FX.parts) {
      if (t < p.emit) continue;
      const tt = t - p.emit;
      let x, y, size = p.size, alpha = 1, r = 0;
      if (t < p.arrive) {
        const u = smoother(clamp(tt / (p.arrive - p.emit)));
        const p0 = [ph[0] + (p.seed % 1 - 0.5) * 30, ph[1] - 10];
        const p1 = [p0[0] + p.c1[0], p0[1] + p.c1[1]];
        const p2 = [p.target[0] + p.c2[0], p.target[1] + p.c2[1]];
        [x, y] = bez(p0, p1, p2, p.target, u);
        size *= lerp(0.4, 1, Math.min(1, u * 3));
        alpha = Math.min(1, tt * 4);
        r = p.spin * (1 - u) * 3;
      } else {
        [x, y] = p.target;
        x += Math.sin(t * 1.3 + p.seed) * 2.5; y += Math.cos(t * 1.1 + p.seed) * 2.5;
      }
      if (t > p.intoHead) {
        const u = easeIn(clamp((t - p.intoHead) / 0.75));
        const c1 = [x, y - 80], c2 = [entry[0] + 40, entry[1] - 120];
        [x, y] = bez([x, y], c1, c2, entry, u);
        size *= 1 - u * 0.7; alpha *= 1 - ss(0.8, 1, u);
      }
      if (p.dot) drawGlow(g, x, y, size * 0.9, '#ffd98f', alpha * 0.9);
      else drawGlyph(g, p.ch, x, y, size * 1.5, alpha * 0.95, r);
    }
  }

  // ---- the word itself rises first ----
  if (t > 13.3 && t < 17.8) {
    for (const L2 of FX.word) {
      const e = 13.32 + L2.k * 0.09;
      if (t < e) continue;
      const slot = [FX.wordCenter[0] + L2.dx * 1.05, FX.wordCenter[1]];
      const u = smoother(clamp((t - e) / 0.95));
      const p0 = [ph[0], ph[1] - 10];
      let [x, y] = bez(p0, [p0[0] - 60 + L2.k * 20, p0[1] - 300], [slot[0] + (L2.k - 3) * 30, slot[1] + 160], slot, u);
      y += Math.sin(t * 1.6 + L2.k * 0.7) * 5 * u;
      let size = lerp(18, 56, u), alpha = Math.min(1, (t - e) * 5);
      // the word melts into the book's pages
      const j = ss(15.3, 16.0, t);
      if (j > 0) {
        const bp = FX.shapes[0].pts[(L2.k * 5) % FX.shapes[0].pts.length];
        x = lerp(x, bp[0], j); y = lerp(y, bp[1], j); size = lerp(size, 22, j);
      }
      if (t > 16.8) {
        const k2 = easeIn(clamp((t - 16.8 - L2.k * 0.05) / 0.7));
        [x, y] = bez([x, y], [x, y - 60], [entry[0] + 30, entry[1] - 100], entry, k2);
        alpha *= 1 - ss(0.85, 1, k2); size *= 1 - k2 * 0.6;
      }
      drawGlow(g, x, y, size * 1.4, '#ffcf73', alpha * 0.35);
      drawGlyph(g, L2.ch, x, y, size, alpha, 0, true);
    }
  }

  // ---- arrival glow at the forehead ----
  const arr = win(16.9, 17.4, 18.6, 19.3, t);
  if (arr > 0.01) drawGlow(g, entry[0], entry[1], 70, '#ffd27a', arr * 0.8);

  // ---- the burst of light ----
  const b = t - TL.burst;
  if (b > -0.3 && b < 1.4) {
    const hc = headToWorld(pose, 0.0, -0.2);
    const pre = ss(-0.3, 0, b);
    const fade = 1 - ss(0.05, 0.75, b);
    drawGlow(g, hc[0], hc[1], 200 + Math.max(0, b) * 1500, '#fff0c8', pre * fade * 1.0);
    drawGlow(g, hc[0], hc[1], 90, '#ffffff', pre * (1 - ss(0, 0.5, b)));
    if (b > 0) {
      const R = easeOut(clamp(b / 1.1)) * 1700;
      g.lineWidth = 18 * (1 - b / 1.4) + 2;
      g.strokeStyle = rgb('#ffd890', 0.28 * fade);
      g.beginPath(); g.arc(hc[0], hc[1], R, 0, TAU); g.stroke();
      const rnd = mulberry32(8);
      for (let i = 0; i < 70; i++) {
        const a = rnd() * TAU, sp = 500 + rnd() * 1100;
        drawGlow(g, hc[0] + Math.cos(a) * sp * easeOut(clamp(b / 1.2)), hc[1] + Math.sin(a) * sp * easeOut(clamp(b / 1.2)), 5 + rnd() * 8, '#ffe0a0', fade);
      }
    }
  }
  g.restore();

  // ---- final scene: words, pages and thought bubbles (normal blending, warm room) ----
  if (t > 25.0) drawLearningFloaters(g, t, pose);
}

function drawLearningFloaters(g, t, pose) {
  // words in elegant italic, drifting upward
  for (const [wd, t0, x, y] of FX.words) {
    const a = win(t0, t0 + 0.5, t0 + 1.8, t0 + 2.5, t);
    if (a <= 0.01) continue;
    const dy = (t - t0) * -26;
    g.save();
    g.globalAlpha = a * 0.9;
    g.font = 'italic 600 50px "Cormorant Garamond"'; g.textAlign = 'center';
    g.fillStyle = '#6e4312';
    g.shadowColor = 'rgba(255,236,190,0.95)'; g.shadowBlur = 14;
    g.fillText(wd, x, y + dy);
    g.restore();
  }
  // loose pages drifting
  const rnd = mulberry32(31);
  for (let i = 0; i < 5; i++) {
    const t0 = 25.2 + i * 0.45, a = win(t0, t0 + 0.5, t0 + 2.0, t0 + 2.6, t);
    const x0 = 120 + rnd() * 760, y0 = 420 + rnd() * 500, sp = rnd();
    if (a <= 0.01) continue;
    const tt = t - t0;
    g.save(); g.globalAlpha = a * 0.85;
    g.translate(x0 + Math.sin(tt * 0.9 + i) * 30, y0 - tt * 26);
    g.rotate(Math.sin(tt * 0.7 + i * 2) * 0.35);
    g.scale(Math.cos(tt * 1.2 + i) * 0.4 + 0.6, 1);
    g.fillStyle = '#f7efdc'; g.shadowColor = 'rgba(120,80,30,0.25)'; g.shadowBlur = 10;
    g.fillRect(-34, -44, 68, 88);
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(190,150,80,0.9)'; g.lineWidth = 1.5; g.strokeRect(-34, -44, 68, 88);
    g.strokeStyle = 'rgba(120,100,80,0.45)'; g.lineWidth = 1.5;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-24, -30 + k * 12); g.lineTo(18 - (k % 3) * 8, -30 + k * 12); g.stroke(); }
    g.restore();
  }
  // thought bubbles rising from his head with tiny symbols
  const hd = headToWorld(pose, 0.1, -0.55);
  const icons = ['star', 'moon', 'quill'];
  for (let i = 0; i < 3; i++) {
    const t0 = 25.4 + i * 0.6, a = win(t0, t0 + 0.4, t0 + 1.6, t0 + 2.2, t);
    if (a <= 0.01) continue;
    const tt = t - t0;
    const x = hd[0] + 60 + i * 50 + Math.sin(tt + i) * 14, y = hd[1] - 60 - tt * 90;
    const r = 26 + i * 4;
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(255,248,230,0.55)'; g.strokeStyle = 'rgba(176,128,52,0.9)'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#b8862f'; g.strokeStyle = '#b8862f';
    if (icons[i] === 'star') drawStar(g, x, y, r * 0.45, 0.42);
    else if (icons[i] === 'moon') { g.beginPath(); g.arc(x, y, r * 0.42, 0, TAU); g.arc(x + r * 0.18, y - r * 0.1, r * 0.36, 0, TAU, true); g.fill('evenodd'); }
    else { g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - r * 0.4, y + r * 0.4); g.quadraticCurveTo(x, y, x + r * 0.45, y - r * 0.45); g.stroke(); g.beginPath(); g.ellipse(x + r * 0.15, y - r * 0.15, r * 0.36, r * 0.12, -0.78, 0, TAU); g.stroke(); }
    g.restore();
  }
}

// inside the head (head-local units, called from drawCharacter)
function drawMind(g, t) {
  const sil = ss(17.15, 17.9, t) * (1 - ss(19.35, 19.9, t));
  if (sil <= 0.01) return;
  const N = FX.net;
  const hp = headPath(0);
  g.save();
  g.clip(hp);
  g.globalCompositeOperation = 'lighter';
  const glow = 1 + 0.45 * ss(18.9, 19.4, t);
  // edges grow from lit node to neighbour
  g.lineCap = 'round';
  for (const [a, b] of N.edges) {
    const ta = N.on[a], tb = N.on[b];
    const [i, j, t0, t1] = ta <= tb ? [a, b, ta, tb] : [b, a, tb, ta];
    if (t < t0) continue;
    const u = clamp((t - t0) / Math.max(0.12, t1 - t0));
    const p = N.nodes[i], q = N.nodes[j];
    const ex = lerp(p[0], q[0], u), ey = lerp(p[1], q[1], u);
    g.strokeStyle = rgb('#ffcf75', 0.55 * sil * Math.min(1, glow));
    g.lineWidth = 0.0045 * glow;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(ex, ey); g.stroke();
    // travelling pulse
    if (u >= 1) {
      const ph = ((t * 0.9 + (i * 0.37) % 1) % 1);
      drawGlowLocal2(g, lerp(p[0], q[0], ph), lerp(p[1], q[1], ph), 0.018, '#fff1c4', 0.7 * sil);
    }
  }
  for (const [a, b, t0] of N.links) {
    if (t < t0) continue;
    const u = easeOut(clamp((t - t0) / 0.5));
    const p = N.nodes[a], q = N.nodes[b];
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 - 0.06;
    g.strokeStyle = rgb('#ffe6ad', 0.4 * sil); g.lineWidth = 0.003 * glow;
    g.beginPath(); g.moveTo(p[0], p[1]);
    const steps = 12;
    for (let s = 1; s <= steps * u; s++) {
      const v = s / steps, w2 = 1 - v;
      g.lineTo(w2 * w2 * p[0] + 2 * w2 * v * mx + v * v * q[0], w2 * w2 * p[1] + 2 * w2 * v * my + v * v * q[1]);
    }
    g.stroke();
  }
  // nodes
  N.nodes.forEach((n, i) => {
    const on = N.on[i];
    if (t < on - 0.05) {
      g.fillStyle = rgb('#3a4a6a', 0.5 * sil);
      g.beginPath(); g.arc(n[0], n[1], 0.0045, 0, TAU); g.fill();
      return;
    }
    const k = ss(on - 0.05, on + 0.15, t);
    const flash = 1 + 1.5 * Math.exp(-(t - on) * 6);
    drawGlowLocal2(g, n[0], n[1], 0.022 * flash * glow, '#ffc860', 0.5 * k * sil);
    g.fillStyle = rgb('#fff4d6', k * sil);
    g.beginPath(); g.arc(n[0], n[1], 0.0055 * Math.min(1.6, glow), 0, TAU); g.fill();
  });
  g.restore();
  // the eye keeps its golden light even in silhouette
  g.save(); g.globalCompositeOperation = 'lighter';
  drawGlowLocal2(g, 0.305, -0.03, 0.05, '#ffd27a', 0.8 * sil);
  g.fillStyle = rgb('#fff1c8', 0.9 * sil); g.beginPath(); g.ellipse(0.306, -0.03, 0.006, 0.01, 0, 0, TAU); g.fill();
  g.restore();
}

function drawGlowLocal2(g, x, y, r, color, a) {
  if (a <= 0.005) return;
  const s = glowSprite(color);
  const a0 = g.globalAlpha; g.globalAlpha = a0 * Math.min(1, a);
  g.drawImage(s, x - r, y - r, r * 2, r * 2);
  g.globalAlpha = a0;
}
