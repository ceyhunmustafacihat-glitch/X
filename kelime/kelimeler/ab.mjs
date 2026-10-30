// "Ab": su. Arka plan tamamen vektör: akşam ışığında karlı sıradağlar, katmanlı çam
// ormanı, iki basamaklı şelale ve sisi, vadiden akan nehir, berrak sudaki çakıllar.
import { rng, pine } from '../sahne.mjs';

export const kelime = 'Ab';
export const koken = 'Farsça';
export const tanim = [
  { t: 'Su', b: true },
  { t: '; mecaz anlamda parlaklık, tazelik.' },
];
export const ornek = [
  { t: '"Kelâm, gönülden doğmadıkça dudaklarda kurur; gönülden doğarsa, çorak ruhlara ' },
  { t: 'âb', b: true },
  { t: ' olur."' },
];

const f = (n) => n.toFixed(1);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// zirve/vadi dizisinden dağ: gölgeli sol yüz, ışık alan sağ yüz, tırtıklı kar
function range(pts, base, c) {
  const body = `<path d="M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}L${pts.at(-1)[0]} ${base}L${pts[0][0]} ${base}Z" fill="${c.body}"/>`;
  const faces = [], snow = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], l = pts[i - 1], r = pts[i + 1];
    if (p[1] > l[1] || p[1] > r[1]) continue; // yalnız zirveler
    const foot = [p[0] - 6, Math.min(base, Math.max(l[1], r[1]) + 70)];
    faces.push(`<path d="M${f(p[0])} ${f(p[1])}L${f(l[0])} ${f(l[1])}L${f(foot[0])} ${f(foot[1])}Z" fill="${c.shade}" opacity="${c.shadeOp}"/>`);
    faces.push(`<path d="M${f(p[0])} ${f(p[1])}L${f(r[0])} ${f(r[1])}L${f(foot[0])} ${f(foot[1])}Z" fill="${c.lit}" opacity="${c.litOp}"/>`);
    if (!c.snow) continue;
    const depth = Math.min(0.42, 70 / Math.max(40, Math.min(l[1], r[1]) - p[1]) * 0.42);
    const a = lerp(p, l, depth), b = lerp(p, r, depth * 0.85);
    const zig = [lerp(a, b, 0.2), lerp(a, b, 0.4), lerp(a, b, 0.6), lerp(a, b, 0.8)];
    const mid = [p[0] - 2, (a[1] + b[1]) / 2 + 14];
    snow.push(`<path d="M${f(p[0])} ${f(p[1])}L${f(a[0])} ${f(a[1])}L${f(zig[0][0])} ${f(zig[0][1] - 12)}L${f(zig[1][0])} ${f(zig[1][1] + 10)}L${f(mid[0])} ${f(mid[1] - 18)}L${f(p[0])} ${f(p[1])}Z" fill="${c.snowShade}"/>`);
    snow.push(`<path d="M${f(p[0])} ${f(p[1])}L${f(mid[0])} ${f(mid[1] - 18)}L${f(zig[2][0])} ${f(zig[2][1] + 12)}L${f(zig[3][0])} ${f(zig[3][1] - 8)}L${f(b[0])} ${f(b[1])}Z" fill="${c.snow}"/>`);
  }
  return body + faces.join('') + snow.join('');
}

// ışığı alttan alan, yumuşak kenarlı bulut
function cloud(id, x, y, w) {
  const h = w * 0.13;
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(y - h * 2.6)}" x2="0" y2="${f(y)}">
    <stop offset="0" stop-color="#465066"/><stop offset="0.6" stop-color="#6c6a75"/><stop offset="1" stop-color="#d8a27c"/></linearGradient>
  <g fill="url(#${id})"><rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}"/>
  <circle cx="${f(x + w * 0.26)}" cy="${f(y - h)}" r="${f(w * 0.13)}"/><circle cx="${f(x + w * 0.47)}" cy="${f(y - h * 1.5)}" r="${f(w * 0.19)}"/>
  <circle cx="${f(x + w * 0.7)}" cy="${f(y - h * 1.1)}" r="${f(w * 0.14)}"/><circle cx="${f(x + w * 0.86)}" cy="${f(y - h * 0.8)}" r="${f(w * 0.09)}"/></g>`;
}

export function sahne(W, H) {
  const r = rng(41);
  const out = [];

  out.push(`<defs>
  <linearGradient id="gok" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#121a2a"/>
    <stop offset="0.07" stop-color="#26334b"/>
    <stop offset="0.12" stop-color="#5d6175"/>
    <stop offset="0.17" stop-color="#c3937a"/>
    <stop offset="0.22" stop-color="#e8b88a"/>
  </linearGradient>
  <radialGradient id="gunIsigi" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffe0ad" stop-opacity="0.75"/>
    <stop offset="0.45" stop-color="#f3b07f" stop-opacity="0.25"/>
    <stop offset="1" stop-color="#f3b07f" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="sis" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c9b9ae" stop-opacity="0"/><stop offset="0.6" stop-color="#c9b9ae" stop-opacity="0.3"/><stop offset="1" stop-color="#c9b9ae" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="yamac" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2b4038"/><stop offset="1" stop-color="#13201c"/>
  </linearGradient>
  <linearGradient id="nehir" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c7cfc8"/>
    <stop offset="0.12" stop-color="#7fa3a6"/>
    <stop offset="0.5" stop-color="#3d6c75"/>
    <stop offset="1" stop-color="#1b434c"/>
  </linearGradient>
  <linearGradient id="selale" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f4fbfb" stop-opacity="0.95"/>
    <stop offset="0.55" stop-color="#b9d6d8" stop-opacity="0.8"/>
    <stop offset="1" stop-color="#f4fbfb" stop-opacity="0.9"/>
  </linearGradient>
  <radialGradient id="buhar" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#f2fafa" stop-opacity="0.7"/>
    <stop offset="0.5" stop-color="#e2f1f1" stop-opacity="0.3"/>
    <stop offset="1" stop-color="#e2f1f1" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="kaya" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#424b4d"/><stop offset="1" stop-color="#1c2325"/>
  </linearGradient>
  <linearGradient id="berrak" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2d6a70" stop-opacity="0.55"/>
    <stop offset="1" stop-color="#0d2a30" stop-opacity="0.45"/>
  </linearGradient>
  <radialGradient id="cakil" cx="0.38" cy="0.32" r="0.75">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.25"/>
  </radialGradient>
  <linearGradient id="perde" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#04070a" stop-opacity="0.18"/>
    <stop offset="0.45" stop-color="#04070a" stop-opacity="0.3"/>
    <stop offset="0.7" stop-color="#04070a" stop-opacity="0.36"/>
    <stop offset="1" stop-color="#04070a" stop-opacity="0.3"/>
  </linearGradient>
  <radialGradient id="vinyet" cx="0.5" cy="0.48" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
</defs>`);

  // gökyüzü, dağların ardından sızan akşam ışığı, bulutlar
  out.push(`<g id="gokyuzu"><rect width="${W}" height="${H}" fill="url(#gok)"/>
  <ellipse cx="780" cy="230" rx="520" ry="240" fill="url(#gunIsigi)"/>
  ${cloud('b1', 160, 150, 360)}${cloud('b2', 600, 108, 440)}${cloud('b3', -120, 236, 300)}${cloud('b4', 820, 230, 320)}</g>`);

  // uzak sıradağlar (açık, puslu) ve öndeki karlı dağlar
  out.push(`<g id="uzak-daglar">${range(
    [[-40, 300], [70, 236], [150, 286], [250, 222], [330, 270], [420, 232], [500, 272], [560, 250], [640, 280], [760, 226], [850, 266], [960, 214], [1040, 262], [1120, 240]],
    560, { body: '#7c809a', shade: '#59607b', shadeOp: 0.6, lit: '#d7b3a0', litOp: 0.35, snow: '#f1ece8', snowShade: '#b9bccb' })}</g>`);
  out.push(`<g id="karli-daglar">${range(
    [[-60, 360], [60, 268], [140, 330], [250, 210], [360, 312], [470, 196], [540, 268], [640, 92], [760, 280], [860, 196], [960, 300], [1040, 238], [1140, 330]],
    640, { body: '#4c5670', shade: '#2a3148', shadeOp: 0.75, lit: '#c9a28e', litOp: 0.4, snow: '#f4efea', snowShade: '#a9b1c4' })}
  <rect y="380" width="${W}" height="230" fill="url(#sis)"/></g>`);

  // V biçimli ormanlı vadi: uzak sıra açık, yakın sıra koyu çamlar
  const pines = [];
  const along = (x0, y0, x1, y1, n, h0, h1, fill, jitter = 18) => {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = x0 + (x1 - x0) * t + (r() - 0.5) * jitter, y = y0 + (y1 - y0) * t + 30 + r() * 16;
      const h = (h0 + (h1 - h0) * t) * (0.85 + r() * 0.3);
      pines.push(pine(x, y, h, h * 0.34, fill));
    }
  };
  along(-20, 330, 470, 560, 18, 120, 60, '#34504a', 10);
  along(1100, 360, 680, 560, 16, 110, 60, '#304b45', 10);
  const slopes = `<path d="M-10 380C150 400 330 480 500 610L520 760H-10Z" fill="url(#yamac)"/><path d="M1090 400C910 420 760 500 650 610L620 760H1090Z" fill="url(#yamac)"/>`;
  const far = pines.splice(0);
  along(-20, 380, 480, 600, 15, 190, 80, '#18291f');
  along(1100, 400, 660, 600, 13, 180, 80, '#172820');
  out.push(`<g id="orman">${far.join('')}${slopes}${pines.join('')}</g>`);

  // nehir: vadiden öne doğru genişler, akıntı çizgileri ve köpük
  const flow = [];
  for (let i = 0; i < 26; i++) {
    const y = 640 + Math.pow(r(), 1.15) * 380, x = 430 + r() * 620, w = 40 + (y - 600) * 0.45 * r();
    flow.push(`<path d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(-5 - r() * 4)} ${f(w)} 0" fill="none" stroke="#eef7f6" stroke-width="${f(1.4 + (y - 600) / 260)}" stroke-linecap="round" opacity="${(0.2 + r() * 0.35).toFixed(2)}"/>`);
  }
  out.push(`<g id="nehir"><path d="M574 606Q592 596 614 606C690 650 850 700 1090 740V1060H-10V900C200 860 380 760 470 680C505 640 540 618 574 606Z" fill="url(#nehir)"/>${flow.join('')}
  <path d="M604 612C640 640 700 668 760 690" fill="none" stroke="#f4fbfa" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/></g>`);

  // sağdaki büyük kaya ve nehirdeki taşlar (yosunlu, ışık alan kenarlı)
  out.push(`<g id="kayalar-orta">
  <path d="M800 742C800 640 880 566 984 560C1050 556 1090 584 1090 612V760H800Z" fill="url(#kaya)"/>
  <path d="M836 650C866 596 924 570 994 568C944 592 892 626 864 692Z" fill="#5b6567" opacity="0.75"/>
  <path d="M960 566C1010 562 1060 574 1090 600V586C1066 566 1020 556 980 558Z" fill="#c9a28e" opacity="0.35"/>
  <ellipse cx="920" cy="590" rx="44" ry="10" fill="#3e5a3b" opacity="0.7"/>
  <path d="M800 744C862 732 960 752 1090 738" fill="none" stroke="#eef7f6" stroke-width="3.5" stroke-linecap="round" opacity="0.45"/>
  <path d="M638 764c10-32 52-42 84-32c20 8 26 22 24 34Z" fill="#283133"/><path d="M652 744c12-14 34-18 52-12" fill="none" stroke="#6b7577" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M518 804c8-22 42-30 64-20c14 7 18 18 16 26Z" fill="#283133"/><path d="M630 768c34-6 70-4 104 4M512 808c30-6 60-4 88 4" fill="none" stroke="#eef7f6" stroke-width="2.5" stroke-linecap="round" opacity="0.45"/></g>`);

  // soldaki kaya basamakları ve iki basamaklı şelale
  const cliff = 'M-10 360C110 366 240 400 360 452C420 478 452 520 456 580C460 680 446 800 440 900C300 930 150 942 -10 950Z';
  const fallTop = 'M196 446Q300 456 380 486C388 520 392 560 398 600H190C192 550 192 500 196 446Z';
  const fallBot = 'M170 640Q300 628 420 640C432 720 436 790 452 866H160C166 790 166 710 170 640Z';
  const streaks = [];
  const streak = (x0, x1, y0, y1, n) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * (i / (n - 1)) + (r() - 0.5) * 6, top = y0 + r() * 24, bot = top + (y1 - y0) * (0.4 + r() * 0.55);
      streaks.push(`<path d="M${f(x)} ${f(top)}C${f(x + 3)} ${f(top + 60)} ${f(x - 3)} ${f(bot - 60)} ${f(x + 2)} ${f(bot)}" fill="none" stroke="${i % 3 ? '#ffffff' : '#7ea7ad'}" stroke-width="${f(1.4 + r() * 2.4)}" stroke-linecap="round" opacity="${(0.25 + r() * 0.4).toFixed(2)}"/>`);
    }
  };
  streak(204, 384, 456, 600, 15);
  streak(180, 436, 648, 866, 20);
  const drops = [];
  for (let i = 0; i < 46; i++) {
    drops.push(`<circle cx="${f(150 + r() * 360)}" cy="${f(800 + r() * 90)}" r="${f(1.5 + r() * 3.5)}" fill="#ffffff" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`);
  }
  out.push(`<g id="sol-kaya-ve-selale"><path d="${cliff}" fill="url(#kaya)"/>
  <path d="M-10 360C110 366 240 400 360 452L346 500C230 456 110 424 -10 424Z" fill="#56605f" opacity="0.8"/>
  <path d="M60 368C120 372 180 384 236 404" fill="none" stroke="#c9a28e" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
  <ellipse cx="80" cy="390" rx="40" ry="9" fill="#3f5a3b" opacity="0.7"/><ellipse cx="60" cy="640" rx="28" ry="9" fill="#3f5a3b" opacity="0.55"/>
  <path d="${fallTop}" fill="url(#selale)"/>
  <path d="M150 604C230 590 340 592 440 606L444 648C340 634 230 634 146 648Z" fill="#30393b"/>
  <path d="M156 606C240 594 340 596 436 608" fill="none" stroke="#6b7577" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="294" cy="626" rx="140" ry="22" fill="url(#buhar)"/>
  <path d="${fallBot}" fill="url(#selale)"/>${streaks.join('')}
  <ellipse cx="306" cy="872" rx="290" ry="74" fill="url(#buhar)"/><ellipse cx="306" cy="862" rx="170" ry="40" fill="url(#buhar)"/>${drops.join('')}</g>`);

  // ön plan: berrak su altındaki çakıllar, ışık kırılmaları
  const tones = ['#8a7560', '#958d80', '#6f746e', '#a68c6c', '#5e6662', '#7c6b5a'];
  const pebbles = [];
  for (let i = 0; i < 70; i++) {
    const y = 1070 + r() * 380, s = 0.45 + (y - 1070) / 360;
    const x = r() * W, rx = (22 + r() * 38) * s, ry = (11 + r() * 18) * s;
    const c = tones[Math.floor(r() * tones.length)];
    pebbles.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#cakil)"/>`);
  }
  const caustics = [];
  for (let i = 0; i < 34; i++) {
    const y = 1080 + r() * 350, x = r() * W, w = 50 + r() * 130;
    caustics.push(`<path d="M${f(x)} ${f(y)}c${f(w * 0.2)} -12 ${f(w * 0.45)} 12 ${f(w * 0.7)} 0s${f(w * 0.22)} 9 ${f(w * 0.3)} 3" fill="none" stroke="#c8efe8" stroke-width="${f(1.5 + r() * 1.5)}" stroke-linecap="round" opacity="${(0.15 + r() * 0.25).toFixed(2)}"/>`);
  }
  out.push(`<g id="berrak-su"><rect y="1050" width="${W}" height="${H - 1050}" fill="#18363b"/>${pebbles.join('')}
  <rect y="1050" width="${W}" height="${H - 1050}" fill="url(#berrak)"/>${caustics.join('')}
  <path d="M-10 1052C200 1040 400 1062 600 1050S900 1040 1090 1056" fill="none" stroke="#e0f4f1" stroke-width="3" opacity="0.4"/></g>`);

  // köşelerdeki ön plan kayaları (ışık alan kenarlarıyla)
  out.push(`<g id="on-plan">
  <path d="M-10 1250C60 1210 170 1222 232 1284C272 1326 282 1400 272 ${H + 10}H-10Z" fill="#141a1b"/>
  <path d="M20 1236C80 1214 160 1226 214 1272" fill="none" stroke="#5b6567" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  <path d="M1090 1296C1020 1266 930 1286 890 1338C860 1378 860 1420 866 ${H + 10}H1090Z" fill="#141a1b"/>
  <path d="M1070 1290C1010 1272 944 1290 908 1328" fill="none" stroke="#5b6567" stroke-width="3" stroke-linecap="round" opacity="0.7"/></g>`);

  out.push(`<g id="karartma"><rect width="${W}" height="${H}" fill="url(#perde)"/><rect width="${W}" height="${H}" fill="url(#vinyet)"/></g>`);
  return out.join('\n');
}
