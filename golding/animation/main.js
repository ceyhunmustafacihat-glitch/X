'use strict';
// Frame composer: picks the scene(s) for time t, cross-dissolves at the
// boundaries, lays the captions on top and multiplies the paper over it all.

const SCENES = {};   // id -> function(g, lt, scene, t), filled by scenes*.js
let MAIN = null;

function init(canvas) {
  MAIN = { c: canvas, g: canvas.getContext('2d') };
  if (!PAPER) buildPaper();
}

const XF = 0.32;   // half-length of a cross-dissolve between ordinary scenes (s)
const FLIP = 0.4;  // half-length of a page turn into or out of a chapter page (s)

function renderScene(sc, t) {
  const L = layer('sc_' + sc.id);
  const g = L.g;
  const lt = t - sc.start, dur = sc.end - sc.start;
  // gentle push-in, except on the cards that must match for the loop
  const still = sc.title || sc.id === 'title' || sc.id === 'end';
  const z = still ? 1 : 1 + 0.03 * (lt / dur);
  g.translate(540, 900); g.scale(z, z); g.translate(-540, -900);
  (sc.title ? chapterPage : SCENES[sc.id])(g, lt, sc, t);
  g.setTransform(1, 0, 0, 1, 0, 0);
  // a light green-and-gold grade ties the illustrated scenes to the palette
  if (!still) {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, rgb(C.goldL, 0.2)); gr.addColorStop(1, rgb(C.forest, 0.22));
    g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
  }
  return L.c;
}

// the earlier page turns over its left edge (the book's spine) and uncovers the next
function pageTurn(g, front, u) {
  const th = easeInOut(clamp(u)) * Math.PI / 2, c = Math.cos(th), sn = Math.sin(th);
  const w = W * c;
  // shadow the turning page throws on the page beneath
  const sg = g.createLinearGradient(w, 0, w + 220, 0);
  sg.addColorStop(0, `rgba(8,20,14,${0.45 * sn})`); sg.addColorStop(1, 'rgba(8,20,14,0)');
  g.fillStyle = sg; g.fillRect(w, 0, 220, H);
  if (w < 1) return;
  const N = 36, sw = W / N;
  for (let i = 0; i < N; i++) {
    const x0 = i * sw, k = x0 / W;
    const lift = 1 + 0.09 * sn * k;                   // the free edge comes toward us
    const dh = H * lift;
    g.drawImage(front, x0, 0, sw + 1, H, x0 * c, (H - dh) / 2, sw * c + 1.5, dh);
    g.fillStyle = `rgba(8,20,14,${0.38 * sn * (1 - k * 0.6)})`;
    g.fillRect(x0 * c, (H - dh) / 2, sw * c + 1.5, dh);
  }
  // a soft highlight along the curling edge
  const hg = g.createLinearGradient(w - 90, 0, w, 0);
  hg.addColorStop(0, 'rgba(255,248,225,0)'); hg.addColorStop(1, `rgba(255,248,225,${0.35 * sn})`);
  g.fillStyle = hg; g.fillRect(w - 90, 0, 90, H);
}

function renderFrame(t) {
  // lines are drawn once and held still: no per-frame jitter
  BOIL = 0;
  const g = MAIN.g;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = C.forest; g.fillRect(0, 0, W, H);

  const S = TL.scenes, n = S.length;
  let i = S.findIndex(s => t >= s.start && t < s.end);
  if (i < 0) i = n - 1;
  const cur = S[i];
  let A = null, B = null;
  if (i > 0 && t < cur.start + FLIP) { A = S[i - 1]; B = cur; }
  else if (i < n - 1 && t > cur.end - FLIP) { A = cur; B = S[i + 1]; }
  const shown = [cur];
  if (A && (A.title || B.title)) {
    const b = B.start;
    g.drawImage(renderScene(B, t), 0, 0);
    pageTurn(g, renderScene(A, t), inv(b - FLIP, b + FLIP, t));
    shown.splice(0, 1, A, B);
  } else if (A && Math.abs(t - B.start) < XF) {
    g.drawImage(renderScene(A, t), 0, 0);
    g.globalAlpha = ss(B.start - XF, B.start + XF, t);
    g.drawImage(renderScene(B, t), 0, 0); g.globalAlpha = 1;
    shown.splice(0, 1, A, B);
  } else g.drawImage(renderScene(cur, t), 0, 0);

  // captions (over the transition, never part of the scene's camera move)
  for (const sc of shown) {
    const lt = t - sc.start;
    for (const [c0, c1, str] of sc.caps) drawCaption(g, str, c0, c1, lt);
  }

  // paper texture + soft vignette; no fades at either end, so the film loops
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.7; g.drawImage(PAPER, 0, 0); g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.78);
  vg.addColorStop(0, 'rgba(8,24,16,0)'); vg.addColorStop(1, 'rgba(8,24,16,0.3)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
