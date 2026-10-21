// Frame compositor: scene cross-fades, paper grain and a soft vignette.
let ctx, buf, bctx, grain;
const TR = 0.6; // cross-fade length (s)

function init(canvas) {
  ctx = canvas.getContext('2d');
  buf = document.createElement('canvas'); buf.width = W; buf.height = H; bctx = buf.getContext('2d');
  grain = document.createElement('canvas'); grain.width = grain.height = 256;
  const g = grain.getContext('2d'), id = g.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (rnd(i * 0.37) - 0.5) * 90; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
}

function drawScene(c, i, t) {
  c.save(); c.globalAlpha = 1; c.textAlign = 'left'; c.letterSpacing = '0px';
  S[i].draw(c, t - S[i].start);
  c.restore();
}

function renderFrame(t) {
  t = clamp(t, 0, DURATION - 1 / FPS);
  let i = 0; while (i < S.length - 1 && t >= S[i + 1].start) i++;
  const into = t - S[i].start;
  if (i > 0 && into < TR) {
    drawScene(ctx, i - 1, t);
    drawScene(bctx, i, t);
    ctx.save(); ctx.globalAlpha = eIO(into / TR); ctx.drawImage(buf, 0, 0); ctx.restore();
  } else drawScene(ctx, i, t);
  // paper grain
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
