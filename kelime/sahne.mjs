// Arka plan sahneleri için küçük vektör yardımcıları (deterministik).

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const f = (n) => n.toFixed(1);
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// sırayla vadi/zirve noktalarından oluşan bir sırt çizgisi
export function ridge(r, peaks, yMin, yMax, W = 1080) {
  const span = W + 120, pts = [{ x: -60, y: yMax - r() * 40, v: true }];
  for (let i = 0; i < peaks; i++) {
    const cx = -60 + (i + 0.5) * span / peaks + (r() - 0.5) * span / peaks * 0.4;
    const py = yMin + r() * (yMax - yMin) * 0.65;
    pts.push({ x: cx, y: py, v: false });
    if (i < peaks - 1) {
      const vx = -60 + (i + 1) * span / peaks + (r() - 0.5) * 30;
      pts.push({ x: vx, y: Math.min(yMax + 20, py + 50 + r() * 70), v: true });
    }
  }
  pts.push({ x: W + 60, y: yMax - r() * 40, v: true });
  return pts;
}

export function mountains(W, pts, base) {
  const peaks = pts.map((p, i) => ({ p, l: pts[i - 1], r: pts[i + 1] })).filter((o) => !o.p.v && o.l && o.r);
  return {
    path: (fill) => `<path d="M${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}L${W + 60} ${base}L-60 ${base}Z" fill="${fill}"/>`,
    // her zirvenin sağ yüzü gölgede
    facets: (color, op) => peaks.map(({ p, r }) => {
      const foot = { x: p.x + (r.x - p.x) * 0.15, y: base };
      return `<path d="M${f(p.x)} ${f(p.y)}L${f(r.x)} ${f(r.y)}L${f(foot.x)} ${f(foot.y)}Z" fill="${color}" opacity="${op}"/>`;
    }).join(''),
    // yüksek zirvelere tırtıklı kar başlığı
    snow: (color, op) => {
      const top = Math.min(...peaks.map((o) => o.p.y));
      return peaks.filter((o) => o.p.y < top + 60).map(({ p, l, r }) => {
        const a = lerp(p, l, 0.24), b = lerp(p, r, 0.2);
        const m1 = lerp(a, b, 0.33), m2 = lerp(a, b, 0.66);
        return `<path d="M${f(p.x)} ${f(p.y)}L${f(b.x)} ${f(b.y)}L${f(m2.x)} ${f(m2.y - 10)}L${f(m1.x + 6)} ${f(m1.y + 8)}L${f(a.x)} ${f(a.y)}Z" fill="${color}" opacity="${op}"/>`;
      }).join('');
    },
  };
}

// katmanlı üçgenlerden çam silueti
export function pine(x, base, h, w, fill) {
  const tiers = 5, parts = [`<rect x="${f(x - w * 0.05)}" y="${f(base - h * 0.12)}" width="${f(w * 0.1)}" height="${f(h * 0.14)}" fill="${fill}"/>`];
  for (let i = 0; i < tiers; i++) {
    const top = base - h + (h * 0.78) * (i / tiers);
    const bot = top + h * 0.34;
    const hw = (w / 2) * (0.38 + 0.62 * ((i + 1) / tiers));
    parts.push(`<path d="M${f(x)} ${f(top)}L${f(x + hw)} ${f(bot)}Q${f(x)} ${f(bot - h * 0.05)} ${f(x - hw)} ${f(bot)}Z" fill="${fill}"/>`);
  }
  return parts.join('');
}
