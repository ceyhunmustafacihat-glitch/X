'use strict';
// Frame composer: picks the scene(s) for time t, cross-dissolves at the
// boundaries, lays the captions on top and multiplies the paper over it all.

const SCENES = {};   // id -> function(g, lt, scene, t), filled by scenes*.js
let MAIN = null;

function init(canvas) {
  MAIN = { c: canvas, g: canvas.getContext('2d') };
  if (!PAPER) buildPaper();
}

const XF = 0.32; // half-length of a scene cross-dissolve (s)

function renderScene(sc, t) {
  const L = layer('sc_' + sc.id);
  const g = L.g;
  const lt = t - sc.start, dur = sc.end - sc.start;
  // gentle push-in over the whole scene
  const z = sc.title ? 1 : 1 + 0.03 * (lt / dur);
  g.translate(540, 900); g.scale(z, z); g.translate(-540, -900);
  (sc.title ? chapterPage : SCENES[sc.id])(g, lt, sc, t);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return L.c;
}

function renderFrame(t) {
  // lines are drawn once and held still: no per-frame jitter
  BOIL = 0;
  const g = MAIN.g;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);

  const active = TL.scenes.filter(s => t >= s.start - XF && t < s.end + XF);
  active.forEach((sc, i) => {
    const c = renderScene(sc, t);
    // the later scene dissolves in over the earlier one
    g.globalAlpha = i === 0 ? 1 : ss(sc.start - XF, sc.start + XF, t);
    g.drawImage(c, 0, 0); g.globalAlpha = 1;
  });

  // captions (over the dissolve, never part of the scene's camera move)
  for (const sc of active) {
    const lt = t - sc.start;
    for (const [c0, c1, str] of sc.caps) drawCaption(g, str, c0, c1, lt);
  }

  // paper texture + soft vignette
  g.globalCompositeOperation = 'multiply';
  g.drawImage(PAPER, 0, 0);
  g.globalCompositeOperation = 'source-over';
  const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.78);
  vg.addColorStop(0, 'rgba(60,40,20,0)'); vg.addColorStop(1, 'rgba(60,40,20,0.28)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);

  // open from paper, close to black
  const fin = 1 - ss(0, 0.5, t);
  if (fin > 0) { g.fillStyle = rgb(C.paper, fin); g.fillRect(0, 0, W, H); }
  const fout = ss(TL.duration - 1.0, TL.duration - 0.05, t);
  if (fout > 0) { g.fillStyle = `rgba(16,12,10,${fout})`; g.fillRect(0, 0, W, H); }
}
