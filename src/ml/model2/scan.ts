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
import { kotakDariLogit, masukanDetektor, potongSatu, type Kotak } from './detektor';
import { PENUH, kePiksel, sama, type Bingkai } from './bingkai';
import { balik, cariSudut, dariRGBA, maskerTinta, normalisasiPolaritas, persentil, potong, putar, resize, type Gray } from './gambar';
import { gabungBaris, iou, nilaiKualitas, nilaiStatus, pilihArea, pilihBaris, terapkanBukti, type Calon, type Kualitas, type Mode } from './saring';

export interface BarisTerbaca {
  unicode: string;
  sukuKata: SukuKata[];
  keyakinan: number;
  /** RAGU: tetap tampil dengan tanda "mungkin kurang tepat" (PRD F5). */
  status: 'TERIMA' | 'RAGU';
}

export interface HasilScan {
  baris: BarisTerbaca[];
  /** "Hasil mungkin kurang tepat" bila ada baris RAGU. */
  kurangYakin: boolean;
  /** Teks lain yang terdeteksi tapi ditolak (Latin, noise). */
  diabaikan: number;
  /** Petunjuk pesan saat tidak ada yang terbaca. */
  kualitas: Kualitas;
  /** Untuk uji kinerja (T-02); tidak ditampilkan di produksi. */
  info: { waktuMs: number; sudut: number; kotak: Kotak[] };
}

const SISI_MAKS = 2048;
const SISI_SUDUT = 800;

/**
 * Memanaskan model (dipanggil di worker; halaman memakai scanner.ts). Selain memuat, menjalankan satu
 * inferensi kecil agar inisialisasi backend (mis. kompilasi shader WebGPU, ±2 dtk) tidak terjadi
 * saat pengguna menekan Baca.
 */
let pemanasan: Promise<void> | null = null;
export function siapkanScanner(): Promise<void> {
  pemanasan ??= panaskan().catch((e) => {
    pemanasan = null;
    throw e;
  });
  return pemanasan;
}

async function panaskan(): Promise<void> {
  const [ort, det, pembaca] = await Promise.all([ortSiap(), muatModel('model2b'), muatModel('model2a')]);
  const kosong = () => new Float32Array(TINGGI_BARIS * TINGGI_BARIS);
  await det.run({ [det.inputNames[0]]: new ort.Tensor('float32', kosong(), [1, 1, TINGGI_BARIS, TINGGI_BARIS]) });
  await pembaca.run({ [pembaca.inputNames[0]]: new ort.Tensor('float32', kosong(), [1, 1, TINGGI_BARIS, TINGGI_BARIS]) });
}

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

const SAMA_KOTAK = 0.7; // IoU dua kotak yang dianggap baris yang sama

export async function bacaGray(gray: Gray, mode: Mode = 'foto'): Promise<HasilScan> {
  const mulai = performance.now();
  await siapkanScanner();
  const [ort, det, pembaca] = await Promise.all([ortSiap(), muatModel('model2b'), muatModel('model2a')]);

  // 1. polaritas & deskew halaman
  let g = normalisasiPolaritas(gray);
  const sk = Math.min(1, SISI_SUDUT / Math.max(g.w, g.h));
  const kecil = sk < 1 ? resize(g, Math.round(g.w * sk), Math.round(g.h * sk)) : g;
  const sudut = cariSudut(maskerTinta(kecil));
  if (sudut !== 0) g = putar(g, sudut, 255);

  const baca = async (crop: Gray) => {
    const { data, lebar } = keInputBaris(crop);
    const keluar = await pembaca.run({
      [pembaca.inputNames[0]]: new ort.Tensor('float32', data, [1, 1, TINGGI_BARIS, lebar]),
    });
    return dekodeGreedy(keluar[pembaca.outputNames[0]].data as Float32Array, CHARSET.length);
  };
  // Tulisan terang di papan gelap: polaritas ditentukan per potongan, pakai arah yang lebih yakin.
  // Arah pertama yang sudah diterima tidak perlu dibandingkan lagi.
  const bacaDuaArah = async (crop: Gray) => {
    const a = await baca(crop);
    if (nilaiStatus(a.teks, a.keyakinan, mode) === 'TERIMA') return a;
    const b = await baca(balik(crop));
    return a.keyakinan >= b.keyakinan ? a : b;
  };

  // 2. detektor pada dua polaritas (yang kedua hanya bila belum ada baris diterima), kotak sebaris digabung
  const calon: Calon[] = [];
  const semuaKotak: Kotak[] = [];
  for (const sumber of [g, balik(g)]) {
    if (calon.some((c) => c.status === 'TERIMA')) break;
    const m = masukanDetektor(sumber);
    const keluarDet = await det.run({ [det.inputNames[0]]: new ort.Tensor('float32', m.data, [1, 1, m.H, m.W]) });
    const peta = keluarDet[det.outputNames[0]];
    const [, , h4, w4] = peta.dims;
    for (const kotak of gabungBaris(kotakDariLogit(peta.data as Float32Array, h4, w4, m.skala))) {
      if (semuaKotak.some((k) => iou(k, kotak) >= SAMA_KOTAK)) continue; // sudah dibaca pada polaritas lain
      semuaKotak.push(kotak);
      // 3. baca tiap baris; pelurusan per baris hanya di mode area demi target waktu
      const crop = potongSatu(g, kotak);
      if (!crop) continue;
      const { teks, keyakinan } = await bacaDuaArah(mode === 'area' ? luruskan(crop) : crop);
      if (teks) calon.push({ unicode: teks, keyakinan, kotak, status: nilaiStatus(teks, keyakinan, mode) });
    }
  }

  let terpilih = pilihBaris(calon);
  if (mode === 'area') {
    const { teks, keyakinan } = await bacaDuaArah(luruskan(g));
    const satu: Calon | null = teks ? { unicode: teks, keyakinan, kotak: [0, 0, g.w, g.h], status: nilaiStatus(teks, keyakinan, mode) } : null;
    terpilih = pilihArea(terpilih, satu);
  } else {
    terpilih = terapkanBukti(terpilih);
  }

  return rakitHasil(terpilih, nilaiKualitas(kecil.d, kecil.w, kecil.h), { waktuMs: performance.now() - mulai, sudut, kotak: semuaKotak });
}

/** Pelurusan lokal: papan miring tidak ikut sudut halaman. */
function luruskan(crop: Gray): Gray {
  const sudut = cariSudut(maskerTinta(crop));
  return sudut ? putar(crop, sudut, persentil(crop.d, 50)) : crop;
}

/**
 * Foto -> hasil. `bingkai` = area pilihan pengguna, relatif 0..1. Bila ada area yang dipilih,
 * mode "area" berlaku (penilaian lebih longgar karena pengguna sudah menunjuk tulisannya).
 */
export async function bacaFoto(berkas: Blob, bingkai: Bingkai = PENUH, modeAktif?: Mode): Promise<HasilScan> {
  const gray = await grayDariBerkas(berkas);
  if (sama(bingkai, PENUH)) return bacaGray(gray, modeAktif ?? 'foto');
  return bacaGray(potong(gray, ...kePiksel(bingkai, gray.w, gray.h)), modeAktif ?? 'area');
}

export function rakitHasil(calon: readonly Calon[], kualitas: Kualitas, info: HasilScan['info']): HasilScan {
  const baris: BarisTerbaca[] = [];
  for (const c of calon) {
    if (c.status === 'TOLAK') continue;
    baris.push({ unicode: c.unicode, keyakinan: c.keyakinan, status: c.status, sukuKata: urai(c.unicode) });
  }
  return { baris, kurangYakin: baris.some((b) => b.status === 'RAGU'), diabaikan: calon.length - baris.length, kualitas, info };
}
