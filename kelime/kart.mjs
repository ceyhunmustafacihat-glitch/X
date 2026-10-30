// sözlükdeus kelime kartı: vektör arka plan + sayfanın gönderi şablonu.
//   node kelime/kart.mjs seher   ->  output/kelime/seher.svg + seher.png + seher.pdf (1080 × 1440, 3:4)
// Kartlarda filigran ya da işaret yoktur; yalnızca sahne ve yazılar.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const slug = process.argv[2] || 'seher';
const ad = slug;
const W = 1080, H = 1440;
// Şablon sabitleri: her kartta aynı. Yazı yerleri aşağıda sabit koordinatlarda;
// KARARTMA, her kartın arka planının üstüne binen eşit siyah perdenin oranı.
const KARARTMA = 0.2;
const word = await import(path.join(root, 'kelime/kelimeler', `${slug}.mjs`));
// Kelime dosyası isterse renk teması verir: yazı rengi, vurgu (kalın kelimeler ve tanım çizgisi),
// karartma oranı ve rengi (perde), perdenin karışım modu (karisim: 'color' verilirse sahnenin renkleri
// perde rengine çevrilir, iki tonlu fotoğraf gibi), ek siyah koyulaştırma (koyu) ve büyük kelimenin rengi
// (baslik: 'altin' verilirse logodaki kitabın altın gradyanı).
const tema = { yazi: '#ffffff', vurgu: null, karartma: KARARTMA, perde: '#000000', karisim: null, koyu: 0, baslik: null, ...word.tema };

// Montserrat'ı SVG'nin içine gömüyoruz: dosya her tarayıcıda aynı görünür.
// Illustrator gömülü fontu okumaz; orada bilgisayarda Montserrat kurulu olmalı.
// Sabit ağırlıklı dosyalar (Medium 500, Bold 700, ExtraBold 800, Medium Italic 500) kullanılır ki
// PDF'de de yazı tipi doğru adıyla ve kalınlığıyla gelsin (değişken dosya Canva'da "Thin" görünüyordu).
const fontDir = path.join(root, 'kelime/fonts/montserrat');
const latinExt = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF';
const latin = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212';
const fontCss = [[500, 'normal'], [700, 'normal'], [800, 'normal'], [500, 'italic']].flatMap(([weight, style]) =>
  [['latin-ext', latinExt], ['latin', latin]].map(([sub, range]) => {
    const b64 = fs.readFileSync(path.join(fontDir, `montserrat-${sub}-${weight}-${style}.woff2`)).toString('base64');
    return `@font-face{font-family:'Montserrat';font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}`;
  })).join('\n');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<style>${fontCss}</style><body style="margin:0"></body>`);
await page.evaluate(() => Promise.all(['800 70px Montserrat', '700 32px Montserrat', '500 32px Montserrat', 'italic 500 25px Montserrat']
  .map((f) => document.fonts.load(f, 'Şğİıöçü'))));

const textLayer = await page.evaluate(({ W, H, kelime, koken, tanim, ornek, tema }) => {
  const g = document.createElement('canvas').getContext('2d');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const font = (px, b) => `${b ? 700 : 500} ${px}px Montserrat`;

  // kalın/normal parçaları kelime kelime satırlara böl; aralarında boşluk olmayan
  // parçalar ("giysi" + ".") tek kelime sayılır
  function wrap(runs, px, maxW) {
    const words = []; let cur = null;
    for (const r of runs) {
      r.t.split(' ').forEach((seg, j) => {
        if (j > 0) cur = null;
        if (!seg) return;
        if (!cur) words.push(cur = []);
        cur.push({ t: seg, b: !!r.b });
      });
    }
    g.font = font(px); const sp = g.measureText(' ').width;
    const lines = [[]]; let w = 0;
    lines.widths = [0];
    for (const wd of words) {
      const ww = wd.reduce((s, p) => { g.font = font(px, p.b); return s + g.measureText(p.t).width; }, 0);
      if (lines.at(-1).length && w + sp + ww > maxW) { lines.push([]); lines.widths.push(0); w = 0; }
      w += (lines.at(-1).length ? sp : 0) + ww; lines.at(-1).push(wd); lines.widths[lines.length - 1] = w;
    }
    return lines;
  }
  const tspans = (line) => {
    const runs = [];
    line.forEach((wd, i) => wd.forEach((p, k) => {
      const t = (i && !k ? ' ' : '') + p.t;
      if (runs.length && runs.at(-1).b === p.b) runs.at(-1).t += t; else runs.push({ t, b: p.b });
    }));
    return runs.map((r) => `<tspan font-weight="${r.b ? 700 : 500}"${r.b && tema.vurgu ? ` fill="${tema.vurgu}"` : ''}>${esc(r.t)}</tspan>`).join('');
  };

  const out = [];
  const cx = W / 2;
  const wy = Math.round(H * 0.297 + 26);
  out.push(`<text x="${cx}" y="${wy}" text-anchor="middle" font-size="96" font-weight="800" letter-spacing="-1"${tema.baslik === 'altin' ? ' fill="url(#altinBaslik)"' : ''}>“${esc(kelime)}”</text>`);
  // kelimenin altında parantez içinde, italik kökeni (kelime dosyası vermezse "sözlük")
  out.push(`<text x="${cx}" y="${wy + 42}" text-anchor="middle" font-size="25" font-style="italic" font-weight="500" letter-spacing="0.5" fill-opacity="0.88">(${esc(koken ?? 'sözlük')})</text>`);

  const dl = wrap(tanim, 32, W * 0.76), dLH = 44;
  const dy0 = Math.round(H * 0.448 - (dl.length - 1) * dLH / 2);
  out.push(`<rect x="${Math.round(W * 0.103)}" y="${dy0 - 52}" width="3" height="${(dl.length - 1) * dLH + 82}" fill-opacity="0.9"${tema.vurgu ? ` fill="${tema.vurgu}"` : ''}/>`);
  dl.forEach((ln, i) => out.push(`<text x="${Math.round(W * 0.135)}" y="${dy0 + i * dLH}" font-size="32">${tspans(ln)}</text>`));

  const el = wrap(ornek, 35, W * 0.76), eLH = 47;
  const ey0 = Math.round(H * 0.66 - (el.length - 1) * eLH / 2);
  el.forEach((ln, i) => out.push(`<text x="${cx}" y="${ey0 + i * eLH}" text-anchor="middle" font-size="35">${tspans(ln)}</text>`));
  return out.join('\n');
}, { W, H, kelime: word.kelime, koken: word.koken ?? null, tanim: word.tanim, ornek: word.ornek, tema });


const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>${word.kelime} — sözlükdeus</title>
<style>${fontCss}</style>
<defs>
<filter id="golge" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.75"/><feDropShadow dx="0" dy="3" stdDeviation="9" flood-color="#000" flood-opacity="0.6"/></filter>
<linearGradient id="altinBaslik" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ead29c"/><stop offset="1" stop-color="#d1ad73"/></linearGradient>
</defs>
<g id="arka-plan">
${word.sahne(W, H)}
</g>
<rect id="sablon-karartma" width="${W}" height="${H}" fill="${tema.perde}" opacity="${tema.karartma}"${tema.karisim ? ` style="mix-blend-mode:${tema.karisim}"` : ''}/>${tema.koyu ? `
<rect id="sablon-koyu" width="${W}" height="${H}" fill="#000" opacity="${tema.koyu}"/>` : ''}
<g id="yazi" font-family="Montserrat, sans-serif" fill="${tema.yazi}" filter="url(#golge)" xml:space="preserve">
${textLayer}
</g>
</svg>
`;

const outDir = path.join(root, 'output/kelime');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${ad}.svg`), svg);
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.evaluate(() => document.fonts.ready);
await page.locator('svg').first().screenshot({ path: path.join(outDir, `${ad}.png`) });
// Canva için: PDF içe aktarılınca yazılar düzenlenebilir kalır; arka plan ayrıca yazısız PNG.
// SVG filtresi yazıyı resme çevirdiği için PDF'de gölge yok (Canva'da Efektler → Gölge ile eklenir)
await page.addStyleTag({ content: '@page{size:1080px 1440px;margin:0} svg{display:block}' });
await page.evaluate(() => document.getElementById('yazi').removeAttribute('filter'));
await page.pdf({ path: path.join(outDir, `${ad}.pdf`), width: `${W}px`, height: `${H}px`, printBackground: true });
await page.evaluate(() => document.getElementById('yazi').remove());
await page.locator('svg').first().screenshot({ path: path.join(outDir, `${ad}-arkaplan.png`) });
await browser.close();
console.log(`output/kelime/${ad}.{svg,png,pdf} + ${ad}-arkaplan.png`);
