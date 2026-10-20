// "Aba": yünden kalın, kaba kumaş ve ondan yapılan üst giysi. Arka plan tamamen
// vektör: loş oda, ahşap askılıkta dokuma aba, toprak küp, desenli kilim.
import { rng } from '../sahne.mjs';

export const kelime = 'Aba';
export const tanim = [
  { t: 'Yünden yapılan kalın ve kaba ' },
  { t: 'kumaş', b: true },
  { t: ' veya bu kumaştan üretilen geleneksel üst ' },
  { t: 'giysi', b: true },
  { t: '.' },
];
export const ornek = [
  { t: '“Yaşlı derviş, sırtındaki eski ' },
  { t: 'abasına', b: true },
  { t: ' sarınarak soğuk kış gecesinde ağır adımlarla yoluna devam etti.”' },
];

const f = (n) => n.toFixed(1);

const ABA = 'M478 158C392 172 318 228 276 320C238 404 214 580 202 790C236 816 274 812 302 786' +
  'C300 940 292 1100 298 1250C400 1266 700 1266 818 1250C824 1100 816 940 810 786C838 812 878 816 910 790' +
  'C896 580 870 404 832 320C790 228 712 172 612 158C590 176 500 176 478 158Z';

export function sahne(W, H) {
  const r = rng(5);
  const out = [];

  out.push(`<defs>
  <linearGradient id="duvar" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1a1714"/><stop offset="0.75" stop-color="#14110e"/><stop offset="1" stop-color="#0e0c0a"/>
  </linearGradient>
  <radialGradient id="isik" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#7d6650" stop-opacity="0.7"/><stop offset="0.5" stop-color="#4a3c2f" stop-opacity="0.3"/><stop offset="1" stop-color="#4a3c2f" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="kumas" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#2a2119"/><stop offset="0.28" stop-color="#5a4635"/><stop offset="0.5" stop-color="#6a5442"/>
    <stop offset="0.72" stop-color="#554233"/><stop offset="1" stop-color="#261e17"/>
  </linearGradient>
  <linearGradient id="kumasIsik" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8a735c" stop-opacity="0.28"/><stop offset="0.45" stop-color="#8a735c" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/>
  </linearGradient>
  <linearGradient id="ahsap" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#5a4330"/><stop offset="0.45" stop-color="#3d2d20"/><stop offset="1" stop-color="#211810"/>
  </linearGradient>
  <radialGradient id="kup" cx="0.35" cy="0.35" r="0.75">
    <stop offset="0" stop-color="#4a3f36"/><stop offset="0.6" stop-color="#2a231e"/><stop offset="1" stop-color="#14110e"/>
  </radialGradient>
  <linearGradient id="zemin" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#191511"/><stop offset="1" stop-color="#0d0b09"/>
  </linearGradient>
  <clipPath id="abaKes"><path d="${ABA}"/></clipPath>
  <clipPath id="kilimKes"><path d="M150 1150H930L1180 ${H}H-100Z"/></clipPath>
  <linearGradient id="perde" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.05"/><stop offset="0.5" stop-color="#000" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/>
  </linearGradient>
  <radialGradient id="vinyet" cx="0.5" cy="0.45" r="0.75">
    <stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/>
  </radialGradient>
</defs>`);

  // oda: duvar, köşe, üstten düşen loş ışık, zemin
  out.push(`<g id="oda"><rect width="${W}" height="${H}" fill="url(#duvar)"/>
  <path d="M0 0H210V1150L0 1210Z" fill="#100e0b" opacity="0.7"/><line x1="210" y1="0" x2="210" y2="1150" stroke="#2a241e" stroke-width="2"/>
  <ellipse cx="560" cy="560" rx="620" ry="760" fill="url(#isik)"/>
  <path d="M0 1210L210 1150H${W}V${H}H0Z" fill="url(#zemin)"/></g>`);

  // kilim: perspektifli, kenar şeritleri ve baklava motifleri
  const rug = [`<path d="M150 1150H930L1180 ${H}H-100Z" fill="#2a1e16"/>`];
  const band = (y, h, c, op) => rug.push(`<rect x="-200" y="${y}" width="1480" height="${h}" fill="${c}" opacity="${op}"/>`);
  band(1160, 6, '#6a4a32', 0.6); band(1176, 3, '#8a6446', 0.4); band(1420, 6, '#6a4a32', 0.5);
  for (let row = 0; row < 5; row++) {
    const y = 1205 + row * 46 + row * row * 3, s = 0.7 + row * 0.14;
    const n = 9 + row, x0 = 150 - row * 52, x1 = 930 + row * 52;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * (i / n), w = 22 * s, h = 14 * s;
      const c = (i + row) % 2 ? '#7a5236' : '#5a3d2a';
      rug.push(`<path d="M${f(x)} ${f(y - h)}L${f(x + w)} ${f(y)}L${f(x)} ${f(y + h)}L${f(x - w)} ${f(y)}Z" fill="${c}" opacity="0.55"/>`);
      rug.push(`<path d="M${f(x)} ${f(y - h * 0.4)}L${f(x + w * 0.4)} ${f(y)}L${f(x)} ${f(y + h * 0.4)}L${f(x - w * 0.4)} ${f(y)}Z" fill="#a07a58" opacity="0.35"/>`);
    }
  }
  for (let i = 0; i < 260; i++) rug.push(`<rect x="${f(-100 + r() * 1280)}" y="${f(1150 + r() * 290)}" width="${f(2 + r() * 6)}" height="1.5" fill="#000" opacity="${(0.15 + r() * 0.25).toFixed(2)}"/>`);
  out.push(`<g id="kilim"><g clip-path="url(#kilimKes)">${rug.join('')}</g></g>`);

  // toprak küp (solda)
  out.push(`<g id="kup"><ellipse cx="150" cy="1205" rx="140" ry="18" fill="#000" opacity="0.5"/>
  <path d="M96 862H204C206 890 214 900 236 920C276 960 290 1020 282 1080C272 1150 220 1200 150 1204C80 1200 28 1150 18 1080C10 1020 24 960 64 920C86 900 94 890 96 862Z" fill="url(#kup)"/>
  <ellipse cx="150" cy="862" rx="62" ry="12" fill="#3d332b"/><ellipse cx="150" cy="862" rx="46" ry="7" fill="#0c0a08"/>
  <path d="M40 990C110 1004 190 1004 262 990M30 1060C110 1076 194 1076 272 1060" fill="none" stroke="#14110e" stroke-width="3" opacity="0.6"/>
  <path d="M70 950C52 990 46 1050 60 1110" fill="none" stroke="#6a5a4c" stroke-width="5" stroke-linecap="round" opacity="0.35"/></g>`);

  // ahşap askılık: ayak, direk, üst kol, askı
  out.push(`<g id="askilik">
  <path d="M410 1312H690L720 1346H380Z" fill="#2c2017"/><path d="M380 1346H720V1360H380Z" fill="#17110c"/>
  <rect x="527" y="40" width="28" height="1290" fill="url(#ahsap)"/>
  <rect x="400" y="44" width="262" height="30" fill="url(#ahsap)"/><rect x="400" y="44" width="262" height="5" fill="#6e5440" opacity="0.6"/>
  <rect x="404" y="40" width="24" height="100" fill="url(#ahsap)"/>
  <path d="M548 74V100C548 110 560 112 560 102" fill="none" stroke="#7a6a5a" stroke-width="4" stroke-linecap="round"/>
  <path d="M548 112L430 168M548 112L666 168" stroke="#3a2c20" stroke-width="10" stroke-linecap="round"/></g>`);

  // aba: gövde, ışık, dokuma dokusu, kıvrımlar, örgü yaka ve şeritler
  const tex = [];
  for (let x = 196; x < 910; x += 5) {
    const c = r() > 0.5 ? '#000' : '#9a8068';
    let d = `M${f(x)} 150`;
    for (let y = 150; y <= 1260; y += 40) d += `L${f(x + Math.sin(y * 0.05 + x) * 1.6)} ${y}`;
    tex.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(0.8 + r() * 1.4)}" opacity="${(0.08 + r() * 0.14).toFixed(2)}"/>`);
  }
  for (let i = 0; i < 90; i++) {
    const y = 170 + r() * 1080, x = 200 + r() * 700, w = 20 + r() * 80;
    tex.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="1.6" fill="${r() > 0.5 ? '#000' : '#a58a70'}" opacity="${(0.12 + r() * 0.15).toFixed(2)}"/>`);
  }
  // omuzlardan aşağı çapraz inen dökümler ve gövdedeki yumuşak kıvrımlar
  const folds = [
    'M420 200C360 330 300 520 250 780', 'M470 190C430 360 380 560 330 790', 'M660 190C700 360 740 560 790 790', 'M700 200C760 330 820 520 870 780',
    'M450 260C424 560 404 900 402 1270', 'M630 260C670 560 706 900 712 1270',
  ].map((d, i) => `<path d="${d}" fill="none" stroke="#120e0a" stroke-width="${i < 4 ? 30 : 22}" stroke-linecap="round" opacity="0.32"/>` +
    `<path d="${d}" fill="none" stroke="#a88b6e" stroke-width="5" stroke-linecap="round" opacity="0.14" transform="translate(${i % 2 ? 18 : -18} 0)"/>`);
  const trims = [];
  for (const [y0, y1] of [[1206, 1214], [1222, 1228]]) trims.push(`<rect x="290" y="${y0}" width="540" height="${y1 - y0}" fill="#1a140f" opacity="0.8"/>`);
  for (const x of [514, 566]) {
    trims.push(`<rect x="${x - 7}" y="176" width="14" height="1070" fill="#241c15"/>`);
    for (let y = 182; y < 1240; y += 14) trims.push(`<path d="M${x - 6} ${y}L${x} ${y + 7}L${x + 6} ${y}" fill="none" stroke="#7a634e" stroke-width="1.6" opacity="0.5"/>`);
  }
  // kol uçlarında koyu dokuma şerit
  trims.push(`<path d="M202 790C236 816 274 812 302 786M910 790C878 816 838 812 810 786" fill="none" stroke="#1a140f" stroke-width="14"/>`);
  trims.push(`<path d="M206 774C238 798 272 796 300 772M906 774C876 798 840 796 812 772" fill="none" stroke="#8a725c" stroke-width="2" stroke-dasharray="4 6" opacity="0.5"/>`);
  out.push(`<g id="aba"><path d="${ABA}" fill="#000" opacity="0.45" transform="translate(26 18)"/>
  <path d="${ABA}" fill="url(#kumas)"/>
  <g clip-path="url(#abaKes)">
    <path d="M540 176L522 520H558Z" fill="#100c09"/>
    ${tex.join('')}${folds.join('')}${trims.join('')}
    <rect width="${W}" height="${H}" fill="url(#kumasIsik)"/>
  </g>
  <path d="M478 158C500 176 590 176 612 158" fill="none" stroke="#1d1611" stroke-width="16" stroke-linecap="round"/>
  <path d="M478 158C500 176 590 176 612 158" fill="none" stroke="#8a725c" stroke-width="2" stroke-dasharray="5 6" opacity="0.6"/></g>`);

  out.push(`<g id="karartma"><rect width="${W}" height="${H}" fill="url(#perde)"/><rect width="${W}" height="${H}" fill="url(#vinyet)"/></g>`);
  return out.join('\n');
}
