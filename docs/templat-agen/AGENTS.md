# AGENTS.md

> Aturan kerja agen AI. Dibaca otomatis oleh Codex, Cursor, Copilot, Gemini/Antigravity;
> Claude Code memuatnya lewat impor `@AGENTS.md` di `CLAUDE.md`.
> File ini **pribadi** (di-gitignore). Salin dari `docs/templat-agen/AGENTS.md` ke root repo.
> Aturan kerja kelompok ada di `KOLABORASI.md` (di-commit).
> Detail produk dan teknis ada di `docs/`; jangan menyalinnya ke sini.
>
> **Jika `KOLABORASI.md` ada di root, jalankan Protokol Agen di bagian 0 file itu sebelum apa pun.**

## 1. Konteks Proyek

- **Nama:** AksaraLens
- **Ringkasan:** web app *mobile-first* belajar aksara Jawa (3 bab) untuk pelajar dan umum: jalur belajar, latihan menulis yang diperiksa CNN, scanner foto aksara cetak (U-Net + CRNN) dengan transliterasi Latin. Semua inferensi di browser.
- **Stack:** React + Vite + TypeScript, React Router, ONNX Runtime Web, Supabase, Vercel — detail di `docs/ARSITEKTUR.md`
- **Bahasa antarmuka:** Indonesia
- **Di luar cakupan:** gamifikasi, audio, scan live, riwayat scan, penilaian urutan goresan, latihan menulis Bab 2–3, aplikasi native/PWA (lengkap di `docs/PRD.md`)

Jika bagian ini masih kosong, tanyakan kepada pengguna sebelum menulis kode.

## 2. Peta Dokumen

| File | Isi | Siapa yang mengubah |
| --- | --- | --- |
| `AGENTS.md` | Aturan kerja permanen (file ini) — pribadi | Hanya atas permintaan pengguna |
| `TASK.md` | Rincian task milik pengguna ini — pribadi | Agen, setiap status berubah |
| `PROJECT_STATE.md` | Kondisi terbaru, pengguna aktif, handoff antarsesi — pribadi | Agen, setiap checkpoint |
| `KOLABORASI.md` | Anggota, pembagian task, aturan Git kelompok, log — bersama | Lihat bagian 9 file itu |
| `CLAUDE.md` | Penunjuk singkat + aturan yang tak boleh dilanggar — bersama | Disepakati tim |
| `docs/PRD.md` | Apa yang dibangun: tujuan, fitur, aturan bisnis | Disepakati dengan pengguna |
| `docs/ARSITEKTUR.md` | Stack, struktur kode, perintah, kontrak API, konvensi | Disepakati dengan pengguna |
| `docs/DESIGN_SYSTEM.md` | Token visual, tipografi, komponen (opsional) | Disepakati dengan pengguna |
| `docs/referensi/` | Dokumen sumber (PRD AksaraLens v1.1 lengkap) | Hanya dibaca |

Aturan menempatkan informasi:

- Daftar pekerjaan hanya di `TASK.md`; aturan permanen hanya di `AGENTS.md`.
- Keputusan teknis yang sudah final dipindah ke `docs/`, bukan dibiarkan di `PROJECT_STATE.md`.
- Jika dua dokumen bertentangan, berhenti dan tanyakan. Jangan memilih sendiri.
- Jika isi dokumen berbeda dengan kondisi nyata proyek, laporkan; jangan mengarang.

## 3. Perintah

Terbukti berjalan 11 Okt 2026 (Node 24, npm 11).

| Tujuan | Perintah |
| --- | --- |
| Instal dependency | `npm install` |
| Menjalankan lokal | `npm run dev` |
| Test | `npm test` (Vitest) |
| Lint / format | belum ada linter; `npm run typecheck` |
| Build | `npm run build` |

## 4. Mode Kerja

Mode default: **`standard`** (disepakati tim 11 Okt 2026). Mode aktif dicatat di `PROJECT_STATE.md`.
Jangan mengganti mode secara otomatis; perubahan mode harus dikonfirmasi pengguna.

### Mode competition

- Evidence-based: jangan menyimpulkan tanpa memeriksa sumber yang relevan.
- Satu task aktif pada satu waktu.
- Jangan menulis file sebelum scope dan rencana disetujui pengguna.
- Jangan memperluas scope tanpa persetujuan baru.
- Laporkan asumsi, risiko, alternatif, dan hal yang belum terverifikasi.
- Berhenti setelah setiap fase penting dan tunggu konfirmasi.

### Mode standard

Hanya dipakai jika pengguna memintanya secara eksplisit.

- Perubahan kecil boleh langsung dikerjakan setelah memberi tahu.
- Perubahan besar (lihat bagian 6) tetap dijelaskan rencana dan dampaknya, lalu menunggu persetujuan.
- Verifikasi tetap wajib sesuai dampak perubahan.

## 5. Alur Kerja

### Memulai sesi

1. Baca file ini, lalu `TASK.md`, lalu `PROJECT_STATE.md`.
   Jika `KOLABORASI.md` ada: jalankan Protokol Agen-nya (tanya identitas pengguna), dan
   hanya kerjakan task milik pengguna aktif sesuai papan task di file itu.
2. Jika pengguna memberi pekerjaan langsung, jadikan itu task yang diusulkan.
3. Jika belum ada task atau instruksi, tanyakan pekerjaan yang ingin dipilih.
4. Pahami tujuan, batasan, non-goals, dependensi, dan kriteria selesai.
5. Jika kebutuhan penting ambigu, tanyakan sebelum memutuskan.

### Checkpoint (mode competition)

Setelah setiap fase, berhenti dan tunggu konfirmasi.

1. **Scope** — tujuan, konteks, batasan, non-goals, kriteria sukses.
2. **Discovery** — periksa file, struktur, implementasi, test, konfigurasi.
3. **Analysis** — masalah, akar penyebab, alternatif, rekomendasi, risiko.
4. **Plan** — file yang diubah, perubahan per file, urutan, rencana verifikasi.
5. **Approval** — minta persetujuan eksplisit sebelum menulis.
6. **Implementation** — kerjakan hanya scope yang disetujui.
7. **Verification** — test, regresi, dan edge case yang relevan.
8. **Handoff** — perbarui `TASK.md` dan `PROJECT_STATE.md`, laporkan hasil.

Konfirmasi seperti `lanjut`, `setuju`, atau `proceed` hanya berlaku untuk fase yang sedang dibahas.

Untuk task kecil tanpa risiko, beberapa fase boleh digabung dengan alasan yang dijelaskan.
Discovery, approval sebelum menulis, dan verification tidak boleh dilewati.

## 6. Aturan Perubahan

- Sebelum mengubah file, sebutkan file dan tujuan perubahannya.
- Pilih perubahan terkecil yang menyelesaikan masalah.
- Jangan menimpa, menghapus, atau membatalkan perubahan pengguna yang tidak terkait.
- Jangan "sekalian merapikan" kode di luar scope (impor, nama variabel, format).
  Jika melihat bug di luar scope, laporkan; jangan perbaiki.
- Jangan mengarang hasil test, isi file, atau perilaku sistem.
- Jika scope berubah, berhenti, jelaskan dampaknya, dan minta persetujuan baru.

### Klasifikasi perubahan

**Besar** jika menyentuh salah satu:

- Database, migrasi, atau struktur data penting.
- Autentikasi, otorisasi, keamanan, atau data sensitif.
- Dependency utama atau konfigurasi deployment.
- Arsitektur, API publik, atau kontrak antarbagian sistem.
- Penghapusan fitur, atau banyak file yang saling berkaitan.

**Kecil**: perbaikan bug lokal, teks, styling sederhana, sedikit file tanpa dampak luas.
Jika ragu, perlakukan sebagai perubahan besar.

## 7. Aturan Teknis Umum

- **Tidak ada rahasia di repo.** Password, API key, dan token hanya lewat `.env`
  (tidak di-commit). Sediakan `.env.example` tanpa nilai asli.
- **Jangan menambah dependency tanpa alasan dan persetujuan.** Verifikasi versi
  ke registry resmi (npm, Packagist, PyPI, dsb.), bukan dari ingatan.
- **Pisahkan logika murni dari efek samping** (HTTP, DB, UI). Logika murni
  — perhitungan, aturan bisnis, parsing — wajib punya test.
- **Kontrak API dibekukan setelah disepakati** (`docs/ARSITEKTUR.md`). Ubah hanya
  dengan persetujuan, dalam commit tersendiri. Menambah field opsional murah;
  mengganti nama atau menghapus field mahal.
- **Ikuti pola yang sudah ada** di kode sebelum membuat abstraksi baru.
- **Jangan mengubah versi mayor** dependency di tengah proyek tanpa persetujuan.

## 8. Git

Aturan Git ada di `KOLABORASI.md` bagian 2, 5, dan 6 (`multi-branch`: `feature/<bagian>` dari
`develop`, PR ke `develop`, tidak ada commit langsung ke `main`/`develop`, pesan commit
`feat:`/`fix:`/`refactor:`/`style:`/`docs:`/`chore:`). Jangan commit, push, atau rewrite
history tanpa diminta pengguna.

## 9. Task Dan State

- Hanya satu task aktif pada satu waktu.
- Catat task ke `TASK.md` jika pekerjaan melewati satu fase, lebih dari satu sesi, atau perlu dilacak.
- Perbarui `PROJECT_STATE.md` saat memulai sesi, melewati checkpoint, membuat keputusan,
  menemukan blocker, mengubah arah, berhenti, atau menyelesaikan task.
- Jaga `PROJECT_STATE.md` tetap ringkas; jangan menyalin percakapan.

## 10. Verifikasi

- Jalankan test, lint, build, atau pemeriksaan lain yang relevan (lihat bagian 3).
- Periksa hasil terhadap kriteria selesai, regresi, dan edge case penting.
- Periksa kembali diff dan file terdampak.
- Jika verifikasi tidak bisa dijalankan, jelaskan alasan dan dampaknya.
- Jangan menyatakan selesai jika kriteria selesai belum terpenuhi.

## 11. Format Laporan

**Setiap checkpoint:** fase yang selesai · fakta/bukti · asumsi dan yang belum diketahui ·
rekomendasi · risiko · fase berikutnya · pertanyaan konfirmasi yang jelas.

**Akhir pekerjaan:** tujuan dan hasil · file yang dibuat/diubah · verifikasi dan hasilnya ·
yang belum terverifikasi · risiko atau pekerjaan lanjutan.

## 12. Prinsip

- Kejelasan di atas kecanggihan.
- Pertahankan perilaku yang sudah ada kecuali perubahan memang diminta.
- Lebih baik berhenti dan bertanya daripada membuat asumsi penting.
