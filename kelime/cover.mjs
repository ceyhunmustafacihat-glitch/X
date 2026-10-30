// Kapak görseli üretir: node kelime/cover.mjs [--word ab]  ->  output/kelime_<word>_kapak.jpg
import { createRequire } from 'node:module';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(dir, '..');
const wi = process.argv.indexOf('--word'), word = wi >= 0 ? process.argv[wi + 1] : 'ab';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto(`file://${dir}/index.html?render=1&word=${word}`);
await page.waitForFunction(() => window.animReady === true);
await page.evaluate(() => window.renderCover());
const out = path.join(root, 'output', `kelime_${word}_kapak.jpg`);
await page.locator('#c').screenshot({ path: out, type: 'jpeg', quality: 95 });
await browser.close();
console.log('wrote', path.relative(root, out));
