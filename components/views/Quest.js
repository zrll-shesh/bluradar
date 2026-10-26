'use client';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { D, COLORS } from '../lib/data';
import { fmtPct, fmtRp, idNum, pp } from '../lib/format.mjs';
import { Callout, Legend, Panel, Seg, Stat, TT } from '../ui';

const MODEL_COLOR = { 'S-learner': COLORS.blu, 'T-learner': COLORS.slate, 'X-learner': COLORS.orange };
const TIER_COLOR = ['#c3ced5', '#9fdee3', '#1fb8c3', '#14325c', '#0c2230'];
const SEG_INFO = {
  Persuadable: ['Aktif karena dinudge', 'Target utama reward'],
  'Sure thing': ['Aktif tanpa nudge', 'Reward terbuang'],
  'Lost cause': ['Tetap tidak aktif', 'Reward terbuang'],
  'Sleeping dog': ['Justru menjauh bila diganggu', 'Jangan dinudge'],
};

export default function Quest() {
  const U = D.uplift;
  const M = D.markov;
  const K = D.kpi;
  const [scen, setScen] = useState('radar');
  const evalRow = D.extra.uplift_eval.find((e) => e.model === U.best_model);
  const qtotal = evalRow.q_total;
  const frac = U.qini[U.best_model].frac;
  const qini = frac.map((f, i) => ({ f: f * 100, ...Object.fromEntries(Object.entries(U.qini).map(([k, v]) => [k, v.q[i]])), Acak: qtotal * f }));
  const deciles = U.decile_observed_pp.map((v, i) => ({ d: i + 1, v }));
  const tt = D.extra.targeting_table;
  const bm = tt.find((r) => r.kebijakan === 'Anggaran 30%: model uplift');
  const br = tt.find((r) => r.kebijakan === 'Anggaran 30%: acak');
  const fair = D.extra.fairness;
  const di = Math.min(...fair.map((f) => f.tingkat_seleksi)) / Math.max(...fair.map((f) => f.tingkat_seleksi));
  const dist = scen === 'radar' ? M.dist_radar : M.dist_base;
  const area = dist.map((row, m) => ({ m: m + 1, ...Object.fromEntries(M.states.map((s, j) => [s, row[j] * 100])) }));
  const active = (d, m) => 1 - d[m][0];
  const evalSorted = [...D.extra.uplift_eval].sort((a, b) => b.qini_gain - a.qini_gain);

  return (
    <>
      <div className="stats">
        <Stat label="Efek rata-rata nudge" value={pp(U.ate_pp, 2)} note="kenaikan tingkat aktivasi bila dinudge (data eksperimen)" src="publik" />
        <Stat label="Anggaran nudge 30%" value={`${idNum(K.uplift.budget_mult, 2)}x`} note="tambahan aktivasi model uplift dibanding pilihan acak" src="publik" tone="good" />
        <Stat label="Nilai aktivasi 36 bulan" value={fmtRp(U.targeting.v_activation)} note="selisih nilai nasabah yang mulai aktif vs dorman" src="asumsi" />
        <Stat label="Nasabah aktif di bulan ke-36" value={`${fmtPct(K.markov.active_36_base)} → ${fmtPct(K.markov.active_36_radar)}`} small note="baseline vs bluRadar (model migrasi tier)" src="asumsi" tone="blu" />
      </div>

      <Panel title="Katalog misi QUEST: kebiasaan dulu, reward dari mitra" sub="Misi 30 hari pertama dibangun di atas tab Mission bluLoyalty yang sudah ada. Reward sebagian besar didanai mitra." src={['kasus']}
        read={{
          ringkas: 'Nasabah baru diberi misi kecil yang membangun kebiasaan: menyalakan tabungan receh, autodebit di hari gajian, bayar QRIS di mitra. Setiap misi selesai ada hadiah kecil dari mitra.',
          bisnis: `${D.quests.partner_value}. Insentif berbasis kebiasaan menjawab permintaan kasus untuk engagement tanpa bergantung pada promo sesaat.`,
          teknis: 'Setiap misi punya pemicu (hari ke-n), reward, pendana, dan KPI. Misi Q7 (naik ke bluPro) adalah salah satu jalan menjadi QAC. Siapa yang menerima nudge ditentukan model uplift di bawah.',
        }}>
        <div className="table-wrap">
          <table className="t">
            <thead><tr><th>Kode</th><th>Misi</th><th>Pemicu</th><th>Reward</th><th>Pendana reward</th><th>KPI</th></tr></thead>
            <tbody>{D.quests.quests.map((q) => <tr key={q.Kode}><td><b>{q.Kode}</b></td><td><b>{q.Misi}</b></td><td>{q.Pemicu}</td><td>{q.Reward}</td><td className="muted">{q['Pendana reward']}</td><td>{q.KPI}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>

      <section className="grid-wide">
        <Panel title="Siapa yang perlu dinudge: kurva Qini" sub={`Tambahan aktivasi kumulatif saat nasabah dinudge berurutan dari skor uplift tertinggi. Model terbaik: ${U.best_model}.`} src={['publik']}
          read={{
            ringkas: 'Tidak semua nasabah perlu hadiah. Ada yang akan aktif sendiri, ada yang tidak akan aktif walau diberi hadiah. Model ini mencari orang yang benar-benar berubah karena dorongan, supaya hadiah tidak terbuang.',
            bisnis: `Kalau anggaran nudge hanya cukup untuk 30% nasabah, memilih dengan model menghasilkan ${idNum(bm.tambahan_aktivasi, 1)} tambahan aktivasi per 10.000 nasabah, dibanding ${idNum(br.tambahan_aktivasi, 1)} bila dipilih acak (${idNum(K.uplift.budget_mult, 2)}x).`,
            teknis: `S-, T-, dan X-learner dengan HistGradientBoosting pada dataset Hillstrom (eksperimen email acak, 42.693 pelanggan, test 30%). Qini gain = luas area di atas garis acak relatif terhadap luas area acak. ${U.best_model}: Qini gain ${fmtPct(evalRow.qini_gain)}, menangkap ${fmtPct(K.uplift.capture_top30)} efek dengan menargetkan 30% teratas. Ini bukti metode; di pilot model dilatih ulang dengan data A/B blu.`,
          }}>
          <div className="chart" style={{ height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={qini} margin={{ left: 0, right: 12, top: 8 }}>
                <CartesianGrid stroke="#e3ecef" vertical={false} />
                <XAxis dataKey="f" type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v)}%`} />
                <YAxis tick={{ fontSize: 12 }} width={44} />
                <ReferenceLine x={30} stroke="#0c2230" strokeDasharray="4 4" label={{ value: 'Anggaran 30%', position: 'insideTopLeft', fontSize: 11.5, fill: '#0c2230' }} />
                <Tooltip content={<TT fmt={(v) => idNum(v, 1)} title={(l) => `${idNum(l, 0)}% nasabah dinudge`} />} />
                {Object.keys(U.qini).map((k) => <Line key={k} dataKey={k} name={k} stroke={MODEL_COLOR[k]} strokeWidth={k === U.best_model ? 3 : 1.5} dot={false} />)}
                <Line dataKey="Acak" name="Targeting acak" stroke="#9aa5b1" strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[...Object.keys(U.qini).map((k) => [MODEL_COLOR[k], k]), ['#9aa5b1', 'Targeting acak']]} />
        </Panel>
        <Panel title="Hasil dengan anggaran 30%" sub="Per 10.000 nasabah baru." src={['publik', 'asumsi']}>
          <div className="chart" style={{ height: 170 }}>
            <ResponsiveContainer>
              <BarChart data={[{ n: 'Model uplift', v: bm.tambahan_aktivasi }, { n: 'Pilih acak', v: br.tambahan_aktivasi }]} layout="vertical" margin={{ left: 0, right: 50 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="n" width={100} tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT fmt={(v) => `${idNum(v, 1)} aktivasi`} />} cursor={{ fill: '#eef4f5' }} />
                <Bar dataKey="v" name="Tambahan aktivasi" barSize={30} radius={[0, 6, 6, 0]}>
                  <Cell fill={COLORS.blu} /><Cell fill="#c3ced5" />
                  <LabelList dataKey="v" position="right" formatter={(v) => idNum(v, 1)} style={{ fontWeight: 800, fontSize: 14, fill: '#0c2230' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="kv">
            <span>Laba bersih kampanye, model</span><b>{fmtRp(bm.laba_bersih)}</b>
            <span>Laba bersih kampanye, acak</span><b>{fmtRp(br.laba_bersih)}</b>
            <span>Biaya komunikasi per nudge</span><b>{fmtRp(U.targeting.cost_contact)}</b>
            <span>Reward porsi blu per misi selesai</span><b>{fmtRp(U.targeting.reward)}</b>
          </div>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Model</th><th className="num">Qini gain</th><th className="num">Efek di top 30%</th></tr></thead>
              <tbody>{evalSorted.map((e) => <tr key={e.model} className={e.model === U.best_model ? 'hl' : ''}><td>{e.model}</td><td className="num">{fmtPct(e.qini_gain)}</td><td className="num">{fmtPct(e.capture_top30)}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="grid-3">
        <Panel title="Uplift teramati per desil" sub="Uplift nyata di data test, bukan prediksi. Desil 1 = skor uplift tertinggi." src={['publik']} className="span-2">
          <div className="chart" style={{ height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={deciles} margin={{ left: -10, right: 10, top: 20 }}>
                <CartesianGrid vertical={false} stroke="#e3ecef" />
                <XAxis dataKey="d" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}`} />
                <ReferenceLine y={U.ate_pp} stroke={COLORS.red} strokeDasharray="4 4" label={{ value: `rata-rata ${idNum(U.ate_pp, 1)} pp`, position: 'insideTopRight', fontSize: 11, fill: COLORS.red }} />
                <Tooltip content={<TT fmt={(v) => `${idNum(v, 2)} pp`} title={(l) => `Desil ${l}`} />} cursor={{ fill: '#eef4f5' }} />
                <Bar dataKey="v" name="Uplift teramati" radius={[4, 4, 0, 0]}>
                  {deciles.map((d) => <Cell key={d.d} fill={d.v > U.ate_pp ? COLORS.blu : '#c3ced5'} />)}
                  <LabelList dataKey="v" position="top" formatter={(v) => idNum(v, 1)} style={{ fontSize: 11.5, fontWeight: 700, fill: '#0c2230' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Empat tipe nasabah" src={['publik']} sub="Estimasi T-learner dengan ambang heuristik.">
          {Object.entries(U.segments).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><b>{k}</b><b>{fmtPct(v)}</b></div>
              <div className="bar-inline"><i style={{ width: `${v * 100}%`, background: k === 'Persuadable' ? COLORS.blu : k === 'Sleeping dog' ? COLORS.red : '#9aa5b1' }} /></div>
              <small className="muted">{SEG_INFO[k][0]}. {SEG_INFO[k][1]}.</small>
            </div>
          ))}
        </Panel>
      </section>

      <Panel title="Keadilan antarwilayah" sub="Bila 30% skor teratas dinudge, apakah tingkat seleksi timpang antarwilayah? Aturan praktis: rasio dampak minimal 0,8." src={['publik']}
        read={{
          ringkas: 'Model sempat lebih jarang memilih nasabah di wilayah pedesaan. Ini terdeteksi, sehingga di implementasi ditambahkan kuota per wilayah agar tidak ada wilayah yang terabaikan.',
          bisnis: 'Temuan ini menunjukkan tata kelola AI bekerja: masalah terlihat sebelum model dipakai ke nasabah sungguhan, dan langkah koreksinya jelas.',
          teknis: `Rasio dampak = tingkat seleksi terendah dibagi tertinggi = ${idNum(di, 2)}, di bawah ambang 0,8. Uplift teramati di kelompok terpilih Rural juga lebih rendah (${idNum(fair[0].uplift_teramati_terpilih_pp, 2)} pp), sehingga sebagian perbedaan sejalan dengan efek nyata. Mitigasi: guardrail kuota per wilayah dan pemantauan rasio setiap retrain.`,
        }}>
        <div className="grid-2">
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Wilayah</th><th className="num">Data test</th><th className="num">Terpilih dinudge</th><th className="num">Uplift teramati</th></tr></thead>
              <tbody>{fair.map((f) => <tr key={f.wilayah}><td><b>{f.wilayah === 'Surburban' ? 'Suburban' : f.wilayah}</b></td><td className="num">{idNum(f.n_test)}</td><td className="num">{fmtPct(f.tingkat_seleksi)}</td><td className="num">{idNum(f.uplift_teramati_terpilih_pp, 2)} pp</td></tr>)}</tbody>
            </table>
          </div>
          <Callout tone="risk" title={`Rasio dampak ${idNum(di, 2)}: perlu guardrail kuota per wilayah`}>Model tidak dipakai apa adanya. Kuota minimum per wilayah dan audit rasio dampak menjadi syarat sebelum skala penuh.</Callout>
        </div>
      </Panel>

      <section className="grid-wide">
        <Panel title="Ke mana nasabah baru bergerak dalam 36 bulan" sub="Model Markov migrasi tier bluLoyalty. Kohort dimulai di hari ke-30 dengan QAC 30% (baseline) atau 50% (bluRadar)." src={['kasus', 'asumsi']}
          actions={<Seg small options={[['base', 'Baseline'], ['radar', 'bluRadar']]} value={scen} onChange={setScen} label="Skenario" />}
          read={{
            ringkas: 'Nasabah yang aktif sejak awal cenderung tetap aktif dan saldonya naik. Dengan bluRadar, lebih banyak nasabah mulai aktif dan lebih sedikit yang tertidur.',
            bisnis: `Nilai 36 bulan per akun baru naik dari ${fmtRp(M.ltv_base)} menjadi ${fmtRp(M.ltv_radar)}. Dari 2.000 skenario perturbasi, tambahan nilainya positif di ${fmtPct(K.markov.diff_pos)} skenario (median ${fmtRp(M.mc_percentiles.p50)}).`,
            teknis: 'State: Dorman, Newbie, Pro, Grande, Elite. bluRadar hanya memperbaiki transisi Dorman, Newbie, dan Pro; Grande dan Elite dibuat sama (konservatif). Nilai bulanan = saldo × NIM × LDR / 12 + komisi per nasabah aktif / 12 − biaya layanan, diskonto 10% per tahun.',
          }}>
          <div className="chart" style={{ height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={area} margin={{ left: -6, right: 10, top: 6 }}>
                <CartesianGrid stroke="#e3ecef" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 12 }} tickFormatter={(v) => `B${v}`} interval={5} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${Math.round(v)}%`} />
                <Tooltip content={<TT fmt={(v) => `${idNum(v, 1)}%`} title={(l) => `Bulan ${l}`} />} />
                {M.states.map((s, i) => <Area key={s} type="monotone" dataKey={s} name={s} stackId="1" stroke={TIER_COLOR[i]} fill={TIER_COLOR[i]} fillOpacity={0.95} />)}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Legend items={M.states.map((s, i) => [TIER_COLOR[i], s])} />
        </Panel>
        <Panel title="Nilai per nasabah" src={['kasus', 'asumsi']}>
          <div className="kv">
            <span>Aktif bulan ke-12</span><b>{fmtPct(active(M.dist_base, 11))} → {fmtPct(active(M.dist_radar, 11))}</b>
            <span>Aktif bulan ke-36</span><b>{fmtPct(active(M.dist_base, 35))} → {fmtPct(active(M.dist_radar, 35))}</b>
            <span>LTV 36 bulan, baseline</span><b>{fmtRp(M.ltv_base)}</b>
            <span>LTV 36 bulan, bluRadar</span><b>{fmtRp(M.ltv_radar)}</b>
            <span>Tambahan LTV, P5 / median / P95</span><b>{fmtRp(M.mc_percentiles.p5)} / {fmtRp(M.mc_percentiles.p50)} / {fmtRp(M.mc_percentiles.p95)}</b>
          </div>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>State</th><th className="num">Saldo asumsi</th><th className="num">Nilai per bulan</th></tr></thead>
              <tbody>{M.states.map((s, i) => <tr key={s}><td><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: TIER_COLOR[i], marginRight: 8 }} />{s}</td><td className="num">{fmtRp(M.balance[i])}</td><td className="num">{fmtRp(M.value_per_month[i], 2)}</td></tr>)}</tbody>
            </table>
          </div>
          <Callout tone="info" title="Margin dana konservatif">NIM 7,05% dikali rasio kredit terhadap DPK sekitar 57%, karena hanya dana yang tersalurkan ke kredit yang menghasilkan margin bunga.</Callout>
        </Panel>
      </section>
    </>
  );
}
