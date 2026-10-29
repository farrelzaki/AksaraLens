# PRD AksaraLens

Oct 11, 2026 · @Ifril · Versi 1.1 · Tim: Farrel, Emil, Choirun

## Ringkasan produk

**AksaraLens** adalah aplikasi web *mobile-first* untuk belajar aksara Jawa secara bertahap, ditujukan bagi pelajar dan masyarakat umum. Aplikasi langsung terbuka ke menu pembelajaran (tanpa halaman beranda) dan memiliki tiga tab di navbar bawah: **Pembelajaran**, **Scanner**, dan **Profil**.

Dua komponen visi komputer menjadi inti proyek:

1. **Latihan menulis** — pengguna melihat animasi arah goresan, lalu menulis huruf di layar sentuh; model CNN memeriksa apakah huruf yang ditulis benar.
2. **Scanner aksara** — pengguna memotret atau mengunggah foto tulisan aksara Jawa cetak; model CRNN membaca dan mentransliterasikannya ke huruf Latin, lalu tombol **Kaji lebih dalam** menguraikan setiap suku kata dan menautkannya ke materi.

Materi dibagi menjadi 3 bab (nglegena; sandhangan swara; panyigeg + pangkon) dan disajikan dalam dua bentuk: **jalur titik** bertahap ala Duolingo dan **materi per bab** yang bisa dibaca bebas. Akun hanya dipakai untuk menyimpan progres; pengguna boleh belajar sebagai tamu.

### Tujuan

- Membantu pemula mengenal, membaca, dan menulis aksara nglegena serta sandhangan dasar secara mandiri.
- Menjembatani belajar dan praktik: tulisan aksara di dunia nyata (papan nama, buku) bisa dipotret lalu dipelajari.
- Menerapkan dua tugas visi komputer yang tidak tergantikan oleh input ketik: pengenalan tulisan tangan dan OCR aksara dari foto.

### Bukan tujuan

- Gamifikasi (poin, streak, liga, lencana).
- Audio atau pelafalan.
- Scan langsung (*live*/realtime) dan riwayat hasil scan.
- Penilaian urutan goresan.
- Aplikasi native Android/iOS.

## Latar belakang & masalah

Aksara Jawa diajarkan sebagai muatan lokal, tetapi penguasaannya rendah. Putri & Subrata (2024) mencatat hanya 2 dari 19 siswa kelas 4 yang memahami aksara Jawa. Siswa sering tertukar antara huruf yang mirip, misalnya *ha* dan *la*. Setelah memakai media interaktif, pemahaman naik dengan N-gain 0,74. Artinya media belajar yang tepat memang membantu.

Masalah yang ingin diselesaikan:

- **Latihan menulis tanpa umpan balik.** Siswa menulis di buku dan tidak tahu benar atau salah sampai diperiksa guru.
- **Huruf mirip mudah tertukar.** Butuh latihan mengenali yang berulang dengan koreksi langsung.
- **Tulisan aksara di sekitar tidak terbaca.** Papan nama jalan, gapura, dan buku beraksara Jawa tidak bisa dibaca pemula, dan mengetik ulang aksara untuk menerjemahkannya hampir mustahil bagi orang yang belum bisa membacanya.

### Celah solusi yang ada

| Solusi | Yang sudah ada | Kekurangan |
| --- | --- | --- |
| Aplikasi kuis/kamus aksara | Tabel huruf, kuis pilihan ganda | Tidak ada pemeriksaan tulisan tangan, tidak ada scanner |
| Penelitian kanvas + CNN (Sulaiman & Mulyana, 2023) | Akurasi 97,8% untuk huruf tulisan tangan | Prototipe riset, bukan alur belajar utuh |
| Penelitian OCR aksara cetak (Naufal dkk., 2024; Widiarti dkk., 2026) | Kemiripan ±90%; segmentasi halaman 63,5% | Belum dikemas sebagai fitur belajar |
| JawaLens | AR berbasis marker | Hanya mengenali gambar marker, bukan tulisan bebas |

AksaraLens menggabungkan materi bertahap, pemeriksaan tulisan tangan, dan scanner tulisan nyata dalam satu aplikasi.

## Pengguna sasaran & skenario

**Pengguna utama:** pelajar (SD–SMA) yang mendapat pelajaran bahasa Jawa, serta masyarakat umum dari segala usia yang ingin belajar mandiri. Diasumsikan memakai ponsel Android/iPhone dengan browser modern.

### Skenario

1. **Belajar dari nol.** Rina (kelas 5) membuka AksaraLens, langsung masuk jalur Bab 1, mengikuti pelajaran *ha–ka*, lalu mengerjakan titik latihan menulis. Ia tidak membuat akun; progresnya tersimpan di perangkat.
2. **Menyimpan progres.** Setelah beberapa pelajaran, Rina mendaftar dengan akun Google agar progres tidak hilang. Progres tamu otomatis dipindahkan ke akunnya.
3. **Mengulang materi.** Pak Budi lupa bentuk *taling tarung*. Ia membuka tab Pembelajaran → Materi → Bab 2 dan membaca langsung tanpa harus membuka pelajaran di jalur.
4. **Membaca tulisan di sekitar.** Dimas melihat papan nama jalan beraksara Jawa, memotretnya lewat tab Scanner, membaca hasil transliterasinya, lalu menekan **Kaji lebih dalam** untuk melihat uraian tiap suku kata dan tautan ke bab terkait.
5. **Mengetahui kelemahan.** Di tab Profil, Rina melihat daftar huruf yang paling sering salah dan mengulang materinya.

## Ruang lingkup

### Termasuk (versi 1.0)

- Navbar bawah 3 tab: Pembelajaran, Scanner, Profil. Tanpa beranda.
- 3 bab materi: **Bab 1 Nglegena** (20 huruf), **Bab 2 Sandhangan swara** (wulu, suku, taling, taling tarung, pepet), **Bab 3 Panyigeg + pangkon** (layar, cecak, wignyan, pangkon).
- Jalur titik bertahap dengan sistem buka kunci berurutan.
- Materi per bab yang bisa dibuka bebas kapan saja.
- Pelajaran berisi kenalan huruf, pilihan ganda, dan menjodohkan.
- Latihan menulis (animasi arah goresan + kanvas + pemeriksaan CNN) **khusus Bab 1**, sebagai titik tersendiri bertanda latihan.
- Scanner foto (kamera atau unggah dari galeri) untuk aksara **cetak**: nglegena, sandhangan swara, panyigeg, pangkon, dan pasangan (pasangan dibaca tetapi ditandai “belum ada di materi”).
- Kaji lebih dalam: uraian per suku kata + tautan ke materi bab.
- Akun email dan Google, mode tamu, migrasi progres tamu.
- Profil: huruf yang sering salah, pengaturan akun, tentang & sumber data.

### Tidak termasuk

| Fitur | Alasan |
| --- | --- |
| Scan live/realtime | Diputuskan memakai mode foto (lebih akurat dan ringan) |
| Gamifikasi (XP, streak, lencana) | Keputusan rapat; fokus pada belajar dan visi komputer |
| Audio/pelafalan | Keputusan rapat |
| Materi pasangan, aksara murda, rekan, angka | Di luar 3 bab |
| Latihan menulis Bab 2–3 | Tidak ada dataset tulisan tangan sandhangan |
| Penilaian urutan goresan | Animasi hanya sebagai panduan |
| Riwayat hasil scan | Hasil scan tidak disimpan |
| Scan tulisan tangan di kertas | Model scanner dilatih untuk teks cetak |
| Kuis akhir bab | Soal di tiap pelajaran sudah cukup |
| Aplikasi native / PWA terpasang | Cukup web app di browser |

## Struktur aplikasi & navigasi

Aplikasi terbuka langsung ke tab **Pembelajaran**. Navbar bawah selalu tampil, kecuali saat pengguna berada di dalam pelajaran, latihan menulis, atau proses scan (layar penuh dengan tombol keluar).

| Tab | Isi | Rute (usulan) |
| --- | --- | --- |
| Pembelajaran | Sakelar **Jalur \| Materi**. Jalur = titik bertahap per bab. Materi = daftar 3 bab yang bisa dibaca bebas. | `/belajar`, `/belajar/materi/:bab`, `/pelajaran/:id`, `/latihan/:id` |
| Scanner | Ambil foto atau pilih dari galeri → hasil bacaan → Kaji lebih dalam | `/scan`, `/scan/hasil`, `/scan/kaji` |
| Profil | Huruf sering salah, akun (masuk/daftar/keluar), tentang & sumber data | `/profil`, `/masuk` |

### Rencana isi jalur (usulan, boleh diubah Emil)

| Bab | Titik pelajaran | Titik latihan menulis |
| --- | --- | --- |
| Bab 1 Nglegena | P1 ha na ca ra ka · P2 da ta sa wa la · P3 pa dha ja ya nya · P4 ma ga ba tha nga | Satu titik latihan setelah tiap pelajaran (4 titik), menguji 5 huruf pelajaran itu |
| Bab 2 Sandhangan swara | P5 wulu + suku · P6 taling, taling tarung, pepet | — |
| Bab 3 Panyigeg + pangkon | P7 layar, cecak, wignyan · P8 pangkon | — |

Total: 8 titik pelajaran + 4 titik latihan menulis = 12 titik. Titik dibuka berurutan: titik berikutnya terbuka setelah titik sebelumnya selesai. Titik latihan menulis selesai setelah semua huruf dicoba (benar atau salah), sehingga tidak pernah menghalangi kemajuan.

## Spesifikasi fitur & alur

### F1. Jalur belajar

- Titik ditampilkan vertikal per bab, dengan judul bab sebagai pemisah.
- Status titik: **terkunci**, **terbuka**, **selesai**. Titik latihan menulis punya ikon/label berbeda (“Latihan”).
- Ketuk titik terbuka → masuk pelajaran. Ketuk titik terkunci → pesan singkat “Selesaikan titik sebelumnya dulu”.
- Titik yang sudah selesai boleh diulang kapan saja; mengulang tidak mengubah status.

### F2. Pelajaran (titik biasa)

Setiap pelajaran berisi tiga tahap berurutan:

1. **Kenalan huruf** — kartu per huruf/sandhangan: bentuk aksara besar, nama Latin, contoh pemakaian (mis. *ka + wulu = ki*), catatan huruf mirip (mis. *ha* vs *la*).
2. **Pilihan ganda** — ±6 soal acak dari huruf pelajaran itu. Dua arah: aksara → pilih Latin, dan Latin → pilih aksara. Pengecoh diambil dari huruf yang mirip bentuknya.
3. **Menjodohkan** — pasangkan 4–5 aksara dengan bacaannya.

Aturan:

- Jawaban salah langsung diberi tahu jawaban benarnya; soal yang salah diulang di akhir tahap sampai benar.
- Pelajaran dianggap selesai setelah ketiga tahap tuntas. Tidak ada nilai minimum.
- Setiap jawaban benar/salah per huruf dicatat ke statistik huruf (dipakai di Profil).
- Keluar di tengah pelajaran → progres pelajaran itu tidak disimpan (mulai ulang).

### F3. Materi per bab

- Dibuka dari sakelar **Materi** di tab Pembelajaran; tidak terkunci.
- Isi: penjelasan singkat bab, tabel semua huruf/sandhangan bab itu, contoh kata, dan catatan huruf mirip.
- Ketuk huruf → detail huruf (bentuk besar, bacaan, contoh). Untuk huruf Bab 1, detail juga memutar animasi arah goresan.
- Halaman materi menjadi tujuan tautan dari **Kaji lebih dalam** (anchor per huruf, mis. `/belajar/materi/1#ka`).

### F4. Latihan menulis (Bab 1)

Alur per huruf (5 huruf per titik latihan):

1. Tampil nama huruf (mis. “Tulis: **ka**”) dan animasi arah goresan di kotak contoh. Tombol “Putar ulang”.
2. Pengguna menulis di kanvas (area persegi, garis bantu tipis). Tombol **Hapus** dan **Cek**.
3. Saat **Cek**, coretan dipotong ke batas tulisan, diubah ke 64×64 grayscale, tebal garis dinormalkan, lalu diklasifikasi CNN di perangkat.
4. Hasil: **benar** jika prediksi teratas = huruf target **dan** keyakinan ≥ ambang (awal 0,6; disetel saat uji). Jika salah, tampil “Terbaca sebagai *la*” bila prediksi huruf lain yakin, atau “Belum terbaca, coba lagi” bila kelas *bukan huruf* atau keyakinan rendah.
5. Pengguna boleh **Coba lagi** tanpa batas atau **Lanjut** ke huruf berikutnya. Kesalahan tidak pernah menghalangi kemajuan.
6. Kanvas kosong atau coretan terlalu kecil → tombol Cek nonaktif / pesan “Tulisan terlalu kecil”.

Urutan goresan **tidak dinilai**; animasi hanya panduan. Data animasi berupa koordinat goresan yang direkam tim untuk 20 huruf (rujukan arah: tutorial Omah Aksara), disimpan sebagai JSON.

### F5. Scanner

1. **Ambil gambar** — tombol kamera (input `capture` di ponsel) atau **Pilih dari galeri**. Petunjuk singkat: “Foto tulisan cetak, lurus, terang, 1–3 baris”.
2. **Atur area** — pratinjau foto dengan bingkai potong yang bisa diubah ukurannya. Tombol **Baca**.
3. **Proses** (di perangkat, target ≤ 3 detik): grayscale → detektor baris (U-Net kecil) menemukan letak tiap baris → CRNN membaca tiap baris menjadi Unicode Jawa → transliterasi ke Latin.
4. **Hasil** — per baris tampil aksara (Unicode) dan bacaan Latin yang dipisah per suku kata. Bagian yang mengandung pasangan diberi tanda “belum ada di materi”. Tombol **Kaji lebih dalam** dan **Scan lagi**.
5. **Kaji lebih dalam** — daftar suku kata; tiap suku kata diuraikan menjadi komponennya (mis. *ki* = aksara *ka* + sandhangan *wulu*), masing-masing dengan tautan ke materi bab terkait. Komponen pasangan ditandai “belum ada di materi” tanpa tautan.
6. Foto dan hasil **tidak disimpan** dan **tidak dikirim ke server**.

Keadaan gagal:

| Kondisi | Respons |
| --- | --- |
| Izin kamera ditolak | Tawarkan unggah dari galeri |
| Tidak ada baris terdeteksi | “Tidak ada tulisan aksara terbaca. Coba foto lebih dekat dan terang.” |
| Keyakinan rata-rata rendah | Hasil tetap tampil dengan peringatan “Hasil mungkin kurang tepat” |
| Model belum selesai dimuat | Indikator memuat; tombol Baca nonaktif |
| Browser tidak mendukung WebGPU | Otomatis memakai WASM (lebih lambat) |

### F6. Akun & progres

- **Tamu (bawaan):** progres jalur dan statistik huruf disimpan di `localStorage`.
- **Daftar/masuk:** email + kata sandi, atau Google. Halaman masuk dibuka dari tab Profil atau dari ajakan ringan setelah menyelesaikan pelajaran pertama (“Simpan progresmu?”, bisa ditutup).
- **Migrasi tamu → akun:** setelah masuk pertama kali, progres lokal digabung ke server (ambil status terjauh per pelajaran; jumlahkan statistik huruf), lalu data lokal dikosongkan.
- **Saat masuk:** progres dibaca dari Supabase dan ditulis setiap titik selesai. Jika offline saat menulis, simpan antrean lokal dan kirim ulang saat online.
- Lupa kata sandi lewat email reset Supabase. Keluar akun mengembalikan aplikasi ke mode tamu kosong.

### F7. Profil

- **Huruf sering salah:** 5 huruf dengan rasio salah tertinggi (minimal 3 percobaan), dari pilihan ganda, menjodohkan, dan latihan menulis. Ketuk → buka materi huruf itu.
- **Akun:** status masuk/tamu, nama tampilan, email, keluar, hapus akun.
- **Tentang & sumber data:** deskripsi aplikasi, tim, atribusi dataset dan font (wajib untuk lisensi CC BY 4.0 dan OFL), rujukan.
- Profil **tidak** menampilkan progres per bab (progres terlihat di jalur).

## Spesifikasi AI

Kedua model dilatih di Python (PyTorch, Google Colab), diekspor ke ONNX (tanpa kuantisasi, karena ukurannya sudah di bawah target), lalu dijalankan di browser dengan ONNX Runtime Web. Penanggung jawab: Farrel.

|  | Model 1: Pemeriksa tulisan | Model 2a: Pembaca baris | Model 2b: Detektor baris |
| --- | --- | --- | --- |
| Tugas | Klasifikasi 1 huruf tulisan tangan di kanvas | Membaca 1 baris aksara cetak menjadi teks Unicode | Menemukan letak tiap baris aksara di foto halaman |
| Arsitektur | CNN kecil | CRNN (CNN + BiLSTM) + CTC, 2,06 juta parameter | U-Net kecil, 0,49 juta parameter |
| Kelas/keluaran | 20 huruf nglegena + 1 kelas *bukan huruf* | 31 karakter Unicode Jawa sesuai rancangan 3 bab: 20 nglegena, 5 sandhangan swara (termasuk tarung), 3 panyigeg, pangkon, pada lingsa, pada lungsi. Pasangan = nglegena sesudah pangkon. Cakra, keret, pengkal, murda tidak dibaca | Peta “inti baris” ¼ resolusi → kotak tiap baris |
| Masukan | 64×64 grayscale (kerangka coretan, ketebalan diseragamkan) | Tinggi 64 px, lebar menyesuaikan (maks. 800 px) | Grayscale, sisi terpanjang 1024 px |
| Data latih | vzrenggamani (CC0), Roboflow Fawwaz Zaini Ahmad (CC BY 4.0), isminaimah Kaggle (CC BY-SA 4.0), sampel kanvas tim, contoh *bukan huruf* buatan | 600.000 baris sintetis (Noto Sans Javanese + Tuladha Jejeg, OFL, dengan augmentasi foto), lalu fine-tune dengan NusaAksara (baris cetak nyata) | Halaman scan Exqrch/NusaAksara-java + halaman sintetis (kolom, teks Latin pengganggu, gambar) |
| Pra-proses | Otsu → potong ke coretan → kotak dengan margin 12% → kerangka + tebalkan → 64×64 | Grayscale, normalisasi kecerahan per gambar | Grayscale, diperkecil, tepi dibulatkan ke kelipatan 32 |
| Data uji | Penulis yang **tidak** ikut data latih | 69 baris NusaAksara dari halaman yang tidak dipakai latihan | 30 halaman (355 baris) yang tidak dipakai latihan |
| Target | Akurasi ≥ 90% pada penulis baru | Akurasi per suku kata 85–90% pada teks cetak | Lebih baik dari pemisah berbasis aturan |
| Ukuran model | Target ≤ 2 MB | 8,2 MB (target ≤ 10 MB) | 1,95 MB |
| Waktu proses | ≤ 200 ms | ≤ 3 detik per foto (2a + 2b) di ponsel kelas menengah |  |

**Status 11 Okt 2026:** ketiga model sudah dilatih di Colab Pro (A100) dan diekspor ke ONNX; hasil ONNX identik dengan PyTorch. File ada di Drive `aksaralens/model1` dan `aksaralens/model2_v2`. Hasil uji ada di bagian Metrik keberhasilan. Model 2b ditambahkan karena pemisah baris berbasis aturan hanya menemukan 30% baris di halaman nyata.

### Kelas *bukan huruf*

Diisi coretan acak, coretan setengah jadi, dan sandhangan, agar model tidak memaksa menebak huruf saat tulisan tidak jelas.

### Transliterasi

Keluaran Unicode Model 2 diubah ke Latin dengan **Carakan.js** (`toLatin`, lisensi MIT) ditambah aturan tim:

- *ha* di awal kata dibaca *a* (mis. ꦲꦤ → *ana*, bukan *hana*).
- Karena aksara Jawa ditulis tanpa spasi, keluaran ditampilkan per suku kata, bukan per kata.
- Pemetaan Unicode → komponen (aksara dasar, sandhangan, pangkon, pasangan) dipakai juga oleh fitur Kaji lebih dalam.

## Arsitektur & tech stack

AksaraLens adalah aplikasi web statis (SPA) dengan **Supabase** sebagai backend terkelola. Tidak perlu server Express sendiri: Supabase sudah menyediakan autentikasi dan database, sedangkan AI berjalan di browser pengguna.

| Lapisan | Teknologi | Fungsi |
| --- | --- | --- |
| Frontend | React + Vite, TypeScript (disarankan), React Router | Tampilan, navigasi, logika jalur |
| Styling | Tailwind CSS atau CSS Modules (diputuskan Choirun) | Tampilan mobile-first |
| Kanvas | HTML Canvas + Pointer Events | Menulis huruf, memutar animasi goresan |
| AI di browser | ONNX Runtime Web (WebGPU, cadangan WASM) | Menjalankan Model 1 dan 2 |
| Pengolahan gambar | OpenCV.js (dimuat hanya di halaman Scanner) atau kode canvas sendiri | Deskew, binarisasi, segmentasi baris |
| Transliterasi | Carakan.js + aturan tambahan | Unicode Jawa → Latin |
| Auth | Supabase Auth (email + Google OAuth) | Akun |
| Database | Supabase Postgres + Row Level Security | Progres dan statistik huruf |
| Konten | File JSON statis di repo frontend | Materi, soal, data goresan |
| Hosting | Vercel (atau Netlify) | Deploy otomatis dari GitHub |
| Pelatihan model | Python, PyTorch, Google Colab, Pillow + libraqm | Melatih dan mengekspor ONNX |
| Kolaborasi | GitHub (repo `aksaralens` untuk web, `aksaralens-ml` untuk model) | Versi dan review kode |

### Kenapa bukan React + Express

- Express hanya dibutuhkan jika ada logika server khusus. Kebutuhan server AksaraLens hanya akun dan simpan progres, dan semuanya sudah ditangani Supabase.
- Tanpa server sendiri, tidak perlu biaya hosting backend, dan foto scan tidak pernah meninggalkan perangkat.
- **Rencana cadangan:** jika inferensi scanner di browser terlalu lambat di ponsel uji, Model 2 dipindah ke API kecil **FastAPI** (Python) di layanan gratis seperti Hugging Face Spaces. Keputusan diambil setelah uji ONNX di ponsel pada minggu pertama.

### Pemuatan model

- File `.onnx` disajikan sebagai aset statis dan disimpan cache oleh browser.
- Model 1 dimuat saat pengguna membuka titik latihan menulis; Model 2 (pembaca baris 8,2 MB + detektor baris 1,95 MB) dimuat saat membuka tab Scanner. Halaman pembelajaran tetap ringan.

&#91;embedded content: Arsitektur AksaraLens · browser, Supabase, hosting, pelatihan\]

Model dilatih di Colab lalu diunggah sebagai aset statis; browser mengunduhnya sekali dan menjalankan semua inferensi sendiri. Supabase hanya menerima data masuk akun dan progres.

## Model data & keamanan

Konten belajar (materi, soal, data goresan) **tidak** disimpan di database. Isinya disimpan sebagai JSON statis di frontend agar mudah disunting Emil dan tidak perlu query. Database hanya menyimpan data milik pengguna.

### Tabel Supabase

**`profiles`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| id | uuid, PK | = `auth.users.id` |
| display\_name | text | Nama tampilan |
| created\_at | timestamptz | Default `now()` |

**`lesson_progress`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| user\_id | uuid, FK → profiles |  |
| lesson\_id | text | ID titik, mis. `b1-p1`, `b1-tulis1` |
| status | text | `completed` (titik yang belum ada barisnya dianggap belum selesai) |
| completed\_at | timestamptz |  |
|  |  | PK gabungan (user\_id, lesson\_id) |

**`letter_stats`**

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| user\_id | uuid, FK → profiles |  |
| letter | text | Kode huruf, mis. `ka`, `wulu` |
| correct | int | Jumlah benar |
| wrong | int | Jumlah salah |
| updated\_at | timestamptz |  |
|  |  | PK gabungan (user\_id, letter) |

### Contoh struktur konten JSON

```json
{
  "id": "b1-p1",
  "bab": 1,
  "type": "lesson",
  "title": "ha na ca ra ka",
  "letters": ["ha", "na", "ca", "ra", "ka"],
  "next": "b1-tulis1"
}
```

Titik latihan menulis memakai `"type": "writing"`. Data goresan disimpan per huruf: `{ "ka": [[[x,y],[x,y],…], …] }` dengan koordinat dinormalkan 0–1.

### Keamanan

- **Row Level Security aktif** di semua tabel. Kebijakan: pengguna hanya dapat `select`, `insert`, `update` baris dengan `user_id = auth.uid()`.
- Baris `profiles` dibuat otomatis lewat trigger saat pengguna baru mendaftar.
- Hanya *anon key* Supabase yang ada di frontend; *service role key* tidak pernah masuk repo. Kunci disimpan di `.env` dan variabel lingkungan Vercel.
- Hapus akun menghapus semua baris milik pengguna (`on delete cascade`).
- Foto scan diproses di perangkat dan tidak diunggah.

### Data tamu

`localStorage` dengan kunci `aksaralens:progress` dan `aksaralens:stats`, berbentuk sama seperti tabel di atas tanpa `user_id`. Saat migrasi, data dikirim dengan `upsert` lalu kunci lokal dihapus.

## Kebutuhan non-fungsional

| Aspek | Kebutuhan |
| --- | --- |
| Perangkat | Mobile-first (lebar 360–430 px); tetap rapi di tablet dan desktop |
| Browser | Chrome Android dan Safari iOS terbaru. Kamera diakses lewat input file `capture`, jadi berjalan di Safari biasa tanpa perlu dipasang sebagai PWA |
| Kinerja | Halaman pertama tampil ≤ 3 detik di 4G; pemeriksaan tulisan ≤ 200 ms; scan ≤ 3 detik |
| Ukuran unduhan | Bundle awal tanpa model ≤ 500 KB (gzip); model dimuat sesuai kebutuhan |
| Offline | Materi dan latihan menulis tetap jalan setelah model tercache; simpan progres diantrekan |
| Privasi | Foto tidak keluar dari perangkat; tidak ada analitik pihak ketiga |
| Bahasa | Antarmuka berbahasa Indonesia |
| Aksesibilitas | Ukuran sentuh ≥ 44 px, kontras teks memadai, aksara ditampilkan besar dengan font Noto Sans Javanese, label untuk pembaca layar |
| Ketersediaan | Supabase gratis berhenti sementara setelah 1 minggu tanpa aktivitas; jaga agar ada aktivitas rutin, terutama menjelang demo |

## Metrik keberhasilan & evaluasi

| Metrik | Target | Cara ukur | Hasil (11 Okt 2026) |
| --- | --- | --- | --- |
| Akurasi Model 1 | ≥ 90% | Data uji dari penulis yang tidak ikut data latih; laporkan juga matriks kebingungan (cek pasangan mirip seperti ha/la) | **98,3%** — tercapai |
| Penolakan coretan acak | ≥ 85% terdeteksi *bukan huruf* | Kumpulan coretan acak dan sandhangan | Belum dilaporkan |
| Akurasi per suku kata Model 2 | 85–90% | 69 baris cetak nyata NusaAksara dari halaman yang tidak dipakai latihan; laporkan juga Character Error Rate (CER). Opsional: 20–30 foto kamera dari buku pelajaran | **89,0%**, CER 5,0% — tercapai (sebelum fine-tune: 27,8%). Baris yang 100% benar: 31,9% |
| Pemisahan baris di halaman | Lebih baik dari pemisah berbasis aturan (30,1% baris ditemukan) | 30 halaman scan nyata, 355 baris; baris dihitung benar bila tumpang-tindih tinggi ≥ 50% dan lebar ≥ 50% | **82,8%** baris ditemukan, 86,9% deteksi benar — tercapai |
| Waktu scan | ≤ 3 detik | Rata-rata 20 percobaan di 2 ponsel kelas menengah (Android + iPhone bila ada) | Belum diukur |
| Waktu cek tulisan | ≤ 200 ms | Rata-rata di ponsel uji | Belum diukur |
| Kegunaan | Skor SUS ≥ 68 | Uji pengguna 10–15 orang (pelajar + umum), tugas: selesaikan 1 pelajaran, 1 latihan menulis, 1 scan | Desember |
| Keberhasilan tugas | ≥ 80% peserta menyelesaikan 3 tugas tanpa bantuan | Observasi saat uji pengguna | Desember |

Karena satu suku kata salah membuat seluruh baris dianggap salah, hasil scan ditampilkan per suku kata agar pengguna mudah melihat bagian yang keliru. Data uji Model 2 masih kecil (69 baris), jadi angka 89% dibaca sebagai perkiraan.

Untuk laporan, bandingkan Model 1 dengan rujukan Sulaiman & Mulyana (2023) dan Model 2 dengan Naufal dkk. (2024), dengan catatan bahwa data ujinya berbeda.

## Pembagian tugas & jadwal

### Peran

| Anggota | Tanggung jawab |
| --- | --- |
| **Farrel** | Machine learning (Model 1 dan Model 2: data, pelatihan, evaluasi, ekspor ONNX), fitur scanner end-to-end (pra-proses, inferensi, transliterasi, Kaji lebih dalam), integrasi model ke latihan menulis, dan fitur lain yang tidak dipegang anggota lain (Profil: huruf sering salah, halaman sumber data) |
| **Emil** | Autentikasi (Supabase Auth, Google OAuth, mode tamu, migrasi), skema database + RLS, konten materi dan soal (JSON), logika jalur (buka kunci, status titik, penyimpanan progres, statistik huruf) |
| **Choirun** | Desain UI/UX (wireframe, alur layar) dan pembuatan tampilan frontend: navbar, jalur titik, layar pelajaran, materi bab, kanvas & animasi goresan, layar scanner, profil |

Semua anggota ikut merekam data goresan 20 huruf, mengumpulkan sampel tulisan kanvas dari teman, mengumpulkan 20–30 foto uji scanner dari buku pelajaran (opsional, untuk uji akhir), dan menyusun laporan.

### Jadwal (7 Oktober 2026 – awal Januari 2027)

| Periode | Fokus | Farrel | Emil | Choirun |
| --- | --- | --- | --- | --- |
| 7–18 Okt | Persiapan | Selesai 11 Okt: Model 1, Model 2a, Model 2b dilatih + ONNX; daftar sumber dataset. Sisa: uji ONNX Runtime Web di ponsel | Setup repo, Supabase, Vercel; draf konten 3 bab | Wireframe semua layar; rekam data goresan |
| 19 Okt–8 Nov | Inti belajar | Integrasi Model 1 ke kanvas; tetapkan ambang keyakinan | Konten JSON + soal; logika jalur (tamu) | Navbar, jalur, layar pelajaran, materi |
| 9–22 Nov | Menulis & akun | Pipeline scanner di browser: detektor baris → CRNN → transliterasi | Auth email + Google, tabel + RLS, migrasi tamu | Kanvas + animasi goresan, layar masuk |
| 23 Nov–13 Des | Scanner | Kaji lebih dalam; ukur waktu scan di ponsel; uji foto kamera (opsional) | Simpan progres ke server, statistik huruf | Layar scanner, hasil, Kaji lebih dalam, profil |
| 14–27 Des | Penyempurnaan | Perbaikan akurasi bila perlu, evaluasi lengkap | Perbaikan bug, uji alur | Poles tampilan, uji pengguna (SUS) |
| 28 Des–awal Jan | Penutupan | Laporan bagian AI | Laporan bagian sistem | Video demo, presentasi |

**Titik periksa:** akhir Oktober jalur + materi bisa dipakai (tamu); pertengahan November latihan menulis berfungsi; pertengahan Desember scanner berfungsi end-to-end.

## Risiko, asumsi & keputusan terbuka

### Risiko

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Model scanner bagus di data uji tetapi kurang di foto kamera ponsel | Akurasi scan di bawah target saat demo | Sudah di-fine-tune dengan baris cetak nyata (89%); uji 20–30 foto kamera; batasi klaim ke teks cetak yang jelas |
| Data uji Model 2 kecil (69 baris) | Angka akurasi kurang pasti | Laporkan sebagai perkiraan; tambah foto uji kamera bila sempat |
| Detektor melewatkan ±17% baris di halaman padat | Sebagian baris tidak terbaca | Petunjuk “foto 1–3 baris” + bingkai potong; latih detektor lebih lama bila perlu |
| Lisensi NusaAksara non-komersial; Exqrch tanpa lisensi tertulis | Tidak boleh dipakai untuk produk berbayar | Pakai hanya untuk tugas kuliah; cantumkan sitasi NusaAksara |
| Beda domain kanvas vs data latih (kebanyakan tulisan di kertas) | Model 1 kurang akurat di kanvas | Pra-proses yang sama untuk latih dan pakai; tambah sampel kanvas dari teman; fine-tune |
| Inferensi di browser lambat di ponsel murah | Scan > 3 detik | Input kecil, WASM multithread, kuantisasi bila perlu; cadangan FastAPI di server |
| Aturan transliterasi keliru (ha awal kata, pasangan, sandhangan bertumpuk) | Bacaan salah | Uji dengan daftar kata contoh; tambah aturan khusus |
| Supabase gratis berhenti setelah 1 minggu tidak aktif | Login gagal saat demo | Buka aplikasi rutin; cek dan aktifkan ulang project 1 hari sebelum demo |
| Pengaturan Google OAuth (consent screen, redirect URL) | Login Google gagal di produksi | Atur sejak November, uji di domain Vercel |
| Beban kerja Farrel paling berat (3 model + scanner) | Jadwal molor | Pelatihan model sudah selesai lebih awal; Kaji lebih dalam dibuat sederhana dulu |

### Asumsi

- Pengguna memakai ponsel dengan browser modern dan kamera.
- Teks yang di-scan adalah aksara Jawa cetak (bukan tulisan tangan atau ukiran yang sangat dekoratif).
- Batas gratis Supabase (500 MB database, 50.000 pengguna aktif bulanan) jauh di atas kebutuhan proyek.

### Keputusan terbuka

| Keputusan | Pemilik | Batas waktu |
| --- | --- | --- |
| Jumlah dan isi pelajaran per bab (usulan di bagian Struktur) | Emil | 18 Okt |
| Ambang keyakinan latihan menulis (awal 0,6; tabel ambang sudah ada di notebook Model 1) | Farrel | 8 Nov |
| Library styling (Tailwind vs CSS Modules) dan pakai TypeScript atau tidak | Choirun + Emil | 18 Okt |
| Scanner di browser atau pindah ke FastAPI | Farrel | Setelah uji ONNX di ponsel |

Sudah diputuskan (11 Okt): Tuladha Jejeg dipakai (SIL OFL); dataset phiard tidak dipakai; scanner memakai detektor baris, bukan pemisah berbasis aturan; cakupan scanner mengikuti rancangan 3 bab + pasangan (murda dan sandhangan wyanjana tidak dibaca); tim tidak membuat 100–200 foto uji sendiri.

## Lampiran: dataset, lisensi & rujukan

### Dataset & aset

| Sumber | Isi | Dipakai untuk | Lisensi | Catatan |
| --- | --- | --- | --- | --- |
| [vzrenggamani (GitHub)](https://github.com/vzrenggamani/aksarajawa-hanacaraka) | ± 1.560 gambar tulisan tangan 20 huruf, 79 penulis | Model 1 (latih + uji, dibagi per penulis) | CC0 | Bebas dipakai |
| [Roboflow Universe — Fawwaz Zaini Ahmad](https://universe.roboflow.com/fawwaz-zaini-ahmad-ce2om/javanese-handwriting-object-detection-aksara-jawa) | 1.464 gambar unik (3.492 setelah augmentasi) | Model 1 | CC BY 4.0 | Wajib atribusi di halaman Tentang |
| [isminaimah (Kaggle)](https://www.kaggle.com/datasets/isminaimah/javanese-script) | ± 500 gambar tulisan tangan 20 huruf | Model 1 (latih saja; duplikat dibuang) | CC BY-SA 4.0 | Wajib atribusi |
| Sampel kanvas teman | Tulisan di layar sentuh | Model 1 | Milik tim (dengan izin) | Juga untuk data uji penulis baru |
| [NusaAksara](https://huggingface.co/datasets/NusaAksara/NusaAksara) | 816 baris aksara Jawa cetak + transkripsi | Model 2a (fine-tune + uji) | Non-komersial | Wajib sitasi [paper ACL 2025](https://aclanthology.org/2025.acl-long.1377) |
| [Exqrch/NusaAksara-java](https://huggingface.co/datasets/Exqrch/NusaAksara-java) | 93 halaman scan + kotak tiap baris | Model 2b (latih + uji) | Tidak tertulis | Diperlakukan seperti NusaAksara |
| [Noto Sans Javanese](https://fonts.google.com/noto/specimen/Noto+Sans+Javanese) | Font tampilan + data sintetis | Model 2a, 2b | SIL OFL 1.1 |  |
| [Tuladha Jejeg](https://en.wikipedia.org/wiki/Tuladha_Jejeg) | Font gaya buku klasik untuk data sintetis | Model 2a, 2b | SIL OFL 1.1 | Digitalisasi R.S. Wihananto |
| Carakan.js | Transliterasi Unicode → Latin | Aplikasi | MIT | Cantumkan lisensi |
| Tutorial Omah Aksara | Rujukan arah goresan | Aplikasi | — | Hanya rujukan; data goresan direkam ulang oleh tim |

Tidak dipakai: dataset phiard (Kaggle), karena lisensinya “© Original Authors” dan perlu izin pemilik. Rincian lengkap ada di spreadsheet *AksaraLens\_Sumber\_Dataset.xlsx*.

### Rujukan penelitian

- Putri & Subrata (2024). Media interaktif aksara Jawa (CAKRA) untuk siswa kelas 4. Data pemahaman awal 2/19 siswa; N-gain 0,74.
- Sulaiman & Mulyana (2023). Pengenalan tulisan tangan aksara Jawa berbasis web canvas dengan CNN; akurasi 97,8%.
- Naufal dkk. (2024). OCR aksara Jawa cetak; kemiripan ±90%.
- Widiarti dkk. (2026). Segmentasi halaman aksara Jawa cetak; 63,5%.
- JawaLens. Aplikasi AR aksara Jawa berbasis marker.

### Rujukan teknis

- Supabase pricing (batas paket gratis): https://supabase.com/pricing
- ONNX Runtime Web: https://onnxruntime.ai/docs/tutorials/web/

### Rujukan desain (dari halaman Rembug AksaraLens)

Duolingo (jalur titik, tabel karakter, menelusuri huruf), Write It! Japanese (mode menulis), Japanese Kanji Study (detail karakter, statistik), LingoDeer, Skritter, Marbel, Photomath (bingkai potong, uraian langkah), Pleco (ketuk karakter di foto).

## Riwayat perubahan

| Tanggal | Versi | Perubahan |
| --- | --- | --- |
| 11 Okt 2026 | 1.1 | Hasil machine learning dimasukkan (Model 1 98,3%; Model 2a 89,0% per suku kata; Model 2b 82,8% baris ditemukan). Detektor baris ditambahkan ke pipeline scanner. Cakupan scanner dikunci ke rancangan 3 bab + pasangan. Data uji scanner memakai NusaAksara, bukan 100–200 foto buatan tim. Dataset isminaimah dan Tuladha Jejeg ditambahkan; phiard dikeluarkan. Jadwal Farrel disesuaikan. |
| 7 Okt 2026 | 1.0 | Versi pertama PRD |
