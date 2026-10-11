// F5 langkah 3: foto -> detektor baris (2b) -> pembaca baris (2a) -> transliterasi.
// Semua di perangkat; foto tidak pernah dikirim ke server. Target ≤ 3 detik.

import { urai, type SukuKata } from '../../aksara/urai';
import { muatModel } from '../onnx';

export interface BarisTerbaca {
  unicode: string;
  sukuKata: SukuKata[];
  keyakinan: number;
}

export interface HasilScan {
  baris: BarisTerbaca[];
  /** "Hasil mungkin kurang tepat" bila rata-rata keyakinan rendah. */
  kurangYakin: boolean;
}

export const AMBANG_YAKIN_SCAN = 0.7; // TODO(Farrel): setel saat uji.

/** Memanaskan model saat tab Scanner dibuka (tombol Baca nonaktif sampai selesai). */
export const siapkanScanner = () => Promise.all([muatModel('model2b'), muatModel('model2a')]);

export async function bacaFoto(_gambar: ImageBitmap): Promise<HasilScan> {
  // TODO(Farrel):
  // 1. grayscale, sisi terpanjang 1024 px, tepi dibulatkan ke kelipatan 32
  // 2. model2b -> peta inti baris ¼ resolusi -> kotak tiap baris
  // 3. tiap baris: tinggi 64 px, lebar ≤ 800 px, normalisasi kecerahan -> model2a
  // 4. dekodeGreedy() -> Unicode -> urai()
  await siapkanScanner();
  throw new Error('pipeline scanner belum diimplementasikan');
}

/** Dipakai bila pipeline sudah menghasilkan Unicode per baris. */
export function rakitHasil(baris: { unicode: string; keyakinan: number }[]): HasilScan {
  const hasil = baris.map((b) => ({ ...b, sukuKata: urai(b.unicode) }));
  const rata = hasil.reduce((a, b) => a + b.keyakinan, 0) / (hasil.length || 1);
  return { baris: hasil, kurangYakin: rata < AMBANG_YAKIN_SCAN };
}
