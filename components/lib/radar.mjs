import { gridDisk } from 'h3-js';

export const CATS = ['kantor', 'kampus', 'sekolah', 'stasiun', 'mal'];
export const CAT_LABEL = { kantor: 'Kantor', kampus: 'Kampus', sekolah: 'Sekolah', stasiun: 'Stasiun', mal: 'Mal' };

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function prepareRadar(geojson) {
  const props = geojson.features.map((f) => f.properties);
  const pos = new Map(props.map((p, i) => [p.hex, i]));
  const neighbors = props.map((p) => gridDisk(p.hex, 1).filter((h) => h !== p.hex && pos.has(h)).map((h) => pos.get(h)));
  const logc = CATS.map((c) => props.map((p) => Math.log1p(p[c])));
  const caps = logc.map((col) => {
    const q = quantile([...col].sort((a, b) => a - b), 0.99);
    return q === 0 ? 1 : q;
  });
  const norm = props.map((_, i) => CATS.map((_, j) => Math.min(1, Math.max(0, logc[j][i] / caps[j]))));
  return { props, neighbors, norm };
}

export function scoreRadar(prep, weights) {
  const w = CATS.map((c) => weights[c]);
  const raw = prep.norm.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
  const smooth = raw.map((r, i) => 0.7 * r + 0.3 * prep.neighbors[i].reduce((s, k) => s + raw[k], 0) / 6);
  const max = Math.max(...smooth);
  return smooth.map((s) => (100 * s) / max);
}

export function selectTop(prep, score, k = 20) {
  const order = score.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map((x) => x[1]);
  const chosen = [];
  const blocked = new Set();
  for (const i of order) {
    if (blocked.has(i)) continue;
    chosen.push(i);
    blocked.add(i);
    prep.neighbors[i].forEach((n) => blocked.add(n));
    if (chosen.length === k) break;
  }
  return chosen;
}

export function dominant(prep, i, weights) {
  let best = 0;
  let bestV = -1;
  CATS.forEach((c, j) => {
    const v = prep.norm[i][j] * weights[c];
    if (v > bestV) { bestV = v; best = j; }
  });
  return CATS[best];
}
