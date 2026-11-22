# Evaluasi Keras Sistem Scanner (18 Nov 2026)

> Diminta Farrel: evaluasi mendalam logika dan model, dibandingkan dengan sistem serupa, sebelum perbaikan sampai 28 Nov.
> Kode yang diaudit: `develop` 691e66f (produksi) dan cabang `feature/pembaca-b2` 133d582; bangku Python `scripts/`.
> Setiap temuan punya bukti (baris kode atau hasil uji). Yang belum terbukti ditulis sebagai dugaan.
> Rencana kerja ada di `docs/RISET_RENCANA_28NOV.md`; dokumen ini adalah dasarnya.

## 1. Vonis singkat

Arsitektur besarnya **benar** dan sama dengan sistem OCR foto yang dipakai industri: detektor → penyaring aksara → pembaca baris CTC → model bahasa. Yang salah ada di tiga lapisan:

1. **Proses.** Model terbaik tidak pernah sampai ke aplikasi, dan keputusan diambil dari 12 foto tanpa interval.
2. **Logika di sekitar model.** Keyakinan dan penolakan memakai ukuran yang lemah, penggabungan dan urutan kotak salah, dan pipeline dokumen dipakai untuk foto adegan.
3. **Data model.** Hampir tidak ada data foto papan nyata, charset tidak mencakup huruf yang umum di papan, dan panen Wikisource bias ke baris yang sudah bisa dibaca.

Model pembacanya sendiri (B2) bukan titik terlemah. Di buku cetak ia mencapai 94% per suku kata, jauh di atas pembanding mana pun yang dilaporkan.

## 2. Sistem serupa dan cara mereka membangunnya

| Sistem | Tahapan | Yang mereka lakukan dan kita belum | Sumber |
| --- | --- | --- | --- |
| **PaddleOCR 3.x, pipeline OCR umum** (asal detektor dan B2 kita) | orientasi dokumen (opsional) → unwarp (opsional) → deteksi DB → **orientasi baris 0/180°** → pengenal | Deteksi tanpa memperkecil foto (bawaan `limit_type=min`, `limit_side_len=64`, jadi gambar biasa dipakai pada resolusi asli), `box_thresh` 0,6, `unclip_ratio` 2,0. Potongan **diputar per kotak** (kotak miring/poligon), bukan satu sudut untuk seluruh foto. Masukan berwarna | [dokumentasi pipeline OCR](https://www.paddleocr.ai/v3.0.3/en/version3.x/pipeline_usage/OCR.html) |
| **Rosetta** (Facebook, miliaran gambar per hari) | Faster R-CNN ShuffleNet → pengenal CTC konvolusi penuh | Resolusi deteksi 800 px dipilih dari kurva akurasi–waktu. **Kotak digoyang acak saat melatih pengenal** (+1,54% ujung-ke-ujung). Penyetelan akhir dengan ribuan gambar berlabel manusia (+57,1% mAP deteksi). Memperingatkan bahwa F1 pada satu ambang bergoyang ±5,87 poin antar-run identik | [arXiv 1910.05085](https://arxiv.org/abs/1910.05085) |
| **Meta multiplexed multilingual OCR** | deteksi bersama → **jaringan prediksi aksara** → kepala pengenal per aksara | Penyaring aksara dilatih **bersama** detektor dan memilih kepala pembaca. Karakter yang tidak didukung diberi penalti, bukan dipaksakan ke huruf terdekat | [arXiv 2103.15992](https://arxiv.org/abs/2103.15992) |
| **IndicPhotoOCR / Bharat Scene Text** (aksara Brahmi, paling mirip kasus kita) | TextBPN++ (poligon) → ViT identifikasi aksara (12 kelas, 80,5%) → pengenal per bahasa | Data adegan nyata 2–15 ribu kata per bahasa menaikkan WRR 0,47 → 0,73. Dengan deteksi dan identifikasi aksara sempurna, ujung-ke-ujung 0,36 → 0,71, jadi separuh kehilangan ada di deteksi + identifikasi aksara | [arXiv 2511.23071](https://arxiv.org/abs/2511.23071), [proyek](https://vl2g.github.io/projects/IndicPhotoOCR) |
| **Google, sistem pengenal baris berskala besar** | baris tinggi 40 px → CNN + BLSTM/GRCL → CTC + LM karakter 9-gram | Hasil berkeyakinan rendah dibuang dan dinilai dengan AUC. Pelajaran utama: "tantangan terbesar bukan pemodelan, tetapi data yang cukup dan berkualitas". Data cetak sintetis saja sangat buruk (CER 25,4%) | [arXiv 1904.09150](https://arxiv.org/abs/1904.09150) |
| **Aplikasi/riset aksara Jawa yang ada** | kebanyakan klasifikasi per huruf (CNN), atau Gemini untuk teks | Tidak ada yang membaca baris utuh dari foto papan di perangkat. Di NusaAksara, PP-OCRv3 fine-tune, GPT-4o, dan Gemini semuanya CER > 1. Transkribus punya model buku cetak (CER val 6,06%) | [NusaAksara](https://arxiv.org/abs/2502.18148), [Telkom 2025](https://openlibrarypublications.telkomuniversity.ac.id/index.php/engineering/article/view/28618), [Transkribus](https://www.transkribus.org/models/javanese-model-v0.1) |

**Yang sudah sama dengan praktik industri:**
- urutan tahapan, termasuk identifikasi aksara sebelum membaca (klasifikator kita = LPN Meta / script-ID IndicPhotoOCR);
- pembaca baris CTC dengan model bahasa karakter;
- fine-tune dari model pra-latih;
- data cetak nyata (Wikisource);
- semuanya berjalan di perangkat.

**Yang menyimpang:** pemotongan sumbu tegak plus pelurusan satu sudut untuk seluruh foto, foto diperkecil ke 640 px, masukan abu-abu, ukuran keyakinan, dan tidak adanya data adegan nyata yang berarti.

## 3. Temuan, diurutkan dari dampak terbesar

Format: **Masalah** · Bukti · Dampak · Seharusnya · Rencana.

### A. Proses dan evaluasi

**A1. Model terbaik tidak dipakai aplikasi.** `src/ml/onnx.ts` baris 10 memuat `aksaralens_scanner.onnx` (CRNN v2). Kode B2 ada di `feature/pembaca-b2` sejak 7 Nov tetapi tidak pernah di-merge.
- Dampak: semua kenaikan sejak 7 Nov (Cp suku kata 37 → 42–48%, Nusa 91 → 94%) tidak dirasakan pengguna atau penguji.
- Seharusnya: jalur kirim dulu.
- Rencana: L-A, 19 Nov.

**A2. Keputusan dari sampel terlalu kecil, dan ambang disetel di set yang sama.** Cp hanya 12 foto positif + 13 negatif: 1 foto = 8 poin. Selisih r1/r2 berada di interval bootstrap −0,165..+0,023 (melewati nol). Ambang 0,85/0,75 dan `AMBANG_JAWA = 0.5` (`klasifikator.ts` baris 9, komentar: "dipilih dari uji Set C") disetel di Set C.
- Dampak: angka yang dilaporkan cenderung optimis, dan keputusan bisa terbalik oleh satu foto (Rosetta: ±5,87 poin hanya dari pengulangan).
- Seharusnya: set evaluasi besar di luar Set C, interval berpasangan, dan ukuran tanpa ambang (AUC) untuk penolakan.
- Rencana: L-B.

**A3. Seleksi model B2 tidak melihat foto nyata.** Validasi B2 berisi sintetis 400 + adegan 400 + wiki 394 + buku 37 + **foto nyata 3** (`hasil_b2.json`). `best_accuracy` dipilih oleh rata-rata itu.
- Dampak: checkpoint terbaik untuk buku dan sintetis belum tentu terbaik untuk papan.
- Seharusnya: validasi foto nyata terpisah dengan bobot sendiri. Karena tim tidak melabel lagi, minimal laporkan per-set dan jangan memilih dari rata-rata gabungan.
- Rencana: dicatat di B2r3.

### B. Logika pipeline

**B1. Keyakinan buta terhadap huruf yang hilang.** *(Koreksi 19 Nov: di set baris L-B, keyakinan sekarang sudah AUC 0,97–0,98 dan fitur risiko huruf hilang hanya 0,61–0,66, jadi dampaknya jauh lebih kecil dari dugaan. Verifikator terlatih tidak lebih baik dan tidak dipasang; lihat log 19 Nov.)* `ctc.ts` baris 39–52: keyakinan = rata-rata peluang tertinggi **hanya pada frame non-blank**. Frame tempat blank menang tipis atas suatu huruf (huruf hampir terbaca lalu terbuang) tidak dihitung sama sekali.
- Dampak:
  - Galat penghapusan (paling sering pada sandhangan: taling-tarung C25, pepet C22, cecak C19) tetap berkeyakinan tinggi.
  - Baris sampah bisa lolos (literatur: AUC ≈ 0,5).
  - N07 lolos dengan satu baris 0,76 vs ambang 0,75.
- Seharusnya, verifikator dengan fitur:
  - peluang **minimum** per huruf;
  - peluang huruf terbaik pada frame blank (risiko penghapusan);
  - margin top-2 beam;
  - validitas;
  - panjang;
  - skor klasifikator.

  Dilatih di luar Set C, ambang dipilih untuk sasaran salah-terima.
- Rencana: L-C (fitur blank ditambahkan).

**B2. Penggabungan kotak gagal untuk pecahan yang tumpang-tindih, dan urutan baca salah. Terbukti pada C28.** `saring.ts` baris 53 menolak menggabung bila tumpang mendatar > 0,5 × tinggi (`GABUNG_TIMPA`), lalu baris 65 mengurutkan menurut `y0`. Di C28 kotak [2..385] dan [348..599] (tinggi ±72 px) tumpang 37 px, lewat batas 36 px **hanya 1 piksel**. Kotak kanan (y0 = 9) dibaca sebelum kotak kiri (y0 = 11), dan bagian "ꦤ꧀ꦧꦭ" terbaca dua kali, sehingga CER 1,0. `pipeline_cerdas.py` memakai aturan yang sama.
- Dampak: setiap papan satu baris yang dipecah detektor dengan sedikit tumpang terbalik urutannya. Baris lain yang sebaris tetapi tidak tergabung juga diurutkan menurut tepi atas, bukan kiri ke kanan.
- Seharusnya:
  - kotak dengan tumpang vertikal ≥ 0,5 dan tumpang mendatar berapa pun digabung (baris bertumpuk sudah tersaring oleh syarat vertikal);
  - urutan baca = kelompokkan per baris, lalu kiri ke kanan.
- Rencana: L-D, dengan unit test kasus C28 dan kasus dua baris bertumpuk.

**B3. Pipeline dokumen dipakai untuk foto adegan.**
- `scan.ts` baris 89–93: seluruh foto dibalik polaritasnya bila mayoritas piksel gelap, lalu seluruh foto diputar satu sudut (−10..+10°, profil proyeksi).
- `detektorPP.ts` baris 41–72: kotak sumbu tegak dari komponen terhubung.
- Pelurusan per baris hanya di mode area (`scan.ts` baris 163).

Ini warisan dari NusaAksara (halaman buku). PaddleOCR dan IndicPhotoOCR memakai kotak miring/poligon dan meluruskan **per baris**.
- Dampak (dugaan, belum diukur terpisah):
  - foto adegan gelap dibalik seluruhnya sebelum masuk detektor yang dilatih pada foto alami;
  - papan miring karena perspektif tidak diluruskan per baris, dan potongan sumbu tegaknya ikut memuat baris tetangga;
  - sudut global bisa dipilih oleh garis bangunan.
- Seharusnya: detektor menerima foto asli; setiap kotak dipotong dengan persegi miring minimum (`minAreaRect`) lalu diluruskan sendiri.
- Rencana: **setelah 28 Nov**, karena menyentuh banyak fungsi TS dan perlu set evaluasi yang lebih besar. Sebelum 28 Nov hanya diukur: polaritas global mati/hidup di bangku.

**B4. Ketidaksamaan Python–web.** Pada lintasan polaritas terbalik, web berhenti bila ada baris **TERIMA atau RAGU** (`scan.ts` baris 149), sedangkan Python hanya bila ada **TERIMA** (`pipeline_cerdas.py` baris 171).
- Dampak: angka bangku tidak sama persis dengan perilaku aplikasi.
- Rencana: L-A (samakan, lalu uji paritas per foto).

**B5. Pilihan eskalasi dan area memakai skor = keyakinan × jumlah konsonan** (`saring.ts` baris 116–137).
- Dampak: skor ini memihak keluaran yang lebih panjang, termasuk halusinasi panjang. Keluaran salah yang panjang bisa mengalahkan keluaran benar yang pendek.
- Seharusnya: setelah verifikator ada, pakai jumlah peluang benar (keluaran verifikator) per baris.
- Rencana: L-C.

**B6. Klasifikator aksara menilai pecahan sebelum digabung dan memampatkan semua bentuk ke 32 × 160** (`scan.ts` baris 157, `klasifikator.ts`).
- Dampak: pecahan pendek yang tertolak hilang dari baris, dan bentuk sangat panjang dipipihkan.
- Rencana: dicatat; tidak diubah sebelum 28 Nov tanpa bukti.

**B7. Aturan keras "minimal 3 konsonan" di mode foto** (`saring.ts` baris 36).
- Dampak: kata pendek yang sah (2 konsonan) selalu ditolak di foto utuh.
- Rencana: menjadi fitur verifikator, bukan aturan keras (L-C).

### C. Model

**C1. Charset 31 tidak mencakup huruf yang umum di papan:** pengkal ꦾ (mis. "Ngayogyakarta"), cakra ꦿ, aksara murda, angka Jawa. 65% baris Wikisource yang cocok memuat huruf di luar charset.
- Dampak: model **dipaksa** memetakan huruf itu ke huruf terdekat dengan yakin (GlotOCR: model berhalusinasi, bukan diam).
- Seharusnya: charset diperluas, atau setidaknya kelas "huruf lain" seperti penalti di Meta.
- Rencana: keputusan D3 tetap (31 sampai 28 Nov); dicatat sebagai keterbatasan di jurnal dan aplikasi.

**C2. Hiperparameter fine-tune tidak mengikuti panduan dan belum dibandingkan:** lr 3e-4 pada bs 32 (panduan ≈ 2,5e-5–5e-5 untuk ukuran batch itu), cabang GTC/NRTR aktif, 12 epoch. Dampak tidak diketahui.
- Rencana: kandidat B2r3.

**C3. B2 adalah model server (±72 MB fp32, 18 MB int8) untuk browser ponsel.** Industri memakai versi mobile untuk perangkat (PP-OCRv5 mobile rec, ML Kit). Di laptop Python 1,6–2,9 dtk/foto pada 2 inti; di browser dan ponsel belum pernah diukur. Untuk pembanding, v2 di ponsel sudah 3,6 dtk untuk 8 bacaan.
- Dampak: risiko waktu scan di ponsel melebar jauh di atas 10 dtk.
- Seharusnya: ukur di browser laptop pada L-A. Bila > 8 dtk/foto, slot B2r3 dipakai untuk **PP-OCRv5_mobile_rec** dengan data sama, bukan untuk lr.
- Rencana: gerbang baru di L-A.

**C4. Detektor tidak di-fine-tune untuk aksara Jawa** (sandhangan di atas dan bawah badan huruf).
- Uji audit (bagian 4): menambah margin vertikal potongan atau `unclip` **tidak** memberi perbaikan yang meyakinkan. Jadi kotak terpotong bukan penyebab utama galat sandhangan.
- Rencana: tidak diubah.

### D. Data

**D1. Hampir tidak ada data foto papan nyata:** 17–20 potongan dari ±47 ribu baris latih; val foto 3. Semua sistem pembanding menyimpulkan data nyata adalah tuas terbesar (Manchu, Bharat, Rosetta, Google).
- Dampak: plafon akurasi foto papan.
- Seharusnya: pseudo-label potongan Commons yang belum berlabel. Hanya diterima bila r1 dan r2 sepakat persis **dan** verifikator yakin; persetujuan dua model mengurangi bias konfirmasi.
- Rencana: opsi B2r3 (Farrel memilih), setelah verifikator jadi.

**D2. Panen Wikisource bias ke baris yang sudah bisa dibaca.** Baris hanya diambil bila bacaan B2 r1 cocok ≤ 20% dengan teks halaman (`wikisource_jawa.py`).
- Dampak: r2 kebanyakan belajar dari baris yang sudah dikuasai r1. Ini cocok dengan kenaikan yang kecil (v4 val +4,3 poin, Nusa +1 poin).
- Seharusnya: putaran berikutnya memanen dengan r2 (lebih kuat) dan ambang lebih longgar, ditambah pemeriksa bentuk.
- Rencana: setelah 28 Nov.

**D3. Praproses masukan B2 berbeda dari latihan.** Saat inferensi: tinggi 64 → regang kontras p2–p98 → balik → tinggi 48. Saat latihan: potongan mentah → tinggi 48.
- Uji audit (bagian 4): membaca potongan mentah langsung **tidak lebih baik** (Nusa 93,8% vs 94,0%). Jadi ini bukan masalah nyata; rantai sekarang dipertahankan.

## 4. Uji audit 18 Nov (pembaca B2 r2 int8, bangku `ESKALASI=terima`)

Skrip: `scratchpad/riset/eks/eks.py` (pembungkus `bangku_v3.py`, tidak mengubah repo). Semua selisih Cp ≤ 1–2 foto, jadi **tidak meyakinkan**; dicatat sebagai hasil negatif, bukan dasar penyetelan.

| Variasi | Cp foto CER≤0,2 | Cp suku | Atur area suku | Sampah | Negatif ditolak | Nusa pemisahan (recall/presisi) |
| --- | --- | --- | --- | --- | --- | --- |
| Margin vertikal 5% (sekarang), unclip 1,5 | 50,0% | 48,3% | 66,7% | 3/16 | 11/13 | 92,7 / 97,2 |
| Margin 15% | 50,0% | 46,1% | 69,8% | 1/13 | 12/13 | 92,7 / 96,3 |
| Margin 25% | 50,0% | 42,7% | 69,8% | 1/13 | 12/13 | 91,3 / 96,8 |
| Unclip 2,0 (bawaan PaddleOCR 3.x) | 41,7% | 53,9% | 68,3% | 3/19 | 10/13 | 93,0 / 97,5 |
| Tanpa L5, rantai v2 (pembanding baris berikut) | 50,0% | 46,1% | 60,3% | 3/16 | 11/13 | pembaca saja 94,0% |
| Tanpa L5, B2 membaca potongan mentah | 50,0% | 42,7% | 63,5% | 2/14 | 12/13 | pembaca saja 93,8% |

Uji kasus C28 (B2 r2, tanpa L5): dua kotak [2, 11, 385, 83] "ꦏꦼꦭꦸꦫꦃꦲꦤ꧀ꦧꦭ" dan [348, 9, 599, 90] "ꦤꦧꦭꦸꦮꦂꦠꦶ꧈", keduanya TERIMA, urutan terbalik. Ini membuktikan B2.

## 5. Perubahan rencana 28 Nov akibat evaluasi ini

| Langkah | Tambahan |
| --- | --- |
| L-A (19 Nov) | Samakan syarat lintasan polaritas Python–web (B4). **Gerbang waktu baru:** ukur waktu B2 di browser laptop. Bila > 8 dtk/foto, slot B2r3 = PP-OCRv5 mobile rec (C3) |
| L-C (20–21 Nov) | Fitur verifikator ditambah peluang huruf pada frame blank dan peluang minimum per huruf (B1). Aturan "≥ 3 konsonan" dan skor eskalasi/area memakai keluaran verifikator (B5, B7) |
| L-D (21 Nov) | Gabung kotak tumpang-tindih + urutan baca per baris kiri ke kanan, di TS dan Python, dengan test (B2) |
| L-B (19–20 Nov) | Tambah ukuran AUC penolakan dan laporan per-set (A2, A3) |
| B2r3 (23 Nov, opsional) | Tiga kandidat, pilih satu di gerbang 22 Nov: (a) mobile rec bila waktu gagal, (b) lr sesuai panduan + sintetis terarah, (c) pseudo-label Commons dengan persetujuan r1+r2 + verifikator |
| Setelah 28 Nov | Potongan miring per baris + tanpa polaritas/pelurusan global (B3), perluasan charset (C1), panen Wikisource ulang dengan r2 (D2), detektor berwarna |

## 6. Yang sudah benar dan harus dipertahankan

- Pipeline bertahap dengan penyaring aksara sebelum membaca, sesuai pola industri.
- Fine-tune pembaca pra-latih (B2), bukan melatih dari nol.
- Data buku cetak nyata dengan label manusia (Wikisource).
- Model bahasa hanya boleh mengubah teks, tidak boleh mengubah status penolakan (L5).
- Bangku uji Python yang mereproduksi angka.
- Penjaga kebocoran Set C.
- Foto tidak keluar perangkat.

Kekurangannya ada di sekitar model, bukan di arah besarnya.
