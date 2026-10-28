// node satranc/render/stills.mjs 0 5 10 ...  -> satranc/render/tmp/still_<t>.png
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'render/tmp');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto('file://' + path.join(root, 'anim/index.html') + '?render=1');
await page.waitForFunction(() => window.animReady === true);
for (const t of process.argv.slice(2).map(Number)) {
  await page.evaluate(t => window.renderAt(t), t);
  const file = path.join(out, `still_${t.toFixed(2)}.png`);
  await page.locator('#c').screenshot({ path: file });
  console.log(file);
}
await browser.close();
