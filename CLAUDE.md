# AksaraLens — Panduan Agen & Kontributor

Web app *mobile-first* untuk belajar aksara Jawa (3 bab), dengan latihan menulis
(CNN) dan scanner foto aksara cetak (U-Net + CRNN), semuanya inferensi di browser.
Sumber kebutuhan: PRD AksaraLens v1.1 (11 Okt 2026). Tim: Farrel, Emil, Choirun.

## Aturan yang tidak boleh dilanggar

1. **Tetap di cakupan PRD.** Tidak ada gamifikasi, audio, scan live, riwayat scan,
   penilaian urutan goresan, latihan menulis Bab 2–3, atau aplikasi native/PWA.
2. **Foto dan hasil scan tidak pernah keluar dari perangkat** dan tidak disimpan
   (bahkan tidak di localStorage). Tidak ada analitik pihak ketiga.
3. **Tidak ada rahasia di repo.** Hanya anon key Supabase, lewat `.env`.
   Service role key tidak pernah masuk frontend.
4. **Konten belajar = JSON statis** di `src/content/`, bukan di database.
   Database hanya `profiles`, `lesson_progress`, `letter_stats` (RLS aktif).

## Struktur

```
src/
  app/          Router, AppShell (navbar bawah 3 tab; handle.layarPenuh menyembunyikannya)
  aksara/       huruf.ts (31 karakter, satu-satunya sumber kode huruf), urai.ts (Unicode -> suku kata + komponen)
  content/      jalur.json (12 titik), bab.json, goresan.json + tipe
  progres/      model.ts (logika murni: status jalur, huruf sering salah, migrasi), penyimpanan tamu/akun, Provider
  ml/           onnx.ts (lazy load, WebGPU -> WASM), model1/ (cek tulisan), model2/ (CTC, pipeline scan)
  lib/          supabase.ts (null bila .env kosong -> mode tamu)
  features/     Halaman per tab: belajar, pelajaran, latihan, scanner, profil, akun
supabase/migrations/   Skema + RLS + trigger profil
public/models/         .onnx (tidak di-commit; lihat README di sana)
```

## Pemilik folder

| Anggota | Folder |
| --- | --- |
| Farrel | `src/ml/`, `src/aksara/`, `src/features/scanner/`, `src/features/profil/` (huruf sering salah, sumber data) |
| Emil | `src/content/`, `src/progres/`, `src/lib/`, `src/features/akun/`, `supabase/` |
| Choirun | `src/app/`, tampilan semua `src/features/*`, gaya |

Agen: kerjakan hanya folder milik orang yang sedang dibantu. Butuh sesuatu dari
modul lain yang belum ada → pakai tipe/antarmuka yang sudah ada, jangan buat sendiri.

## Kebiasaan

- **Logika murni dipisah dan dites:** urai/transliterasi, keputusan cek tulisan,
  dekode CTC, status jalur, statistik, migrasi. Komponen React tidak wajib dites.
- **Model dimuat sesuai kebutuhan:** jangan impor `onnxruntime-web` secara statis
  di luar `src/ml/`. Bundle awal ≤ 500 KB gzip.
- **Pra-proses di browser harus identik dengan notebook latih.**
- **Teks antarmuka berbahasa Indonesia.** Ukuran sentuh ≥ 44 px. Aksara pakai kelas `aksara` (Noto Sans Javanese).
- Jangan menambah dependensi tanpa bilang ke tim.

## Perintah

```bash
npm install
cp .env.example .env     # isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY (opsional; tanpa itu = mode tamu)
npm run dev
npm test                 # vitest
npm run typecheck
npm run build
```

## Keputusan terbuka (jangan diputuskan sendiri)

| Keputusan | Pemilik | Batas |
| --- | --- | --- |
| Isi pelajaran per bab (`jalur.json` masih usulan PRD) | Emil | 18 Okt |
| Library styling (Tailwind vs CSS Modules); TypeScript dipakai sementara | Choirun + Emil | 18 Okt |
| Ambang keyakinan latihan menulis (awal 0,6) | Farrel | 8 Nov |
| Scanner di browser atau pindah ke FastAPI | Farrel | Setelah uji ONNX di ponsel |
| Cara menyajikan `.onnx` di Vercel (LFS / penyimpanan terpisah) | Farrel | Sebelum deploy |
