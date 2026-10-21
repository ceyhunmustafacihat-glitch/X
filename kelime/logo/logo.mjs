// Instagram profil logoları: ince yuvarlak çerçeve içinde çizgi işaret, tek renk zemin.
//   node kelime/logo/logo.mjs            ->  output/logo/logo-<renk>.svg + .png (sözlükdeus, kitap)
//   node kelime/logo/logo.mjs sinema     ->  output/logo/sinema/sinema-<renk>.svg + .png (klaket)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const S = 1080;

// İşaretler 24 birimlik ızgarada, aynı çizgi kalınlığıyla çizilir; cy çizimin dikey ortası.
const ISARETLER = {
  sozlukdeus: {
    dosya: 'logo', klasor: '', cy: 12.15,
    renkler: { siyah: '#0f0d0b', kahve: '#2a1d14', lacivert: '#141c2b' },
    cizim: '<path d="M12 6.5C9.5 4.8 6 4.3 2.5 5.2V18.6C6 17.8 9.5 18.3 12 20"/><path d="M12 6.5C14.5 4.8 18 4.3 21.5 5.2V18.6C18 17.8 14.5 18.3 12 20"/><path d="M12 6.5V20"/>',
  },
  // klaket: gövde, üst şeritli bant ve sol menteşeden hafif açılmış çizgili kol
  sinema: {
    dosya: 'sinema', klasor: 'sinema', cy: 11.74,
    renkler: { siyah: '#0e0e0f', bordo: '#3a1016', lacivert: '#141c2b' },
    cizim: '<path d="M3.5 10.5H20.5V19A1 1 0 0 1 19.5 20H4.5A1 1 0 0 1 3.5 19Z"/><path d="M3.5 13.5H20.5"/>' +
      '<path d="M6.5 13.5L8 10.5M10.5 13.5L12 10.5M14.5 13.5L16 10.5M18.5 13.5L20 10.5"/>' +
      '<path d="M3.5 10.5L20 6.4L19.3 3.5L2.8 7.6Z"/><path d="M7.6 9.3L8.9 5.9M11.8 8.3L13.1 4.9M16 7.3L17.3 3.9"/>',
  },
};

const ad = process.argv[2] || 'sozlukdeus';
const isaret = ISARETLER[ad];
const outDir = path.resolve(here, '../../output/logo', isaret.klasor);

// daire kırpmada rahat kalsın diye işaret ~%46 genişlikte, çerçeve yarıçapı %36
const logo = (bg) => {
  const size = S * 0.46, s = size / 24, x = (S - size) / 2, y = S / 2 - s * isaret.cy;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect width="${S}" height="${S}" fill="${bg}"/>
<circle cx="${S / 2}" cy="${S / 2}" r="${S * 0.36}" fill="none" stroke="#ffffff" stroke-width="${(S * 0.009).toFixed(1)}"/>
<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
${isaret.cizim}
</g>
</svg>
`;
};

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: S, height: S } });
for (const [renk, bg] of Object.entries(isaret.renkler)) {
  const svg = logo(bg);
  fs.writeFileSync(path.join(outDir, `${isaret.dosya}-${renk}.svg`), svg);
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.locator('svg').screenshot({ path: path.join(outDir, `${isaret.dosya}-${renk}.png`) });
}
// önizleme: profilde görüneceği gibi daire kırpılmış hâller
await page.setViewportSize({ width: 1260, height: 460 });
await page.setContent(`<body style="margin:0;background:#fff;display:flex;gap:60px;align-items:center;justify-content:center;height:460px;font:500 22px sans-serif">
${Object.keys(isaret.renkler).map((renk) => `<div style="text-align:center"><img src="data:image/png;base64,${fs.readFileSync(path.join(outDir, `${isaret.dosya}-${renk}.png`)).toString('base64')}" style="width:300px;height:300px;border-radius:50%;display:block"><p>${renk}</p></div>`).join('')}</body>`);
await page.screenshot({ path: path.join(outDir, 'onizleme.png') });
await browser.close();
console.log(path.relative(path.resolve(here, '../..'), outDir) + '/');
