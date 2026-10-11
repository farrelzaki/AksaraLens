// Dekode greedy CTC untuk keluaran Model 2a. Fungsi murni, wajib dites.

// TODO(Farrel): samakan urutan dengan charset notebook Model 2a. Indeks 0 = blank.
export const CHARSET_MODEL2A: readonly string[] = [
  '',
  'ꦲ', 'ꦤ', 'ꦕ', 'ꦫ', 'ꦏ', 'ꦢ', 'ꦠ', 'ꦱ', 'ꦮ', 'ꦭ',
  'ꦥ', 'ꦝ', 'ꦗ', 'ꦪ', 'ꦚ', 'ꦩ', 'ꦒ', 'ꦧ', 'ꦛ', 'ꦔ',
  'ꦶ', 'ꦸ', 'ꦺ', 'ꦴ', 'ꦼ',
  'ꦂ', 'ꦁ', 'ꦃ',
  '꧀', '꧈', '꧉',
];

/**
 * @param prob probabilitas (atau logit) berbentuk [T, C] yang diratakan
 * @returns teks Unicode dan rata-rata keyakinan karakter yang dipancarkan
 */
export function dekodeGreedy(
  prob: ArrayLike<number>,
  jumlahKelas: number,
  charset: readonly string[] = CHARSET_MODEL2A,
): { teks: string; keyakinan: number } {
  const T = prob.length / jumlahKelas;
  let teks = '';
  let sebelum = -1;
  let total = 0;
  let n = 0;
  for (let t = 0; t < T; t++) {
    let terbaik = 0;
    for (let c = 1; c < jumlahKelas; c++) {
      if (prob[t * jumlahKelas + c] > prob[t * jumlahKelas + terbaik]) terbaik = c;
    }
    if (terbaik !== 0 && terbaik !== sebelum) {
      teks += charset[terbaik];
      total += prob[t * jumlahKelas + terbaik];
      n++;
    }
    sebelum = terbaik;
  }
  return { teks, keyakinan: n ? total / n : 0 };
}
