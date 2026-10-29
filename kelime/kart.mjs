// sözlükdeus kelime kartı: vektör arka plan + sayfanın gönderi şablonu.
//   node kelime/kart.mjs seher             ->  output/kelime/seher.svg + seher.png (1080 × 1440, 3:4)
//   node kelime/kart.mjs seher --logosuz   ->  output/kelime/seher-logosuz.*  (alttaki kitap işareti olmadan)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const slug = process.argv[2] || 'seher';
const logosuz = process.argv.includes('--logosuz');
const ad = logosuz ? `${slug}-logosuz` : slug;
const W = 1080, H = 1440;
// Şablon sabitleri: her kartta aynı. Yazı yerleri ve logo aşağıda sabit koordinatlarda;
// KARARTMA, her kartın arka planının üstüne binen eşit siyah perdenin oranı.
const KARARTMA = 0.2;
const word = await import(path.join(root, 'kelime/kelimeler', `${slug}.mjs`));
// Kelime dosyası isterse renk teması verir: yazı rengi, vurgu (kalın kelimeler ve tanım çizgisi),
// karartma oranı ve alttaki işaretin türü ('cizgi': beyaz çizgi kitap, 'altin': dolgulu altın kitap).
const tema = { yazi: '#ffffff', vurgu: null, karartma: KARARTMA, logo: 'cizgi', ...word.tema };

// Montserrat'ı SVG'nin içine gömüyoruz: dosya her tarayıcıda aynı görünür.
// Illustrator gömülü fontu okumaz; orada bilgisayarda Montserrat kurulu olmalı.
// Sabit ağırlıklı dosyalar (Regular 400, Bold 700, ExtraBold 800, Italic 400) kullanılır ki
// PDF'de de yazı tipi doğru adıyla ve kalınlığıyla gelsin (değişken dosya Canva'da "Thin" görünüyordu).
const fontDir = path.join(root, 'kelime/fonts/montserrat');
const latinExt = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF';
const latin = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212';
const fontCss = [[400, 'normal'], [700, 'normal'], [800, 'normal'], [400, 'italic']].flatMap(([weight, style]) =>
  [['latin-ext', latinExt], ['latin', latin]].map(([sub, range]) => {
    const b64 = fs.readFileSync(path.join(fontDir, `montserrat-${sub}-${weight}-${style}.woff2`)).toString('base64');
    return `@font-face{font-family:'Montserrat';font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}`;
  })).join('\n');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<style>${fontCss}</style><body style="margin:0"></body>`);
await page.evaluate(() => Promise.all(['800 70px Montserrat', '700 32px Montserrat', '400 32px Montserrat', 'italic 400 25px Montserrat']
  .map((f) => document.fonts.load(f, 'Şğİıöçü'))));

const textLayer = await page.evaluate(({ W, H, kelime, tanim, ornek, logo, tema }) => {
  const g = document.createElement('canvas').getContext('2d');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const font = (px, b) => `${b ? 700 : 400} ${px}px Montserrat`;

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
    for (const wd of words) {
      const ww = wd.reduce((s, p) => { g.font = font(px, p.b); return s + g.measureText(p.t).width; }, 0);
      if (lines.at(-1).length && w + sp + ww > maxW) { lines.push([]); w = 0; }
      w += (lines.at(-1).length ? sp : 0) + ww; lines.at(-1).push(wd);
    }
    return lines;
  }
  const tspans = (line) => {
    const runs = [];
    line.forEach((wd, i) => wd.forEach((p, k) => {
      const t = (i && !k ? ' ' : '') + p.t;
      if (runs.length && runs.at(-1).b === p.b) runs.at(-1).t += t; else runs.push({ t, b: p.b });
    }));
    return runs.map((r) => `<tspan font-weight="${r.b ? 700 : 400}"${r.b && tema.vurgu ? ` fill="${tema.vurgu}"` : ''}>${esc(r.t)}</tspan>`).join('');
  };

  const out = [];
  const cx = W / 2;
  const wy = Math.round(H * 0.297 + 26);
  out.push(`<text x="${cx}" y="${wy}" text-anchor="middle" font-size="70" font-weight="800" letter-spacing="-0.6">“${esc(kelime)}”</text>`);
  out.push(`<text x="${cx}" y="${wy + 40}" text-anchor="middle" font-size="25" font-style="italic" fill-opacity="0.85">Sözlük</text>`);

  const dl = wrap(tanim, 32, W * 0.76), dLH = 44;
  const dy0 = Math.round(H * 0.448 - (dl.length - 1) * dLH / 2);
  out.push(`<rect x="${Math.round(W * 0.103)}" y="${dy0 - 52}" width="3" height="${(dl.length - 1) * dLH + 82}" fill-opacity="0.9"${tema.vurgu ? ` fill="${tema.vurgu}"` : ''}/>`);
  dl.forEach((ln, i) => out.push(`<text x="${Math.round(W * 0.135)}" y="${dy0 + i * dLH}" font-size="32">${tspans(ln)}</text>`));

  const el = wrap(ornek, 35, W * 0.76), eLH = 47;
  const ey0 = Math.round(H * 0.66 - (el.length - 1) * eLH / 2);
  el.forEach((ln, i) => out.push(`<text x="${cx}" y="${ey0 + i * eLH}" text-anchor="middle" font-size="35">${tspans(ln)}</text>`));

  // sayfanın işareti: açık kitap
  const s = 68 / 24;
  if (logo && tema.logo === 'altin') {
    // profil logosundaki dolgulu altın kitap: iki sayfa, üçer satır, altta sayfa kenarı
    const k = 100 / 24, satir = (x0, x1, y, yon) => `M${x0} ${y}C${x0 + yon * 2.4} ${y - 0.15} ${x0 + yon * 4.6} ${y} ${x1} ${y + 0.55}`;
    out.push(`<defs><linearGradient id="altinKitap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ead29c"/><stop offset="1" stop-color="#d1ad73"/></linearGradient></defs>
  <g transform="translate(${cx - 50} ${Math.round(H * 0.935) - 52}) scale(${k.toFixed(4)})">
  <path d="M11.5 8.6C9.3 7.2 6.2 6.8 3.4 7.4V18.1C6.2 17.5 9.3 17.9 11.5 19.3Z" fill="url(#altinKitap)"/><path d="M12.5 8.6C14.7 7.2 17.8 6.8 20.6 7.4V18.1C17.8 17.5 14.7 17.9 12.5 19.3Z" fill="url(#altinKitap)"/>
  <path d="${satir(4.9, 10.2, 10.3, 1)}${satir(4.9, 10.2, 12.3, 1)}${satir(4.9, 10.2, 14.3, 1)}${satir(19.1, 13.8, 10.3, -1)}${satir(19.1, 13.8, 12.3, -1)}${satir(19.1, 13.8, 14.3, -1)}" fill="none" stroke="${tema.zemin ?? '#9b1b26'}" stroke-width="0.55" stroke-linecap="round"/>
  <path d="M2.6 18.9C6 18.3 9.4 18.7 12 20.1C14.6 18.7 18 18.3 21.4 18.9" fill="none" stroke="url(#altinKitap)" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  } else if (logo) out.push(`<g transform="translate(${cx - 34} ${Math.round(H * 0.935) - 34}) scale(${s.toFixed(4)})" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 6.5C9.5 4.8 6 4.3 2.5 5.2V18.6C6 17.8 9.5 18.3 12 20"/><path d="M12 6.5C14.5 4.8 18 4.3 21.5 5.2V18.6C18 17.8 14.5 18.3 12 20"/><path d="M12 6.5V20"/></g>`);
  return out.join('\n');
}, { W, H, kelime: word.kelime, tanim: word.tanim, ornek: word.ornek, logo: !logosuz, tema });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>${word.kelime} — sözlükdeus</title>
<style>${fontCss}</style>
<defs><filter id="golge" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#000" flood-opacity="0.55"/></filter></defs>
<g id="arka-plan">
${word.sahne(W, H)}
</g>
<rect id="sablon-karartma" width="${W}" height="${H}" fill="#000" opacity="${tema.karartma}"/>
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
