# Riset dan Rencana Akhir Scanner (18–28 Nov 2026)

> Ditulis 18 Nov 2026 oleh Claude atas permintaan Farrel, setelah B2 putaran 2 diukur.
> Melengkapi `docs/RENCANA_SCANNER_FINAL.md` (tetap sumber kebenaran; papan dan log ada di sana).
> Tenggat yang dipakai: **Sabtu 28 Nov 2026** (kata Farrel, 18 Nov). PRD masih menulis 23 Nov.

## 1. Ringkasan

- **B2 ronde 2 tidak terbukti lebih baik atau lebih buruk dari ronde 1 di Set C.** Semua selisih di Cp hanya 1 foto. Selisih CER per foto rata-rata −0,056, dengan interval bootstrap 95% dari −0,165 sampai +0,023 (melewati nol).
- **Di set yang lebih besar, ronde 2 konsisten sedikit lebih baik.** v4 val (400 baris) naik dari 69,1% ke 73,4%. Nusa uji (69 baris) naik dari 90,9% ke 93,0% akurasi baris, dan dari 93,0% ke 94,0% suku kata.
- **Masalah penolakan ronde 2 kemungkinan besar soal ambang, bukan model.** Foto negatif N07 lolos karena satu baris berkeyakinan 0,76, padahal ambang RAGU 0,75.
- **Literatur mengatakan keyakinan yang kita pakai memang lemah untuk menolak.** Kita memakai rata-rata peluang maksimum per frame CTC. Ukuran ini terkenal terlalu yakin, dengan AUC sekitar 0,5 untuk memisahkan bacaan benar dan salah. Rasio peluang dua bacaan teratas atau prediktor galat terlatih mencapai AUC 0,91–0,99.
- **Penghambat terbesar menuju demo bukan akurasi model.** Aplikasi web masih memakai pembaca CRNN v2. Semua kenaikan B2 sejak 7 Nov belum sampai ke pengguna.

## 2. Bukti dari uji rinci per foto (Cp, 18 Nov)

Susunan: detektor 640 px dengan eskalasi 960 (`ESKALASI=terima`), klasifikator bersih, pembaca int8 QDQ. Perintah:
`PEMBACA=<onnx> ESKALASI=terima python -X utf8 scripts/bangku_v3.py uji_set_c.py --rinci --json <keluaran>`.

| Foto | Jenis | CER r1 | CER r2 | Penyebab utama |
| --- | --- | --- | --- | --- |
| C01, C03, C07 | adegan | 0,00 | 0,00 | — |
| C19 | adegan | 0,15 | 0,00 | cecak hilang dan wulu jadi pepet (r1) |
| C25 | rapat | 0,10 | 0,20 | taling-tarung terbaca taling |
| C09 | adegan | 0,30 | 0,20 | pa/sa, pepet/wulu |
| C22 | rapat | 0,30 | 0,30 | da jadi dha di kedua model; pepet hilang (r1) atau jadi wulu (r2) |
| C11 | rapat, font hias | 1,00 | 0,43 | r1 tidak membaca apa pun; r2 terbaca sebagian |
| C13 | adegan | 0,81 | 0,74 | baris hanacaraka panjang, hanya sebagian terbaca |
| C05, C06 | adegan | 0,88 / 1,00 | 1,00 / 1,00 | font hias (papan yang sama) |
| C28 | rapat | 1,00 | 1,00 | **urutan baris**: kedua potongan terbaca hampir benar, tetapi urutannya terbalik dan bertumpuk |

Pelajaran dari tabel:

- **C28 adalah masalah pipeline, bukan pembaca.** Memperbaiki penggabungan kotak yang bertumpuk pada baris yang sama, lalu mengurutkannya kiri ke kanan, bisa mengubah 1 foto (8 poin). Perbaikan harus berupa aturan umum ber-test, bukan tambalan untuk satu foto.
- **Kesalahan baca berulang di pasangan huruf yang mirip:** da/dha, pepet/wulu, taling/taling-tarung. Panduan PaddleOCR menyarankan data sintetis terarah untuk karakter yang sering salah, dengan rasio data asli : baru 10:1 sampai 5:1.
- **Font hias (C05, C06, C11) hampir selalu gagal**; hanya r2 yang membaca sebagian C11. Sesuai PRD, font sangat dekoratif di luar cakupan "aksara cetak".
- **Negatif:** N01 gagal di kedua model (foto padat tulisan non-Jawa). N07 gagal di r2 karena satu baris RAGU berkeyakinan 0,76.

## 3. Temuan riset dan artinya untuk kita

| Temuan | Sumber | Arti untuk AksaraLens |
| --- | --- | --- |
| Model pengenal teks adegan konsisten **terlalu yakin**. Kalibrasi skala suhu menurunkan ECE rata-rata dari 5,98 ke 1,75. Keyakinan kata paling baik dihitung sebagai hasil kali keyakinan per langkah | Slossberg dkk. 2020, *On Calibration of Scene-Text Recognition Models* | Ambang tetap 0,85/0,75 yang disetel untuk v2 tidak bisa dibawa ke B2. Keyakinan harus dikalibrasi ulang per model |
| Peluang CTC mentah buruk untuk menolak (AUC 0,46–0,54). **Rasio peluang dua bacaan teratas** (1 − p₂/p₁) mencapai AUC 0,91–0,97, dan prediktor galat terlatih 0,79–0,998 | *Confidence Prediction for Lexicon-Free OCR* (arXiv 1805.11161) | Ganti `yakin` = rata-rata peluang maksimum dengan **verifikator kecil** (regresi logistik) berfitur margin top-2 dari beam L5 yang sudah ada, peluang minimum per huruf, validitas, panjang, dan skor klasifikator. Dilatih di data di luar Set C |
| Pada aksara yang tidak dikenal, model cenderung **berhalusinasi** huruf dari aksara mirip. Hanya 6% keluaran yang kosong. Aksara Jawa mendapat 0 di semua model besar, termasuk Gemini | GlotOCR Bench (arXiv 2604.12978) | Penolakan harus aktif, bukan berharap model diam. Ini juga dalil kuat di jurnal mengapa model sendiri perlu |
| NusaAksara: PP-OCRv3 fine-tune, GPT-4o, dan Gemini semuanya **CER > 1** untuk aksara Jawa | NusaAksara, ACL 2025 (arXiv 2502.18148) | Pembaca B2 kita (94% suku kata di Nusa uji) jauh di atas pembanding yang dilaporkan. Layak masuk jurnal dengan catatan beda set uji |
| Data nyata paling menentukan. Sintetis saja maksimal 87,9%; tujuh susunan yang memakai data nyata mencapai 95–96%. CRNN kecil setara VLM 11B bila ada data nyata. Ensembel + kamus memangkas galat 28 → 13 | Manchu, arXiv 2609.11495 | Baris Wikisource (cetak nyata) adalah arah yang benar. Gabungan r1+r2 (ensembel) mungkin membantu, tetapi menggandakan waktu dan ukuran |
| Fine-tune pada data adegan nyata menaikkan WRR PARSeq rata-rata 0,47 → 0,73, dengan hanya 2–15 ribu kata nyata per bahasa | Bharat Scene Text (arXiv 2511.23071) | Foto papan nyata masih yang paling langka bagi kita. Tim tidak mengumpulkan foto lagi, jadi plafon akurasi foto tetap terbatas |
| Keragaman lebih penting dari jumlah: pada 600 ribu sampel, 1.000 klaster mencapai 64,0% dan 200 klaster 58,6%. Sampel berkeyakinan sedang (0,95–0,97) paling berguna; label 80% benar hanya menurunkan 1,3 poin | PP-OCRv5 (arXiv 2603.24373) | Saat menambah data, utamakan ragam (buku, font, latar) daripada jumlah. Label Wikisource yang sedikit berisik tidak masalah |
| Fine-tune pengenal: ≥ 5.000 sampel bila kamus tetap. Laju belajar untuk bs 64 dengan model pra-latih ≈ 5e-5 → 1e-5 (bs 128 ≈ 1e-4). Ganti kamus membuat akurasi mulai dari 0. Kumpulkan *badcase* lalu ulangi | Dokumentasi fine-tune PaddleOCR | B2 dilatih dengan lr **3e-4 pada bs 32**, kira-kira 10× di atas panduan, dan cabang GTC/NRTR tetap aktif. Belum pernah dibandingkan. Ini kandidat B2r3, bukan kesalahan yang terbukti |
| Kerangka OCR aksara baru (Kashmiri): kegagalan perenderan bisa diam (0,3% tinta, CER 92,5%), dan ada 6 artefak ukur (angka lama, checkpoint salah, pustaka hilang). Angka hanya diterima setelah gambar masukan dicek dan CER dihitung ulang dari teks mentah. Gerbang "CER oracle ≤ 15% sebelum detektor ditambahkan" | arXiv 2611.00078 | Persis pola kesalahan kita (angka 32,6% vs 22,5%, kebocoran Set C). Pakai gerbang yang sama: setiap angka disertai perintah dan sampel keluaran yang dicek |
| Perbandingan model pada set kecil wajib memakai interval bootstrap berpasangan. Selisih JOINT vs SEQ 0,3–1,6 poin dinyatakan tidak meyakinkan karena intervalnya melewati nol | Manchu, arXiv 2609.11495 | Semua keputusan berikutnya disertai interval. Selisih 1 foto di Cp tidak dipakai untuk memutuskan |
| Transkribus punya model "Javanese model v0.1" (PyLaia) dari Wikimedia: 3.416 baris, CER validasi 6,06% | transkribus.org | Data Wikisource Jawa terbukti cukup untuk HTR buku. Pembanding yang baik untuk jurnal |

**Reddit dan X:** pencarian lewat alat yang tersedia tidak menemukan utas Reddit atau X yang bisa dibaca (Reddit tidak bisa dibuka dari sini). Pengalaman praktisi diambil dari diskusi GitHub PaddleOCR. Diskusi #13897: akurasi mulai dari 0 setelah kamus diganti itu wajar, tetapi tidak boleh bertahan lama; ganti kamus butuh jauh lebih banyak data. Diskusi #14927: akurasi turun setelah ekspor biasanya karena praproses atau kamus beda antara latih dan inferensi. Yang kedua relevan untuk integrasi web: paritas Python–web wajib dicek.

## 4. Pelajaran dari kesalahan sebelumnya (aturan baru)

| # | Kesalahan | Akibat | Aturan mulai sekarang |
| --- | --- | --- | --- |
| 1 | Baseline diukur di susunan yang salah (960 px, padahal produksi 640) | Melaporkan 32,6% padahal 22,5% | Setiap angka ditulis bersama perintah lengkapnya, dan baseline diukur ulang di bangku yang sama sebelum dibandingkan |
| 2 | Pemeriksa judul Commons tidak menormalkan spasi/garis bawah | 22 dari 28 foto Set C bocor ke data latih; v4 putaran 1 tidak sah | Setiap set data baru melewati penjaga `scripts/set_c.py`. Sebelum melatih, cek hash/judul terhadap Set C dan halaman uji Nusa |
| 3 | Label sintetis v4 tidak lengkap dan halaman uji ikut | Gerbang Nusa terlalu optimis | Lembar kontak dan cek pembagian sebelum unggah ke Colab |
| 4 | Memutuskan dari selisih 1 foto di Cp (12 foto) | Keputusan 640/960, L1, v4c, dan klaim "naik 8 poin" B2r2 rapuh | **Interval bootstrap berpasangan wajib.** Selisih yang intervalnya melewati nol disebut "setara" |
| 5 | Ambang disetel di Cp lalu dipakai ulang untuk model lain | Overfit ke 12 foto; penolakan r2 turun karena satu baris 0,76 | Ambang dikalibrasi per model di data kalibrasi di luar Set C. Cp hanya untuk cek, C-uji hanya sekali |
| 6 | Keyakinan = rata-rata peluang maksimum CTC | Lemah untuk menolak (literatur: AUC ≈ 0,5) | Verifikator terkalibrasi (bagian 5, langkah 3) |
| 7 | Mencoba cara yang menurut literatur kecil peluangnya: varian pengolahan citra, verifikasi CTC paksa dengan pembaca lemah, rencana Gemini tanpa cek akses | ±1,5 hari kerja tanpa hasil | Sebelum mengerjakan, tulis satu kalimat bukti dari literatur atau uji kecil (≤ 1 jam) sebagai prasyarat |
| 8 | Model makin baik di laptop, tetapi tidak dipasang ke web sejak 7 Nov | Demo masih memakai v2 | **Jalur kirim dulu**: integrasi web sebelum eksperimen model berikutnya |
| 9 | Operasional: runtime Colab putus saat panel ditutup; berkas model kurang saat uji; folder `models/v2` belum ada saat dinyatakan selesai; instruksi bucket membingungkan | Waktu dan token terbuang | Checklist sebelum jalan: pane tetap terbuka (ingatkan pengguna), semua berkas model ada, URL model produksi dicek dengan `curl -I` sebelum menyatakan selesai |
| 10 | Mengubah set validasi antarronde (r2 menambah wiki) | val acc 0,53 vs 0,54 tidak sebanding | Bandingkan hanya pada set yang identik (v4 val, Nusa uji) |
| 12 | Saat menyusun rencana ini, aku hampir menjadwalkan ulang integrasi B2 ke web padahal kodenya sudah ada di cabang `feature/pembaca-b2` sejak 7 Nov | Rencana bisa menghabiskan 1 hari untuk pekerjaan yang sudah selesai | Sebelum merencanakan, cek cabang remote (`git ls-remote --heads origin`) dan PR terbuka, bukan hanya log dokumen |
| 11 | Hiperparameter fine-tune (lr 3e-4 bs 32, GTC aktif) tidak dicek terhadap panduan PaddleOCR | Belum tahu ruginya | Bila ada B2r3, lr mengikuti panduan dan dicatat sebagai satu-satunya perubahan |

## 5. Rencana 18–28 Nov

Prinsip: **jalur kirim dulu, eksperimen belakangan.** Setiap langkah punya gerbang yang ditulis sebelum hasilnya dilihat.

| Tanggal | Langkah | Siapa | Gerbang / hasil |
| --- | --- | --- | --- |
| Rab 18 | Riset, rencana ini, keputusan D1–D5 | Claude, Farrel | Farrel menjawab D1–D5 |
| Kam 19 | **L-A. Pembaca B2 di web.** Kodenya **sudah ada** di cabang `feature/pembaca-b2` (commit 133d582, 7 Nov, belum di-merge): `pembacaB2.ts` + test fixture, resize identik cv2, B2 selalu di WASM. Kerjanya: rebase ke `develop` terbaru (PR #47), tambah sakelar kembali ke v2, ganti model ke versi yang menang di D2 dengan **nama baru** di `models/v2` (v1 tidak disentuh) | Claude | Paritas Python–web: teks sama di ≥ 11/12 foto Cp. Waktu di browser laptop dicatat. typecheck, test, dan build lulus |
| Kam 19–Jum 20 | **L-B. Set evaluasi besar di luar Set C + statistik.** `scripts/statistik_uji.py` (bootstrap berpasangan). Positif: v4 val 400, wiki val 394, Nusa uji 69, potongan nyata val. Negatif: potongan non-Jawa dan latar dari foto Commons yang lolos penjaga Set C | Claude | Aturan pilih r1/r2 ditulis **sebelum** diukur (D2) |
| Jum 20–Sab 21 | **L-C. Verifikator keyakinan.** Fitur: rata-rata dan minimum peluang per huruf, margin top-2 dari beam L5, validitas, jumlah konsonan, skor klasifikator. Regresi logistik dilatih di separuh data kalibrasi, ambang dipilih di separuh lain untuk sasaran salah-terima negatif ≤ 5%. Bobot ke JSON, versi TS ikut test paritas | Claude | Dibanding ambang lama di separuh tertahan: salah-terima lebih rendah tanpa recall turun > 5 poin. Lalu cek Cp (negatif ≥ 12/13) |
| Sab 21 | **L-D. Perbaikan pipeline dari taksonomi galat:** kotak bertumpuk di baris yang sama digabung dan diurutkan kiri ke kanan (C28). Aturan umum + unit test | Claude | Nusa pemisahan tidak turun > 1 poin; tidak ada foto Cp yang memburuk |
| Min 22 | **Titik keputusan D2:** pilih r1 atau r2 dengan aturan L-B. Satukan L-A sampai L-D, buka PR ke `develop`, preview Vercel | Claude, Farrel | Farrel mencoba preview di laptop (dan ponsel bila bisa meminjam) |
| Sen 23 | **Opsional B2r3** (hanya bila L-A sampai L-D selesai 22 Nov): satu run Colab, lr mengikuti panduan PaddleOCR + data sintetis terarah untuk da/dha, pepet/wulu, taling/taling-tarung (rasio 10:1) | Farrel/Claude | Dipakai hanya bila menang di aturan L-B. Bila tidak selesai 24 Nov, dibuang |
| Sel 24 | **Ukur sekali di C-uji** (`--buka-uji`), Nusa, dan waktu, untuk susunan final. Tulis `docs/EVALUASI.md` dan angka jurnal **dengan interval** | Claude | Tidak ada penyetelan setelah C-uji dibuka |
| Rab 25 | Code freeze. Merge ke `develop` bila gerbang lulus; bila tidak, produksi tetap dan B2 hanya di balik sakelar | Farrel | Gerbang bagian 7 `RENCANA_SCANNER_FINAL.md` + paritas |
| Kam 26–Jum 27 | Latihan demo, revisi jurnal (Gambar 6 dari aplikasi final), cadangan waktu | Tim | — |
| Sab 28 | Tenggat | — | — |

**Aturan pilih r1/r2 (diusulkan untuk D2):** pakai r2 bila (a) interval bootstrap berpasangan selisih akurasi r2−r1 pada gabungan v4 val + Nusa uji memiliki batas bawah > −1 poin, **dan** (b) setelah verifikator, salah-terima negatif r2 ≤ r1. Bila tidak, pakai r1.

## 6. Keputusan untuk Farrel

| # | Keputusan | Rekomendasi Claude |
| --- | --- | --- |
| D1 | Pasang pembaca B2 (int8, 18 MB) ke web, dengan sakelar kembali ke v2 | **Ya.** Ini satu-satunya cara kenaikan sejak 7 Nov sampai ke demo |
| D2 | Setujui aturan pilih r1/r2 di atas sebelum diukur | Ya |
| D3 | Charset tetap 31 sampai 28 Nov | **Ya.** Perluasan menyentuh transliterator, konten, dan test; terlalu berisiko dalam 10 hari |
| D4 | C-uji dibuka sekali pada 24 Nov untuk susunan final | Ya |
| D5 | B2r3 hanya bila L-A sampai L-D selesai 22 Nov | Ya |
| D6 | Konfirmasi tenggat 28 Nov (PRD menulis 23 Nov; code freeze PRD 19 Nov) | Perlu jawaban Farrel |

## 7. Yang sengaja tidak dikerjakan

- VLM atau API (Gemini dan sejenisnya): melanggar "model buatan sendiri", dan literatur menunjukkan mereka gagal di aksara Jawa.
- Varian pengolahan citra tambahan: sudah diuji 5 Nov dan tidak membantu.
- Mengumpulkan foto atau label baru: keputusan Farrel 7 Nov.
- Menyetel ambang di Cp: diganti verifikator yang dilatih di luar Set C.
- Ensembel r1+r2 di web: menggandakan unduhan (36 MB) dan waktu baca. Hanya dipertimbangkan setelah 28 Nov.

## Rujukan

- Slossberg dkk. (2020), *On Calibration of Scene-Text Recognition Models*. https://arxiv.org/abs/2012.12643
- *Confidence Prediction for Lexicon-Free OCR* (2018). https://arxiv.org/abs/1805.11161
- *GlotOCR Bench: OCR Models Still Struggle Beyond a Handful of Unicode Scripts* (2026). https://arxiv.org/abs/2604.12978
- *NusaAksara: A Multimodal and Multilingual Benchmark for Preserving Indonesian Indigenous Scripts*, ACL 2025. https://arxiv.org/abs/2502.18148
- *Combining Synthetic and Real Data for Low-Resource Historical OCR: A Manchu Case Study* (2026). https://arxiv.org/abs/2609.11495
- *Bharat Scene Text* (2025). https://arxiv.org/abs/2511.23071
- *PP-OCRv5: A Specialized 5M-Parameter Model…* (2026). https://arxiv.org/abs/2603.24373
- *From Zero to OCR: A Data-Centric Framework for Unsupported Low-Resource Scripts* (2026). https://arxiv.org/abs/2611.00078
- *Confidence-Aware Ensemble and Long-Word Refinement for Artistic Text Recognition* (2026). https://arxiv.org/abs/2608.29970
- Dokumentasi fine-tune PaddleOCR. https://www.paddleocr.ai/latest/en/version2.x/ppocr/model_train/finetune.html
- Diskusi GitHub PaddleOCR #13897 dan #14927. https://github.com/PaddlePaddle/PaddleOCR/discussions/13897 · https://github.com/PaddlePaddle/PaddleOCR/discussions/14927
- Transkribus, Javanese model v0.1. https://www.transkribus.org/models/javanese-model-v0.1
