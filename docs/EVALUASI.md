# Evaluasi — AksaraLens

> Hasil uji model di aplikasi, untuk laporan bagian AI. Metrik & target: PRD (`referensi/`, bagian
> *Metrik keberhasilan*). Angka pelatihan (akurasi Model 1 98,3%, Model 2a 89,0%, Model 2b 82,8%)
> ada di PRD dan notebook; dokumen ini hanya berisi uji tambahan.

## 1. Kesetaraan browser vs notebook

| Bagian | Data uji | Hasil |
| --- | --- | --- |
| Scanner (deskew, detektor, CRNN) | 4 gambar render: lurus; miring −4° latar gelap buram; miring +6,5° 2400 px | Sudut, kotak baris, dan teks identik dengan notebook |
| Model 1, pra-proses | 200 coretan acak | Skeleton identik 200/200; keluaran 64×64 identik 191/200 (sisanya beda beberapa piksel akibat presisi float resize) |
| Model 1, tebakan | 196 tulisan tangan (split test Roboflow) | Tebakan sama 100% |

Ulangi bila model atau pra-proses diubah: `scripts/rujukan_scanner.py` (scanner).

## 2. Model 1 — penolakan "bukan huruf" dan ambang keyakinan

19 Okt 2026 · `scripts/evaluasi_model1.py` · 196 huruf positif, 766 contoh bukan huruf.

Huruf dinilai **benar** bila tebakan teratas = huruf target **dan** keyakinan ≥ ambang; contoh bukan
huruf **tertolak** bila tebakan teratas `bukan` **atau** keyakinan < ambang (PRD F4).

| Ambang | Positif benar | Positif ditolak | Positif salah huruf | Coretan acak tertolak | Sandhangan tertolak | Setengah jadi tertolak |
| --- | --- | --- | --- | --- | --- | --- |
| 0,4 | 99,0% | 0,5% | 0,5% | 96,7% | 99,6% | 51,0% |
| 0,5 | 98,5% | 1,0% | 0,5% | 97,3% | 100% | 62,8% |
| **0,6** (sekarang) | **98,5%** | **1,0%** | **0,5%** | **98,3%** | **100%** | **69,9%** |
| 0,7 | 98,0% | 1,5% | 0,5% | 99,0% | 100% | 78,1% |
| 0,8 | 93,9% | 6,1% | 0% | 99,3% | 100% | 85,2% |
| 0,9 | 78,1% | 21,9% | 0% | 100% | 100% | 92,3% |

**Metrik PRD "penolakan coretan acak ≥ 85%" (coretan acak + sandhangan): tercapai** — 99,1% pada ambang 0,6.

Pengamatan:

- Ambang 0,4–0,7 hampir tidak mengubah hasil untuk tulisan yang benar; di atas 0,7 tulisan benar mulai banyak ditolak.
- Huruf **setengah jadi** paling sulit ditolak; yang lolos (ambang 0,6) paling sering terbaca *ra*, *pa*, *ga*.
  Dampaknya ringan: pengguna mendapat pesan "Terbaca sebagai …", bukan "benar".

Keterbatasan:

- Positif berasal dari split test Roboflow; Model 1 juga dilatih dengan data Roboflow, jadi akurasi di sini
  terlalu optimistis. Target PRD (≥ 90% pada **penulis baru**) tetap perlu diukur dengan tulisan kanvas teman.
- Sandhangan dirender dari font Tuladha Jejeg (variasi ukuran, tebal, rotasi), bukan tulisan tangan.
- Coretan acak dan "setengah jadi" dibuat sintetis oleh skrip (seed tetap, hasil dapat diulang).

Keputusan ambang tetap milik Farrel (batas 8 Nov, `docs/ARSITEKTUR.md` bagian 7).
