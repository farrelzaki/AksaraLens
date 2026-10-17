// F4 langkah 3–4: kanvas -> praproses (identik notebook) -> Model 1 (ONNX) -> umpan balik.
// Dipakai halaman latihan menulis; Model 1 dimuat saat halaman itu dibuka (siapkanPemeriksa).

import { muatModel, ortSiap } from '../onnx';
import { nilaiTulisan, type HasilCek } from './keputusan';
import { UKURAN, grayDariKanvas, praproses, statusKanvas } from './praproses';

export type { HasilCek };
export type StatusKanvas = ReturnType<typeof statusKanvas>;

export const siapkanPemeriksa = () => muatModel('model1');

const grayDari = (kanvas: HTMLCanvasElement | OffscreenCanvas) => {
  const ctx = kanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  const { data } = ctx.getImageData(0, 0, kanvas.width, kanvas.height);
  return grayDariKanvas(data, kanvas.width, kanvas.height);
};

/** Untuk menonaktifkan tombol Cek: 'kosong' | 'terlalu_kecil' | 'siap'. */
export const cekKanvas = (kanvas: HTMLCanvasElement | OffscreenCanvas): StatusKanvas => statusKanvas(grayDari(kanvas));

/** Mengembalikan null bila kanvas kosong. Target ≤ 200 ms. */
export async function periksaTulisan(kanvas: HTMLCanvasElement | OffscreenCanvas, target: string): Promise<HasilCek | null> {
  const masukan = praproses(grayDari(kanvas));
  if (!masukan) return null;
  const [sesi, ort] = await Promise.all([muatModel('model1'), ortSiap()]);
  const keluaran = await sesi.run({ [sesi.inputNames[0]]: new ort.Tensor('float32', masukan, [1, 1, UKURAN, UKURAN]) });
  return nilaiTulisan(softmax(keluaran[sesi.outputNames[0]].data as Float32Array), target);
}

function softmax(x: Float32Array): Float32Array {
  let maks = -Infinity;
  for (const v of x) if (v > maks) maks = v;
  const e = x.map((v) => Math.exp(v - maks));
  const jumlah = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / jumlah);
}
