// Belirli saniyeleri PNG olarak kaydeder: node kelime/stills.mjs <klasör> [--word ab] t1 t2 ...
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import fs from 'node:fs';
const argv = process.argv.slice(2);
const wi = argv.indexOf('--word');
const word = wi >= 0 ? argv.splice(wi, 2)[1] : 'ab';
const [outdir, ...times] = argv;
fs.mkdirSync(outdir, { recursive: true });
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('console', m => console.log('console:', m.text()));
p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto(`file://${dir}/index.html?render=1&word=${word}`);
await p.waitForFunction(() => window.animReady === true);
for (const ts of times) {
  const t = parseFloat(ts), t0 = Date.now();
  await p.evaluate(t => window.renderAt(t), t);
  await p.locator('#c').screenshot({ path: `${outdir}/s_${t.toFixed(2)}.png` });
  console.log(ts, Date.now() - t0, 'ms');
}
await browser.close();
