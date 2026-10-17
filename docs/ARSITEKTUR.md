# Arsitektur — AksaraLens

> Menjawab: **dengan apa dan dalam bentuk apa sistem dibangun.**
> Keputusan di sini mengikat. Perubahan besar butuh persetujuan (lihat `AGENTS.md` bagian 6).

Status: **draf** (scaffolding 11 Okt 2026)

## 1. Stack

| Lapisan | Pilihan | Versi | Alasan |
| --- | --- | --- | --- |
| Frontend | React + Vite + React Router | 19.3 / 8.3 / 8.4 | SPA statis, mobile-first |
| Bahasa | TypeScript | 7.0 | Disarankan PRD; **sementara**, menunggu keputusan T-06 |
| AI di browser | onnxruntime-web | 1.30 | WebGPU, cadangan WASM; model tidak dikirim ke server |
| Auth + DB | Supabase (`@supabase/supabase-js`) | 2.117 | Auth email + Google, Postgres + RLS, tanpa server sendiri |
| Styling | **belum diputuskan** | — | Tailwind vs CSS Modules (T-06); sementara CSS biasa di `src/app/app.css` |
| Test | Vitest | 5.0 | Logika murni |
| Hosting | Vercel | — | Produksi dari `main`; `develop` = integrasi |
| Pelatihan model | PyTorch di Colab (repo terpisah `aksaralens-ml`) | — | Ekspor ONNX tanpa kuantisasi |

Versi diverifikasi ke npm 11 Okt 2026. Jangan naikkan versi mayor di tengah semester.

**Sengaja tidak dipakai:** server Express (kebutuhan server hanya akun + progres, sudah
ditangani Supabase) · Carakan.js (transliterasi per suku kata ditulis sendiri di
`src/aksara/urai.ts` karena juga dipakai Kaji lebih dalam) · OpenCV.js (±8 MB; operasi gambar yang dipakai notebook ditulis ulang di
`src/ml/model2/gambar.ts` dan hasilnya diverifikasi sama dengan notebook).

**Cadangan:** bila scan di ponsel > 3 dtk, Model 2 pindah ke FastAPI (Hugging Face Spaces).

## 2. Gambaran Sistem

```
Browser ─┬─ React SPA (konten JSON statis, logika jalur)
         ├─ ONNX Runtime Web ── /models/*.onnx (aset statis, cache browser)
         │     model1  → latihan menulis
         │     model2b → detektor baris → model2a → CTC → urai() → Latin
         └─ supabase-js ── Supabase Auth + Postgres (RLS): profil, progres, statistik
```

Foto tidak pernah meninggalkan perangkat. Model dimuat saat halaman latihan/scanner dibuka.

## 3. Struktur Kode

```
src/
  app/          Router (rute PRD), AppShell + navbar bawah; handle.layarPenuh menyembunyikan navbar
  aksara/       huruf.ts: 31 karakter (satu-satunya sumber kode huruf); urai.ts: Unicode → suku kata + komponen
  content/      jalur.json, bab.json, goresan.json + tipe (index.ts)
  progres/      model.ts (murni: status jalur, huruf sering salah, catat jawaban, gabung progres),
                penyimpanan.ts (tamu/akun), ProgresProvider.tsx
  ml/           onnx.ts (lazy, cache sesi); model1/ (keputusan, periksa, huruf_label.json);
                model2/ (gambar = pengganti cv2, detektor, ctc, scan, scanner_charset.json)
  lib/          supabase.ts (null bila .env kosong → mode tamu)
  features/     belajar, pelajaran, latihan, scanner, profil, akun
supabase/migrations/   Skema + RLS + trigger profil
public/models/         .onnx (tidak di-commit)
```

Aturan batas:

- Komponen memakai `useProgres()`; jangan panggil `localStorage`/Supabase langsung dari UI.
- `onnxruntime-web` hanya diimpor (dinamis) di `src/ml/`. Halaman latihan & scanner di-lazy-load.
- Kode huruf (`ka`, `wulu`, …) selalu dari `src/aksara/huruf.ts`.

## 4. Kontrak Antarbagian

Status: **draf — belum disepakati Farrel, Emil, Choirun.** Setelah disepakati, dibekukan:
ubah hanya dengan persetujuan, dalam commit tersendiri.

**Tabel Supabase** (`supabase/migrations/`): `profiles(id, display_name, created_at)`,
`lesson_progress(user_id, lesson_id, status='completed', completed_at)` PK (user_id, lesson_id),
`letter_stats(user_id, letter, correct, wrong, updated_at)` PK (user_id, letter).

**Data tamu** (`localStorage`): `aksaralens:progress`, `aksaralens:stats`; bentuk sama tanpa `user_id`.

**Konten** (`src/content/index.ts`):

```ts
Titik { id: 'b1-p1' | 'b1-tulis1' | …; bab: 1|2|3; type: 'lesson'|'writing'; title; letters: KodeHuruf[] }
Bab   { bab; judul; ringkasan; letters; contoh: {aksara, uraian}[]; mirip: [kode, kode][] }
Goresan = Record<KodeHuruf, [x, y][][]>   // dinormalkan 0–1
```

**Antarmuka modul:**

| Penyedia | Fungsi | Dipakai oleh |
| --- | --- | --- |
| `progres/ProgresProvider` | `useProgres() → { status, stats, selesaikanTitik(id), catat(letter, benar) }` | semua halaman |
| `ml/model1/periksa` | `siapkanPemeriksa()`, `cekKanvas(kanvas) → 'kosong' \| 'terlalu_kecil' \| 'siap'`, `periksaTulisan(kanvas, target) → HasilCek \| null` | latihan |
| `ml/model2/scan` | `siapkanScanner()`, `bacaFoto(ImageBitmap) → HasilScan` | scanner |
| `aksara/urai` | `urai(baris) → SukuKata[]`, `keLatin()`, `tautanMateri(komponen)` | scanner |

## 5. Konvensi

| Hal | Konvensi |
| --- | --- |
| Kolom DB / field progres | `snake_case` (mengikuti tabel PRD) |
| Kode TS | identifier berbahasa Indonesia, `camelCase` |
| Tanggal | ISO 8601 UTC (`toISOString()`) |
| Teks antarmuka | Indonesia; aksara pakai kelas `aksara` + `lang="jv"` |
| Variabel lingkungan | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` di `.env` |
| Git | `feature/<bagian>` dari `develop`; pesan `feat:`/`fix:`/`refactor:`/`style:`/`docs:`/`chore:` (lihat `KOLABORASI.md`) |

## 6. Strategi Test

- **Wajib dites (Vitest):** `aksara/urai`, `ml/model1/keputusan`, `ml/model2/ctc`, `progres/model`,
  dan pra-proses begitu diimplementasikan (bandingkan dengan keluaran notebook).
- **Tidak wajib:** komponen React tampilan.
- **Kesetaraan scanner dengan notebook:** `python -I -X utf8 scripts/rujukan_scanner.py . <gambar>` menjalankan
  pipeline notebook (OpenCV + onnxruntime) pada gambar yang sama; bandingkan sudut, kotak, dan teksnya
  dengan `bacaFoto()` di browser. Wajib diulang bila model atau pra-proses diubah.
- **Kesetaraan Model 1:** `praproses()` dibandingkan dengan notebook pada 200 coretan acak (skeleton
  identik 200/200, keluaran 191/200; sisanya beda ≤ beberapa piksel akibat presisi float resize) dan
  196 tulisan tangan Roboflow (tebakan model 100% sama).
- Waktu inferensi diukur manual di ponsel uji (lihat PRD, Metrik).

## 7. Keputusan Terbuka

Jangan diputuskan agen sendiri.

| Kode | Pertanyaan | Pemilik | Batas |
| --- | --- | --- | --- |
| TBD-01 | Isi pelajaran per bab (`jalur.json` masih usulan PRD) | Emil | 18 Okt |
| TBD-02 | Styling (Tailwind / CSS Modules) dan tetap TypeScript atau tidak | Choirun + Emil | 18 Okt |
| TBD-03 | Ambang keyakinan latihan menulis (awal 0,6) | Farrel | 8 Nov |
| TBD-04 | Scanner di browser atau FastAPI | Farrel | Setelah uji ponsel (T-02) |
| TBD-05 | Cara menyajikan `.onnx` di Vercel (LFS / penyimpanan terpisah) | Farrel | Sebelum deploy |

## 8. Risiko Teknis

| Risiko | Mitigasi |
| --- | --- |
| Inferensi lambat di ponsel murah | Input kecil, WASM multithread, cadangan FastAPI |
| Pra-proses browser ≠ notebook | Tes keluaran pra-proses terhadap sampel dari notebook |
| WASM ONNX besar (±6,8 MB gzip) | Hanya dimuat di latihan/scanner; cache browser |
| Supabase gratis berhenti setelah 1 minggu tak aktif | Aktivitas rutin; cek sehari sebelum demo |
| Google OAuth gagal di produksi | Atur consent screen + redirect sejak November, uji di domain Vercel |
