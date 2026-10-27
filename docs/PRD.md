# PRD — AksaraLens

> Ringkasan kerja dari PRD resmi. Sumber lengkap (latar belakang, rujukan, dataset,
> metrik) ada di `referensi/PRD-AksaraLens-v1.1.md`; bila berbeda, sumber itu yang berlaku.

| Butir | Isi |
| --- | --- |
| Versi | 1.1 (11 Okt 2026, @Ifril) |
| Tim | Farrel, Emil, Choirun |
| Jadwal | 7 Okt 2026 – awal Jan 2027 |
| Desain & UI/UX | `docs/DESIGN_SYSTEM.md`, aset `.csv` di `design/assets-csv/`, hasil final di `design/uiux/` |

## 1. Ringkasan

Web app *mobile-first* untuk belajar aksara Jawa bertahap, bagi pelajar SD–SMA dan
masyarakat umum. Langsung terbuka ke menu belajar; navbar bawah 3 tab: **Pembelajaran**,
**Scanner**, **Profil**. Dua inti visi komputer: pemeriksa tulisan tangan (CNN) dan
pembaca foto aksara cetak (U-Net + CRNN). Akun hanya untuk menyimpan progres; tamu boleh belajar.

## 2. Non-goals

Gamifikasi (poin, streak, lencana) · audio/pelafalan · scan live · riwayat scan ·
penilaian urutan goresan · materi pasangan/murda/rekan/angka · latihan menulis Bab 2–3 ·
scan tulisan tangan · kuis akhir bab · aplikasi native / PWA terpasang.

## 3. Materi

| Bab | Isi | Titik |
| --- | --- | --- |
| 1 Nglegena | 20 huruf | P1–P4 (5 huruf/pelajaran), masing-masing diikuti 1 titik latihan menulis |
| 2 Sandhangan swara | wulu, suku, taling, taling tarung, pepet | P5, P6 |
| 3 Panyigeg + pangkon | layar, cecak, wignyan, pangkon | P7, P8 |

Total 12 titik, dibuka berurutan. Isi final diputuskan Emil (batas 18 Okt).

## 4. Fitur

| ID | Fitur | Kriteria terima inti |
| --- | --- | --- |
| F1 | Jalur belajar | Titik vertikal per bab; status terkunci/terbuka/selesai; titik terkunci → "Selesaikan titik sebelumnya dulu"; mengulang tidak mengubah status |
| F2 | Pelajaran | Kenalan huruf → pilihan ganda ±6 soal (dua arah, pengecoh huruf mirip) → menjodohkan; soal salah diulang; tanpa nilai minimum; keluar = mulai ulang; tiap jawaban dicatat ke statistik huruf |
| F3 | Materi per bab | Bebas dibuka; tabel huruf, contoh, huruf mirip; detail huruf (Bab 1 + animasi goresan); anchor `/belajar/materi/:bab#kode` |
| F4 | Latihan menulis (Bab 1) | Animasi goresan + kanvas; CNN di perangkat; benar bila teratas = target dan keyakinan ≥ ambang (0,6); "Terbaca sebagai X" / "Belum terbaca"; coba lagi tanpa batas; tidak pernah menghalangi |
| F5 | Scanner | Kamera/galeri → bingkai potong → baca di perangkat (≤ 3 dtk) → per baris Unicode + Latin per suku kata; pasangan ditandai "belum ada di materi"; Kaji lebih dalam = komponen + tautan materi; foto/hasil tidak disimpan/dikirim |
| F6 | Akun & progres | Tamu di `localStorage`; email + Google (Supabase); migrasi tamu → akun (status terjauh, statistik dijumlah); antrean offline; keluar = tamu kosong |
| F7 | Profil | 5 huruf rasio salah tertinggi (≥ 3 percobaan); akun (keluar, hapus); tentang & atribusi dataset/font |

Keadaan gagal scanner (izin kamera, tidak ada baris, keyakinan rendah, model memuat,
tanpa WebGPU) ada di sumber, bagian F5.

## 5. Aturan Bisnis

| ID | Aturan |
| --- | --- |
| BR-01 | Foto dan hasil scan tidak keluar dari perangkat dan tidak disimpan |
| BR-02 | Konten belajar = JSON statis; database hanya data milik pengguna |
| BR-03 | RLS: pengguna hanya membaca/menulis barisnya sendiri; hapus akun menghapus semua barisnya |
| BR-04 | Transliterasi: *ha* di awal kata dibaca *a*; keluaran per suku kata |
| BR-05 | Atribusi wajib di halaman Tentang (CC BY 4.0, CC BY-SA 4.0, OFL, MIT) + sitasi NusaAksara; dataset non-komersial hanya untuk tugas kuliah |

## 6. Kebutuhan Non-Fungsional

Lebar 360–430 px (rapi di tablet/desktop) · Chrome Android & Safari iOS terbaru ·
halaman pertama ≤ 3 dtk di 4G · cek tulisan ≤ 200 ms · scan ≤ 3 dtk ·
bundle awal ≤ 500 KB gzip tanpa model · materi & latihan jalan offline setelah model tercache ·
tanpa analitik pihak ketiga · bahasa Indonesia · sentuh ≥ 44 px, aksara besar (Noto Sans Javanese), label pembaca layar.

## 7. Milestone

| Periode | Titik periksa |
| --- | --- |
| Akhir Okt | Jalur + materi bisa dipakai (tamu) |
| Pertengahan Nov | Latihan menulis berfungsi |
| Pertengahan Des | Scanner end-to-end |
| 14–27 Des | Penyempurnaan, uji pengguna (SUS ≥ 68, ≥ 80% tugas selesai) |
| Awal Jan | Laporan, video demo |

## 8. Pertanyaan Terbuka

Lihat `ARSITEKTUR.md` bagian 7.
