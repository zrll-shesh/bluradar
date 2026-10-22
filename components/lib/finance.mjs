export function pilotCalc(p) {
  const akun = p.sales * p.hari * p.akun_per_hari;
  const akunR = akun * p.volume_radar;
  const salesCost = p.sales * p.biaya_sales_bulan * p.bulan;
  const qacB = akun * p.qac_base;
  const qacR = akunR * p.qac_radar;
  const totB = akun * p.insentif_base + salesCost;
  const totR = akunR * p.insentif_radar + salesCost + qacR * p.bonus_qac + p.teknologi;
  return { akun, akunR, qacB, qacR, totB, totR, cpqB: totB / qacB, cpqR: totR / qacR, reduction: 1 - (totR / qacR) / (totB / qacB) };
}
