// sözlükdeus Instagram profil logosu: kartların altındaki kitap işareti, tek renk zemin.
//   node kelime/logo/logo.mjs  ->  output/logo/logo-<renk>.svg + .png (1080 × 1080)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const outDir = path.resolve(here, '../../output/logo');
const S = 1080;
const RENKLER = { siyah: '#0f0d0b', kahve: '#2a1d14', lacivert: '#141c2b' };

// kartlardaki işaretle aynı çizim (24 birimlik ızgara); daire kırpmada rahat kalsın diye ~%46 genişlik
const logo = (bg) => {
  const size = S * 0.46, s = size / 24, x = (S - size) / 2, y = S / 2 - s * 12.15; // çizimin dikey ortası 12.15
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect width="${S}" height="${S}" fill="${bg}"/>
<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 6.5C9.5 4.8 6 4.3 2.5 5.2V18.6C6 17.8 9.5 18.3 12 20"/><path d="M12 6.5C14.5 4.8 18 4.3 21.5 5.2V18.6C18 17.8 14.5 18.3 12 20"/><path d="M12 6.5V20"/>
</g>
</svg>
`;
};

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: S, height: S } });
for (const [ad, bg] of Object.entries(RENKLER)) {
  const svg = logo(bg);
  fs.writeFileSync(path.join(outDir, `logo-${ad}.svg`), svg);
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.locator('svg').screenshot({ path: path.join(outDir, `logo-${ad}.png`) });
}
// önizleme: profilde görüneceği gibi daire kırpılmış hâller
await page.setViewportSize({ width: 1260, height: 460 });
await page.setContent(`<body style="margin:0;background:#fff;display:flex;gap:60px;align-items:center;justify-content:center;height:460px;font:500 22px sans-serif">
${Object.keys(RENKLER).map((ad) => `<div style="text-align:center"><img src="data:image/png;base64,${fs.readFileSync(path.join(outDir, `logo-${ad}.png`)).toString('base64')}" style="width:300px;height:300px;border-radius:50%;display:block"><p>${ad}</p></div>`).join('')}</body>`);
await page.screenshot({ path: path.join(outDir, 'onizleme.png') });
await browser.close();
console.log('output/logo/');
