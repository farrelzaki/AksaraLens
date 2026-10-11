// F4 langkah 4: dari probabilitas CNN ke umpan balik. Fungsi murni, wajib dites.

// TODO(Farrel): samakan urutan dengan notebook Model 1 (indeks kelas keluaran ONNX).
export const LABEL_MODEL1 = [
  'ha', 'na', 'ca', 'ra', 'ka', 'da', 'ta', 'sa', 'wa', 'la',
  'pa', 'dha', 'ja', 'ya', 'nya', 'ma', 'ga', 'ba', 'tha', 'nga',
  'bukan_huruf',
] as const;

/** Awal 0,6; disetel saat uji (keputusan terbuka, batas 8 Nov). */
export const AMBANG_AWAL = 0.6;

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

  if (keyakinan < ambang || huruf === 'bukan_huruf') return { jenis: 'belum_terbaca' };
  if (huruf === target) return { jenis: 'benar', keyakinan };
  return { jenis: 'terbaca_lain', huruf, keyakinan };
}
