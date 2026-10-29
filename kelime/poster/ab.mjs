// "Ab" poster kartı: yazılar düz kırmızı zeminde (arkalarında hiçbir şey yok), kırmızı-altın
// manzara üstte çift altın çizgili bir kemerin içinde. Filigran ya da işaret yok.
//   node kelime/poster/ab.mjs  ->  output/kelime/ab-poster.svg + .png + .pdf (1080 × 1440, 3:4)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { sahne } from '../kelimeler/ab-kirmizi.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const W = 1080, H = 1440;
const ZEMIN = '#8a1520', KREM = '#fff5e1', ALTIN = '#e3c58a', ALTIN_KOYU = '#c7a467';

const fontDir = path.join(root, 'kelime/fonts/montserrat');
const fontCss = [[500, 'normal'], [700, 'normal'], [800, 'normal'], [500, 'italic']].flatMap(([w, st]) => ['latin-ext', 'latin'].map((sub) => {
  const b64 = fs.readFileSync(path.join(fontDir, `montserrat-${sub}-${w}-${st}.woff2`)).toString('base64');
  const range = sub === 'latin' ? 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212'
    : 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF';
  return `@font-face{font-family:'Montserrat';font-style:${st};font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}`;
})).join('\n');

// kemer: 700 genişlik, yarım daire tepe; manzaranın (0,40)-(1080,980) bölgesi kemerin içine oturur
const AX = 190, AW = 700, AT = 128, AB = 738, R = AW / 2;
const kemer = (inset) => `M${AX + inset} ${AB - inset}V${AT + R}A${R - inset} ${R - inset} 0 0 1 ${AX + AW - inset} ${AT + R}V${AB - inset}Z`;
const k = AW / W, tx = AX, ty = AT - 40 * k;

const svg = (tanimX) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>Ab — sözlükdeus</title>
<style>${fontCss}</style>
<defs><clipPath id="kemer"><path d="${kemer(0)}"/></clipPath></defs>
<rect width="${W}" height="${H}" fill="${ZEMIN}"/>
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="${ALTIN}" stroke-width="1.5" opacity="0.55"/>

<g id="kemer-manzara" clip-path="url(#kemer)"><g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(4)})">
${sahne(W, H)}
</g></g>
<path d="${kemer(0)}" fill="none" stroke="${ALTIN}" stroke-width="3"/>
<path d="${kemer(-14)}" fill="none" stroke="${ALTIN}" stroke-width="1.2" opacity="0.8"/>

<g id="sus" fill="${ALTIN}" stroke="${ALTIN}">
  <line x1="380" y1="794" x2="518" y2="794" stroke-width="1.2" opacity="0.8"/><line x1="562" y1="794" x2="700" y2="794" stroke-width="1.2" opacity="0.8"/>
  <path d="M540 782L552 794L540 806L528 794Z" stroke="none"/>
</g>

<g id="yazi" font-family="Montserrat, sans-serif" xml:space="preserve">
  <text x="540" y="958" text-anchor="middle" font-size="150" font-weight="800" letter-spacing="-2" fill="${KREM}">“Ab”</text>
  <text x="540" y="1010" text-anchor="middle" font-size="27" font-weight="500" font-style="italic" letter-spacing="1" fill="${ALTIN}">Sözlük</text>

  <rect x="${tanimX - 30}" y="1072" width="3" height="58" fill="${ALTIN}"/>
  <text id="tanim" x="${tanimX}" y="1112" font-size="34" font-weight="500" fill="${KREM}">Farsça kökenli bir kelime olup <tspan font-weight="700" fill="${ALTIN}">"su"</tspan> demektir.</text>

  <text x="540" y="1232" text-anchor="middle" font-size="33" font-weight="500" font-style="italic" fill="${KREM}" fill-opacity="0.95">
    <tspan x="540">“Kelâm, gönülden doğmadıkça dudaklarda kurur;</tspan>
    <tspan x="540" dy="48">gönülden doğarsa, çorak ruhlara <tspan font-weight="700" font-style="normal" fill="${ALTIN}">âb</tspan> olur.”</tspan>
  </text>
</g>
</svg>
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
// tanım satırının genişliğini ölç: çizgi + metin bloğu ortalansın
await page.setContent(`<body style="margin:0">${svg(0)}</body>`);
await page.evaluate(() => document.fonts.ready);
const tw = await page.evaluate(() => document.getElementById('tanim').getComputedTextLength());
const tanimX = Math.round((W - tw + 30) / 2);
const out = svg(tanimX);
const outDir = path.join(root, 'output/kelime');
fs.writeFileSync(path.join(outDir, 'ab-poster.svg'), out);
await page.setContent(`<body style="margin:0">${out}</body>`);
await page.evaluate(() => document.fonts.ready);
await page.locator('svg').first().screenshot({ path: path.join(outDir, 'ab-poster.png') });
await page.addStyleTag({ content: '@page{size:1080px 1440px;margin:0} svg{display:block}' });
await page.pdf({ path: path.join(outDir, 'ab-poster.pdf'), width: `${W}px`, height: `${H}px`, printBackground: true });
await browser.close();
console.log('output/kelime/ab-poster.{svg,png,pdf}');
