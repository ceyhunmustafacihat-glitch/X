// "Ab" modern kart: açık kâğıt zemin, koyu mürekkep yazı, tek vurgu rengi su mavisi.
// Dev kelime, geometrik su damlası, ANLAM / ÖRNEK bölümleri ve ilgili kelimeler. Filigran yok.
//   node kelime/poster/ab-modern.mjs  ->  output/kelime/ab-modern.svg + .png + .pdf (1080 × 1440, 3:4)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const W = 1080, H = 1440, M = 96; // M: sol/sağ kenar boşluğu
// vurgu rengi kelimenin anlamından: derin su mavisi (kırmızı damla kan gibi okunuyordu)
const KAGIT = '#f4eee4', MUREKKEP = '#1c1917', VURGU = '#16607a', GRI = '#857b72', CIZGI = '#d9cfc2';

const fontDir = path.join(root, 'kelime/fonts/montserrat');
const fontCss = [[500, 'normal'], [700, 'normal'], [800, 'normal'], [500, 'italic']].flatMap(([w, st]) => ['latin-ext', 'latin'].map((sub) => {
  const b64 = fs.readFileSync(path.join(fontDir, `montserrat-${sub}-${w}-${st}.woff2`)).toString('base64');
  const range = sub === 'latin' ? 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212'
    : 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF';
  return `@font-face{font-family:'Montserrat';font-style:${st};font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}`;
})).join('\n');

// geometrik su damlası: sivri tepe, yuvarlak gövde; içinden geçen üç beyaz dalga ve küçük parıltı
const DX = 790, DY = 430, DR = 140;
const damla = `M${DX} ${DY - 270}C${DX} ${DY - 270} ${DX - DR} ${DY - 110} ${DX - DR} ${DY}A${DR} ${DR} 0 0 0 ${DX + DR} ${DY}C${DX + DR} ${DY - 110} ${DX} ${DY - 270} ${DX} ${DY - 270}Z`;
const dalga = (y) => `M${DX - DR - 20} ${y}c35 -18 70 -18 105 0s70 18 105 0s70 -18 105 0`;

const label = (y, t) => `<text x="${M}" y="${y}" font-size="21" font-weight="700" letter-spacing="4" fill="${VURGU}">${t}</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>Ab — sözlükdeus</title>
<style>${fontCss}</style>
<defs><clipPath id="damla"><path d="${damla}"/></clipPath></defs>
<rect width="${W}" height="${H}" fill="${KAGIT}"/>

<g font-family="Montserrat, sans-serif" xml:space="preserve">
  <!-- üst satır -->
  <text x="${M}" y="118" font-size="21" font-weight="700" letter-spacing="5" fill="${VURGU}">SÖZLÜK</text>
  <text x="${W - M}" y="118" text-anchor="end" font-size="21" font-weight="500" letter-spacing="3" fill="${GRI}">FARSÇA · İSİM</text>
  <line x1="${M}" y1="146" x2="${W - M}" y2="146" stroke="${MUREKKEP}" stroke-width="2"/>

  <!-- damla -->
  <path d="${damla}" fill="${VURGU}"/>
  <g clip-path="url(#damla)" fill="none" stroke="${KAGIT}" stroke-width="9" stroke-linecap="round">
    <path d="${dalga(DY + 10)}"/><path d="${dalga(DY + 62)}" opacity="0.75"/><path d="${dalga(DY + 114)}" opacity="0.5"/>
  </g>
  <path d="M${DX - 78} ${DY - 40}A86 86 0 0 1 ${DX - 30} ${DY - 112}" fill="none" stroke="${KAGIT}" stroke-width="10" stroke-linecap="round" opacity="0.85"/>

  <!-- kelime ve okunuş -->
  <text x="${M - 12}" y="560" font-size="300" font-weight="800" letter-spacing="-12" fill="${MUREKKEP}">Ab</text>
  <text x="${M}" y="640" font-size="34" font-weight="500" fill="${GRI}">/ âb /</text>
  <line x1="${M}" y1="710" x2="${W - M}" y2="710" stroke="${CIZGI}" stroke-width="2"/>

  <!-- anlam -->
  ${label(784, 'ANLAM')}
  <text x="${M}" y="852" font-size="44" font-weight="500" fill="${MUREKKEP}">Farsça kökenli bir kelime olup</text>
  <text x="${M}" y="910" font-size="44" font-weight="500" fill="${MUREKKEP}"><tspan font-weight="800" fill="${VURGU}">“su”</tspan> demektir.</text>

  <!-- örnek -->
  ${label(1012, 'ÖRNEK')}
  <rect x="${M}" y="1040" width="4" height="152" fill="${VURGU}"/>
  <text font-size="36" font-weight="500" font-style="italic" fill="${MUREKKEP}">
    <tspan x="${M + 32}" y="1076">“Kelâm, gönülden doğmadıkça dudaklarda</tspan>
    <tspan x="${M + 32}" y="1126">kurur; gönülden doğarsa, çorak ruhlara</tspan>
    <tspan x="${M + 32}" y="1176"><tspan font-weight="700" font-style="normal" fill="${VURGU}">âb</tspan> olur.”</tspan>
  </text>

  <!-- ilgili kelimeler -->
  <line x1="${M}" y1="1262" x2="${W - M}" y2="1262" stroke="${CIZGI}" stroke-width="2"/>
  <text x="${M}" y="1322" font-size="21" font-weight="700" letter-spacing="4" fill="${VURGU}">İLGİLİ</text>
  <text x="${M + 130}" y="1322" font-size="28" font-weight="500" fill="${MUREKKEP}">abdest  ·  gülap  ·  âb-ı hayat</text>
</g>
</svg>
`;

const outDir = path.join(root, 'output/kelime');
fs.writeFileSync(path.join(outDir, 'ab-modern.svg'), svg);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.evaluate(() => document.fonts.ready);
await page.locator('svg').first().screenshot({ path: path.join(outDir, 'ab-modern.png') });
await page.addStyleTag({ content: '@page{size:1080px 1440px;margin:0} svg{display:block}' });
await page.pdf({ path: path.join(outDir, 'ab-modern.pdf'), width: `${W}px`, height: `${H}px`, printBackground: true });
await browser.close();
console.log('output/kelime/ab-modern.{svg,png,pdf}');
