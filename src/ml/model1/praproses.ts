// F4 langkah 3: gambar kanvas -> masukan Model 1 [1, 1, 64, 64] (tinta = 1).
// Salinan praproses() notebook Model 1 (sel 5) dan huruf_label.json:
// grayscale -> blur 3×3 -> Otsu (INV, balik bila tinta > 50%) -> buang komponen kecil ->
// potong ke kotak tinta, persegi + margin 12% -> 128×128 INTER_AREA, ambang > 30 ->
// skeleton Zhang-Suen -> dilate elips 5×5 -> 64×64 INTER_AREA (0..1). Fungsi murni.

import { blur3, bulat, buatGray, dariRGBA, komponenTerhubung, otsu, resize, type Gray } from '../model2/gambar';

export const UKURAN = 64;
const ANTARA = 128;

/** ke_gray: kanal alfa ditempel di latar putih (truncate ke uint8 seperti astype), lalu grayscale. */
export function grayDariKanvas(rgba: ArrayLike<number>, w: number, h: number): Gray {
  const rgb = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3] / 255;
    for (let c = 0; c < 3; c++) rgb[i + c] = Math.trunc(rgba[i + c] * a + 255 * (1 - a));
    rgb[i + 3] = 255;
  }
  return dariRGBA(rgb, w, h);
}

/** Masker tinta setelah Otsu & pembersihan bintik (true = tinta). */
export function maskerTulisan(gray: Gray): Uint8Array {
  const g = blur3(gray);
  const t = otsu(g);
  const m = new Uint8Array(g.d.length);
  let tinta = 0;
  for (let i = 0; i < m.length; i++) if ((m[i] = g.d[i] <= t ? 1 : 0)) tinta++;
  if (tinta / m.length > 0.5) for (let i = 0; i < m.length; i++) m[i] ^= 1;
  // buang komponen < max(4, 0,05% luas)
  const minLuas = Math.max(4, 0.0005 * m.length);
  const label = new Int32Array(m.length);
  const komp = komponenTerhubung(m, gray.w, gray.h, label);
  for (let i = 0; i < m.length; i++) if (m[i] && komp[label[i]].luas < minLuas) m[i] = 0;
  return m;
}

/** Kotak pembatas tinta [x0, y0, x1, y1) atau null bila kosong. */
export function kotakTinta(m: Uint8Array, w: number, h: number): [number, number, number, number] | null {
  let [x0, y0, x1, y1] = [w, h, -1, -1];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (m[y * w + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1];
}

// LUT dari scikit-image (_skeletonize_various_cy.pyx, _fast_skeletonize; BSD-3-Clause):
// 1 = hapus di lintasan pertama, 2 = di lintasan kedua, 3 = keduanya.
// Indeks = NW + 2·N + 4·NE + 8·E + 16·SE + 32·S + 64·SW + 128·W.
const LUT_SKELETON = Uint8Array.from([
  0, 0, 0, 1, 0, 0, 1, 3, 0, 0, 3, 1, 1, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 3, 0, 3, 3,
  0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 2, 2,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 2, 0,
  0, 0, 3, 1, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 3, 1, 3, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  2, 3, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 1, 0, 0, 0, 0, 2, 2, 0, 0, 2, 0, 0, 0,
]);

/** skimage.morphology.skeletonize (2D, metode Zhang) persis: dua lintasan paralel sampai stabil. */
export function skeleton(src: Uint8Array, w: number, h: number): Uint8Array {
  const W = w + 2;
  const s = new Uint8Array(W * (h + 2)); // tepi 1 piksel bernilai 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) s[(y + 1) * W + x + 1] = src[y * w + x] ? 1 : 0;
  const bersih = Uint8Array.from(s);
  let berubah = true;
  while (berubah) {
    berubah = false;
    for (let lintas = 0; lintas < 2; lintas++) {
      for (let y = 1; y <= h; y++)
        for (let x = 1; x <= w; x++) {
          const i = y * W + x;
          if (!s[i]) continue;
          const n = LUT_SKELETON[
            s[i - W - 1] + 2 * s[i - W] + 4 * s[i - W + 1] + 8 * s[i + 1] + 16 * s[i + W + 1] + 32 * s[i + W] + 64 * s[i + W - 1] + 128 * s[i - 1]
          ];
          if (n === 3 || (n === 1 && lintas === 0) || (n === 2 && lintas === 1)) {
            bersih[i] = 0;
            berubah = true;
          }
        }
      s.set(bersih);
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = s[(y + 1) * W + x + 1];
  return out;
}

/** cv2.dilate dengan elips 5×5 (baris atas & bawah hanya piksel tengah). */
const ELIPS5 = [
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
];
export function dilasiElips5(m: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(m.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const yy = y + dy;
          const xx = x + dx;
          if (ELIPS5[dy + 2][dx + 2] && yy >= 0 && xx >= 0 && yy < h && xx < w) out[yy * w + xx] = 1;
        }
    }
  return out;
}

/** Langkah sampai citra biner 128×128 (sebelum skeleton); null bila tidak ada tinta. */
export function biner128(gray: Gray): Uint8Array | null {
  const m = maskerTulisan(gray);
  const kotak = kotakTinta(m, gray.w, gray.h);
  if (!kotak) return null;
  const [x0, y0, x1, y1] = kotak;
  const w = x1 - x0;
  const h = y1 - y0;
  const s = Math.max(w, h);
  const pad = bulat(s * 0.12);
  const S = s + 2 * pad;
  const sq = buatGray(S, S);
  const oy = Math.floor((S - h) / 2);
  const ox = Math.floor((S - w) / 2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) sq.d[(oy + y) * S + ox + x] = m[(y0 + y) * gray.w + x0 + x] ? 255 : 0;

  const k = resize(sq, ANTARA, ANTARA);
  const biner = new Uint8Array(ANTARA * ANTARA);
  for (let i = 0; i < biner.length; i++) biner[i] = k.d[i] > 30 ? 1 : 0;
  return biner;
}

/** praproses(): kosong -> null (tombol Cek nonaktif). */
export function praproses(gray: Gray): Float32Array | null {
  const biner = biner128(gray);
  if (!biner) return null;
  const tebal = dilasiElips5(skeleton(biner, ANTARA, ANTARA), ANTARA, ANTARA);

  const f = buatGray(ANTARA, ANTARA);
  for (let i = 0; i < tebal.length; i++) f.d[i] = tebal[i];
  return resize(f, UKURAN, UKURAN, undefined, undefined, false).d;
}

/** Sisi terpanjang tulisan minimal 15% sisi pendek kanvas. TODO(Farrel): setel saat uji kanvas. */
export const UKURAN_MIN = 0.15;

/** F4 langkah 6: kanvas kosong / tulisan terlalu kecil -> tombol Cek nonaktif. */
export function statusKanvas(gray: Gray): 'kosong' | 'terlalu_kecil' | 'siap' {
  const kotak = kotakTinta(maskerTulisan(gray), gray.w, gray.h);
  if (!kotak) return 'kosong';
  const sisi = Math.max(kotak[2] - kotak[0], kotak[3] - kotak[1]) / Math.min(gray.w, gray.h);
  return sisi < UKURAN_MIN ? 'terlalu_kecil' : 'siap';
}
