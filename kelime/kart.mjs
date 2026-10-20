// sözlükdeus kelime kartı: vektör arka plan + sayfanın gönderi şablonu.
//   node kelime/kart.mjs seher   ->  output/kelime/seher.svg + seher.png (1080 × 1440, 3:4)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const slug = process.argv[2] || 'seher';
const W = 1080, H = 1440;
// Şablon sabitleri: her kartta aynı. Yazı yerleri ve logo aşağıda sabit koordinatlarda;
// KARARTMA, her kartın arka planının üstüne binen eşit siyah perdenin oranı.
const KARARTMA = 0.2;
const word = await import(path.join(root, 'kelime/kelimeler', `${slug}.mjs`));

// Montserrat'ı SVG'nin içine gömüyoruz: dosya her tarayıcıda aynı görünür.
// Illustrator gömülü fontu okumaz; orada bilgisayarda Montserrat kurulu olmalı.
const fontDir = path.join(root, 'animation/fonts');
const latinExt = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF';
const latin = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212';
const fontCss = ['normal', 'italic'].flatMap((style) => [['latin-ext', latinExt], ['latin', latin]].map(([sub, range]) => {
  const b64 = fs.readFileSync(path.join(fontDir, `Montserrat-${style}-${sub}.woff2`)).toString('base64');
  return `@font-face{font-family:'Montserrat';font-style:${style};font-weight:100 900;src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}`;
})).join('\n');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<style>${fontCss}</style><body style="margin:0"></body>`);
await page.evaluate(() => Promise.all(['800 70px Montserrat', '700 32px Montserrat', '400 32px Montserrat', 'italic 400 25px Montserrat']
  .map((f) => document.fonts.load(f, 'Şğİıöçü'))));

const textLayer = await page.evaluate(({ W, H, kelime, tanim, ornek }) => {
  const g = document.createElement('canvas').getContext('2d');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const font = (px, b) => `${b ? 700 : 400} ${px}px Montserrat`;

  // kalın/normal parçaları kelime kelime satırlara böl
  function wrap(runs, px, maxW) {
    const words = runs.flatMap((r) => r.t.split(' ').filter(Boolean).map((t) => ({ t, b: !!r.b })));
    g.font = font(px); const sp = g.measureText(' ').width;
    const lines = [[]]; let w = 0;
    for (const wd of words) {
      g.font = font(px, wd.b); const ww = g.measureText(wd.t).width;
      if (lines.at(-1).length && w + sp + ww > maxW) { lines.push([]); w = 0; }
      w += (lines.at(-1).length ? sp : 0) + ww; lines.at(-1).push(wd);
    }
    return lines;
  }
  const tspans = (line) => {
    const runs = [];
    line.forEach((wd, i) => {
      const t = (i ? ' ' : '') + wd.t;
      if (runs.length && runs.at(-1).b === wd.b) runs.at(-1).t += t; else runs.push({ t, b: wd.b });
    });
    return runs.map((r) => `<tspan font-weight="${r.b ? 700 : 400}">${esc(r.t)}</tspan>`).join('');
  };

  const out = [];
  const cx = W / 2;
  const wy = Math.round(H * 0.297 + 26);
  out.push(`<text x="${cx}" y="${wy}" text-anchor="middle" font-size="70" font-weight="800" letter-spacing="-0.6">“${esc(kelime)}”</text>`);
  out.push(`<text x="${cx}" y="${wy + 40}" text-anchor="middle" font-size="25" font-style="italic" fill-opacity="0.85">Sözlük</text>`);

  const dl = wrap(tanim, 32, W * 0.76), dLH = 44;
  const dy0 = Math.round(H * 0.448 - (dl.length - 1) * dLH / 2);
  out.push(`<rect x="${Math.round(W * 0.103)}" y="${dy0 - 52}" width="3" height="${(dl.length - 1) * dLH + 82}" fill-opacity="0.9"/>`);
  dl.forEach((ln, i) => out.push(`<text x="${Math.round(W * 0.135)}" y="${dy0 + i * dLH}" font-size="32">${tspans(ln)}</text>`));

  const el = wrap(ornek, 35, W * 0.76), eLH = 47;
  const ey0 = Math.round(H * 0.66 - (el.length - 1) * eLH / 2);
  el.forEach((ln, i) => out.push(`<text x="${cx}" y="${ey0 + i * eLH}" text-anchor="middle" font-size="35">${tspans(ln)}</text>`));

  // sayfanın işareti: açık kitap
  const s = 68 / 24;
  out.push(`<g transform="translate(${cx - 34} ${Math.round(H * 0.935) - 34}) scale(${s.toFixed(4)})" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 6.5C9.5 4.8 6 4.3 2.5 5.2V18.6C6 17.8 9.5 18.3 12 20"/><path d="M12 6.5C14.5 4.8 18 4.3 21.5 5.2V18.6C18 17.8 14.5 18.3 12 20"/><path d="M12 6.5V20"/></g>`);
  return out.join('\n');
}, { W, H, kelime: word.kelime, tanim: word.tanim, ornek: word.ornek });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>${word.kelime} — sözlükdeus</title>
<style>${fontCss}</style>
<defs><filter id="golge" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#000" flood-opacity="0.55"/></filter></defs>
<g id="arka-plan">
${word.sahne(W, H)}
</g>
<rect id="sablon-karartma" width="${W}" height="${H}" fill="#000" opacity="${KARARTMA}"/>
<g id="yazi" font-family="Montserrat, sans-serif" fill="#fff" filter="url(#golge)" xml:space="preserve">
${textLayer}
</g>
</svg>
`;

const outDir = path.join(root, 'output/kelime');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${slug}.svg`), svg);
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.evaluate(() => document.fonts.ready);
await page.locator('svg').first().screenshot({ path: path.join(outDir, `${slug}.png`) });
// Canva için: PDF içe aktarılınca yazılar düzenlenebilir kalır; arka plan ayrıca yazısız PNG.
// SVG filtresi yazıyı resme çevirdiği için PDF'de gölge yok (Canva'da Efektler → Gölge ile eklenir)
await page.addStyleTag({ content: '@page{size:1080px 1440px;margin:0} svg{display:block}' });
await page.evaluate(() => document.getElementById('yazi').removeAttribute('filter'));
await page.pdf({ path: path.join(outDir, `${slug}.pdf`), width: `${W}px`, height: `${H}px`, printBackground: true });
await page.evaluate(() => document.getElementById('yazi').remove());
await page.locator('svg').first().screenshot({ path: path.join(outDir, `${slug}-arkaplan.png`) });
await browser.close();
console.log(`output/kelime/${slug}.{svg,png,pdf} + ${slug}-arkaplan.png`);
