// "Ab" kartının kırmızı-altın sürümü: profil logosunun paletiyle (kırmızı zemin, altın tonları)
// düz renkli, serigrafi gibi bir sahne. Yazılar ab.mjs ile aynı.
import { rng, pine } from '../sahne.mjs';
export { kelime, koken, tanim, ornek } from './ab.mjs';

export const tema = { yazi: '#fff5e1', vurgu: '#ecd5a0', karartma: 0.08, hale: '#2a050a' };

const R0 = '#9b1b26', R1 = '#8a1722', R2 = '#741320', R3 = '#5c0f19', R4 = '#470b13', RL = '#b3313a';
const G1 = '#ecd5a0', G2 = '#d8b77e', G3 = '#c29a63';
const f = (n) => n.toFixed(1);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// zirve/vadi dizisinden düz dağ: ışık alan sağ yüz ve tırtıklı altın kar
function range(pts, base, body, lit, litOp, snow) {
  const out = [`<path d="M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}L${pts.at(-1)[0]} ${base}L${pts[0][0]} ${base}Z" fill="${body}"/>`];
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], l = pts[i - 1], r = pts[i + 1];
    if (p[1] > l[1] || p[1] > r[1]) continue;
    const foot = [p[0] - 6, Math.min(base, Math.max(l[1], r[1]) + 70)];
    out.push(`<path d="M${f(p[0])} ${f(p[1])}L${f(r[0])} ${f(r[1])}L${f(foot[0])} ${f(foot[1])}Z" fill="${lit}" opacity="${litOp}"/>`);
    const depth = Math.min(0.42, 70 / Math.max(40, Math.min(l[1], r[1]) - p[1]) * 0.42);
    const a = lerp(p, l, depth), b = lerp(p, r, depth * 0.85), z1 = lerp(a, b, 0.3), z2 = lerp(a, b, 0.55), z3 = lerp(a, b, 0.8);
    out.push(`<path d="M${f(p[0])} ${f(p[1])}L${f(a[0])} ${f(a[1])}L${f(z1[0])} ${f(z1[1] - 12)}L${f(z2[0])} ${f(z2[1] + 10)}L${f(z3[0])} ${f(z3[1] - 8)}L${f(b[0])} ${f(b[1])}Z" fill="${snow}"/>`);
  }
  return out.join('');
}

export function sahne(W, H) {
  const r = rng(41);
  const out = [];

  // gökyüzü ve dağların ardında altın güneş
  out.push(`<defs><radialGradient id="sis" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${G1}" stop-opacity="0.55"/><stop offset="1" stop-color="${G1}" stop-opacity="0"/></radialGradient></defs>
  <g id="gokyuzu"><rect width="${W}" height="${H}" fill="${R0}"/>
  <circle cx="330" cy="150" r="96" fill="${G1}" opacity="0.14"/><circle cx="330" cy="150" r="64" fill="${G1}"/></g>`);

  // uzak ve yakın sıradağlar
  out.push(`<g id="daglar">${range(
    [[-40, 300], [70, 236], [150, 286], [250, 222], [330, 270], [420, 232], [500, 272], [560, 250], [640, 280], [760, 226], [850, 266], [960, 214], [1040, 262], [1120, 240]],
    560, R1, RL, 0.35, G2)}${range(
    [[-60, 360], [60, 268], [140, 330], [250, 210], [360, 312], [470, 196], [540, 268], [640, 92], [760, 280], [860, 196], [960, 300], [1040, 238], [1140, 330]],
    640, R2, RL, 0.45, G1)}</g>`);

  // V biçimli ormanlı vadi
  const pines = [];
  const along = (x0, y0, x1, y1, n, h0, h1, fill) => {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = x0 + (x1 - x0) * t + (r() - 0.5) * 12, y = y0 + (y1 - y0) * t + 30 + r() * 16;
      const h = (h0 + (h1 - h0) * t) * (0.85 + r() * 0.3);
      pines.push(pine(x, y, h, h * 0.34, fill));
    }
  };
  along(-20, 330, 470, 560, 18, 120, 60, '#6a1019');
  along(1100, 360, 680, 560, 16, 110, 60, '#6a1019');
  const far = pines.splice(0);
  along(-20, 380, 480, 600, 15, 190, 80, R4);
  along(1100, 400, 660, 600, 13, 180, 80, R4);
  out.push(`<g id="orman">${far.join('')}<path d="M-10 380C150 400 330 480 500 610L520 760H-10Z" fill="${R3}"/><path d="M1090 400C910 420 760 500 650 610L620 760H1090Z" fill="${R3}"/>${pines.join('')}</g>`);

  // nehir ve altın akıntı çizgileri
  const flow = [];
  for (let i = 0; i < 24; i++) {
    const y = 640 + Math.pow(r(), 1.15) * 380, x = 430 + r() * 620, w = 40 + (y - 600) * 0.45 * r();
    flow.push(`<path d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(-5 - r() * 4)} ${f(w)} 0" fill="none" stroke="${G2}" stroke-width="${f(1.6 + (y - 600) / 260)}" stroke-linecap="round" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`);
  }
  out.push(`<g id="nehir"><path d="M574 606Q592 596 614 606C690 650 850 700 1090 740V1060H-10V900C200 860 380 760 470 680C505 640 540 618 574 606Z" fill="${RL}"/>${flow.join('')}</g>`);

  // sağdaki büyük kaya ve nehirdeki taşlar
  out.push(`<g id="kayalar"><path d="M800 742C800 640 880 566 984 560C1050 556 1090 584 1090 612V760H800Z" fill="${R3}"/>
  <path d="M836 650C866 596 924 570 994 568C944 592 892 626 864 692Z" fill="${R2}"/>
  <path d="M800 744C862 732 960 752 1090 738" fill="none" stroke="${G2}" stroke-width="3.5" stroke-linecap="round" opacity="0.7"/>
  <path d="M638 764c10-32 52-42 84-32c20 8 26 22 24 34Z" fill="${R3}"/><path d="M518 804c8-22 42-30 64-20c14 7 18 18 16 26Z" fill="${R3}"/></g>`);

  // soldaki kaya ve iki basamaklı altın şelale
  const streaks = [];
  const streak = (x0, x1, y0, y1, n) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * (i / (n - 1)) + (r() - 0.5) * 6, top = y0 + r() * 24, bot = top + (y1 - y0) * (0.4 + r() * 0.55);
      streaks.push(`<path d="M${f(x)} ${f(top)}C${f(x + 3)} ${f(top + 60)} ${f(x - 3)} ${f(bot - 60)} ${f(x + 2)} ${f(bot)}" fill="none" stroke="${i % 2 ? '#f3e2bb' : G3}" stroke-width="${f(1.4 + r() * 2)}" stroke-linecap="round" opacity="${(0.4 + r() * 0.4).toFixed(2)}"/>`);
    }
  };
  streak(204, 384, 456, 600, 13);
  streak(180, 436, 648, 866, 18);
  out.push(`<g id="sol-kaya-ve-selale"><path d="M-10 360C110 366 240 400 360 452C420 478 452 520 456 580C460 680 446 800 440 900C300 930 150 942 -10 950Z" fill="${R3}"/>
  <path d="M-10 360C110 366 240 400 360 452L346 500C230 456 110 424 -10 424Z" fill="${R2}"/>
  <path d="M196 446Q300 456 380 486C388 520 392 560 398 600H190C192 550 192 500 196 446Z" fill="${G3}"/>
  <path d="M150 604C230 590 340 592 440 606L444 648C340 634 230 634 146 648Z" fill="${R4}"/>
  <path d="M170 640Q300 628 420 640C432 720 436 790 452 866H160C166 790 166 710 170 640Z" fill="${G3}"/>${streaks.join('')}
  <ellipse cx="306" cy="868" rx="280" ry="60" fill="url(#sis)"/></g>`);

  // ön plan: koyu su, çakıllar ve altın ışık kırılmaları
  const pebbles = [], caustics = [];
  for (let i = 0; i < 60; i++) {
    const y = 1070 + r() * 380, s = 0.45 + (y - 1070) / 360;
    pebbles.push(`<ellipse cx="${f(r() * W)}" cy="${f(y)}" rx="${f((22 + r() * 38) * s)}" ry="${f((11 + r() * 18) * s)}" fill="${r() > 0.5 ? R3 : '#82161f'}"/>`);
  }
  for (let i = 0; i < 30; i++) {
    const y = 1080 + r() * 350, x = r() * W, w = 50 + r() * 130;
    caustics.push(`<path d="M${f(x)} ${f(y)}c${f(w * 0.2)} -12 ${f(w * 0.45)} 12 ${f(w * 0.7)} 0s${f(w * 0.22)} 9 ${f(w * 0.3)} 3" fill="none" stroke="${G2}" stroke-width="${f(1.5 + r() * 1.5)}" stroke-linecap="round" opacity="${(0.25 + r() * 0.3).toFixed(2)}"/>`);
  }
  out.push(`<g id="berrak-su"><rect y="1050" width="${W}" height="${H - 1050}" fill="${R2}"/>${pebbles.join('')}${caustics.join('')}
  <path d="M-10 1052C200 1040 400 1062 600 1050S900 1040 1090 1056" fill="none" stroke="${G2}" stroke-width="3" opacity="0.6"/></g>`);

  // köşelerde ön plan kayaları
  out.push(`<g id="on-plan"><path d="M-10 1250C60 1210 170 1222 232 1284C272 1326 282 1400 272 ${H + 10}H-10Z" fill="${R4}"/>
  <path d="M1090 1296C1020 1266 930 1286 890 1338C860 1378 860 1420 866 ${H + 10}H1090Z" fill="${R4}"/></g>`);
  return out.join('\n');
}
