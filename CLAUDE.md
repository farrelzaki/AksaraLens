# AksaraLens — Penunjuk untuk Agen

> Sengaja pendek. Aturan kerja ada di `AGENTS.md` (pribadi, diimpor di bawah),
> aturan kelompok di `KOLABORASI.md`, detail produk & teknis di `docs/`. Jangan salin isinya ke sini.

@AGENTS.md

Belum punya `AGENTS.md`, `TASK.md`, `PROJECT_STATE.md` di root? Salin dari `docs/templat-agen/`.

## Urutan baca

1. `KOLABORASI.md` — jalankan Protokol Agen (bagian 0): tanya identitas, kerjakan hanya task & wilayah pengguna aktif.
2. `AGENTS.md` → `TASK.md` → `PROJECT_STATE.md`.
3. `docs/PRD.md` (apa) dan `docs/ARSITEKTUR.md` (bagaimana) sesuai kebutuhan task.
4. Desain & aset: token visual di `docs/DESIGN_SYSTEM.md`, aset `.csv` desain di `design/assets-csv/`, dan hasil final UI/UX di `design/uiux/`.

## Aturan yang tidak boleh dilanggar

1. **Tetap di cakupan PRD** (`docs/PRD.md` bagian 2 untuk non-goals).
2. **Foto dan hasil scan tidak pernah keluar dari perangkat** dan tidak disimpan
   (bahkan tidak di localStorage). Tidak ada analitik pihak ketiga.
3. **Tidak ada rahasia di repo.** Hanya anon key Supabase, lewat `.env`.
4. **Konten belajar = JSON statis**; database hanya `profiles`, `lesson_progress`, `letter_stats` (RLS aktif).
5. **Keputusan terbuka** (`docs/ARSITEKTUR.md` bagian 7) tidak diputuskan agen sendiri.

## Perintah

```bash
npm install && npm run dev
npm test            # vitest, logika murni
npm run typecheck
npm run build
```
