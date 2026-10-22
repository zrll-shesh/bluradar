'use client';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, ErrorBar, LabelList, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { D, COLORS } from '../lib/data';
import { fmtPct, idNum } from '../lib/format.mjs';
import { Callout, Legend, Panel, Read, Stat, TT } from '../ui';

const THEME_COLOR = { 'Akses dan identitas': COLORS.navy, 'Transaksi': COLORS.blu, 'Performa aplikasi': COLORS.orange };
const BANKS = ['blu', 'Bank Jago', 'SeaBank'];
const MONTHS = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des' };

function heatColor(v) {
  if (v === null || v === undefined) return { background: '#eef2f4', color: '#7d929c' };
  const a = Math.min(1, Math.abs(v) / 80);
  if (v < 0) return { background: `rgba(201,58,58,${0.12 + a * 0.75})`, color: a > 0.55 ? '#fff' : '#5e1a1a' };
  return { background: `rgba(36,133,91,${0.12 + a * 0.75})`, color: a > 0.55 ? '#fff' : '#123d2b' };
}

export default function Voice() {
  const R = D.reviews;
  const meta = D.extra.reviews_meta;
  const summary = BANKS.map((b) => R.summary.find((s) => s.bank === b));
  const themes = Object.entries(R.topics_blu.reduce((acc, t) => ({ ...acc, [t.tema]: (acc[t.tema] || 0) + t.porsi_ulasan_negatif }), {})).sort((a, b) => b[1] - a[1]);
  const access = themes.find((t) => t[0] === 'Akses dan identitas')[1];
  const aspects = [...new Set(R.aspects.map((a) => a.aspek))];
  const net = (bank, asp) => R.aspects.find((a) => a.bank === bank && a.aspek === asp);
  const gaps = aspects.map((asp) => {
    const b = net('blu', asp).net_sentiment;
    const others = ['Bank Jago', 'SeaBank'].map((x) => net(x, asp).net_sentiment).filter((v) => v !== null);
    return { asp, gap: b - others.reduce((s, v) => s + v, 0) / others.length };
  });
  const drivers = [...R.drivers].sort((a, b) => a.koefisien - b.koefisien).map((d) => ({ ...d, err: [d.koefisien - d.ci_low, d.ci_high - d.koefisien], sig: d.p_value < 0.05 }));
  const monthly = R.monthly.filter((m) => m.bank === 'blu').map((m) => ({ ...m, label: `${MONTHS[m.bulan.slice(5)]} ${m.bulan.slice(2, 4)}`, onb: m.keluhan_onboarding * 100 }));
  const mw = D.extra.mannwhitney.filter((m) => m.cakupan === 'Semua bank');
  const val = D.extra.sentiment_validation;
  const bluSum = summary[0];
  const onbDriver = drivers[0];

  return (
    <>
      <div className="stats">
        <Stat label="Ulasan dianalisis" value={idNum(meta.total_clean)} note="blu, Bank Jago, SeaBank (Google Play, urut terbaru)" src="publik" />
        <Stat label="Rating rata-rata blu" value={idNum(bluSum.rating_rata2, 2)} note={`${fmtPct(bluSum.porsi_negatif)} ulasan bintang 1-2 dari ${idNum(bluSum.n_ulasan)} ulasan`} src="publik" />
        <Stat label="Keluhan blu di tahap masuk" value={fmtPct(access)} note="daftar, verifikasi wajah, login, ganti HP" src="publik" tone="warn" />
        <Stat label="Penurun rating terbesar" value={`${idNum(onbDriver.koefisien, 2)} bintang`} note="saat ulasan menyebut onboarding dan verifikasi" src="publik" tone="warn" />
      </div>

      <section className="grid-wide">
        <Panel title="40% keluhan blu terjadi sebelum nasabah sempat bertransaksi" sub={`Topik dari ${idNum(meta.topic_docs)} ulasan negatif blu (BERTopic). ${fmtPct(meta.topic_outlier)} ulasan tidak masuk topik mana pun.`} src={['publik']}
          read={{
            ringkas: 'Banyak calon nasabah gagal sejak awal: pendaftaran ribet, kode tidak masuk, wajah tidak terverifikasi, atau susah login. Mereka belum sempat merasakan manfaat blu.',
            bisnis: 'Inilah alasan kanal offline bernilai: bluFriends di booth bisa mendampingi pendaftaran dan verifikasi wajah langsung di tempat, sehingga akun yang dibuka tidak gugur di langkah pertama dan biaya akuisisinya tidak hangus.',
            teknis: 'BERTopic dengan embedding paraphrase-multilingual-MiniLM-L12-v2, UMAP, HDBSCAN, dan c-TF-IDF pada ulasan bintang 1-2. Enam topik diberi nama dari kata kunci dan contoh ulasan, lalu dikelompokkan ke tiga tema.',
          }}>
          <div style={{ display: 'flex', height: 46, borderRadius: 8, overflow: 'hidden' }}>
            {themes.map(([t, v]) => <div key={t} title={`${t}: ${fmtPct(v)}`} style={{ width: `${v * 100}%`, background: THEME_COLOR[t], color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 15 }}>{fmtPct(v)}</div>)}
            <div style={{ flex: 1, background: '#dbe5e9', color: '#4f6573', fontWeight: 700, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 13 }}>{fmtPct(meta.topic_outlier)}</div>
          </div>
          <Legend items={[...themes.map(([t]) => [THEME_COLOR[t], t]), ['#dbe5e9', 'Tidak masuk topik']]} />
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Topik keluhan</th><th>Tema</th><th>Kata kunci</th><th className="num">Ulasan</th><th className="num">Porsi</th></tr></thead>
              <tbody>{R.topics_blu.map((t) => (
                <tr key={t.topik}>
                  <td><b>{t.label}</b></td>
                  <td><span style={{ color: THEME_COLOR[t.tema], fontWeight: 700 }}>{t.tema}</span></td>
                  <td className="muted">{t.kata_kunci}</td>
                  <td className="num">{t.jumlah}</td>
                  <td className="num"><b>{fmtPct(t.porsi_ulasan_negatif)}</b></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Rating per aplikasi" src={['publik']} sub="Ulasan terbaru per aplikasi. Jendela waktunya berbeda, jadi perbandingan dibaca sebagai indikasi.">
          <div className="chart" style={{ height: 190 }}>
            <ResponsiveContainer>
              <BarChart data={summary} layout="vertical" margin={{ left: 0, right: 46 }}>
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis type="category" dataKey="bank" width={84} axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                <Tooltip content={<TT fmt={(v) => idNum(v, 2)} />} cursor={{ fill: '#eef4f5' }} />
                <Bar dataKey="rating_rata2" name="Rating rata-rata" barSize={26} radius={[0, 4, 4, 0]}>
                  {summary.map((s) => <Cell key={s.bank} fill={s.bank === 'blu' ? COLORS.blu : '#c3ced5'} />)}
                  <LabelList dataKey="rating_rata2" position="right" formatter={(v) => idNum(v, 2)} style={{ fontWeight: 700, fontSize: 13, fill: '#0c2230' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Aplikasi</th><th className="num">Ulasan</th><th className="num">Bintang 1-2</th><th>Jendela</th></tr></thead>
              <tbody>{summary.map((s) => <tr key={s.bank}><td><b>{s.bank}</b></td><td className="num">{idNum(s.n_ulasan)}</td><td className="num">{fmtPct(s.porsi_negatif)}</td><td className="muted">{s.mulai.slice(0, 10)} s.d. {s.sampai.slice(0, 10)}</td></tr>)}</tbody>
            </table>
          </div>
          <Callout tone="warn" title="Cakupan">{meta.not_found.join(', ')} tidak ditemukan otomatis; {meta.excluded} dikeluarkan dari perbandingan.</Callout>
        </Panel>
      </section>

      <section className="grid-wide">
        <Panel title="Peta sentimen per aspek" sub="Net sentiment = porsi bintang 4-5 dikurangi porsi bintang 1-2 di antara ulasan yang menyebut aspek itu (-100 sampai +100). Kolom terakhir: blu dikurangi rata-rata dua pesaing." src={['publik']}
          read={{
            ringkas: 'Merah berarti banyak yang kecewa, hijau berarti banyak yang puas. blu paling tertinggal di urusan pendaftaran dan aplikasi yang error, tetapi unggul di layanan CS dan rasa aman.',
            bisnis: 'Selisih terburuk blu ada di onboarding dan verifikasi (-27,3 poin) serta error dan performa (-24,5 poin). Keunggulan di keamanan (+19,9) dan CS (+39,9) adalah modal kepercayaan yang bisa dipakai dalam pitch lapangan.',
            teknis: 'Aspek ditandai dengan leksikon regex bahasa Indonesia yang transparan (25,8% ulasan menyebut minimal satu aspek). Net sentiment hanya dihitung bila minimal 15 ulasan menyebut aspek tersebut.',
          }}>
          <div className="table-wrap">
            <table className="heat">
              <thead><tr><th>Aspek</th>{BANKS.map((b) => <th key={b} style={{ textAlign: 'center' }}>{b}</th>)}<th style={{ textAlign: 'center' }}>Selisih blu</th></tr></thead>
              <tbody>{aspects.map((asp) => {
                const g = gaps.find((x) => x.asp === asp).gap;
                return (
                  <tr key={asp}>
                    <td style={{ fontWeight: 600 }}>{asp}</td>
                    {BANKS.map((b) => { const v = net(b, asp).net_sentiment; return <td key={b} className="cell" style={heatColor(v)}>{v === null ? 'n<15' : idNum(v, 0)}</td>; })}
                    <td className="cell" style={{ background: g < 0 ? '#fbe5e5' : '#dcf1e7', color: g < 0 ? '#9b2c2c' : '#1d6b49' }}>{g > 0 ? '+' : ''}{idNum(g, 1)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Apa yang paling menurunkan rating" sub={`Regresi OLS rating terhadap aspek dengan efek tetap bank, SE robust HC3. R² ${idNum(meta.ols_r2, 3)}.`} src={['publik']}>
          <div className="chart" style={{ height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={drivers} layout="vertical" margin={{ left: 0, right: 40 }}>
                <CartesianGrid horizontal={false} stroke="#e3ecef" />
                <XAxis type="number" domain={[-2.2, 0.6]} tick={{ fontSize: 12 }} tickFormatter={(v) => idNum(v, 1)} />
                <YAxis type="category" dataKey="aspek" width={150} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <ReferenceLine x={0} stroke="#2b4352" />
                <Tooltip content={<TT fmt={(v, p) => `${idNum(v, 2)} bintang (95% CI ${idNum(p.payload.ci_low, 2)} s.d. ${idNum(p.payload.ci_high, 2)})`} />} cursor={{ fill: '#eef4f5' }} />
                <Bar dataKey="koefisien" name="Perubahan rating" barSize={18}>
                  {drivers.map((d) => <Cell key={d.aspek} fill={!d.sig ? '#c3ced5' : d.koefisien < 0 ? COLORS.red : COLORS.green} />)}
                  <ErrorBar dataKey="err" width={4} stroke="#2b4352" direction="x" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[[COLORS.red, 'Menurunkan rating (p < 0,05)'], [COLORS.green, 'Menaikkan rating (p < 0,05)'], ['#c3ced5', 'Tidak signifikan']]} />
        </Panel>
      </section>

      <section className="grid-3">
        <Panel title="Keluhan onboarding blu per bulan" sub="Porsi ulasan blu yang membahas pendaftaran dan verifikasi, beserta rating bulanan." src={['publik']} className="span-2">
          <div className="chart" style={{ height: 260 }}>
            <ResponsiveContainer>
              <ComposedChart data={monthly} margin={{ left: 0, right: 10, top: 16 }}>
                <CartesianGrid vertical={false} stroke="#e3ecef" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <YAxis yAxisId="r" orientation="right" domain={[3.5, 4.5]} tick={{ fontSize: 12 }} tickFormatter={(v) => idNum(v, 1)} />
                <Tooltip content={<TT fmt={(v, p) => (p.dataKey === 'onb' ? `${idNum(v, 1)}%` : idNum(v, 2))} />} />
                <Bar yAxisId="l" dataKey="onb" name="Ulasan bahas onboarding" fill={COLORS.navy} barSize={26} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="onb" position="top" formatter={(v) => `${idNum(v, 1)}%`} style={{ fontSize: 11.5, fontWeight: 700, fill: '#14325c' }} />
                </Bar>
                <Line yAxisId="r" dataKey="rating" name="Rating rata-rata" stroke={COLORS.blu} strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[[COLORS.navy, 'Porsi ulasan yang membahas onboarding (sumbu kiri)'], [COLORS.blu, 'Rating rata-rata (sumbu kanan)']]} />
          <Read r={{
            ringkas: `Keluhan soal pendaftaran tidak berkurang: dari ${idNum(monthly[2].onb, 1)}% ulasan di ${monthly[2].label} menjadi ${idNum(monthly[monthly.length - 1].onb, 1)}% di ${monthly[monthly.length - 1].label}.`,
            bisnis: 'Selama pintu masuk digital masih sering gagal, pendampingan onboarding oleh bluFriends punya nilai nyata: akun yang dibuka di booth langsung selesai diverifikasi.',
            teknis: 'Hanya bulan dengan minimal 20 ulasan yang ditampilkan. Porsi dihitung dari flag aspek Onboarding & verifikasi per bulan; rating adalah rata-rata bintang bulan itu.',
          }} />
        </Panel>
        <Panel title="Uji statistik" src={['publik']} sub="Mann-Whitney U, seluruh ulasan.">
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Aspek disebut</th><th className="num">Selisih rating</th><th className="num">p</th></tr></thead>
              <tbody>{mw.map((m) => <tr key={m.aspek}><td>{m.aspek}</td><td className="num"><b>{m.selisih > 0 ? '+' : ''}{idNum(m.selisih, 2)}</b></td><td className="num">{m.p_value < 0.001 ? '< 0,001' : idNum(m.p_value, 3)}</td></tr>)}</tbody>
            </table>
          </div>
          <Callout tone="info" title="Promo bukan sumber keluhan">Ulasan yang menyebut promo justru sedikit lebih tinggi (+0,26 bintang) dan tidak signifikan. Masalahnya ada di pintu masuk, bukan di hadiah.</Callout>
        </Panel>
      </section>

      <Panel title="Validasi: apakah teks ulasan searah dengan bintangnya?" src={['publik']} sub={`${idNum(val.n)} ulasan sampel diklasifikasi ulang dengan model ${val.model}.`}
        read={{
          ringkas: 'Kami mengecek ulang dengan model AI bahasa Indonesia. Tiga dari empat ulasan punya isi yang searah dengan bintangnya, jadi memakai bintang sebagai ukuran puas atau kecewa cukup bisa dipercaya.',
          bisnis: 'Validasi ini membuat insight ulasan bisa dipertanggungjawabkan di depan manajemen: kesimpulan tidak bergantung pada satu metode saja.',
          teknis: `Akurasi kesesuaian ${fmtPct(val.accuracy)}, Cohen's kappa ${idNum(val.kappa, 3)} (kesepakatan sedang). Ketidaksesuaian terbesar: ulasan bintang 4-5 yang teksnya netral, sehingga label bintang dipakai sebagai label utama karena cakupannya penuh.`,
        }}>
        <div className="grid-2">
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Label bintang</th><th className="num">Model: negatif</th><th className="num">Model: netral</th><th className="num">Model: positif</th></tr></thead>
              <tbody>{val.confusion.map((r) => <tr key={r.index}><td><b>{r.index.replace('bintang_', '')}</b></td><td className="num">{r.model_negatif}</td><td className="num">{r.model_netral}</td><td className="num">{r.model_positif}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="kv">
            <span>Akurasi kesesuaian</span><b>{fmtPct(val.accuracy)}</b>
            <span>Cohen&apos;s kappa</span><b>{idNum(val.kappa, 3)}</b>
            <span>Ulasan negatif yang juga dinilai negatif oleh model</span><b>{fmtPct(220 / 237)}</b>
          </div>
        </div>
      </Panel>
    </>
  );
}
