// Render an SVG illustration to PNG with the repo fonts: node render/svg2png.mjs in.svg out.png [size]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
const [,, input, output, size = '1080'] = process.argv;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const svg = fs.readFileSync(path.resolve(input), 'utf8');
const html = `<!doctype html><html><head><link rel="stylesheet" href="file://${root}/animation/fonts/fonts.css">
<style>html,body{margin:0;background:#0a0a0a}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`;
const tmp = path.join(path.dirname(path.resolve(output)), '.svg2png.html');
fs.writeFileSync(tmp, html);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await browser.newPage({ viewport: { width: +size, height: +size } });
await p.goto('file://' + tmp);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: output });
await browser.close();
fs.unlinkSync(tmp);
