# Rencana Scanner Final (v4)

> Dokumen serah-terima. Bisa dijalankan oleh Claude Code, Codex, Cursor, Gemini/Antigravity, atau manusia tanpa membaca
> percakapan sebelumnya. Ditulis 5 Nov 2026 setelah v3 (PR #23) dirilis ke `develop`.
> Melanjutkan `docs/RENCANA_SCANNER_CERDAS.md` bagian 11, langkah 4 sampai 6. Bila dua dokumen bertentangan, dokumen ini yang terbaru;
> tetap tanyakan Farrel bila ragu.

## 0. Untuk agen yang melanjutkan

1. Jalankan Protokol Agen di `KOLABORASI.md` bagian 0. Pemilik scanner: **Farrel** (wilayah `src/ml/`, `src/aksara/`, `src/features/scanner/`, `public/models/`).
2. Baca `CLAUDE.md` (aturan yang tidak boleh dilanggar), lalu dokumen ini, lalu `docs/RENCANA_SCANNER_CERDAS.md` bagian 11 bila butuh latar.
3. Kerja di cabang `feature/scanner-v4` dari `develop`. **`develop` = produksi Vercel**: merge berarti rilis. Merge hanya bila gerbang di bagian 7 lulus.
4. Kerjakan langkah berurutan dari bagian 5. Setiap langkah berdiri sendiri dan boleh dirilis sendiri bila lebih baik dari produksi.
5. Catat hasil setiap langkah di bagian 9 dokumen ini (tabel status) dan di `docs/EVALUASI.md`. Jangan mengarang angka.

### Protokol pembaruan (wajib untuk semua AI, apa pun mereknya)

Dokumen ini adalah **satu-satunya sumber kebenaran** untuk scanner. Tujuannya: Claude, Codex, Cursor, Gemini, atau manusia yang menggantikan
yang lain bisa langsung paham keadaan terakhir tanpa membaca percakapan. Karena itu:

| Kapan | Apa yang diperbarui | Di mana |
| --- | --- | --- |
| Awal sesi | Baca bagian 9 (papan) dan 11-12 (log); mulai dari "BERIKUTNYA" di log sesi terakhir | dokumen ini |
| Mulai sebuah langkah | Ubah status papan ke `[~]`, isi pemilik | bagian 9 |
| Ada angka ukuran baru | Tambah baris di tabel hasil dan di `docs/EVALUASI.md`, lengkap dengan perintah dan set uji | bagian 9 dan `docs/EVALUASI.md` |
| Farrel memutuskan sesuatu, atau ada temuan penting | Tambah satu baris di log keputusan (alasan + sumber) | bagian 11 |
| Rencana berubah | Ubah bagian 5 dan catat alasannya di bagian 11; jangan menghapus riwayat | bagian 5 dan 11 |
| Sebelum berhenti (selesai, kehabisan token, atau ganti AI) | Tambah entri log sesi: apa yang dikerjakan, apa yang belum terverifikasi, **perintah pertama untuk sesi berikutnya** | bagian 12 |
| Setelah merge ke `develop` | Satu baris di `KOLABORASI.md` bagian 8 (Log Farrel) dan ringkasan di `PROJECT_STATE.md` (pribadi) | keduanya |

Aturan format: log **append-only**, terbaru di bawah, satu baris per entri, tanggal ISO. Tulis angka dengan satuan dan set ujinya.
Tulis juga apa yang gagal (hasil negatif sama berharganya). Jangan menulis kunci API, kata sandi, atau jalur foto pengguna.
Pembaruan dokumen ikut dalam commit yang sama dengan perubahan kodenya.

## 1. Batasan yang sudah diputuskan Farrel

| Batasan | Arti praktis |
| --- | --- |
| Tenggat **Jumat 6 Nov 2026** untuk versi yang "bagus"; batas akhir Plan C tetap 5 Des 2026 | Urutan langkah disusun dari dampak terbesar per jam kerja |
| **Wajib buatan sendiri:** pengolahan citra, visi komputer, pembuatan/pelatihan model, pemrosesan data sebelum pelatihan | Semua langkah di bawah memakai kode dan model kita sendiri; bantuan luar hanya alat bantu data |
| **Tidak memakai penagihan Gemini** (5 Nov 2026) | Tidak ada API berbayar. Rencana ini tidak bergantung pada Gemini sama sekali |
| Bantuan luar boleh, tapi **bukan pembaca di aplikasi** dan **foto pengguna tidak keluar perangkat** | Model terbuka (mis. PP-OCRv5 Latin) boleh dipakai **di komputer kita** untuk membantu melabeli data latih |
| Tidak ada rahasia di repo; kunci Gemini yang pernah ditempel di chat harus di-*rotate* Farrel | Jangan menulis kunci apa pun ke berkas |
| Foto Set C, Commons, NusaAksara tidak di-commit | Semua data di `docs/random/` (gitignored) |

## 2. Keadaan sekarang (v3 di produksi)

Pipeline (`src/ml/model2/scan.ts`): grayscale → polaritas/deskew → **detektor PP-OCRv5 mobile** (640 px) → **klasifikator aksara** (CNN 79 ribu parameter, buang kotak bukan-Jawa) → gabung baris → **pembaca CRNN v2** (tinggi 64, CTC) → penilai TERIMA/RAGU/TOLAK.

| Ukuran (C-pengembangan, 15 foto) | Produksi lama | **v3 (sekarang)** |
| --- | --- | --- |
| Akurasi suku kata foto utuh | 11,2% | **32,6%** |
| Baris sampah pada keluaran | 55,6% | **10,0%** |
| Foto tanpa aksara ditolak | 12/13 | 12/13 |
| Recall baris Jawa | 3/11 | 6/11 |
| NusaAksara pemisahan (recall / presisi) | 82,8% / 86,9% | **91,5% / 96,6%** |
| Waktu di ponsel 8 inti | — | 10–11 dtk (det 2,2; baca 3,6 untuk 8 bacaan; ±3 dtk belum terurai) |

**Penghambat utama sekarang adalah pembaca, bukan detektor.** Buktinya:
- Detektor menemukan 10 dari 11 baris; empat hilang di tahap membaca atau menilai.
- Pada potongan tepat buatan tangan, pembaca v2 hanya benar sekitar separuh (8/14 dengan CER ≤ 0,33).
- Kesalahan terbanyak: **huruf cetak tebal** (hanacaraka papan), **font hias/relief**, tulisan terang di latar gelap, dan jarak huruf lebar.
- Pembaca v3 sintetis (percobaan 2 Nov) mencapai 93% di sintetis tetapi hanya 30% di potongan nyata, jadi **sintetis saja tidak cukup**.

**Yang tidak ada:** potongan foto nyata **bertranskripsi**. Kita punya 161 potongan Jawa dari 131 foto Commons (`docs/random/foto_nyata/`), tetapi labelnya hanya "Jawa/bukan", bukan teksnya. Itu yang harus dibuat tanpa Gemini.

## 3. Ide inti

Tiga tuas, semuanya buatan sendiri:

1. **Pengolahan citra saat membaca (tanpa latih ulang, paling cepat).** Banyak salah baca disebabkan ketebalan goresan dan kontras, bukan bentuk huruf. Normalisasi ketebalan goresan, ditambah beberapa varian potongan yang dipilih lewat keyakinan CTC, bisa menaikkan akurasi tanpa Colab.
2. **Mesin data: transkripsi tanpa API.**
   - Papan jalan di Yogyakarta dan Surakarta hampir selalu **dwibahasa**: tulisan Latin "JL. MALIOBORO" dan aksara Jawanya berisi kata yang sama.
   - Jadi Latin dibaca oleh model OCR Latin terbuka di laptop (atau diketik manusia, karena Latin mudah). Teks itu lalu diubah ke aksara oleh **transliterator Latin→Jawa buatan kita**, dan hasilnya **diverifikasi oleh pembaca kita sendiri** lewat skor CTC paksa.
   - Sisanya dilabeli lewat alat koreksi cepat: prediksi model sudah terisi, manusia tinggal membetulkan.
3. **Fine-tune pembaca CRNN v2** (arsitektur sama, jadi kode web tidak berubah) dengan campuran:
   - NusaAksara;
   - sintetis v4 yang lebih mirip papan (latar foto nyata, banyak font, goresan tebal);
   - potongan nyata hasil mesin data.

Ditambah **dekoder bahasa** (kamus nama tempat dan kata Jawa) untuk membetulkan salah baca kecil, dan pemangkasan waktu.

### Peta kebutuhan mata kuliah

| Kebutuhan | Komponen di rencana ini |
| --- | --- |
| Pengolahan citra | Normalisasi goresan (transformasi jarak, erosi/dilasi), CLAHE, binarisasi Sauvola, inpainting latar, deskew per baris, polaritas Otsu |
| Visi komputer | Detektor teks, klasifikator aksara, pembaca CRNN, pemasangan kotak Latin–Jawa secara geometris |
| Machine/deep learning | Fine-tune CRNN (CTC), *self-training*, dekoder beam + model bahasa karakter |
| Pemrosesan data | Mesin label (transliterasi, verifikasi CTC paksa, penyaringan), sintetis v4, pembagian data per foto agar tidak bocor, augmentasi |

## 4. Alat yang dipakai

| Alat | Untuk | Catatan |
| --- | --- | --- |
| Python lokal (`python -X utf8`, bukan `python3`) + onnxruntime, OpenCV, numpy | Bangku uji, mesin data, eksperimen pengolahan citra | Sudah terpasang dan terbukti jalan |
| Google Colab GPU gratis (Farrel menjalankan) | Fine-tune pembaca | Bila kuota habis: **Kaggle Notebooks** (GPU gratis sekitar 30 jam per minggu) |
| Notebook `docs/random/AksaraLens_Model2_v3.ipynb`, dibangun oleh `scripts/buat_notebook_v3.py` + `scripts/adegan_v3.py` | Generator sintetis dan sel latih | Dipakai ulang; v4 menambah sel, bukan menulis ulang |
| `latin_PP-OCRv5_mobile_rec` (ONNX, Apache-2.0, Hugging Face) | Membaca tulisan **Latin** papan untuk mesin data, hanya di laptop | Pembantu label, bukan pembaca aplikasi |
| Plugin Claude **huggingface-skills** (opsional) | Skill `huggingface-vision-trainer` dan `huggingface-datasets` untuk sel latih dan pengunduhan model | Pasang lewat katalog plugin claude.ai; tidak wajib |
| Bangku uji: `scripts/uji_set_c.py`, `scripts/uji_nusa.py`, `scripts/pipeline_cerdas.py` | Mengukur setiap perubahan | Lihat bagian 7 untuk cara memakai |

## 5. Langkah kerja

Urutan berdasarkan dampak per jam. **Jalur Jumat** = L1 sampai L4. L5 sampai L7 boleh setelah Jumat.

### L1. Pengolahan citra saat membaca (agen, 2–4 jam, tanpa Colab)

**Tujuan:** pembaca v2 yang sama membaca lebih banyak potongan dengan benar.

**Kerjakan dulu di Python** (`scripts/pipeline_cerdas.py`, fungsi `baca_dua_arah`), ukur, baru salin ke TS:
1. **Normalisasi ketebalan goresan.** Hitung lebar goresan median dari transformasi jarak (`cv2.distanceTransform`) pada tinta hasil Otsu, dinyatakan relatif terhadap tinggi baris. Bandingkan dengan nilai yang sama pada baris NusaAksara (data latih v2), lalu erosi atau dilasi dengan kernel kecil sampai mendekati nilai itu. Ini sasaran langsung untuk huruf cetak tebal.
2. **Varian kontras:** potongan asli, CLAHE (`clipLimit` 2, ubin 8), dan binarisasi Sauvola yang dihaluskan ringan.
3. **Pilih lewat keyakinan.** Baca semua varian, ambil keluaran dengan keyakinan CTC rata-rata tertinggi. Varian hanya untuk potongan yang belum TERIMA pada bacaan pertama, supaya waktu tidak membengkak.
4. **Tepi dan tinggi:** coba tambahan tepi 10–20% tinggi dan tinggi tinta 70–85% dari 64 px seperti data latih.

**Ukur:** C-pengembangan, potongan tepat (14 potongan tangan), dan NusaAksara. Laporkan per varian dan gabungan.
**Lulus:** akurasi foto utuh C-pengembangan naik **≥ 5 poin** dari 32,6%, NusaAksara tidak turun > 1 poin, jumlah bacaan per foto naik ≤ 2×.
**Lalu:** salin ke `src/ml/model2/gambar.ts` (fungsi murni + test Vitest) dan `scan.ts`; cek paritas pada 8 foto uji.
**Bila gagal:** simpan hanya varian yang terbukti membantu; catat hasil negatif.

### L2. Mesin data: transkripsi potongan nyata (agen 3 jam + Farrel/tim 1–2 jam)

**Tujuan:** 300 atau lebih potongan nyata bertranskripsi, tanpa API berbayar.

1. **Transliterator Latin→Jawa** `scripts/latin_ke_jawa.py` (logika murni, wajib test):
   - aturan suku kata: nglegena, sandhangan swara, pangkon akhir kata, cecak/layar/wignyan, pasangan untuk gugus konsonan, `dh`/`th`/`ny`/`ng`;
   - keluaran berupa Unicode Jawa dalam charset `scanner_charset.json`.
   - Uji dengan pasangan dari konten belajar (`src/content/`) dan contoh nama jalan.
   - Catat bahwa ejaan papan kadang mengikuti ejaan lama, sehingga hasilnya draf.
2. **Pasangkan kotak Latin–Jawa** di foto Commons:
   - Detektor PP memberi semua kotak; klasifikator memisahkan Jawa dan bukan.
   - Kotak Latin terdekat di atas atau bawah dengan lebar sebanding menjadi pasangannya (aturan geometri, buatan sendiri).
   - Tulisan Latin dibaca dengan `latin_PP-OCRv5_mobile_rec` di laptop. Bila gagal, Farrel mengetik Latin-nya.
3. **Verifikasi CTC paksa:** untuk setiap usulan label, hitung `-log P(label | potongan)` dengan pembaca v2, dinormalisasi per karakter.
   - Terima otomatis bila skor ≤ ambang (dipilih dari 30 sampel yang dicek manusia).
   - Selebihnya masuk antrean koreksi.
4. **Alat koreksi** `scripts/alat_label.html`, halaman lokal yang dibuka langsung di browser tanpa server:
   - menampilkan potongan, usulan label dalam aksara dan Latin, serta tombol terima/ubah/buang;
   - pengguna mengetik **Latin**, dan transliterator versi JS mengubahnya ke aksara;
   - mengekspor `label_teks.json`.
   - Siapa pun di tim yang bisa membaca aksara Jawa boleh mengoreksi.
5. **Tambah foto bila kurang dari 300 potongan:** jalankan `scripts/unduh_foto_nyata.py` dengan kategori Commons lain (papan jalan Yogyakarta/Surakarta, gapura, prasasti modern, spanduk). Set C dan set uji baru tidak boleh ikut.
6. **Bagi per foto sumber:** 85% latih, 15% validasi nyata.

**Lulus:** ≥ 300 potongan berlabel teks, 30 sampel acak dicek manusia, galat label ≤ 10%.
**Bila kurang:** tetap lanjut ke L4 dengan yang ada (≥ 150). Data nyata sedikit tetap membantu fine-tune (lihat bagian 11 `RENCANA_SCANNER_CERDAS.md`, Bharat Scene Text).

### L3. Sintetis v4 yang mirip papan (agen 2–3 jam, dijalankan di Colab bersama L4)

Tambahkan ke `scripts/adegan_v3.py` (jangan menulis ulang):
- **Latar nyata:** potongan latar dari foto Commons yang tulisan Latinnya dihapus dengan `cv2.inpaint` (masker = kotak detektor). Aksara dirender di atasnya dengan warna dan polaritas yang diambil dari latar itu.
- **Ketebalan goresan:** dilasi/erosi acak setelah render, agar ada huruf sangat tebal dan sangat tipis.
- **Font:** semua font Jawa berlisensi jelas yang ada di notebook. Tambah font OFL lain hanya bila lisensinya tercatat. Render dengan Pillow + raqm (jalan di Colab Linux; di Windows rendering Jawa Pillow rusak).
- **Jarak huruf lebar, relief** (emboss dengan bayangan arah), **perspektif**, blur gerak, silau, kompresi JPEG.
- **Teks:** nama tempat dan kata dari kamus L5, bukan hanya suku acak.

**Lulus:** 48 sampel dilihat dan tampak seperti potongan nyata. Simpan lembar kontaknya.

### L4. Fine-tune pembaca v4 (Farrel menjalankan Colab, ±1–2 jam GPU per putaran)

- **Mulai dari bobot CRNN v2**, dengan arsitektur, charset dan tinggi 64 tetap sama, sehingga `src/ml/model2/ctc.ts` dan kode web tidak berubah.
- **Campuran per batch** (titik awal): NusaAksara 35%, sintetis v4 35%, potongan nyata L2 30% (di-*oversample* dengan augmentasi).
  - Potongan nyata ikut melewati pra-proses L1 yang sama, supaya latih dan pakai konsisten.
- **Jadwal:** lr kecil (1e-4 hingga 3e-4) dengan *warmup*. Lapisan konvolusi bawah dibekukan pada 20% awal langkah. *Early stopping* pada validasi nyata.
- **Ekspor:** ONNX dengan nama masukan/keluaran sama seperti v2. Cek keluaran ONNX identik dengan PyTorch. Ukuran ≤ 10 MB.
- **Self-training (putaran 2, opsional):**
  - model v4 membaca potongan nyata tak berlabel;
  - yang keyakinannya tinggi **dan** lolos validitas tata aksara masuk data latih;
  - maksimal 2 putaran.
- **Maksimal 3 putaran Colab.** Setiap putaran membidik dua golongan kesalahan terbesar dari analisis kesalahan.
- **Lulus:**
  - potongan nyata validasi ≥ 70% suku kata, dan lebih baik dari v2;
  - NusaAksara ≥ 88%;
  - foto utuh C-pengembangan ≥ 45%.

### L5. Dekoder bahasa (agen, 3–4 jam, setelah Jumat bila waktu habis)

- **Kamus:**
  - nama jalan, kampung, dan tempat Yogyakarta/Surakarta (daftar publik, mis. OpenStreetMap, ODbL; atribusi dicatat);
  - kata dari Wikipedia bahasa Jawa (CC BY-SA), ditransliterasi lewat `latin_ke_jawa.py`;
  - kata dari konten belajar.
- **Model bahasa karakter** n-gram (n = 4) atas urutan aksara, berupa JSON kecil ≤ 500 KB.
- **Beam search CTC** (lebar 8) dengan bobot model bahasa, di `src/ml/model2/ctc.ts`: fungsi murni + test, versi Python disamakan.
- **Lulus:** foto utuh naik ≥ 3 poin tanpa menambah kata karangan pada foto negatif, dan waktu tambahan ≤ 100 ms per baris.

### L6. Waktu scan (agen, 2 jam)

- Uraikan ±3 dtk yang belum terhitung (dekode gambar, mode area, salinan kanvas) lewat `?debug`.
- Batasi bacaan: maksimal 6 kotak teratas menurut skor klasifikator, lalu varian L1 hanya untuk 2 kotak paling ragu.
- Coba `?ep=webgpu` pada ponsel yang mendukung.
- **Sasaran realistis:** ≤ 6 dtk di ponsel. Target ≤ 3 dtk di PRD baru mungkin dengan pembaca lebih kecil; catat sebagai pekerjaan lanjutan, jangan dipaksakan.

### L7. Set uji baru dan rilis (Farrel + agen)

- Minimal 40 foto baru yang belum pernah dilihat: 10 dari kamera ponsel lewat aplikasi, sisanya Commons di luar data latih. Kunci jawaban dibuat sekali, diukur **sekali** per kandidat rilis.
- Unggah model ke `models/v2` (bucket Supabase). `models/v1` tetap ada sebagai jalan kembali (`VITE_MODEL_URL`).
- Uji di URL preview Vercel dari ponsel: kamera, galeri, Atur area, foto tanpa aksara, login Google.

## 6. Jadwal

| Kapan | Apa | Siapa |
| --- | --- | --- |
| Kamis 5 Nov malam | L1 Python + ukur; L2 langkah 1–3 | Agen |
| Jumat 6 Nov pagi | L2 koreksi label (alat koreksi) dan L3 | Farrel/tim + agen |
| Jumat siang | L4 putaran 1 di Colab; L1 masuk TS | Farrel + agen |
| Jumat sore | Gerbang bagian 7; rilis bila lulus | Agen, uji ponsel Farrel |
| Setelah Jumat | L4 putaran 2–3, L5, L6, L7 | Siapa pun dengan rencana ini |

Bila hanya L1 yang selesai pada Jumat, itu pun dirilis bila lulus gerbang. Produksi saat ini (v3) sudah menjadi Plan C yang layak.

## 7. Gerbang rilis dan cara mengukur

Perintah (dari root repo):

```bash
npm test
npm run typecheck
npm run build
python -X utf8 scripts/uji_set_c.py      # C-pengembangan; C-uji hanya di gerbang akhir
python -X utf8 scripts/uji_nusa.py       # penjaga regresi buku
```

- Skrip uji memakai `scripts/rujukan_scanner.py`. Untuk mencoba detektor/klasifikator/pembaca lain tanpa mengubah skrip, timpa fungsinya lewat pembungkus (pola `ruj.kotak_detektor = f`, lihat contoh di bagian 10).
- Setelah `npm run build`, kembalikan `public/assets_list.json` dan `public/uiux_list.json` (berkas hasil build) dengan `git checkout --` sebelum commit.

| Gerbang | Syarat merge ke `develop` |
| --- | --- |
| Lebih baik dari produksi | Akurasi foto utuh C-pengembangan > 32,6% dan baris sampah ≤ 10% |
| Penolakan | Foto tanpa aksara ditolak ≥ 12/13 |
| Penjaga buku | NusaAksara pemisahan dan presisi turun ≤ 1 poin dari 91,5% / 96,6% |
| Teknis | Test (kecuali `soal.test.ts` milik Emil yang sudah gagal sebelumnya), typecheck, build lulus; paritas Python–web pada 8 foto |
| Ponsel | Farrel mencoba preview: tidak macet, waktu tercatat |

Target akhir tetap dari `RENCANA_SCANNER_CERDAS.md` bagian 10. **Minimum rilis:** suku kata ≥ 60%, foto CER ≤ 0,2 ≥ 40%. Target Jumat yang realistis: **45–55%** suku kata foto utuh. Bila hanya font hias yang menghalangi, usulkan pengecualian berbukti ke Farrel.

## 8. Risiko dan jalan keluar

| Risiko | Jalan keluar |
| --- | --- |
| Pasangan Latin–Jawa sedikit (banyak foto hanya aksara) | Alat koreksi manusia dengan prediksi terisi; *self-training* L4 |
| Transliterator salah pada ejaan papan lama | Verifikasi CTC paksa menyaring, sampel dicek manusia, label meragukan dibuang |
| Fine-tune merusak buku (lupa) | NusaAksara 35% di setiap batch, gerbang penjaga |
| Kuota Colab habis | Kaggle Notebooks; atau pakai bobot terbaik yang ada |
| Varian L1 memperlambat | Hanya untuk potongan RAGU, batas jumlah kotak (L6) |
| Angka bergoyang karena sampel kecil (15 foto) | Laporkan jumlah foto; keputusan yang bergantung 1–2 foto ditunda sampai set uji L7 |
| Waktu ≤ 3 dtk tidak tercapai | Laporkan jujur, sasaran ≤ 6 dtk, pembaca kecil sebagai pekerjaan lanjutan |

**Plan C (sudah aktif di produksi):** v3 dengan cakupan jujur, yaitu cetak bersih dan papan jelas didukung, font hias belum. Ditambah bingkai terpandu (Atur area). Setiap langkah di atas hanya menambah.

**Tidak dipakai:** API berbayar, LLM yang menerima foto pengguna, scan live (non-goal PRD).

## 9. Papan progres

Legenda: `[ ]` belum · `[~]` dikerjakan · `[x]` selesai dan terverifikasi · `[!]` terblokir (tulis sebabnya di kolom catatan).

| ID | Langkah | Status | Pemilik | Hasil / bukti | Catatan |
| --- | --- | --- | --- | --- | --- |
| V3 | Detektor PP-OCRv5 + klasifikator aksara dirilis | `[x]` | Farrel + agen | PR #23, 5 Nov 2026. Suku kata foto utuh 11,2% → 32,6% | Lihat bagian 2 |
| L1a | Normalisasi ketebalan goresan (Python, ukur) | `[x]` | agen | **Tidak membantu**: 24,7% vs 22,5% di 640, dan 30,3% vs 33,7% bila bersama eskalasi (Cp, 12 foto) | Median goresan Nusa 3,6 px (p10-p90 2,8-4,6), foto nyata 3,2 px (p10-p90 2,1-6,4). `scripts/olah_goresan.py` |
| L1b | Varian kontras (CLAHE, Sauvola) + pilih lewat keyakinan | `[x]` | agen | **Tidak membantu**: CLAHE 31,5%, Sauvola 32,6% vs eskalasi saja 33,7%; Sauvola menurunkan penolakan negatif ke 10/13 | Tidak dipasang ke TS |
| L1c | Eskalasi resolusi detektor 640 -> 960 bila ada kotak Jawa tetapi belum ada baris TERIMA (`saring.ts`, `scan.ts`) | `[x]` | agen | Cp suku kata 22,5% -> **33,7%**, sampah 8,3%, negatif 12/13; test dan typecheck lulus | Dirilis: PR #26 digabung ke `develop` 5 Nov 2026 atas persetujuan Farrel. Waktu ponsel dengan eskalasi dan paritas browser vs Python belum diukur |
| L2a | Transliterator Latin→Jawa (`scripts/latin_ke_jawa.py`) + test | `[x]` | agen | 8 test lulus (`python -X utf8 -m unittest scripts/test_latin_ke_jawa.py`), termasuk 3 contoh demo aplikasi; keluaran hanya karakter charset | 'e' polos: pepet bila bukan suku akhir, taling bila akhir; huruf asing (f v z q x kh sy) dipetakan dan ditandai diragukan; tanpa spasi; cakra/pengkal tidak ada di charset (dipakai pangkon+konsonan) |
| L2b | Pasangan kotak Latin-Jawa + baca Latin offline | `[x]` | agen | `scripts/pasang_latin_jawa.py` pada 131 foto: 505 kotak Jawa, **113** berpasangan dengan Latin dan punya draf aksara (105 foto) | Butuh `docs/random/latin_rec/latin.onnx` + `latin.yml` (Hugging Face PaddlePaddle/latin_PP-OCRv5_mobile_rec_onnx) |
| L2c | Verifikasi CTC paksa + antrean koreksi | `[x]` | agen | Latin yakin ≥ 0,9 dan CTC ≤ 6: **43** draf; CTC ≤ 3: hanya **4** (LOKET, BAKPIA KUKUS, ASURANSI JASINDO, JL. ABU BAKAR ALI) | **Hasil negatif**: pembaca v2 terlalu lemah untuk memverifikasi (JL. MALIOBORO yang benar pun 5,2/karakter). CTC hanya dipakai untuk mengurutkan antrean, bukan menerima otomatis |
| L2d | Alat koreksi (`scripts/alat_label.html`) + koreksi manusia (≥ 150 potongan, target 300) | `[~]` | Farrel/tim | Alat siap; JS dan Python cocok 30/30 (`scripts/cocok_latin_ke_jawa.py`). Koreksi manusia belum dimulai | Jalankan: `python -m http.server 8000` di akar repo, buka `http://localhost:8000/scripts/alat_label.html`, unduh `label_teks.json`, simpan di `docs/random/foto_nyata/` |
| L3 | Sintetis v4 (latar nyata, goresan tebal, relief) + lembar kontak | `[ ]` | | | |
| L4a | Fine-tune pembaca v4, putaran 1 (Colab/Kaggle) | `[ ]` | Farrel menjalankan | | |
| L4b | Putaran 2-3 / self-training | `[ ]` | | | |
| L5 | Dekoder bahasa (kamus + n-gram + beam search) | `[ ]` | | | |
| L6 | Waktu scan (uraikan ±3 dtk, batas kotak, WebGPU) | `[ ]` | | | |
| L7 | Set uji baru ≥ 40 foto, ukur sekali, rilis `models/v2` | `[ ]` | Farrel + agen | | |

### Tabel hasil terukur

Satu baris per pengukuran. Set uji: **Cp** = C-pengembangan (15 foto), **N** = NusaAksara. Jangan menimpa baris lama.

| Tanggal | Susunan | Suku kata foto utuh (Cp) | Sampah | Negatif ditolak | NusaAksara (recall / presisi) | Waktu | Perintah / catatan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-04 | Produksi lama (U-Net) | 11,2% | 55,6% | 12/13 | 82,8% / 86,9% | 0,7 dtk (laptop) | `scripts/uji_set_c.py` |
| 2026-11-04 | PP det tanpa saringan | 44,9% | 45,5% | 8/13 | 80,0% / 50,8% | 0,9 dtk | |
| 2026-11-04 | v3 pada detektor **960 px** | 32,6% | 10,0% | 12/13 | belum | 4,0 dtk laptop | `PANJANG=960 python -X utf8 scripts/bangku_v3.py uji_set_c.py` (mereproduksi angka 4 Nov persis) |
| 2026-11-05 | **v3 pada 640 px = yang sebenarnya di produksi** | **22,5%** | 0% | 13/13 | 92,1% / 97,2% | 2,0 dtk laptop; 10-11 dtk ponsel | `python -X utf8 scripts/bangku_v3.py uji_set_c.py`. Koreksi: angka 32,6% di atas diukur pada 960 px |
| 2026-11-05 | 640 + goresan (target 3,6) | 24,7% | 0% | 13/13 | | | `VARIAN=goresan TARGET_GORESAN=3.6` |
| 2026-11-05 | 640 + eskalasi 960 bila belum ada TERIMA (semua foto) | 33,7% | 8,3% | 12/13 | | 12 dtk laptop (diukur paralel, abaikan) | `ESKALASI=terima` |
| 2026-11-05 | 640 + eskalasi + goresan / CLAHE / Sauvola | 30,3% / 31,5% / 32,6% | 9,1% / 15,4% / 21,4% | 12/13, 11/13, 10/13 | | | `ESKALASI=terima VARIAN=...` |
| 2026-11-05 | **640 + eskalasi hanya bila ada kotak Jawa (`ESKALASI=ada`) = kandidat L1c** | **33,7%** | 8,3% | 12/13 | tidak berubah (jalur pemisahan baris tidak memakai eskalasi) | 4,8 dtk laptop | sama dengan di TS |

## 10. Prompt siap tempel untuk AI lain

> Kamu melanjutkan scanner aksara Jawa AksaraLens. Repo: `C:\laragon\www\AksaraLens`, cabang `feature/scanner-v4` dari `develop`.
> Baca `CLAUDE.md`, `KOLABORASI.md` bagian 0 (aku Farrel), lalu `docs/RENCANA_SCANNER_FINAL.md`.
> Kerjakan langkah pertama di bagian 9 yang statusnya "Belum", ukur dengan perintah di bagian 7, isi tabel status dengan angka nyata,
> lalu buat PR ke `develop`. Merge hanya bila semua gerbang bagian 7 lulus. Jangan memakai API berbayar, jangan mengirim foto pengguna keluar
> perangkat, jangan commit data di `docs/random/`.

Contoh pembungkus untuk mencoba komponen baru di bangku uji tanpa mengubah skrip:

```python
import sys, runpy
sys.path.insert(0, 'scripts')
import rujukan_scanner as ruj, pipeline_cerdas as cerdas
asli = cerdas.baca_potongan
def baca_varian(c):
    # contoh L1: coba beberapa varian, ambil keyakinan tertinggi
    return max((asli(v) for v in [c, ...]), key=lambda r: r[1])
cerdas.baca_potongan = baca_varian
sys.argv = ['uji_set_c.py']
runpy.run_path('scripts/uji_set_c.py', run_name='__main__')
```

## 11. Log keputusan dan diskusi

Append-only. Format: `tanggal · siapa · keputusan atau temuan · alasan / sumber`

- 2026-10-29 · Farrel · scanner hanya membaca aksara Jawa, utuh dan berurutan, dan jujur saat ragu · tujuan produk (`docs/PRD.md`)
- 2026-11-02 · Farrel · perubahan arsitektur disetujui, model pihak lain boleh dipakai, target boleh turun sedikit bila terbukti perlu; foto tetap tidak keluar perangkat · v3 sintetis gagal gerbang (sintetis 93%, nyata 30%)
- 2026-11-04 · agen · detektor U-Net diganti PP-OCRv5 mobile (4,8 MB, Apache-2.0); klasifikator aksara 79 ribu parameter menyaring kotak · bangku uji: sampah 55,6% → 10%, NusaAksara 91,5%/96,6%
- 2026-11-04 · agen · resolusi detektor 640 px dipilih (sapuan resolusi bergoyang karena sampel kecil) · NusaAksara 92,1%/97,2% di 640
- 2026-11-04 · agen · kuantisasi int8 pembaca ditolak · ukuran 8,2 → 4,9 MB dan keluaran cocok, tetapi lebih lambat di CPU desktop
- 2026-11-05 · Farrel · **tenggat scanner Jumat 6 Nov 2026**, karena token mingguan hampir habis
- 2026-11-05 · Farrel · pengolahan citra, pembuatan model, dan pemrosesan data wajib buatan sendiri (kebutuhan mata kuliah); bantuan luar boleh sebagai pembantu data/citra, tidak harus membaca aksara
- 2026-11-05 · agen · uji Gemini tidak terukur: model 2.5 tidak tersedia untuk akun baru, kuota gratis habis (429); riset NusaAksara menunjukkan Gemini lama gagal di aksara Jawa · `scripts/uji_gemini.py`
- 2026-11-05 · Farrel · **tidak memakai penagihan Gemini**; rencana tidak boleh bergantung pada API berbayar · kunci Gemini yang sempat tertempel di chat harus di-rotate
- 2026-11-05 · Farrel · login Google dicek aman di preview v3, PR #23 digabung ke `develop` (rilis produksi)
- 2026-11-05 · agen · penghambat utama kini pembaca, bukan detektor (detektor menemukan 10 dari 11 baris; potongan tepat hanya 8/14 benar) · bagian 2
- 2026-11-05 · agen · label teks nyata dibuat lewat pasangan papan dwibahasa Latin-Jawa + transliterator buatan sendiri + verifikasi CTC paksa, bukan API · bagian 3
- 2026-11-05 · Farrel · PR #26 (eskalasi resolusi L1c) digabung ke `develop` tanpa menunggu ukuran waktu ponsel · risiko waktu +5-6 dtk di foto sulit diterima, akan diukur lewat `?debug`
- 2026-11-05 · agen · **mesin data otomatis tidak cukup**: dari 131 foto hanya 113 kotak Jawa yang punya pasangan Latin, 43 yang cukup meyakinkan, 4 yang lolos verifikasi ketat. Target 300 potongan berlabel butuh pelabelan manusia (alat L2d) dan sintetis L3 · papan dwibahasa ternyata minoritas; banyak foto hanya aksara atau Latin terpotong
- 2026-11-05 · Farrel · dokumen ini menjadi sumber kebenaran lintas AI dan harus diperbarui oleh AI mana pun yang bekerja · aturan di `AGENTS.md` bagian 13 dan `CLAUDE.md`

- 2026-11-05 · agen · **koreksi baseline**: produksi memakai detektor 640 px, dan di bangku uji itu 22,5% suku kata (bukan 32,6%; angka itu diukur pada 960 px). Bangku uji kini ada di repo: `scripts/bangku_v3.py` · mereproduksi 32,6% persis pada `PANJANG=960`
- 2026-11-05 · agen · pengolahan citra saat membaca (ketebalan goresan, CLAHE, Sauvola) **tidak membantu** pembaca v2 di Cp (12 foto); yang berhasil hanya menaikkan resolusi detektor ke 960 bila 640 belum menghasilkan baris TERIMA · penghambat ada di pembaca (data), konsisten dengan bagian 2. Sampel kecil: 1 foto = 8 poin

## 12. Log sesi (serah-terima antar AI)

Append-only. Satu entri per sesi kerja. Format: `tanggal · AI/pengguna · dikerjakan · belum terverifikasi · BERIKUTNYA: perintah pertama`

- 2026-11-05 · Claude + Farrel · merge v3 (PR #23); menulis rencana ini (PR #24); menambah protokol pembaruan dan papan progres · tidak ada kode scanner yang berubah sejak v3; waktu v3 di ponsel 10-11 dtk, belum ada ukuran baru · BERIKUTNYA: mulai L1a. Buat cabang dari `develop`, salin pola pembungkus di bagian 10, ukur ketebalan goresan baris NusaAksara dan potongan Cp lewat `cv2.distanceTransform`
- 2026-11-05 · Claude · L2b, L2c selesai dan L2d alatnya siap (`scripts/pasang_latin_jawa.py`, `scripts/alat_label.html`, `scripts/latin_ke_jawa.mjs`) · belum ada label manusia; kualitas draf hanya diperiksa lewat angka, bukan dilihat satu per satu · BERIKUTNYA: Farrel/tim mengisi label di alat L2d (sasaran ≥ 150, 15 menit pertama cukup untuk melihat mutu draf). Sementara itu agen mengerjakan L3 (sintetis v4 di `scripts/adegan_v3.py`: latar nyata via `cv2.inpaint` dari kotak PP, goresan tebal/tipis, relief) lalu menyusun sel latih v4 di `scripts/buat_notebook_v3.py`
- 2026-11-05 · Claude · L2a selesai (`scripts/latin_ke_jawa.py` + 8 test); L1c sudah di `develop` (PR #26) · tidak ada pengukuran ke ponsel · BERIKUTNYA: L2b. Tulis `scripts/pasang_latin_jawa.py`: untuk tiap foto di `docs/random/foto_nyata/foto`, ambil kotak PP (`bangku_v3.kotak_pp`), pisahkan Jawa/bukan dengan klasifikator, pasangkan kotak Latin terdekat di atas/bawah, baca Latin dengan `latin_PP-OCRv5_mobile_rec` (ada di folder ppdet scratchpad lama; unduh ulang dari Hugging Face PaddlePaddle/latin_PP-OCRv5_mobile_rec_onnx bila hilang), simpan usulan label lewat `ke_jawa`
- 2026-11-05 · Claude + Farrel · L1 selesai di bangku uji: bangku `scripts/bangku_v3.py`, `scripts/olah_goresan.py`; eskalasi resolusi dipasang di `scan.ts`/`saring.ts`/`detektorPP.ts` (cabang `feature/scanner-l1`, PR dibuka, belum merge) · belum terverifikasi: waktu di ponsel dengan eskalasi (foto sulit bisa +5-6 dtk) dan paritas browser vs Python · BERIKUTNYA: Farrel menguji preview PR L1 di ponsel (waktu foto sulit dan foto tanpa aksara). Bila waktu dapat diterima, merge. Lalu mulai L2a: tulis `scripts/latin_ke_jawa.py` dengan test

## Rujukan

Rujukan riset ada di `docs/RENCANA_SCANNER_CERDAS.md` bagian 11 (NusaAksara, Bharat Scene Text, PSMC, SynthTIGER, PP-OCRv5). Tambahan:
- Sauvola & Pietikäinen (2000), binarisasi dokumen adaptif.
- Shi dkk. (2016), CRNN + CTC; beam search CTC dengan model bahasa (Graves 2006, Hannun dkk. 2014).
- Bharat Scene Text: fine-tune dengan data nyata menaikkan WRR PARSeq dari 0,47 (sintetis saja) ke 0,73, dasar L2 dan L4.
