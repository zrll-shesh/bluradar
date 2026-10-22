'use client';
import { useState } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { D, COLORS } from '../lib/data';
import { fmtPct, idNum } from '../lib/format.mjs';
import { Callout, Panel, Seg, Stat, TT } from '../ui';

function pickPersona(ans) {
  const P = D.personas.personas;
  if (ans.sering_bepergian === 'ya') return P.find((p) => p.id === 'traveler');
  if (ans.kas_komunitas === 'ya') return P.find((p) => p.id === 'mahasiswa_organisatoris');
  if (ans.status === 'bekerja') return P.find((p) => p.id === 'pekerja_tower');
  return P.find((p) => p.id === 'perantau');
}

function heat(v, max) {
  const a = v / max;
  return { background: `rgba(31,184,195,${0.12 + a * 0.85})`, color: a > 0.55 ? '#04262a' : '#0c2230', fontWeight: 700, textAlign: 'center' };
}

export default function Anchor() {
  const K = D.kfactor;
  const A = D.kpi.anchor;
  const [ans, setAns] = useState({ status: 'kuliah', kas_komunitas: 'ya', sering_bepergian: 'tidak' });
  const [gi, setGi] = useState(2);
  const [qi, setQi] = useState(2);
  const persona = pickPersona(ans);
  const grid = K.grid;
  const maxV = Math.max(...grid.mean_accounts.flat());
  const prod = [
    { name: 'Pitch individu', v: A.indiv_per_hour, note: '10 menit per orang, konversi 25%' },
    { name: 'Pitch bendahara', v: A.anchor_per_hour, note: '45 menit, konversi 35%, membawa grup' },
  ];

  return (
    <>
      <div className="stats">
        <Stat label="Akun baru per bendahara" value={idNum(A.accounts_per_anchor, 1)} note={`${idNum(A.direct, 1)} langsung dari grupnya, ${fmtPct(A.chain_share)} dari efek berantai`} src="simulasi" tone="blu" />
        <Stat label="Produktivitas sales" value={`${idNum(A.productivity_ratio, 1)}x`} note={`${idNum(A.anchor_per_hour, 2)} vs ${idNum(A.indiv_per_hour, 2)} akun per jam`} src="simulasi" tone="good" />
        <Stat label="Bendahara baru per bendahara" value={idNum(A.R, 3)} note="nilai utama dari grup langsung, bukan viral berantai" src="simulasi" />
        <Stat label="Batas member bluGether" value="99" note="satu Creator dapat mengundang hingga 99 member" src="kasus" />
      </div>

      <section className="grid-2">
        <Panel title="Kuis booth: 3 pertanyaan, 1 rencana keuangan" sub="Persona ditentukan dengan tabel aturan yang transparan, bukan model. Coba jawab sebagai calon nasabah." src={['kasus']}
          read={{
            ringkas: 'Di booth, calon nasabah menjawab 3 pertanyaan singkat. Mereka langsung mendapat saran produk yang cocok, bukan brosur promo yang sama untuk semua orang.',
            bisnis: 'Pitch berbasis kebutuhan menarik nasabah yang akan memakai produknya, sehingga peluang menjadi QAC lebih tinggi dibanding pitch berbasis hadiah. Bendahara komunitas diprioritaskan karena membawa grup.',
            teknis: `Aturan berurutan: ${D.personas.rules.replace('Urutan aturan: ', '')}. Persona berasal dari segmen data kasus (karyawan swasta 42%, pelajar/mahasiswa 22%) dan produk blu yang tersedia.`,
          }}>
          <div className="quiz">
            {D.personas.quiz.map((q) => (
              <div className="quiz-q" key={q.id}>
                <span>{q.pertanyaan}</span>
                <Seg small options={q.opsi.map((o) => [o, o.charAt(0).toUpperCase() + o.slice(1)])} value={ans[q.id]} onChange={(v) => setAns({ ...ans, [q.id]: v })} label={q.pertanyaan} />
              </div>
            ))}
          </div>
        </Panel>
        <div className="persona" aria-live="polite">
          <span style={{ color: '#8ea8b2', fontSize: 13 }}>Persona yang cocok</span>
          <h4>{persona.nama}</h4>
          <div className="bundle">{persona.bundle.map((b) => <span key={b}>{b}</span>)}</div>
          <div className="pitch">{persona.pesan_pitch}</div>
          <dl>
            <dt>Segmen</dt><dd>{persona.segmen_kasus}</dd>
            <dt>Kebutuhan</dt><dd>{persona.kebutuhan}</dd>
            <dt>Pain point</dt><dd>{persona.pain_point}</dd>
            <dt>Ditemui di</dt><dd>{persona.lokasi_temu}</dd>
          </dl>
        </div>
      </section>

      <section className="grid-wide">
        <Panel title="Berapa akun yang dibawa satu bendahara" sub="Pilih ukuran grup dan peluang anggota membuka akun. Setiap sel adalah rata-rata 4.000 simulasi branching process tiga generasi." src={['simulasi', 'asumsi']}
          read={{
            ringkas: 'Kalau sales berhasil meyakinkan satu bendahara kas organisasi, anggota grupnya ikut membuka akun untuk memantau kas bersama. Satu percakapan bisa menghasilkan beberapa nasabah.',
            bisnis: `Dengan asumsi dasar (median grup 15, peluang membuka akun 45%), satu bendahara membawa rata-rata ${idNum(A.accounts_per_anchor, 1)} akun. Walau pitch bendahara 4,5 kali lebih lama, produktivitasnya ${idNum(A.productivity_ratio, 1)} kali pitch individu.`,
            teknis: 'Ukuran grup lognormal (median 15, σ 0,6, dibatasi 3 sampai 99), porsi anggota tanpa akun blu Beta(7,3), peluang membuka akun Beta(4,5; 5,5), peluang anggota menjadi Creator baru 6% × 30%. R = 0,102 sehingga efek berantai kecil; nilai utama dari grup langsung.',
          }}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>Median ukuran grup</div>
              <div className="chips">{grid.median_group.map((g, i) => <button key={g} className={gi === i ? 'chip on' : 'chip'} onClick={() => setGi(i)}>{g}</button>)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>Peluang anggota membuka akun</div>
              <div className="chips">{grid.q_mean.map((q, i) => <button key={q} className={qi === i ? 'chip on' : 'chip'} onClick={() => setQi(i)}>{fmtPct(q, 0)}</button>)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div className="big-num" style={{ color: COLORS.bluInk }}>{idNum(grid.mean_accounts[gi][qi], 1)}</div>
            <span className="muted">akun baru per bendahara</span>
          </div>
          <small className="muted">Kartu di atas ({idNum(A.accounts_per_anchor, 1)}) memakai 20.000 simulasi; tiap sel tabel 4.000 simulasi, sehingga selisih kecil adalah variasi acak simulasi.</small>
          <div className="table-wrap">
            <table className="heat">
              <thead><tr><th>Median grup</th>{grid.q_mean.map((q) => <th key={q} style={{ textAlign: 'center' }}>{fmtPct(q, 0)}</th>)}</tr></thead>
              <tbody>{grid.median_group.map((g, i) => (
                <tr key={g}><td style={{ fontWeight: 700 }}>{g}</td>{grid.mean_accounts[i].map((v, j) => (
                  <td key={j} style={{ ...heat(v, maxV), outline: i === gi && j === qi ? '2px solid #0c2230' : 'none', cursor: 'pointer' }} onClick={() => { setGi(i); setQi(j); }}>{idNum(v, 1)}</td>
                ))}</tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Produktivitas per jam sales" src={['simulasi', 'asumsi']}>
          <div className="chart" style={{ height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={prod} layout="vertical" margin={{ left: 0, right: 56 }}>
                <XAxis type="number" hide domain={[0, 4]} />
                <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT fmt={(v) => `${idNum(v, 2)} akun per jam`} />} cursor={{ fill: '#eef4f5' }} />
                <Bar dataKey="v" name="Akun per jam" barSize={34} radius={[0, 6, 6, 0]}>
                  {prod.map((p, i) => <Cell key={p.name} fill={i ? COLORS.blu : '#c3ced5'} />)}
                  <LabelList dataKey="v" position="right" formatter={(v) => idNum(v, 2)} style={{ fontWeight: 800, fontSize: 15, fill: '#0c2230' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {prod.map((p) => <p key={p.name} className="muted" style={{ fontSize: 13.5 }}><b style={{ color: '#0c2230' }}>{p.name}:</b> {p.note}</p>)}
          <Callout tone="info" title="Contoh kas bluGether di materi blu">Kas kelas, kas RT, arisan, patungan kosan, study tour, reuni, dan kas tim basket. Semuanya punya bendahara yang bisa didekati lebih dulu.</Callout>
        </Panel>
      </section>
    </>
  );
}
