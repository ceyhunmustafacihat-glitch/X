// "Seher": tan ağarmadan önceki vakit. Arka plan tamamen vektör: hilal, sönen
// yıldızlar, ufukta ilk ışık, katmanlı dağlar, göl ve çam siluetleri.
import { rng, ridge, mountains, pine } from '../sahne.mjs';

export const kelime = 'Seher';
export const tanim = [
  { t: 'Arapça kökenli bir kelime olup ' },
  { t: '"tan ağarmadan önceki vakit"', b: true },
  { t: ' demektir.' },
];
export const ornek = [
  { t: '"Gece ne kadar uzun sürerse sürsün, sabrın sonunda mutlaka bir ' },
  { t: 'seher', b: true },
  { t: ' doğar."' },
];

export function sahne(W, H) {
  const r = rng(7);
  const out = [];
  const shore = 1118;

  out.push(`<defs>
  <linearGradient id="gok" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#070a1f"/>
    <stop offset="0.3" stop-color="#15183d"/>
    <stop offset="0.45" stop-color="#33285a"/>
    <stop offset="0.53" stop-color="#6e4171"/>
    <stop offset="0.59" stop-color="#c46a78"/>
    <stop offset="0.65" stop-color="#f4a77f"/>
  </linearGradient>
  <radialGradient id="isik" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffd3a1" stop-opacity="0.85"/>
    <stop offset="0.4" stop-color="#f59a7e" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#f59a7e" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="ayIsik" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff1cf" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#fff1cf" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="gol" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#b3667a"/>
    <stop offset="0.25" stop-color="#4a3263"/>
    <stop offset="1" stop-color="#0d0b20"/>
  </linearGradient>
  <linearGradient id="dag1" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8f5f93"/><stop offset="1" stop-color="#b9707f"/>
  </linearGradient>
  <linearGradient id="dag2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#583c74"/><stop offset="1" stop-color="#6e4473"/>
  </linearGradient>
  <linearGradient id="dag3" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2d2250"/><stop offset="1" stop-color="#231a40"/>
  </linearGradient>
  <mask id="hilal"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="834" cy="222" r="43" fill="#000"/></mask>
  <linearGradient id="perde" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#05040f" stop-opacity="0.15"/>
    <stop offset="0.5" stop-color="#05040f" stop-opacity="0.32"/>
    <stop offset="1" stop-color="#05040f" stop-opacity="0.45"/>
  </linearGradient>
  <radialGradient id="vinyet" cx="0.5" cy="0.48" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
</defs>`);

  // gökyüzü
  out.push(`<g id="gokyuzu"><rect width="${W}" height="${H}" fill="url(#gok)"/>`);
  out.push(`<ellipse cx="540" cy="860" rx="720" ry="270" fill="url(#isik)"/></g>`);

  // yıldızlar: ufka yaklaştıkça sönüyor
  const stars = [];
  for (let i = 0; i < 170; i++) {
    const x = r() * W, y = r() * 820;
    const a = Math.max(0, 1 - y / 860) * (0.35 + 0.65 * r());
    stars.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.7 + r() * 1.7).toFixed(2)}" fill="#fff6e3" opacity="${a.toFixed(2)}"/>`);
  }
  for (const [x, y, s] of [[176, 142, 11], [954, 470, 8], [318, 318, 7], [702, 96, 9]]) {
    stars.push(`<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="#fff6e3" opacity="0.9"/>`);
  }
  out.push(`<g id="yildizlar">${stars.join('')}</g>`);

  // hilal
  out.push(`<g id="hilal-ay"><circle cx="812" cy="236" r="150" fill="url(#ayIsik)"/>
  <circle cx="812" cy="236" r="50" fill="#fff0cc" mask="url(#hilal)"/></g>`);

  // dağ katmanları (uzaktan yakına)
  const far = mountains(W, ridge(r, 9, 770, 900), shore + 10);
  const mid = mountains(W, ridge(r, 7, 860, 985), shore + 10);
  out.push(`<g id="dag-uzak">${far.path('url(#dag1)')}${far.facets('#3a2050', 0.16)}${far.snow('#ffe2c4', 0.55)}</g>`);
  out.push(`<g id="dag-orta">${mid.path('url(#dag2)')}${mid.facets('#1d1235', 0.22)}</g>`);

  // en öndeki yumuşak tepe ve üzerindeki köy (minare, ışıklı pencereler)
  const hill = `M0 1040C140 1010 250 1030 360 1052C470 1074 560 1046 680 1030C800 1014 930 1036 1080 1022V${shore + 10}H0Z`;
  const village = [];
  for (const [x, w, h] of [[700, 22, 18], [730, 26, 22], [760, 34, 26], [798, 24, 20], [828, 30, 24]]) {
    const y = 1040 - h;
    village.push(`<path d="M${x} ${y + h}V${y + 6}L${x + w / 2} ${y - 4}L${x + w} ${y + 6}V${y + h}Z" fill="#1a1333"/>`);
    village.push(`<rect x="${x + w / 2 - 3}" y="${y + 9}" width="6" height="7" rx="1" fill="#ffc66e"/>`);
  }
  village.push(`<rect x="904" y="972" width="9" height="62" fill="#1a1333"/><path d="M901 974H916L908.5 946Z" fill="#1a1333"/><rect x="900" y="998" width="17" height="4" rx="1" fill="#1a1333"/><rect x="907" y="984" width="3" height="5" fill="#ffc66e"/>`);
  village.push(`<path d="M866 1018a24 20 0 0 1 48 0Z" fill="#1a1333"/>`);
  out.push(`<g id="tepe-ve-koy"><path d="${hill}" fill="url(#dag3)"/>${village.join('')}</g>`);

  // kuşlar
  const birds = [[318, 742, 1], [352, 726, 0.8], [380, 752, 0.65], [700, 690, 0.7]]
    .map(([x, y, s]) => `<path d="M${x - 14 * s} ${y}Q${x - 6 * s} ${y - 9 * s} ${x} ${y}Q${x + 6 * s} ${y - 9 * s} ${x + 14 * s} ${y}" fill="none" stroke="#1d1433" stroke-width="${2.2 * s}" stroke-linecap="round"/>`);
  out.push(`<g id="kuslar">${birds.join('')}</g>`);

  // göl, yansıma ve ışık çizgileri
  out.push(`<g id="gol"><rect y="${shore}" width="${W}" height="${H - shore}" fill="url(#gol)"/>`);
  out.push(`<g opacity="0.28" transform="translate(0 ${2 * shore}) scale(1 -1)">${mid.path('#2b1d48')}<path d="${hill}" fill="#1a1333"/></g>`);
  const streaks = [];
  for (let i = 0; i < 26; i++) {
    const y = shore + 12 + Math.pow(r(), 1.4) * 230;
    const spread = 60 + (y - shore) * 1.3;
    const x = 540 + (r() - 0.5) * spread * 2;
    const w = 20 + r() * (90 - (y - shore) * 0.2);
    streaks.push(`<rect x="${(x - w / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(12, w).toFixed(1)}" height="3" rx="1.5" fill="#ffcf9f" opacity="${(0.75 - (y - shore) / 360).toFixed(2)}"/>`);
  }
  out.push(streaks.join('') + '</g>');

  // ön plan: kıyı ve çamlar
  const fg = ['<g id="on-plan">'];
  fg.push(`<path d="M0 1180C90 1170 180 1196 250 1250C300 1290 320 1360 330 ${H}H0Z" fill="#0b0918"/>`);
  fg.push(`<path d="M${W} 1210C980 1200 900 1226 850 1280C810 1330 800 1390 796 ${H}H${W}Z" fill="#0b0918"/>`);
  for (const [x, base, h, w] of [[40, 1215, 330, 110], [130, 1235, 250, 86], [205, 1268, 170, 62], [-20, 1300, 380, 130],
    [1040, 1230, 340, 112], [955, 1250, 240, 82], [890, 1290, 160, 58], [1100, 1320, 390, 130]]) {
    fg.push(pine(x, base, h, w, '#0b0918'));
  }
  fg.push('</g>');
  out.push(fg.join(''));

  // yazının okunması için koyulaştırma + vinyet
  out.push(`<g id="karartma"><rect width="${W}" height="${H}" fill="url(#perde)"/><rect width="${W}" height="${H}" fill="url(#vinyet)"/></g>`);
  return out.join('\n');
}
