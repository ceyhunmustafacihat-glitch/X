// Draws one frame of the "to be" reel at time t (seconds) from window.SCRIPT.
// Everything is a pure function of t, so the preview and the frame renderer agree.
const S = window.SCRIPT;
const W = 1080, H = 1920;
const COL = {
  white: '#F7F5FF', muted: '#A9A5DA', dim: '#6E6A9E',
  am: '#FFA24C', is: '#33E3AE', are: '#FF66A8',
  y: '#FFD64D', r: '#FF5468', g: '#45E48F', m: '#A9A5DA', w: '#FFFFFF',
  card: 'rgba(255,255,255,0.075)', cardLine: 'rgba(255,255,255,0.13)'
};
const FONT = 'Montserrat';
const AREA = { top: 430, bottom: 1480 };   // keep clear of the Reels UI (top bar, caption, buttons)
const COLW = 880;                           // content column width
const GAP = 22;

let ctx;

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = {
  out: u => 1 - Math.pow(1 - clamp(u), 3),
  inOut: u => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; },
  back: u => { u = clamp(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }
};
const prog = (t, a, d) => clamp((t - a) / d);
const font = (size, weight = 700, italic = false) => `${italic ? 'italic ' : ''}${weight} ${size}px ${FONT}`;

function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function parseRich(s) {
  const out = [], re = /\{(\w+)\|([^}]*)\}/g;
  let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ t: s.slice(i, m.index) });
    out.push({ t: m[2], k: m[1] });
    i = re.lastIndex;
  }
  if (i < s.length) out.push({ t: s.slice(i) });
  return out;
}

const segFont = (seg, size, weight, italic) => font(size, seg.k ? Math.max(weight, 800) : weight, italic);
function richWidth(segs, size, weight, italic) {
  let w = 0;
  for (const s of segs) { ctx.font = segFont(s, size, weight, italic); w += ctx.measureText(s.t).width; }
  return w;
}
// Largest size <= size that keeps the line within maxW.
function fitSize(segs, size, weight, maxW, italic) {
  const w = richWidth(segs, size, weight, italic);
  return w > maxW ? Math.floor(size * maxW / w) : size;
}
function drawRich(segs, x, y, size, weight, base, align = 'center', italic = false) {
  const total = richWidth(segs, size, weight, italic);
  let cx = align === 'center' ? x - total / 2 : x;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  for (const s of segs) {
    ctx.font = segFont(s, size, weight, italic);
    ctx.fillStyle = s.k ? COL[s.k] : base;
    ctx.fillText(s.t, cx, y);
    cx += ctx.measureText(s.t).width;
  }
  return total;
}
// Greedy word wrap over rich segments; returns lines of segments.
function wrapRich(segs, size, weight, maxW) {
  const words = [];
  for (const s of segs) for (const part of s.t.split(/(\s+)/)) if (part) words.push({ t: part, k: s.k });
  const lines = [[]];
  let w = 0;
  for (const wd of words) {
    ctx.font = segFont(wd, size, weight);
    const ww = ctx.measureText(wd.t).width;
    const space = /^\s+$/.test(wd.t);
    if (!space && w + ww > maxW && lines[lines.length - 1].length) { lines.push([]); w = 0; }
    if (space && !lines[lines.length - 1].length) continue;
    lines[lines.length - 1].push(wd);
    w += ww;
  }
  return lines.map(l => { while (l.length && /^\s+$/.test(l[l.length - 1].t)) l.pop(); return l; });
}

function markBadge(x, y, kind, a, r = 30) {
  if (a <= 0) return;
  const s = ease.back(a);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha *= clamp(a * 2);
  ctx.fillStyle = kind === 'ok' ? COL.g : COL.r;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#140f33';
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'ok') { ctx.moveTo(-r * 0.42, 0); ctx.lineTo(-r * 0.1, r * 0.32); ctx.lineTo(r * 0.45, -r * 0.33); }
  else { const q = r * 0.34; ctx.moveTo(-q, -q); ctx.lineTo(q, q); ctx.moveTo(q, -q); ctx.lineTo(-q, q); }
  ctx.stroke();
  ctx.restore();
}

function card(x, y, w, h, accent) {
  rrect(x, y, w, h, 30);
  ctx.fillStyle = COL.card;
  ctx.fill();
  ctx.strokeStyle = accent || COL.cardLine;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ---------------------------------------------------------------- items
// Each item type: h(item) -> height, draw(item, x, y, w, a, lt) with a = appear progress.
const ITEM = {
  big: {
    h: () => 150,
    draw(it, x, y, w) {
      const segs = parseRich(it.text);
      drawRich(segs, x + w / 2, y + 75, fitSize(segs, 112, 800, w), 800, COL.white);
    }
  },
  label: {
    h: () => 54,
    draw(it, x, y, w) {
      ctx.font = font(32, 800);
      ctx.letterSpacing = '6px';
      ctx.fillStyle = COL[it.k] || COL.muted;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(it.text, x + w / 2, y + 27);
      ctx.letterSpacing = '0px';
    }
  },
  arrow: {
    h: () => 56,
    draw(it, x, y, w, a, lt) {
      const bob = Math.sin((lt - it.at) * 6) * 6;
      ctx.strokeStyle = COL.y; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const cx = x + w / 2, cy = y + 28 + bob;
      ctx.beginPath(); ctx.moveTo(cx - 22, cy - 10); ctx.lineTo(cx, cy + 12); ctx.lineTo(cx + 22, cy - 10); ctx.stroke();
    }
  },
  note: {
    lines(it, w) { return wrapRich(parseRich(it.text), 38, 600, w - 150); },
    h(it, w) { return this.lines(it, w).length * 52 + 52; },
    draw(it, x, y, w) {
      const lines = this.lines(it, w), h = this.h(it, w);
      rrect(x, y, w, h, 26);
      ctx.fillStyle = 'rgba(255,214,77,0.10)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,77,0.45)'; ctx.lineWidth = 2; ctx.stroke();
      // bulb-ish badge
      ctx.fillStyle = COL.y;
      ctx.beginPath(); ctx.arc(x + 62, y + h / 2, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1440'; ctx.font = font(38, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', x + 62, y + h / 2 + 2);
      lines.forEach((l, i) => drawRich(l, x + 112, y + 26 + 26 + i * 52, 38, 600, COL.white, 'left'));
    }
  },
  example: {
    h: it => (it.tr ? 172 : 124),
    draw(it, x, y, w, a, lt) {
      const h = this.h(it);
      const no = it.mark === 'no';
      card(x, y, w, h, no ? 'rgba(255,84,104,0.55)' : it.mark === 'ok' ? 'rgba(69,228,143,0.5)' : null);
      const inner = it.mark ? w - 150 : w - 60;
      const cx = it.mark ? x + 30 + inner / 2 : x + w / 2;
      const segs = parseRich(it.en);
      const size = fitSize(segs, 60, 800, inner);
      const ey = y + (it.tr ? 64 : h / 2);
      const tw = drawRich(segs, cx, ey, size, 800, no ? '#d9d5f5' : COL.white);
      if (no) {   // strike through
        const sp = ease.out(prog(lt, it.at + 0.25, 0.3));
        ctx.strokeStyle = COL.r; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - tw / 2 - 10, ey + 2); ctx.lineTo(cx - tw / 2 - 10 + (tw + 20) * sp, ey + 2); ctx.stroke();
      }
      if (it.tr) {
        const ts = parseRich(it.tr);
        drawRich(ts, cx, y + 124, fitSize(ts, 38, 500, inner, true), 500, COL.muted, 'center', true);
      }
      if (it.mark) markBadge(x + w - 66, y + h / 2, it.mark, prog(lt, it.at + 0.25, 0.35));
    }
  },
  qa: {
    h: () => 226,
    draw(it, x, y, w, a, lt) {
      const h = 226;
      card(x, y, w, h, it.mark === 'ok' ? 'rgba(69,228,143,0.5)' : null);
      const inner = w - 150, cx = x + 30 + inner / 2;
      ctx.font = font(38, 600); ctx.fillStyle = COL.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('— ' + it.q, cx, y + 50);
      const segs = parseRich(it.en);
      drawRich(segs, cx, y + 118, fitSize(segs, 62, 800, inner), 800, COL.white);
      const ts = parseRich(it.tr);
      drawRich(ts, cx, y + 182, 36, 500, COL.muted, 'center', true);
      if (it.mark) markBadge(x + w - 66, y + h / 2, it.mark, prog(lt, it.at + 0.3, 0.35));
    }
  },
  cols: {
    h: () => 44,
    draw(it, x, y, w) {
      ctx.font = font(28, 800); ctx.letterSpacing = '5px'; ctx.fillStyle = COL.dim;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const xs = [x + w * 0.19, x + w * 0.46, x + w * 0.77];
      it.cols.forEach((c, i) => ctx.fillText(c, xs[i], y + 22));
      ctx.letterSpacing = '0px';
    }
  },
  conj: {
    h: it => it.subj.length * 62 + 44,
    draw(it, x, y, w, a, lt) {
      const h = this.h(it), c = COL[it.verb];
      card(x, y, w, h);
      // colour strip
      rrect(x, y, 12, h, 6); ctx.fillStyle = c; ctx.fill();
      const xs = [x + w * 0.19, x + w * 0.46, x + w * 0.77];
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      it.subj.forEach((s, i) => {
        const yy = y + 22 + 31 + i * 62;
        ctx.font = font(52, 700); ctx.fillStyle = COL.white; ctx.fillText(s, xs[0], yy);
        const sh = it.short[i], ap = sh.indexOf("'");
        // short form: subject part white, contraction coloured
        const p1 = sh.slice(0, ap), p2 = sh.slice(ap);
        ctx.font = font(48, 700); const w1 = ctx.measureText(p1).width;
        ctx.font = font(48, 800); const w2 = ctx.measureText(p2).width;
        const sa = ease.out(prog(lt, it.at + 0.35 + i * 0.12, 0.35));
        ctx.save(); ctx.globalAlpha *= sa;
        ctx.textAlign = 'left';
        ctx.font = font(48, 700); ctx.fillStyle = COL.white; ctx.fillText(p1, xs[2] - (w1 + w2) / 2, yy);
        ctx.font = font(48, 800); ctx.fillStyle = c; ctx.fillText(p2, xs[2] - (w1 + w2) / 2 + w1, yy);
        ctx.restore();
      });
      // verb chip
      ctx.font = font(54, 800);
      const vw = ctx.measureText(it.verb).width + 56;
      rrect(xs[1] - vw / 2, y + h / 2 - 40, vw, 80, 40);
      ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 26; ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#16113a'; ctx.textAlign = 'center';
      ctx.fillText(it.verb, xs[1], y + h / 2 + 2);
    }
  },
  contract: {
    h: () => 118,
    draw(it, x, y, w, a, lt) {
      const h = 118;
      card(x, y, w, h, it.mark === 'ok' ? 'rgba(69,228,143,0.5)' : null);
      const c = COL[it.k];
      const mid = x + w * 0.5 - (it.mark ? 30 : 0);
      ctx.textBaseline = 'middle';
      ctx.font = font(50, 600); ctx.fillStyle = '#d9d5f5'; ctx.textAlign = 'right';
      ctx.fillText(it.a, mid - 60, y + h / 2);
      // arrow
      const ap = ease.out(prog(lt, it.at + 0.2, 0.3));
      ctx.strokeStyle = COL.y; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(mid - 28, y + h / 2); ctx.lineTo(mid - 28 + 56 * ap, y + h / 2); ctx.stroke();
      if (ap > 0.6) { ctx.beginPath(); ctx.moveTo(mid + 14, y + h / 2 - 14); ctx.lineTo(mid + 28, y + h / 2); ctx.lineTo(mid + 14, y + h / 2 + 14); ctx.stroke(); }
      const bp = ease.out(prog(lt, it.at + 0.35, 0.35));
      ctx.save(); ctx.globalAlpha *= bp;
      ctx.font = font(56, 800); ctx.fillStyle = c; ctx.textAlign = 'left';
      ctx.fillText(it.b, mid + 60 + (1 - bp) * -20, y + h / 2);
      ctx.restore();
      if (it.mark) markBadge(x + w - 66, y + h / 2, it.mark, prog(lt, it.at + 0.5, 0.35));
    }
  },
  chips: {
    h: () => 112,
    layout(it, w) {
      const parts = it.parts.map(p => parseRich(p));
      let size = 46;
      const widths = () => parts.map(p => richWidth(p, size, 700) + 64);
      let ws = widths(), plus = 64;
      let total = ws.reduce((s, v) => s + v, 0) + plus * (parts.length - 1);
      if (total > w) { size = Math.floor(size * w / total); ws = widths(); plus = 56; total = ws.reduce((s, v) => s + v, 0) + plus * (parts.length - 1); }
      return { parts, size, ws, plus, total };
    },
    draw(it, x, y, w, a, lt) {
      const L = this.layout(it, w);
      let cx = x + (w - L.total) / 2;
      L.parts.forEach((p, i) => {
        const ca = prog(lt, it.at + i * 0.18, 0.4);
        if (i > 0) {
          ctx.save(); ctx.globalAlpha *= clamp(ca * 2);
          ctx.font = font(50, 800); ctx.fillStyle = COL.y; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('+', cx + L.plus / 2, y + 56);
          ctx.restore();
          cx += L.plus;
        }
        const s = ease.back(ca);
        ctx.save();
        ctx.globalAlpha *= clamp(ca * 2);
        ctx.translate(cx + L.ws[i] / 2, y + 56); ctx.scale(s, s);
        const hasVerb = p.some(sg => sg.k && sg.k !== 'r');
        const neg = p.some(sg => sg.k === 'r');
        rrect(-L.ws[i] / 2, -46, L.ws[i], 92, 46);
        ctx.fillStyle = neg ? 'rgba(255,84,104,0.18)' : hasVerb ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
        ctx.fill();
        ctx.strokeStyle = neg ? COL.r : hasVerb ? COL.y : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.stroke();
        drawRich(p, 0, 2, L.size, 700, COL.white);
        ctx.restore();
        cx += L.ws[i];
      });
    }
  },
  swap: {
    h: () => 200,
    pos(tokens, key, size) {
      const order = tokens.map((tk, i) => ({ tk, i })).filter(o => o.tk[key] != null);
      if (key === 'b') order.sort((p, q) => p.tk.o - q.tk.o);
      const ws = order.map(o => { ctx.font = font(size, o.tk.k ? 800 : 700); return ctx.measureText(o.tk[key]).width; });
      ctx.font = font(size, 700); const sp = ctx.measureText(' ').width * 1.15;
      const total = ws.reduce((s, v) => s + v, 0) + sp * (ws.length - 1);
      const res = {};
      let cx = -total / 2;
      order.forEach((o, j) => { res[o.i] = cx + ws[j] / 2; cx += ws[j] + sp; });
      return res;
    },
    draw(it, x, y, w, a, lt) {
      card(x, y, w, 200, 'rgba(255,214,77,0.45)');
      const size = 70, cx = x + w / 2, ty = y + 78;
      const pa = this.pos(it.tokens, 'a', size), pb = this.pos(it.tokens, 'b', size);
      const m = ease.inOut(prog(lt, it.at + it.move, 0.85));
      it.tokens.forEach((tk, i) => {
        const has = { a: tk.a != null, b: tk.b != null };
        const xa = has.a ? pa[i] : pb[i], xb = has.b ? pb[i] : pa[i];
        const moved = has.a && has.b && tk.o < Object.keys(pa).indexOf(String(i));
        const px = cx + lerp(xa, xb, m);
        const py = ty - (moved ? Math.sin(Math.PI * m) * 78 : 0);
        let alpha = 1, scale = 1;
        if (!has.a) { alpha = m; scale = 0.6 + 0.4 * ease.back(m); }
        if (!has.b) alpha = 1 - m;
        const text = m < 0.5 ? (tk.a ?? tk.b) : (tk.b ?? tk.a);
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.translate(px, py); ctx.scale(scale, scale);
        ctx.font = font(size, tk.k ? 800 : 700);
        ctx.fillStyle = tk.k ? COL[tk.k] : COL.white;
        if (tk.k && m > 0 && m < 1) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 30 * Math.sin(Math.PI * m); }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, 0);
        ctx.restore();
      });
      // translation crossfades with the move
      ctx.font = font(38, 500, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save(); ctx.globalAlpha *= 1 - m; ctx.fillStyle = COL.muted; ctx.fillText(it.trA, cx, y + 158); ctx.restore();
      ctx.save(); ctx.globalAlpha *= m; ctx.fillStyle = COL.y; ctx.fillText(it.trB, cx, y + 158); ctx.restore();
    }
  },
  cta: {
    h: () => 120,
    draw(it, x, y, w, a, lt) {
      ctx.font = font(40, 800);
      const ws = it.items.map(s => ctx.measureText(s).width + 70);
      const gap = 24, total = ws.reduce((s, v) => s + v, 0) + gap * (ws.length - 1);
      let cx = x + (w - total) / 2;
      it.items.forEach((s, i) => {
        const p = prog(lt, it.at + i * 0.2, 0.45);
        const pulse = 1 + 0.04 * Math.sin((lt - it.at - i * 0.3) * 5) * clamp(lt - it.at - 1);
        ctx.save();
        ctx.globalAlpha *= clamp(p * 2);
        ctx.translate(cx + ws[i] / 2, y + 60);
        const sc = ease.back(p) * pulse; ctx.scale(sc, sc);
        const grad = ctx.createLinearGradient(-ws[i] / 2, 0, ws[i] / 2, 0);
        const cs = [[COL.am, COL.y], [COL.is, '#5BC8FF'], [COL.are, '#B28CFF']][i % 3];
        grad.addColorStop(0, cs[0]); grad.addColorStop(1, cs[1]);
        rrect(-ws[i] / 2, -44, ws[i], 88, 44);
        ctx.fillStyle = grad; ctx.shadowColor = cs[0]; ctx.shadowBlur = 28; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#16113a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = font(40, 800); ctx.fillText(s, 0, 2);
        ctx.restore();
        cx += ws[i] + gap;
      });
    }
  }
};

// ---------------------------------------------------------------- layout
// Pages are laid out once: positions never shift while items appear.
function prepare() {
  for (const sc of S.scenes) {
    if (sc.kind !== 'content') continue;
    sc.titleHold = sc.titleHold ?? 1.25;
    sc.layout = sc.pages.map((items, pi) => {
      const x = (W - COLW) / 2;
      const hs = items.map(it => ITEM[it.type].h(it, COLW));
      const gap = sc.gap ?? GAP;
      const total = hs.reduce((s, v) => s + v, 0) + gap * (items.length - 1);
      let y = AREA.top + Math.max(0, (AREA.bottom - AREA.top - total) / 2);
      if (total > AREA.bottom - AREA.top) console.warn('page overflows', sc.title, pi, total);
      const pos = items.map((it, i) => { const p = { x, y, h: hs[i] }; y += hs[i] + gap; return p; });
      const startAt = items[0].at;
      const next = sc.pages[pi + 1];
      const endAt = next ? next[0].at - 0.35 : Infinity;   // page fades out just before the next one arrives
      return { items, pos, startAt, endAt };
    });
  }
}

// ---------------------------------------------------------------- background
function background(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#120d36'); g.addColorStop(0.55, '#1a1150'); g.addColorStop(1, '#0b0826');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const blobs = [
    [COL.am, 0.18, 0.22, 0.07, 0.0, 520],
    [COL.is, 0.85, 0.48, 0.05, 2.0, 560],
    [COL.are, 0.25, 0.82, 0.06, 4.0, 600]
  ];
  ctx.globalCompositeOperation = 'lighter';
  for (const [c, bx, by, sp, ph, r] of blobs) {
    const px = W * (bx + 0.08 * Math.sin(t * sp * 2 + ph)), py = H * (by + 0.05 * Math.cos(t * sp * 1.6 + ph));
    const rg = ctx.createRadialGradient(px, py, 0, px, py, r);
    rg.addColorStop(0, c + '30'); rg.addColorStop(1, c + '00');
    ctx.fillStyle = rg; ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  // drifting dots
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let i = 0; i < 46; i++) {
    const sx = (i * 197.3) % W, sy = (i * 331.7 + t * (12 + (i % 5) * 6)) % (H + 40) - 20;
    const r = 1.5 + (i % 3);
    ctx.beginPath(); ctx.arc(sx, H - sy, r, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------------------------------------------------------- header
function sectionDots(n, y, alpha) {
  if (!n) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  for (let i = 1; i <= 6; i++) {
    const x = W / 2 + (i - 3.5) * 34;
    ctx.fillStyle = i === n ? COL.y : i < n ? 'rgba(255,214,77,0.45)' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    if (i === n) ctx.roundRect(x - 14, y - 6, 28, 12, 6); else ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function header(sc, lt) {
  const pill = sc.pill || `BÖLÜM ${sc.section}`;
  const enter = prog(lt, 0.05, 0.55);
  const m = ease.inOut(prog(lt, sc.titleHold, 0.6));          // centre -> top
  const titleY = lerp(900, 300, m), pillY = lerp(785, 212, m);
  const tsize = lerp(104, 64, m);
  ctx.save();
  // pill
  const pa = ease.back(enter);
  ctx.globalAlpha = clamp(enter * 2);
  ctx.font = font(lerp(40, 30, m), 800); ctx.letterSpacing = '4px';
  const pw = ctx.measureText(pill).width + lerp(60, 46, m), ph = lerp(70, 54, m);
  ctx.save(); ctx.translate(W / 2, pillY); ctx.scale(pa, pa);
  rrect(-pw / 2, -ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = COL.y; ctx.fill();
  ctx.fillStyle = '#16113a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(pill, 2, 2);
  ctx.restore();
  ctx.letterSpacing = '0px';
  // title: slides up, letters revealed by a moving mask
  const ta = ease.out(prog(lt, 0.2, 0.6));
  ctx.globalAlpha = ta;
  ctx.font = font(tsize, 800);
  let fs = tsize;
  const tw = ctx.measureText(sc.title).width;
  if (tw > 960) { fs = tsize * 960 / tw; ctx.font = font(fs, 800); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.white;
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 20;
  ctx.fillText(sc.title, W / 2, titleY + (1 - ta) * 40);
  ctx.shadowBlur = 0;
  // underline sweep
  const ul = ease.out(prog(lt, 0.45, 0.6));
  const uw = Math.min(tw * (fs / tsize), 960) * 0.35 * ul;
  ctx.strokeStyle = COL.y; ctx.lineWidth = lerp(8, 6, m); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(W / 2 - uw / 2, titleY + fs * 0.72); ctx.lineTo(W / 2 + uw / 2, titleY + fs * 0.72); ctx.stroke();
  ctx.restore();
  sectionDots(sc.section, 395, m);
}

// ---------------------------------------------------------------- scenes
function drawContent(sc, lt) {
  header(sc, lt);
  for (const pg of sc.layout) {
    if (lt < pg.startAt - 0.01) continue;
    const out = ease.inOut(prog(lt, pg.endAt - 0.4, 0.4));
    if (out >= 1) continue;
    pg.items.forEach((it, i) => {
      if (lt < it.at) return;
      const a = prog(lt, it.at, 0.45);
      const p = pg.pos[i];
      ctx.save();
      ctx.globalAlpha = clamp(a * 1.8) * (1 - out);
      const s = lerp(0.88, 1, ease.back(a));
      const cy = p.y + p.h / 2;
      ctx.translate(W / 2, cy + (1 - ease.out(a)) * 36 - out * 60);
      ctx.scale(s, s);
      ctx.translate(-W / 2, -cy);
      ITEM[it.type].draw(it, p.x, p.y, COLW, a, lt);
      ctx.restore();
    });
  }
}

function drawIntro(sc, lt) {
  const cx = W / 2;
  // tag
  const a0 = prog(lt, 0.15, 0.5);
  ctx.save(); ctx.globalAlpha = clamp(a0 * 2);
  ctx.font = font(36, 800); ctx.letterSpacing = '8px';
  ctx.fillStyle = COL.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('İNGİLİZCE TEMELLERİ', cx + 4, 620 + (1 - ease.out(a0)) * 30);
  ctx.letterSpacing = '0px';
  ctx.restore();
  // TO BE slam
  const a1 = prog(lt, 0.55, 0.5);
  if (lt >= 0.55) {
    const s = lerp(2.2, 1, ease.out(a1)) * (1 + 0.012 * Math.sin(lt * 3));
    ctx.save();
    ctx.globalAlpha = clamp(a1 * 2.5);
    ctx.translate(cx, 820); ctx.scale(s, s);
    ctx.font = font(250, 900);
    const g = ctx.createLinearGradient(-330, -120, 330, 120);
    g.addColorStop(0, COL.am); g.addColorStop(0.5, COL.y); g.addColorStop(1, COL.are);
    ctx.fillStyle = g; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,160,90,0.45)'; ctx.shadowBlur = 50;
    ctx.fillText('TO BE', 0, 0);
    ctx.restore();
    // flash on impact
    const fl = 1 - prog(lt, 0.75, 0.4);
    if (fl > 0 && lt > 0.75) { ctx.fillStyle = `rgba(255,240,220,${0.25 * fl})`; ctx.fillRect(0, 0, W, H); }
  }
  // am · is · are chips
  ['am', 'is', 'are'].forEach((v, i) => {
    const p = prog(lt, 1.5 + i * 0.3, 0.45);
    if (p <= 0) return;
    const x = cx + (i - 1) * 250, y = 1040;
    ctx.save(); ctx.globalAlpha = clamp(p * 2);
    ctx.translate(x, y); const s = ease.back(p); ctx.scale(s, s);
    rrect(-100, -56, 200, 112, 56);
    ctx.fillStyle = COL[v]; ctx.shadowColor = COL[v]; ctx.shadowBlur = 34; ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#16113a'; ctx.font = font(66, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v, 0, 3);
    ctx.restore();
  });
  // subtitle lines
  const lines = [['6 bölümde tüm kurallar', 2.7, 44, 700, COL.white], ['Kaydet, sonra tekrar et!', 3.4, 36, 600, COL.y]];
  lines.forEach(([txt, at, size, wt, c], i) => {
    const p = prog(lt, at, 0.5);
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = p;
    ctx.font = font(size, wt); ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, cx, 1200 + i * 70 + (1 - ease.out(p)) * 24);
    ctx.restore();
  });
}

let prepared = false;
function init(canvas) {
  ctx = canvas.getContext('2d');
  if (!prepared) { prepare(); prepared = true; }
}

function renderFrame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  background(t);
  const sc = S.scenes.find(s => t >= s.start && t < s.end) || S.scenes[S.scenes.length - 1];
  const lt = t - sc.start;
  // scene exit: everything lifts and fades in the last 0.45 s
  const out = ease.inOut(prog(t, sc.end - 0.45, 0.45));
  ctx.save();
  ctx.globalAlpha = 1;
  if (sc.kind === 'intro') drawIntro(sc, lt); else drawContent(sc, lt);
  ctx.restore();
  if (out > 0) {
    // fade content into the background instead of to black
    ctx.save(); ctx.globalAlpha = out;
    background(t);
    ctx.restore();
  }
  // global fade in / out
  const fin = 1 - prog(t, 0, 0.35), fout = prog(t, S.duration - 0.6, 0.6);
  const k = Math.max(fin, fout);
  if (k > 0) { ctx.fillStyle = `rgba(0,0,0,${k})`; ctx.fillRect(0, 0, W, H); }
}
