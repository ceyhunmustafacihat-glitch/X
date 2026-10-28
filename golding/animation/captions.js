'use strict';
// On-screen writing: chapter chip, caption cards and the quote card.
// The film has no narration, so captions are short, large and paced for reading.

const CAP = { x: 500, top: 1262, maxW: 740, font: 600, size: 45, lh: 62 };

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
  alpha(g, 0.75, () => at(g, bx + 70, by + 2, 1, -0.12, () => ink(g, wrect(-40, -16, 80, 30, 0.8, 503), '#e9cf8a', 0)));
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
          if (sg.hi) { g.fillStyle = rgb(C.gold, 0.55); g.fill(wround(sx - 6, y - 6, sg.w + 12, 30, 10, 1, 510 + i * 3 + j)); }
          text(g, sg.s, sx, y + (1 - wa) * 10, segFont(sg.hi), sg.hi ? C.red : C.ink, 'left');
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
    alpha(g, la, () => text(g, ln, 540, 1080 + i * 100 + (1 - la) * 16, 'italic 600 92px "Cormorant Garamond"', C.cream));
  });
  const aa = ss(t0 + 1.8, t0 + 2.4, lt);
  alpha(g, aa, () => {
    wline(g, [[440, 1405], [640, 1405]], 3, C.gold, 530);
    text(g, 'William Golding', 540, 1465, '600 58px Caveat', C.gold);
  });
  g.restore();
}
