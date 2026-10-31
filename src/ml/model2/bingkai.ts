// F5 langkah 2 "Atur area": bingkai potong dalam koordinat relatif foto (0..1). Fungsi murni.

export interface Bingkai {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Pegangan = 'geser' | 'kiri-atas' | 'kanan-atas' | 'kiri-bawah' | 'kanan-bawah';

export const PENUH: Bingkai = { x: 0, y: 0, w: 1, h: 1 };

/** Sisi bingkai minimal (relatif foto) agar tidak bisa diperkecil sampai hilang. */
export const SISI_MIN = 0.08;

const jepit = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Menggeser (pegangan 'geser') atau menarik sudut bingkai sejauh (dx, dy), tetap di dalam foto. */
export function ubahBingkai(b: Bingkai, pegangan: Pegangan, dx: number, dy: number): Bingkai {
  if (pegangan === 'geser') return { ...b, x: jepit(b.x + dx, 0, 1 - b.w), y: jepit(b.y + dy, 0, 1 - b.h) };
  let [kiri, atas, kanan, bawah] = [b.x, b.y, b.x + b.w, b.y + b.h];
  if (pegangan.startsWith('kiri')) kiri = jepit(kiri + dx, 0, kanan - SISI_MIN);
  else kanan = jepit(kanan + dx, kiri + SISI_MIN, 1);
  if (pegangan.endsWith('atas')) atas = jepit(atas + dy, 0, bawah - SISI_MIN);
  else bawah = jepit(bawah + dy, atas + SISI_MIN, 1);
  return { x: kiri, y: atas, w: kanan - kiri, h: bawah - atas };
}

/** Bingkai relatif -> kotak piksel [x0, y0, x1, y1) di gambar w×h (minimal 1 piksel). */
export function kePiksel(b: Bingkai, w: number, h: number): [number, number, number, number] {
  const x0 = jepit(Math.round(b.x * w), 0, w - 1);
  const y0 = jepit(Math.round(b.y * h), 0, h - 1);
  const x1 = jepit(Math.round((b.x + b.w) * w), x0 + 1, w);
  const y1 = jepit(Math.round((b.y + b.h) * h), y0 + 1, h);
  return [x0, y0, x1, y1];
}

export const sama = (a: Bingkai, b: Bingkai) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

/**
 * Bingkai bidik di layar -> area relatif pada video yang ditampilkan dengan object-fit: cover.
 * `kotak` = posisi bingkai relatif ke elemen video, dalam piksel layar.
 */
export function bingkaiDariLayar(
  video: { w: number; h: number },
  elemen: { w: number; h: number },
  kotak: { x: number; y: number; w: number; h: number },
): Bingkai {
  const skala = Math.max(elemen.w / video.w, elemen.h / video.h); // cover: sisi lebih pendek memenuhi elemen
  const tampilW = video.w * skala;
  const tampilH = video.h * skala;
  const x0 = Math.max(0, (kotak.x + (tampilW - elemen.w) / 2) / tampilW);
  const y0 = Math.max(0, (kotak.y + (tampilH - elemen.h) / 2) / tampilH);
  const x1 = Math.min(1, (kotak.x + kotak.w + (tampilW - elemen.w) / 2) / tampilW);
  const y1 = Math.min(1, (kotak.y + kotak.h + (tampilH - elemen.h) / 2) / tampilH);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
