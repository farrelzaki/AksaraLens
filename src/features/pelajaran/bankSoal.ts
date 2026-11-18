// Bank soal per tahap belajar. Sumbernya soal.json (kunci = titik lesson tiap bab) dan huruf.ts,
// jadi isi soal tidak menyimpang dari kode huruf. Pemilihan soal diacak tiap sesi.

import { BAB, JALUR, SOAL, type SoalPilihan } from '../../content';
import type { JenisTahap } from '../../content/tahap';
import { NGLEGENA } from '../../aksara/huruf';

export const JUMLAH_ITEM: Record<JenisTahap, number> = {
  kenali: 3,
  cocokkan: 3,
  ingat: 3,
  tulis: 3,
  kuis: 5,
};

export function acak<T>(daftar: readonly T[]): T[] {
  const a = [...daftar];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Semua soal pilihan ganda dari titik lesson milik bab ini. */
function kumpulanSoal(bab: number): SoalPilihan[] {
  return JALUR.filter((t) => t.type === 'lesson' && t.bab === bab).flatMap((t) => SOAL[t.id]?.pilihan ?? []);
}

/** Aksara yang dipertanyakan, dipakai agar satu sesi tidak memuat aksara yang sama dua kali. */
const kunciAksara = (s: SoalPilihan) => (s.arah === 'aksara-ke-latin' ? s.tanya : s.jawab);

/** Bacaan Latin soal, apa pun arahnya. */
export const latinSoal = (s: SoalPilihan) => (s.arah === 'aksara-ke-latin' ? s.jawab : s.tanya);

/** Aksara soal, apa pun arahnya. */
export const aksaraSoal = (s: SoalPilihan) => kunciAksara(s);

/** Soal untuk satu sesi tahap (Kenali/Cocokkan/Ingat/Kuis), dengan urutan pilihan sudah diacak. */
export function soalUntukTahap(bab: number, jenis: JenisTahap): SoalPilihan[] {
  const semua = kumpulanSoal(bab);
  const keLatin = semua.filter((s) => s.arah === 'aksara-ke-latin');
  const keAksara = semua.filter((s) => s.arah === 'latin-ke-aksara');
  const dipakai = new Set<string>();

  const ambil = (sumber: SoalPilihan[], n: number): SoalPilihan[] => {
    const hasil: SoalPilihan[] = [];
    for (const s of acak(sumber)) {
      if (hasil.length >= n) break;
      const k = kunciAksara(s);
      if (dipakai.has(k)) continue;
      dipakai.add(k);
      hasil.push(s);
    }
    return hasil;
  };

  let hasil: SoalPilihan[];
  if (jenis === 'cocokkan') hasil = ambil(keAksara, JUMLAH_ITEM.cocokkan);
  else if (jenis === 'kuis') hasil = [...ambil(keLatin, 3), ...ambil(keAksara, 2)];
  else hasil = ambil(keLatin, JUMLAH_ITEM[jenis]);

  const target = JUMLAH_ITEM[jenis];
  if (hasil.length < target) hasil = [...hasil, ...ambil(semua, target - hasil.length)];

  return acak(hasil).map((s) => ({ ...s, pilihan: acak(s.pilihan) }));
}

export interface ItemKenali {
  teks: string;
  latin: string;
  uraian?: string;
}

/** Daftar aksara yang dijelajahi di tahap Kenali. Bab 1: 20 nglegena. Bab 2–3: contoh gabungan. */
export function itemKenali(bab: number): ItemKenali[] {
  if (bab === 1) return NGLEGENA.map((h) => ({ teks: h.unicode, latin: h.latin }));
  const data = BAB.find((b) => b.bab === bab);
  return (data?.contoh ?? []).map((c) => ({
    teks: c.aksara,
    latin: c.uraian.split('=').pop()?.trim() ?? c.uraian,
    uraian: c.uraian,
  }));
}

export interface ItemTulis {
  teks: string;
  label: string;
  /** hanya Bab 1: kode huruf untuk dinilai Model 1 (Bab 2–3 = latihan mandiri) */
  kode?: string;
}

/** Tiga aksara untuk tahap Tulis. */
export function itemTulis(bab: number): ItemTulis[] {
  const jumlah = JUMLAH_ITEM.tulis;
  if (bab === 1) {
    return acak(NGLEGENA)
      .slice(0, jumlah)
      .map((h) => ({ teks: h.unicode, label: h.latin, kode: h.kode }));
  }
  const data = BAB.find((b) => b.bab === bab);
  return acak(data?.contoh ?? [])
    .slice(0, jumlah)
    .map((c) => ({ teks: c.aksara, label: c.uraian.split('=').pop()?.trim() ?? c.uraian }));
}
