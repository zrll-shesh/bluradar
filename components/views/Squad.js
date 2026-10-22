'use client';
import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Pause, Play } from 'lucide-react';
import { D, STRAT_COLORS } from '../lib/data';
import { fmtPct, idNum, signedPct } from '../lib/format.mjs';
import { Callout, Legend, Panel, Seg, Stat, TT } from '../ui';

const PAYDAY = [4, 8, 12];
const EXAM = [7, 8];

export default function Squad() {
  const B = D.bandit;
  const [view, setView] = useState('qac');
  const [week, setWeek] = useState(1);
  const [playing, setPlaying] = useState(false);
  const strategies = Object.keys(B.mean_cumulative_qac);
  const series = view === 'qac' ? B.mean_cumulative_qac : B.mean_cumulative_regret;
  const rows = B.weeks.map((w, i) => Object.fromEntries([['week', w], ...Object.entries(series).map(([k, v]) => [k, v[i]])]));
  const ts = B.summary.find((s) => s.strategi.startsWith('Thompson'));
  const intu = B.summary.find((s) => s.strategi.startsWith('Intuisi'));
  const cross = B.weeks.find((w, i) => B.mean_cumulative_qac['Thompson Sampling kontekstual'][i] > B.mean_cumulative_qac['Intuisi (skor statis)'][i]);
  const alloc = B.sample_allocation_ts.find((a) => a.week === week).ranks;
  const freq = B.arms.map((a) => ({ rank: a.rank, n: B.sample_allocation_ts.filter((x) => x.ranks.includes(a.rank)).length }));
  const always = freq.filter((f) => f.n === 12).map((f) => `#${f.rank}`);
  const often = freq.filter((f) => f.n >= 9 && f.n < 12).map((f) => `#${f.rank}`);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setWeek((w) => (w >= 12 ? 1 : w + 1)), 900);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <>
      <div className="stats">
        <Stat label="Thompson Sampling vs intuisi" value={signedPct(ts.vs_intuisi)} note={`Total QAC ${idNum(ts.total_qac_rata2)} vs ${idNum(intu.total_qac_rata2)} dalam 12 minggu`} src="simulasi" tone="good" />
        <Stat label="Potensi maksimum yang ditangkap" value={fmtPct(ts.porsi_oracle)} note="dibanding Oracle yang tahu hasil setiap lokasi" src="simulasi" />
        <Stat label="Menang dari intuisi" value={fmtPct(ts.menang_vs_intuisi)} note={`dari ${B.n_sim} simulasi Monte Carlo`} src="simulasi" />
        <Stat label="Mulai unggul kumulatif" value={`Minggu ${cross}`} note="minggu awal dipakai untuk mencoba lokasi" src="simulasi" />
      </div>

      <section className="grid-wide">
        <Panel title={view === 'qac' ? 'QAC kumulatif per strategi alokasi' : 'QAC yang hilang dibanding keputusan sempurna'} sub={`${B.squads} squad, 20 lokasi Radar, 12 minggu, rata-rata ${B.n_sim} simulasi.`} src={['simulasi']}
          actions={<Seg small options={[['qac', 'QAC kumulatif'], ['regret', 'Regret']]} value={view} onChange={setView} label="Tampilan grafik" />}
          read={{
            ringkas: 'Bayangkan pindah ke kota baru dan mencari warung makan terenak. Kalau selalu makan di tempat yang sama, kamu tidak pernah tahu ada yang lebih enak. Kalau terus mencoba tempat baru, sering kecewa. Thompson Sampling menyeimbangkan keduanya untuk memilih lokasi booth tiap minggu.',
            bisnis: `Skor peta hanya perkiraan awal. Dengan belajar dari hasil QAC tiap minggu, alokasi squad menghasilkan ${signedPct(ts.vs_intuisi)} QAC dibanding selalu memakai 8 lokasi skor tertinggi, tanpa tambahan sales. Di minggu awal hasilnya sedikit di bawah intuisi karena sistem sedang mencoba lokasi; mulai minggu ke-${cross} totalnya menyalip.`,
            teknis: 'Posterior Gamma-Poisson per lokasi dengan prior dari skor Radar (shape 4, koefisien variasi 50%). Eksposur disesuaikan konteks mingguan (gajian, ujian) lewat update konjugat. Hasil sebenarnya per lokasi = prior × noise lognormal (σ 0,45). Metrik memakai QAC harapan agar noise realisasi tidak mengaburkan perbandingan.',
          }}>
          <div className="chart" style={{ height: 340 }}>
            <ResponsiveContainer>
              <LineChart data={rows} margin={{ left: 0, right: 16, top: 8 }}>
                <CartesianGrid stroke="#e3ecef" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} tickFormatter={(v) => `M${v}`} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => idNum(v)} width={56} />
                {PAYDAY.map((w) => <ReferenceLine key={w} x={w} stroke="#24855b" strokeDasharray="3 3" />)}
                <Tooltip content={<TT fmt={(v) => idNum(v)} title={(l) => `Minggu ${l}`} />} />
                {Object.keys(series).map((k) => <Line key={k} dataKey={k} name={k} stroke={STRAT_COLORS[k]} strokeWidth={k.startsWith('Thompson') ? 3.2 : 1.8} dot={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[...Object.keys(series).map((k) => [STRAT_COLORS[k], k]), ['#24855b', 'Minggu gajian']]} />
        </Panel>
        <Panel title="Ringkasan 300 simulasi" src={['simulasi']} sub="Interval 95% menunjukkan sebaran total QAC antarsimulasi.">
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Strategi</th><th className="num">Total QAC</th><th className="num">vs intuisi</th></tr></thead>
              <tbody>{B.summary.map((s) => (
                <tr key={s.strategi} className={s.strategi.startsWith('Thompson') ? 'hl' : ''}>
                  <td><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: STRAT_COLORS[s.strategi], marginRight: 8 }} />{s.strategi}<br /><small className="muted">95%: {idNum(s.p2_5)} s.d. {idNum(s.p97_5)}</small></td>
                  <td className="num">{idNum(s.total_qac_rata2)}</td>
                  <td className="num"><b>{s.strategi.startsWith('Intuisi') ? 'acuan' : signedPct(s.vs_intuisi)}</b></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Callout tone="info" title="Oracle adalah batas atas">Oracle tahu hasil setiap lokasi sebelumnya, sesuatu yang mustahil di dunia nyata. Ia dipakai untuk mengukur seberapa dekat strategi lain dengan keputusan terbaik.</Callout>
        </Panel>
      </section>

      <Panel title="Putar ulang alokasi mingguan" sub="Contoh satu simulasi: 8 dari 20 lokasi yang dipilih Thompson Sampling setiap minggu. Lokasi yang terus muncul adalah lokasi yang terbukti menghasilkan QAC." src={['simulasi']}
        actions={<>
          <button className="btn light" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Jeda' : 'Putar'}</button>
          <input type="range" min={1} max={12} value={week} onChange={(e) => { setPlaying(false); setWeek(Number(e.target.value)); }} aria-label="Pilih minggu" style={{ width: 180 }} />
        </>}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div className="big-num">Minggu {week}</div>
          <span className="muted">{PAYDAY.includes(week) ? 'Minggu gajian: lokasi kantor dan mal lebih ramai.' : EXAM.includes(week) ? 'Minggu ujian: lokasi kampus dan sekolah lebih sepi.' : 'Minggu biasa.'}</span>
        </div>
        <div className="weekgrid">
          {B.arms.map((a) => (
            <div key={a.rank} className={alloc.includes(a.rank) ? 'wk on' : 'wk'} title={a.lokasi}>#{a.rank}<small>skor {idNum(a.score, 0)}</small></div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13.5 }}>
          Lokasi yang dipilih minggu ini: {alloc.map((r) => `#${r}`).join(', ')}. Dalam simulasi ini lokasi {always.join(', ')} dipilih di semua 12 minggu{often.length ? `, ${often.join(', ')} di 9 minggu atau lebih` : ''}; lokasi lain dirotasi untuk dipelajari.
        </p>
        <Callout tone="warn" title="Catatan cakupan">Di cakupan peta saat ini seluruh 20 lokasi berkategori kantor, sehingga efek minggu ujian untuk kampus dan sekolah belum terlihat di simulasi ini.</Callout>
      </Panel>
    </>
  );
}
