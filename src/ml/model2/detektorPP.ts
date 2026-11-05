// Detektor teks PP-OCRv5 mobile (Apache-2.0, PaddlePaddle/PP-OCRv5_mobile_det_onnx) menggantikan U-Net baris.
// Padanan Python: kotak_pp() di docs/EVALUASI.md bagian "detektor siap pakai". Keluaran: kotak di koordinat gambar asli.

import type { Kotak } from './detektor';
import { resize, type Gray } from './gambar';

const SISI = 640; // sisi terpanjang masukan; 960 sama akuratnya di Set C dan NusaAksara tetapi jauh lebih lambat di ponsel
const KELIPATAN = 32;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
export const AMBANG_PP = 0.3; // piksel dianggap teks bila peluang > ambang
export const SKOR_PP = 0.5; // rata-rata peluang minimal satu kotak
const UNCLIP = 1.5; // pelebaran kotak DB, kali luas / setengah keliling

export interface MasukanPP {
  data: Float32Array; // [1, 3, H, W], ImageNet-normalized
  H: number;
  W: number;
  /** Faktor gambar asli / masukan per sumbu. */
  fx: number;
  fy: number;
}

/** Gray -> tensor 3 kanal; sisi terpanjang 640, tiap sisi kelipatan 32 (min 32). */
export function masukanPP(gray: Gray): MasukanPP {
  const k = SISI / Math.max(gray.w, gray.h);
  const W = Math.max(KELIPATAN, Math.round((gray.w * k) / KELIPATAN) * KELIPATAN);
  const H = Math.max(KELIPATAN, Math.round((gray.h * k) / KELIPATAN) * KELIPATAN);
  const g = resize(gray, W, H);
  const n = H * W;
  const data = new Float32Array(3 * n);
  for (let c = 0; c < 3; c++) {
    const o = c * n;
    for (let i = 0; i < n; i++) data[o + i] = (g.d[i] / 255 - MEAN[c]) / STD[c];
  }
  return { data, H, W, fx: gray.w / W, fy: gray.h / H };
}

/** Peta peluang [h, w] -> kotak teks (komponen 4-tetangga), urut atas-ke-bawah. */
export function kotakDariPeta(peta: ArrayLike<number>, h: number, w: number, fx: number, fy: number, lebarAsli: number, tinggiAsli: number): Kotak[] {
  const label = new Uint8Array(h * w);
  const tumpuk: number[] = [];
  const kotak: Kotak[] = [];
  for (let s = 0; s < peta.length; s++) {
    if (label[s] || !(peta[s] > AMBANG_PP)) continue;
    let [x0, y0, x1, y1, luas, jumlah] = [w, h, -1, -1, 0, 0];
    label[s] = 1;
    tumpuk.push(s);
    while (tumpuk.length) {
      const p = tumpuk.pop()!;
      const x = p % w;
      const y = (p - x) / w;
      luas++;
      jumlah += peta[p];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && !label[p - 1] && peta[p - 1] > AMBANG_PP) ((label[p - 1] = 1), tumpuk.push(p - 1));
      if (x < w - 1 && !label[p + 1] && peta[p + 1] > AMBANG_PP) ((label[p + 1] = 1), tumpuk.push(p + 1));
      if (y > 0 && !label[p - w] && peta[p - w] > AMBANG_PP) ((label[p - w] = 1), tumpuk.push(p - w));
      if (y < h - 1 && !label[p + w] && peta[p + w] > AMBANG_PP) ((label[p + w] = 1), tumpuk.push(p + w));
    }
    const bw = x1 - x0 + 1;
    const bh = y1 - y0 + 1;
    if (bw < 3 || bh < 3 || jumlah / luas < SKOR_PP) continue;
    const d = (UNCLIP * luas) / (2 * (bw + bh));
    kotak.push([Math.max(0, (x0 - d) * fx), Math.max(0, (y0 - d) * fy), Math.min(lebarAsli, (x1 + 1 + d) * fx), Math.min(tinggiAsli, (y1 + 1 + d) * fy)]);
  }
  return kotak.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
