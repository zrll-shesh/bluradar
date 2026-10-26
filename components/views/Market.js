'use client';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { D, COLORS } from '../lib/data';
import { fmtPct, fmtRp, idNum } from '../lib/format.mjs';
import { Callout, Legend, Panel, Stat, TT } from '../ui';

function Bars({ data, highlight, height = 220, unit = '%' }) {
  const rows = data.map(([name, v], i) => ({ name, v, hl: highlight(i, name) }));
  return (
    <div className="chart" style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12.5 }} axisLine={false} tickLine={false} />
          <Tooltip content={<TT fmt={(v) => `${v}${unit}`} />} cursor={{ fill: '#eef4f5' }} />
          <Bar dataKey="v" name="Porsi nasabah" radius={[0, 4, 4, 0]} barSize={22}>
            {rows.map((r) => <Cell key={r.name} fill={r.hl ? COLORS.blu : '#c3ced5'} />)}
            <LabelList dataKey="v" position="right" formatter={(v) => `${v}${unit}`} style={{ fontSize: 12.5, fontWeight: 700, fill: '#0c2230' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Market() {
  const c = D.extra.case;
  const comp = [...D.extra.competitors].sort((a, b) => b.aset_triliun - a.aset_triliun);
  const blu = comp.find((x) => x.bank.startsWith('blu'));
  const sea = comp[0];
  const typeColor = { 'Aplikasi konsumen induk': '#c3ced5', 'Bank induk': COLORS.blu, 'Konglomerasi': COLORS.navy };

  return (
    <>
      <div className="stats">
        <Stat label="Nasabah blu" value={`${idNum(c.nasabah / 1e6, 2)} jt`} note={`per ${c.periode}`} src="kasus" />
        <Stat label="Saldo rata-rata" value={fmtRp(c.saldo_rata2)} note={`DPK ${fmtRp(c.dpk)}, setara ${fmtRp(c.dpk / c.nasabah, 2)} per nasabah`} src="kasus" />
        <Stat label="Usia di bawah 35 tahun" value="76%" note="31% di bawah 25 tahun, 45% usia 25-34" src="kasus" tone="blu" />
        <Stat label="Aset blu terhadap SeaBank" value={fmtPct(blu.aset_triliun / sea.aset_triliun)} note={`Rp${idNum(blu.aset_triliun, 2)} T vs Rp${idNum(sea.aset_triliun, 2)} T`} src="kasus" />
      </div>

      <section className="grid-3">
        <Panel title="Usia nasabah" src={['kasus']}>
          <Bars data={c.age} highlight={(i) => i < 2} />
        </Panel>
        <Panel title="Pekerjaan nasabah" src={['kasus']}>
          <Bars data={c.occupation} highlight={(i) => i < 2} />
        </Panel>
        <Panel title="Domisili nasabah" src={['kasus']}>
          <Bars data={c.province} highlight={(i) => i < 3} />
        </Panel>
      </section>
      <Panel read={{
        ringkas: 'Nasabah blu kebanyakan anak muda yang bekerja kantoran atau kuliah, dan sebagian besar tinggal di Jabodetabek, Jawa Barat, dan Jawa Timur. Artinya mereka berkumpul di tempat yang bisa didatangi: kantor dan kampus.',
        bisnis: '64% nasabah adalah karyawan swasta atau pelajar/mahasiswa, dan 70% berada di tiga wilayah. Konsentrasi ini membuat penjualan tatap muka efisien bila lokasinya dipilih dengan data, bukan intuisi.',
        teknis: 'Proporsi pekerjaan dipakai langsung sebagai dasar bobot skor Radar: kantor 0,40 (mewakili 42% karyawan), kampus 0,20 dan sekolah 0,10 (mewakili 22% pelajar/mahasiswa), stasiun dan mal 0,15 masing-masing untuk lalu lintas orang.',
      }} title="Apa artinya untuk tim lapangan" />

      <section className="grid-wide">
        <Panel title="Pesaing tumbuh dari super-app induknya" sub="Total aset bank digital (Rp triliun) dan induk yang menopangnya." src={['kasus']}>
          <div className="chart" style={{ height: 330 }}>
            <ResponsiveContainer>
              <BarChart data={comp} layout="vertical" margin={{ left: 4, right: 150, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#e3ecef" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="bank" width={140} tick={{ fontSize: 12.5 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT fmt={(v) => `Rp${idNum(v, 2)} T`} />} cursor={{ fill: '#eef4f5' }} />
                <Bar dataKey="aset_triliun" name="Total aset" radius={[0, 4, 4, 0]} barSize={22}>
                  {comp.map((r) => <Cell key={r.bank} fill={typeColor[r.tipe_induk]} />)}
                  <LabelList dataKey="induk" position="right" style={{ fontSize: 12, fill: '#2b4352' }} formatter={(v) => v} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={Object.entries(typeColor).map(([k, v]) => [v, k])} />
        </Panel>
        <Panel title="Kesimpulan strategis" read={{
          ringkas: 'SeaBank punya Shopee, Jago punya Gojek, Superbank punya Grab. blu tidak punya aplikasi seperti itu, jadi blu perlu jalan masuk sendiri: komunitas yang didatangi langsung.',
          bisnis: 'Di online, blu harus membeli perhatian lewat iklan dan promo, arena di mana pesaing lebih kuat. Di offline, kekuatan BCA dan jaringan komunitas sulit ditiru. bluRadar menjadikan offline sebagai kanal yang terukur.',
          teknis: 'Dari 8 bank digital dengan data aset (termasuk blu), 6 ditopang aplikasi konsumen induk (Sea Group, GoTo, Grab/Emtek, Akulaku, Kredivo, CT Corp); blu dan Saqu tidak. Artinya 6 dari 7 pesaing blu punya mesin akuisisi dari aplikasi induk. Sumber: Digital Banks Landscape di materi blu, laporan keuangan publikasi Agustus 2026.',
        }}>
          <div className="big-num">6 dari 7</div>
          <p className="muted">pesaing blu ditopang aplikasi konsumen induk sebagai mesin akuisisi.</p>
          <Callout tone="info" title="Komunitas sebagai super-app blu">Kantor, kampus, organisasi, dan kas bersama adalah tempat calon nasabah sudah berkumpul. bluRadar membuat blu datang ke tempat yang tepat dengan tawaran yang tepat.</Callout>
        </Panel>
      </section>

      <section className="grid-2">
        <Panel title="Metrik turunan dari data kasus" sub="Menghubungkan data kasus dengan ekonomi per nasabah yang dipakai di halaman Finansial." src={['kasus']}>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Metrik</th><th className="num">Nilai</th><th>Catatan</th></tr></thead>
              <tbody>{D.extra.derived_metrics.map((r) => <tr key={r.metrik}><td>{r.metrik}</td><td className="num"><b>{r.nilai}</b></td><td className="muted">{r.catatan}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Tier bluLoyalty" sub="Dipakai sebagai state di model migrasi nasabah (halaman Quest & Nudge). Naik ke bluPro adalah salah satu syarat QAC." src={['kasus']}>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Tier</th><th>Saldo rata-rata portofolio</th><th className="num">Gratis transfer bank lain</th><th className="num">Gratis tarik/setor ATM BCA</th></tr></thead>
              <tbody>{D.extra.tiers.map((r) => <tr key={r.tier} className={r.tier === 'bluPro' ? 'hl' : ''}><td><b>{r.tier}</b></td><td>{r.saldo_rata2_portofolio}</td><td className="num">{r.gratis_transfer_bank_lain_per_bulan}x</td><td className="num">{r.gratis_tarik_setor_atm_bca}x</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </section>
    </>
  );
}
