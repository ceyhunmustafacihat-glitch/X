// Ab kaydırmalı gönderisi: her slaytı PNG'ye, hepsini tek bir PDF'e (Canva) aktarır.
//   node kelime/ab/render.mjs  ->  output/kelime/ab/ab-1.png, ab-2.png, ab.pdf
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const outDir = path.resolve(here, '../../output/kelime/ab');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 } });
await page.goto('file://' + path.join(here, 'ab.html'));
await page.evaluate(() => document.fonts.ready);
const slides = await page.locator('.slayt').all();
for (const [i, s] of slides.entries()) await s.screenshot({ path: path.join(outDir, `ab-${i + 1}.png`) });
await page.pdf({ path: path.join(outDir, 'ab.pdf'), preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(`${slides.length} slayt -> output/kelime/ab/`);
