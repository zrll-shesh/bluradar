export function idNum(x, d = 0) {
  if (x === null || x === undefined || Number.isNaN(x)) return '–';
  return Number(x).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
}
export function fmtPct(x, d = 1) {
  if (x === null || x === undefined || Number.isNaN(x)) return '–';
  return idNum(x * 100, d) + '%';
}
export function signedPct(x, d = 1) {
  return (x >= 0 ? '+' : '−') + idNum(Math.abs(x) * 100, d) + '%';
}
export function fmtRp(x, d = 1) {
  if (x === null || x === undefined || Number.isNaN(x)) return '–';
  const sign = x < 0 ? '−' : '';
  const a = Math.abs(x);
  const units = [[1e12, ' T'], [1e9, ' M'], [1e6, ' jt'], [1e3, ' rb']];
  for (const [div, unit] of units) if (a >= div) return `${sign}Rp${idNum(a / div, d)}${unit}`;
  return `${sign}Rp${idNum(a, 0)}`;
}
export function pp(x, d = 1) {
  return idNum(x, d) + ' pp';
}
