// Hasil cek tulisan (F4) -> catatan statistik huruf (F7, letter_stats).
// Aturan:
//  - setiap cek yang menghasilkan jawaban dihitung satu percobaan, benar atau salah
//    (termasuk "coba lagi", supaya rasio salah mencerminkan kesulitan huruf);
//  - cek yang gagal dijalankan (model belum siap, galat) TIDAK dihitung salah;
//  - hanya huruf nglegena yang dicatat (latihan menulis hanya Bab 1).
// Fungsi murni: tidak menyentuh DOM, jaringan, maupun penyimpanan.

import { hurufDariKode } from '../aksara/huruf';

export interface CatatanHuruf {
  letter: string;
  benar: boolean;
}

/**
 * `hasil` = keluaran cek tulisan milik Farrel (cukup punya `benar`); null/undefined bila
 * pengecekan tidak jalan. Mengembalikan null bila tidak ada yang perlu dicatat.
 */
export function catatanDariCek(target: string, hasil: { benar: boolean } | null | undefined): CatatanHuruf | null {
  if (!hasil || typeof hasil.benar !== 'boolean') return null;
  const huruf = hurufDariKode(target);
  if (!huruf || huruf.jenis !== 'nglegena') return null;
  return { letter: huruf.kode, benar: hasil.benar };
}