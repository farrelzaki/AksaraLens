# Design System — AksaraLens

> Pemilik: Choirun (UI/UX). Disusun dari analisis halaman **UI** pada Figma
> [AksaraLens – COMVIS – CITRA](https://www.figma.com/design/3CUJcLrJ7j6H7GAk2sTq49/AksaraLens---COMVIS---CITRA?node-id=0-1)
> (fileKey `3CUJcLrJ7j6H7GAk2sTq49`). Menggantikan templat kosong `docs/DESIGN_SYSTEM.md`.
> Semua nilai visual di kode harus berasal dari token di dokumen ini.

Status: **draf v1** · Tanggal: 22 Okt 2026 · Rujukan gaya: Duolingo (jalur titik), Photomath (bingkai/uraian), Write It! Japanese (kanvas)

Penanda: `[Dari Desain]` nilai diambil apa adanya dari Figma · `[Disesuaikan]` nilai Figma dirapikan/ditingkatkan (alasan dicatat) · `[Improvisasi]` tidak ada di Figma, dirancang di sini · `[Estimasi]` dibaca dari tangkapan layar, perlu dicek ulang ke Figma · `[Perlu keputusan]` bertentangan dengan PRD v1.1.

---

## 0. Cara membaca dokumen ini

1. **Ukuran Figma tampak kecil.** Bingkai desain berukuran 412 × 917 (Android Compact), tetapi banyak teks diset 9–12 px dan nilai bukan bilangan bulat (10,27 / 12,33 / 14,38 …) karena frame hasil skala. Jika dipindahkan apa adanya, teks bantu terbaca ≤ 10 px di ponsel, di bawah syarat aksesibilitas PRD. Maka setiap tabel punya kolom **Figma (mentah)** dan **Token (dipakai di kode)**; token sudah dibulatkan ke grid 4 px dan teks terkecil dinaikkan ke 12 px (overline 11 px).
2. Satuan di kode memakai `px`/`rem` (1 rem = 16 px). Lebar acuan layar 412 px; tetap rapi 360–430 px.
3. Nama token berbahasa Inggris pendek (konvensi CSS), label UI berbahasa Indonesia.
4. Nama merek di Figma: **AksaraLensa.** (lockup) / "Aksara Lensa" (header). Nama repo/PRD: **AksaraLens**. Pakai "AksaraLens" di teks biasa, lockup hanya di logo.

### Sumber di Figma (halaman UI)

| Bagian | Node | Isi |
| --- | --- | --- |
| Design Guide | `93:6513` | 4 warna merek, lockup, maskot Aksa, font Plus Jakarta Sans |
| ONBOARDING SCREEN | `66:5735` | 3 layar pengenalan |
| SPLASH SCREEN | `66:5736` | Splash (belum dianalisis rinci) |
| LOGIN & REGIST | `66:5737` | Intro, daftar, masuk |
| LENSA AKSARA | `66:5738` | Kamera, bingkai, sheet hasil |
| HOMEPAGE | `66:5739` | Beranda + 3 varian navbar |
| PROGRES SAYA | `72:7400` | Profil, edit profil, modal avatar |
| LATIHAN (HOME) | `84:2007` | Jalur belajar per bab (3 tema warna) |
| LATIHAN BAB 1 | `93:6101` | Layar pelajaran: kenali, pilih, ingat, tulis, kuis |

### Lokasi Berkas Aset & Hasil Desain

Seluruh berkas pendukung dan hasil akhir desain disimpan di direktori berikut:

- **Aset `.csv` Desain (`design/assets-csv/`)**: Menyimpan seluruh berkas aset `.csv` untuk keperluan desain (token desain, palet warna, tipografi, spasi, dan tabel spesifikasi).
- **Hasil Final Desain UI/UX (`design/uiux/`)**: Menyimpan seluruh hasil final desain UI/UX, mockup layar aplikasi, wireframe, serta ekspor Figma (PNG, SVG, PDF).

---

## 1. Prinsip

Batasan dari PRD yang sudah pasti:

1. Mobile-first 360–430 px; tetap rapi di tablet/desktop (konten dibatasi lebar 480 px, di tengah — sesuai `.shell` di `app.css`).
2. Navbar bawah 3 tab; disembunyikan di pelajaran, latihan, dan proses scan (`handle.layarPenuh`).
3. Aksara tampil besar dengan Noto Sans Javanese (kelas `aksara`, `lang="jv"`).
4. Sentuh ≥ 44 px, kontras teks memadai, label pembaca layar.
5. Tanpa gamifikasi (poin, streak, liga, lencana).

Karakter visual yang terbaca dari Figma:

- **Hangat dan bersahabat**: krem, cokelat tua, hijau sage; maskot **Aksa** (kepala hijau lime berblangkon batik) menemani setiap tahap.
- **Bulat dan lembut**: sudut besar (16–24 px), tombol pil, kartu putih berbingkai tipis.
- **Satu aksi utama per layar**: satu tombol solid besar di bawah (cokelat atau zaitun).
- **Bahasa santai**: sapaan "kamu", kalimat pendek ("Pelan-pelan juga sampai. Yang penting mencoba.").

---

## 2. Warna

### 2.1 Palet inti `[Dari Desain]`

Empat warna merek dari Design Guide, ditambah warna turunan yang dipakai berulang di layar.

| Token | Hex | Pemakaian |
| --- | --- | --- |
| `--color-cream` | `#F7F4F1` | Latar halaman utama (guide #1); teks di atas cokelat |
| `--color-brown` | `#4D3423` | Teks utama, tombol utama (auth/beranda), tab aktif, latar onboarding (guide #2) |
| `--color-sage` | `#9CAF6C` | Kartu hero, bab 1, garis bawah judul, bola dekorasi (guide #3) |
| `--color-mint` | `#E7EDDA` | Permukaan tint: latar kotak aksara, chip, banner info, latar login (guide #4) |
| `--color-olive` | `#52632F` | Tombol utama di pelajaran, progres, teks aksen/overline |
| `--color-olive-dark` | `#384520` | Teks di atas sage (overline hero) |
| `--color-lime` | `#A8D800` | Kulit maskot, latar daftar, latar chip maskot |
| `--color-lime-bright` | `#B9EC00` | Field input di atas latar lime |
| `--color-lime-soft` | `#D2ED7D` | Perut maskot |
| `--color-white` | `#FFFFFF` | Kartu, input, opsi jawaban |
| `--color-welcome` | `#FFFBEA` | Latar intro (selamat datang) |

### 2.2 Teks dan garis

| Token | Figma (mentah) | Token (dipakai) | Rasio kontras | Catatan |
| --- | --- | --- | --- | --- |
| `--text-primary` | `#4D3423` | `#4D3423` | 10,5 : 1 di krem | `[Dari Desain]` |
| `--text-muted` | `#746A62` | **`#6B6159`** | 5,5 : 1 di krem; 5,0 : 1 di mint | `[Disesuaikan]` Figma 4,8 : 1 di krem tetapi 4,4 : 1 di mint (gagal AA). Digelapkan sedikit |
| `--text-subtle` | `#8B907E` `#929681` `#8E9178` | **`#6B6F58`** | 4,7 : 1 di krem; 5,2 : 1 di putih | `[Disesuaikan]` Figma hanya 3,0–3,2 : 1 (gagal). Dipakai untuk bantuan, placeholder, label titik terkunci. Jangan di atas mint |
| `--text-accent` | `#52632F` | `#52632F` | 6,0 : 1 di krem; 5,5 : 1 di mint | `[Dari Desain]` |
| `--text-on-dark` | `#F1E7DC` | `#F1E7DC` | 9,4 : 1 di cokelat | `[Dari Desain]` |
| `--text-on-brown` | `#F7F4F1` `#FFFBEA` | `#F7F4F1` | 10,5 : 1 | `[Dari Desain]` |
| `--text-on-lime-label` | `#405602` | `#405602` | 4,9 : 1 di `#A8D800` | `[Dari Desain]` |
| `--text-on-lime-hint` | `#5C7715` | **`#44570A`** | 5,8 : 1 di `#B9EC00` | `[Disesuaikan]` Figma 3,7 : 1 |
| `--text-on-mint-hint` | `#7B7D63` | **`#5F6347`** | 5,2 : 1 di mint | `[Disesuaikan]` Figma 3,5 : 1 (teks "atau gunakan email", "Belum punya akun?" di layar masuk) |
| `--border` | `#E5DED7` | `#E5DED7` | — | Garis kartu, input, navbar `[Dari Desain]` |
| `--border-strong` | `#DCD4CA` | `#DCD4CA` | — | Tombol ikon bulat `[Dari Desain]` |
| `--border-input-light` | `#DEDFC5` | `#DEDFC5` | — | Input di latar mint `[Dari Desain]` |
| `--divider-on-lime` | `#7E9D3C @31%` | `rgba(126,157,60,.31)` | — | Garis "atau gunakan email" |

### 2.3 Semantik

| Token | Hex | Pemakaian |
| --- | --- | --- |
| `--success-text` | `#46612E` | Teks "Tepat! Dibaca ha." (6,2 : 1 di `#EDF4DF`) |
| `--success-bg` | `#EDF4DF` | Latar opsi benar `[Estimasi]` |
| `--success-border` | `#8EAF62` | Garis opsi benar |
| `--error-text` | `#964632` | Teks "Belum tepat…" (5,9 : 1 di `#FFF0EA`) |
| `--error-bg` | `#FFF0EA` | Latar opsi salah |
| `--error-border` | `#DC9B8C` | Garis opsi salah |
| `--warning` / `--orange` | `#EE851B` | Aksen oranye (kilau ✦, buku onboarding) |
| `--orange-soft` | `#FFF0DF` | Latar ilustrasi bab 2, ikon kunci, tombol Logout |
| `--orange-text` | `#91511E` | Teks Logout (5,5 : 1 di `#FFF0DF`) |
| `--orange-border` | `#E1CBB5` | Garis tombol Logout |

Status **tidak boleh hanya warna**: Figma sudah menambah ikon ✓ / ✕ / ↻ dan teks; pertahankan.

### 2.4 Tema per bab `[Dari Desain]` kecuali dicatat

| Bab | Aksen (hero, node aktif) | Tint (latar ilustrasi) | Node terkunci | Ikon terkunci | Jalur |
| --- | --- | --- | --- | --- | --- |
| 1 Nglegena | `#9CAF6C` | `#E7EDDA` | `#E6E8DB` | `#CACDC0` | `#D5DDC2` |
| 2 Sandhangan | `#FFD263` | `#FFF0DF` | `#E6E8DB` | `#CACDC0` | `#E0DBBE` `[Estimasi]` |
| 3 Panyigeg & Pangkon | `#BBA4EF` | `#F0EAFB` | `#E1DBE8` | `#C7C0CD` | `#D8C5E0` `[Estimasi]` |

Teks di atas aksen: cokelat `#4D3423` — 4,8 : 1 (sage), 8,0 : 1 (kuning), 5,3 : 1 (ungu). Teks **kecil** di atas sage (≤ 14 px) sebaiknya diganti `--olive-dark` `#384520` atau dibuat tebal.

Warna dekorasi: `#9382BB` (lingkaran ungu intro), `#FFD263` (ikon fokus scan), `#4B6130` (titik overline hero), `#D5DAC4`/`#D1C4DA` (aksara & ✦ dekoratif jalur).

### 2.5 Mode kamera (gelap) `[Dari Desain]`

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `--cam-bg` | `#302820` | Latar kamera |
| `--cam-overlay` | gradien vertikal `#25190F @50% → @0% → … → @87%` | Penggelap atas dan bawah |
| `--cam-text` | `#FFFAF3` / `#E0D6CA` / `#D0C6B9` | Judul / isi / catatan kecil |
| `--cam-chip-bg` | `#FFFFFF @8%` + garis `#FFFFFF @13%` | Tombol ikon bulat di atas kamera |
| `--cam-corner` | hijau muda `#D5E6B0` `[Estimasi]` | Sudut bingkai bidik |

---

## 3. Tipografi

### 3.1 Keluarga font

| Peran | Font | Bobot | Sumber di Figma |
| --- | --- | --- | --- |
| Judul, tombol auth/beranda, label bab | **Plus Jakarta Sans** | 400 500 600 700 800 | Design Guide (font resmi) |
| Isi, label form, nav, tombol pelajaran | **Atkinson Hyperlegible** | 400 700 | Dipakai di 49% teks halaman UI |
| Aksara Jawa | **Noto Sans Javanese** | 400 700 | Ditetapkan PRD; di Figma sebagian glif masih memakai font pengganti (lihat catatan di bawah) |
| Cadangan | `system-ui, sans-serif` / `serif` (aksara) | — | — |

Catatan temuan Figma:

- Beberapa glif aksara di Figma memakai **Inter** (kotak pilih bentuk) dan **Tinos** (kertas scan, dekorasi jalur). Itu hanya penampung; di kode **semua aksara memakai Noto Sans Javanese** agar sama dengan data latih/PRD.
- Dua font teks (Plus Jakarta Sans + Atkinson) **sengaja dipertahankan** karena Atkinson Hyperlegible dirancang untuk keterbacaan huruf mirip (cocok untuk "ha/la", "ca/ra"). Aturan: Plus Jakarta Sans = tampil/merek; Atkinson = baca/isi/UI kecil.
- Ketiganya berlisensi OFL → wajib dicantumkan di halaman **Tentang & sumber data** (PRD BR-05).
- Muat font lewat paket self-host (mis. `@fontsource/*`) agar tidak ada permintaan ke pihak ketiga (PRD: tanpa pihak ketiga). Menambah dependency → perlu persetujuan sesuai `AGENTS.md` §7. Subset Noto Sans Javanese (blok U+A980–A9DF) supaya ringan.

### 3.2 Skala tipe

`ls` = letter-spacing. Ukuran Figma sudah dibulatkan di kolom kedua.

| Token | Font · bobot | Figma mentah → Token (ukuran / tinggi baris) | ls | Pemakaian |
| --- | --- | --- | --- | --- |
| `display-xl` | PJS 800 | 45,4/50,9 → **44 / 48** | −0,04em | Judul onboarding ("Cerita besar. Mulai dari satu aksara.") |
| `display-lg` | PJS 800 | 41,3/45,4 → **40 / 44** | −0,04em | Judul intro ("Yuk, mulai cerita aksaramu!") |
| `display-md` | PJS 800 | 31,9/36 · 30,8/34,8 → **32 / 36** | −0,04em | Judul daftar / masuk |
| `heading-1` | PJS 700 | 25,7/33,4 · 26,7/32,1 · 28,7/37,3 → **28 / 36** | −0,03em | Pertanyaan pelajaran, judul bab, nama profil |
| `heading-2` | PJS 700 | 18,5/27,7 · 17,4/26,1 · 19/28,5 → **20 / 28** | −0,03em | "Pilih bab belajarmu", "Perjalanan belajarmu", judul modal |
| `heading-3` | PJS 700 | 14,4/21,6 · 15,4/23,1 · 13/19,5 → **16 / 24** | −0,02em | Judul kartu bab, "Informasi profil" |
| `title-sm` | PJS 600–700 | 12/18 · 13,4 · 12,3/18,5 → **14 / 20** | −0,02em | Label titik jalur, judul header kecil, "Langkah pertamamu menunggu" |
| `body-lg` | Atkinson 400 | 14,4/21,6 → **16 / 24** | 0 | Paragraf intro |
| `body` | Atkinson 400 | 11,3/16,4–19,7 · 12,3/18,5 → **14 / 22** | 0 | Paragraf, deskripsi, status benar/salah (700) |
| `body-sm` | Atkinson 400 | 10,3/15,4 · 10/15 → **13 / 20** | 0 | Sub-judul kartu, label form, tautan kecil |
| `caption` | Atkinson 400 | 9,2/13,9 · 9/13,5 · 8/11,2 → **12 / 18** | 0 | Catatan kaki, "5 dari 5 latihan selesai", label nav |
| `overline` | PJS/Atkinson 700 CAPS | 7–9,2 ls 0,7–1,5 → **11 / 16** | +0,12em | "BAB 01 · KENALI", "KENALAN DULU", "MULAI DI SINI" |
| `button-lg` | Atkinson 700 | 14,4/20,5 → **16 / 24** | 0 | Tombol utama pelajaran |
| `button-auth` | PJS 700 | 16 → **16 / 24** | 0 | Tombol Daftar/Masuk |
| `button-md` | PJS 600 | 10,3–12,3 → **14 / 20** | 0 | Tombol sekunder, pil "Lanjut", Google |
| `option` | Atkinson 700 | 14,4/20,5 → **16 / 24** | 0 | Teks opsi jawaban |
| `timer` | Atkinson 700 | 11,3/17 → **14 / 20** | 0 | Waktu belajar; wajib `font-variant-numeric: tabular-nums` |

> Teks terkecil di Figma (5,5–8 px: "CATATAN AKSARA JAWA" pada kertas ilustrasi) adalah bagian gambar contoh, **bukan** UI; boleh tetap kecil.

### 3.3 Aksara (Noto Sans Javanese) `[Disesuaikan]`

Tinggi baris harus ≥ 1,5 karena sandhangan menumpuk di atas/bawah. Jangan pernah memotong dengan `overflow: hidden` di sekitar aksara.

| Token | Figma | Token | Pemakaian |
| --- | --- | --- | --- |
| `aksara-xl` | 98,6/160,3 Regular | **96 / 1,6** | Kartu "kenalan huruf" |
| `aksara-lg` | 78,1/126,9 Regular | **72 / 1,6** | Soal "aksara ini berbunyi apa?" |
| `aksara-md` | 26,9/40,4 Bold | **32 / 1,5, 700** | Ubin suku kata (Kaji lebih dalam), opsi bentuk |
| `aksara-sm` | 24/36 Regular | **24 / 1,5** | Opsi jawaban berbentuk aksara, daftar materi |
| `aksara-result` | 24,5/53,8 (Tinos) | **28 / 2,0** | Baris hasil scan (tinggi baris besar karena baris panjang) |

Warna aksara: `--text-primary`; di kanvas latihan, goresan pengguna `#4D3423` tebal 8–10 px (bulat), huruf contoh (hantu) `#D4CCBB` `[Dari Desain]`.

---

## 4. Spasi, radius, bayangan, ukuran

### 4.1 Spasi (grid 4 px) `[Disesuaikan]`

Figma memakai 4,1 / 6,2 / 8,2 / 12,3 / 16,4 / 24,7 (kelipatan 4,1 ×1,5/2/3/4/6 dari skala). Dibulatkan:

| Token | Nilai | Padanan Figma | Dipakai untuk |
| --- | --- | --- | --- |
| `space-1` | 4 | 4,1 | Celah ikon–teks kecil |
| `space-2` | 8 | 8,2 | Celah label–field, antar chip |
| `space-3` | 12 | 12,3 | Celah antar opsi, header, kartu |
| `space-4` | 16 | 15,4–16,4 | Padding kartu/tombol, celah blok |
| `space-5` | 20 | 20,5 | Padding kartu bab, antar seksi kecil |
| `space-6` | 24 | 23,6–24,7 | Margin layar beranda/auth, padding hero |
| `space-8` | 32 | 31,9 | Jarak antar seksi |
| `space-10` | 40 | — | `[Improvisasi]` jarak besar (empty state) |

Margin layar: **24 px** (beranda, auth, profil, jalur) · **16 px** (layar pelajaran — kartu putih hampir selebar layar).

### 4.2 Radius `[Disesuaikan]`

| Token | Nilai | Padanan Figma | Dipakai untuk |
| --- | --- | --- | --- |
| `radius-xs` | 6 | 6,2 | Titik progres, tag "MULAI DI SINI" (7), checkbox (2→4) |
| `radius-sm` | 8 | 9 | Tombol kecil modal |
| `radius-md` | 12 | 12,3 | Tombol ikon persegi, opsi jawaban, pager |
| `radius-lg` | 16 | 15,4–16,4 | Tombol besar, kotak aksara, input (14→16), ubin avatar (15→16) |
| `radius-xl` | 24 | 23–25 | Kartu bab, hero, kartu pelajaran, modal, sheet |
| `radius-card` | 20 | 18–19,5 | Kartu statistik/profil, ilustrasi bab (16–18) |
| `radius-full` | 999 | 20–43, 36086060 | Pil, tombol bulat, navbar (40), progress bar, avatar |

### 4.3 Bayangan `[Dari Desain]`

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `shadow-card` | `0 12px 30px rgba(77,52,35,.04)` | Kartu pelajaran putih besar |
| `shadow-card-lip` | `0 3px 0 rgba(77,52,35,.02)` | Kartu bab (beranda) — nyaris tak terlihat |
| `shadow-nav` | `0 7px 26px rgba(73,48,30,.09)` + `backdrop-filter: blur(24px)` | Navbar mengambang |
| `shadow-cta` | `0 3px 0 rgba(77,52,35,.17)` | Tombol utama pelajaran (efek "tebal" gaya Duolingo) |
| `shadow-avatar` | `0 5px 14px rgba(77,52,35,.07)` | Tombol ganti avatar |
| `shadow-bubble` | `0 4px 0 #E7E6D5` atau `0 4px 0 rgba(33,22,15,.13)` | Balon bicara Aksa |
| `shadow-modal` | `0 20px 70px rgba(36,21,14,.19)` | Modal avatar, sheet hasil |
| `shadow-sheet-up` | `0 -8px 30px rgba(0,0,0,.13)` | Sheet bawah onboarding/scan |

### 4.4 Ukuran kontrol (target sentuh ≥ 44 px)

| Elemen | Figma | Token |
| --- | --- | --- |
| Tombol ikon (kembali, aksi header) | 41 × 41 (profil 37–42) | **44 × 44** `[Disesuaikan]` |
| Tombol utama pelajaran | 380 × 49,3 | tinggi **52**, lebar penuh |
| Tombol auth / CTA besar | 343 × 54,5 | tinggi **56** |
| Tombol sekunder / Google | 349 × 51 | tinggi **52** |
| Pil "Lanjut" (onboarding) | 102 × 51,4 | tinggi **52**, radius full |
| Pil kecil ("Mulai belajar", "Mulai pelajaran pertama") | 138 × 40, 193 × 39 | tinggi **44** `[Disesuaikan]` |
| Input teks | 349 × 51,4 | tinggi **52** |
| Opsi jawaban | 345 × 55,5 | tinggi min **56** |
| Pager (‹ ›) | 41 × 41 | **44 × 44** |
| Navbar | 365 × 72,6 (link 111 × 58) | tinggi **72**, tiap tab ≥ 44 tinggi |
| Node jalur | 86 × 86 | **88 × 88** |
| Tombol rana kamera | 70,7 (cincin 2,1) | **72**, cincin 3 |
| Avatar | 212 (profil) · 112 (edit) · 68 / 62 (modal) | sama |

---

## 5. Tata letak dan breakpoint

| Hal | Nilai |
| --- | --- |
| Bingkai acuan | 412 × 917 (tinggi bervariasi; konten bisa menggulir) |
| Lebar kerja | 360–430 px; di atas itu `.shell` dibatasi **max-width 480 px**, di tengah |
| Margin layar | 24 px (16 px pelajaran) |
| Kolom | Satu kolom; kecuali: statistik 3 kolom sama lebar, ubin suku kata dan avatar 4 kolom (`grid`, celah 8) |
| Navbar | Mengambang: `position: sticky/fixed; bottom: 16px + env(safe-area-inset-bottom)`, lebar layar − 48 px, pil 72 px. Beri `padding-bottom` ±118 px pada konten agar tidak tertutup |
| Layar penuh | Pelajaran, latihan, scan aktif: tanpa navbar, tombol keluar/kembali di kiri atas |
| Header layar | Tinggi 44, kiri tombol ikon, tengah judul `title-sm`, kanan aksi opsional |
| Breakpoint | `--bp-sm: 360px`, `--bp-md: 430px`, `--bp-tablet: 768px`. Di ≥ 768 px tetap tampilan ponsel di tengah dengan latar `--color-mint` di sisi |
| Safe area | `viewport-fit=cover` sudah ada di `index.html`; pakai `env(safe-area-inset-*)` pada navbar dan footer pelajaran |

Struktur layar pelajaran (dari Figma): latar mint di atas (±40% tinggi, bawahnya melengkung/tajam), kartu putih (`radius-xl`) berisi chip + maskot, judul, status, kotak aksara, opsi; **footer** berisi tombol utama + catatan kecil ("Belajar pelan-pelan, tidak perlu terburu-buru.").

---

## 6. Komponen

Tiap komponen: anatomi → ukuran/format → state. Nilai = **Token**; Figma mentah di kurung bila beda.

### 6.1 Maskot Aksa & merek

| Elemen | Spesifikasi |
| --- | --- |
| Lockup | "**Aksara**" Plus Jakarta Sans Bold + "Lensa" PJS Regular/Light ukuran sama + titik "." `#9CAF6C` (hanya pada versi besar). Header auth: kotak 81 × 22 (≈ 18 px). `[Estimasi]` bobot "Lensa", cek ke Figma |
| Kepala maskot | Warna `#A8D800`, mata putih besar + pupil `#0B1035`/cokelat, blangkon batik cokelat. Aset gambar → ekspor SVG dari Figma (node maskot `93:6533`), jangan digambar ulang |
| Chip maskot (header kartu) | 37 × 33, `radius-md`, latar `#A8D800` |
| Balon bicara | Latar `#F7F4F1`/`#FFFEF5`, teks `button-md` 600 `#4D3423` (≈ 12 px → **13**), padding 11/15, radius full-ish (≥ 16), `shadow-bubble`; ekor kecil. Pesan contoh: "Oh, ini "ha"!" |
| Sparkle ✦ | Teks, `#789421` / `#EE851B` / `#D5DAC4` |

### 6.2 Tombol

| Varian | Latar | Teks | Garis | Tinggi · radius | Dipakai di |
| --- | --- | --- | --- | --- | --- |
| **Primary-brown** | `#4D3423` | `#FFFBEA`, PJS 700 16 | `#4D3423` 1 | 56 · `radius-lg` | Daftar sekarang, Daftar, Masuk |
| **Primary-olive** | `#52632F` | `#FFFFFF`, Atkinson 700 16 + ikon → 18 | — | 52 · `radius-lg`, `shadow-cta` | Footer pelajaran ("Periksa jawaban", "Tantangan berikutnya", "Mulai 3 tantangan") |
| **Pill-brown** | `#4D3423` | `#F7F4F1`/`#FFF`, PJS 600 14 + panah 20 | — | 44–52 · full | Lanjut, Mulai sekarang, Mulai belajar, Mulai pelajaran pertama |
| **Secondary-outline** | transparan | `#52632F`, PJS 700 14–16 | `#9CAF6C` 1 | 56 · `radius-lg` | "Sudah punya akun? Masuk" |
| **Google** | `#FFFEF6` | `#0B1035`/`#4D3423`, PJS 600 14 + logo G 20 | `#97AB67 @38%` 1 | 52 · `radius-lg` | Daftar/Masuk dengan Google |
| **Ghost-dark** (kamera) | transparan | `#E3EFCA`, Atkinson 14 | `#AABD7E @40%` 1 | 44 · full | "Coba buka kamera" |
| **Text / tautan** | — | `#6B6159`/`#52632F`, PJS 500 12–14 | — | ≥ 44 area sentuh | "Jelajahi dulu tanpa akun →", "Batal", "Pelajari di materi →", "Lewati" |
| **Soft-warning** | `#FFF0DF` | `#91511E`, Atkinson 16 + ikon keluar | `#E1CBB5` 1 | 52 · `radius-lg` | Logout |
| **Primary-compact** (modal) | `#4D3423` | `#F7F4F1`, PJS 600 14 + ✓ | — | 44 · `radius-md` | "Pakai avatar ini", "Simpan perubahan", "Periksa perubahan" |

State semua tombol:

- **Hover/pressed**: gelapkan 8% (olive → `#46562A`, brown → `#3F2A1C`); `shadow-cta` mengecil jadi `0 1px 0` dan elemen turun 2 px `[Improvisasi]`.
- **Focus-visible**: cincin 3 px `#52632F` + jarak 2 px (di latar gelap `#E3EFCA`) `[Improvisasi]`.
- **Disabled** (tombol footer sebelum memilih): latar `#C9CDB8`, teks `#FFFFFF`/`#6B6F58`, tanpa bayangan, `aria-disabled` `[Disesuaikan]` — Figma memakai abu-hijau pucat serupa.
- **Loading**: spinner 18 px menggantikan ikon panah, lebar tetap.

Tombol ikon:

| Varian | Spesifikasi |
| --- | --- |
| Bulat putih transparan (header pelajaran/profil) | 44, latar `#FFFFFF @80%` (`#FFFDF6 @31%` + garis `#DCD4CA` di beranda), radius `radius-md` (pelajaran) atau full (jalur/profil) |
| Bulat di kamera | 44, `rgba(255,255,255,.08)` + garis `rgba(255,255,255,.13)`, ikon `#FFFAF3` |
| Rana kamera | 72, cincin `#F7F4F1` 3, isi `#F7F4F1` 56 (tekan: 52) |
| Tutup (modal) | 44 area, ikon ✕ 20 |
| Ikon | Garis 1,7–1,9 px, kotak 20–24, gaya outline membulat (set Lucide-like: book-open, scan-line, trending-up, arrow-left/right, eye, brain, pencil, sparkles, lock, camera-off, image-plus, check, x, rotate-ccw, eye/eye-off, settings, log-out, shield-check, sprout, layers) |

### 6.3 Navbar bawah (kapsul mengambang)

| Properti | Nilai |
| --- | --- |
| Wadah | 365 × 72, latar `#FFFDFA @94%` + blur 24, garis `#E5DED7` 1, radius full (40), `shadow-nav`, padding 7 |
| Tab | 111 × 58, radius full (28), kolom: ikon 20 + label, celah 5, padding 9 / 8 |
| Label | `caption` 12 (Figma 10), Atkinson 400; aktif Atkinson 700 `[Improvisasi]` |
| Normal | ikon + label `#6B6159` (Figma `#746A62`) |
| Aktif | latar `#4D3423` pil, ikon + label `#F7F4F1`; transisi geser 200 ms |
| Tab | **Belajar** (book-open) · **Lensa Aksara** (scan-line) · **Progres Saya** (trending-up) — lihat bagian 8 |
| Aksesibilitas | `<nav aria-label="Navigasi utama">`, `aria-current="page"` pada tab aktif (React Router `NavLink` sudah menambahkannya) |

Padanan kode: `AppShell.tsx` memakai `.navbar a.active`; ubah gaya di `app.css` (kelas `.navbar`, `.navbar a`, `.navbar a.active`).

### 6.4 Header layar

| Varian | Isi | Spesifikasi |
| --- | --- | --- |
| Beranda | Avatar 44 (latar mint, ikon sprout `#52632F`) + "Sugeng rawuh 👋" (`body-sm` muted) + "Halo, {nama}!" (`title-sm` 700 PJS 16/22) | Padding atas 26, samping 24 |
| Pelajaran | ‹ tombol 44 · "BAB 01 · KENALI" (`overline`, `#52632F`) di atas "Tahap 1 / 5" (`body` 700) · chip timer di kanan | Celah 12; tinggi 44 |
| Jalur/Profil/Edit | ‹ · judul tengah `title-sm` (Edit Profil: `heading-1` 24/32) · aksi kanan (grafik / gigi) | Tombol bulat 44 |
| Kamera | ‹ · judul "Lensa Aksara" `heading-2` 20 `#FFFAF3` + subjudul `body-sm` `#F0E8DF` ("Arahkan. Foto. Pahami.") · ikon scan | Latar gelap + gradien |
| Intro/Onboarding | ← tombol bulat 40 (garis `#8C9DDD @50%` → ganti `#F1E7DC @50%` `[Disesuaikan]`) · "AKSARA LENSA" overline ls 0,16em `#F1E7DC` · "Lewati" `body-sm` | Latar cokelat |

**Chip timer**: latar `#FFFFFF @75%`, radius full, padding 8/10, ikon jam 14 + `timer` 14 700. Lebar tetap agar angka tidak menggeser header (`tabular-nums`).

### 6.5 Progress

| Varian | Track | Isi | Tinggi | Pemakaian |
| --- | --- | --- | --- | --- |
| Tahap pelajaran | `rgba(0,0,0,.10)` | `#52632F` | 8, radius full | Di bawah header + "0 / 3" (`caption` 700 olive) di kanan |
| Kartu bab | `#ECE8E0` | `#52632F` (bab selesai) / `#9CAF6C` | 6 | Kartu bab beranda & profil |
| Hero bab (jalur) | `#FFFFFF @25%` | `#4D3423` | 6 | Di kartu warna bab |
| Ringkasan profil | `#F7F4F1` | `#9CAF6C` | 11 | "5 / 15 … 33%" |

Semua memakai `role="progressbar"` + `aria-valuenow/min/max` dan label. Animasi isi 300 ms ease-out; hormati `prefers-reduced-motion`.

### 6.6 Chip, badge, tag

| Komponen | Spesifikasi |
| --- | --- |
| Chip eyebrow ("KENALAN DULU", "SOAL 01", "LATIHAN 01") | Latar `#E7EDDA`, radius full, padding 4/10 (→ 6/12), ikon 12 + `overline` 11 `#52632F` |
| Badge bab ("BAB 01") | Latar `#FFFFFF @66%`, radius full, `overline` 11 `#4D3423`, padding 5/9 |
| Tag "MULAI DI SINI" | Latar `#4D3423`, teks `#FFFFFF`, `overline`, `radius-xs` 7, padding 7/10, melayang di atas node aktif |
| Penghitung ("3 BAB ≡") | `caption` 700 CAPS ls 0,08em `#6B6159` + ikon layers 13 |
| Pil "TAHAP SELESAI" | Latar `#E7EDDA`, ikon ✓, `overline` 11 olive, padding 8/14, radius full |
| Tag aksesori avatar | 18 × 18, radius 5 (satu varian bulat), isi warna aksen (`#FFF6D9` `#EE851B` `#4D3423` `#EEE5FB` `#FFD263` `#6C8146`), `0 1px 4px rgba(77,52,35,.13)` |

### 6.7 Input & formulir

**Label** di atas field: `body-sm` → Figma PJS 600 9,2 → **13/18, PJS 600**, jarak ke field 6, indent kiri 4. Warna `#405602` (di lime) / `#5C5F47` (di mint/putih; 6,8 : 1).

| Variasi | Latar field | Garis | Placeholder | Teks isi |
| --- | --- | --- | --- | --- |
| Di latar mint (login/edit) | `#FFFFFF` | `#DEDFC5` 1 | `#6B6F58` (Figma `#8E9178` 3,2 : 1) | `#4D3423` |
| Di latar lime (daftar) | `#B9EC00` | `#97BA18 @19%` 1 | `#44570A` (Figma `#5C7715` 3,7 : 1) | `#4D3423` |
| Di kartu putih (edit profil) | `#F7F4F1` `[Estimasi]` | `#E5DED7` | `#6B6F58` | `#4D3423` |

Ukuran: tinggi **52**, radius `radius-lg` 16 (Figma 14,4), padding 16 (kanan 52 untuk ikon mata), teks `body-lg` 16 PJS 400 (Figma 12,3 → 16 agar iOS tidak memperbesar halaman saat fokus).

State:

| State | Spesifikasi |
| --- | --- |
| Default | seperti tabel |
| Focus | garis 2 px `#52632F` (di lime: `#44570A`), tanpa bayangan; jangan hanya mengganti warna latar |
| Error | garis `#964632` 2 + ikon + pesan `caption` `#964632` di bawah, `aria-invalid`, `aria-describedby` `[Improvisasi]` |
| Disabled | latar `#ECE8E0`, teks `#6B6F58` |
| Readonly (info profil) | tanpa kotak; label `caption` + nilai `body` |

Komponen terkait:

- **Tombol mata** (tampilkan sandi): 44 × 44 di kanan dalam field, ikon eye/eye-off 20 `#52632F`; `aria-label="Tampilkan kata sandi"`, `aria-pressed`.
- **Checkbox**: kotak 14 → **20**, radius 4, garis `#767676` 1 → `#52632F` 1,5; terpilih: isi `#52632F` + ✓ putih. Teks `caption` 12 (Figma 9,2); seluruh baris area sentuh 44. Contoh teks: "Saya mengerti ini mode demo, bukan pendaftaran akun sungguhan."
- **Pemisah "atau gunakan email"**: garis 1 px kiri-kanan (`--divider-on-lime`), teks `caption` di tengah, celah 13.
- **Teks bantuan** form: `caption` `#6B6159`, mis. "Perubahan hanya berlaku pada profil demo sesi ini…".
- **Panel ganti kata sandi** (akordeon): kartu putih, ikon kunci pada kotak 37 `#FFF0DF` radius 10, judul `title-sm`, keterangan `caption`; chevron memutar saat buka.

### 6.8 Kartu

| Kartu | Spesifikasi |
| --- | --- |
| **Hero beranda** ("Perjalananmu dimulai di sini") | Latar `#9CAF6C`, radius 24, padding 22–24; overline + titik `#4B6130` 5; judul `heading-1` 28/36 (Figma 25,7 ExtraBold ls −1,8) `#4D3423`; isi `body` `#384520`; CTA Pill-brown; maskot 113 × 108 menyembul di kanan bawah (terpotong tepi kartu) |
| **Kartu bab (beranda)** | Tombol/tautan penuh 356 × 158, putih, garis `#E5DED7`, radius 24, padding 15, `shadow-card-lip`; kiri ilustrasi 108 × 124 (tint bab, radius 18→16); kanan: overline "BAB 01" olive, `heading-3` judul, `body-sm` deskripsi, `caption` "5 dari 5 latihan selesai", progress bar 6; ujung kanan ikon ✓ (selesai) atau → (belum), 18 |
| **Kartu bab (profil)** | 358 × 146, putih, garis, radius 18→20, padding 16; ilustrasi 141 × 112 (radius 16); teks lebih kecil: `heading-3` 14–16; progres bar 6 |
| **Kartu pelajaran** (wadah utama layar belajar) | Putih, garis putih 1, radius 24, padding 16, `shadow-card` (+ lip putih), tinggi mengisi layar |
| **Kartu ringkasan progres** | Putih, radius 24, padding 24/22; paragraf `body` muted, lalu baris: ikon buku (bulat mint 33) + "5 / 15" PJS 700 14→16 olive + bar 11 + "33%" PJS 700 16 olive; keterangan `caption` |
| **Kartu statistik** | Putih, garis `#E5DED7`, radius 20, grid 3 kolom dibatasi garis tipis; per kolom: ikon 20 (olive/oranye/ungu), angka PJS 700 **24** (Figma 22,6) , label `caption` |
| **Banner info** | Latar `#E7EDDA`, radius 16, padding 14/16, ikon sprout + teks `body-sm` `#52632F`; contoh "Selesaikan satu langkah untuk membuka langkah berikutnya." (di bab 2 & 3 banner mengikuti tint bab) |
| **Panel info profil** | Putih, garis, radius 20, padding 20; judul `heading-3` + "✎ Edit" tautan kecil |
| **Kartu hasil tahap** | Tanpa kartu; di dalam kartu pelajaran: chip → maskot 140 → judul `heading-1` tengah → `body` muted → panel statistik mint radius 16 dua kolom (angka PJS 700 22 mono-ish, label `caption`) |

### 6.9 Opsi jawaban (pilihan ganda) — komponen inti

Tinggi min 56, radius `radius-md` 12, padding 0/12, celah 12; struktur kiri→kanan: **huruf opsi** (lingkaran 24 → 28, garis 1, `caption` A/B/C/D) · **teks opsi** (`option` 16 700) · **indikator** (lingkaran 16 → 20 garis `#E5DED7`, atau ikon ✓/✕).

| State | Latar | Garis | Teks | Penanda |
| --- | --- | --- | --- | --- |
| Default | `#FFFFFF` | `#E5DED7` 1 | `#4D3423` | lingkaran kosong |
| Dipilih (belum diperiksa) | `#E7EDDA` | `#52632F` 1,5 | `#4D3423` | titik ● olive |
| Benar | `#EDF4DF` | `#8EAF62` 1 | `#46612E` | ✓ |
| Salah | `#FFF0EA` | `#DC9B8C` 1 | `#964632` | ✕ |
| Terkunci setelah jawab | seperti state hasil, `pointer-events: none` | | | |

Aksesibilitas: grup `role="radiogroup"` + `aria-labelledby` pertanyaan; tiap opsi `role="radio"` `aria-checked`; hasil diumumkan lewat `role="status"` pada baris status.

**Baris status** di bawah pertanyaan: ikon 16 + `body` 700 — benar `#46612E` ("Tepat! Dibaca ha.") · salah `#964632` ("Belum tepat. Pilih jawaban lain.") · netral `#6B6159`. Sesuai PRD F2: jawaban salah **langsung menyebut jawaban benar** → tambahkan "Jawaban benar: ha" pada state salah `[Perlu keputusan]` (Figma hanya menulis "Pilih jawaban lain").

Opsi bentuk aksara (mode "Temukan bentuknya"): sama, teks diganti `aksara-sm` 24.

### 6.10 Kotak aksara & kartu kenalan

| Elemen | Spesifikasi |
| --- | --- |
| Panggung aksara | Latar `#E7EDDA`, radius 16, tinggi 292 (soal) / 472 (kenalan), aksara di tengah (`aksara-lg` / `-xl`) |
| Label bacaan | Pil di bawah aksara: latar `#FFFFFF @70%`, radius full, padding 4/20, `heading-3` 700 ("ha") |
| Pager | Tombol ‹ › 44 × 44 latar `#E7EDDA` radius 12 (nonaktif: opasitas 40%) + tengah "Aksara 1 dari 20" `caption` + tautan "▷ Contoh bentuk" `body-sm` 700 olive |
| Catatan | `caption` muted di bawah: "Animasi bentuk, bukan panduan urutan goresan." (sejalan PRD: urutan goresan tidak dinilai) |

Animasi goresan (materi & kenalan): garis `#4D3423` tebal 8, digambar 600–900 ms, tombol "Putar ulang"; berhenti bila `prefers-reduced-motion` (tampilkan gambar statis).

### 6.11 Kanvas latihan menulis

| Properti | Spesifikasi |
| --- | --- |
| Area | Persegi penuh lebar kartu (345 × ±485 di Figma), latar `#F7F4F1`, garis putus-putus `#E5DED7` 1, radius 16 |
| Huruf contoh (hantu) | Aksara `aksara-xl`, `#D4CCBB`, di tengah; hilang bila pengguna memilih "tanpa contoh" |
| Goresan | `#4D3423`, tebal 9, `lineCap/Join: round`; Pointer Events + `touch-action: none` pada kanvas |
| Garis bantu | Garis tipis `#E5DED7` (silang tengah) sesuai PRD F4 |
| Kontrol | Teks bantuan "Gunakan jari atau mouse untuk menulis." (`body-sm`) + tombol **Hapus** (latar `#F7F4F1`, radius 12, ikon rotate-ccw 18 + teks 16, tinggi 44) di kanan |
| Footer | Tombol "Cek" (primary-olive; nonaktif saat kosong/terlalu kecil: pesan "Tulisan terlalu kecil") dan, setelah hasil, "Latihan berikutnya" |
| Hasil | Status di bawah judul: benar (hijau + ✓) · "Terbaca sebagai *la*" (netral/oranye `#91511E`) · "Belum terbaca, coba lagi" (netral) — sesuai PRD F4. **Tidak pernah memblokir** kemajuan |

`[Perlu keputusan]` Figma menulis "Latihan mandiri · tulisan belum dinilai otomatis" — PRD F4 menetapkan pemeriksaan CNN. Teks harus mengikuti PRD begitu model terintegrasi (T-08).

### 6.12 Jalur belajar (peta titik)

Struktur: header → **kartu bab berwarna** → peta titik zig-zag → banner info → CTA.

| Elemen | Spesifikasi |
| --- | --- |
| Kartu bab | Latar aksen bab, radius 24, padding 24: badge "BAB 01" · judul `heading-1` 28/36 (Figma 26,7 PJS 700 ls −1) · `body` · baris "Sedikit demi sedikit, kamu bisa. … 0%" `caption` · progress bar 6 (`#FFFFFF @25%` / `#4D3423`) |
| Node | Lingkaran 88 (Figma 86), garis `#F7F4F1` 4 (jarak ke jalur), isi: **aktif/terbuka** = aksen bab + ikon di tengah + tombol putar kecil (▶ 27, `#4D3423`, garis `#F7F4F1` 2) di kanan bawah; **terkunci** = `#E6E8DB` (bab 3: `#E1DBE8`) + ikon `#CACDC0` + badge kunci 27 di kanan bawah; **selesai** = aksen bab + ikon ✓ `[Improvisasi]` (Figma belum menggambar) |
| Halo node aktif | Cincin `#91B565 @9%` 8 px di luar `[Dari Desain]` |
| Label node | `title-sm` 14 PJS 700 (aktif `#3F4637`; terkunci `#6B6F58` — Figma `#9CA08E` hanya 2,2 : 1) + subjudul `caption` ("Mengenali · 3 tantangan") |
| Tag | "MULAI DI SINI" di atas node aktif |
| Jalur | Pita lengkung S, tebal ±22, radius penuh, warna jalur bab (bagian 2.4); dibuat SVG, bukan border |
| Dekorasi | Aksara besar `#D5DAC4` (42–48 px) dan ✦ 35 di pinggir, `aria-hidden` |
| CTA bawah | Pill-brown "Mulai pelajaran pertama →" tengah, tinggi 44 |
| Banner | Banner info (6.8) |

Sakelar status: **terkunci** → ketuk menampilkan "Selesaikan titik sebelumnya dulu" (PRD F1), node tidak dapat difokus sebagai tujuan tetapi tetap `button` dengan `aria-disabled="true"`.

Isi jalur Figma: Kenali (mata) → Temukan bentuknya (mata) → Ingat bunyinya (otak) → Latihan menulis (pensil) → Kuis (kilau). Lihat bagian 8 untuk selisihnya dengan PRD.

### 6.13 Kamera / Scanner

| Elemen | Spesifikasi |
| --- | --- |
| Layar | Latar `#302820`, video penuh, overlay gradien (2.5); navbar tetap tampil di Figma (PRD: layar proses scan tanpa navbar `[Perlu keputusan]`) |
| Bingkai bidik | Empat sudut siku radius 20, garis 3 px `--cam-corner`, kotak ±338 × 284 di tengah; tanpa garis sisi |
| Empty state izin | Ikon camera-off 40 `#D5E6B0`, judul `heading-3` 16→18 `#FFFAF3`, isi `body-sm` `#E0D6CA` (lebar 297), tombol Ghost-dark "Coba buka kamera ↻" |
| Petunjuk | "Letakkan aksara di dalam bingkai" 16 `#FFFFFF` + "Pastikan cahaya cukup dan tulisan jelas." `body-sm` `#E0D9CE` (Figma 13,3 / 10,3) |
| Baris kontrol | Tiga kolom, celah 44: **Galeri** (ikon image-plus 24 + label `caption`) · **Rana** 72 · **Contoh** (ikon scan 24 + label) |
| Catatan | "Foto diproses setelah tombol ditekan." `caption` `#D0C6B9` — pesan "OCR belum aktif" di Figma bersifat sementara, hapus saat model aktif `[Perlu keputusan]` |
| Kertas contoh | Gambar sampel: kertas krem `#F6F0E4`, teks aksara `#4C493F`, miring ±4°, `shadow 0 12 24 rgba(69,72,49,.13)` — hanya ilustrasi/mode "Contoh" |
| Bingkai potong (PRD F5 langkah 2) | `[Improvisasi]` bingkai putih 2 px dengan 4 pegangan 24 × 24 (area sentuh 44), latar di luar bingkai `rgba(0,0,0,.5)`, tombol utama "Baca" olive |
| Status proses | Skeleton/indikator memuat `[Improvisasi]`: spinner olive + "Membaca aksara…"; tombol Baca nonaktif selama model memuat |

### 6.14 Sheet hasil scan & Kaji lebih dalam

| Elemen | Spesifikasi |
| --- | --- |
| Sheet | Putih/krem `#F7F4F1`, radius atas 24, `shadow-sheet-up`, padding 24, tombol tutup ✕ 44 di kanan atas; tinggi awal ±232, dapat ditarik ("Tarik ke atas …") hingga ±70% layar |
| Judul hasil | `heading-2` 24 PJS 700 ls −0,03em — bacaan Latin per suku kata ("bapak tindak pasar"); di bawah `body-sm` petunjuk |
| Tombol buka/tutup | Pill penuh lebar, latar `#4D3423`, teks `#F7F4F1` "Bedah suku kata ⌄" / "Sembunyikan detail ⌃", tinggi 44 |
| Ubin suku kata | Grid 3–4 kolom, celah 8; ubin putih garis `#E5DED7` radius 12, aksara `aksara-md` 32 + label Latin `caption` di bawah; terpilih: latar `#E7EDDA`, garis `#52632F` |
| Panel uraian | Latar `#E7EDDA`, radius 16, padding 16: teks `body` "Aksara ba menghasilkan bunyi ba." + (tombol audio — lihat bagian 8) |
| Tautan | "Pelajari di materi →" `body-sm` 700 olive, kanan bawah; komponen yang tak punya materi (pasangan): teks `caption` + "belum ada di materi", **tanpa tautan** |
| Peringatan keyakinan rendah | Banner kecil oranye-lembut: latar `#FFF0DF`, teks `#91511E` "Hasil mungkin kurang tepat" |
| Kosong | "Tidak ada tulisan aksara terbaca. Coba foto lebih dekat dan terang." di empty state |

### 6.15 Onboarding

| Elemen | Spesifikasi |
| --- | --- |
| Latar | Atas `#4D3423` (±62% tinggi); bawah panel `#9CAF6C` melengkung atas (kurva besar, radius ±120) |
| Teks | Overline hijau `#9CAF6C` ls 0,18em ("01 / 03 · KENALI AKSARANYA") · judul `display-xl` `#F7F4F1` · isi `body` `#F1E7DC` (maks lebar 318) |
| Ilustrasi | Lingkaran besar tint (`#E7EDDA @ rendah` / `#6B5640`) di belakang maskot + props (buku, papan tulis, ponsel) + balon bicara |
| Indikator | 3 titik: aktif pil **26 × 9** `#4D3423`, tidak aktif **9 × 9** `#D5DDC2`, radius full, celah 7; berupa tombol (area sentuh 44 lewat padding) `aria-label="Lihat langkah 2"` |
| Navigasi | Pil "Lanjut →" 102 × 52 (cokelat, di kanan bawah panel); langkah terakhir menjadi "Mulai sekarang →" (≈ 125 lebar) |
| Gerak | Geser horizontal antar layar; titik memanjang 250 ms |

### 6.16 Intro, splash, auth

- **Intro**: latar `#FFFBEA`, dua lingkaran dekoratif (sage 236 di kiri atas terpotong, ungu `#9382BB` 189 di kanan), judul `display-lg` dengan garis bawah sage tebal 9 px di bawah kata "aksaramu!", isi `body-lg` `#545644`, tombol Primary-brown + Secondary-outline, tautan "Jelajahi dulu tanpa akun →" (PJS 500 12→13 `#77795D` → `#5F6347`), maskot besar menyembul dari bawah di atas latar lime `#A8D800`.
- **Daftar**: seluruh layar `#A8D800`; maskot atas (kepala saja); `display-md` `#0B1035`; isi `body` `#44570A`; field lime; Primary-brown; tautan kaki "Sudah punya akun? **Masuk**" (Masuk 700 `#0B1035` bergaris bawah).
- **Masuk**: latar `#E7EDDA`; maskot di lingkaran mint; `display-md` `#4D3423`; field putih; Primary-brown "Masuk"; kaki "Belum punya akun? **Daftar sekarang**".
- **Header auth**: ← tombol 35 → **44** (latar `#FFFFFF @31%` di lime, `#EEEFD9` di mint) + lockup kanan.
- **Splash** (`59:3041`): belum dianalisis rinci; ikuti palet cokelat/krem + maskot.

### 6.17 Profil / Progres Saya

| Elemen | Spesifikasi |
| --- | --- |
| Hero profil | Latar mint tinggi ±456 dengan lanskap ilustrasi (gunung, pohon, awan, gradien krem→peach); label "PROFIL PELAJAR" overline ls 0,2em olive; tombol gigi 44 kanan atas (putih, `shadow-avatar`); nama `heading-1` 28/36 (Figma 28,7 ls −1,1); keterangan `body` muted; avatar 212 dengan cincin putih `@40%`; balon "Aku temani setiap langkahmu." |
| Avatar edit | 112 putih radius full + isi 102 + tombol pensil 31 (`#4D3423`, cincin putih 2) di kanan bawah |
| Kartu & statistik | bagian 6.8 |
| Daftar bab | Kartu bab profil (6.8) |
| Edit profil | Header (‹ + "Edit Profil" `heading-1` 24 + aksi), kartu mint berisi avatar & nama, panel informasi (label/nilai atau form), akordeon ganti sandi, tombol Logout (Soft-warning) |
| Tombol Batal + Simpan | Batal = Text; Simpan = Primary-compact 44 (ikon ✓) |

### 6.18 Modal pilih avatar

Lebar 370, putih-krem `#F7F4F1`, radius 24, padding 22, `shadow-modal`, di atas scrim `rgba(36,21,14,.45)` `[Improvisasi]`. Header: overline "PILIH TEMAN BELAJARMU" olive + judul `heading-2` 20 ("Avatar yang paling kamu.") + tutup ✕ 44. Pratinjau: kartu putih radius 17→16, avatar 68 + nama `heading-3` + deskripsi `caption`. Grid 4 × 2 ubin 75 × 100: **tak terpilih** putih garis `#E5DED7` radius 16; **terpilih** latar `#E7EDDA`, garis `#52632F` 1,5 + lencana ✓ di sudut; avatar 63 (latar warna: `#FFD263` `#FFF0DF` `#D6E4BD` `#BBA4EF` `#FFF4D5` `#CBD9AC` `#EEE4D6`) + aksesori 18 + label `caption` 12 (Figma 8 → 12). Kaki: Batal (Text) + "Pakai avatar ini ✓" (Primary-compact). Fokus terjebak di dalam modal, ESC menutup, `role="dialog"`, `aria-modal="true"`.

### 6.19 Pola gerak

| Pola | Durasi · easing |
| --- | --- |
| Tekan tombol | 100 ms, turun 2 px |
| Pindah tab / geser pil nav | 200 ms `cubic-bezier(.2,.8,.2,1)` |
| Progress bar isi | 300 ms ease-out |
| Sheet naik | 280 ms `cubic-bezier(.2,.8,.2,1)` |
| Maskot masuk (onboarding) | 400 ms, naik 12 px + fade |
| Umpan balik benar/salah | 150 ms (warna) + goyang 2 px × 3 untuk salah (≤ 240 ms) |

`@media (prefers-reduced-motion: reduce)`: matikan semua kecuali perubahan warna; animasi goresan jadi statis.

---

## 7. Microcopy

Bahasa Indonesia, sapaan "kamu", kalimat pendek, ramah; hindari seru berlebihan. Maskot bicara dengan nama "Aksa".

**Pesan wajib dari PRD**: "Selesaikan titik sebelumnya dulu" · "Terbaca sebagai *X*" · "Belum terbaca, coba lagi" · "Tulisan terlalu kecil" · "Tidak ada tulisan aksara terbaca. Coba foto lebih dekat dan terang." · "Hasil mungkin kurang tepat" · "belum ada di materi" · "Simpan progresmu?".

**Pesan dari Figma yang dipertahankan**: "Cerita besar. Mulai dari satu aksara." · "Lihat bentuknya. Coba tulis. Kamu bisa!" · "Dari bentuk, jadi bunyi. Jadi mengerti." · "Yuk, mulai cerita aksaramu!" · "Siap kenal aksa?" · "Lanjut cerita aksaramu." · "Sugeng rawuh 👋" · "Arahkan. Foto. Pahami." · "Tepat! Dibaca ha." · "Belum tepat. Pilih jawaban lain." · "Selangkah lebih mengenal." · "Belajar pelan-pelan, tidak perlu terburu-buru." · "Pelan-pelan juga sampai. Yang penting mencoba." · "Progres tersimpan di perangkat ini." · "Foto diproses setelah tombol ditekan."

**Label tombol**: kata kerja di depan ("Mulai belajar", "Periksa jawaban", "Tantangan berikutnya", "Coba lagi", "Hapus", "Baca", "Scan lagi", "Kaji lebih dalam", "Masuk", "Daftar sekarang", "Simpan perubahan").

**Format**: waktu `mm:ss`; progres "3 / 5" dengan spasi di sekitar garis miring; huruf Latin aksara dalam huruf kecil ("ha", "ka") dan **dikutip miring/tebal** di kalimat ("Oh, ini “ha”!" memakai tanda kutip tipografis).

---

## 8. Selisih Figma ↔ PRD v1.1 (perlu keputusan tim)

Sesuai `AGENTS.md` ("jika dokumen bertentangan, berhenti dan tanyakan"), selisih berikut **dicatat, tidak diputuskan di sini**. Komponen terkait ditandai `[Perlu keputusan]` di atas.

| # | Di Figma | Di PRD | Dampak desain | Pemilik |
| --- | --- | --- | --- | --- |
| 1 | Tab: **Belajar / Lensa Aksara / Progres Saya** | **Pembelajaran / Scanner / Profil** | Label navbar | Choirun + tim |
| 2 | Ada **beranda** ("Halo, Kenji!", hero, 3 kartu bab); layar jalur per bab | Tanpa beranda; langsung ke menu belajar dengan sakelar **Jalur \| Materi** | Struktur layar & rute; tidak ada sakelar Jalur/Materi, tidak ada layar **Materi per bab** di Figma | Choirun + Emil |
| 3 | Tab "Progres Saya" menampilkan **progres per bab & statistik** | F7: Profil **tidak** menampilkan progres per bab; tampilkan 5 huruf sering salah | Layar profil | Farrel + Choirun |
| 4 | Pelajaran **5 tahap** (Kenali, Temukan bentuknya, Ingat bunyinya, Latihan menulis, Kuis) + timer + "Tahap x / 5" | F2: kenalan → pilihan ganda (±6) → menjodohkan; latihan menulis = titik terpisah (Bab 1); **tanpa kuis akhir bab** | Komponen kuis, menjodohkan belum ada di Figma | Emil + Choirun |
| 5 | Jalur Bab 2–3 memuat **"Latihan menulis"** (Tulis sandhangan, Tulis bunyi akhir) | Latihan menulis **khusus Bab 1** | Node jalur | Emil |
| 6 | Tombol **audio** (🔊) di panel uraian hasil scan | Non-goal: audio/pelafalan | Hapus tombol | Choirun |
| 7 | Foto contoh ("Contoh") + catatan "OCR belum aktif" | Foto tidak disimpan; fitur hasil nyata | Ganti teks / buang mode contoh bila tak dipakai | Farrel |
| 8 | **Avatar** (8 pilihan), **ganti kata sandi**, nama panggilan; "mode demo" | F6/F7: nama tampilan, email, keluar, hapus akun; tabel `profiles` tidak punya kolom avatar | Perlu kolom/aturan penyimpanan avatar atau simpan di `localStorage`; tombol **Hapus akun** belum ada | Emil + Choirun |
| 9 | Pesan benar/salah tidak menyebut jawaban benar | F2: jawaban salah langsung diberi tahu jawaban benarnya | Tambah baris "Jawaban benar: …" | Choirun |
| 10 | Navbar tampil di layar kamera | Layar proses scan tanpa navbar | Atur `handle.layarPenuh` | Choirun + Farrel |
| 11 | Tidak ada layar: antrean offline, "Simpan progresmu?", migrasi tamu, lupa kata sandi | F6 | Perlu desain tambahan | Emil + Choirun |

---

## 9. Aksesibilitas

| Aspek | Aturan |
| --- | --- |
| Kontras teks | ≥ 4,5 : 1 (normal), ≥ 3 : 1 (teks ≥ 24 px atau 18,7 px tebal). Pasangan terverifikasi ada di bagian 2.2; **jangan** memakai `#746A62`, `#8B907E`, `#929681`, `#9CA08E` untuk teks bermakna |
| Komponen non-teks | Garis/ikon penanda status ≥ 3 : 1 terhadap latarnya; node terkunci dikecualikan (dinonaktifkan) tetapi wajib punya ikon kunci |
| Sentuh | ≥ 44 × 44 px, jarak antar target ≥ 8 |
| Fokus | `:focus-visible` cincin 3 px `#52632F` (`#E3EFCA` di latar gelap), urutan fokus mengikuti urutan visual |
| Label | Semua tombol ikon punya `aria-label` ("Kembali", "Tampilkan kata sandi", "Putar ulang animasi", "Tutup"); gambar dekoratif `aria-hidden` |
| Aksara | `lang="jv"`, ukuran besar, `aria-label` berisi bacaan Latin ("aksara ha") pada ubin aksara; jangan hanya mengandalkan glif |
| Status dinamis | Hasil jawaban / hasil cek tulisan / hasil scan di `role="status"` (`aria-live="polite"`); kesalahan form `role="alert"` |
| Gerak | Hormati `prefers-reduced-motion` |
| Zoom | Jangan mengunci `user-scalable`; layout bertahan sampai zoom 200% |
| Warna bukan satu-satunya | Benar/salah/terkunci selalu disertai ikon dan teks |

---

## 10. Token siap pakai (CSS)

Taruh di `src/app/tokens.css` lalu `@import` dari `app.css` (gaya sementara sekarang; library styling TBD-02 belum diputuskan — variabel CSS bekerja untuk CSS biasa, CSS Modules, maupun Tailwind via `@theme`).

```css
:root {
  /* Warna inti */
  --color-cream: #F7F4F1;
  --color-brown: #4D3423;
  --color-sage: #9CAF6C;
  --color-mint: #E7EDDA;
  --color-olive: #52632F;
  --color-olive-dark: #384520;
  --color-lime: #A8D800;
  --color-lime-bright: #B9EC00;
  --color-lime-soft: #D2ED7D;
  --color-white: #FFFFFF;
  --color-welcome: #FFFBEA;

  /* Teks */
  --text-primary: #4D3423;
  --text-muted: #6B6159;
  --text-subtle: #6B6F58;
  --text-accent: #52632F;
  --text-on-dark: #F1E7DC;
  --text-on-brown: #F7F4F1;
  --text-on-lime-label: #405602;
  --text-on-lime-hint: #44570A;
  --text-on-mint-hint: #5F6347;

  /* Garis */
  --border: #E5DED7;
  --border-strong: #DCD4CA;
  --border-input-light: #DEDFC5;

  /* Semantik */
  --success-text: #46612E; --success-bg: #EDF4DF; --success-border: #8EAF62;
  --error-text: #964632;   --error-bg: #FFF0EA;   --error-border: #DC9B8C;
  --orange: #EE851B; --orange-soft: #FFF0DF; --orange-text: #91511E; --orange-border: #E1CBB5;
  --yellow: #FFD263; --purple: #BBA4EF; --purple-soft: #F0EAFB; --purple-deep: #9382BB;

  /* Tema bab */
  --bab1: #9CAF6C; --bab1-tint: #E7EDDA; --bab1-locked: #E6E8DB; --bab1-path: #D5DDC2;
  --bab2: #FFD263; --bab2-tint: #FFF0DF; --bab2-locked: #E6E8DB; --bab2-path: #E0DBBE;
  --bab3: #BBA4EF; --bab3-tint: #F0EAFB; --bab3-locked: #E1DBE8; --bab3-path: #D8C5E0;

  /* Kamera */
  --cam-bg: #302820; --cam-text: #FFFAF3; --cam-text-muted: #E0D6CA; --cam-corner: #D5E6B0;

  /* Font */
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Atkinson Hyperlegible', system-ui, sans-serif;
  --font-aksara: 'Noto Sans Javanese', serif;

  /* Spasi */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

  /* Radius */
  --radius-xs: 6px; --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
  --radius-card: 20px; --radius-xl: 24px; --radius-full: 999px;

  /* Bayangan */
  --shadow-card: 0 12px 30px rgba(77, 52, 35, .04);
  --shadow-nav: 0 7px 26px rgba(73, 48, 30, .09);
  --shadow-cta: 0 3px 0 rgba(77, 52, 35, .17);
  --shadow-avatar: 0 5px 14px rgba(77, 52, 35, .07);
  --shadow-bubble: 0 4px 0 #E7E6D5;
  --shadow-modal: 0 20px 70px rgba(36, 21, 14, .19);

  /* Ukuran */
  --tap: 44px;
  --h-input: 52px;
  --h-button: 52px;
  --h-button-auth: 56px;
  --h-option: 56px;
  --h-nav: 72px;
}

/* Skala tipe */
.t-display-xl { font: 800 44px/48px var(--font-display); letter-spacing: -.04em; }
.t-display-lg { font: 800 40px/44px var(--font-display); letter-spacing: -.04em; }
.t-display-md { font: 800 32px/36px var(--font-display); letter-spacing: -.04em; }
.t-h1  { font: 700 28px/36px var(--font-display); letter-spacing: -.03em; }
.t-h2  { font: 700 20px/28px var(--font-display); letter-spacing: -.03em; }
.t-h3  { font: 700 16px/24px var(--font-display); letter-spacing: -.02em; }
.t-title-sm { font: 600 14px/20px var(--font-display); letter-spacing: -.02em; }
.t-body-lg { font: 400 16px/24px var(--font-body); }
.t-body    { font: 400 14px/22px var(--font-body); }
.t-body-sm { font: 400 13px/20px var(--font-body); }
.t-caption { font: 400 12px/18px var(--font-body); }
.t-overline { font: 700 11px/16px var(--font-body); letter-spacing: .12em; text-transform: uppercase; }
.t-button-lg { font: 700 16px/24px var(--font-body); }
.t-button-md { font: 600 14px/20px var(--font-display); }
.t-timer { font: 700 14px/20px var(--font-body); font-variant-numeric: tabular-nums; }

.aksara { font-family: var(--font-aksara); line-height: 1.6; }
.aksara-xl { font-size: 96px; }
.aksara-lg { font-size: 72px; }
.aksara-md { font-size: 32px; font-weight: 700; line-height: 1.5; }
.aksara-sm { font-size: 24px; line-height: 1.5; }

:focus-visible { outline: 3px solid var(--color-olive); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

---

## 11. Pemetaan ke kode (untuk Choirun / Emil / Farrel)

| Komponen | File yang menerapkan | Catatan |
| --- | --- | --- |
| Token, tipografi, `.shell`, `.navbar` | `src/app/app.css` (+ `tokens.css` baru) | Ganti gaya sementara; pertahankan kelas `.aksara`, `.shell`, `.isi`, `.navbar` agar `AppShell.tsx` tidak berubah |
| Navbar | `src/app/AppShell.tsx` | Tambah ikon di tiap `NavLink`; label menunggu keputusan #1 |
| Beranda/jalur, kartu bab, node | `src/features/belajar/BelajarPage.tsx` | Sakelar `role="tablist"` dipertahankan (PRD F1/F3) |
| Materi per bab, ubin huruf | `src/features/belajar/MateriBabPage.tsx` | Anchor `id={kode}` tidak boleh berubah |
| Pelajaran, opsi jawaban, progress | `src/features/pelajaran/PelajaranPage.tsx` | Komponen 6.5, 6.9, 6.10 |
| Latihan menulis | `src/features/latihan/LatihanPage.tsx` | Komponen 6.11; `periksaTulisan()` (Farrel) |
| Scanner, hasil, Kaji lebih dalam | `src/features/scanner/*` | Komponen 6.13–6.14; tautan lewat `tautanMateri()` |
| Profil | `src/features/profil/ProfilPage.tsx` | Komponen 6.8, 6.17; bagian Tentang wajib atribusi font/dataset |
| Masuk/daftar | `src/features/akun/MasukPage.tsx` | Komponen 6.7, 6.16 |

Urutan kerja yang disarankan: (1) `tokens.css` + font → (2) tombol, input, kartu, progress, chip (komponen dasar) → (3) navbar + shell → (4) layar belajar → (5) scanner → (6) profil/auth. Pecah per branch `feature/<bagian>` dan jangan menyentuh wilayah anggota lain tanpa persetujuan (`KOLABORASI.md` §5).

---

## 12. Daftar periksa sebelum menyatakan selesai

- [ ] Semua warna/ukuran di kode berasal dari token bagian 10.
- [ ] Tidak ada teks < 12 px (kecuali overline 11 px).
- [ ] Semua target sentuh ≥ 44 px; navbar tidak menutupi konten terakhir.
- [ ] Aksara selalu `lang="jv"` + Noto Sans Javanese; tidak terpotong.
- [ ] Kontras teks lulus AA, status tidak hanya warna.
- [ ] Fokus terlihat di semua kontrol; `prefers-reduced-motion` ditangani.
- [ ] Layar uji: 360 × 640, 390 × 844, 430 × 932, tablet 768, desktop.
- [ ] Bundle awal ≤ 500 KB gzip (font Noto Sans Javanese di-subset dan dimuat malas).
- [ ] Atribusi font (OFL) ada di halaman Tentang.
- [ ] Selisih Figma ↔ PRD (bagian 8) sudah diputuskan atau dicatat di `TASK.md`.
