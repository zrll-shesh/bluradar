import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fmtPct, fmtRp, idNum } from '../components/lib/format.mjs';
import { pilotCalc } from '../components/lib/finance.mjs';
import { prepareRadar, scoreRadar, selectTop } from '../components/lib/radar.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const kpi = J('kpi_summary.json');
const fin = J('finance.json');
const mk = J('markov_ltv.json');
const up = J('uplift_results.json');
const bandit = J('bandit_runs.json');
const rev = J('review_insights.json');
const top20 = J('top20_locations.json');
const road = J('roadmap.json');
const kf = J('kfactor_sim.json');
const extra = J('extra.json');
const geo = J('hex_scores.geojson');

let fail = 0;
const check = (label, got, want) => {
  const ok = got === want;
  if (!ok) fail += 1;
  console.log(`${ok ? 'OK    ' : 'GAGAL '} ${label}: ${got}${ok ? '' : ` (seharusnya ${want})`}`);
};

const p = fin.pilot_result;
const calc = pilotCalc(fin.pilot_params);
check('Biaya per QAC baseline', fmtRp(p.cpq_base), 'Rp233,3 rb');
check('Biaya per QAC bluRadar', fmtRp(p.cpq_radar), 'Rp109,6 rb');
check('Penurunan biaya per QAC', fmtPct(p.reduction), '53,0%');
check('Kalkulator web = notebook (biaya per QAC)', fmtRp(calc.cpqR), fmtRp(p.cpq_radar));
check('Kalkulator web = notebook (penurunan)', fmtPct(calc.reduction, 4), fmtPct(p.reduction, 4));
check('Total biaya baseline / bluRadar', `${fmtRp(p.total_base, 2)} / ${fmtRp(p.total_radar, 2)}`, 'Rp1,89 M / Rp1,48 M');
check('QAC baseline / bluRadar', `${idNum(p.qac_base)} / ${idNum(p.qac_radar)}`, '8.100 / 13.500');
check('Monte Carlo P5 / median / P95', `${fmtPct(fin.montecarlo.p5)} / ${fmtPct(fin.montecarlo.p50)} / ${fmtPct(fin.montecarlo.p95)}`, '23,0% / 47,5% / 64,3%');
check('Peluang lolos go/no-go', fmtPct(fin.montecarlo.p_go), '93,7%');
check('Peluang lebih efisien', fmtPct(kpi.montecarlo.p_pos), '99,7%');
check('Histogram Monte Carlo = 10.000 skenario', idNum(fin.montecarlo.histogram[0].reduce((s, v) => s + v, 0)), '10.000');
const base = fin.projection.find((x) => x.skenario === 'Dasar');
check('NPV inkremental dasar', fmtRp(base.npv_inkremental, 2), 'Rp48,49 M');
check('Payback dasar', String(base.payback_bulan), '6');
check('Tambahan DPK dasar', `${fmtRp(base.tambahan_dpk_bulan36, 2)} (${fmtPct(base.tambahan_dpk_vs_dpk_blu, 2)})`, 'Rp1,02 T (6,56%)');
check('NPV konservatif / optimis', `${fmtRp(fin.projection[0].npv_inkremental, 2)} / ${fmtRp(fin.projection[2].npv_inkremental, 2)}`, 'Rp33,71 M / Rp57,84 M');
check('Tornado sisi terburuk QAC bluRadar', fmtPct(fin.tornado.find((t) => t.faktor.startsWith('Tingkat QAC bluRadar')).rendah), '42,3%');

check('LTV 36 bulan baseline / bluRadar', `${fmtRp(mk.ltv_base)} / ${fmtRp(mk.ltv_radar)}`, 'Rp151,4 rb / Rp323,3 rb');
check('Tambahan LTV median Monte Carlo', fmtRp(mk.mc_percentiles.p50), 'Rp166,4 rb');
check('Peluang tambahan LTV positif', fmtPct(kpi.markov.diff_pos), '95,2%');
check('Aktif bulan 36 baseline / bluRadar', `${fmtPct(1 - mk.dist_base[35][0])} / ${fmtPct(1 - mk.dist_radar[35][0])}`, '42,7% / 65,8%');
check('Nilai aktivasi 36 bulan', fmtRp(up.targeting.v_activation), 'Rp138,7 rb');

const ts = bandit.summary.find((s) => s.strategi.startsWith('Thompson'));
check('Thompson Sampling vs intuisi', fmtPct(ts.vs_intuisi), '9,7%');
check('Porsi Oracle', fmtPct(ts.porsi_oracle), '94,1%');
check('Total QAC TS / intuisi', `${idNum(ts.total_qac_rata2)} / ${idNum(bandit.summary.find((s) => s.strategi.startsWith('Intuisi')).total_qac_rata2)}`, '10.734 / 9.788');

check('Model uplift terbaik', up.best_model, 'S-learner');
check('ATE nudge', idNum(up.ate_pp, 2), '4,51');
check('Qini gain S-learner', fmtPct(up.evaluation.find((e) => e.model === 'S-learner').qini_gain), '35,9%');
check('Efek tertangkap top 30%', fmtPct(kpi.uplift.capture_top30), '49,4%');
check('Anggaran 30%: model vs acak', `${idNum(kpi.uplift.budget_mult, 2)}x`, '1,64x');
const fair = extra.fairness;
check('Rasio dampak antarwilayah', idNum(Math.min(...fair.map((f) => f.tingkat_seleksi)) / Math.max(...fair.map((f) => f.tingkat_seleksi)), 2), '0,62');

check('Akun per bendahara', idNum(kf.mean_accounts, 1), '7,3');
check('Produktivitas pitch bendahara', `${idNum(kpi.anchor.productivity_ratio, 1)}x`, '2,3x');

const blu3 = ['blu', 'Bank Jago', 'SeaBank'].map((b) => rev.summary.find((s) => s.bank === b));
check('Ulasan bersih total', idNum(extra.reviews_meta.total_clean), '8.726');
check('Ulasan tiga aplikasi', idNum(blu3.reduce((s, x) => s + x.n_ulasan, 0)), '8.722');
check('Rating blu', idNum(blu3[0].rating_rata2, 2), '3,97');
const access = rev.topics_blu.filter((t) => t.tema === 'Akses dan identitas').reduce((s, t) => s + t.porsi_ulasan_negatif, 0);
check('Keluhan tahap masuk (tema Akses dan identitas)', fmtPct(access), '40,1%');
const net = (b, a) => rev.aspects.find((x) => x.bank === b && x.aspek === a).net_sentiment;
const gap = (a) => net('blu', a) - (net('Bank Jago', a) + net('SeaBank', a)) / 2;
check('Selisih net sentiment onboarding', idNum(gap('Onboarding & verifikasi'), 1), '-27,3');
check('Selisih net sentiment error', idNum(gap('Error & performa'), 1), '-24,5');
check('Selisih net sentiment CS', idNum(gap('Layanan CS'), 1), '39,9');
check('Selisih net sentiment keamanan', idNum(gap('Keamanan & penipuan'), 1), '19,9');
check('Driver rating onboarding', idNum(rev.drivers.find((d) => d.aspek === 'Onboarding & verifikasi').koefisien, 2), '-1,76');
const conf = extra.sentiment_validation.confusion;
const diag = conf[0].model_negatif + conf[1].model_netral + conf[2].model_positif;
const tot = conf.reduce((s, r) => s + r.model_negatif + r.model_netral + r.model_positif, 0);
check('Akurasi validasi sentimen dari confusion matrix', fmtPct(diag / tot), fmtPct(extra.sentiment_validation.accuracy));

check('Titik POI dan heksagon', `${idNum(kpi.radar.n_poi)} / ${idNum(kpi.radar.n_hex)}`, '2.188 / 428');
check('Jumlah titik di GeoJSON = titik POI', idNum(geo.features.reduce((s, f) => s + ['kantor', 'kampus', 'sekolah', 'stasiun', 'mal'].reduce((a, c) => a + f.properties[c], 0), 0)), '2.188');
check('Lokasi top-20 tangguh', `${kpi.radar.stable_80} dari 20`, '11 dari 20');
const prep = prepareRadar(geo);
const sc = scoreRadar(prep, top20.weights);
check('Skor Radar browser = notebook (selisih maks < 0,006)', String(Math.max(...sc.map((v, i) => Math.abs(v - prep.props[i].score))) < 0.006), 'true');
check('Urutan top-20 browser = notebook', String(selectTop(prep, sc).every((i, r) => prep.props[i].hex === top20.top20[r].hex)), 'true');

const ev = road.evaluation;
check('Sampel A/B per kelompok', idNum(Math.ceil(ev.power.n_cluster)), '7.529');
check('MDE power 80%', `${idNum(ev.power.mde80 * 100, 0)} pp`, '4 pp');
check('Estimasi DiD', `${idNum(ev.did.est * 100, 2)} pp`, '11,01 pp');

console.log(fail ? `\n${fail} pemeriksaan GAGAL` : '\nSemua pemeriksaan lolos: angka dashboard sama dengan output notebook.');
process.exit(fail ? 1 : 0);
