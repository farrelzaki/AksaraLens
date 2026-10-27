// Pembaca baris (Model 2a): pra-proses ke_input() dan dekode greedy CTC.
// Salinan dari notebook Model 2 (sel 14 & 20). Charset & tinggi baris dari scanner_charset.json.

import meta from './scanner_charset.json';
import { keLogis } from '../../aksara/urutan';
import { bulat, persentil, resize, type Gray } from './gambar';

/** Indeks = kelas keluaran ONNX; indeks 0 = blank. */
export const CHARSET: readonly string[] = meta.charset.map((c, i) => (i === meta.blank ? '' : c));
export const TINGGI_BARIS = meta.line_height;
export const LEBAR_MAKS = 4000; // max_w di baca_gambar()

/** ke_input: tinggi 64 (lebar proporsional, INTER_AREA), tinta=1 latar=0, normalisasi p2–p98. */
export function keInputBaris(crop: Gray): { data: Float32Array; lebar: number } {
  const nw = Math.max(8, Math.min(LEBAR_MAKS, bulat((crop.w * TINGGI_BARIS) / crop.h)));
  const g = resize(crop, nw, TINGGI_BARIS);
  const lo = persentil(g.d, 2);
  const hi = persentil(g.d, 98);
  const rentang = Math.max(hi - lo, 1);
  const data = new Float32Array(g.d.length);
  for (let i = 0; i < data.length; i++) data[i] = Math.min(1, Math.max(0, (hi - g.d[i]) / rentang));
  return { data, lebar: nw };
}

/**
 * Greedy CTC atas logit [T, C] yang diratakan. Teks dikembalikan ke urutan logis (keLogis).
 * Keyakinan = rata-rata peluang softmax tertinggi pada kolom yang bukan blank (seperti notebook).
 */
export function dekodeGreedy(
  logit: ArrayLike<number>,
  jumlahKelas: number,
  charset: readonly string[] = CHARSET,
): { teks: string; keyakinan: number } {
  const T = logit.length / jumlahKelas;
  let teks = '';
  let sebelum = 0;
  let total = 0;
  let n = 0;
  for (let t = 0; t < T; t++) {
    const o = t * jumlahKelas;
    let terbaik = 0;
    for (let c = 1; c < jumlahKelas; c++) if (logit[o + c] > logit[o + terbaik]) terbaik = c;
    if (terbaik !== 0) {
      let jumlah = 0;
      for (let c = 0; c < jumlahKelas; c++) jumlah += Math.exp(logit[o + c] - logit[o + terbaik]);
      total += 1 / jumlah;
      n++;
      if (terbaik !== sebelum) teks += charset[terbaik];
    }
    sebelum = terbaik;
  }
  return { teks: keLogis(teks), keyakinan: n ? total / n : 0 };
}
