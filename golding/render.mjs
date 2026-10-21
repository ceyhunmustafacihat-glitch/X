// Renders every frame with headless Chromium, then encodes the MP4 with the music bed.
//   node golding/render.mjs [--workers 4] [--encode-only 1]
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const fps = 30, workers = parseInt(args.workers || '4', 10);
const frameDir = path.join(root, 'render/frames_golding');
const out = path.join(root, 'output/william_golding.mp4');
const audio = path.join(root, 'output/william_golding_music.wav');
fs.mkdirSync(frameDir, { recursive: true });

if (!args['encode-only']) {
  const browser = await chromium.launch();
  const url = 'file://' + path.join(root, 'golding/index.html') + '?render=1';
  const probe = await browser.newPage(); await probe.goto(url); await probe.waitForFunction(() => window.animReady === true);
  const duration = await probe.evaluate(() => window.DURATION); await probe.close();
  const total = Math.round(duration * fps);
  console.log(`rendering ${total} frames with ${workers} workers`);
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('pageerror', e => console.error('pageerror:', e.message));
    await page.goto(url); await page.waitForFunction(() => window.animReady === true);
    while (next < total) {
      const f = next++;
      const data = await page.evaluate(t => { window.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, f / fps);
      fs.writeFileSync(path.join(frameDir, `f_${String(f).padStart(5, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
      if (++done % 300 === 0) console.log(`  ${done}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  }));
  await browser.close();
}
const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frameDir, 'f_%05d.jpg')];
if (fs.existsSync(audio)) ff.push('-i', audio);
ff.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1', '-r', String(fps), '-g', String(fps * 2),
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709');
if (fs.existsSync(audio)) ff.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest');
ff.push('-movflags', '+faststart', out);
const r = spawnSync('ffmpeg', ff, { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
console.log('wrote', out);
