// node cover/render.mjs  -> docs/kapak_foto.png (1080×1920)
import { createRequire } from 'node:module';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto('file://' + path.join(root, 'cover/cover.html'));
await page.waitForFunction(() => window.coverReady === true);
const out = path.join(root, 'docs/kapak_foto.png');
await page.locator('#c').screenshot({ path: out });
await browser.close();
console.log('wrote', out);
