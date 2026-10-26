'use client';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RotateCcw } from 'lucide-react';
import { D, COLORS } from '../lib/data';
import { fmtPct, fmtRp, idNum } from '../lib/format.mjs';
import { pilotCalc } from '../lib/finance.mjs';
import { Callout, Legend, Panel, Slider, Stat, TT } from '../ui';

const SCEN_COLOR = { Konservatif: COLORS.orange, Dasar: COLORS.blu, Optimis: COLORS.green };

export default function Finance() {
  const F = D.finance;
  const base = F.pilot_params;
  const [p, setP] = useState(base);
  const r = pilotCalc(p);
  const changed = ['qac_radar', 'insentif_radar', 'volume_radar', 'teknologi', 'bonus_qac'].some((k) => p[k] !== base[k]);
  const pr = F.pilot_result;
  const comps = Object.keys(pr.cost_base);
  const compColor = { 'Insentif akuisisi': COLORS.orange, 'Biaya sales': COLORS.navy, 'Bonus QAC': COLORS.green, 'Teknologi': COLORS.slate };
  const costRows = [
    { n: 'Baseline promo', ...Object.fromEntries(comps.map((c) => [c, pr.cost_base[c] / 1e6])) },
    { n: 'bluRadar', ...Object.fromEntries(comps.map((c) => [c, pr.cost_radar[c] / 1e6])) },
  ];
  const [counts, edges] = F.montecarlo.histogram;
  const hist = counts.map((c, i) => ({ x: (edges[i] + edges[i + 1]) / 2, c, go: (edges[i] + edges[i + 1]) / 2 >= 25 }));
  const tor = [...F.tornado].sort((a, b) => b.rentang - a.rentang).map((t) => ({ ...t, lo: Math.min(t.rendah, t.tinggi), hi: Math.max(t.rendah, t.tinggi) }));
  const baseRed = pr.reduction;
  const torMin = Math.min(...tor.map((t) => t.lo));
  const torMax = Math.max(...tor.map((t) => t.hi));
  const proj = F.projection;
  const streams = F.projection_streams;
  const months = streams.Dasar.cum_incremental.map((_, i) => ({ m: i + 1, ...Object.fromEntries(Object.entries(streams).map(([k, v]) => [k, v.cum_incremental[i] / 1e9])) }));
  const CAPEX_M = 1.5;
  const lineData = [{ m: 0, Konservatif: -CAPEX_M, Dasar: -CAPEX_M, Optimis: -CAPEX_M }, ...months];

  return (
    <>
      <div className="stats">
        <Stat label="Biaya per QAC" value={`${fmtRp(pr.cpq_base)} → ${fmtRp(pr.cpq_radar)}`} small note={`Turun ${fmtPct(pr.reduction)} pada pilot 12 minggu`} src="asumsi" tone="blu" />
        <Stat label="Peluang lolos go/no-go" value={fmtPct(F.montecarlo.p_go)} note="penurunan ≥ 25% di 10.000 skenario Monte Carlo" src="simulasi" tone="good" />
        <Stat label="NPV inkremental 3 tahun" value={fmtRp(proj[1].npv_inkremental, 2)} small note={`Skenario dasar; konservatif ${fmtRp(proj[0].npv_inkremental, 2)}`} src="asumsi" />
        <Stat label="Payback" value={`Bulan ke-${proj[1].payback_bulan}`} note="termasuk investasi awal Rp1,5 M di bulan 0" src="asumsi" />
      </div>

      <section className="grid-wide">
        <Panel title="Kalkulator biaya per QAC" sub="Geser asumsi bluRadar. Rumusnya sama dengan notebook; dengan asumsi awal hasilnya tepat Rp109,6 rb." src={['asumsi']}
          actions={<button className="btn light" onClick={() => setP(base)} disabled={!changed}><RotateCcw size={14} /> Kembali ke asumsi notebook</button>}
          read={{
            ringkas: 'Program lama memberi hadiah besar ke semua orang, tetapi hanya sebagian yang benar-benar memakai blu. bluRadar memberi hadiah lebih kecil dan memilih orang yang tepat, sehingga biaya untuk mendapatkan satu nasabah aktif jauh lebih murah.',
            bisnis: `Dengan anggaran lebih kecil (${fmtRp(pr.total_radar, 2)} vs ${fmtRp(pr.total_base, 2)}), bluRadar menghasilkan ${idNum(pr.qac_radar)} QAC dibanding ${idNum(pr.qac_base)}. Asumsi paling menentukan adalah tingkat QAC; ambang go/no-go pilot adalah penurunan biaya per QAC minimal 25%.`,
            teknis: F.formula.replace('biaya_per_qac', 'Biaya per QAC') + '. Baseline: insentif Rp50 rb per akun, tingkat QAC 30%, tanpa bonus dan teknologi. Biaya sales identik di kedua skenario (30 sales × Rp6 jt × 3 bulan).',
          }}>
          <div className="sliders">
            <Slider label="Tingkat QAC" value={p.qac_radar} min={0.3} max={0.7} step={0.01} onChange={(v) => setP({ ...p, qac_radar: v })} format={(v) => fmtPct(v, 0)} />
            <Slider label="Volume akun" value={p.volume_radar} min={0.7} max={1.1} step={0.05} onChange={(v) => setP({ ...p, volume_radar: v })} format={(v) => fmtPct(v, 0)} />
            <Slider label="Insentif/akun" value={p.insentif_radar} min={5000} max={35000} step={1000} onChange={(v) => setP({ ...p, insentif_radar: v })} format={(v) => fmtRp(v, 0)} />
            <Slider label="Bonus/QAC" value={p.bonus_qac} min={0} max={20000} step={1000} onChange={(v) => setP({ ...p, bonus_qac: v })} format={(v) => fmtRp(v, 0)} />
            <Slider label="Teknologi" value={p.teknologi} min={200e6} max={800e6} step={25e6} onChange={(v) => setP({ ...p, teknologi: v })} format={(v) => fmtRp(v, 0)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="stat"><div className="stat-top">Biaya per QAC bluRadar</div><strong className="sm" style={{ color: COLORS.bluInk }}>{fmtRp(r.cpqR)}</strong><span className="note">baseline {fmtRp(r.cpqB)}</span></div>
            <div className={`stat ${r.reduction >= 0.25 ? 'good' : 'warn'}`}><div className="stat-top">Penurunan</div><strong className="sm">{fmtPct(r.reduction)}</strong><span className="note">{r.reduction >= 0.25 ? 'lolos ambang go/no-go 25%' : 'di bawah ambang go/no-go 25%'}</span></div>
            <div className="stat"><div className="stat-top">QAC dan total biaya</div><strong className="sm">{idNum(r.qacR)}</strong><span className="note">{fmtRp(r.totR, 2)} vs {fmtRp(r.totB, 2)}</span></div>
          </div>
        </Panel>
        <Panel title="Komposisi biaya pilot" sub="12 minggu, 30 sales, 27.000 akun (Rp juta)." src={['asumsi']}>
          <div className="chart" style={{ height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={costRows} margin={{ left: -6, right: 8, top: 18 }}>
                <CartesianGrid vertical={false} stroke="#e3ecef" />
                <XAxis dataKey="n" tick={{ fontSize: 12.5 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => idNum(v)} />
                <Tooltip content={<TT fmt={(v) => fmtRp(v * 1e6, 2)} />} cursor={{ fill: '#eef4f5' }} />
                {comps.map((c, i) => (
                  <Bar key={c} dataKey={c} name={c} stackId="a" fill={compColor[c]} barSize={70}>
                    {i === comps.length - 1 && <LabelList position="top" content={({ x, y, width, index }) => <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={13} fontWeight={800} fill="#0c2230">{fmtRp(index ? pr.total_radar : pr.total_base, 2)}</text>} />}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={comps.map((c) => [compColor[c], c])} />
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Komponen</th><th className="num">Baseline</th><th className="num">bluRadar</th></tr></thead>
              <tbody>{D.extra.pilot_table.map((row) => <tr key={row.Komponen} className={row.Komponen === 'Biaya per QAC' ? 'hl' : ''}><td>{row.Komponen}</td><td className="num">{row['Baseline (promo)']}</td><td className="num">{row.bluRadar}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="grid-2">
        <Panel title="Monte Carlo 10.000 skenario" sub="Semua asumsi diacak sekaligus, termasuk risiko akun turun karena promo besar dihapus (volume 75-105%)." src={['simulasi']}
          read={{
            ringkas: 'Kami mencoba 10.000 kemungkinan kondisi lapangan, dari yang buruk sampai yang baik. Di hampir semua kemungkinan, bluRadar tetap lebih hemat.',
            bisnis: `Median penurunan ${fmtPct(F.montecarlo.p50)}; bahkan di skenario 5% terburuk masih turun ${fmtPct(F.montecarlo.p5)}. Peluang bluRadar lebih efisien dari baseline ${fmtPct(D.kpi.montecarlo.p_pos)}.`,
            teknis: 'QAC baseline Beta(30,70), QAC bluRadar Beta(20,20), volume segitiga(0,75; 0,95; 1,05), insentif, bonus, teknologi, dan biaya sales berdistribusi segitiga. Histogram 40 bin dari notebook.',
          }}>
          <div className="chart" style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={hist} margin={{ left: -10, right: 10, top: 10 }} barCategoryGap={1}>
                <XAxis dataKey="x" type="number" domain={[edges[0], edges[edges.length - 1]]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${idNum(v, 0)}%`} />
                <YAxis tick={{ fontSize: 12 }} />
                <ReferenceLine x={25} stroke={COLORS.red} strokeWidth={2} label={{ value: 'ambang 25%', position: 'insideTopRight', fontSize: 11.5, fill: COLORS.red }} />
                <ReferenceLine x={F.montecarlo.p50 * 100} stroke="#0c2230" strokeDasharray="4 4" label={{ value: `median ${fmtPct(F.montecarlo.p50)}`, position: 'insideTopLeft', fontSize: 11.5, fill: '#0c2230' }} />
                <Tooltip content={<TT fmt={(v) => `${idNum(v)} skenario`} title={(l) => `Penurunan sekitar ${idNum(l, 1)}%`} />} cursor={{ fill: '#eef4f5' }} />
                <Bar dataKey="c" name="Skenario">{hist.map((h, i) => <Cell key={i} fill={h.go ? COLORS.blu : '#c3ced5'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="kv"><span>P5 / median / P95</span><b>{fmtPct(F.montecarlo.p5)} / {fmtPct(F.montecarlo.p50)} / {fmtPct(F.montecarlo.p95)}</b></div>
        </Panel>
        <Panel title="Asumsi mana yang paling menentukan" sub={`Tornado: penurunan biaya per QAC saat satu asumsi digeser ke batas bawah dan atas (basis ${fmtPct(baseRed)}).`} src={['asumsi']}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {tor.map((t) => {
              const span = torMax - torMin;
              const left = ((t.lo - torMin) / span) * 100;
              const mid = ((baseRed - torMin) / span) * 100;
              const right = ((t.hi - torMin) / span) * 100;
              return (
                <div key={t.faktor} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 8, alignItems: 'center', fontSize: 13 }}>
                  <span>{t.faktor}</span>
                  <div style={{ position: 'relative', height: 26, margin: '0 46px' }}>
                    <div style={{ position: 'absolute', left: `${left}%`, width: `${mid - left}%`, top: 3, bottom: 3, background: COLORS.red, borderRadius: '4px 0 0 4px' }} />
                    <div style={{ position: 'absolute', left: `${mid}%`, width: `${right - mid}%`, top: 3, bottom: 3, background: COLORS.green, borderRadius: '0 4px 4px 0' }} />
                    <div style={{ position: 'absolute', left: `${mid}%`, top: 0, bottom: 0, width: 2, background: '#0c2230' }} />
                    <span style={{ position: 'absolute', right: `${100 - left + 1}%`, top: 4, fontSize: 11.5, fontWeight: 700 }}>{fmtPct(t.lo)}</span>
                    <span style={{ position: 'absolute', left: `${right + 1}%`, top: 4, fontSize: 11.5, fontWeight: 700 }}>{fmtPct(t.hi)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Legend items={[[COLORS.red, 'Asumsi memburuk'], [COLORS.green, 'Asumsi membaik']]} />
          <Callout tone="good" title="Tetap di atas ambang">Bahkan saat asumsi paling sensitif (tingkat QAC bluRadar 40%) memburuk, penurunan biaya masih {fmtPct(tor[0].lo)}, jauh di atas ambang go/no-go 25%.</Callout>
        </Panel>
      </section>

      <section className="grid-wide">
        <Panel title="Proyeksi 3 tahun: arus kas inkremental kumulatif" sub="Kohort bulanan 120 rb, 240 rb, 360 rb akun per tahun; nilai dari model Markov; investasi awal Rp1,5 M di bulan 0 dan operasional teknologi Rp1,2 M per tahun (Rp miliar)." src={['asumsi']}
          read={{
            ringkas: 'Setelah biaya awal pembangunan sistem, bluRadar mulai balik modal di bulan ke-6, lalu keuntungannya terus bertambah karena nasabah yang diperoleh lebih aktif dan saldonya tumbuh.',
            bisnis: `Skenario dasar: NPV inkremental ${fmtRp(proj[1].npv_inkremental, 2)}, ROI ${idNum(proj[1].roi_terhadap_teknologi, 1)}x terhadap biaya teknologi, tambahan DPK ${fmtRp(proj[1].tambahan_dpk_bulan36, 2)} di bulan ke-36 (${fmtPct(proj[1].tambahan_dpk_vs_dpk_blu, 2)} DPK blu saat ini).`,
            teknis: 'Arus kas inkremental = arus kas bluRadar − baseline. Nilai per kohort dari aliran nilai bulanan rantai Markov; biaya sales identik di kedua skenario karena tenaga sales sama. Diskonto 10% per tahun.',
          }}>
          <div className="chart" style={{ height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={lineData} margin={{ left: -4, right: 16, top: 8 }}>
                <CartesianGrid stroke="#e3ecef" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 12 }} tickFormatter={(v) => `B${v}`} interval={5} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => idNum(v)} />
                <ReferenceLine y={0} stroke="#0c2230" />
                <ReferenceLine x={6} stroke="#0c2230" strokeDasharray="4 4" label={{ value: 'payback', position: 'insideTopLeft', fontSize: 11.5 }} />
                <Tooltip content={<TT fmt={(v) => `Rp${idNum(v, 2)} M`} title={(l) => `Bulan ${l}`} />} />
                {Object.keys(SCEN_COLOR).map((k) => <Line key={k} dataKey={k} name={k} stroke={SCEN_COLOR[k]} strokeWidth={k === 'Dasar' ? 3 : 1.8} dot={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Legend items={Object.entries(SCEN_COLOR).map(([k, v]) => [v, k])} />
        </Panel>
        <Panel title="Tiga skenario" src={['asumsi']}>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th></th>{proj.map((s) => <th key={s.skenario} className="num">{s.skenario}</th>)}</tr></thead>
              <tbody>
                <tr><td>QAC dan volume</td><td className="num">40%, 85%</td><td className="num">50%, 100%</td><td className="num">58%, 105%</td></tr>
                <tr className="hl"><td>NPV inkremental</td>{proj.map((s) => <td key={s.skenario} className="num">{fmtRp(s.npv_inkremental, 2)}</td>)}</tr>
                <tr><td>ROI terhadap teknologi</td>{proj.map((s) => <td key={s.skenario} className="num">{idNum(s.roi_terhadap_teknologi, 1)}x</td>)}</tr>
                <tr><td>Payback</td>{proj.map((s) => <td key={s.skenario} className="num">{`bulan ${s.payback_bulan}`}</td>)}</tr>
                <tr><td>Tambahan QAC 36 bulan</td>{proj.map((s) => <td key={s.skenario} className="num">{idNum(s.tambahan_qac_36bln)}</td>)}</tr>
                <tr><td>Tambahan DPK bulan 36</td>{proj.map((s) => <td key={s.skenario} className="num">{fmtRp(s.tambahan_dpk_bulan36, 2)}</td>)}</tr>
                <tr><td>Terhadap DPK blu</td>{proj.map((s) => <td key={s.skenario} className="num">{fmtPct(s.tambahan_dpk_vs_dpk_blu, 2)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <Callout tone="info" title="Angka ilustratif">Seluruh proyeksi bertumpu pada asumsi yang tercatat di halaman Metodologi & Bukti. Pilot A/B dipakai untuk mengganti asumsi dengan data blu.</Callout>
        </Panel>
      </section>
    </>
  );
}
