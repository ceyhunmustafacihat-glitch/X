// "Ab": su. Arka plan tamamen vektör: karlı dağlar, çam ormanlı vadi, kayadan
// dökülen şelale, akıntı ve berrak suyun altındaki çakıllar.
import { rng, mountains, pine } from '../sahne.mjs';

export const kelime = 'Ab';
export const tanim = [
  { t: 'Farsça kökenli bir kelime olup ' },
  { t: '"su"', b: true },
  { t: ' demektir.' },
];
export const ornek = [
  { t: '"Kelâm, gönülden doğmadıkça dudaklarda kurur; gönülden doğarsa, çorak ruhlara ' },
  { t: 'âb', b: true },
  { t: ' olur."' },
];

const f = (n) => n.toFixed(1);

export function sahne(W, H) {
  const r = rng(23);
  const out = [];

  out.push(`<defs>
  <linearGradient id="gok" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1b2433"/>
    <stop offset="0.2" stop-color="#3d4b5c"/>
    <stop offset="0.35" stop-color="#8a8f8f"/>
  </linearGradient>
  <linearGradient id="dag" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5f6b7c"/><stop offset="1" stop-color="#3a4656"/>
  </linearGradient>
  <linearGradient id="orman" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2c4238"/><stop offset="1" stop-color="#16241f"/>
  </linearGradient>
  <linearGradient id="nehir" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9fb8bd"/>
    <stop offset="0.25" stop-color="#4f7f88"/>
    <stop offset="1" stop-color="#173a44"/>
  </linearGradient>
  <linearGradient id="kaya" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3b4446"/><stop offset="1" stop-color="#1c2224"/>
  </linearGradient>
  <linearGradient id="selale" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e3f0f1" stop-opacity="0.8"/><stop offset="0.7" stop-color="#a9c8cc" stop-opacity="0.6"/><stop offset="1" stop-color="#e3f0f1" stop-opacity="0.75"/>
  </linearGradient>
  <linearGradient id="berrak" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2f6b72" stop-opacity="0.6"/>
    <stop offset="1" stop-color="#0e2a30" stop-opacity="0.4"/>
  </linearGradient>
  <linearGradient id="perde" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#04070a" stop-opacity="0.18"/>
    <stop offset="0.45" stop-color="#04070a" stop-opacity="0.34"/>
    <stop offset="0.7" stop-color="#04070a" stop-opacity="0.42"/>
    <stop offset="1" stop-color="#04070a" stop-opacity="0.35"/>
  </linearGradient>
  <radialGradient id="vinyet" cx="0.5" cy="0.48" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
</defs>`);

  // gökyüzü ve dağların ardındaki bulutlar
  const cloud = (x, y, w, c, op) => `<g fill="${c}" opacity="${op}"><rect x="${x}" y="${y - w * 0.12}" width="${w}" height="${w * 0.12}" rx="${w * 0.06}"/><circle cx="${x + w * 0.32}" cy="${y - w * 0.12}" r="${w * 0.14}"/><circle cx="${x + w * 0.58}" cy="${y - w * 0.16}" r="${w * 0.18}"/><circle cx="${x + w * 0.8}" cy="${y - w * 0.1}" r="${w * 0.1}"/></g>`;
  out.push(`<g id="gokyuzu"><rect width="${W}" height="${H}" fill="url(#gok)"/>
  ${cloud(180, 150, 300, '#56606c', 0.8)}${cloud(620, 110, 380, '#4a5462', 0.85)}${cloud(-80, 250, 280, '#9a9a94', 0.5)}${cloud(760, 240, 340, '#a8a294', 0.45)}</g>`);

  // karlı sıradağlar
  const pts = [[-60, 330, 1], [60, 250], [140, 300, 1], [260, 200], [350, 280, 1], [470, 170], [560, 262, 1], [680, 100], [800, 250, 1], [890, 180], [990, 270, 1], [1140, 300, 1]]
    .map(([x, y, v]) => ({ x, y, v: !!v }));
  const range = mountains(W, pts, 620);
  out.push(`<g id="daglar">${range.path('url(#dag)')}${range.facets('#1f2836', 0.3)}${range.snow('#e6edf2', 0.85, 110)}</g>`);

  // V biçimli ormanlı vadi
  const left = 'M-10 250C150 290 320 420 500 610L520 760H-10Z';
  const right = 'M1090 300C900 350 760 470 650 610L620 760H1090Z';
  const pines = [];
  const along = (x0, y0, x1, y1, n, h0, h1, fill) => {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = x0 + (x1 - x0) * t + (r() - 0.5) * 18, y = y0 + (y1 - y0) * t + 40 + r() * 20;
      const h = h0 + (h1 - h0) * t;
      pines.push(pine(x, y, h * (0.85 + r() * 0.3), h * 0.36, fill));
    }
  };
  along(-10, 250, 490, 600, 14, 170, 70, '#1f342c');
  along(1090, 300, 660, 600, 12, 160, 70, '#1d322a');
  out.push(`<g id="orman"><path d="${left}" fill="url(#orman)"/><path d="${right}" fill="url(#orman)"/>${pines.join('')}</g>`);

  // nehir: vadiden öne doğru genişler
  const flow = [];
  for (let i = 0; i < 22; i++) {
    const y = 640 + Math.pow(r(), 1.2) * 360, x = 420 + r() * 620, w = 40 + (y - 600) * 0.4 * r();
    flow.push(`<path d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(-6)} ${f(w)} 0" fill="none" stroke="#e9f4f4" stroke-width="${f(1.5 + (y - 600) / 250)}" stroke-linecap="round" opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`);
  }
  out.push(`<g id="nehir"><path d="M572 606Q590 596 612 606C690 650 850 700 1090 740V${H}H-10V900C200 860 380 760 470 680C505 640 540 618 572 606Z" fill="url(#nehir)"/>${flow.join('')}</g>`);

  // sağdaki büyük kaya ve nehirdeki küçük kayalar
  out.push(`<g id="kayalar-orta">
  <path d="M800 720C805 620 880 560 980 556C1050 554 1090 580 1090 610V740H800Z" fill="url(#kaya)"/>
  <path d="M830 640C860 590 920 566 990 566C940 590 890 620 860 680Z" fill="#4e595b" opacity="0.7"/>
  <path d="M804 742C860 732 960 750 1090 738" fill="none" stroke="#e9f4f4" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
  <path d="M640 760c10-30 50-40 80-30c20 8 26 22 24 34Z" fill="#283032"/>
  <path d="M520 800c8-22 40-30 62-20c14 7 18 18 16 26Z" fill="#283032"/></g>`);

  // soldaki kaya kütlesi ve üzerinden dökülen şelale
  const rock = 'M-10 330C120 340 260 400 380 470C440 505 460 570 450 650L430 900C300 930 150 940 -10 950Z';
  const moss = [[70, 372, 34, 8], [150, 396, 26, 6], [40, 610, 22, 8], [120, 780, 30, 8]]
    .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#3f5a3b" opacity="0.6"/>`).join('');
  const fall = [`<path d="M196 424Q320 440 432 492C446 600 440 720 452 862H188C200 700 188 560 196 424Z" fill="url(#selale)"/>`];
  for (let i = 0; i < 22; i++) {
    const x = 200 + i * 11 + (r() - 0.5) * 6, top = 440 + (x - 200) * 0.25 + r() * 20, bot = top + 140 + r() * 260;
    fall.push(`<path d="M${f(x)} ${f(top)}C${f(x + 3)} ${f(top + 100)} ${f(x - 3)} ${f(bot - 100)} ${f(x + 2)} ${f(bot)}" fill="none" stroke="${i % 3 ? '#ffffff' : '#7fa9b0'}" stroke-width="${f(1.5 + r() * 2.5)}" stroke-linecap="round" opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`);
  }
  const foam = [];
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI, d = r();
    const x = 330 + Math.cos(a) * 260 * d + (r() - 0.5) * 60, y = 860 - Math.sin(a) * 50 * d + r() * 70;
    foam.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(6 + r() * 26 * (1 - d * 0.6))}" fill="#eef8f8" opacity="${(0.12 + r() * 0.3).toFixed(2)}"/>`);
  }
  for (let i = 0; i < 40; i++) {
    foam.push(`<circle cx="${f(180 + r() * 380)}" cy="${f(720 + r() * 160)}" r="${f(1.5 + r() * 3)}" fill="#ffffff" opacity="${(0.4 + r() * 0.5).toFixed(2)}"/>`);
  }
  out.push(`<g id="sol-kaya-ve-selale"><path d="${rock}" fill="url(#kaya)"/>
  <path d="M-10 330C120 340 260 400 380 470L362 520C240 470 120 420 -10 420Z" fill="#4b5557" opacity="0.8"/>${moss}
  ${fall.join('')}${foam.join('')}</g>`);

  // ön plan: berrak su altındaki çakıllar ve ışık kırılmaları
  const pebbles = [];
  const tones = ['#8a7560', '#8f8a7e', '#6d726c', '#a08a6e', '#5d6460'];
  for (let i = 0; i < 60; i++) {
    const y = 1060 + r() * 380, s = 0.5 + (y - 1060) / 380;
    const x = r() * W, rx = (24 + r() * 40) * s, ry = (12 + r() * 20) * s;
    pebbles.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${tones[Math.floor(r() * tones.length)]}"/>`);
    pebbles.push(`<ellipse cx="${f(x - rx * 0.25)}" cy="${f(y - ry * 0.35)}" rx="${f(rx * 0.45)}" ry="${f(ry * 0.3)}" fill="#ffffff" opacity="0.12"/>`);
  }
  const caustics = [];
  for (let i = 0; i < 26; i++) {
    const y = 1080 + r() * 340, x = r() * W, w = 60 + r() * 140;
    caustics.push(`<path d="M${f(x)} ${f(y)}c${f(w * 0.25)} -14 ${f(w * 0.5)} 14 ${f(w * 0.75)} 0s${f(w * 0.2)} 10 ${f(w * 0.25)} 4" fill="none" stroke="#bfe8e2" stroke-width="2" opacity="${(0.15 + r() * 0.25).toFixed(2)}"/>`);
  }
  out.push(`<g id="berrak-su"><rect y="1040" width="${W}" height="${H - 1040}" fill="#17343a"/>${pebbles.join('')}
  <rect y="1040" width="${W}" height="${H - 1040}" fill="url(#berrak)"/>${caustics.join('')}
  <path d="M-10 1040C200 1030 400 1050 600 1040S900 1030 1090 1046" fill="none" stroke="#d8f0ee" stroke-width="2.5" opacity="0.35"/></g>`);

  // köşelerdeki ön plan kayaları
  out.push(`<g id="on-plan"><path d="M-10 1260C60 1220 170 1230 230 1290C270 1330 280 1400 270 ${H + 10}H-10Z" fill="#141a1b"/>
  <path d="M1090 1300C1020 1270 930 1290 890 1340C860 1380 860 1420 866 ${H + 10}H1090Z" fill="#141a1b"/></g>`);

  out.push(`<g id="karartma"><rect width="${W}" height="${H}" fill="url(#perde)"/><rect width="${W}" height="${H}" fill="url(#vinyet)"/></g>`);
  return out.join('\n');
}
