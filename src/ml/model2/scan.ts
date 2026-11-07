// F5 langkah 3: foto -> polaritas & deskew -> detektor baris (2b) -> pembaca baris (2a) -> transliterasi.
// Mengikuti baca_gambar() notebook Model 2 (sel 39). Semua di perangkat; foto tidak pernah
// dikirim ke server dan tidak disimpan. Target ≤ 3 detik.
//
// Penyimpangan sadar dari notebook (demi kecepatan di ponsel):
// - foto diperkecil dulu ke sisi terpanjang 2048 px;
// - sudut deskew dicari pada gambar ≤ 800 px (notebook: masker resolusi penuh lalu diperkecil).

import { urai, type SukuKata } from '../../aksara/urai';
import { infoOrt, muatModel, ortSiap } from '../onnx';
import { CHARSET, dekodeGreedy } from './ctc';
import { TINGGI_B2, keInputB2, keLogPeluang } from './pembacaB2';
import { dekodeBeam, logSoftmax, pilihKoreksi, type ModelBahasa } from './bahasa';
import modelBahasa from './model_bahasa.json';
import { keLogis } from '../../aksara/urutan';
import { potongSatu, type Kotak } from './detektor';
import { SISI, SISI_ESKALASI, kotakDariPeta, masukanPP } from './detektorPP';
import { LEBAR_KL, TINGGI_KL, lolosJawa, masukanKlasifikator } from './klasifikator';
import { PENUH, kePiksel, sama, type Bingkai } from './bingkai';
import { balik, cariSudut, terangDiGelap, dariRGBA, maskerTinta, normalisasiPolaritas, persentil, potong, putar, resize, type Gray } from './gambar';
import { barisProyeksi, gabungBaris, iou, nilaiKualitas, nilaiStatus, perluEskalasi, pilihArea, pilihBaris, pilihEskalasi, pilihProyeksi, terapkanBukti, type Calon, type Kualitas, type Mode } from './saring';

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
  info: { waktuMs: number; sudut: number; kotak: Kotak[]; tahap?: Record<string, number | string | boolean> };
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
  const [ort, det, pembaca, kl] = await Promise.all([ortSiap(), muatModel('model2b'), muatModel('model2a'), muatModel('model2c')]);
  await det.run({ [det.inputNames[0]]: new ort.Tensor('float32', new Float32Array(3 * 32 * 32), [1, 3, 32, 32]) });
  await pembaca.run({ [pembaca.inputNames[0]]: new ort.Tensor('float32', new Float32Array(3 * TINGGI_B2 * TINGGI_B2), [1, 3, TINGGI_B2, TINGGI_B2]) });
  await kl.run({ [kl.inputNames[0]]: new ort.Tensor('float32', new Float32Array(TINGGI_KL * LEBAR_KL), [1, 1, TINGGI_KL, LEBAR_KL]) });
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
  const [ort, det, pembaca, kl] = await Promise.all([ortSiap(), muatModel('model2b'), muatModel('model2a'), muatModel('model2c')]);

  // 1. polaritas & deskew halaman
  let g = normalisasiPolaritas(gray);
  const sk = Math.min(1, SISI_SUDUT / Math.max(g.w, g.h));
  const kecil = sk < 1 ? resize(g, Math.round(g.w * sk), Math.round(g.h * sk)) : g;
  const sudut = cariSudut(maskerTinta(kecil));
  if (sudut !== 0) g = putar(g, sudut, 255);

  const praMs = performance.now() - mulai;
  const waktu = { deteksi: 0, saring: 0, baca: 0, bahasa: 0, kotak: 0, dibaca: 0 };
  const baca = async (crop: Gray) => {
    const t0 = performance.now();
    // Pembaca B2 (PP-OCRv5 fine-tune, int8): masukan [1, 3, 48, W], keluaran peluang -> log-peluang untuk dekoder.
    const { data, lebar } = keInputB2(crop);
    const keluar = await pembaca.run({
      [pembaca.inputNames[0]]: new ort.Tensor('float32', data, [1, 3, TINGGI_B2, lebar]),
    });
    waktu.baca += performance.now() - t0;
    waktu.dibaca++;
    const logit = keLogPeluang(keluar[pembaca.outputNames[0]].data as Float32Array);
    const hasil = dekodeGreedy(logit, CHARSET.length);
    // L5: model bahasa hanya membetulkan teks baris yang lolos penilai; status tetap dari bacaan greedy.
    let koreksi: string | null = null;
    if (nilaiStatus(hasil.teks, hasil.keyakinan, 'area') !== 'TOLAK') {
      const t1 = performance.now();
      const beam = dekodeBeam(logSoftmax(logit, CHARSET.length), CHARSET.length, CHARSET, modelBahasa as unknown as ModelBahasa);
      koreksi = pilihKoreksi(hasil.teks, keLogis(beam), hasil.keyakinan);
      waktu.bahasa += performance.now() - t1;
    }
    return { ...hasil, koreksi };
  };
  // Tulisan terang di papan gelap: polaritas ditentukan per potongan, pakai arah yang lebih yakin.
  // Arah pertama yang sudah diterima tidak perlu dibandingkan lagi.
  const bacaDuaArah = async (asli: Gray) => {
    const crop = terangDiGelap(asli) ? balik(asli) : asli; // tebakan arah tinta: yang pertama hampir selalu benar
    const a = await baca(crop);
    if (nilaiStatus(a.teks, a.keyakinan, mode) === 'TERIMA') return a;
    const b = await baca(balik(crop));
    return a.keyakinan >= b.keyakinan ? a : b;
  };

  // Hanya kotak yang berisi aksara Jawa yang diteruskan; Latin, aksara lain, dan tekstur dibuang sebelum dibaca.
  const saringJawa = async (sumber: Gray, kotak: Kotak[]) => {
    const potongan: { kotak: Kotak; x: Float32Array }[] = [];
    for (const k of kotak) {
      const c = potongSatu(sumber, k);
      if (c) potongan.push({ kotak: k, x: masukanKlasifikator(c) });
    }
    if (!potongan.length) return [];
    const x = new Float32Array(potongan.length * TINGGI_KL * LEBAR_KL);
    potongan.forEach((p, i) => x.set(p.x, i * TINGGI_KL * LEBAR_KL));
    const t0 = performance.now();
    const keluar = await kl.run({ [kl.inputNames[0]]: new ort.Tensor('float32', x, [potongan.length, 1, TINGGI_KL, LEBAR_KL]) });
    waktu.saring += performance.now() - t0;
    const logit = keluar[kl.outputNames[0]].data as Float32Array;
    return potongan.filter((_, i) => lolosJawa(logit[i])).map((p) => p.kotak);
  };

  // 2. detektor pada polaritas asli; polaritas terbalik hanya bila belum ada baris yang layak tampil (hemat waktu di ponsel)
  const deteksiDanBaca = async (sisi: number) => {
    const calon: Calon[] = [];
    const semuaKotak: Kotak[] = [];
    for (const sumber of [g, balik(g)]) {
      if (calon.some((c) => c.status !== 'TOLAK')) break;
      const t0 = performance.now();
      const m = masukanPP(sumber, sisi);
      const keluarDet = await det.run({ [det.inputNames[0]]: new ort.Tensor('float32', m.data, [1, 3, m.H, m.W]) });
      waktu.deteksi += performance.now() - t0;
      const peta = keluarDet[det.outputNames[0]];
      const [, , h, w] = peta.dims;
      const mentah = kotakDariPeta(peta.data as Float32Array, h, w, sumber.w / w, sumber.h / h, sumber.w, sumber.h);
      for (const kotak of gabungBaris(await saringJawa(sumber, mentah))) {
        if (semuaKotak.some((k) => iou(k, kotak) >= SAMA_KOTAK)) continue; // sudah dibaca pada polaritas lain
        semuaKotak.push(kotak);
        // 3. baca tiap baris; pelurusan per baris hanya di mode area demi target waktu
        const crop = potongSatu(g, kotak);
        if (!crop) continue;
        const { teks, keyakinan, koreksi } = await bacaDuaArah(mode === 'area' ? luruskan(crop) : crop);
        if (teks) calon.push({ unicode: teks, keyakinan, kotak, status: nilaiStatus(teks, keyakinan, mode), koreksi });
      }
    }
    return { calon, semuaKotak };
  };

  const dasar = await deteksiDanBaca(SISI);
  let semuaKotak = dasar.semuaKotak;
  let terpilih = pilihBaris(dasar.calon);
  // Eskalasi resolusi (hanya mode foto): bila belum ada baris TERIMA, ulangi pada 960 px dan pakai hasil yang lebih meyakinkan.
  if (mode === 'foto' && perluEskalasi(terapkanBukti(terpilih))) {
    const ulang = await deteksiDanBaca(SISI_ESKALASI);
    const awal = terapkanBukti(terpilih);
    const baru = terapkanBukti(pilihBaris(ulang.calon));
    semuaKotak = [...semuaKotak, ...ulang.semuaKotak];
    terpilih = pilihEskalasi(awal, baru);
  }
  if (mode === 'area') {
    const { teks, keyakinan, koreksi } = await bacaDuaArah(luruskan(g));
    const satu: Calon | null = teks ? { unicode: teks, keyakinan, kotak: [0, 0, g.w, g.h], status: nilaiStatus(teks, keyakinan, mode), koreksi } : null;
    terpilih = pilihArea(terpilih, satu);
    // Tabel: tiap baris proyeksi dibaca sendiri.
    const proyeksi: Calon[] = [];
    const tinta = maskerTinta(g);
    // Baris proyeksi hanya dipakai bila belum ada baris TERIMA (pilihProyeksi); jangan dibaca percuma.
    const butuhProyeksi = !terpilih.some((c) => c.status === 'TERIMA');
    for (const kotak of butuhProyeksi ? barisProyeksi(tinta.d, tinta.w, tinta.h) : []) {
      const crop = potongSatu(g, kotak);
      if (!crop) continue;
      const b = await bacaDuaArah(crop);
      if (b.teks) proyeksi.push({ unicode: b.teks, keyakinan: b.keyakinan, kotak, status: nilaiStatus(b.teks, b.keyakinan, mode), koreksi: b.koreksi });
    }
    terpilih = pilihProyeksi(terpilih, proyeksi);
  } else {
    terpilih = terapkanBukti(terpilih);
  }

  return rakitHasil(terpilih, nilaiKualitas(kecil.d, kecil.w, kecil.h), {
    waktuMs: performance.now() - mulai,
    sudut,
    kotak: semuaKotak,
    tahap: { praMs: Math.round(praMs), deteksiMs: Math.round(waktu.deteksi), saringMs: Math.round(waktu.saring), bacaMs: Math.round(waktu.baca), bahasaMs: Math.round(waktu.bahasa), potonganDibaca: waktu.dibaca, kotakDeteksi: semuaKotak.length, ...infoOrt() },
  });
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
    const unicode = c.koreksi ?? c.unicode; // L5: teks yang dibetulkan model bahasa, bila ada
    baris.push({ unicode, keyakinan: c.keyakinan, status: c.status, sukuKata: urai(unicode) });
  }
  return { baris, kurangYakin: baris.some((b) => b.status === 'RAGU'), diabaikan: calon.length - baris.length, kualitas, info };
}
