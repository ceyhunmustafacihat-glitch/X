// "Ab" modern kart: logonun kırmızı zemini, altın kelime ve su damlası, krem metin.
// Dev kelime, altında kökeni, ANLAM ve ÖRNEK bölümleri. Filigran ya da başka yazı yok.
//   node kelime/poster/ab-modern.mjs  ->  output/kelime/ab-modern.svg + .png + .pdf (1080 × 1440, 3:4)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const W = 1080, H = 1440, M = 96; // M: sol kenar boşluğu
// renkler profil logosundan: kırmızı zemin, açıktan koyuya altın, krem metin
const ZEMIN = '#9b1b26', KREM = '#f6ead2', ALTIN = '#e3c58a', ALTIN_A = '#ecd5a0', ALTIN_K = '#d1ad73';

const fontDir = path.join(root, 'kelime/fonts/montserrat');
const fontCss = [[500, 'normal'], [700, 'normal'], [800, 'normal'], [500, 'italic']].flatMap(([w, st]) => ['latin-ext', 'latin'].map((sub) => {
  const b64 = fs.readFileSync(path.join(fontDir, `montserrat-${sub}-${w}-${st}.woff2`)).toString('base64');
  const range = sub === 'latin' ? 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212'
    : 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF';
  return `@font-face{font-family:'Montserrat';font-style:${st};font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}`;
})).join('\n');

// geometrik su damlası: sivri tepe, yuvarlak gövde; içinden geçen üç dalga ve küçük parıltı
const DX = 790, DY = 470, DR = 140;
const damla = `M${DX} ${DY - 270}C${DX} ${DY - 270} ${DX - DR} ${DY - 110} ${DX - DR} ${DY}A${DR} ${DR} 0 0 0 ${DX + DR} ${DY}C${DX + DR} ${DY - 110} ${DX} ${DY - 270} ${DX} ${DY - 270}Z`;
const dalga = (y) => `M${DX - DR - 20} ${y}c35 -18 70 -18 105 0s70 18 105 0s70 -18 105 0`;

const label = (y, t) => `<text x="${M}" y="${y}" font-size="21" font-weight="700" letter-spacing="4" fill="${ALTIN}">${t}</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>Ab — sözlükdeus</title>
<style>${fontCss}</style>
<defs>
  <clipPath id="damla"><path d="${damla}"/></clipPath>
  <linearGradient id="altin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ALTIN_A}"/><stop offset="1" stop-color="${ALTIN_K}"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${ZEMIN}"/>

<g font-family="Montserrat, sans-serif" xml:space="preserve">
  <!-- damla -->
  <path d="${damla}" fill="url(#altin)"/>
  <g clip-path="url(#damla)" fill="none" stroke="${ZEMIN}" stroke-width="9" stroke-linecap="round">
    <path d="${dalga(DY + 10)}"/><path d="${dalga(DY + 62)}" opacity="0.75"/><path d="${dalga(DY + 114)}" opacity="0.5"/>
  </g>
  <path d="M${DX - 78} ${DY - 40}A86 86 0 0 1 ${DX - 30} ${DY - 112}" fill="none" stroke="#fbf3e2" stroke-width="10" stroke-linecap="round" opacity="0.9"/>

  <!-- kelime ve kökeni -->
  <text x="${M - 12}" y="650" font-size="300" font-weight="800" letter-spacing="-12" fill="url(#altin)">Ab</text>
  <text x="${M}" y="732" font-size="36" font-weight="500" font-style="italic" fill="${ALTIN}">Farsça kökenli</text>
  <line x1="${M}" y1="800" x2="${W - M}" y2="800" stroke="${ALTIN}" stroke-width="2" opacity="0.35"/>

  <!-- anlam -->
  ${label(880, 'ANLAM')}
  <text x="${M}" y="948" font-size="44" font-weight="500" fill="${KREM}">Farsça kökenli bir kelime olup</text>
  <text x="${M}" y="1006" font-size="44" font-weight="500" fill="${KREM}"><tspan font-weight="800" fill="${ALTIN}">“su”</tspan> demektir.</text>

  <!-- örnek -->
  ${label(1100, 'ÖRNEK')}
  <rect x="${M}" y="1128" width="4" height="152" fill="${ALTIN}"/>
  <text font-size="36" font-weight="500" font-style="italic" fill="${KREM}">
    <tspan x="${M + 32}" y="1164">“Kelâm, gönülden doğmadıkça dudaklarda</tspan>
    <tspan x="${M + 32}" y="1214">kurur; gönülden doğarsa, çorak ruhlara</tspan>
    <tspan x="${M + 32}" y="1264"><tspan font-weight="700" font-style="normal" fill="${ALTIN}">âb</tspan> olur.”</tspan>
  </text>
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
