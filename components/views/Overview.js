'use client';
import { ArrowRight } from 'lucide-react';
import { D } from '../lib/data';
import { fmtPct, fmtRp, idNum, signedPct } from '../lib/format.mjs';
import { Callout, Panel, Read, Src, Stat, useMode } from '../ui';

const TAG_MAP = [['Data Kasus', 'kasus'], ['Data Publik', 'publik'], ['Asumsi', 'asumsi'], ['Simulasi', 'simulasi']];

function parseInsight(s) {
  const m = s.match(/^\[(.+?)\]\s*(.*)$/);
  if (!m) return { tags: [], text: s };
  return { tags: TAG_MAP.filter(([t]) => m[1].includes(t)).map(([, k]) => k), text: m[2].replace(/->/g, '→').replace(/>=/g, '≥') };
}

export default function Overview({ go }) {
  const mode = useMode();
  const { pilot_result: p, montecarlo: mc } = D.finance;
  const proj = D.kpi.projection_base;
  const mk = D.kpi.markov;
  const topics = D.reviews.topics_blu;
  const accessShare = topics.filter((t) => t.tema === 'Akses dan identitas').reduce((s, t) => s + t.porsi_ulasan_negatif, 0);
  const ts = D.kpi.bandit;
  const maxCpq = p.cpq_base;
  const insights = D.kpi.insights.map(parseInsight);

  const story = [
    ['pasar', 'Masalah', 'Kompetitor punya super-app', '6 dari 8 bank digital pesaing ditopang aplikasi konsumen induk. blu tidak.'],
    ['suara', 'Insight', 'Nasabah tersandung di pintu masuk', `${fmtPct(accessShare)} keluhan negatif blu terjadi saat daftar, verifikasi wajah, login, dan ganti HP.`],
    ['radar', 'Solusi', 'RADAR, ANCHOR, QUEST', 'Tim lapangan tahu ke mana turun, siapa didekati, dan bagaimana menjaga nasabah aktif.'],
    ['finansial', 'Bukti', `Biaya per QAC turun ${fmtPct(p.reduction)}`, `${fmtPct(mc.p_go)} dari 10.000 skenario Monte Carlo lolos ambang go/no-go.`],
    ['rencana', 'Rencana', 'Pilot 3 bulan, skala 18 bulan', 'A/B berbasis lokasi dengan kriteria go/no-go yang terukur.'],
  ];

  return (
    <>
      <section className="hero">
        <div>
          <h2>Biaya per nasabah aktif turun {fmtPct(p.reduction, 0)}</h2>
          <p className="lead">
            bluRadar membekali tim lapangan blu dengan data dan AI: ke mana turun, siapa didekati, apa yang ditawarkan, dan bagaimana
            nasabah baru tetap aktif. Keberhasilan diukur dari nasabah aktif bernilai (QAC), bukan jumlah rekening yang dibuka.
          </p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => go('radar')}>Buka peta Radar <ArrowRight size={16} /></button>
            <button className="btn ghost" onClick={() => go('finansial')}>Lihat hitungan biaya</button>
          </div>
        </div>
        <div className="hero-compare">
          <span className="cap">Biaya per QAC, pilot 12 minggu, 30 sales, {idNum(p.akun_base)} akun</span>
          <div className="cmp-row"><span>Baseline promo</span><div className="cmp-bar base" style={{ width: '100%' }}>{fmtRp(p.cpq_base)}</div></div>
          <div className="cmp-row"><span>bluRadar</span><div className="cmp-bar radar" style={{ width: `${(p.cpq_radar / maxCpq) * 100}%`, minWidth: 150 }}>{fmtRp(p.cpq_radar)}</div></div>
          <div className="hero-stat">
            <div><strong>{idNum(p.qac_radar)}</strong><small>QAC bluRadar vs {idNum(p.qac_base)} baseline</small></div>
            <div><strong>{fmtRp(p.total_base - p.total_radar)}</strong><small>lebih hemat dengan QAC lebih banyak</small></div>
            <div><strong>{fmtPct(mc.p_go)}</strong><small>skenario Monte Carlo lolos go/no-go 25%</small></div>
          </div>
        </div>
      </section>

      <div className="stats">
        <Stat label="Nilai 36 bulan per akun baru" value={`${fmtRp(mk.ltv_base)} → ${fmtRp(mk.ltv_radar)}`} small note={`Peluang tambahan LTV positif ${fmtPct(mk.diff_pos)} (2.000 skenario)`} src="asumsi" tone="blu" />
        <Stat label="Keluhan di tahap masuk" value={fmtPct(accessShare)} note="dari ulasan negatif blu: daftar, verifikasi wajah, login, ganti HP" src="publik" tone="warn" />
        <Stat label="Alokasi squad dengan bandit" value={signedPct(ts.ts_vs_intuisi)} note={`QAC dibanding alokasi intuisi; menang di ${fmtPct(ts.ts_win_rate)} simulasi`} src="simulasi" tone="good" />
        <Stat label="NPV inkremental 3 tahun" value={fmtRp(proj.npv_inkremental, 2)} small note={`Skenario dasar, payback bulan ke-${proj.payback_bulan}, tambahan DPK ${fmtRp(proj.tambahan_dpk_bulan36, 2)}`} src="asumsi" />
      </div>

      <Panel title="Alur cerita bluRadar" sub="Ikuti dari masalah sampai rencana. Setiap langkah membuka halaman dengan bukti lengkapnya.">
        <div className="story">
          {story.map(([id, step, title, text]) => (
            <button key={id} onClick={() => go(id)}>
              <span className="step">{step}</span>
              <h4>{title}</h4>
              <p>{text}</p>
              <span className="go">Buka <ArrowRight size={14} /></span>
            </button>
          ))}
        </div>
        <Read r={{
          ringkas: 'Bank digital lain dapat nasabah dari aplikasi induknya. blu tidak punya itu, jadi tim lapangan dan komunitas adalah jalan masuk blu. bluRadar membuat jalan masuk itu lebih tepat sasaran dan lebih murah.',
          bisnis: `Masalahnya bukan kurang akun, tetapi akun yang dibuka lalu tidak dipakai. Dengan mengukur QAC, insentif dan keputusan lapangan bergeser ke nasabah yang menghasilkan saldo dan transaksi. Di skenario dasar, biaya per QAC turun dari ${fmtRp(p.cpq_base)} menjadi ${fmtRp(p.cpq_radar)}.`,
          teknis: 'Tiga mesin: skor H3 dari OpenStreetMap plus Thompson Sampling kontekstual untuk alokasi lokasi, aturan persona plus simulasi branching process untuk Bendahara-First, dan uplift modeling plus Markov chain migrasi tier untuk aktivasi. Semua hasil berasal dari notebook dan diverifikasi ulang di dashboard.',
        }} />
      </Panel>

      <section className="grid-wide">
        <Panel title="16 temuan dari notebook" sub="Disusun otomatis dari hasil yang benar-benar keluar di notebook analisis. Label menunjukkan asal datanya." src={[]}>
          <div className="findings">
            {insights.map((x, i) => (
              <div className="finding" key={i}>
                <div className="src-row">{x.tags.map((t) => <Src key={t} k={t} />)}</div>
                <span>{x.text}</span>
              </div>
            ))}
          </div>
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Panel title="Cara membaca dashboard ini">
            <p className="muted" style={{ fontSize: 14 }}>
              Pilih jenis penjelasan di kanan atas. <b>Ringkas</b> untuk gambaran tanpa istilah teknis, <b>Bisnis</b> untuk dampak ke biaya dan nasabah,
              <b> Teknis</b> untuk metode dan cara menghitung. Saat ini: <b>{mode === 'ringkas' ? 'Ringkas' : mode === 'bisnis' ? 'Bisnis' : 'Teknis'}</b>.
            </p>
            <div className="src-row"><Src k="kasus" /><Src k="publik" /><Src k="asumsi" /><Src k="simulasi" /></div>
            <p className="muted" style={{ fontSize: 13.5 }}>Arahkan kursor ke label asal data untuk melihat artinya. Detail setiap asumsi ada di halaman Metodologi & Bukti.</p>
          </Panel>
          <Panel title="Batas data yang perlu diketahui">
            <Callout tone="warn" title="Peta Radar baru mencakup sebagian Jabodetabek">
              Dari 9 ubin OpenStreetMap, 1 berhasil diunduh: Jakarta Selatan, Jakarta Timur bagian selatan, dan Depok. Lokasi di luar area itu belum dinilai.
            </Callout>
            <Callout tone="info" title="Ulasan dari tiga aplikasi">
              blu, Bank Jago, dan SeaBank (8.722 ulasan). Ulasan SeaBank terkumpul dalam 5 hari terakhir, sehingga perbandingan rating dibaca sebagai indikasi.
            </Callout>
            <Callout tone="info" title="Uplift dibuktikan di data eksperimen publik">
              Dataset Hillstrom dipakai karena data internal blu tidak tersedia. Angkanya bukti metode; di pilot model dilatih ulang dengan data A/B blu.
            </Callout>
          </Panel>
        </div>
      </section>
    </>
  );
}
