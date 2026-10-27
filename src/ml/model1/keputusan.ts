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

export type HasilCek =
  | { jenis: 'benar'; keyakinan: number }
  | { jenis: 'terbaca_lain'; huruf: string; keyakinan: number }
  | { jenis: 'belum_terbaca' };

export function nilaiTulisan(
  prob: ArrayLike<number>,
  target: string,
  ambang = AMBANG_AWAL,
  label: readonly string[] = LABEL_MODEL1,
): HasilCek {
  let teratas = 0;
  for (let i = 1; i < prob.length; i++) if (prob[i] > prob[teratas]) teratas = i;
  const huruf = label[teratas];
  const keyakinan = prob[teratas];

  if (keyakinan < ambang || huruf === BUKAN_HURUF) return { jenis: 'belum_terbaca' };
  if (huruf === target) return { jenis: 'benar', keyakinan };
  return { jenis: 'terbaca_lain', huruf, keyakinan };
}
