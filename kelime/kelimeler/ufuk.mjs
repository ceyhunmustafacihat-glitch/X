// "Ufuk": gökle yerin birleşir gibi göründüğü yer. Arka plan tamamen vektör:
// denize batan güneş, katmanlı bulutlar, uzak ada, yelkenli, dalga katmanları.
import { rng } from '../sahne.mjs';

export const kelime = 'Ufuk';
export const tanim = [
  { t: 'Arapça kökenli bir kelime olup ' },
  { t: '"gökle yerin birleşir gibi göründüğü yer"', b: true },
  { t: ' demektir.' },
];
export const ornek = [
  { t: '"Okudukça ' },
  { t: 'ufkun', b: true },
  { t: ' genişler; ufkun genişledikçe dünyan büyür."' },
];

const f = (n) => n.toFixed(1);

// yatay bir dalga şeridi: üst kenarı sinüs, altı düz
function wave(W, y, amp, len, phase, bottom, fill, op = 1) {
  let d = `M-20 ${f(y)}`;
  for (let x = -20; x <= W + 20; x += 20) d += `L${x} ${f(y + Math.sin((x / len) * Math.PI * 2 + phase) * amp)}`;
  return `<path d="${d}L${W + 20} ${bottom}L-20 ${bottom}Z" fill="${fill}" opacity="${op}"/>`;
}

// yuvarlak tümseklerden düz tabanlı bulut
function cloud(x, y, w, fill, op) {
  const h = w * 0.16;
  return `<g fill="${fill}" opacity="${op}"><rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}"/>` +
    `<circle cx="${f(x + w * 0.3)}" cy="${f(y - h)}" r="${f(w * 0.17)}"/><circle cx="${f(x + w * 0.55)}" cy="${f(y - h * 1.3)}" r="${f(w * 0.21)}"/>` +
    `<circle cx="${f(x + w * 0.78)}" cy="${f(y - h)}" r="${f(w * 0.13)}"/></g>`;
}

export function sahne(W, H) {
  const r = rng(11);
  const hz = 1080; // ufuk çizgisi
  const out = [];

  out.push(`<defs>
  <linearGradient id="gok" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b1430"/>
    <stop offset="0.32" stop-color="#1f2452"/>
    <stop offset="0.5" stop-color="#3a2a62"/>
    <stop offset="0.62" stop-color="#6f3f74"/>
    <stop offset="0.69" stop-color="#c2627a"/>
    <stop offset="0.75" stop-color="#ffb27f"/>
  </linearGradient>
  <radialGradient id="isik" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffe0a8" stop-opacity="0.9"/>
    <stop offset="0.35" stop-color="#ff9f74" stop-opacity="0.4"/>
    <stop offset="1" stop-color="#ff9f74" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="gunes" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff1c4"/><stop offset="1" stop-color="#ffb36b"/>
  </linearGradient>
  <linearGradient id="deniz" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c8687a"/>
    <stop offset="0.2" stop-color="#5a3a72"/>
    <stop offset="1" stop-color="#0f1029"/>
  </linearGradient>
  <linearGradient id="perde" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#05040f" stop-opacity="0.15"/>
    <stop offset="0.5" stop-color="#05040f" stop-opacity="0.3"/>
    <stop offset="0.66" stop-color="#05040f" stop-opacity="0.42"/>
    <stop offset="1" stop-color="#05040f" stop-opacity="0.45"/>
  </linearGradient>
  <radialGradient id="vinyet" cx="0.5" cy="0.48" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <clipPath id="ufukUstu"><rect width="${W}" height="${hz}"/></clipPath>
</defs>`);

  // gökyüzü, ilk yıldızlar, ışık
  out.push(`<g id="gokyuzu"><rect width="${W}" height="${hz + 2}" fill="url(#gok)"/>`);
  const stars = [];
  for (let i = 0; i < 90; i++) {
    const x = r() * W, y = r() * 560;
    stars.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${(0.7 + r() * 1.4).toFixed(2)}" fill="#fff6e3" opacity="${(Math.max(0, 1 - y / 600) * (0.3 + 0.6 * r())).toFixed(2)}"/>`);
  }
  out.push(stars.join(''));
  out.push(`<ellipse cx="540" cy="${hz}" rx="700" ry="230" fill="url(#isik)"/></g>`);

  // bulutlar: uzaktakiler açık, yakındakiler koyu
  out.push(`<g id="bulutlar">
  ${cloud(-90, 800, 340, '#5a3570', 0.85)}${cloud(810, 760, 330, '#4e3068', 0.85)}
  ${cloud(-60, 1010, 280, '#d77a7c', 0.6)}${cloud(840, 1030, 300, '#e58a78', 0.55)}
  </g>`);

  // batan güneş (yarısı ufkun altında)
  out.push(`<clipPath id="gunesDaire"><circle cx="540" cy="${hz + 18}" r="112"/></clipPath><g id="gunes" clip-path="url(#ufukUstu)"><circle cx="540" cy="${hz + 18}" r="112" fill="url(#gunes)"/><g clip-path="url(#gunesDaire)">
  ${[0, 1, 2].map((i) => `<rect x="420" y="${hz - 26 + i * 9}" width="240" height="${3 + i}" fill="#e0857a" opacity="0.8"/>`).join('')}</g></g>`);

  // uzak ada
  out.push(`<g id="ada"><path d="M0 ${hz}V1046C40 1040 70 1022 110 1018C150 1014 170 1034 205 1040C240 1046 270 1060 310 ${hz}Z" fill="#3a2550"/>
  <path d="M900 ${hz}C930 1064 960 1058 990 1060C1020 1062 1050 1066 1080 1068V${hz}Z" fill="#432a57"/></g>`);

  // kuşlar
  out.push(`<g id="kuslar">${[[700, 760, 1], [736, 744, 0.8], [770, 770, 0.65], [330, 690, 0.7]]
    .map(([x, y, s]) => `<path d="M${x - 14 * s} ${y}Q${x - 6 * s} ${y - 9 * s} ${x} ${y}Q${x + 6 * s} ${y - 9 * s} ${x + 14 * s} ${y}" fill="none" stroke="#1d1433" stroke-width="${2.2 * s}" stroke-linecap="round"/>`).join('')}</g>`);

  // deniz, güneşin yansıması, dalgalar
  const sea = [`<g id="deniz"><rect y="${hz}" width="${W}" height="${H - hz}" fill="url(#deniz)"/>`];
  for (let i = 0; i < 30; i++) {
    const y = hz + 8 + Math.pow(r(), 1.3) * 250;
    const d = y - hz;
    const w = Math.max(14, 200 - d * 0.55 + (r() - 0.5) * 80);
    const x = 540 + (r() - 0.5) * (40 + d * 0.5);
    sea.push(`<rect x="${f(x - w / 2)}" y="${f(y)}" width="${f(w)}" height="${d < 60 ? 4 : 3}" rx="1.5" fill="#ffd6a0" opacity="${(0.85 - d / 330).toFixed(2)}"/>`);
  }
  sea.push(wave(W, 1250, 6, 260, 0.4, H, '#2a1d4a', 0.75));
  sea.push(wave(W, 1310, 9, 320, 2.1, H, '#1b1538', 0.85));
  sea.push(wave(W, 1375, 12, 380, 4.0, H, '#100c26', 1));
  sea.push('</g>');
  out.push(sea.join(''));

  // yelkenli
  out.push(`<g id="yelkenli" fill="#1a1230"><path d="M300 1068H372L362 1080H312Z"/><path d="M334 1064V986L298 1062Z"/><path d="M339 1062V996L366 1062Z"/><rect x="333" y="984" width="3" height="84"/></g>`);

  out.push(`<g id="karartma"><rect width="${W}" height="${H}" fill="url(#perde)"/><rect width="${W}" height="${H}" fill="url(#vinyet)"/></g>`);
  return out.join('\n');
}
