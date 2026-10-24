// Instagram profil logoları: ince yuvarlak çerçeve içinde çizgi işaret, tek renk zemin;
// her işaretin bir de çerçevesiz, düz renkli illüstrasyon (renkli) sürümü var.
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
    renkler: { siyah: '#0f0d0b', kahve: '#2a1d14', lacivert: '#141c2b', renkli: 'sozluk', tirnak: 'sozlukTirnak' },
    cizim: '<path d="M12 6.5C9.5 4.8 6 4.3 2.5 5.2V18.6C6 17.8 9.5 18.3 12 20"/><path d="M12 6.5C14.5 4.8 18 4.3 21.5 5.2V18.6C18 17.8 14.5 18.3 12 20"/><path d="M12 6.5V20"/>',
  },
  // klaket: gövde, üst şeritli bant ve sol menteşeden hafif açılmış çizgili kol
  sinema: {
    dosya: 'sinema', klasor: 'sinema', cy: 11.74,
    renkler: { siyah: '#0e0e0f', bordo: '#3a1016', lacivert: '#141c2b', renkli: 'klaket' },
    cizim: '<path d="M3.5 10.5H20.5V19A1 1 0 0 1 19.5 20H4.5A1 1 0 0 1 3.5 19Z"/><path d="M3.5 13.5H20.5"/>' +
      '<path d="M6.5 13.5L8 10.5M10.5 13.5L12 10.5M14.5 13.5L16 10.5M18.5 13.5L20 10.5"/>' +
      '<path d="M3.5 10.5L20 6.4L19.3 3.5L2.8 7.6Z"/><path d="M7.6 9.3L8.9 5.9M11.8 8.3L13.1 4.9M16 7.3L17.3 3.9"/>',
  },
  // kitaplık: rafta iki dik kitap ve onlara yaslanmış üçüncüsü
  kitap: {
    dosya: 'kitap', klasor: 'kitap', cy: 12.25,
    renkler: { siyah: '#0f0d0b', yesil: '#13261d', kahve: '#2a1d14', renkli: 'kitaplik' },
    cizim: '<path d="M2.5 20H21.5"/>' +
      '<rect x="4.3" y="7" width="3.8" height="13" rx="0.5"/><path d="M4.3 9.3H8.1M4.3 16.8H8.1"/>' +
      '<rect x="8.6" y="4.5" width="4" height="15.5" rx="0.5"/><path d="M8.6 7H12.6M8.6 16.8H12.6"/>' +
      '<path d="M16.8 20L12.7 8.72L15.9 7.56L20 18.84Z"/><path d="M13.49 10.88L16.69 9.72M15.71 16.99L18.91 15.83"/>',
  },
  // satranç piyonu: yuvarlak baş, yaka, aşağı genişleyen gövde, kaide
  satranc: {
    dosya: 'satranc', klasor: 'satranc', cy: 12.1,
    renkler: { siyah: '#0f0d0b', yesil: '#1b3123', kahve: '#2e2016', renkli: 'piyon' },
    cizim: '<circle cx="12" cy="5.55" r="3.1"/>' +
      '<rect x="8.09" y="9.23" width="7.82" height="1.84" rx="0.92"/>' +
      '<path d="M9.93 11.07C9.7 13.83 8.78 16.36 6.94 18.66H17.06C15.22 16.36 14.3 13.83 14.07 11.07"/>' +
      '<rect x="5.45" y="18.66" width="13.1" height="3.1" rx="0.69"/>',
  },
  // İngilizce: çizgiyle Birleşik Krallık bayrağı (2:1); geniş artı ve köşelerden artıya inen çaprazlar
  ingilizce: {
    dosya: 'ingilizce', klasor: 'ingilizce', cy: 12,
    renkler: { siyah: '#0f0d0b', lacivert: '#141c2b', bordo: '#3a1016', renkli: 'bayrak' },
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

// Renkli sürümler: anahtar adı renkler içinde değer olarak verilir; zemin S × S'lik SVG parçası,
// cizim verilirse işaretin düz renkli illüstrasyon hâli çizgi çizimin yerine geçer.
const RENKLI = {
  // sözlük amblemi: derin bordo zemin, tek altın ton; kanat gibi açılan sayfalar ve altında katlı sayfa kenarı.
  // Küçük profil boyutlarında da seçilsin diye büyük çizilir; 'tirnak' sürümünde üstte kartlardaki gibi açılış tırnağı (“) var.
  sozluk: (tirnak = false) => {
    // virgül biçimli tırnak: alttaki yuvarlak ve yukarı kıvrılan kuyruk
    const mark = (x, y, k = 1.3) => `<path transform="translate(${x} ${y}) scale(${k})" d="M-0.95 0C-0.95 -1.7 -0.1 -2.8 1.05 -3.2L1.2 -2.6` +
      `C0.35 -2.2 0.05 -1.6 0.1 -0.9A0.95 0.95 0 1 1 -0.95 0Z" fill="#d6b06a"/>`;
    return {
      zemin: `<rect width="${S}" height="${S}" fill="#2a0e16"/>`, cerceve: null,
      olcek: tirnak ? 0.64 : 0.7, cy: tirnak ? 10.6 : 13.3,
      cizim: '<g stroke="none">' +
        '<path d="M11.6 9.1C9.3 7.6 6.1 7.2 3 8V17.2C6.1 16.5 9.3 16.9 11.6 18.3Z" fill="#d6b06a"/>' +
        '<path d="M12.4 9.1C14.7 7.6 17.9 7.2 21 8V17.2C17.9 16.5 14.7 16.9 12.4 18.3Z" fill="#c29a55"/>' +
        (tirnak ? mark(10.5, 5.9) + mark(13.7, 5.9) : '') + '</g>' +
        '<path d="M3 18.3C6.1 17.6 9.3 18 11.6 19.4M12.4 19.4C14.7 18 17.9 17.6 21 18.3" stroke="#d6b06a" stroke-width="0.7"/>',
    };
  },
  sozlukTirnak: () => RENKLI.sozluk(true),
  // klaket: perde kırmızısı zemin, siyah gövde, siyah-beyaz çizgili bant ve kol
  klaket: () => {
    const stripes = (y0, h) => [5, 9, 13, 17, 21].map((x) => `<path d="M${x} ${y0}H${x + 2}L${x + 0.6} ${y0 + h}H${x - 1.4}Z" fill="#1d1d21"/>`).join('');
    return {
      zemin: `<rect width="${S}" height="${S}" fill="#7a1520"/>`, cerceve: null, olcek: 0.58, cy: 11.7,
      cizim: '<defs><clipPath id="bant"><rect x="3.5" y="10.5" width="17" height="3"/></clipPath><clipPath id="kol"><rect x="3.5" y="7.4" width="17" height="3"/></clipPath></defs>' +
        '<g stroke="none"><rect x="3.5" y="10.5" width="17" height="9.5" rx="1" fill="#1d1d21"/>' +
        `<rect x="3.5" y="10.5" width="17" height="3" fill="#f4f1ea"/><g clip-path="url(#bant)">${stripes(10.5, 3)}</g>` +
        '<rect x="5.6" y="15.4" width="8" height="0.8" rx="0.4" fill="#4a4a52"/><rect x="5.6" y="17.4" width="5.4" height="0.8" rx="0.4" fill="#4a4a52"/>' +
        `<g transform="rotate(-14 3.5 10.4)"><rect x="3.5" y="7.4" width="17" height="3" fill="#f4f1ea"/><g clip-path="url(#kol)">${stripes(7.4, 3)}</g></g>` +
        '<circle cx="4.3" cy="10.4" r="0.85" fill="#9a9aa3"/></g>',
    };
  },
  // kitaplık: kütüphane yeşili zemin, kırmızı, mavi ve hardal sırtlı kitaplar, ahşap raf
  kitaplik: () => ({
    zemin: `<rect width="${S}" height="${S}" fill="#173d2e"/>`, cerceve: null, olcek: 0.58, cy: 12.85,
    cizim: '<g stroke="none">' +
      '<rect x="4.3" y="7" width="3.8" height="13" rx="0.4" fill="#c8553d"/><rect x="4.3" y="8.8" width="3.8" height="0.8" fill="#e8b04b"/><rect x="4.3" y="16.6" width="3.8" height="0.8" fill="#e8b04b"/>' +
      '<rect x="6.9" y="7" width="1.2" height="13" fill="#a8432f"/>' +
      '<rect x="8.6" y="4.5" width="4" height="15.5" rx="0.4" fill="#2f6d8c"/><rect x="8.6" y="6.4" width="4" height="0.8" fill="#e8d7b0"/><rect x="8.6" y="16.6" width="4" height="0.8" fill="#e8d7b0"/>' +
      '<rect x="11.4" y="4.5" width="1.2" height="15.5" fill="#255a74"/>' +
      '<path d="M16.8 20L12.7 8.72L15.9 7.56L20 18.84Z" fill="#e8b04b"/><path d="M18.85 19.25L14.75 7.97L15.9 7.56L20 18.84Z" fill="#c9922f"/>' +
      '<path d="M13.38 10.6L16.58 9.44L16.85 10.19L13.65 11.35ZM15.6 16.7L18.8 15.54L19.07 16.29L15.87 17.45Z" fill="#8a5a1c"/>' +
      '<rect x="2.5" y="20" width="19" height="1.2" rx="0.3" fill="#9a6633"/></g>',
  }),
  // piyon: çuha yeşili zemin, fildişi piyon, sağ yarısı tek tonluk gölge
  piyon: () => ({
    zemin: `<rect width="${S}" height="${S}" fill="#234d3b"/>`, cerceve: null, olcek: 0.6, cy: 12.1,
    cizim: '<defs><clipPath id="piyon"><circle cx="12" cy="5.55" r="3.1"/><rect x="8.09" y="9.23" width="7.82" height="1.84" rx="0.92"/>' +
      '<path d="M9.93 11.07C9.7 13.83 8.78 16.36 6.94 18.66H17.06C15.22 16.36 14.3 13.83 14.07 11.07Z"/><rect x="5.45" y="18.66" width="13.1" height="3.1" rx="0.69"/></clipPath></defs>' +
      '<g clip-path="url(#piyon)" stroke="none"><rect x="0" y="0" width="24" height="24" fill="#f3ead8"/><rect x="12.7" y="0" width="12" height="24" fill="#d8c9a8"/>' +
      '<rect x="0" y="18.66" width="24" height="0.6" fill="#bfae8a"/><circle cx="10.9" cy="4.6" r="0.75" fill="#ffffff" opacity="0.8"/></g>',
  }),
  // bayrak: gece laciverti zemin, gerçek renkli Birleşik Krallık bayrağı (2:1, köşeleri yuvarlatılmış)
  bayrak: () => ({
    zemin: `<rect width="${S}" height="${S}" fill="#0b1633"/>`, cerceve: null, olcek: 0.6, cy: 12,
    cizim: '<defs><clipPath id="bayrak"><rect x="1" y="6.5" width="22" height="11" rx="1"/></clipPath></defs>' +
      '<g clip-path="url(#bayrak)" stroke="none"><rect x="1" y="6.5" width="22" height="11" fill="#2a4fa8"/>' +
      '<path d="M1 6.5L23 17.5M23 6.5L1 17.5" stroke="#ffffff" stroke-width="2.2"/>' +
      '<path d="M1 6.5L23 17.5M23 6.5L1 17.5" stroke="#c8102e" stroke-width="0.75"/>' +
      '<rect x="1" y="10.17" width="22" height="3.67" fill="#ffffff"/><rect x="10.17" y="6.5" width="3.67" height="11" fill="#ffffff"/>' +
      '<rect x="1" y="10.9" width="22" height="2.2" fill="#c8103e"/><rect x="10.9" y="6.5" width="2.2" height="11" fill="#c8103e"/></g>',
  }),
  // marka işareti: düz uzay mavisi zemin, çerçevesiz, ortada büyük düz renkli gezegen (gölge yüzü, bantlar, altın halka) ışıltı ve ay
  uzay: () => {
    return {
      zemin: `<rect width="${S}" height="${S}" fill="#0c1a40"/>`,
      cerceve: null, olcek: 0.58, cy: 12,
      cizim: '<defs>' +
        '<mask id="halkaArka" maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36"><rect x="-6" y="-6" width="36" height="36" fill="#fff"/><circle cx="12" cy="12" r="5.75" fill="#000"/></mask>' +
        '<mask id="gezegenKes" maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36"><rect x="-6" y="-6" width="36" height="36" fill="#fff"/><path d="M21.5 12A9.5 3 0 0 1 2.5 12" stroke="#000" stroke-width="3.6" fill="none"/></mask>' +
        '<clipPath id="gezegen"><circle cx="12" cy="12" r="5.2"/></clipPath>' +
        '</defs><g transform="rotate(-18 12 12)" stroke="none">' +
        '<g mask="url(#gezegenKes)"><circle cx="12" cy="12" r="5.2" fill="#f4a259"/>' +
        '<g clip-path="url(#gezegen)"><path d="M5 5H19V19H5ZM5.6 11.1A5.4 5.4 0 1 0 16.4 11.1A5.4 5.4 0 1 0 5.6 11.1Z" fill="#d96f45" fill-rule="evenodd"/>' +
        '<rect x="4" y="9.2" width="16" height="1.1" fill="#ffc98a"/><rect x="4" y="13.6" width="16" height="1.3" fill="#c95f3d" opacity="0.8"/>' +
        '</g></g>' +
        '<path d="M2.5 12A9.5 3 0 0 1 21.5 12" fill="none" stroke="#e8a73f" stroke-width="1.9" stroke-linecap="butt" mask="url(#halkaArka)"/>' +
        '<path d="M21.5 12A9.5 3 0 0 1 2.5 12" fill="none" stroke="#ffd27a" stroke-width="1.9" stroke-linecap="butt"/></g>',
    };
  },
};

const ad = process.argv[2] || 'sozlukdeus';
const isaret = ISARETLER[ad];
const outDir = path.resolve(here, '../../output/logo', isaret.klasor);

// daire kırpmada rahat kalsın diye işaret ~%46 genişlikte, çerçeve yarıçapı %36
const logo = (bg) => {
  const renkli = RENKLI[bg]?.();
  const size = S * (renkli?.olcek ?? 0.46), s = size / 24, x = (S - size) / 2, y = S / 2 - s * (renkli?.cy ?? isaret.cy);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${renkli ? renkli.zemin : `<rect width="${S}" height="${S}" fill="${bg}"/>`}
${renkli?.cerceve === null ? '' : `<circle cx="${S / 2}" cy="${S / 2}" r="${S * 0.36}" fill="none" stroke="${renkli?.cerceve ?? '#ffffff'}" stroke-width="${(S * 0.009).toFixed(1)}"/>`}
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
