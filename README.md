# bluRadar: Menjadikan Komunitas sebagai Super-App blu

Prototype Dashboard bluRadar, AI-driven direct sales engine untuk mengubah rekening baru menjadi nasabah aktif bernilai (QAC).

Tim Ingfo Intern: Nazril Ravi Pratama (Ketua), Daffa Ahmad Pangreksa. MarkUp Mini Case Competition 2026 x blu by BCA Digital.

## Isi dashboard

| Halaman | Isi |
|---|---|
| Ringkasan | Biaya per QAC, alur cerita masalah sampai rencana, 16 temuan notebook, batas data |
| Pasar & Nasabah | Profil nasabah blu, lanskap pesaing dan super-app induknya, metrik turunan, tier bluLoyalty |
| Suara Pengguna | 8.726 ulasan Play Store: tema keluhan, sentimen per aspek, driver rating, tren, validasi model |
| Radar Lokasi | Peta H3 OpenStreetMap, top-20 lokasi, uji bobot yang menghitung ulang skor di browser |
| Alokasi Squad | Contextual Thompson Sampling vs intuisi, putar ulang alokasi mingguan |
| Bendahara-First | Kuis persona dan bundle produk, simulasi akun per bendahara bluGether |
| Quest & Nudge | Katalog misi, uplift modeling (Qini, desil, anggaran 30%), fairness, migrasi tier Markov |
| Finansial | Kalkulator biaya per QAC, Monte Carlo 10.000 skenario, tornado, proyeksi 3 tahun |
| Rencana & Tata Kelola | Roadmap, KPI, power analysis, simulasi DiD, matriks risiko, tata kelola AI |
| Metodologi & Bukti | Logo, 37 asumsi, 29 visual, tabel CSV dan JSON yang bisa diunduh |

Setiap panel punya tiga jenis penjelasan (Ringkas, Bisnis, Teknis) yang dipilih di kanan atas, dan setiap angka diberi label asal data: Data Kasus, Data Publik, Asumsi, atau Simulasi.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run verify     # mencocokkan angka kunci dashboard dengan output notebook
npm run build
```

## Deploy ke Vercel

1. Push folder ini ke repository GitHub.
2. Di Vercel: Add New Project, pilih repository. Framework terdeteksi otomatis sebagai Next.js; tidak perlu environment variable.
3. Deploy.

## Data

Semua angka berasal dari hasil run notebook `bluRadar_MarkUp2026_IngfoIntern.ipynb`:

- `public/data/*.json` dan `hex_scores.geojson`: ekspor `web_data` dari notebook.
- `public/figures/`, `public/tables/`: visual dan tabel notebook.
- `public/data/extra.json`: disusun dari tabel CSV dan konstanta data kasus oleh `scripts/build_extra.py`.

Tidak ada file model di web. Model dijalankan di notebook; dashboard menampilkan hasil, simulasi yang sudah dihitung, dan rumus sederhana (kalkulator biaya, skor Radar).

`npm run verify` memeriksa 50 angka kunci dashboard terhadap output notebook, termasuk kesamaan skor Radar dan kalkulator biaya yang dihitung di browser.

## Batas data

- Peta Radar mencakup 1 dari 9 ubin OpenStreetMap (Jakarta Selatan, Jakarta Timur bagian selatan, Depok).
- Ulasan berasal dari blu, Bank Jago, dan SeaBank. Bank Saqu dikeluarkan karena app ID tidak sesuai.
- Uplift dibuktikan pada dataset eksperimen publik Hillstrom; di pilot dilatih ulang dengan data A/B blu.
- Proyeksi finansial bertumpu pada asumsi yang tercatat di tabel asumsi master.

Seluruh batas ini juga ditampilkan di dashboard.

## Logo

Aset logo ada di `public/brand/` (SVG terang, SVG putih, simbol, PNG, gambar pratinjau tautan). Favicon di `public/favicon.svg`; ikon Apple dan gambar Open Graph di `app/apple-icon.png` dan `app/opengraph-image.png` dipasang otomatis oleh Next.js.

Konsep simbol: heksagon mewakili grid H3 peta Radar, lingkaran dan garis sapu mewakili radar, dua titik mewakili komunitas yang terdeteksi. Wordmark memakai Plus Jakarta Sans.

## Struktur

```
app/                 layout, halaman, gaya global, ikon, gambar Open Graph
components/
  Dashboard.js       kerangka, navigasi, mode penjelasan
  ui.js              komponen bersama
  lib/               format angka, data, skor Radar, kalkulator biaya
  views/             satu berkas per halaman
public/              data, visual, tabel, logo, peta folium
scripts/             build_extra.py, verify-numbers.mjs
```