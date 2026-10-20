// Renders the Big Bang explainer frame by frame with headless Chromium, then encodes a silent MP4
// (the voice-over is recorded separately).
//   node bigbang/render.mjs [--workers 4] [--stills 2,10,30] [--out output/bigbang_reels.mp4]
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const tl = JSON.parse(fs.readFileSync(path.join(here, 'timeline.js'), 'utf8').replace(/^[\s\S]*?=\s*/, '').replace(/;\s*$/, ''));
const fps = tl.fps, duration = tl.duration, workers = parseInt(args.workers || '4', 10);
const frameDir = path.join(root, 'render/frames-bigbang');
const out = path.join(root, args.out || 'output/bigbang_reels.mp4');

const stills = args.stills ? args.stills.split(',').map(Number) : null;
const jobs = stills ? stills.map(s => ({ t: s, file: path.join(root, 'render/tmp', `bigbang_${String(s).replace('.', '_')}.png`) }))
  : Array.from({ length: Math.round(duration * fps) }, (_, f) => ({ t: f / fps, file: path.join(frameDir, `f_${String(f).padStart(5, '0')}.jpg`) }));
fs.mkdirSync(stills ? path.join(root, 'render/tmp') : frameDir, { recursive: true });

const browser = await chromium.launch();
let next = 0, done = 0;
const t0 = Date.now();
async function worker() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  await page.goto('file://' + path.join(here, 'index.html') + '?render=1');
  await page.waitForFunction(() => window.animReady === true);
  const canvas = page.locator('#c');
  while (next < jobs.length) {
    const j = jobs[next++];
    await page.evaluate(t => window.renderAt(t), j.t);
    await canvas.screenshot(j.file.endsWith('.png') ? { path: j.file } : { path: j.file, type: 'jpeg', quality: 95 });
    if (++done % 150 === 0) console.log(`  ${done}/${jobs.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await page.close();
}
await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, worker));
await browser.close();
console.log(`rendered ${jobs.length} images in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

if (!stills) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frameDir, 'f_%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
    '-g', String(fps * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status);
  console.log('wrote', out);
}
