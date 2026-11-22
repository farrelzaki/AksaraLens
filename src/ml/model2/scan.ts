// F5 langkah 3: foto -> polaritas & deskew -> detektor baris (2b) -> pembaca baris (2a) -> transliterasi.
// Mengikuti baca_gambar() notebook Model 2 (sel 39). Semua di perangkat; foto tidak pernah
// dikirim ke server dan tidak disimpan. Target ≤ 3 detik.
//
// Penyimpangan sadar dari notebook (demi kecepatan di ponsel):
// - foto diperkecil dulu ke sisi terpanjang 2048 px;
// - sudut deskew dicari pada gambar ≤ 800 px (notebook: masker resolusi penuh lalu diperkecil).

import { urai, type SukuKata } from '../../aksara/urai';
import type { InferenceSession } from 'onnxruntime-web';
import { infoOrt, muatModel, ortSiap, pembacaDiminta, type JenisPembaca } from '../onnx';
import { CHARSET, TINGGI_BARIS, dekodeGreedy, keInputBaris, petaAlternatif, type AlternatifHuruf } from './ctc';
import { TINGGI_B2, keInputB2, keLogPeluang } from './pembacaB2';
import { dekodeBeam, logSoftmax, pilihKoreksi, type ModelBahasa } from './bahasa';
import modelBahasa from './model_bahasa.json';
import { keLogis } from '../../aksara/urutan';
import { perluasEkor, potongSatu, type Kotak } from './detektor';
import { SISI, SISI_ESKALASI, kotakDariPeta, masukanPP } from './detektorPP';
import { LEBAR_KL, TINGGI_KL, lolosJawa, masukanKlasifikator } from './klasifikator';
import { PENUH, kePiksel, longgarkan, sama, type Bingkai } from './bingkai';
import { balik, cariSudut, terangDiGelap, dariRGBA, maskerTinta, normalisasiPolaritas, persentil, potong, putar, resize, type Gray } from './gambar';
import { barisProyeksi, gabungBaris, iou, nilaiKualitas, nilaiStatus, perluEskalasi, pilihArea, pilihBaris, pilihEskalasi, pilihProyeksi, saringInti, terapkanBukti, type Calon, type Kualitas, type Mode } from './saring';

export interface BarisTerbaca {
  unicode: string;
  sukuKata: SukuKata[];
  keyakinan: number;
  /** RAGU: tetap tampil dengan tanda "mungkin kurang tepat" (PRD F5). */
  status: 'TERIMA' | 'RAGU';
  /** Baris menyentuh tepi area baca kamera: mungkin ada bagian yang terpotong. */
  terpotong?: boolean;
  /** Alternatif per huruf `unicode` dari pembaca untuk pilihan koreksi; tidak ada bila teks dibetulkan model bahasa. */
  alternatif?: AlternatifHuruf[];
  /** Pengguna sudah mengganti suku kata di baris ini lewat Perbaiki hasil (hanya di memori). */
  diperbaiki?: boolean;
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

interface Pembaca {
  jenis: JenisPembaca;
  sesi: InferenceSession;
}

/**
 * Pembaca baris: B2 (bawaan; putaran 2, cadangan putaran 1) atau CRNN v2 (`?pembaca=v2` / VITE_PEMBACA=v2). Bila B2
 * gagal dimuat (berkas belum diunggah, jaringan), scanner tetap jalan dengan v2 alih-alih gagal total.
 */
let pembacaAktif: Promise<Pembaca> | null = null;
function muatPembaca(): Promise<Pembaca> {
  pembacaAktif ??= (async (): Promise<Pembaca> => {
    if (pembacaDiminta() === 'b2') {
      // Putaran 2 dulu, lalu putaran 1 (berkas lama di models/v2), lalu v2.
      for (const nama of ['model2a', 'model2a_r1'] as const) {
        try {
          return { jenis: 'b2', sesi: await muatModel(nama) };
        } catch (e) {
          console.warn(`Pembaca ${nama} gagal dimuat:`, e);
        }
      }
    }
    return { jenis: 'v2', sesi: await muatModel('model2v2') };
  })().catch((e) => {
    pembacaAktif = null;
    throw e;
  });
  return pembacaAktif;
}

/** Tensor masukan pembaca dan dimensinya: B2 [1, 3, 48, W], v2 [1, 1, 64, W]. */
const masukanPembaca = (jenis: JenisPembaca, crop: Gray) => {
  if (jenis === 'b2') {
    const { data, lebar } = keInputB2(crop);
    return { data, dims: [1, 3, TINGGI_B2, lebar] };
  }
  const { data, lebar } = keInputBaris(crop);
  return { data, dims: [1, 1, TINGGI_BARIS, lebar] };
};

async function panaskan(): Promise<void> {
  const [ort, det, pembaca, kl] = await Promise.all([ortSiap(), muatModel('model2b'), muatPembaca(), muatModel('model2c')]);
  await det.run({ [det.inputNames[0]]: new ort.Tensor('float32', new Float32Array(3 * 32 * 32), [1, 3, 32, 32]) });
  const kosong = masukanPembaca(pembaca.jenis, { w: TINGGI_BARIS, h: TINGGI_BARIS, d: new Float32Array(TINGGI_BARIS * TINGGI_BARIS).fill(255) });
  await pembaca.sesi.run({ [pembaca.sesi.inputNames[0]]: new ort.Tensor('float32', kosong.data, kosong.dims) });
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

/**
 * `inti` (hanya mode area): bingkai bidik kamera di dalam area baca yang dilonggarkan, dalam piksel `gray`.
 * Baris di luar inti dibuang, baris yang menyentuh tepi area baca ditandai terpotong (saringInti).
 */
export async function bacaGray(gray: Gray, mode: Mode = 'foto', inti?: Kotak): Promise<HasilScan> {
  const mulai = performance.now();
  await siapkanScanner();
  const [ort, det, pembaca, kl] = await Promise.all([ortSiap(), muatModel('model2b'), muatPembaca(), muatModel('model2c')]);

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
    const { data, dims } = masukanPembaca(pembaca.jenis, crop);
    const { sesi } = pembaca;
    const keluar = await sesi.run({ [sesi.inputNames[0]]: new ort.Tensor('float32', data, dims) });
    waktu.baca += performance.now() - t0;
    waktu.dibaca++;
    // B2 mengeluarkan peluang softmax -> log-peluang; v2 mengeluarkan logit. Dekoder hilir sama (softmax-nya sama).
    const mentah = keluar[sesi.outputNames[0]].data as Float32Array;
    const logit = pembaca.jenis === 'b2' ? keLogPeluang(mentah) : mentah;
    const hasil = dekodeGreedy(logit, CHARSET.length);
    const { alternatif } = petaAlternatif(logit, CHARSET.length);
    // L5: model bahasa hanya membetulkan teks baris yang lolos penilai; status tetap dari bacaan greedy.
    let koreksi: string | null = null;
    if (nilaiStatus(hasil.teks, hasil.keyakinan, 'area') !== 'TOLAK') {
      const t1 = performance.now();
      const beam = dekodeBeam(logSoftmax(logit, CHARSET.length), CHARSET.length, CHARSET, modelBahasa as unknown as ModelBahasa);
      koreksi = pilihKoreksi(hasil.teks, keLogis(beam), hasil.keyakinan);
      waktu.bahasa += performance.now() - t1;
    }
    return { ...hasil, koreksi, alternatif };
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

  // 2. detektor pada polaritas asli; polaritas terbalik hanya bila belum ada baris TERIMA
  const deteksiDanBaca = async (sisi: number) => {
    const calon: Calon[] = [];
    const semuaKotak: Kotak[] = [];
    for (const sumber of [g, balik(g)]) {
      // Polaritas terbalik dilewati hanya bila sudah ada baris TERIMA (sama dengan pipeline_cerdas.baca_foto).
      if (calon.some((c) => c.status === 'TERIMA')) break;
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
        const kotakBaca = perluasEkor(g, kotak);
        const crop = potongSatu(g, kotakBaca);
        if (!crop) continue;
        const { teks, keyakinan, koreksi, alternatif } = await bacaDuaArah(mode === 'area' ? luruskan(crop) : crop);
        if (teks) calon.push({ unicode: teks, keyakinan, kotak, kotakBaca, status: nilaiStatus(teks, keyakinan, mode), koreksi, alternatif });
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
    if (inti) terpilih = saringInti(terpilih, inti, g.w, g.h);
    // Seluruh area sebagai satu baris: bila dilonggarkan, yang dibaca hanya bingkai bidik aslinya.
    const kotakSatu: Kotak = inti ?? [0, 0, g.w, g.h];
    const { teks, keyakinan, koreksi, alternatif } = await bacaDuaArah(luruskan(inti ? potong(g, ...inti) : g));
    const satu: Calon | null = teks ? { unicode: teks, keyakinan, kotak: kotakSatu, status: nilaiStatus(teks, keyakinan, mode), koreksi, alternatif } : null;
    terpilih = pilihArea(terpilih, satu);
    // Tabel: tiap baris proyeksi dibaca sendiri.
    const proyeksi: Calon[] = [];
    const tinta = maskerTinta(g);
    // Baris proyeksi hanya dipakai bila belum ada baris TERIMA (pilihProyeksi); jangan dibaca percuma.
    const butuhProyeksi = !terpilih.some((c) => c.status === 'TERIMA');
    const kotakProyeksi = butuhProyeksi ? barisProyeksi(tinta.d, tinta.w, tinta.h) : [];
    for (const kotak of inti ? kotakProyeksi.filter((k) => saringInti([{ unicode: '', keyakinan: 0, kotak: k, status: 'TOLAK' }], inti, g.w, g.h).length) : kotakProyeksi) {
      const kotakBaca = perluasEkor(g, kotak);
      const crop = potongSatu(g, kotakBaca);
      if (!crop) continue;
      const b = await bacaDuaArah(crop);
      if (b.teks) proyeksi.push({ unicode: b.teks, keyakinan: b.keyakinan, kotak, kotakBaca, status: nilaiStatus(b.teks, b.keyakinan, mode), koreksi: b.koreksi, alternatif: b.alternatif });
    }
    terpilih = pilihProyeksi(terpilih, inti ? saringInti(proyeksi, inti, g.w, g.h) : proyeksi);
  } else {
    terpilih = terapkanBukti(terpilih);
  }

  return rakitHasil(terpilih, nilaiKualitas(kecil.d, kecil.w, kecil.h), {
    waktuMs: performance.now() - mulai,
    sudut,
    kotak: semuaKotak,
    tahap: { praMs: Math.round(praMs), deteksiMs: Math.round(waktu.deteksi), saringMs: Math.round(waktu.saring), bacaMs: Math.round(waktu.baca), bahasaMs: Math.round(waktu.bahasa), potonganDibaca: waktu.dibaca, kotakDeteksi: semuaKotak.length, pembaca: pembaca.jenis, ...infoOrt() },
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
export async function bacaFoto(berkas: Blob, bingkai: Bingkai = PENUH, modeAktif?: Mode, longgar = false): Promise<HasilScan> {
  const gray = await grayDariBerkas(berkas);
  if (sama(bingkai, PENUH)) return bacaGray(gray, modeAktif ?? 'foto');
  if (!longgar) return bacaGray(potong(gray, ...kePiksel(bingkai, gray.w, gray.h)), modeAktif ?? 'area');
  // Kamera: bingkai bidik dilonggarkan agar ekor sandhangan di tepinya ikut terbaca.
  const { baca, inti } = longgarkan(bingkai);
  const area = potong(gray, ...kePiksel(baca, gray.w, gray.h));
  return bacaGray(area, 'area', kePiksel(inti, area.w, area.h));
}

export function rakitHasil(calon: readonly Calon[], kualitas: Kualitas, info: HasilScan['info']): HasilScan {
  const baris: BarisTerbaca[] = [];
  for (const c of calon) {
    if (c.status === 'TOLAK') continue;
    const unicode = c.koreksi ?? c.unicode; // L5: teks yang dibetulkan model bahasa, bila ada
    const alternatif = unicode === c.unicode ? c.alternatif : undefined; // alternatif mengikuti bacaan greedy
    baris.push({ unicode, keyakinan: c.keyakinan, status: c.status, sukuKata: urai(unicode), ...(c.terpotong ? { terpotong: true } : {}), ...(alternatif ? { alternatif } : {}) });
  }
  return { baris, kurangYakin: baris.some((b) => b.status === 'RAGU'), diabaikan: calon.length - baris.length, kualitas, info };
}
