'use client';
import { D, COLORS } from '../lib/data';
import { idNum, pp } from '../lib/format.mjs';
import { Callout, Panel, Stat } from '../ui';

const GOV = [
  ['Persetujuan data (UU PDP)', 'Consent eksplisit di kuis booth, hanya data yang diperlukan untuk rekomendasi yang dikumpulkan, review tim kepatuhan.'],
  ['Keadilan antarwilayah', 'Rasio dampak seleksi nudge dipantau setiap retrain; temuan rasio 0,62 di data eksperimen ditangani dengan kuota minimum per wilayah.'],
  ['Bisa dijelaskan', 'Skor lokasi bisa diurai per kategori titik; skor nudge dijelaskan dengan permutation importance dan SHAP.'],
  ['Manusia tetap memutuskan', 'Sales dan supervisor boleh mengabaikan rekomendasi; alasan override dicatat untuk perbaikan model.'],
  ['Anti kecurangan QAC', 'Ambang transaksi, deteksi anomali pola aktivasi, dan audit acak sebelum bonus dibayarkan.'],
  ['Mulai dari aturan', 'Fase awal memakai aturan dan skor Radar; model ML baru menggantikan setelah data pilot cukup.'],
];

function riskColor(score) {
  if (score >= 13) return '#f6c9c9';
  if (score >= 7) return '#fbe2c4';
  return '#d7efe3';
}

export default function Plan() {
  const R = D.roadmap;
  const ev = R.evaluation;
  const risks = R.risks;

  return (
    <>
      <div className="stats">
        <Stat label="Sampel per kelompok A/B" value={idNum(Math.ceil(ev.power.n_cluster))} note={`akun, setara ${idNum(ev.power.clusters)} lokasi-minggu (design effect ${idNum(ev.power.DE, 2)})`} src="simulasi" />
        <Stat label="Kapasitas pilot per kelompok" value={idNum(ev.power.pilot_per_arm)} note="akun, cukup untuk mendeteksi efek" src="asumsi" tone="good" />
        <Stat label="Efek terkecil yang terdeteksi" value={pp(ev.power.mde80 * 100, 0)} note="kenaikan QAC dengan power 80% pada ukuran pilot" src="simulasi" />
        <Stat label="Uji desain DiD" value={`+${idNum(ev.did.est * 100, 1)} pp`} note={`efek sebenarnya +${idNum(ev.did.true * 100, 0)} pp, 95% CI ${idNum(ev.did.ci_low * 100, 1)} s.d. ${idNum(ev.did.ci_high * 100, 1)} pp`} src="simulasi" tone="blu" />
      </div>

      <Panel title="Roadmap: pilot 3 bulan, skala dalam 18 bulan" sub="Setiap fase punya syarat lanjut yang terukur, sehingga keputusan ekspansi berbasis bukti." src={['asumsi']}
        read={{
          ringkas: 'Dimulai kecil di Jabodetabek selama 3 bulan, dibandingkan dengan tim yang bekerja seperti biasa. Kalau terbukti lebih hemat, baru diperluas ke Jawa Barat, Jawa Timur, lalu wilayah lain.',
          bisnis: 'Risiko investasi dibatasi: anggaran besar hanya dikeluarkan setelah pilot lolos kriteria go/no-go, yaitu biaya per QAC turun minimal 25% dan efeknya terbukti secara statistik.',
          teknis: 'Fase 0 membangun tracking QAC dan kode referral per sales. Fase 1 menjalankan A/B berbasis lokasi dengan bandit mingguan. Fase 2 melatih ulang model uplift dan bandit dengan data pilot. Evaluasi memakai difference-in-differences dengan SE terklaster per lokasi.',
        }}>
        <div className="roadmap">
          {R.roadmap.map((ph, i) => (
            <div key={ph.fase} className={i === 1 ? 'phase now' : 'phase'}>
              <span className="when">{ph.waktu}</span>
              <h4>{ph.fase.replace(/^\d+\.\s*/, '')}</h4>
              <dl>
                <dt>Aktivitas</dt><dd>{ph.aktivitas}</dd>
                <dt>KPI dan target</dt><dd>{ph.kpi_target}</dd>
                <dt>Syarat lanjut</dt><dd>{ph.go_no_go}</dd>
              </dl>
            </div>
          ))}
        </div>
      </Panel>

      <section className="grid-2">
        <Panel title="KPI dalam empat dimensi yang diminta kasus" src={['kasus']}>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Dimensi</th><th>KPI</th></tr></thead>
              <tbody>{R.kpis.map((k) => <tr key={k.dimensi}><td><b>{k.dimensi}</b></td><td>{k.kpi}</td></tr>)}</tbody>
            </table>
          </div>
          <Callout tone="info" title="North Star: QAC">Nasabah baru yang dalam 30 hari bertransaksi minimal 4 kali dan memakai minimal satu produk lengket (autodebit bluSaving, bluGenie, bluGether) atau mencapai saldo setara bluPro.</Callout>
        </Panel>
        <Panel title="Cara membuktikan dampak, bukan sekadar mengklaim" src={['simulasi']}
          read={{
            ringkas: 'Separuh lokasi memakai bluRadar, separuh lagi bekerja seperti biasa. Hasil kedua kelompok dibandingkan sebelum dan sesudah, sehingga kenaikan yang terlihat memang karena bluRadar.',
            bisnis: 'Desain ini menjawab pertanyaan juri dan manajemen: dari mana kita tahu kenaikan QAC bukan kebetulan atau karena musim? Simulasi menunjukkan desainnya mampu menemukan efek yang benar.',
            teknis: `Uji dua proporsi (30% ke 35%, α 5%, power 80%) butuh ${idNum(1377)} akun per kelompok; dikali design effect 1 + (150 − 1) × 0,03 = ${idNum(ev.power.DE, 2)} menjadi ${idNum(Math.ceil(ev.power.n_cluster))}. Simulasi DiD 40 lokasi, 4 minggu sebelum dan 8 sesudah, WLS dengan efek tetap lokasi dan minggu, SE terklaster.`,
          }}>
          <div className="kv">
            <span>Desain</span><b>{ev.design}</b>
            <span>Sampel tanpa klaster per kelompok</span><b>{idNum(1377)} akun</b>
            <span>Design effect (m = 150, ICC = 0,03)</span><b>{idNum(ev.power.DE, 2)}</b>
            <span>Sampel dengan klaster per kelompok</span><b>{idNum(Math.ceil(ev.power.n_cluster))} akun</b>
            <span>Efek sebenarnya di simulasi</span><b>+{idNum(ev.did.true * 100, 1)} pp</b>
            <span>Estimasi DiD</span><b>+{idNum(ev.did.est * 100, 2)} pp</b>
            <span>Efek sebenarnya di dalam CI 95%</span><b style={{ color: COLORS.green }}>{ev.did.ci_low <= ev.did.true && ev.did.true <= ev.did.ci_high ? 'Ya' : 'Tidak'}</b>
          </div>
        </Panel>
      </section>

      <section className="grid-wide">
        <Panel title="Matriks risiko" sub="Kemungkinan (horizontal) dan dampak (vertikal), skala 1 sampai 5." src={['asumsi']}>
          <div className="riskgrid">
            {[5, 4, 3, 2, 1].map((imp) => [
              <div key={`a${imp}`} className="riskaxis">{imp}</div>,
              ...[1, 2, 3, 4, 5].map((lik) => (
                <div key={`${imp}-${lik}`} className="riskcell" style={{ background: riskColor(imp * lik) }}>
                  {risks.filter((r) => r.kemungkinan === lik && r.dampak === imp).map((r) => <span key={r.risiko}>{r.risiko}</span>)}
                </div>
              )),
            ])}
            <div />
            {[1, 2, 3, 4, 5].map((l) => <div key={`l${l}`} className="riskaxis">{l}</div>)}
          </div>
        </Panel>
        <Panel title="Mitigasi per risiko" src={['asumsi']}>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Risiko</th><th className="num">Skor</th><th>Mitigasi</th></tr></thead>
              <tbody>{[...risks].sort((a, b) => b.skor - a.skor).map((r) => <tr key={r.risiko}><td><b>{r.risiko}</b></td><td className="num"><span className="pill-num" style={{ background: riskColor(r.skor) }}>{r.skor}</span></td><td className="muted">{r.mitigasi}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </section>

      <Panel title="Tata kelola AI" sub="Prinsip yang menjadi syarat sebelum model menyentuh nasabah sungguhan.">
        <div className="grid-3" style={{ gap: 14 }}>
          {GOV.map(([t, d]) => <div key={t} className="phase"><h4 style={{ fontSize: 15 }}>{t}</h4><p className="muted">{d}</p></div>)}
        </div>
      </Panel>
    </>
  );
}
