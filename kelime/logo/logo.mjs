// Instagram profil logoları: ince yuvarlak çerçeve içinde çizgi işaret, tek renk zemin.
//   node kelime/logo/logo.mjs            ->  output/logo/logo-<renk>.svg + .png (sözlükdeus, kitap)
//   node kelime/logo/logo.mjs sinema     ->  output/logo/sinema/sinema-<renk>.svg + .png (klaket)
//   node kelime/logo/logo.mjs kitap      ->  output/logo/kitap/kitap-<renk>.svg + .png (kitaplık)
//   node kelime/logo/logo.mjs satranc    ->  output/logo/satranc/satranc-<renk>.svg + .png (piyon)
//   node kelime/logo/logo.mjs ingilizce  ->  output/logo/ingilizce/ingilizce-<renk>.svg + .png (bayrak)
//   node kelime/logo/logo.mjs astronomi  ->  output/logo/astronomi/astronomi-<renk>.svg + .png (halkalı gezegen)
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
  // kitaplık: rafta iki dik kitap ve onlara yaslanmış üçüncüsü
  kitap: {
    dosya: 'kitap', klasor: 'kitap', cy: 12.25,
    renkler: { siyah: '#0f0d0b', yesil: '#13261d', kahve: '#2a1d14' },
    cizim: '<path d="M2.5 20H21.5"/>' +
      '<rect x="4.3" y="7" width="3.8" height="13" rx="0.5"/><path d="M4.3 9.3H8.1M4.3 16.8H8.1"/>' +
      '<rect x="8.6" y="4.5" width="4" height="15.5" rx="0.5"/><path d="M8.6 7H12.6M8.6 16.8H12.6"/>' +
      '<path d="M16.8 20L12.7 8.72L15.9 7.56L20 18.84Z"/><path d="M13.49 10.88L16.69 9.72M15.71 16.99L18.91 15.83"/>',
  },
  // satranç piyonu: yuvarlak baş, yaka, aşağı genişleyen gövde, kaide
  satranc: {
    dosya: 'satranc', klasor: 'satranc', cy: 12.1,
    renkler: { siyah: '#0f0d0b', yesil: '#1b3123', kahve: '#2e2016' },
    cizim: '<circle cx="12" cy="5.55" r="3.1"/>' +
      '<rect x="8.09" y="9.23" width="7.82" height="1.84" rx="0.92"/>' +
      '<path d="M9.93 11.07C9.7 13.83 8.78 16.36 6.94 18.66H17.06C15.22 16.36 14.3 13.83 14.07 11.07"/>' +
      '<rect x="5.45" y="18.66" width="13.1" height="3.1" rx="0.69"/>',
  },
  // İngilizce: çizgiyle Birleşik Krallık bayrağı (2:1); geniş artı ve köşelerden artıya inen çaprazlar
  ingilizce: {
    dosya: 'ingilizce', klasor: 'ingilizce', cy: 12,
    renkler: { siyah: '#0f0d0b', lacivert: '#141c2b', bordo: '#3a1016' },
    cizim: '<rect x="1" y="6.5" width="22" height="11" rx="1"/>' +
      '<path d="M10.5 6.5V10.5H1M13.5 6.5V10.5H23M10.5 17.5V13.5H1M13.5 17.5V13.5H23"/>' +
      '<path d="M1.7 6.85L9 10.5M22.3 6.85L15 10.5M1.7 17.15L9 13.5M22.3 17.15L15 13.5"/>',
  },
  // astronomi: halkalı gezegen (halkanın arkası gezegenin ardında, önü üstünden geçer), ışıltı ve yıldız
  astronomi: {
    dosya: 'astronomi', klasor: 'astronomi', cy: 11.6,
    renkler: { siyah: '#0f0d0b', lacivert: '#0f1630', mor: '#1e1533', uzay: 'uzay' },
    cizim: '<defs>' +
      '<mask id="halkaArka" maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36"><rect x="-6" y="-6" width="36" height="36" fill="#fff"/><circle cx="12" cy="12" r="6.1" fill="#000"/></mask>' +
      '<mask id="gezegenKes" maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36"><rect x="-6" y="-6" width="36" height="36" fill="#fff"/><path d="M21.5 12A9.5 3 0 0 1 2.5 12" stroke="#000" stroke-width="3.6" fill="none"/></mask>' +
      '</defs><g transform="rotate(-18 12 12)">' +
      '<circle cx="12" cy="12" r="5.2" mask="url(#gezegenKes)"/>' +
      '<path d="M2.5 12A9.5 3 0 0 1 21.5 12" mask="url(#halkaArka)"/><path d="M21.5 12A9.5 3 0 0 1 2.5 12"/></g>' +
      '<path d="M19.6 1.8Q19.6 4 21.8 4Q19.6 4 19.6 6.2Q19.6 4 17.4 4Q19.6 4 19.6 1.8Z" fill="#ffffff" stroke-width="0.6"/><circle cx="4.2" cy="19.4" r="0.6" fill="#ffffff" stroke="none"/>',
  },
};

// Renkli zeminler: anahtar adı renkler içinde değer olarak verilir; zemin S × S'lik SVG parçası,
// cizim verilirse işaretin renkli hâli tek renkli çizimin yerine geçer.
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const RENKLI = {
  // derin uzay: mor çekirdek, pembe ve camgöbeği nebula, yıldızlar; gezegen sıcak tonlu, halka altın
  uzay: () => {
    const r = rng(9), stars = [];
    for (let i = 0; i < 170; i++) {
      stars.push(`<circle cx="${(r() * S).toFixed(1)}" cy="${(r() * S).toFixed(1)}" r="${(0.8 + r() * 1.9).toFixed(2)}" fill="#ffffff" opacity="${(0.25 + r() * 0.65).toFixed(2)}"/>`);
    }
    for (const [x, y, k] of [[214, 252, 14], [862, 236, 10], [176, 760, 9], [892, 812, 12], [420, 150, 7]]) {
      stars.push(`<path d="M${x} ${y - k}Q${x} ${y} ${x + k} ${y}Q${x} ${y} ${x} ${y + k}Q${x} ${y} ${x - k} ${y}Q${x} ${y} ${x} ${y - k}Z" fill="#fff6dc" opacity="0.9"/>`);
    }
    return {
      zemin: `<defs>
<radialGradient id="uzayZemin" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#3b2a7a"/><stop offset="0.45" stop-color="#1a1748"/><stop offset="1" stop-color="#060818"/></radialGradient>
<radialGradient id="nebula" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="pembe" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#d4508f" stop-opacity="0.45"/><stop offset="1" stop-color="#d4508f" stop-opacity="0"/></radialGradient>
<radialGradient id="camgobegi" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#2fb0d6" stop-opacity="0.35"/><stop offset="1" stop-color="#2fb0d6" stop-opacity="0"/></radialGradient>
<radialGradient id="sicak" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f3a06e" stop-opacity="0.35"/><stop offset="1" stop-color="#f3a06e" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${S}" height="${S}" fill="url(#uzayZemin)"/>
<ellipse cx="300" cy="300" rx="420" ry="280" fill="url(#pembe)" transform="rotate(-25 300 300)"/>
<ellipse cx="800" cy="820" rx="460" ry="300" fill="url(#camgobegi)" transform="rotate(-25 800 820)"/>
<ellipse cx="540" cy="548" rx="280" ry="280" fill="url(#sicak)"/>
${stars.join('')}`,
      cizim: '<defs>' +
        '<mask id="halkaArka" maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36"><rect x="-6" y="-6" width="36" height="36" fill="#fff"/><circle cx="12" cy="12" r="6.1" fill="#000"/></mask>' +
        '<mask id="gezegenKes" maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36"><rect x="-6" y="-6" width="36" height="36" fill="#fff"/><path d="M21.5 12A9.5 3 0 0 1 2.5 12" stroke="#000" stroke-width="3.6" fill="none"/></mask>' +
        '<linearGradient id="gezegenRenk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd59a"/><stop offset="0.55" stop-color="#f08a6c"/><stop offset="1" stop-color="#a8437a"/></linearGradient>' +
        '</defs><g transform="rotate(-18 12 12)">' +
        '<circle cx="12" cy="12" r="5.2" fill="url(#gezegenRenk)" stroke="#ffe0bd" mask="url(#gezegenKes)"/>' +
        '<path d="M2.5 12A9.5 3 0 0 1 21.5 12" stroke="#ffd38a" mask="url(#halkaArka)"/><path d="M21.5 12A9.5 3 0 0 1 2.5 12" stroke="#ffd38a"/></g>' +
        '<path d="M19.6 1.8Q19.6 4 21.8 4Q19.6 4 19.6 6.2Q19.6 4 17.4 4Q19.6 4 19.6 1.8Z" fill="#fff3c4" stroke="#fff3c4" stroke-width="0.6"/><circle cx="4.2" cy="19.4" r="0.6" fill="#ffffff" stroke="none"/>',
    };
  },
};

const ad = process.argv[2] || 'sozlukdeus';
const isaret = ISARETLER[ad];
const outDir = path.resolve(here, '../../output/logo', isaret.klasor);

// daire kırpmada rahat kalsın diye işaret ~%46 genişlikte, çerçeve yarıçapı %36
const logo = (bg) => {
  const size = S * 0.46, s = size / 24, x = (S - size) / 2, y = S / 2 - s * isaret.cy;
  const renkli = RENKLI[bg]?.();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${renkli ? renkli.zemin : `<rect width="${S}" height="${S}" fill="${bg}"/>`}
<circle cx="${S / 2}" cy="${S / 2}" r="${S * 0.36}" fill="none" stroke="#ffffff" stroke-width="${(S * 0.009).toFixed(1)}"/>
<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
${renkli?.cizim ?? isaret.cizim}
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
await page.setViewportSize({ width: Object.keys(isaret.renkler).length * 360 + 180, height: 460 });
await page.setContent(`<body style="margin:0;background:#fff;display:flex;gap:60px;align-items:center;justify-content:center;height:460px;font:500 22px sans-serif">
${Object.keys(isaret.renkler).map((renk) => `<div style="text-align:center"><img src="data:image/png;base64,${fs.readFileSync(path.join(outDir, `${isaret.dosya}-${renk}.png`)).toString('base64')}" style="width:300px;height:300px;border-radius:50%;display:block"><p>${renk}</p></div>`).join('')}</body>`);
await page.screenshot({ path: path.join(outDir, 'onizleme.png') });
await browser.close();
console.log(path.relative(path.resolve(here, '../..'), outDir) + '/');
