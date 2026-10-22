'use client';
import { useMemo, useState } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import { D, SOURCES } from '../lib/data';
import { idNum } from '../lib/format.mjs';
import { Panel, Src } from '../ui';

const FIG_TITLE = {
  S3_profil_nasabah_blu: 'Profil nasabah blu',
  S8_roadmap: 'Roadmap bluRadar',
  S10_matriks_risiko: 'Matriks risiko',
  A1_tabel_asumsi_master_1: 'A1. Tabel asumsi master (1/2)',
  A1_tabel_asumsi_master_2: 'A1. Tabel asumsi master (2/2)',
  A2_A15_unit_economics_pilot: 'A2 dan A15. Unit economics pilot',
  A3_persona_dan_bundle: 'A3. Persona dan bundle',
  A4_lanskap_kompetitor_superapp: 'A4. Lanskap kompetitor dan super-app',
  A5_metodologi_ulasan: 'A5. Metodologi ulasan',
  A5b_rating_per_bank: 'A5b. Rating per aplikasi',
  A6_topik_keluhan_blu: 'A6. Topik keluhan blu',
  A7_peta_aspek_sentimen: 'A7. Peta aspek dan sentimen',
  A7b_tren_bulanan: 'A7b. Tren bulanan',
  A7c_driver_rating: 'A7c. Driver rating',
  A8_peta_radar_jabodetabek: 'A8. Peta Radar',
  A8b_tabel_top20_lokasi: 'A8b. Tabel top-20 lokasi',
  A8c_komposisi_poi_dan_stabilitas: 'A8c. Komposisi titik dan stabilitas',
  A9_bandit_alokasi_squad: 'A9. Alokasi squad (bandit)',
  A10_uplift_qini_desil: 'A10. Qini dan uplift per desil',
  A10c_ekonomi_targeting_nudge: 'A10c. Ekonomi targeting nudge',
  A11_markov_tier_ltv: 'A11. Migrasi tier dan LTV',
  A12_bendahara_first_bluGether: 'A12. Bendahara-First bluGether',
  A13_katalog_quest: 'A13. Katalog QUEST',
  A14_arsitektur_bluradar: 'A14. Arsitektur bluRadar',
  A16_proyeksi_3_tahun: 'A16. Proyeksi 3 tahun',
  A17_montecarlo_tornado: 'A17. Monte Carlo dan tornado',
  A18_power_analysis_did: 'A18. Power analysis dan DiD',
  A19_governance_fairness_explainability: 'A19. Fairness dan explainability',
  A19b_register_risiko: 'A19b. Register risiko',
};

const PARAM_LABEL = { sales: 'Jumlah sales pilot', hari: 'Hari kerja pilot', akun_per_hari: 'Akun per sales per hari', biaya_sales_bulan: 'Biaya per sales per bulan', qac_base: 'Tingkat QAC baseline', insentif_base: 'Insentif per akun baseline', qac_radar: 'Tingkat QAC bluRadar', volume_radar: 'Volume akun bluRadar', insentif_radar: 'Insentif per akun bluRadar', bonus_qac: 'Bonus sales per QAC', teknologi: 'Biaya teknologi pilot' };

const KIND_KEY = { 'Asumsi': 'asumsi', 'Data Kasus': 'kasus', 'Data Kasus + penyederhanaan': 'kasus' };

function sortKey(name) {
  const m = name.match(/^([AS])(\d+)/);
  return m ? (m[1] === 'S' ? 0 : 100) + Number(m[2]) : 999;
}

export default function Evidence() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('Semua');
  const [open, setOpen] = useState(null);
  const A = D.assumptions.assumptions;
  const groups = ['Semua', ...new Set(A.map((a) => a.kelompok))];
  const rows = A.filter((a) => (group === 'Semua' || a.kelompok === group) && `${a.parameter} ${a.nilai} ${a.dasar}`.toLowerCase().includes(q.toLowerCase()));
  const files = D.manifest.files;
  const figures = useMemo(() => files.filter((f) => f.file.startsWith('figures/')).map((f) => ({ ...f, id: f.file.replace('figures/', '').replace('.png', '') })).sort((a, b) => sortKey(a.id) - sortKey(b.id) || a.id.localeCompare(b.id)), [files]);
  const tables = files.filter((f) => f.file.startsWith('tables/')).sort((a, b) => a.file.localeCompare(b.file, 'id', { numeric: true }));
  const data = files.filter((f) => f.file.startsWith('web_data/'));

  return (
    <>
      <Panel title="Arti label asal data" sub="Setiap angka di dashboard diberi salah satu label berikut.">
        <div className="grid-2" style={{ gap: 12 }}>
          {Object.entries(SOURCES).map(([k, s]) => <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><Src k={k} /><span className="muted" style={{ fontSize: 14 }}>{s.note}</span></div>)}
        </div>
      </Panel>

      <Panel title="Logo bluRadar" sub="Heksagon mewakili grid H3 peta Radar, lingkaran dan garis sapu mewakili radar, dua titik mewakili komunitas yang terdeteksi. Wordmark memakai Plus Jakarta Sans.">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '22px 26px', display: 'grid', placeItems: 'center' }}><img src="/brand/logo.svg" alt="Logo bluRadar" style={{ height: 52 }} /></div>
          <div style={{ background: 'var(--ink)', borderRadius: 10, padding: '22px 26px', display: 'grid', placeItems: 'center' }}><img src="/brand/logo-white.svg" alt="Logo bluRadar putih" style={{ height: 52 }} /></div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '18px', display: 'grid', placeItems: 'center' }}><img src="/brand/logo-mark.svg" alt="Simbol bluRadar" style={{ height: 60 }} /></div>
        </div>
        <div className="chips">
          {[['logo.svg', 'Logo SVG'], ['logo-white.svg', 'Logo putih SVG'], ['logo-mark.svg', 'Simbol SVG'], ['logo.png', 'Logo PNG'], ['og-image.png', 'Gambar pratinjau tautan']].map(([f, l]) => <a key={f} className="chip" href={`/brand/${f}`} download style={{ textDecoration: 'none' }}>{l}</a>)}
        </div>
      </Panel>

      <Panel title={`Tabel asumsi master (${A.length} asumsi)`} sub="Dikumpulkan otomatis dari notebook. Setiap asumsi diuji dengan Monte Carlo, tornado, atau perturbasi."
        actions={<>
          <input className="search-in" placeholder="Cari asumsi" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari asumsi" />
          <a className="btn light" href="/tables/A1_tabel_asumsi_master.csv" download><Download size={14} /> CSV</a>
        </>}>
        <div className="chips">{groups.map((g) => <button key={g} className={group === g ? 'chip on' : 'chip'} onClick={() => setGroup(g)}>{g}</button>)}</div>
        <div className="table-wrap">
          <table className="t">
            <thead><tr><th>Kelompok</th><th>Parameter</th><th>Nilai</th><th>Jenis</th><th>Dasar</th><th>Dipakai di</th></tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.kelompok + a.parameter}>
                <td>{a.kelompok}</td><td><b>{PARAM_LABEL[a.parameter] || a.parameter}</b></td><td>{a.nilai}</td>
                <td><Src k={KIND_KEY[a.jenis] || 'asumsi'} /></td><td className="muted">{a.dasar}</td><td className="muted">{a.dipakai_di}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="muted">Tidak ada asumsi yang cocok. Ubah kata kunci atau pilih kelompok Semua.</p>}
      </Panel>

      <Panel title={`Galeri visual notebook (${figures.length} gambar)`} sub="Visual yang sama dengan lampiran pitch deck. Klik untuk memperbesar dan mengunduh."
        actions={<a className="btn light" href="/radar_map_interaktif.html" target="_blank" rel="noreferrer"><ExternalLink size={14} /> Peta folium interaktif</a>}>
        <div className="gallery">
          {figures.map((f) => (
            <button key={f.id} className="fig" onClick={() => setOpen(f)}>
              <img src={`/${f.file}`} alt={FIG_TITLE[f.id] || f.id} loading="lazy" />
              <div>{FIG_TITLE[f.id] || f.id}<small>{idNum(f.size_kb)} KB</small></div>
            </button>
          ))}
        </div>
      </Panel>

      <section className="grid-2">
        <Panel title={`Tabel hasil analisis (${tables.length} CSV)`}>
          <div className="table-wrap">
            <table className="t">
              <tbody>{tables.map((t) => <tr key={t.file}><td>{t.file.replace('tables/', '')}</td><td className="num muted">{idNum(t.size_kb, 1)} KB</td><td className="num"><a href={`/${t.file}`} download>Unduh</a></td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title={`Data dashboard (${data.length} JSON)`} sub="Berkas yang dibaca dashboard ini, langsung dari ekspor notebook, ditambah extra.json yang disusun dari tabel CSV oleh scripts/build_extra.py.">
          <div className="table-wrap">
            <table className="t">
              <tbody>
                {data.map((t) => { const n = t.file.replace('web_data/', ''); return <tr key={t.file}><td>{n}</td><td className="num muted">{idNum(t.size_kb, 1)} KB</td><td className="num"><a href={`/data/${n}`} download>Unduh</a></td></tr>; })}
                <tr><td>extra.json</td><td className="num muted">turunan</td><td className="num"><a href="/data/extra.json" download>Unduh</a></td></tr>
                <tr><td>ringkasan_insight.txt</td><td className="num muted">notebook</td><td className="num"><a href="/ringkasan_insight.txt" download>Unduh</a></td></tr>
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>Angka kunci di dashboard diperiksa ulang terhadap berkas ini dengan <code>npm run verify</code>.</p>
        </Panel>
      </section>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={FIG_TITLE[open.id] || open.id} onClick={() => setOpen(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-head">
              <h3>{FIG_TITLE[open.id] || open.id}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <a className="btn light" href={`/${open.file}`} download><Download size={14} /> Unduh PNG</a>
                <button className="btn light" onClick={() => setOpen(null)} aria-label="Tutup"><X size={14} /></button>
              </div>
            </div>
            <img src={`/${open.file}`} alt={FIG_TITLE[open.id] || open.id} />
          </div>
        </div>
      )}
    </>
  );
}
