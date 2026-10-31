# Rencana Scanner Cerdas

> Pegangan kerja agen untuk mengembangkan scanner (F5) sampai terasa pintar dan profesional
> di kondisi nyata: papan jalan, gapura, buku, layar, tabel, dan teks Latin yang bercampur.
> Disusun 29 Okt 2026. Pemilik: Farrel (ML + scanner). Status fase dicatat di bagian 9.

## 1. Tujuan dan arti "pintar"

Scanner disebut pintar bila, pada foto yang wajar dari pengguna awam:

1. **Hanya membaca aksara Jawa.** Teks Latin, angka, logo, dan tekstur tidak pernah muncul sebagai aksara karangan.
2. **Membaca baris secara utuh dan berurutan**, dari atas ke bawah dan kiri ke kanan, termasuk aksara berjarak lebar (papan, tabel).
3. **Jujur saat ragu.** Baris yang terbaca tapi meragukan diberi tanda. Kalau tidak ada aksara Jawa, sistem bilang begitu, bukan menebak.
4. **Memberi alasan gagal yang bisa ditindaklanjuti** ("terlalu buram", "hanya teks Latin yang terlihat", "dekatkan kamera").
5. **Tetap dalam batas PRD:** semua di perangkat, ≤ 3 detik, foto dan hasil tidak disimpan atau dikirim, tanpa scan live, model ≤ 10 MB.

## 2. Referensi dan pelajaran yang dipakai

| Sumber | Pelajaran untuk kita |
| --- | --- |
| [PP-OCR (Du dkk., 2020)](https://arxiv.org/pdf/2009.09941), [parameter inferensi PaddleOCR](https://www.paddleocr.ai/v2.9/en/ppocr/blog/inference_args.html) | Sistem OCR ringan produksi memakai **tiga tahap**: deteksi, klasifikasi (arah), pengenalan. Hasil dengan skor di bawah `drop_score` (bawaan 0,5) **dibuang, tidak ditampilkan**. Kita meniru pola ini: ada tahap penyaring sesudah pengenalan, dan klasifikator kecil (±500 KB) bila perlu. |
| [NusaAksara (Adilazuarda dkk., ACL 2025)](https://arxiv.org/abs/2502.18148) | Model umum (GPT-4o, PP-OCR, VLM) hampir gagal total di aksara daerah. Detektor PP-OCRv3 yang di-*fine-tune* bisa memisah baris dengan baik. Artinya pendekatan model khusus kecil milik kita sudah tepat. Masalahnya ada di **data**, bukan arsitektur. |
| [Baseline OCR aksara Jawa cetak (ETASR 2026)](https://www.etasr.com/index.php/ETASR/article/view/15502) | Segmentasi baru 63,5%, transliterasi 61–72%. Penyebab utamanya struktur glif yang kompleks dan komponen yang bertumpuk. Pembanding nasional kita (sekarang 89% per suku kata di baris bersih) sudah di atas itu. Yang belum teruji adalah foto adegan. |
| [CNN aksara Jawa (IEEE 2022)](https://ieeexplore.ieee.org/document/9888527/) | Akurasi klasifikasi 98% turun ke CER 38% saat diuji foto ponsel. Pelajarannya: **angka lab tidak sama dengan angka lapangan**, jadi kita wajib punya set uji foto nyata. |
| [SynthText (Gupta dkk., 2016)](https://alphaxiv.org/abs/1604.06646), [SynthText3D](https://arxiv.org/pdf/1907.06007) | Detektor adegan dilatih dengan teks yang **ditempel di atas foto latar** beserta perspektif dan pencahayaan. Generator baris kita sekarang hanya berlatar polos, jadi perlu diperluas ke adegan. |
| Pipeline Synth90K (ringkasan di SynthText3D) | Data latih pengenal: render font → tepi/bayangan → warna → distorsi proyektif → dicampur potongan foto alami + noise. |
| [E2E-MLT (Bušta dkk., 2018)](https://arxiv.org/pdf/1801.09919), [identifikasi aksara adegan (Gomez dkk.)](https://arxiv.org/pdf/1602.07475) | OCR untuk aksara non-Latin **harus menangani campuran dengan Latin, angka, dan simbol**, karena itu kondisi normal di papan. Identifikasi aksara di adegan jarang diteliti, jadi kita harus membuatnya sendiri: penolakan lewat data negatif dan klasifikator kecil. |
| [AT-ST (Kišš dkk., 2021)](https://arxiv.org/pdf/2104.13037) | Peluang posterior CTC **dinormalisasi panjang** adalah ukuran keyakinan per baris yang baik untuk memprediksi kesalahan. Ini dasar skor keyakinan kita. |
| [Confidence Prediction for Lexicon-Free OCR](https://ar5iv.arxiv.org/html/1805.11161), [paten verifikasi OCR (EP2808827)](https://patents.google.com/patent/EP2808827B1/en) | Ambang tunggal bisa salah menolak atau salah menerima. Ambang harus **disetel dengan kurva di set uji**, dan sinyal kedua (validitas struktur) dipakai untuk penolakan. |
| [ML Kit Text Recognition v2](https://developers.google.com/ml-kit/vision/text-recognition/v2) | Struktur hasil profesional: blok → baris → elemen, masing-masing dengan kotak dan keyakinan. Kira-kira ≥ 16×16 px per karakter untuk akurasi baik. Ini dasar pesan "dekatkan kamera". |
| Google Lens ([9to5Google](https://9to5google.com/2021/04/11/google-lens-photos-web/), [Engadget](https://www.engadget.com/2018-05-09-google-lens-hands-real-world-copy-and-paste.html)) | UX Lens: animasi analisis singkat, lalu teks yang terdeteksi disorot di tempatnya. Teks tidak harus lurus sempurna. |
| [Protokol ICDAR](https://arxiv.org/pdf/2006.04305), [CLEval (CVPRW 2020)](https://openaccess.thecvf.com/content_CVPRW_2020/supplemental/Baek_CLEval_Character-Level_Evaluation_CVPRW_2020_supplemental.pdf) | Deteksi diukur dengan presisi, recall, dan H-mean pada IoU ≥ 0,5. Ujung-ke-ujung diukur di tingkat karakter. Kita memakai versi sederhananya (bagian 4). |
| [Aksara Jawa di papan nama DIY (Sutasoma 2022)](https://journal.unnes.ac.id/sju/sutasoma/article/view/61576), [Erikha 2018](https://scholarhub.ui.ac.id/paradigma/vol8/iss1/4) | Papan jalan Yogyakarta: Latin dan Jawa berdampingan, dan memakai **aksara swara dan rekan** untuk kata serapan. Aksara itu di luar materi 3 bab. Scanner harus menandainya sebagai "belum dikenali", bukan mengarang. |

## 3. Kondisi awal (bukti 29 Okt 2026)

- **Baris bersih:** 89,0% akurasi suku kata, CER 5,0% (NusaAksara). Pemisahan baris di halaman buku 82,8%.
- **Tabel huruf** (gambar "Aksara Jawa" hanacaraka): detektor memecah 4 baris menjadi **38 kotak**. Hasilnya acak, dan judul serta teks Latin ikut "terbaca". Pipeline Python rujukan memberi hasil yang sama, jadi ini **bukan bug web**.
- **Prototipe pasca-proses** (gabung kotak sebaris + saring keyakinan): 38 → 9 baris. "ha na ca ra ka" dan "pa dha ja ya nya" terbaca utuh, judul tertolak (0,40). Masih bocor: baris Latin terbaca sebagai `ra ꧀ ꧀ ꧀ ma` (keyakinan 0,79), dan *la* serta *ma* di ujung baris terlewat oleh detektor.
- **Akar masalah:** data latih detektor dan CRNN hanya halaman buku dan baris berlatar polos. Kasus yang belum pernah dilihat: adegan, jarak antarhuruf lebar, Latin berwarna atau besar, layar.

## 4. Bangku uji: cara mengukur "pintar"

Tanpa angka, "lebih pintar" hanya perasaan. Semua fase diukur dengan `scripts/uji_scanner.py`. Skrip ini memakai pipeline yang identik dengan web dan keluarannya `docs/random/uji/hasil_<versi>.json`, ditambah ringkasan di `docs/EVALUASI.md`.

| Set | Isi | Sumber |
| --- | --- | --- |
| **A. Adegan sintetis** | 300 gambar dengan kebenaran tepat: papan jalan (plat warna, Latin + Jawa), tabel huruf berjarak, halaman campur Latin, foto layar (moiré), gambar tanpa aksara Jawa (Latin saja, tekstur) | Dibuat generator (fase F3), benih tetap, dipisah dari data latih |
| **B. NusaAksara** | 69 baris uji + 30 halaman uji (sama dengan laporan sekarang) | Penjaga regresi |
| **C. Foto nyata** | 30–40 foto ponsel: buku pelajaran, papan nama, layar, kemasan, tabel, plus 5 foto **tanpa** aksara Jawa | Diambil Farrel/tim. Label `file,teks` per suku kata, baris dipisah `\|` (format sel 40 notebook). Disimpan di `docs/random/` (gitignored, tidak keluar repo) |

| Metrik | Arti | Target akhir |
| --- | --- | --- |
| **Recall baris** | Baris aksara Jawa yang ditemukan (IoU ≥ 0,5, protokol ICDAR) | A ≥ 85%, B ≥ 82,8% (tidak turun), C ≥ 80% |
| **Tingkat sampah** | Baris keluaran yang tidak bertumpang dengan aksara Jawa mana pun (Latin, noise) | A ≤ 3%, C ≤ 5% |
| **Penolakan gambar tanpa aksara** | Gambar tanpa aksara Jawa yang dijawab "tidak ada aksara" | ≥ 90% |
| **Akurasi suku kata ujung-ke-ujung** | Edit distance suku kata atas semua baris yang dicocokkan | A ≥ 85%, C ≥ 75% |
| **Baris 100% benar** | Pengalaman yang dirasakan pengguna | C ≥ 50% (sekarang 31,9% di B) |
| **Waktu scan** | Rata-rata 20 kali di ponsel kelas menengah | ≤ 3 dtk |
| **Ukuran model** | Total ONNX | ≤ 10 MB per model |

## 5. Arsitektur sasaran

```
foto ─► cek kualitas ─► polaritas & deskew ─► detektor baris (U-Net)
        (buram/gelap/                              │
         terlalu kecil)                            ▼
                                   gabung kotak sebaris + urutan baca
                                                   │
                                                   ▼
                                    CRNN (dilatih dengan negatif Latin/noise)
                                                   │
                                                   ▼
                     penilai baris: keyakinan CTC ternormalisasi + validitas tata aksara
                     (+ klasifikator Jawa/bukan bila perlu, ±200–500 KB)
                                                   │
                     ┌─────────────────────────────┼─────────────────────────────┐
                  TERIMA                         RAGU                          TOLAK
               tampil normal          tampil + "mungkin kurang tepat"    tidak tampil
                                                   │
                                                   ▼
                   ringkasan: "3 baris terbaca · 2 teks lain diabaikan" atau alasan gagal spesifik
```

Tiga tingkat ini sesuai PRD F5: keyakinan rendah tetap tampil dengan peringatan. Yang ditolak adalah yang **bukan aksara Jawa**.

## 6. Fase kerja

Setiap fase punya **gerbang lulus**. Kalau gerbang tidak tercapai, jalankan **tangga cadangan** dari atas ke bawah. Setiap fase berakhir dengan commit, PR ke `develop`, dan catatan di bagian 9.

### F0. Bangku uji (fondasi)
- **Langkah:** tulis `scripts/uji_scanner.py`, yang memakai ulang fungsi `rujukan_scanner.py` dan menambah pencocokan IoU, metrik bagian 4, serta laporan. Generator set A versi awal (papan, tabel, Latin saja). Jalankan pada model v2 sekarang untuk mendapat **baseline**.
- **Gerbang:** angka baseline tercatat di `EVALUASI.md`. Pipeline Python dan web tetap identik (uji paritas yang sudah ada).
- **Cadangan:** kalau paritas pecah, perbaiki dulu sebelum lanjut. Pengukuran yang tidak sama dengan produk tidak berarti.

### F1. Pasca-proses cerdas (tanpa latih ulang)
- **Langkah** (logika murni di `src/ml/model2/`, masing-masing dengan test Vitest; versi Python di `uji_scanner.py`):
  1. `gabungBaris`: kotak dengan tumpang tinggi ≥ 50% digabung, kotak kecil (< 0,5× median tinggi) dibuang, lalu diurutkan atas ke bawah dan kiri ke kanan.
  2. `validitasAksara`: proporsi tanda yatim (pangkon, sandhangan, atau tarung tanpa huruf dasar, tanda berulang).
  3. `nilaiBaris`: keyakinan CTC ternormalisasi panjang (AT-ST) dan validitas → TERIMA / RAGU / TOLAK.
  4. Ambang dipilih dari **kurva** di set A (seperti pemilihan ambang 0,7 Model 1), bukan tebakan.
- **Gerbang:** tingkat sampah A turun ≥ 70% dari baseline. Recall B turun ≤ 1 poin. Tabel hanacaraka: ≥ 3 dari 4 baris Jawa terbaca, 0 baris Latin tampil.
- **Cadangan:** (a) setel ulang ambang per jenis set; (b) tambah fitur penilai: rasio tinggi kotak dan kepadatan tinta; (c) kalau Latin masih bocor > 10%, majukan klasifikator Jawa/bukan (F4b).

### F2. Pengalaman pengguna profesional
- **Langkah:**
  1. Cek kualitas sesudah foto diambil: buram (varians Laplacian), gelap atau silau (histogram), tulisan terlalu kecil (tinggi baris < 16 px, sesuai pedoman ML Kit). Masing-masing dengan pesan khusus.
  2. Ringkasan hasil: jumlah baris terbaca dan jumlah teks lain yang diabaikan.
  3. Lencana RAGU per baris, bukan peringatan global.
  4. Aksara di luar cakupan (swara, rekan, murda, angka Jawa) ditandai "belum dikenali".
- **Butuh keputusan Farrel:** menampilkan sorotan baris di atas foto (gaya Lens) bertentangan dengan permintaan "gambar yang diambil tidak ditampilkan". **Bawaan: tidak ditampilkan.** Ini hanya diusulkan, tidak dikerjakan tanpa persetujuan.
- **Gerbang:** setiap jalur gagal di PRD F5 punya pesan sendiri, dan diuji manual di ponsel.
- **Cadangan:** kalau cek kualitas salah alarm > 10% di set C, longgarkan menjadi saran saja, tidak menghalangi.

### F3. Generator data adegan (untuk latih ulang)
- **Langkah** (sel notebook baru, mengikuti gaya notebook Model 2):
  1. Latar: tekstur prosedural (kayu, tembok, cat, gradien), plat papan jalan berwarna dengan bingkai, kertas, layar dengan pola moiré.
  2. Isi: baris Jawa dari `acak_teks` dengan **jarak antarhuruf acak sampai 3×**, tabel huruf, dan teks Latin pengecoh (DejaVu dan font OFL lain; ukuran, warna, kapital acak) di atas, bawah, atau di antara baris Jawa.
  3. Efek: perspektif ±25°, blur gerak, JPEG, bayangan, silau, *vignette*.
  4. Negatif untuk CRNN: potongan Latin, angka, dan tekstur dengan **label kosong** (CTC hanya blank).
- **Gerbang:** pratinjau 24 sampel kuperiksa sendiri secara visual. Statistik tinggi baris dan rasio Latin:Jawa tercatat. Set A dibuat dengan benih terpisah dari data latih.
- **Cadangan:** kalau render rusak (sandhangan salah posisi), cek `raqm` (sel 3) dan kurangi efek yang merusak.

### F4. Latih ulang model v3 (Colab GPU)
- **Langkah:**
  - **a. Detektor v3:** *fine-tune* dari bobot v2 dengan campuran 50% halaman NusaAksara dan 50% adegan F3.
  - **b. CRNN v3:** *fine-tune* dari bobot fine-tune v2 dengan campuran baris nyata, sintetis, dan 15% negatif.
  - **c.** Ekspor ONNX, cek identik dengan PyTorch, lalu ukur di bangku uji A, B, C.
- **Gerbang:** v3 lebih baik dari (v2 + F1) di A dan C. B tidak turun > 1 poin. Ukuran ≤ 10 MB. Waktu tetap ≤ 3 dtk.
- **Cadangan, berurutan:**
  1. Naikkan langkah latih (×1,5) dan cek apakah validasi masih naik.
  2. Ubah rasio campuran (adegan 30–70%, negatif 10–25%).
  3. **Klasifikator Jawa/bukan** terpisah (CNN kecil 64×W, ±200–500 KB, pola klasifikator PP-OCR), dilatih dari potongan F3.
  4. Kalau tetap kalah, **v2 + F1 tetap dipakai** dan hasil v3 dicatat sebagai temuan di laporan. Model yang lebih buruk tidak pernah dirilis.

### F5. Integrasi dan rilis aman
- **Langkah:** unggah ke `models/v3` di Supabase (v2 tetap ada). Versi model ikut kunci cache. Uji paritas Python dan web, lalu `npm test`, `typecheck`, `build`. Uji di **URL preview Vercel** dari branch fitur di ponsel, **sebelum** merge. Ingat: `develop` sekarang langsung menjadi production.
- **Gerbang:** semua uji lulus. Scan di ponsel ≤ 3 dtk. Bangku uji web sama dengan Python.
- **Cadangan:** kalau terjadi regresi di production, kembalikan `VITE_MODEL_URL` ke `models/v2` dan redeploy. Ini rollback 1 langkah tanpa ubah kode.

### F6. Uji lapangan dan iterasi
- **Langkah:** jalankan set C. Golongkan setiap kesalahan: deteksi terlewat, sampah lolos, salah baca huruf mirip, di luar cakupan, kualitas foto. Ambil 2 golongan terbesar, lalu kembali ke F3 dengan data yang membidik golongan itu.
- **Batas:** maksimal **2 putaran** iterasi atau sampai target bagian 4 tercapai. Setelah itu dibekukan.
- **Akhir:** `EVALUASI.md` diperbarui (tabel sebelum dan sesudah per versi), bahan presentasi diperbarui, dan keterbatasan yang tersisa ditulis jujur.

## 7. Aturan jalan sendiri

**Agen kerjakan tanpa menunggu:**
- Semua kode, test, skrip ukur, generator, sel notebook, commit, branch, PR, dan merge ke `develop` sesuai KOLABORASI 5a.
- Memilih ambang berdasarkan kurva bangku uji.
- Menjalankan tangga cadangan.
- Memutuskan tidak merilis model yang lebih buruk.

**Hanya Farrel yang bisa** (agen menyiapkan semua dan memberi instruksi langkah demi langkah):
- Menjalankan notebook di Colab GPU (F4).
- Mengambil 30–40 foto set C (F0/F6).
- Mengunggah ONNX ke Supabase Storage.

**Agen berhenti dan bertanya bila:**
- Perubahan menyentuh hal di luar PRD (misalnya scan live, menampilkan foto yang diambil).
- Model baru butuh dependency baru.
- Target bagian 4 terbukti tidak realistis setelah tangga cadangan habis. Agen mengusulkan target revisi beserta buktinya.

Merge ke `develop` sama dengan rilis production. Merge hanya dilakukan setelah gerbang fase lulus dan uji preview di ponsel berhasil.

## 8. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Data sintetis tidak mirip dunia nyata (*domain gap*) | Set C foto nyata sebagai penentu akhir. Iterasi F6 membidik kesalahan nyata |
| Penyaring terlalu ketat sehingga aksara Jawa buram ikut hilang | Tingkat RAGU (tetap tampil). Ambang dari kurva. Recall dipantau di setiap set |
| Latih ulang merusak kemampuan lama | Set B sebagai penjaga regresi. Fine-tune dari bobot v2, bukan dari nol. Rollback env |
| Waktu ponsel > 3 dtk karena tahap tambahan | Pasca-proses itu aritmetika ringan. Klasifikator hanya dipakai bila perlu dan dibatasi ≤ 500 KB |
| Kuota Colab habis | Tangga cadangan 1–2 murah. F1 + F2 sudah memberi lompatan terbesar tanpa GPU |
| Lisensi NusaAksara non-komersial | Proyek kuliah: boleh, wajib sitasi (sudah di notebook dan PRD) |

## 9. Status fase

| Fase | Status | Catatan |
| --- | --- | --- |
| F0 Bangku uji | selesai | `scripts/uji_set_c.py`, `scripts/uji_nusa.py`; hasil di `docs/EVALUASI.md` bagian 3 |
| F1 Pasca-proses | selesai, gerbang lulus sebagian | NusaAksara turun 3,4 poin (presisi naik 8,2), negatif C-uji 58,3%, waktu ponsel belum diukur |
| F2 UX | sebagian | kamera baca isi bingkai, pesan gagal spesifik; sorotan di foto menunggu keputusan |
| F3 Generator adegan | belum mulai | |
| F4 Latih ulang v3 | belum mulai | butuh Colab |
| F5 Rilis | belum mulai | |
| F6 Uji lapangan | belum mulai | butuh foto set C |

## 10. Rencana lanjutan memakai Set C

> Disetujui Farrel 29–31 Okt 2026. Bagian ini mengganti target dan urutan fase di atas bila bertentangan.
> Hasil terukur ada di `docs/EVALUASI.md` bagian 3.

### Konteks

Tujuannya tetap: pengguna memotret papan jalan atau tulisan lain yang bercampur teks Latin, dan scanner hanya membaca aksara Jawa, utuh dan berurutan, serta jujur saat ragu. Set C (foto nyata + kunci jawaban) sudah ada di `Desktop/AksaraLens_SetC/set_c`, sehingga kemampuan model bisa diukur untuk pertama kalinya pada kondisi nyata. Rencana ini melanjutkan `docs/RENCANA_SCANNER_CERDAS.md` dan mengganti bagian target serta urutan fasenya.

**Catatan data:** yang ditemukan **30 foto, bukan 40** (25 berisi aksara Jawa: 22 papan, 2 buku/cetakan, 1 tabel; 5 tanpa aksara Jawa). Semuanya dari Wikimedia Commons, bukan dari kamera aplikasi. Ada 27 foto kandidat di `_pratinjau/kandidat`.

### Hasil diagnosis awal (sudah diukur, model v2, tanpa mengubah kode)

| Pengukuran | Hasil |
| --- | --- |
| Pipeline sekarang, 25 foto positif | CER baris terbaik **0,83**; foto CER ≤ 0,2: **0/25**; CER ≤ 0,5: **0/25** |
| Gabung baris + saring keyakinan (prototipe) | CER ≤ 0,5: 6/25; tetapi 10/25 foto jadi tanpa keluaran (terlalu ketat) |
| Foto tanpa aksara yang ditolak | mentah **0/5**; dengan saringan 3/5 |
| Potongan tepat buatan tangan (14 foto), polaritas sekarang | CER ≤ 0,33: **2/14** |
| Potongan tepat + pilih polaritas lewat keyakinan | CER ≤ 0,33: **8/14**; rata-rata CER 0,86 → 0,54 |
| Detektor dua polaritas + pilihan baris terbaik (oracle), 25 foto | CER ≤ 0,2: **1/25**; CER ≤ 0,5: **5/25** |

**Kesimpulan, urut dari dampak terbesar:**
1. **Detektor** gagal menemukan baris di foto adegan. Ini penghambat utama, karena dengan bantuan polaritas dan pilihan oracle pun hasilnya hanya 5/25.
2. **Polaritas global salah** pada tulisan terang di papan gelap. Pembaca sering kali sudah benar bila potongannya dibalik (C03 CER 0,00; C07 0,10; C23 0,10).
3. **Font hias/relief** gagal walau potongannya tepat (C05, C08, C11, C24, C27). Tepi miring juga mengganggu (C02).
4. **Tidak ada penolakan yang andal.** Keyakinan saja membuang baris benar sekaligus meloloskan sampah.

Batas bukti: 14 potongan tangan bersifat kasar, dan 30 foto adalah sampel kecil (1 foto = 4% dari 25 positif).

### Target (diukur pada foto utuh, di C-uji yang dikunci)

| Metrik | Sekarang | **Minimum rilis** | **Target "pintar"** |
| --- | --- | --- | --- |
| Foto CER ≤ 0,2 | 0% | ≥ 40% | ≥ 60% |
| Foto terbaca 100% benar | 0% | ≥ 15% | ≥ 40% |
| Akurasi suku kata keseluruhan | 6,5% (baseline resmi) | ≥ 60% | ≥ 75% |
| Recall baris Jawa (IoU ≥ 0,5) | diukur di tahap 0 | ≥ 70% | ≥ 80% |
| Baris sampah pada keluaran | diukur di tahap 0 | ≤ 10% | ≤ 5% |
| Foto tanpa aksara dijawab "tidak ada aksara" | 0% | ≥ 80% | ≥ 90% |
| Pengguna membingkai sendiri (Atur area): foto CER ≤ 0,2 | diukur di tahap 0 | ≥ 60% | ≥ 80% |
| Penjaga regresi NusaAksara (per suku kata / pemisahan baris) | 89,0% / 82,8% | turun ≤ 1 poin | tidak turun |
| Waktu scan rata-rata di HP (20 kali) | belum diukur | ≤ 3 dtk | ≤ 3 dtk |
| Ukuran per model / privasi | 8,2 MB / di perangkat | ≤ 10 MB, foto tidak keluar | sama |

Metrik "foto" = semua baris keluaran digabung dibanding kunci. Foto tanpa keluaran dihitung CER 1,0. Papan hias diukur juga terpisah, agar kategori sulit tidak tersembunyi di rata-rata.

Model hanya dirilis bila **lebih baik dari yang sedang produksi di C-uji dan lolos penjaga regresi**.

### Plan A: perbaiki pipeline, lalu latih ulang model sekarang

#### Tahap 0. Bangku uji Set C (tanpa Colab)
- Salin Set C ke `docs/random/set_c/` (gitignored). Audit semua label dengan melihat fotonya; koreksi dicatat, dan foto yang tak terbaca manusia ditandai.
- Beri kotak baris per foto untuk mengukur recall.
- Bagi per **sumber foto** supaya tidak bocor: **C-pengembangan (15)** untuk menyetel dan analisis kesalahan; **C-uji (15)** dikunci, dipakai hanya di gerbang akhir. Foto dari sumber sama tetap satu kelompok (C05/C06, C11/C13, C26/C30).
- Tambah **set negatif** menjadi ≥ 20: foto Latin dan aksara mirip (Sunda, Bali) dari Commons.
- Tulis `scripts/uji_set_c.py`, memakai ulang fungsi di `scripts/rujukan_scanner.py`. Catat baseline resmi di `docs/EVALUASI.md`.
- **Lulus:** metrik baseline tercatat, uji paritas Python–web masih identik.
- **Mitigasi:** label meragukan dikeluarkan dan dicatat, bukan ditebak. Paritas pecah → diperbaiki dulu.

#### Tahap 1. Perbaikan pipeline tanpa latih ulang
Logika murni wajib dengan test Vitest, versi Python ikut disamakan.
- Polaritas lokal per kotak: baca dua arah, pakai yang lebih yakin. Detektor dijalankan pada polaritas kedua hanya bila kotaknya kurang.
- Gabung kotak sebaris, urutan baca, buang kotak kecil.
- Luruskan per baris (papan miring), karena deskew global tidak andal di adegan.
- Penilai TERIMA/RAGU/TOLAK: keyakinan CTC + validitas tata aksara (sandhangan/pangkon yatim). Ambang dipilih dari kurva di C-pengembangan.
- Kamera dan Atur area: baca area bingkai; bila detektor tidak menemukan apa pun, baca area itu sebagai satu baris.
- Pesan gagal yang spesifik sesuai PRD F5.
- Berkas: `src/ml/model2/scan.ts`, `detektor.ts`, `ctc.ts`, modul baru `saring.ts`, `src/features/scanner/ScanPage.tsx`.
- **Lulus (C-pengembangan):** foto CER ≤ 0,5 ≥ 40%, negatif tertolak ≥ 80%, NusaAksara turun ≤ 1 poin, ≤ 3 dtk di HP.
- **Mitigasi:** waktu > 3 dtk → batasi jumlah kotak dan polaritas kedua hanya untuk kotak ragu. Baris benar ikut terbuang → longgarkan TOLAK menjadi RAGU. Lulus sebagian tetap boleh dirilis lewat preview dan PR bila lebih baik dari produksi, karena semuanya perbaikan yang berdiri sendiri.

#### Tahap 2. Data latih adegan
- Notebook baru `docs/random/AksaraLens_Model2_v3.ipynb`, memakai ulang generator sel 13 dan 35.
- Adegan sintetis: plat jalan, papan, batu/relief, kaca toko, layar; Latin berdampingan; **dua polaritas seimbang**; perspektif, blur, silau; jarak huruf lebar; distorsi goresan untuk meniru font hias.
- Tambah font berlisensi OFL yang terbukti lisensinya (Noto Sans Javanese, Tuladha Jejeg, ditambah font lain dari katalog jawaunicode bila lisensinya jelas).
- **Data nyata latih 100–200 potongan** dari foto Commons di luar Set C (27 kandidat + kategori yang sama): aku buat draf kotak dan label, kamu cek sampel. Atribusi lisensi dicatat.
- Negatif pembaca: Latin, angka, tekstur, aksara Sunda/Bali, berlabel kosong.
- **Lulus:** 24 sampel kuperiksa visual; tidak ada foto C-uji di data latih.
- **Mitigasi:** render rusak → cek `raqm`. Data nyata kurang dari 100 → tetap jalan, lanjutkan dengan pseudo-label di Plan B3.

#### Tahap 3. Latih ulang v3 (kamu menjalankan Colab; aku siapkan semua sel)
- Detektor v3: fine-tune dari bobot v2, campuran halaman buku + adegan + data nyata.
- CRNN v3: fine-tune dari bobot v2, campuran NusaAksara + sintetis adegan + nyata + negatif 15%.
- Ekspor ONNX, cek identik dengan PyTorch, ukur dengan bangku uji.
- **Gerbang detektor (C-pengembangan):** recall ≥ 70%, presisi ≥ 80%.
- **Gerbang pembaca (potongan tepat C-pengembangan):** suku kata ≥ 75%, negatif tertolak ≥ 90%, NusaAksara ≥ 88%.
- **Mitigasi:** maksimal **3 putaran Colab**. Setiap putaran membidik 2 golongan kesalahan terbesar. Validasi masih naik → tambah langkah; hasil berlawanan → ubah rasio campuran. Kuota Colab habis → pakai bobot terbaik yang ada dan lanjut ke gerbang akhir.

#### Tahap 4. Gerbang akhir dan rilis
- Ukur C-uji **sekali** (bersama 10 foto HP, lihat bawah) dan NusaAksara.
- Unggah ke `models/v3` di Supabase (kamu), `models/v2` tetap ada.
- Uji di URL preview Vercel dari HP, baru merge. `develop` = production.
- **Mitigasi:** regresi di production → kembalikan `VITE_MODEL_URL` ke `models/v2` dan redeploy.

### Tabel keputusan

| Kondisi setelah Plan A | Tindakan |
| --- | --- |
| C-uji capai target "pintar" | Rilis, dokumentasikan, selesai |
| Capai minimum, belum target | Rilis, lalu 1 putaran perbaikan bila waktu cukup |
| Recall detektor < 70% setelah 3 putaran | Plan B1 |
| Pembaca potongan tepat < 75% setelah 3 putaran | Plan B2 |
| Detektor dan pembaca lulus, ujung-ke-ujung tetap rendah | Audit potongan/pelurusan, lalu B3 |
| Sampai **5 Des 2026** minimum belum tercapai | Plan C (cadangan pasti rilis) |

### Plan B: ganti komponen yang gagal (hanya yang terbukti gagal)

- **B1. Detektor lain:** fine-tune detektor ringan keluarga PP-OCR/DBNet (NusaAksara melaporkan hasil pemisahan yang wajar dengan PP-OCRv3). Syarat: ekspor ONNX jalan di browser, ≤ 10 MB, ≤ 3 dtk.
- **B2. Pembaca lain:** SVTR-Tiny atau pembaca PP-OCR mobile, dengan kuantisasi bila perlu agar ≤ 10 MB. CRNN v3 menjadi pembanding.
- **B3. Pseudo-label:** model terbaik melabeli foto Commons tanpa label; hanya yang sangat yakin dipakai, sampel kuperiksa, maksimal 2 putaran.
- **B4. Klasifikator kecil Jawa/bukan** (≤ 500 KB) bila hanya penolakan yang gagal.
- **Mitigasi:** perubahan arsitektur dan dependency baru butuh persetujuanmu sesuai `AGENTS.md`. Syarat rilis sama dengan Plan A.

### Plan C: cadangan yang pasti bisa dirilis

Bila model belum cukup pintar membaca foto utuh, produk tetap terasa profesional:
- Alur utama menjadi **bingkai terpandu**: pengguna memposisikan tulisan di bingkai, sistem membaca area itu.
- Penolakan ketat: lebih baik bilang "tidak terbaca" daripada mengarang.
- Cakupan ditulis jujur di aplikasi dan laporan: papan dan cetakan jelas didukung; font hias/relief belum.
- Hasil Plan A/B tetap dilaporkan apa adanya di `docs/EVALUASI.md`.
- Target direvisi hanya dengan bukti dan **persetujuanmu**.

**Tidak dipakai sama sekali:** mengirim foto ke server atau LLM (melanggar BR-01), scan live (non-goal PRD).

### Pembagian kerja

- **Agen:** kode, test, bangku uji, audit label, generator, sel notebook, draf anotasi, analisis, commit/PR/merge.
- **Kamu:**
  - Jalankan notebook di Colab (A–B).
  - Unggah model ke Supabase.
  - Cek sampel label.
  - Tambah **10 foto dari kamera HP lewat aplikasi** (papan, buku, layar, tabel, sebagian tanpa aksara). Commons tidak mewakili jalur kamera aplikasi; foto ini melengkapi jumlah menjadi 40 dan ikut C-uji.
  - Ukur waktu di HP.

### Risiko utama

| Risiko | Mitigasi |
| --- | --- |
| Target tidak tercapai karena tidak ada benchmark papan aksara Jawa publik sebagai acuan | Gerbang bertahap, Plan B dan C |
| Set C terkontaminasi karena dipakai berulang | C-uji dikunci, audit sekali, satu kali ukur per kandidat rilis |
| Sampel kecil, angka bergoyang | Laporkan jumlah foto, tampilkan per kategori, tambah data bila keputusan bergantung pada 1–2 foto |
| Sintetis tidak mirip kenyataan | Data nyata latih dan analisis kesalahan tiap putaran |
| Lisensi NusaAksara dan foto Commons | Non-komersial untuk kuliah, sitasi dan atribusi dicatat, foto tidak di-commit |
| Regresi pada buku bersih | NusaAksara sebagai penjaga di setiap gerbang |

### Verifikasi

1. Setiap tahap: `npm test`, `npm run typecheck`, `npm run build`, dan `scripts/uji_set_c.py`.
2. Paritas Python–web pada gambar uji sebelum setiap rilis.
3. Uji preview Vercel di HP: kamera, galeri, Atur area, foto tanpa aksara, dan pencatatan waktu 20 kali.
4. `docs/EVALUASI.md` memuat tabel sebelum–sesudah per versi; `docs/RENCANA_SCANNER_CERDAS.md` bagian status diperbarui setiap gerbang.
