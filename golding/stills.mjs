// node golding/stills.mjs 3 10 25 ...  -> render/tmp/golding_<t>.png
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'render/tmp'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('pageerror:', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto('file://' + path.join(root, 'golding/index.html') + '?render=1');
await page.waitForFunction(() => window.animReady === true);
for (const t of process.argv.slice(2).map(Number)) {
  await page.evaluate(t => window.renderAt(t), t);
  await page.locator('#c').screenshot({ path: path.join(out, `golding_${t}.png`) });
}
console.log('duration', await page.evaluate(() => window.DURATION));
await browser.close();
