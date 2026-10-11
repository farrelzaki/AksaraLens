// F4 langkah 3: kanvas -> 64×64 grayscale -> CNN. Pra-proses HARUS identik dengan
// notebook latih: Otsu -> potong ke coretan -> kotak margin 12% -> kerangka + tebalkan -> 64×64.

import { muatModel } from '../onnx';
import { nilaiTulisan, type HasilCek } from './keputusan';

export const UKURAN = 64;

/** Mengembalikan null bila coretan kosong/terlalu kecil ("Tulisan terlalu kecil"). */
export function praproses(_kanvas: HTMLCanvasElement): Float32Array | null {
  // TODO(Farrel): implementasi sesuai notebook Model 1.
  throw new Error('praproses Model 1 belum diimplementasikan');
}

export async function periksaTulisan(kanvas: HTMLCanvasElement, target: string): Promise<HasilCek | null> {
  const masukan = praproses(kanvas);
  if (!masukan) return null;
  const [sesi, ort] = await Promise.all([muatModel('model1'), import('onnxruntime-web')]);
  const tensor = new ort.Tensor('float32', masukan, [1, 1, UKURAN, UKURAN]);
  const keluaran = await sesi.run({ [sesi.inputNames[0]]: tensor });
  const logit = keluaran[sesi.outputNames[0]].data as Float32Array;
  return nilaiTulisan(softmax(logit), target);
}

function softmax(x: Float32Array): Float32Array {
  const maks = Math.max(...x);
  const e = x.map((v) => Math.exp(v - maks));
  const jumlah = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / jumlah);
}
