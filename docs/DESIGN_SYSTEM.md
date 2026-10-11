# Design System — AksaraLens

> Pemilik: Choirun. Diisi setelah wireframe (T-05) dan keputusan styling (T-06).
> Semua nilai visual di kode harus berasal dari token di sini.

Status: **draf, belum diisi** · Sumber desain: _[tautan wireframe/Figma]_ · Rujukan gaya: Duolingo, Write It! Japanese, Photomath, Pleco (PRD, Lampiran)

Penanda nilai: `[Dari Desain]` diambil dari desain · `[Improvisasi]` dirancang di sini.

## 1. Prinsip

Batasan dari PRD yang sudah pasti:

1. Mobile-first 360–430 px; tetap rapi di tablet/desktop.
2. Navbar bawah 3 tab; disembunyikan di pelajaran, latihan, dan proses scan (layar penuh + tombol keluar).
3. Aksara tampil besar dengan Noto Sans Javanese (kelas `aksara`, `lang="jv"`).
4. Sentuh ≥ 44 px, kontras teks memadai, label pembaca layar.
5. Tanpa elemen gamifikasi (poin, streak, lencana).

## 2. Warna

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `color-primary` | _[#…]_ | _[…]_ |
| `color-bg` | _[#…]_ | _[…]_ |
| `color-text` | _[#…]_ | _[…]_ |

## 3. Tipografi

| Token | Font | Ukuran / tinggi baris | Bobot | Pemakaian |
| --- | --- | --- | --- | --- |
| `text-heading` | _[…]_ | _[…]_ | _[…]_ | _[…]_ |
| `text-body` | _[…]_ | _[…]_ | _[…]_ | _[…]_ |

## 4. Spasi, Radius, Bayangan

| Token | Nilai |
| --- | --- |
| `space-1` | _[4px]_ |
| `radius-md` | _[…]_ |
| `shadow-md` | _[…]_ |

## 5. Tata Letak Dan Breakpoint

_[Grid, lebar maksimum, breakpoint.]_

## 6. Komponen

| Komponen | Varian / state | Catatan |
| --- | --- | --- |
| Button | primary, secondary, disabled | _[…]_ |

## 7. Microcopy

Bahasa Indonesia. Pesan yang sudah ditetapkan PRD: "Selesaikan titik sebelumnya dulu", "Terbaca sebagai *X*", "Belum terbaca, coba lagi", "Tulisan terlalu kecil", "Tidak ada tulisan aksara terbaca. Coba foto lebih dekat dan terang.", "Hasil mungkin kurang tepat", "belum ada di materi", "Simpan progresmu?".

## 8. Aksesibilitas

_[Kontras minimum, fokus keyboard, label ARIA.]_
