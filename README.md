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
| Metodologi & Bukti | 37 asumsi, 29 visual, tabel CSV dan JSON yang bisa diunduh |

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

Semua angka dibaca dari ekspor notebook `bluRadar_MarkUp2026_IngfoIntern.ipynb`:

- `public/data/*.json` dan `hex_scores.geojson`: isi folder `web_data` dari ZIP notebook.
- `public/figures/`, `public/tables/`: visual dan tabel notebook.
- `public/data/extra.json`: disusun dari tabel CSV dan konstanta data kasus oleh `scripts/build_extra.py`.

Tidak ada file model di web. Model dijalankan di notebook; dashboard menampilkan hasil, simulasi yang sudah dihitung, dan rumus sederhana (kalkulator biaya, skor Radar).

### Memperbarui setelah notebook dijalankan ulang

1. Salin isi `web_data/` ke `public/data/`, `figures/` ke `public/figures/`, `tables/` ke `public/tables/`, serta `radar_map_interaktif.html` dan `ringkasan_insight.txt` ke `public/`.
2. Perbarui blok `overpass` dan `reviews_meta` di `scripts/build_extra.py` bila cakupan data berubah, lalu jalankan `python scripts/build_extra.py`.
3. Jalankan `npm run verify`. Pemeriksaan yang gagal berarti angka baru berbeda; sesuaikan nilai acuan di `scripts/verify-numbers.mjs` dan teks yang menyebut angka itu.

## Batas data saat ini

- Peta Radar: 1 dari 9 ubin OpenStreetMap berhasil diunduh (Jakarta Selatan, Jakarta Timur bagian selatan, Depok).
- Ulasan: blu, Bank Jago, SeaBank. Bank Saqu dikeluarkan karena app ID tidak sesuai.
- Uplift: dibuktikan pada dataset eksperimen publik Hillstrom; di pilot dilatih ulang dengan data A/B blu.
- Proyeksi finansial bertumpu pada asumsi yang tercatat di tabel asumsi master.

## Logo

Aset logo ada di `public/brand/` (SVG terang, SVG putih, simbol, PNG, gambar pratinjau tautan). Favicon di `public/favicon.svg`; ikon Apple dan gambar Open Graph di `app/apple-icon.png` dan `app/opengraph-image.png` dipasang otomatis oleh Next.js. Logo ini untuk dashboard dan bisa dipakai di deck berdampingan dengan logo Mark-Up dan blu yang diwajibkan panitia.

## Struktur

```
app/                 layout, halaman, gaya global
components/
  Dashboard.js       kerangka, navigasi, mode penjelasan
  ui.js              komponen bersama
  lib/               format angka, data, skor Radar, kalkulator biaya
  views/             satu berkas per halaman
public/              data, visual, tabel, peta folium
scripts/             build_extra.py, verify-numbers.mjs
```
