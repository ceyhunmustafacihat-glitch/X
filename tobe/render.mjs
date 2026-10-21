// Renders the "to be" lesson frame by frame with headless Chromium, writes the
// sound cue list, synthesizes the soundtrack and muxes everything into an MP4.
//   node tobe/render.mjs [--workers 4] [--stills 4,20,60] [--encode-only 1]
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const fps = 30, workers = parseInt(args.workers || '4', 10);
const build = path.join(here, 'build'), frameDir = path.join(build, 'frames');
const out = path.join(root, args.out || 'output/to_be_ders.mp4');
const audio = path.join(root, 'output/to_be_soundtrack.wav');
fs.mkdirSync(frameDir, { recursive: true });
const url = 'file://' + path.join(here, 'index.html') + '?render=1';

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.animReady === true);
  return page;
}

// use the preinstalled Chromium when Playwright's own build is missing
const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
const browser = await chromium.launch(fs.existsSync(chromium.executablePath()) || !exe ? {} : { executablePath: exe });
const meta = await (await openPage(browser)).evaluate(() => window.lesson());
fs.writeFileSync(path.join(build, 'lesson.json'), JSON.stringify(meta, null, 1));
console.log(`duration ${meta.duration.toFixed(1)} s, ${meta.sfx.length} sound cues`);

if (args.stills) {
  const page = await openPage(browser);
  for (const s of args.stills.split(',')) {
    await page.evaluate(t => window.renderAt(t), parseFloat(s));
    await page.locator('#c').screenshot({ path: path.join(build, `still_${s}.png`) });
  }
  await browser.close();
  process.exit(0);
}

if (!args['encode-only']) {
  const frames = Array.from({ length: Math.round(meta.duration * fps) }, (_, i) => i);
  console.log(`rendering ${frames.length} frames with ${workers} workers`);
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await openPage(browser), canvas = page.locator('#c');
    while (next < frames.length) {
      const f = frames[next++];
      await page.evaluate(t => window.renderAt(t), f / fps);
      await canvas.screenshot({ path: path.join(frameDir, `f_${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
      if (++done % 300 === 0) console.log(`  ${done}/${frames.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  }));
}
await browser.close();

const py = spawnSync('python3', [path.join(here, 'compose.py'), path.join(build, 'lesson.json'), audio], { stdio: 'inherit' });
if (py.status !== 0) process.exit(py.status);
const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frameDir, 'f_%05d.jpg'), '-i', audio,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-r', String(fps), '-g', String(fps * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out];
const r = spawnSync('ffmpeg', ff, { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status);
console.log('wrote', out);
