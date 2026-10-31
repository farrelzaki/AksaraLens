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

## 3. Scanner pada foto nyata (Set C)

Ulangi dengan `scripts/uji_set_c.py` dan `scripts/uji_nusa.py`. Rencana dan target: `docs/RENCANA_SCANNER_CERDAS.md`.

**Data.** 30 foto Wikimedia Commons (25 berisi aksara Jawa, 5 tanpa) ditambah 20 foto negatif (Latin, Bali, Sunda),
dibagi per sumber foto: C-pengembangan 25 foto dan C-uji 25 foto. Foto tidak di-commit.

**Batas bukti.**

- Sampelnya kecil: 1 foto positif C-uji bernilai 7,7 poin.
- Seluruh Set C sudah dilihat saat diagnosis awal, sebelum dibagi, jadi C-uji tidak sepenuhnya buta.
- C-uji diukur dua kali pada tahap ini: saat kandidat pertama, lalu setelah aturan bukti diperketat karena temuan di
  N03 (C-pengembangan). Angkanya tidak berubah dan tidak ada ambang yang disetel dari C-uji.
- Belum ada foto dari kamera ponsel lewat aplikasi; "dibingkai" adalah simulasi: kotak kebenaran ditambah 15%.

### Sebelum dan sesudah Tahap 1 (model tetap v2, hanya pipeline berubah; C-uji)

| Metrik | Produksi | Tahap 1 | Minimum rilis |
| --- | --- | --- | --- |
| Foto utuh CER ≤ 0,2 | 0% | 0% | ≥ 40% |
| Foto utuh CER ≤ 0,5 | 0% | 15,4% | |
| Foto utuh 100% benar | 0% | 0% | ≥ 15% |
| Foto utuh akurasi suku kata | 5,4% | 16,1% | ≥ 60% |
| Dibingkai CER ≤ 0,2 | 15,4% | 30,8% | ≥ 60% |
| Dibingkai CER ≤ 0,5 | 15,4% | 69,2% | |
| Dibingkai akurasi suku kata | 26,8% | 55,4% | |
| Recall baris Jawa | 28,6% (4/14) | 28,6% (4/14) | ≥ 70% |
| Baris sampah | 71,4% (65/91) | 68,8% (11/16) | ≤ 10% |
| Foto tanpa aksara ditolak | 16,7% (2/12) | 58,3% (7/12) | ≥ 80% |
| Waktu di komputer (Python) | 1,25 dtk | 2,34 dtk | ≤ 3 dtk di ponsel |

Pada C-pengembangan, penolakan foto tanpa aksara mencapai 92,3%, jauh di atas 58,3% di C-uji. Ambang penolakan
terlalu pas dengan data pengembangan, jadi angka C-uji yang dipakai sebagai acuan. Jumlah baris sampah yang tampil turun
dari 65 ke 11, tetapi persentasenya hampir sama karena baris benar yang tampil juga sedikit.

**Kesimpulan.** Tahap 1 belum mencapai target apa pun di tabel. Hasil terbesar ada pada foto yang dibingkai pengguna.
Foto utuh tetap terhambat detektor (recall tidak naik) dan font hias tetap 0%, keduanya butuh latih ulang (Tahap 2–3).

### Pemeriksaan tambahan: foto dari pencarian Google

31 Okt 2026, dihitung terpisah dari C-uji: 6 gambar berisi aksara Jawa (5 papan, 1 tabel grafis) dan 3 papan tanpa aksara Jawa
(2 Lontara, 1 Sunda). Gambar berupa screenshot, tidak di-commit, dan tidak ada ambang yang disetel darinya.

| Metrik | Produksi | Tahap 1 |
| --- | --- | --- |
| Foto utuh CER ≤ 0,2 | 0/6 | 1/6 |
| Foto utuh CER ≤ 0,5 | 0/6 | 3/6 |
| Foto utuh akurasi suku kata | 8,6% | 54,3% |
| Dibingkai CER ≤ 0,2 | 2/6 | 2/6 |
| Dibingkai CER ≤ 0,5 | 2/6 | 3/6 |
| Dibingkai akurasi suku kata | 45,7% | 64,2% |
| Recall baris Jawa | 3/10 | 6/10 |
| Baris sampah | 43/68 | 2/8 |
| Foto tanpa aksara ditolak | 0/3 | 3/3 |

Batas bukti: 1 gambar positif bernilai 16,7 poin, dan gambar dipilih agar tulisannya terbaca oleh agen sehingga lebih mudah
daripada foto acak. Kunci jawaban ditulis agen; 4 dari 6 berkeyakinan sedang. Angka ini tidak mewakili kamera aplikasi dan
tidak menggantikan uji di ponsel.

### Penjaga regresi NusaAksara

| Metrik | Produksi | Tahap 1 | Syarat |
| --- | --- | --- | --- |
| Baris terpisah benar (355 baris, 30 halaman uji) | 82,8% | 79,4% | turun ≤ 1 poin: **tidak lolos** |
| Presisi pemisahan | 86,9% | 95,1% | |
| Pembaca saja (69 baris uji) | 91,2% | 91,2% | |
| Pembaca, baris tunggal yang ditolak dihitung kosong | 91,2% | 86,2% | |
| Waktu per halaman di komputer | 0,27 dtk tanpa membaca | 2,7 dtk dengan membaca | |

Angka notebook 82,8% / 86,9% terulang persis. Pembaca tertulis 91,2% di sini, sedangkan notebook 89,0%, karena rumus
pemecah suku kata bangku uji berbeda; bandingkan hanya antarversi pada bangku yang sama. Baris yang hilang sebagian besar
ditolak penilai (tiga baris pendek atau satu tanda salah), bukan gagal terdeteksi: detektor + gabung baris tetap 81,7%.

### Keputusan pipeline yang terbukti lewat pengukuran

| Keputusan | Bukti |
| --- | --- |
| `MAKS_KOTAK` 60, bukan 6 | Beberapa halaman buku berisi sampai 80 baris; batas 6 menjatuhkan pemisahan ke 25,4% |
| Gabung kotak hanya bila bersebelahan (IoU tinggi ≥ 0,5, tumpang mendatar ≤ 0,5 tinggi) | Aturan awal menggabung baris bertumpuk; pada batas 24 kotak, detektor + gabung naik dari 64,5% ke 71,8% |
| Bukti tingkat foto (≥ 2 baris TERIMA dan ≥ 20% calon) | Pada batas 24 kotak, pemisahan buku naik dari 48,2% ke 68,7%; tanpa syarat rasio, N03 di web menampilkan 23 baris |
| Ambang tidak dilonggarkan global | Longgar global menaikkan sampah Set C dari 4/8 ke 8/13 tanpa menaikkan CER ≤ 0,5 |

**Paritas web–Python.** Tiga foto diperiksa di browser (C03, C13, N03): C03 dan C13 identik; N03 berbeda pada beberapa
baris pendek (web 6 baris, Python 4), kemungkinan dari perbedaan decode dan resize gambar. Waktu di browser komputer
3–6 dtk (panel preview), jadi target ≤ 3 dtk di ponsel berisiko dan belum terukur.
