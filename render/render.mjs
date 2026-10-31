// Renders every frame of the animation with headless Chromium, then muxes
// the frames with the soundtrack into an Instagram-ready MP4.
//   node render/render.mjs [--workers 4] [--from 0] [--to 32] [--out output/sozlukdeus_reels.mp4] [--encode-only 1]
//   other projects: --page bigbang/index.html --timeline bigbang/timeline.js --audio output/bigbang_audio.wav --frames render/frames_bigbang
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const pageFile = args.page || 'animation/index.html';
const tlSrc = fs.readFileSync(path.join(root, args.timeline || 'animation/timeline.js'), 'utf8');
const tl = JSON.parse(tlSrc.slice(tlSrc.indexOf('{'), tlSrc.lastIndexOf('}') + 1));
const fps = tl.fps, duration = tl.duration;
const workers = parseInt(args.workers || '4', 10);
const from = parseFloat(args.from || '0'), to = parseFloat(args.to || String(duration));
const frameDir = path.join(root, args.frames || 'render/frames');
const out = path.join(root, args.out || 'output/sozlukdeus_reels.mp4');
const audio = path.join(root, args.audio || 'output/soundtrack.wav');
fs.mkdirSync(frameDir, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });

const first = Math.round(from * fps), last = Math.round(to * fps) - 1;
const frames = [];
for (let f = first; f <= last; f++) frames.push(f);
if (!args['encode-only']) console.log(`rendering ${frames.length} frames (${fps} fps) with ${workers} workers`);

const encodeOnly = !!args['encode-only'];
const browser = encodeOnly ? null : await chromium.launch();
let next = 0, done = 0;
const t0 = Date.now();
async function worker() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  await page.goto('file://' + path.join(root, pageFile) + '?render=1');
  await page.waitForFunction(() => window.animReady === true);
  const canvas = page.locator('#c');
  while (next < frames.length) {
    const f = frames[next++];
    await page.evaluate(t => window.renderAt(t), f / fps);
    await canvas.screenshot({ path: path.join(frameDir, `f_${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 96 });
    if (++done % 60 === 0) console.log(`  ${done}/${frames.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await page.close();
}
if (!encodeOnly) {
  await Promise.all(Array.from({ length: workers }, worker));
  await browser.close();
  console.log(`frames done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

if (from === 0 && to === duration) {
  const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frameDir, 'f_%05d.jpg')];
  if (fs.existsSync(audio)) ff.push('-i', audio);
  ff.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
    '-r', String(fps), '-g', String(fps * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709');
  if (fs.existsSync(audio)) ff.push('-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest');
  ff.push('-movflags', '+faststart', out);
  const r = spawnSync('ffmpeg', ff, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status);
  console.log('wrote', out);
}
