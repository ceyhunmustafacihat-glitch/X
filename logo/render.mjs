// Render logo/*.svg to 1080×1080 PNG: node logo/render.mjs
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const p = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
  await p.goto('file://' + path.join(dir, f));
  await p.screenshot({ path: path.join(dir, f.replace(/\.svg$/, '.png')) });
  console.log(f);
}
await browser.close();
