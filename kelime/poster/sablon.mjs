// sözlükdeus kelime kartı şablonu: logonun kırmızı zemini, altın kelime ve simge, krem metin.
// Kelime, altında kökeni, ANLAM ve ÖRNEK. Uzunluklara kendiliğinden uyar:
//  - kısa kelime simgeyle yan yana dev boyutta; uzun kelimede simge üste geçer, kelime satıra sığana kadar küçülür
//  - anlam ve örnek satırlara bölünür; kısa metin büyük, uzun metin sığana kadar küçük yazılır
//  - bütün içerik dikeyde ortalanır. Filigran ya da işaret yok.
//   node kelime/poster/sablon.mjs ab  ->  output/kelime/kart/ab.svg + .png + .pdf (1080 × 1440, 3:4)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const slug = process.argv[2] || 'ab';
const veri = await import(path.join(root, 'kelime/poster/kelimeler', `${slug}.mjs`));

const W = 1080, H = 1440, M = 96, GEN = W - 2 * M; // M: kenar boşluğu, GEN: metin genişliği
const RENK = { zemin: '#9b1b26', krem: '#f6ead2', altin: '#e3c58a', altinA: '#ecd5a0', altinK: '#d1ad73' };

const fontDir = path.join(root, 'kelime/fonts/montserrat');
const fontCss = [[500, 'normal'], [700, 'normal'], [800, 'normal'], [500, 'italic']].flatMap(([w, st]) => ['latin-ext', 'latin'].map((sub) => {
  const b64 = fs.readFileSync(path.join(fontDir, `montserrat-${sub}-${w}-${st}.woff2`)).toString('base64');
  const range = sub === 'latin' ? 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212'
    : 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF';
  return `@font-face{font-family:'Montserrat';font-style:${st};font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}`;
})).join('\n');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(`<style>${fontCss}</style><body></body>`);
await page.evaluate(() => Promise.all(['800 100px Montserrat', '700 40px Montserrat', '500 40px Montserrat', 'italic 500 40px Montserrat']
  .map((f) => document.fonts.load(f, 'Şğİıöçüâ'))));

// Yerleşim tarayıcıda ölçülerek yapılır; sonuç SVG parçaları olarak döner.
const yerlesim = await page.evaluate(({ W, H, M, GEN, kelime, koken, anlam, ornek, simgeVar, RENK }) => {
  const g = document.createElement('canvas').getContext('2d');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const olc = (t, f) => { g.font = f; return g.measureText(t).width; };

  // kalın/normal parçaları kelime kelime satırlara böl (boşluksuz bitişik parçalar tek kelime)
  function sar(runs, px, italik, maxW) {
    const f = (b) => `${italik && !b ? 'italic ' : ''}${b ? 700 : 500} ${px}px Montserrat`;
    const kelimeler = []; let cur = null;
    for (const r of runs) r.t.split(' ').forEach((seg, j) => {
      if (j > 0) cur = null;
      if (!seg) return;
      if (!cur) kelimeler.push(cur = []);
      cur.push({ t: seg, b: !!r.b });
    });
    const sp = olc(' ', f(false)), satirlar = [[]]; let w = 0;
    for (const k of kelimeler) {
      const kw = k.reduce((s, p) => s + olc(p.t, f(p.b)), 0);
      if (satirlar.at(-1).length && w + sp + kw > maxW) { satirlar.push([]); w = 0; }
      w += (satirlar.at(-1).length ? sp : 0) + kw; satirlar.at(-1).push(k);
    }
    return satirlar;
  }
  const tspans = (satir, italik) => {
    const runs = [];
    satir.forEach((k, i) => k.forEach((p, j) => {
      const t = (i && !j ? ' ' : '') + p.t;
      if (runs.length && runs.at(-1).b === p.b) runs.at(-1).t += t; else runs.push({ t, b: p.b });
    }));
    return runs.map((r) => r.b ? `<tspan font-weight="700" font-style="normal" fill="${RENK.altin}">${esc(r.t)}</tspan>` : esc(r.t)).join('');
  };

  // 1) kelime bloğu: yan yana mı, simge üstte mi?
  const SIMGE_YAN = 300, SIMGE_UST = 210;
  const kelimeBoyu = (px) => olc(kelime, `800 ${px}px Montserrat`) - kelime.length * px * 0.04;
  let duzen, kpx;
  const yanGen = simgeVar ? GEN - SIMGE_YAN - 40 : GEN;
  for (kpx = 300; kpx >= 180 && kelimeBoyu(kpx) > yanGen; kpx -= 10);
  if (kpx >= 180) duzen = 'yan';
  else { duzen = simgeVar ? 'ust' : 'yan'; for (kpx = 220; kpx > 72 && kelimeBoyu(kpx) > GEN; kpx -= 4); }
  const capH = kpx * 0.72; // Montserrat büyük harf yüksekliği
  const kelimeBlok = duzen === 'yan' ? Math.max(capH, simgeVar ? SIMGE_YAN * 0.9 : 0) : (simgeVar ? SIMGE_UST + 50 : 0) + capH;
  const KOKEN = 34, ARA = 64, ETIKET = 21;

  // 2) anlam ve örnek: sığan en büyük boyutları seç
  const ALAN = H - 2 * 120;
  const secenek = [[56, 40], [50, 38], [46, 36], [42, 34], [38, 32], [36, 30], [33, 28], [30, 26], [28, 24]];
  if (anlam.reduce((n, r) => n + r.t.length, 0) <= 30) secenek.unshift([76, 40]); // çok kısa tanım: iri ve vurucu
  let sec;
  for (const [apx, opx] of secenek) {
    const al = sar(anlam, apx, false, GEN), ol = sar(ornek, opx, true, GEN - 32);
    const yuk = kelimeBlok + 28 + KOKEN + ARA + 2 + ARA + ETIKET + 28 + al.length * apx * 1.3 + ARA + ETIKET + 28 + ol.length * opx * 1.4;
    sec = { apx, opx, al, ol, yuk };
    if (yuk <= ALAN) break;
  }

  // 3) çizim: her şey dikeyde ortalanır
  const out = [];
  let y = (H - sec.yuk) / 2;
  let simge = null;
  if (duzen === 'yan') {
    const tepe = y + Math.max(0, (kelimeBlok - capH) / 2);
    if (simgeVar) simge = { x: W - M - SIMGE_YAN, y: y + (kelimeBlok - SIMGE_YAN * 0.9) / 2 - SIMGE_YAN * 0.05, s: SIMGE_YAN };
    y = tepe + capH;
  } else {
    if (simgeVar) { simge = { x: M, y, s: SIMGE_UST }; y += SIMGE_UST + 50; }
    y += capH;
  }
  out.push(`<text x="${M - kpx * 0.04}" y="${y.toFixed(0)}" font-size="${kpx}" font-weight="800" letter-spacing="${(-kpx * 0.04).toFixed(1)}" fill="url(#altin)">${esc(kelime)}</text>`);
  y += 28 + KOKEN;
  out.push(`<text x="${M}" y="${y.toFixed(0)}" font-size="${KOKEN}" font-weight="500" font-style="italic" fill="${RENK.altin}">${esc(koken)}</text>`);
  y += ARA;
  out.push(`<line x1="${M}" y1="${y.toFixed(0)}" x2="${W - M}" y2="${y.toFixed(0)}" stroke="${RENK.altin}" stroke-width="2" opacity="0.35"/>`);
  y += 2 + ARA + ETIKET;
  out.push(`<text x="${M}" y="${y.toFixed(0)}" font-size="${ETIKET}" font-weight="700" letter-spacing="4" fill="${RENK.altin}">ANLAM</text>`);
  y += 28;
  sec.al.forEach((s) => { y += sec.apx * 1.3; out.push(`<text x="${M}" y="${(y - sec.apx * 0.3).toFixed(0)}" font-size="${sec.apx}" font-weight="500" fill="${RENK.krem}">${tspans(s, false)}</text>`); });
  y += ARA + ETIKET;
  out.push(`<text x="${M}" y="${y.toFixed(0)}" font-size="${ETIKET}" font-weight="700" letter-spacing="4" fill="${RENK.altin}">ÖRNEK</text>`);
  y += 28;
  out.push(`<rect x="${M}" y="${y.toFixed(0)}" width="4" height="${(sec.ol.length * sec.opx * 1.4).toFixed(0)}" fill="${RENK.altin}"/>`);
  sec.ol.forEach((s) => { y += sec.opx * 1.4; out.push(`<text x="${M + 32}" y="${(y - sec.opx * 0.4).toFixed(0)}" font-size="${sec.opx}" font-weight="500" font-style="italic" fill="${RENK.krem}">${tspans(s, true)}</text>`); });
  return { yazi: out.join('\n'), simge, duzen, kpx, apx: sec.apx, opx: sec.opx };
}, { W, H, M, GEN, kelime: veri.kelime, koken: veri.koken, anlam: veri.anlam, ornek: veri.ornek, simgeVar: !!veri.simge, RENK });

// simge 300 × 300'lük kutuda çizilir, yerleşimin verdiği yere ve boyuta ölçeklenir
const simge = yerlesim.simge ? `<g transform="translate(${yerlesim.simge.x.toFixed(1)} ${yerlesim.simge.y.toFixed(1)}) scale(${(yerlesim.simge.s / 300).toFixed(4)})">${veri.simge(RENK)}</g>` : '';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>${veri.kelime} — sözlükdeus</title>
<style>${fontCss}</style>
<defs><linearGradient id="altin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${RENK.altinA}"/><stop offset="1" stop-color="${RENK.altinK}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="${RENK.zemin}"/>
${simge}
<g font-family="Montserrat, sans-serif" xml:space="preserve">
${yerlesim.yazi}
</g>
</svg>
`;

const outDir = path.join(root, 'output/kelime/kart');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${slug}.svg`), svg);
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.evaluate(() => document.fonts.ready);
await page.locator('svg').first().screenshot({ path: path.join(outDir, `${slug}.png`) });
await page.addStyleTag({ content: '@page{size:1080px 1440px;margin:0} svg{display:block}' });
await page.pdf({ path: path.join(outDir, `${slug}.pdf`), width: `${W}px`, height: `${H}px`, printBackground: true });
await browser.close();
console.log(`output/kelime/kart/${slug}.{svg,png,pdf}  düzen=${yerlesim.duzen} kelime=${yerlesim.kpx}px anlam=${yerlesim.apx}px örnek=${yerlesim.opx}px`);
