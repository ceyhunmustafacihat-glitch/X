// Saves PNG stills at given seconds: node render/stills.mjs 3 20 45.5 [--dir output/stills]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2);
const di = argv.indexOf('--dir');
const dir = path.resolve(root, di >= 0 ? argv.splice(di, 2)[1] : 'render/tmp');
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('pageerror:', e.message));
page.on('console', m => console.log('console:', m.text()));
await page.goto('file://' + path.join(root, 'animation/index.html') + '?render=1');
await page.waitForFunction(() => window.animReady === true);
for (const s of argv) {
  await page.evaluate(t => window.renderAt(t), parseFloat(s));
  const out = path.join(dir, `still_${s}.png`);
  await page.locator('#c').screenshot({ path: out });
  console.log(out);
}
await browser.close();
