// Rasterise an SVG with Chromium: node render/svg2png.mjs in.svg out.png [scale] [transparent]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, input, output, scale = '1', transparent = ''] = process.argv;
const svg = fs.readFileSync(input, 'utf8');
const w = parseFloat(svg.match(/width="([\d.]+)"/)[1]), h = parseFloat(svg.match(/height="([\d.]+)"/)[1]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: parseFloat(scale) });
await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
await page.locator('svg').screenshot({ path: output, omitBackground: !!transparent });
await browser.close();
