'use strict';
// On-screen writing: chapter chip, caption cards and the quote card.
// The film has no narration, so captions are short, large and paced for reading.

const CAP = { x: 540, top: 1262, maxW: 740, font: 600, size: 45, lh: 62 };

// words are runs of segments, so a highlighted stem keeps its suffix: *1911*'de
function tokens(str) {
  const words = [];
  let glue = false;
  str.split(/(\*[^*]+\*)/).forEach(part => {
    if (!part) return;
    const hi = part.startsWith('*');
    const body = part.replace(/\*/g, '');
    const pieces = body.split(/(\s+)/);
    pieces.forEach(pc => {
      if (!pc) return;
      if (/^\s+$/.test(pc)) { glue = false; return; }
      if (glue && words.length) words[words.length - 1].segs.push({ s: pc, hi });
      else words.push({ segs: [{ s: pc, hi }] });
      glue = true;
    });
  });
  return words;
}
const segFont = hi => `${hi ? 800 : CAP.font} ${CAP.size}px Montserrat`;

const _layoutCache = {};
function layoutCaption(g, str) {
  if (_layoutCache[str]) return _layoutCache[str];
  const words = tokens(str);
  g.font = segFont(false);
  const space = g.measureText(' ').width;
  const lines = [[]];
  let lw = 0;
  for (const wd of words) {
    wd.segs.forEach(sg => { g.font = segFont(sg.hi); sg.w = g.measureText(sg.s).width; });
    wd.width = wd.segs.reduce((a, sg) => a + sg.w, 0);
    if (lw > 0 && lw + space + wd.width > CAP.maxW) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(wd);
    lw += (lw > 0 ? space : 0) + wd.width;
  }
  const L = lines.map(ln => ({ words: ln, space, w: ln.reduce((a, wd, i) => a + wd.width + (i ? space : 0), 0) }));
  return (_layoutCache[str] = L);
}

function drawCaption(g, str, t0, t1, t) {
  if (t < t0 || t > t1 + 0.4) return;
  const a = ss(t0, t0 + 0.32, t) * (1 - ss(t1, t1 + 0.35, t));
  if (a <= 0.001) return;
  const L = layoutCaption(g, str);
  const boxW = Math.max(...L.map(l => l.w)) + 96, boxH = L.length * CAP.lh + 58;
  const bx = CAP.x - boxW / 2, by = CAP.top + (1 - easeOut(ss(t0, t0 + 0.4, t))) * 34;
  g.save();
  g.globalAlpha = a;
  // card: soft shadow, cream paper, ink border, a strip of tape
  g.fillStyle = 'rgba(42,33,29,0.22)';
  g.fill(wround(bx + 10, by + 12, boxW, boxH, 26, 1.2, 501));
  ink(g, wround(bx, by, boxW, boxH, 26, 1.2, 502), C.card, 4.5);
  alpha(g, 0.75, () => at(g, bx + 70, by + 2, 1, -0.12, () => ink(g, wrect(-40, -16, 80, 30, 0.8, 503), C.goldM, 0)));
  // words, each sliding up in turn
  let i = 0;
  L.forEach((ln, li) => {
    let x = CAP.x - ln.w / 2;
    const y = by + 29 + CAP.lh * (li + 0.5);
    ln.words.forEach((wd, k) => {
      if (k) x += ln.space;
      const wt = t0 + 0.12 + i * 0.035;
      const wa = ss(wt, wt + 0.22, t);
      if (wa > 0) {
        g.save();
        g.globalAlpha = a * wa;
        let sx = x;
        wd.segs.forEach((sg, j) => {
          if (sg.hi) { g.fillStyle = rgb(C.goldL, 0.85); g.fill(wround(sx - 6, y - 6, sg.w + 12, 30, 10, 1, 510 + i * 3 + j)); }
          text(g, sg.s, sx, y + (1 - wa) * 10, segFont(sg.hi), sg.hi ? C.forest : C.ink, 'left');
          sx += sg.w;
        });
        g.restore();
      }
      x += wd.width;
      i++;
    });
  });
  g.restore();
}

function drawChapter(g, label, lt) {
  if (!label) return;
  const s = pop(0.15, lt, 0.5);
  if (s <= 0) return;
  g.font = '800 30px Montserrat'; g.letterSpacing = '5px';
  const w = g.measureText(label.toLocaleUpperCase('tr')).width + 70;
  g.letterSpacing = '0px';
  at(g, 540, 250, s, 0, () => {
    g.fillStyle = 'rgba(42,33,29,0.25)'; g.fill(wround(-w / 2 + 6, -30, w, 60, 30, 1, 520));
    ink(g, wround(-w / 2, -36, w, 60, 30, 1, 521), C.mustard, 4.5);
    text(g, label.toLocaleUpperCase('tr'), 0, -5, '800 30px Montserrat', C.ink, 'center', 5);
  });
}

function drawQuote(g, q, lt, t) {
  const [t0, t1, str] = q;
  if (lt < t0 || lt > t1 + 0.5) return;
  const a = ss(t0, t0 + 0.6, lt) * (1 - ss(t1, t1 + 0.4, lt));
  g.save(); g.globalAlpha = a;
  const lines = str.split('|');
  lines.forEach((ln, i) => {
    const la = ss(t0 + 0.2 + i * 0.45, t0 + 0.75 + i * 0.45, lt);
    alpha(g, la, () => text(g, ln, 540, 1060 + i * 96 + (1 - la) * 16, 'italic 600 70px Montserrat', C.cream));
  });
  const aa = ss(t0 + 1.8, t0 + 2.4, lt);
  alpha(g, aa, () => {
    wline(g, [[470, 1390], [610, 1390]], 3, C.gold, 530);
    text(g, 'WILLIAM GOLDING', 540, 1440, '700 30px Montserrat', C.gold, 'center', 8);
  });
  g.restore();
}

// corporate wordmark used by the opening and closing cards
function fitFont(g, str, weight, size, spacing, maxW) {
  g.font = `${weight} ${size}px Montserrat`; g.letterSpacing = spacing + 'px';
  const w = g.measureText(str).width; g.letterSpacing = '0px';
  return w > maxW ? size * maxW / w : size;
}
function goldGrad(g, x0, y0, x1, y1) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, C.goldL); gr.addColorStop(0.6, C.goldM); gr.addColorStop(1, C.goldD);
  return gr;
}
function drawWordmark(g, y, nameA, yearsA, tagA) {
  const name = 'WILLIAM GOLDING';
  const sz = fitFont(g, name, 800, 84, 7, 900);
  if (nameA > 0) {
    // revealed left to right behind a sliding mask
    g.save(); g.beginPath(); g.rect(0, y - 70, 90 + easeOut(nameA) * 900, 140); g.clip();
    text(g, name, 540, y, `800 ${sz}px Montserrat`, goldGrad(g, 100, y - 50, 980, y + 50), 'center', 7);
    g.restore();
  }
  alpha(g, yearsA, () => {
    const yy = y + 92;
    g.strokeStyle = C.goldM; g.lineWidth = 3;
    g.beginPath(); g.moveTo(540 - 330 * yearsA, yy); g.lineTo(540 - 170, yy); g.moveTo(540 + 170, yy); g.lineTo(540 + 330 * yearsA, yy); g.stroke();
    text(g, '1911 – 1993', 540, yy + 2, '700 40px Montserrat', C.cream, 'center', 8);
  });
  alpha(g, tagA, () => text(g, 'NOBEL ÖDÜLLÜ İNGİLİZ YAZAR', 540, y + 170 + (1 - tagA) * 12, '600 28px Montserrat', rgb(C.cream, 0.85), 'center', 7));
}

// a fountain pen, nib at (x, y), body rising to the upper right
function fountainPen(g, x, y, rot = -0.85) {
  at(g, x, y, 1, rot, () => {
    g.fillStyle = 'rgba(5,15,10,0.35)';
    g.beginPath(); g.ellipse(170, 26, 150, 14, 0, 0, TAU); g.fill();
    const nib = new Path2D(); nib.moveTo(0, 0); nib.lineTo(48, -12); nib.lineTo(62, 0); nib.lineTo(48, 12); nib.closePath();
    g.fillStyle = goldGrad(g, 0, -12, 60, 12); g.fill(nib);
    g.strokeStyle = C.forestD; g.lineWidth = 2.5; g.stroke(nib);
    g.beginPath(); g.moveTo(6, 0); g.lineTo(40, 0); g.stroke();
    g.beginPath(); g.arc(40, 0, 3.5, 0, TAU); g.fillStyle = C.forestD; g.fill();
    g.fillStyle = '#10261a'; g.beginPath(); g.roundRect(60, -14, 34, 28, 6); g.fill();
    g.fillStyle = '#123322'; g.beginPath(); g.roundRect(92, -18, 230, 36, 16); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(100, -13, 210, 6);
    g.fillStyle = goldGrad(g, 120, -18, 140, 18); g.fillRect(118, -18, 14, 36); g.fillRect(286, -18, 8, 36);
    g.fillRect(150, -22, 110, 5);
  });
}
// a chapter page: one colour, and a fountain pen writes the title
function chapterPage(g, lt, sc) {
  g.fillStyle = C.forest; g.fillRect(0, 0, W, H);
  // the gutter of an open book on the left
  const sp = g.createLinearGradient(0, 0, 140, 0);
  sp.addColorStop(0, 'rgba(5,15,10,0.45)'); sp.addColorStop(1, 'rgba(5,15,10,0)');
  g.fillStyle = sp; g.fillRect(0, 0, 140, H);
  const lines = sc.title.split('|');
  const sz = Math.min(...lines.map(ln => fitFont(g, ln, 800, 112, 6, 900)));
  const lh = sz * 1.24, y0 = 900 - (lines.length - 1) * lh / 2;
  g.font = `800 ${sz}px Montserrat`; g.letterSpacing = '6px';
  const ws = lines.map(ln => g.measureText(ln).width);
  g.letterSpacing = '0px';
  const total = ws.reduce((a, b) => a + b, 0);
  const wr = clamp(inv(0.45, 1.35, lt)) * total;        // how much has been written
  let done = 0, pen = null;
  lines.forEach((ln, i) => {
    const y = y0 + i * lh, x0 = 540 - ws[i] / 2;
    const show = clamp(wr - done, 0, ws[i]);
    if (show > 0) {
      g.save(); g.beginPath(); g.rect(x0 - 10, y - sz, show + 10, sz * 2); g.clip();
      text(g, ln, 540, y, `800 ${sz}px Montserrat`, goldGrad(g, x0, y - sz / 2, x0 + ws[i], y + sz / 2), 'center', 6);
      g.restore();
      if (show < ws[i]) pen = [x0 + show, y + sz * 0.3 - Math.abs(Math.sin(show * 0.09)) * sz * 0.5];
    }
    done += ws[i];
  });
  // the pen comes in, writes, then lifts away to the upper right
  const first = [540 - ws[0] / 2, y0 + sz * 0.3];
  const last = [540 + ws[ws.length - 1] / 2, y0 + (lines.length - 1) * lh + sz * 0.3];
  if (lt < 0.45) pen = [lerp(1150, first[0], easeOut(inv(0.15, 0.45, lt))), lerp(1500, first[1], easeOut(inv(0.15, 0.45, lt)))];
  if (lt >= 1.35) { const k = easeIn(inv(1.4, 1.75, lt)); pen = [lerp(last[0], 1350, k), lerp(last[1], last[1] - 800, k)]; }
  if (pen && lt > 0.15) fountainPen(g, pen[0], pen[1]);
}
