// "Abadi": ipekten, saman renginde yazı kâğıdı. Arka plan tamamen vektör: fener
// ışığında ahşap masa, kenarları tırtıklı kâğıt destesi, hokka, kalem, ciltli kitaplar.
import { rng } from '../sahne.mjs';

export const kelime = 'Abadi';
export const tanim = [
  { t: 'Açık saman renginde, ipekten yapılan, yarı mat, kalınca bir ' },
  { t: 'yazı kâğıdı', b: true },
  { t: ' türü. Adını Hindistan’ın ' },
  { t: 'Devletâbâd', b: true },
  { t: ' şehrinden alan bu kâğıt, geçmişte yazı yazmak ve hat sanatında kullanılmıştır.' },
];
export const ornek = [
  { t: '“Hattat, özenle hazırladığı ' },
  { t: 'abadi', b: true },
  { t: ' kâğıdının üzerine zarif harfler işledi.”' },
];

const f = (n) => n.toFixed(1);

// iki nokta arasında tırtıklı (el yapımı kâğıt) kenar
function deckle(r, a, b, amp) {
  const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9), pts = [];
  const nx = -(b[1] - a[1]), ny = b[0] - a[0], len = Math.hypot(nx, ny);
  for (let i = 1; i <= n; i++) {
    const t = i / n, j = (r() - 0.3) * amp;
    pts.push(`${f(a[0] + (b[0] - a[0]) * t + nx / len * j)} ${f(a[1] + (b[1] - a[1]) * t + ny / len * j)}`);
  }
  return pts.join('L');
}
const sheet = (r, q, amp) => `M${f(q[0][0])} ${f(q[0][1])}L${deckle(r, q[0], q[1], amp)}L${deckle(r, q[1], q[2], amp)}L${deckle(r, q[2], q[3], amp)}L${deckle(r, q[3], q[0], amp)}Z`;

export function sahne(W, H) {
  const r = rng(17);
  const out = [];

  out.push(`<defs>
  <linearGradient id="masa" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2a1b10"/><stop offset="0.45" stop-color="#3b2616"/><stop offset="1" stop-color="#1e130b"/>
  </linearGradient>
  <radialGradient id="fenerIsigi" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffc77e" stop-opacity="0.55"/><stop offset="0.4" stop-color="#d98c45" stop-opacity="0.22"/><stop offset="1" stop-color="#d98c45" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="kagit" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#d9c8a4"/><stop offset="0.55" stop-color="#c4b18c"/><stop offset="1" stop-color="#9c8a6a"/>
  </linearGradient>
  <linearGradient id="kapak" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3a2618"/><stop offset="1" stop-color="#1a110a"/>
  </linearGradient>
  <linearGradient id="pirinc" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3a2b18"/><stop offset="0.35" stop-color="#8a6a3e"/><stop offset="0.6" stop-color="#5a4426"/><stop offset="1" stop-color="#2a1e10"/>
  </linearGradient>
  <linearGradient id="hokka" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#2a1d16"/><stop offset="0.3" stop-color="#110b08"/><stop offset="1" stop-color="#060403"/>
  </linearGradient>
  <linearGradient id="perde" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.1"/><stop offset="0.45" stop-color="#000" stop-opacity="0.24"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/>
  </linearGradient>
  <radialGradient id="vinyet" cx="0.55" cy="0.45" r="0.78">
    <stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/>
  </radialGradient>
</defs>`);

  // arka duvar/raf ve masa yüzeyi, perspektifli ahşap damarlar
  const grain = [];
  for (let i = 0; i < 70; i++) {
    const x0 = -300 + r() * 1700, wob = 6 + r() * 10, c = r() > 0.5 ? '#120a05' : '#5a3a22';
    grain.push(`<path d="M${f(x0)} 230C${f(x0 - 40 + wob)} 600 ${f(x0 * 1.25 - 160 - wob)} 1000 ${f(x0 * 1.6 - 380)} ${H + 20}" fill="none" stroke="${c}" stroke-width="${f(1 + r() * 2.5)}" opacity="${(0.15 + r() * 0.25).toFixed(2)}"/>`);
  }
  out.push(`<g id="masa"><rect width="${W}" height="${H}" fill="#0f0a07"/>
  <rect y="0" width="${W}" height="250" fill="#140e09"/>
  ${[60, 150, 240, 330, 420, 510, 600, 690].map((x) => `<rect x="${x}" y="0" width="70" height="170" rx="4" fill="#1d140d" opacity="0.8"/>`).join('')}
  <path d="M0 230H${W}V${H}H0Z" fill="url(#masa)"/>${grain.join('')}
  <path d="M0 232H${W}" stroke="#6a4a2c" stroke-width="2" opacity="0.4"/>
  <ellipse cx="900" cy="420" rx="760" ry="620" fill="url(#fenerIsigi)"/><ellipse cx="970" cy="200" rx="260" ry="300" fill="url(#fenerIsigi)"/></g>`);

  // arkada üst üste iki ciltli kitap (altın şemseli kapak)
  const book = (x, y, w, h, t) => `<path d="M${x} ${y + 40}L${x + w} ${y}L${x + w + 30} ${y + h - 50}L${x + 30} ${y + h}Z" fill="url(#kapak)"/>
    <path d="M${x + 30} ${y + h}L${x + w + 30} ${y + h - 50}V${y + h - 50 + t}L${x + 30} ${y + h + t}Z" fill="#c7b38c" opacity="0.55"/>
    <path d="M${x + 30} ${y + h}V${y + h + t}" stroke="#1a110a" stroke-width="3"/>
    <path d="M${x + 24} ${y + 50}L${x + w - 8} ${y + 14}L${x + w + 16} ${y + h - 60}L${x + 50} ${y + h - 18}Z" fill="none" stroke="#9a7a48" stroke-width="2.5" opacity="0.7"/>
    <ellipse cx="${x + w / 2 + 18}" cy="${y + h / 2 - 2}" rx="${w * 0.18}" ry="${h * 0.16}" transform="rotate(-6 ${x + w / 2 + 18} ${y + h / 2 - 2})" fill="none" stroke="#b08a50" stroke-width="3" opacity="0.75"/>
    <ellipse cx="${x + w / 2 + 18}" cy="${y + h / 2 - 2}" rx="${w * 0.08}" ry="${h * 0.07}" transform="rotate(-6 ${x + w / 2 + 18} ${y + h / 2 - 2})" fill="#8a6a3e" opacity="0.55"/>`;
  out.push(`<g id="kitaplar"><path d="M-30 330L520 260L540 300L-10 380Z" fill="#000" opacity="0.4"/>
  ${book(-40, 190, 500, 150, 26)}${book(-60, 80, 520, 150, 30)}</g>`);

  // sağ üstte oymalı fener, ışık saçan kafes
  const lattice = [];
  // kemerli pencereler, içlerinde ince oyma çizgileri
  for (let row = 0; row < 6; row++) for (let col = 0; col < 4; col++) {
    const x = 872 + col * 54, y = 14 + row * 62, w = 40, h = 54, rr = w / 2;
    lattice.push(`<path d="M${x} ${y + h}V${y + rr}A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}V${y + h}Z" fill="#ffcf86" opacity="${(0.6 + r() * 0.35).toFixed(2)}"/>`);
    lattice.push(`<path d="M${x + rr} ${y + 4}V${y + h}M${x} ${y + rr + 10}H${x + w}M${x + 6} ${y + h}L${x + rr} ${y + rr + 10}L${x + w - 6} ${y + h}" fill="none" stroke="#4a2a12" stroke-width="2.5" opacity="0.8"/>`);
  }
  out.push(`<g id="fener"><ellipse cx="960" cy="420" rx="260" ry="60" fill="#000" opacity="0.4"/>
  <path d="M840 0H1090V400H840Z" fill="#2a1a0e"/>
  <clipPath id="fenerCam"><path d="M862 0H1090V384H862Z"/></clipPath>
  <g clip-path="url(#fenerCam)"><rect x="862" y="0" width="230" height="384" fill="#5a3416"/>${lattice.join('')}</g>
  <path d="M840 0V400" stroke="#120a05" stroke-width="16"/><path d="M830 384H1090V430H830Z" fill="#3a2614"/><path d="M830 384H1090" stroke="#8a6a3e" stroke-width="3"/>
  <path d="M810 430H1090V448H810Z" fill="#1a1009"/></g>`);

  // mürekkep hokkası: pirinç tabak, koyu cam şişe, kapak
  out.push(`<g id="hokka"><ellipse cx="130" cy="480" rx="210" ry="82" fill="#000" opacity="0.45"/>
  <ellipse cx="120" cy="462" rx="200" ry="74" fill="url(#pirinc)"/><ellipse cx="120" cy="452" rx="160" ry="54" fill="#2a1e10"/>
  <path d="M-40 440C20 404 220 404 280 440" fill="none" stroke="#c49a5a" stroke-width="3" opacity="0.5"/>
  <path d="M30 330H200V460C200 476 180 486 115 486C50 486 30 476 30 460Z" fill="url(#hokka)"/>
  <path d="M44 340V450" stroke="#6a5446" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
  <path d="M30 330C40 312 190 312 200 330" fill="#1a110c"/>
  <rect x="88" y="296" width="54" height="30" fill="#1a110c"/>
  <path d="M74 296C74 270 156 270 156 296Z" fill="url(#pirinc)"/><ellipse cx="115" cy="270" rx="22" ry="10" fill="url(#pirinc)"/>
  <path d="M84 290C96 280 120 278 138 284" fill="none" stroke="#d8b070" stroke-width="2.5" opacity="0.6"/></g>`);

  // çapraz duran kalem (pirinç bilezik, uç)
  out.push(`<g id="kalem"><path d="M700 500L1060 726" stroke="#000" stroke-width="22" stroke-linecap="round" opacity="0.35" transform="translate(6 14)"/>
  <path d="M760 538L1070 732" stroke="#1a110b" stroke-width="20" stroke-linecap="round"/>
  <path d="M770 538L1060 720" stroke="#5a4030" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  <path d="M740 525L770 544" stroke="url(#pirinc)" stroke-width="22"/>
  <path d="M680 488L742 526L736 532Z" fill="#b89058"/><path d="M684 490L738 524" stroke="#3a2614" stroke-width="1.5"/></g>`);

  // kâğıt destesi: alttan üste tırtıklı yapraklar, en üstte lif dokusu
  const top = [[236, 560], [640, 476], [1004, 900], [330, 1104]];
  const stack = [`<path d="M230 566L646 478L1012 906L326 1116Z" fill="#000" opacity="0.55" transform="translate(-14 26)"/>`];
  for (let i = 8; i >= 1; i--) {
    const d = i * 5, q = top.map(([x, y], k) => [x + (r() - 0.5) * 10 - (k === 0 ? 6 : 0), y + d + (r() - 0.5) * 6]);
    const shade = 0.55 + (8 - i) * 0.04;
    stack.push(`<path d="${sheet(r, q, 5)}" fill="#b6a37f" opacity="${shade.toFixed(2)}"/><path d="${sheet(r, q, 5)}" fill="none" stroke="#4a3a28" stroke-width="1.2" opacity="0.5"/>`);
  }
  const fibers = [];
  for (let i = 0; i < 160; i++) {
    const u = r(), v = r();
    const x = top[0][0] + (top[1][0] - top[0][0]) * u + (top[3][0] - top[0][0]) * v;
    const y = top[0][1] + (top[1][1] - top[0][1]) * u + (top[3][1] - top[0][1]) * v;
    fibers.push(`<path d="M${f(x)} ${f(y)}q${f(6 + r() * 10)} ${f((r() - 0.5) * 6)} ${f(12 + r() * 16)} ${f((r() - 0.5) * 4)}" fill="none" stroke="${r() > 0.5 ? '#f2e6c8' : '#8a7858'}" stroke-width="1" opacity="${(0.2 + r() * 0.3).toFixed(2)}"/>`);
  }
  stack.push(`<path d="${sheet(r, top, 6)}" fill="url(#kagit)"/>${fibers.join('')}`);
  stack.push(`<path d="M236 560L640 476L1004 900L330 1104Z" fill="url(#fenerIsigi)" opacity="0.6"/>`);
  out.push(`<g id="kagit-destesi">${stack.join('')}</g>`);

  // sağ alt köşede oymalı kutu kenarı
  out.push(`<g id="kutu"><path d="M900 1240L1090 1150V${H}H840Z" fill="#1c130c"/>
  <path d="M900 1240L1090 1150" stroke="#8a6a3e" stroke-width="3" opacity="0.6"/>
  ${[0, 1, 2, 3].map((i) => `<path d="M${930 + i * 40} ${1250 - i * 19}l14 -20l14 20l-14 20Z" fill="none" stroke="#8a6a3e" stroke-width="2" opacity="0.5"/>`).join('')}</g>`);

  out.push(`<g id="karartma"><rect width="${W}" height="${H}" fill="url(#perde)"/><rect width="${W}" height="${H}" fill="url(#vinyet)"/></g>`);
  return out.join('\n');
}
