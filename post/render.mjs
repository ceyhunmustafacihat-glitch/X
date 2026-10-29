// Kullanım: node post/render.mjs ab [başka kelimeler...]  →  post/output/<kelime>.png (1080×1440, 3:4)
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const keys = process.argv.slice(2);
if (!keys.length) { console.error('Kelime dosyası adı verin: node post/render.mjs ab'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1 });
for (const k of keys) {
  const url = pathToFileURL(path.join(dir, 'template.html')).href + '?k=' + encodeURIComponent(k);
  await page.goto(url);
  await page.waitForSelector('body[data-ready="1"]');
  const out = path.join(dir, 'output', `${k}.png`);
  await page.locator('#post').screenshot({ path: out });
  console.log(out);
}
await browser.close();
