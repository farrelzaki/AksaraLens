// Klasifikator aksara kecil: potongan kotak detektor -> apakah aksara Jawa. Menyaring Latin, aksara lain, dan tekstur
// sebelum dibaca. Padanan Python: ke_input() di scripts/klasifikator_aksara.py (latihan dan uji memakai fungsi itu).

import { bulat, persentil, resize, type Gray } from './gambar';

export const TINGGI_KL = 32;
export const LEBAR_KL = 160;
/** Peluang minimal "Jawa" agar kotak dibaca; dipilih dari uji Set C dan NusaAksara (docs/EVALUASI.md). */
export const AMBANG_JAWA = 0.5;
const LOGIT_AMBANG = Math.log(AMBANG_JAWA / (1 - AMBANG_JAWA));

/** Potongan -> [32 x 160] 0..1: resize INTER_AREA, normalisasi persentil 2..98, dibulatkan ke uint8 seperti Python. */
export function masukanKlasifikator(crop: Gray): Float32Array {
  const g = resize(crop, LEBAR_KL, TINGGI_KL, undefined, undefined, false);
  const lo = persentil(g.d, 2);
  const lebar = Math.max(persentil(g.d, 98) - lo, 1);
  const out = new Float32Array(g.d.length);
  for (let i = 0; i < out.length; i++) out[i] = bulat(Math.min(Math.max((g.d[i] - lo) / lebar, 0), 1) * 255) / 255;
  return out;
}

export const lolosJawa = (logit: number) => logit > LOGIT_AMBANG;
