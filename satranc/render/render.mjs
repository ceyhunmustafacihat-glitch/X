// Renders every frame with headless Chromium, exports the sound cues, synthesises the audio
// and muxes an Instagram-ready loopable MP4.
//   node render/render.mjs [--workers 4] [--out output/satranc_tahtasi.mp4] [--encode-only 1]
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const tlSrc = fs.readFileSync(path.join(root, 'anim/timeline.js'), 'utf8');
const tl = JSON.parse(tlSrc.slice(tlSrc.indexOf('{'), tlSrc.lastIndexOf('}') + 1));
const fps = tl.fps, duration = tl.duration;
const workers = parseInt(args.workers || '4', 10);
const frameDir = path.join(root, 'render/frames');
const out = path.join(root, args.out || 'output/satranc_tahtasi.mp4');
const audio = path.join(root, 'output/sfx.wav');
const encodeOnly = !!args['encode-only'];
fs.mkdirSync(frameDir, { recursive: true });
fs.mkdirSync(path.join(root, 'build'), { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });

const url = 'file://' + path.join(root, 'anim/index.html') + '?render=1';
const browser = await chromium.launch();
{
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForFunction(() => window.animReady === true);
  const cues = await page.evaluate(() => window.buildCues());
  fs.writeFileSync(path.join(root, 'build/cues.json'), JSON.stringify(cues, null, 1));
  console.log(`exported ${cues.length} sound cues`);
  await page.close();
}

const total = Math.round(duration * fps);
if (!encodeOnly) {
  let next = 0, done = 0;
  const t0 = Date.now();
  const worker = async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('pageerror', e => console.error('pageerror:', e.message));
    await page.goto(url);
    await page.waitForFunction(() => window.animReady === true);
    while (next < total) {
      const f = next++;
      const data = await page.evaluate(t => { window.renderAt(t); return document.getElementById('c').toDataURL('image/png'); }, f / fps);
      fs.writeFileSync(path.join(frameDir, `f_${String(f).padStart(5, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
      if (++done % 150 === 0) console.log(`  ${done}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  };
  console.log(`rendering ${total} frames (${fps} fps) with ${workers} workers`);
  await Promise.all(Array.from({ length: workers }, worker));
  console.log(`frames done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();

const py = spawnSync('python3', [path.join(root, 'audio/compose.py')], { stdio: 'inherit' });
if (py.status !== 0) process.exit(py.status);

const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frameDir, 'f_%05d.png'), '-i', audio,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-r', String(fps), '-g', String(fps * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(duration), '-movflags', '+faststart', out];
const r = spawnSync('ffmpeg', ff, { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
console.log('wrote', out);
