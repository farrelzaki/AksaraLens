// Detektor baris (Model 2b): masukan, peta inti -> kotak baris, dan potongan baris.
// Salinan kotak_detektor() dan potong_dengan_detektor() dari notebook Model 2 (sel 36 & 39).

import meta from './scanner_charset.json';
import { bulat, komponenTerhubung, potong, resize, type Gray } from './gambar';

const { sisi_terpanjang: SISI, kelipatan: KELIPATAN, skala_keluaran: SKALA, inti: INTI } = meta.detektor;

export type Kotak = [x0: number, y0: number, x1: number, y1: number];

export interface MasukanDetektor {
  data: Float32Array; // [1, 1, H, W], tinta=1
  H: number;
  W: number;
  skala: number;
}

/** Sisi terpanjang 1024 (INTER_AREA), pad kanan-bawah putih ke kelipatan 32, tinta=1. */
export function masukanDetektor(gray: Gray): MasukanDetektor {
  const s = SISI / Math.max(gray.w, gray.h);
  const g = resize(gray, bulat(gray.w * s), bulat(gray.h * s), 1 / s, 1 / s);
  const H = Math.ceil(g.h / KELIPATAN) * KELIPATAN;
  const W = Math.ceil(g.w / KELIPATAN) * KELIPATAN;
  const data = new Float32Array(H * W); // padding 255 -> (255-255)/255 = 0
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) data[y * W + x] = (255 - g.d[y * g.w + x]) / 255;
  return { data, H, W, skala: s };
}

/** Logit inti baris [h4, w4] -> kotak baris di koordinat gambar asli, urut atas-ke-bawah. */
export function kotakDariLogit(logit: ArrayLike<number>, h4: number, w4: number, skala: number, ambang = meta.detektor.ambang): Kotak[] {
  // sigmoid(x) > ambang  <=>  x > logit(ambang)
  const batas = Math.log(ambang / (1 - ambang));
  const aktif = new Uint8Array(h4 * w4);
  for (let i = 0; i < aktif.length; i++) aktif[i] = logit[i] > batas ? 1 : 0;
  const kotak: Kotak[] = [];
  for (const k of komponenTerhubung(aktif, w4, h4)) {
    if (k.w < 3 || k.luas < 6) continue;
    const cy = (k.y0 + k.h / 2) * SKALA;
    const hh = (k.h * SKALA) / INTI;
    kotak.push([(k.x0 * SKALA) / skala, (cy - hh / 2) / skala, ((k.x0 + k.w) * SKALA) / skala, (cy + hh / 2) / skala]);
  }
  return kotak.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

/** Potongan baris dengan margin (5% tinggi atas-bawah, 30% tinggi kiri-kanan). */
export function potongBaris(gray: Gray, kotak: Kotak[]): Gray[] {
  const hasil: Gray[] = [];
  for (const [x0, y0, x1, y1] of kotak) {
    const h = y1 - y0;
    const m = 0.05 * h;
    const a = Math.trunc(Math.max(0, y0 - m));
    const b = Math.trunc(Math.min(gray.h, y1 + m));
    const c = Math.trunc(Math.max(0, x0 - h * 0.3));
    const d = Math.trunc(Math.min(gray.w, x1 + h * 0.3));
    if (b - a >= 8 && d - c >= 8) hasil.push(potong(gray, c, a, d, b));
  }
  return hasil;
}
