import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TAB = ROOT / "public" / "tables"
OUT = ROOT / "public" / "data" / "extra.json"


def read(name, convert=True):
    with open(TAB / name, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not convert:
        return rows
    for r in rows:
        for k, v in r.items():
            try:
                r[k] = float(v)
            except (TypeError, ValueError):
                pass
    return rows


extra = {
    "case": {
        "nasabah": 3_350_000, "saldo_rata2": 4_700_000, "dpk": 15.6e12, "volume_trx": 112e12, "frekuensi_trx": 166e6,
        "aset_blu": 20.81e12, "nim": 0.0705, "ldr": 8.99 / 15.78, "periode": "31 Mei 2026",
        "age": [["<25", 31], ["25-34", 45], ["35-44", 16], ["45-54", 7], [">=55", 3]],
        "gender": [["Laki-laki", 53], ["Perempuan", 47]],
        "province": [["Jabodetabek", 39], ["Jawa Barat", 18], ["Jawa Timur", 13], ["Sulawesi Selatan", 2], ["Bali", 2]],
        "occupation": [["Karyawan swasta", 42], ["Pelajar/mahasiswa", 22], ["Mengurus rumah tangga", 8], ["Perdagangan", 8], ["Belum/tidak bekerja", 7]],
        "label_data": "Data Kasus",
    },
    "derived_metrics": read("A0_metrik_turunan_kasus.csv", convert=False),
    "tiers": read("A0_struktur_tier_bluloyalty.csv"),
    "competitors": read("A4_lanskap_kompetitor.csv"),
    "mannwhitney": read("A7d_uji_mannwhitney_aspek.csv"),
    "sentiment_validation": {"confusion": read("A5c_validasi_sentimen_model.csv"), "accuracy": 0.751, "kappa": 0.491, "n": 1204,
                             "model": "w11wo/indonesian-roberta-base-sentiment-classifier"},
    "bandit_table": read("A9_hasil_bandit.csv"),
    "uplift_eval": read("A10_evaluasi_uplift.csv"),
    "targeting_table": read("A10c_ekonomi_targeting.csv"),
    "fairness": read("A19_fairness_wilayah.csv"),
    "tornado": read("A17_tornado.csv"),
    "projection": read("A16_proyeksi_3_tahun.csv"),
    "pilot_table": read("A15_biaya_pilot.csv", convert=False),
    "overpass": {"tiles_total": 9, "tiles_ok": 1, "tile_ok": "1,1",
                 "bbox_ok": {"south": -6.46, "north": -6.27, "west": 106.7333, "east": 106.9167},
                 "area": "Jakarta Selatan dan Jakarta Timur bagian selatan, Depok"},
    "reviews_meta": {"banks_scraped": ["blu", "SeaBank", "Bank Jago"], "excluded": "Bank Saqu (app ID tidak sesuai, 4 ulasan)",
                     "not_found": ["Superbank", "Allo Bank", "Krom Bank"], "total_clean": 8726, "with_aspect": 0.258,
                     "ols_r2": 0.290, "topic_docs": 670, "topic_outlier": 0.172},
}
OUT.write_text(json.dumps(extra, ensure_ascii=False, indent=1), encoding="utf-8")
print("extra.json ditulis:", OUT)
