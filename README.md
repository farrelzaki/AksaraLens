# AksaraLens

Aplikasi web *mobile-first* untuk belajar aksara Jawa secara bertahap: jalur belajar
3 bab, latihan menulis dengan pemeriksaan CNN, dan scanner foto aksara cetak yang
mentransliterasikan ke Latin. Semua inferensi berjalan di browser (ONNX Runtime Web);
Supabase hanya menyimpan akun dan progres.

Stack: React + Vite + TypeScript, React Router, ONNX Runtime Web, Supabase, Vercel.

## Menjalankan

```bash
npm install
cp .env.example .env     # opsional; tanpa Supabase aplikasi jalan sebagai tamu
npm run dev
```

Model `.onnx` tidak ada di repo; lihat `public/models/README.md`.

## Dokumen

| File | Isi | Di-commit |
| --- | --- | --- |
| `KOLABORASI.md` | Anggota, wilayah file, papan task, aturan Git, log | ya |
| `CLAUDE.md` | Penunjuk singkat untuk agen + aturan wajib | ya |
| `docs/PRD.md` | Apa yang dibangun (ringkasan PRD v1.1) | ya |
| `docs/ARSITEKTUR.md` | Stack, struktur kode, kontrak antarbagian, keputusan terbuka | ya |
| `docs/DESIGN_SYSTEM.md` | Token visual & komponen (diisi Choirun) | ya |
| `design/assets-csv/` | Berkas aset `.csv` untuk desain (token, palet, data desain) | ya |
| `design/uiux/` | Hasil final desain UI/UX (mockup, wireframe, ekspor Figma) | ya |
| `docs/EVALUASI.md` | Hasil uji model di aplikasi (untuk laporan) | ya |
| `docs/referensi/` | Dokumen sumber, hanya dibaca | ya |
| `AGENTS.md`, `TASK.md`, `PROJECT_STATE.md` | Aturan kerja agen, task, dan memori sesi milik masing-masing | **tidak** |

## Setelah clone (setiap anggota)

1. Salin `docs/templat-agen/*` ke root repo (ketiganya di-gitignore, milikmu sendiri).
2. Pastikan `git config user.name` sama dengan kolom `git user.name` di `KOLABORASI.md`.
3. Buka agen AI; ia akan bertanya "kamu siapa?" lalu hanya mengerjakan task milikmu.
