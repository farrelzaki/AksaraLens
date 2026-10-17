// F5 langkah 3: foto -> polaritas & deskew -> detektor baris (2b) -> pembaca baris (2a) -> transliterasi.
// Mengikuti baca_gambar() notebook Model 2 (sel 39). Semua di perangkat; foto tidak pernah
// dikirim ke server dan tidak disimpan. Target ≤ 3 detik.
//
// Penyimpangan sadar dari notebook (demi kecepatan di ponsel):
// - foto diperkecil dulu ke sisi terpanjang 2048 px;
// - sudut deskew dicari pada gambar ≤ 800 px (notebook: masker resolusi penuh lalu diperkecil).

import { urai, type SukuKata } from '../../aksara/urai';
import { muatModel, ortSiap } from '../onnx';
import { CHARSET, TINGGI_BARIS, dekodeGreedy, keInputBaris } from './ctc';
import { kotakDariLogit, masukanDetektor, potongBaris, type Kotak } from './detektor';
import { cariSudut, dariRGBA, maskerTinta, normalisasiPolaritas, putar, resize, type Gray } from './gambar';

export interface BarisTerbaca {
  unicode: string;
  sukuKata: SukuKata[];
  keyakinan: number;
}

export interface HasilScan {
  baris: BarisTerbaca[];
  /** "Hasil mungkin kurang tepat" bila rata-rata keyakinan rendah. */
  kurangYakin: boolean;
  /** Untuk uji kinerja (T-02); tidak ditampilkan di produksi. */
  info: { waktuMs: number; sudut: number; kotak: Kotak[] };
}

export const AMBANG_YAKIN_SCAN = 0.7; // TODO(Farrel): setel saat uji foto kamera.
const SISI_MAKS = 2048;
const SISI_SUDUT = 800;

/** Memanaskan model saat tab Scanner dibuka (tombol Baca nonaktif sampai selesai). */
export const siapkanScanner = () => Promise.all([muatModel('model2b'), muatModel('model2a')]);

/** Gambar (File/Blob) -> grayscale, latar transparan dianggap putih, sisi terpanjang ≤ 2048. */
export async function grayDariBerkas(berkas: Blob): Promise<Gray> {
  const bmp = await createImageBitmap(berkas, { imageOrientation: 'from-image' });
  const kanvas = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = kanvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, bmp.width, bmp.height);
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const g = dariRGBA(ctx.getImageData(0, 0, kanvas.width, kanvas.height).data, kanvas.width, kanvas.height);
  const s = SISI_MAKS / Math.max(g.w, g.h);
  return s < 1 ? resize(g, Math.round(g.w * s), Math.round(g.h * s)) : g;
}

export async function bacaGray(gray: Gray): Promise<HasilScan> {
  const mulai = performance.now();
  const [ort, det, pembaca] = await Promise.all([ortSiap(), muatModel('model2b'), muatModel('model2a')]);

  // 1. polaritas & deskew
  let g = normalisasiPolaritas(gray);
  const sk = Math.min(1, SISI_SUDUT / Math.max(g.w, g.h));
  const kecil = sk < 1 ? resize(g, Math.round(g.w * sk), Math.round(g.h * sk)) : g;
  const sudut = cariSudut(maskerTinta(kecil));
  if (sudut !== 0) g = putar(g, sudut, 255);

  // 2. detektor baris
  const m = masukanDetektor(g);
  const keluarDet = await det.run({ [det.inputNames[0]]: new ort.Tensor('float32', m.data, [1, 1, m.H, m.W]) });
  const peta = keluarDet[det.outputNames[0]];
  const [, , h4, w4] = peta.dims;
  const kotak = kotakDariLogit(peta.data as Float32Array, h4, w4, m.skala);

  // 3. baca tiap baris
  const baris: { unicode: string; keyakinan: number }[] = [];
  for (const crop of potongBaris(g, kotak)) {
    const { data, lebar } = keInputBaris(crop);
    const keluar = await pembaca.run({
      [pembaca.inputNames[0]]: new ort.Tensor('float32', data, [1, 1, TINGGI_BARIS, lebar]),
    });
    const { teks, keyakinan } = dekodeGreedy(keluar[pembaca.outputNames[0]].data as Float32Array, CHARSET.length);
    if (teks) baris.push({ unicode: teks, keyakinan });
  }

  return rakitHasil(baris, { waktuMs: performance.now() - mulai, sudut, kotak });
}

export const bacaFoto = async (berkas: Blob) => bacaGray(await grayDariBerkas(berkas));

export function rakitHasil(baris: { unicode: string; keyakinan: number }[], info: HasilScan['info']): HasilScan {
  const hasil = baris.map((b) => ({ ...b, sukuKata: urai(b.unicode) }));
  const rata = hasil.reduce((a, b) => a + b.keyakinan, 0) / (hasil.length || 1);
  return { baris: hasil, kurangYakin: hasil.length > 0 && rata < AMBANG_YAKIN_SCAN, info };
}
