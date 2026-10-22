'use client';
import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer, Marker, TileLayer, Tooltip as LTooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RotateCcw } from 'lucide-react';
import geo from '@/public/data/hex_scores.geojson';
import { D, COLORS } from '../lib/data';
import { CATS, CAT_LABEL, dominant, prepareRadar, scoreRadar, selectTop } from '../lib/radar.mjs';
import { fmtPct, idNum } from '../lib/format.mjs';
import { Callout, Panel, Slider, Stat, TT } from '../ui';

const STOPS = [[0, [232, 244, 245]], [40, [159, 222, 227]], [70, [31, 184, 195]], [100, [10, 84, 96]]];
function scoreColor(s) {
  for (let i = 1; i < STOPS.length; i += 1) {
    if (s <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1];
      const [b, cb] = STOPS[i];
      const t = (s - a) / (b - a);
      const c = ca.map((v, j) => Math.round(v + (cb[j] - v) * t));
      return `rgb(${c.join(',')})`;
    }
  }
  return 'rgb(10,84,96)';
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => { map.fitBounds(bounds, { padding: [8, 8] }); }, [map, bounds]);
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 14, { duration: 0.6 }); }, [map, target]);
  return null;
}

const BASE_W = D.top20.weights;

export default function Radar() {
  const prep = useMemo(() => prepareRadar(geo), []);
  const [w, setW] = useState(BASE_W);
  const [sel, setSel] = useState(null);
  const baseTop = D.top20.top20;
  const changed = CATS.some((c) => Math.abs(w[c] - BASE_W[c]) > 1e-9);
  const wSum = CATS.reduce((s, c) => s + w[c], 0);
  const wNorm = Object.fromEntries(CATS.map((c) => [c, wSum > 0 ? w[c] / wSum : 0]));

  const scores = useMemo(() => (wSum > 0 ? scoreRadar(prep, wNorm) : prep.props.map(() => 0)), [prep, wSum, w]);
  const topIdx = useMemo(() => (wSum > 0 ? selectTop(prep, scores) : []), [prep, scores, wSum]);
  const top = topIdx.map((i, r) => {
    const p = prep.props[i];
    const base = baseTop.find((b) => b.hex === p.hex);
    const ll = geo.features[i].geometry.coordinates[0];
    const lat = ll.slice(0, -1).reduce((s, x) => s + x[1], 0) / (ll.length - 1);
    const lon = ll.slice(0, -1).reduce((s, x) => s + x[0], 0) / (ll.length - 1);
    return { rank: r + 1, hex: p.hex, score: scores[i], cat: dominant(prep, i, wNorm), lokasi: base ? base.lokasi : 'Heksagon di luar top-20 awal', stab: base ? base.stabilitas_top20 : null, lat, lon, baseRank: base ? base.rank : null };
  });
  const overlap = top.filter((t) => t.baseRank).length;
  const parity = !changed ? Math.max(...prep.props.map((p, i) => Math.abs(p.score - scores[i]))) : null;

  const bounds = useMemo(() => {
    const pts = geo.features.flatMap((f) => f.geometry.coordinates[0].map(([x, y]) => [y, x]));
    return L.latLngBounds(pts);
  }, []);
  const scoreByHex = useMemo(() => Object.fromEntries(prep.props.map((p, i) => [p.hex, scores[i]])), [prep, scores]);
  const topSet = useMemo(() => new Set(top.map((t) => t.hex)), [top]);
  const style = (f) => {
    const s = scoreByHex[f.properties.hex];
    const isTop = topSet.has(f.properties.hex);
    return { fillColor: scoreColor(s), fillOpacity: 0.82, weight: isTop ? 2 : 0.4, color: isTop ? '#0c2230' : '#ffffff' };
  };
  const icon = (t) => L.divIcon({ className: `rank-pin${sel === t.hex ? ' sel' : ''}`, html: String(t.rank), iconSize: [24, 24] });

  const catCounts = CATS.map((c) => ({ cat: CAT_LABEL[c], n: prep.props.reduce((s, p) => s + p[c], 0) }));
  const stab = baseTop.map((b) => ({ name: String(b.rank), v: b.stabilitas_top20 * 100 }));
  const R = D.kpi.radar;
  const ov = D.extra.overpass;
  const selected = top.find((t) => t.hex === sel);

  return (
    <>
      <div className="stats">
        <Stat label="Titik OpenStreetMap" value={idNum(R.n_poi)} note="kantor, kampus, sekolah, stasiun, mal" src="publik" />
        <Stat label="Heksagon H3 dinilai" value={idNum(R.n_hex)} note="resolusi 8, sekitar 0,74 km² per heksagon" src="publik" />
        <Stat label="Lokasi top-20 yang tangguh" value={`${R.stable_80} dari 20`} note="tetap top-20 di ≥ 80% dari 500 skenario bobot" src="simulasi" tone="good" />
        <Stat label="Rata-rata stabilitas top-20" value={fmtPct(R.stability_mean)} note="perturbasi bobot Dirichlet" src="simulasi" />
      </div>

      <Callout tone="warn" title={`Cakupan peta: ${ov.tiles_ok} dari ${ov.tiles_total} ubin OpenStreetMap`}>
        Area yang sudah dinilai: {ov.area}. Delapan ubin lain gagal diunduh dari server Overpass saat notebook dijalankan, sehingga lokasi di Jakarta Pusat, Utara, Barat, Tangerang, Bekasi, dan Bogor belum masuk peringkat.
      </Callout>

      <section className="grid-wide">
        <Panel title={changed ? 'Peta Radar dengan bobot buatanmu' : 'Peta Radar: 20 lokasi prioritas'} sub="Warna lebih gelap berarti peluang lebih tinggi. Angka pada pin adalah peringkat. Klik daftar untuk terbang ke lokasi." src={['publik', 'asumsi']}>
          <div className="map-shell">
            <MapContainer bounds={bounds} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <FitBounds bounds={bounds} />
              <FlyTo target={selected ? [selected.lat, selected.lon] : null} />
              <GeoJSON key={JSON.stringify(wNorm) + sel} data={geo} style={style}
                onEachFeature={(f, layer) => layer.bindTooltip(`Skor ${idNum(scoreByHex[f.properties.hex], 1)}<br/>Kantor ${f.properties.kantor}, kampus ${f.properties.kampus}, sekolah ${f.properties.sekolah}<br/>Stasiun ${f.properties.stasiun}, mal ${f.properties.mal}`, { sticky: true })} />
              {top.map((t) => (
                <Marker key={t.hex + t.rank + (sel === t.hex)} position={[t.lat, t.lon]} icon={icon(t)} eventHandlers={{ click: () => setSel(t.hex) }}>
                  <LTooltip direction="top" offset={[0, -10]}>#{t.rank}, skor {idNum(t.score, 1)}</LTooltip>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Panel>
        <Panel title={changed ? 'Top-20 dengan bobot baru' : 'Top-20 lokasi prioritas'} sub={changed ? `${overlap} dari 20 lokasi sama dengan peringkat awal.` : 'Nama diambil dari titik bernama di dalam heksagon (OSM).'}>
          <div className="loc-list">
            {top.map((t) => (
              <button key={t.hex} className={sel === t.hex ? 'loc sel' : 'loc'} onClick={() => setSel(t.hex)}>
                <span className="rk">{t.rank}</span>
                <span className="nm">{t.lokasi}<br /><small className="muted">{CAT_LABEL[t.cat]}{t.stab !== null ? `, stabil ${fmtPct(t.stab, 0)}` : ''}{changed && t.baseRank ? `, awal #${t.baseRank}` : changed ? ', baru masuk' : ''}</small></span>
                <span className="sc">{idNum(t.score, 1)}</span>
              </button>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid-wide">
        <Panel title="Uji bobot sendiri" sub="Geser bobot kategori. Skor dihitung ulang di browser dengan metode yang sama persis dengan notebook: log(1+x), normalisasi persentil 99, penghalusan tetangga 70/30, dan non-maximum suppression." src={['asumsi']}
          actions={<button className="btn light" onClick={() => setW(BASE_W)} disabled={!changed}><RotateCcw size={14} /> Kembali ke bobot notebook</button>}
          read={{
            ringkas: 'Coba ubah seberapa penting kantor, kampus, atau stasiun. Kalau banyak lokasi tetap muncul di daftar teratas walau bobot diubah, berarti pilihan lokasinya tidak asal-asalan.',
            bisnis: 'Manajemen bisa menyesuaikan bobot dengan target kampanye, misalnya memprioritaskan kampus saat musim penerimaan mahasiswa baru, dan langsung melihat lokasi mana yang berubah.',
            teknis: `Bobot dinormalisasi ke jumlah 1. Dengan bobot notebook, selisih skor maksimum antara browser dan notebook ${parity !== null ? idNum(parity, 3) : '–'} poin (pembulatan dua desimal di GeoJSON), dan urutan top-20 identik. Ketangguhan diuji di notebook dengan 500 draw Dirichlet(60 × bobot).`,
          }}>
          <div className="sliders">
            {CATS.map((c) => (
              <Slider key={c} label={CAT_LABEL[c]} value={w[c]} min={0} max={0.6} step={0.05} onChange={(v) => setW({ ...w, [c]: v })} format={(v) => idNum(wSum > 0 ? v / wSum : 0, 2)} />
            ))}
          </div>
          {changed && <Callout tone={overlap >= 15 ? 'good' : 'warn'} title={`${overlap} dari 20 lokasi bertahan`}>{overlap >= 15 ? 'Peringkat cukup tangguh terhadap perubahan bobot ini.' : 'Perubahan bobot ini menggeser banyak lokasi. Tentukan bobot sesuai tujuan kampanye.'}</Callout>}
          {!changed && <Callout tone="good" title="Bobot notebook aktif">Skor dan urutan top-20 sama dengan hasil notebook.</Callout>}
        </Panel>
        <Panel title="Ketangguhan top-20 awal" sub="Persen dari 500 skenario bobot acak di mana lokasi tetap masuk top-20." src={['simulasi']}>
          <div className="chart" style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={stab} margin={{ left: -18, right: 6, top: 18 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10.5 }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip content={<TT fmt={(v) => `${idNum(v, 1)}%`} />} cursor={{ fill: '#eef4f5' }} />
                <Bar dataKey="v" name="Stabilitas">
                  {stab.map((s) => <Cell key={s.name} fill={s.v >= 80 ? COLORS.green : s.v >= 50 ? COLORS.orange : COLORS.red} />)}
                  <LabelList dataKey="v" position="top" formatter={(v) => idNum(v, 0)} style={{ fontSize: 9.5, fill: '#2b4352' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="kv">
            {catCounts.flatMap((c) => [<span key={c.cat + 'k'}>Titik {c.cat.toLowerCase()}</span>, <b key={c.cat + 'v'}>{idNum(c.n)}</b>])}
          </div>
        </Panel>
      </section>
    </>
  );
}
