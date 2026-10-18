// Render selected times to PNG: node render/stills.mjs outdir t1 t2 ...
import { chromium } from 'playwright';
import path from 'node:path';
const [,, outdir, ...times] = process.argv;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('console', m => console.log('console:', m.text()));
p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto('file://' + root + '/animation/index.html?render=1');
await p.waitForFunction(() => window.animReady === true);
for (const ts of times) {
  const t = parseFloat(ts);
  const t0 = Date.now();
  await p.evaluate(t => window.renderAt(t), t);
  await p.locator('#c').screenshot({ path: `${outdir}/f_${t.toFixed(2)}.png` });
  console.log(ts, Date.now() - t0, 'ms');
}
await browser.close();
