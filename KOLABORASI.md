# KOLABORASI.md

## Isi username GitHub-mu di sini

Ganti teks di dalam tanda kutip dengan username GitHub-mu, lalu samakan `git config`:
`git config user.name "<username-mu>"`.

```ini
farrel  = "farrelzaki"
emil    = "Baruna13"
choirun = "kenjidotkom"
```

Nilai ini dipakai tabel *Anggota* (bagian 1) dan dicek agen di awal sesi (bagian 0, langkah 3).

> Aturan kerja kelompok untuk manusia **dan** agen AI. File ini **di-commit** dan sama untuk semua anggota.
> File pribadi (`AGENTS.md`, `TASK.md`, `PROJECT_STATE.md`) di-gitignore; milik masing-masing orang.
> Jika file ini bertentangan dengan `AGENTS.md` dalam urusan kerja kelompok, **file ini yang berlaku**.

---

## 0. Protokol Agen (wajib, sebelum eksekusi apa pun)

Agen AI wajib menjalankan langkah ini di awal setiap sesi, **sebelum membaca task, menulis file, atau menjalankan perintah git yang mengubah apa pun**:

1. **Baca file ini sampai habis.**
2. **Tanyakan identitas pengguna.** Ajukan pertanyaan pilihan berisi semua nama di tabel *Anggota* (bagian 1), misalnya:
   > Sebelum mulai, kamu siapa? (1) Farrel (2) Emil (3) Choirun
   - Jangan menebak dari nama folder, riwayat chat, atau `git config`.
   - Jika jawaban **tidak ada** di tabel, berhenti. Minta pengguna menambahkan dirinya ke tabel anggota lebih dulu.
3. **Cek konsistensi.** Bandingkan username pengguna di blok *Isi username GitHub-mu* (paling atas) dengan `git config user.name`. Jika username masih `masukan username github`, minta pengguna mengisinya dulu. Jika berbeda, beri peringatan (jangan memblokir) dan sarankan memperbaiki `git config`.
4. **Catat** pengguna aktif di `PROJECT_STATE.md` pribadi (field `Pengguna aktif`).
5. **Sinkronkan.** Pindah ke branch task, tarik branch itu dan `develop` terbaru (bagian 6) sebelum mulai bekerja.
6. **Tampilkan task milik pengguna aktif** dari *Papan Task* (bagian 3), lalu tanyakan mana yang dikerjakan.

Identitas berlaku untuk satu sesi. Jika pengguna bilang "sekarang aku X", ulangi langkah 2–6.

## 1. Anggota

Username GitHub diisi di blok [*Isi username GitHub-mu*](#isi-username-github-mu-di-sini) paling atas, bukan di tabel ini.

| Nama | Panggilan | Peran | Wilayah (folder/file milik) | Username GitHub |
| --- | --- | --- | --- | --- |
| Farrel | Farrel | ML + scanner | `src/ml/`, `src/aksara/`, `src/features/scanner/`, `src/features/profil/` (huruf sering salah, sumber data), `public/models/` | → `farrel` di atas |
| Emil | Emil | Auth, data, konten, logika jalur | `src/content/`, `src/progres/`, `src/lib/`, `src/features/akun/`, `supabase/` | → `emil` di atas |
| Choirun | Choirun | UI/UX + tampilan frontend | `src/app/`, tampilan `src/features/*` (kecuali logika di wilayah lain), gaya, `docs/DESIGN_SYSTEM.md` | → `choirun` di atas |

**File bersama** (menyentuh semua orang, wajib dikunci dulu di bagian 4):
`package.json` / `package-lock.json`, konfigurasi (`.env.example`, `vite.config.ts`, `tsconfig.json`, `vercel.json`), migrasi di `supabase/migrations/`, kontrak di `docs/ARSITEKTUR.md` bagian 4, `CLAUDE.md`, dan file ini.

## 2. Mode Git Proyek

**Mode: `multi-branch`** (disepakati tim, 11 Okt 2026)

| Branch | Fungsi | Masuk lewat |
| --- | --- | --- |
| `main` | Versi stabil; dideploy Vercel (produksi) | PR dari `develop` saat titik periksa/rilis |
| `develop` | Integrasi kerja harian semua anggota | PR dari branch fitur |
| `feature/<bagian>` | Satu fitur atau satu bagian pengembangan | Dibuat dari `develop` |

- **Tidak ada commit langsung ke `main` maupun `develop`.** Semua merge lewat Pull Request.
- PR boleh di-merge oleh penulisnya sendiri; review anggota lain tidak wajib.
- `main` dan `develop` harus selalu lulus `npm run build`.

## 3. Papan Task

Aturan untuk agen:

- **Hanya kerjakan task yang `Pemilik`-nya adalah pengguna aktif.**
- Diminta mengerjakan task milik orang lain → **tolak**, sebutkan pemiliknya. Boleh dikerjakan hanya jika pemiliknya setuju; catat `disetujui <pemilik> <tanggal>` di kolom Catatan.
- Task dengan pemilik `-` boleh diklaim: umumkan dulu di grup tim, lalu isi nama pengguna aktif dan ubah status ke `[~]` sebagai commit pertama di branch task-mu.
- Pengguna hanya mengubah baris task miliknya sendiri. Task baru boleh ditambahkan siapa saja di bagian bawah tabel.
- Status: `[ ]` belum · `[~]` dikerjakan · `[r]` PR dibuka · `[x]` selesai · `[-]` batal

| ID | Task | Pemilik | Status | Branch | Area / file | Update | Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-01 | Arsitektur awal + template kolaborasi | Farrel | `[x]` | `main` | semua | 2026-10-11 | Commit awal |
| T-02 | Uji ONNX Runtime Web di ponsel (waktu cek tulisan & scan) | Farrel | `[ ]` | | `src/ml/` | | Menentukan browser vs FastAPI |
| T-03 | Setup Supabase + Vercel, isi `.env` | Emil | `[ ]` | | `supabase/`, `src/lib/` | | Batas 18 Okt |
| T-04 | Draf konten 3 bab + isi `jalur.json` final | Emil | `[ ]` | | `src/content/` | | Batas 18 Okt |
| T-05 | Wireframe semua layar | Choirun | `[ ]` | | `docs/DESIGN_SYSTEM.md` | | Batas 18 Okt |
| T-06 | Putuskan styling (Tailwind / CSS Modules) dan TypeScript | Choirun + Emil | `[ ]` | | `package.json`, `src/app/app.css` | | Batas 18 Okt |
| T-07 | Rekam data goresan 20 huruf | Semua | `[ ]` | | `src/content/goresan.json` | | Rujukan arah: Omah Aksara |
| T-08 | Integrasi Model 1 ke kanvas + ambang keyakinan | Farrel | `[~]` | | `src/ml/model1/` | 2026-10-18 | Sisi ML selesai (`periksaTulisan`, `cekKanvas`); tinggal sambung ke kanvas Choirun + setel ambang |
| T-09 | Navbar, jalur, layar pelajaran, materi | Choirun | `[ ]` | | `src/app/`, `src/features/belajar/`, `src/features/pelajaran/` | | 19 Okt–8 Nov |
| T-10 | Soal + logika jalur (tamu) | Emil | `[ ]` | | `src/content/`, `src/progres/` | | 19 Okt–8 Nov |
| T-11 | Scanner end-to-end di browser (detektor → CRNN → transliterasi) + sinkron label hasil ML | Farrel | `[x]` | `feature/scanner` | `src/ml/`, `src/aksara/`, `src/features/scanner/` | 2026-10-18 | Identik dengan notebook; uji di ponsel lanjut di T-02 |

Rincian langkah task (rencana, checkpoint) ditulis di `TASK.md` pribadi, bukan di sini.

## 4. Kunci File Bersama

Karena tidak ada commit langsung ke `develop`/`main`, kunci dicatat di sini lewat branch-mu
**dan** diumumkan di grup tim sebelum mulai menyunting. Hapus barisnya setelah PR-mu masuk ke `develop`.

| File | Dikunci oleh | Sejak | Alasan |
| --- | --- | --- | --- |
| | | | |

Agen **tidak boleh** menyunting file bersama yang sedang dikunci orang lain.

## 5. Aturan Git

### Aturan penting

- **Dilarang commit langsung ke `main`** (juga `develop`). Semua merge lewat Pull Request agar perubahan terlihat tim dan riwayat versi rapi.
- **Selalu sinkronkan branch-mu dengan `develop` terbaru** sebelum mengubah apa pun.
- **Satu branch = satu fitur atau satu bagian pengembangan.**
- **Jangan mengubah file anggota lain** (wilayah di bagian 1) tanpa diskusi dan persetujuan pemiliknya. Bug di wilayah orang lain → laporkan, jangan perbaiki.
- Jangan "sekalian merapikan" (format, impor, nama variabel) di luar file task.
- Butuh fungsi milik orang lain yang belum ada → pakai bentuk dari kontrak (`docs/ARSITEKTUR.md` bagian 4) dan buat **mock lokal** di wilayahmu.
- `.env` dan rahasia tidak pernah di-commit. `git add .` boleh, tapi **cek `git status` dulu** agar tidak ada file asing yang ikut.
- **Dilarang** `git push --force` ke `main`/`develop`, `git reset --hard` atas commit yang sudah di-push, dan rewrite history bersama.
- **Agen AI yang mengurus Git** untuk pengguna aktif (bagian 5a).

### 5a. Git oleh agen AI

Agen menjalankan alur bagian 6 secara otomatis, tanpa menunggu diminta:

- **Sebelum mulai:** pindah ke branch task (buat dari `develop` bila belum ada), tarik branch itu dan `develop` terbaru.
- **Commit:** setiap satu perubahan utuh yang lulus `npm run typecheck` dan `npm test`. Hanya file di wilayah pengguna aktif. Pesan commit ditulis agen sesuai tipe di bawah, berbahasa Inggris, menjelaskan *apa* yang berubah.
- **Push:** ke `feature/<bagian>` milik pengguna aktif setelah commit.
- **PR dan merge ke `develop`:** saat bagian/fitur selesai, agen sinkron dengan `develop`, memastikan `npm run build` lulus, membuka PR, lalu me-merge-nya; kemudian memperbarui papan task dan log.
- **Batas:** tidak pernah push langsung ke `main`/`develop`, tidak pernah force push/rewrite history, dan **berhenti serta melapor** bila ada konflik (bagian 7), build/tes gagal, atau perubahan menyentuh wilayah anggota lain atau file bersama yang dikunci.
- **PR `develop` → `main`** (rilis) hanya saat pengguna memintanya.
- Setiap selesai, agen melaporkan ringkas: commit apa saja, branch, dan tautan PR.

### Pesan commit

Format: `<tipe>: <deskripsi singkat>` (ID task opsional di akhir, mis. `(T-08)`).

| Tipe | Untuk |
| --- | --- |
| `feat:` | fitur baru |
| `fix:` | perbaikan bug |
| `refactor:` | merapikan kode tanpa mengubah fungsi |
| `style:` | perubahan format/penulisan kode |
| `docs:` | dokumentasi |
| `chore:` | konfigurasi atau dependency |

```bash
git commit -m "feat: add Supabase email authentication"
git commit -m "feat: integrate Model 1 handwriting check"
git commit -m "fix: read ha at word start as a"
git commit -m "refactor: separate scanner pipeline steps"
```

## 6. Alur Kerja Harian

**Membuat branch baru** (sekali per fitur/bagian):

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<bagian>          # mis. feature/scanner, feature/jalur, feature/auth
git push -u origin feature/<bagian>
```

**Mau mulai coding:**

```bash
git checkout feature/<bagian>
git pull origin feature/<bagian>
git pull origin develop                   # sinkron dengan develop terbaru
```

**Setelah coding:**

```bash
git status                                # pastikan tidak ada file asing
git add .
git commit -m "feat: integrate Model 2 line detector"
git push origin feature/<bagian>
```

**Selesai satu fitur/bagian:** buka PR `feature/<bagian>` → `develop`,
ubah status task ke `[r]`, lalu merge setelah build lulus. Setelah merge: status `[x]`, isi log (bagian 8).

**Rilis/titik periksa:** PR `develop` → `main` (akhir Okt, pertengahan Nov, pertengahan Des, final).

## 7. Konflik

- Konflik muncul → agen **berhenti** dan melapor ke pengguna: file apa, baris milik siapa.
- Jangan memilih sisi kode milik orang lain. Tanyakan pemiliknya.
- Pengecualian lockfile (`package-lock.json`, `composer.lock`, dsb.): ambil versi `develop`, lalu jalankan ulang install agar lockfile dibuat ulang dari manifest.
- Konflik di file ini (`KOLABORASI.md`): pertahankan baris milik semua orang; hanya baris milikmu yang boleh kamu ubah.

## 8. Log Per Anggota

Setiap anggota punya satu subbagian. **Append-only**, satu baris per entri, terbaru di bawah. Hanya sunting subbagian milikmu.
Format: `- YYYY-MM-DD · T-xx · apa yang dikerjakan · hasil/verifikasi · catatan untuk tim`

### Log Farrel

- 2026-10-11 · T-01 · arsitektur awal sesuai PRD v1.1 + template kolaborasi · typecheck, 18 tes, build lulus · lihat `docs/ARSITEKTUR.md`
- 2026-10-12 · T-01 · aturan Git tim: multi-branch via `develop`, tanpa reviewer wajib, Git diurus agen AI (bagian 5a) · dokumen saja · berlaku setelah PR #1 masuk `develop`
- 2026-10-18 · T-11 · scanner jalan di browser: deskew, detektor baris, CRNN, `keLogis`, uraian; label/charset dari hasil ML · 37 tes, typecheck, build; 4 gambar uji identik dengan `scripts/rujukan_scanner.py` (pipeline notebook) · model `.onnx` salin dari `docs/random` ke `public/models/`; uji ponsel = T-02
- 2026-10-18 · T-08 · pra-proses Model 1 (skeleton = LUT skimage) + `periksaTulisan`/`cekKanvas`; Profil: Tentang & sumber data · 44 tes; 196 tulisan tangan Roboflow: tebakan 100% sama dengan notebook (akurasi 99,5%); 20/20 huruf di browser, ±130 ms · Choirun: panggil `cekKanvas` untuk menonaktifkan Cek, `periksaTulisan(kanvas, huruf)` saat Cek
- 2026-10-18 · TBD-05 · model `.onnx` disajikan dari Supabase Storage (bucket publik `models/v1`) lewat `VITE_MODEL_URL`; kosong = `public/models/` · 45 tes, model lokal termuat · Emil: tambahkan `VITE_MODEL_URL` ke env Vercel saat setup (T-03); `.env.example` ikut diubah
- 2026-10-19 · T-11 · scanner dipindah ke Web Worker (`scanner.ts` → `scan.worker.ts`); `vite.config.ts` ikut diubah (`worker.format: 'es'`) · thread utama 0 ms terblokir saat membaca (sebelumnya ±230 ms di laptop) · halaman memakai `ml/model2/scanner`, bukan `scan`
- 2026-10-19 · T-11 · pemanasan scanner kini menjalankan 1 inferensi (baca pertama 2,9 → 0,7 dtk di laptop); permintaan worker diproses berurutan (sebelumnya bisa menggantung bila Baca ditekan saat pemanasan); Kaji: "taling tarung" satu komponen · 45 tes, dicek di browser · model salah membaca *pada lungsi* sebagai pangkon pada satu gambar uji
- 2026-10-19 · T-08 · evaluasi Model 1 (`docs/EVALUASI.md`, `scripts/evaluasi_model1.py`): penolakan coretan acak + sandhangan 99,1% @0,6 (target PRD ≥ 85% tercapai); tabel ambang 0,4–0,9 untuk keputusan ambang · positif dari Roboflow (optimistis), perlu tulisan kanvas teman
- 2026-10-19 · T-11 · model disimpan di Cache Storage (`aksaralens-model`; versi lama dihapus otomatis) agar latihan & scanner jalan offline setelah sekali dimuat; `vercel.json` ikut diubah (cache permanen `/assets/`, nama berhash) · dicek di browser: 3 model tercache, terbaca saat fetch diputus · offline penuh setelah muat ulang halaman butuh service worker (belum, perlu keputusan tim)

### Log Emil

- _[belum ada]_

### Log Choirun

- _[belum ada]_

## 9. Mengubah File Ini

1. Ubah hanya baris task, kunci, atau log milikmu, di branch task-mu (ikut PR ke `develop`).
2. Pesan commit: `docs: update task board (T-xx)`.
3. Mengubah aturan (bagian 0, 2, 4, 5, 6, 7) atau tabel anggota butuh persetujuan seluruh anggota.
