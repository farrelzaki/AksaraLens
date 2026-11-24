// F4 langkah 4: dari probabilitas CNN ke umpan balik. Fungsi murni, wajib dites.

import meta from './huruf_label.json';

/** Indeks = kelas keluaran ONNX Model 1 (huruf_label.json dari notebook). */
export const LABEL_MODEL1: readonly string[] = meta.kelas;
export const BUKAN_HURUF = 'bukan';

/**
 * Ambang keyakinan 0,7 — keputusan Farrel (19 Okt 2026) berdasarkan docs/EVALUASI.md:
 * tulisan benar diterima 98,0%, coretan + sandhangan ditolak 99,5%. Nilai awal notebook (0,6) tidak dipakai.
 */
export const AMBANG_AWAL = 0.7;

/**
 * Ambang bila tebakan teratas CNN = huruf target (latihan tahu targetnya). Usulan 24 Nov, menunggu persetujuan Farrel:
 * tulisan yang menjiplak panduan (kerangka Noto Sans Javanese x 8 variasi, 20 huruf) diterima 82% -> 91% (ba 1/8 -> 5/8,
 * nga 0/8 -> 4/8: CNN menebak benar tetapi kurang yakin), sedangkan 600 coretan acak tetap 0 yang lolos untuk target mana pun.
 * "Terbaca huruf lain" tetap memakai AMBANG_AWAL.
 */
export const AMBANG_TARGET = 0.5;

export type HasilCek =
  | { jenis: 'benar'; keyakinan: number }
  | { jenis: 'terbaca_lain'; huruf: string; keyakinan: number }
  | { jenis: 'belum_terbaca' };

export function nilaiTulisan(
  prob: ArrayLike<number>,
  target: string,
  ambang = AMBANG_AWAL,
  label: readonly string[] = LABEL_MODEL1,
  ambangTarget = AMBANG_TARGET,
): HasilCek {
  let teratas = 0;
  for (let i = 1; i < prob.length; i++) if (prob[i] > prob[teratas]) teratas = i;
  const huruf = label[teratas];
  const keyakinan = prob[teratas];

  if (huruf === BUKAN_HURUF) return { jenis: 'belum_terbaca' };
  if (huruf === target) return keyakinan >= ambangTarget ? { jenis: 'benar', keyakinan } : { jenis: 'belum_terbaca' };
  if (keyakinan < ambang) return { jenis: 'belum_terbaca' };
  return { jenis: 'terbaca_lain', huruf, keyakinan };
}

/**
 * Batas bawah recall templat (tinta pengguna menutupi bentuk panduan) untuk tulisan yang sudah dibaca benar oleh CNN.
 * Hanya penjaga tambahan: CNN tetap hakim utama, templat tidak pernah cukup untuk meluluskan sendirian.
 */
export const RECALL_MIN_TEMPLAT = 0.36;

export type KeputusanLatihan =
  | { status: 'benar'; skor: number }
  | { status: 'huruf_lain'; huruf: string }
  | { status: 'belum_terbaca' }
  | { status: 'melenceng' }
  | { status: 'model_gagal' };

/**
 * Keputusan latihan menulis Bab 1 (huruf punya kode kelas Model 1).
 * - Lulus hanya bila CNN membaca huruf target (keyakinan >= AMBANG_TARGET di nilaiTulisan) DAN tinta cukup menutupi panduan.
 * - Coretan yang ditolak CNN ("belum terbaca") tidak pernah lulus, berapa pun skor templatnya (bug 18 Nov: garis
 *   diagonal/silang/zigzag lulus "99% sesuai" lewat templat saja).
 * - skor = keyakinan CNN dalam persen (bukan angka hiasan).
 * cnn = null berarti model gagal dimuat/dijalankan: pengguna diminta mencoba lagi, bukan diluluskan.
 */
export function putuskanLatihan(cnn: HasilCek | null, recallTemplat: number): KeputusanLatihan {
  if (!cnn) return { status: 'model_gagal' };
  if (cnn.jenis === 'terbaca_lain') return { status: 'huruf_lain', huruf: cnn.huruf };
  if (cnn.jenis === 'belum_terbaca') return { status: 'belum_terbaca' };
  if (recallTemplat < RECALL_MIN_TEMPLAT) return { status: 'melenceng' };
  return { status: 'benar', skor: Math.round(cnn.keyakinan * 100) };
}
