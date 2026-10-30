// Tüm kareleri başsız Chromium ile çizer, ardından sesle birlikte Instagram'a hazır MP4 üretir.
//   node kelime/render.mjs [--word ab] [--workers 4] [--encode-only 1]
// Çıktılar: output/kelime_<word>.mp4 (sesli) ve output/kelime_<word>_sessiz.mp4
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');

const dir = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(dir, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const word = args.word || 'ab';
const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.js'), 'utf8').replace(/^[\s\S]*?=\s*/, '').replace(/;\s*$/, ''));
const fps = tl.fps, total = Math.round(tl.duration * fps);
const workers = parseInt(args.workers || '4', 10);
const frameDir = path.join(dir, 'frames', word);
const audio = path.join(dir, 'out', 'soundtrack.wav');
fs.mkdirSync(frameDir, { recursive: true });
fs.mkdirSync(path.join(root, 'output'), { recursive: true });

if (!args['encode-only']) {
  console.log(`rendering ${total} frames (${fps} fps) with ${workers} workers`);
  const browser = await chromium.launch();
  let next = 0, done = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('pageerror', e => console.error('pageerror:', e.message));
    await page.goto(`file://${dir}/index.html?render=1&word=${word}`);
    await page.waitForFunction(() => window.animReady === true);
    const canvas = page.locator('#c');
    while (next < total) {
      const f = next++;
      await page.evaluate(t => window.renderAt(t), f / fps);
      await canvas.screenshot({ path: path.join(frameDir, `f_${String(f).padStart(5, '0')}.png`) });
      if (++done % 90 === 0) console.log(`  ${done}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  }));
  await browser.close();
  console.log(`frames done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

const video = ['-framerate', String(fps), '-i', path.join(frameDir, 'f_%05d.png')];
const venc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-level', '4.1', '-r', String(fps), '-g', String(fps * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-movflags', '+faststart'];
function ff(list, out) {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...list, out], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status);
  console.log('wrote', path.relative(root, out));
}
ff([...video, ...venc, '-an'], path.join(root, 'output', `kelime_${word}_sessiz.mp4`));
if (fs.existsSync(audio))
  ff([...video, '-i', audio, ...venc, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest'], path.join(root, 'output', `kelime_${word}.mp4`));
