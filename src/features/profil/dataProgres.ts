// Data detail progres untuk halaman Profil. Fungsi murni: hanya mengolah data yang
// sudah ada di aplikasi (status tahap dari useProgres, statistik jawaban letter_stats,
// konten statis), tanpa angka contoh/dummy.
//
// Dua hal sengaja dibedakan:
// - STATUS BELAJAR  : apakah tahap/huruf sudah dilalui (dari status tahap).
// - PENGUASAAN      : seberapa tepat jawabannya (dari statistik benar/salah).

import { BAB, SOAL } from '../../content';
import { LABEL_TAHAP, NAMA_TAHAP, tahapDiBab, type JenisTahap } from '../../content/tahap';
import { HURUF, hurufDariKode, type Huruf } from '../../aksara/huruf';
import type { StatHuruf, StatusTitik } from '../../progres/model';

export type StatusBelajar = 'sudah' | 'belum';
export type Penguasaan = 'belum-dicoba' | 'perlu-latihan' | 'berkembang' | 'dikuasai';

export const LABEL_PENGUASAAN: Record<Penguasaan, string> = {
  'belum-dicoba': 'Belum dicoba',
  'perlu-latihan': 'Perlu latihan',
  berkembang: 'Berkembang',
  dikuasai: 'Dikuasai',
};

/** Minimal jawaban benar & ketepatan agar sebuah huruf dianggap dikuasai. */
export const AMBANG_DIKUASAI = { benar: 3, ketepatan: 0.8 } as const;
const AMBANG_PERLU_LATIHAN = 0.6;

export function nilaiPenguasaan(benar: number, salah: number): Penguasaan {
  const total = benar + salah;
  if (total === 0) return 'belum-dicoba';
  const tepat = benar / total;
  if (benar >= AMBANG_DIKUASAI.benar && tepat >= AMBANG_DIKUASAI.ketepatan) return 'dikuasai';
  if (tepat < AMBANG_PERLU_LATIHAN) return 'perlu-latihan';
  return 'berkembang';
}

// ---------------------------------------------------------------------------
// Pelajaran (tahap)

export interface DetailTahap {
  id: string;
  jenis: JenisTahap;
  nomor: number;
  label: string;
  nama: string;
  status: StatusTitik;
}

export interface DetailBab {
  bab: 1 | 2 | 3;
  judul: string;
  tahap: DetailTahap[];
  selesai: number;
  total: number;
  tuntas: boolean;
}

export function detailPelajaran(statusTahap: ReadonlyMap<string, StatusTitik>): DetailBab[] {
  return BAB.map((b) => {
    const tahap = tahapDiBab(b.bab).map((t) => ({
      id: t.id,
      jenis: t.jenis,
      nomor: t.nomor,
      label: LABEL_TAHAP[t.jenis],
      nama: NAMA_TAHAP[t.jenis],
      status: statusTahap.get(t.id) ?? 'terkunci',
    }));
    const selesai = tahap.filter((t) => t.status === 'selesai').length;
    return {
      bab: b.bab as 1 | 2 | 3,
      judul: b.judul,
      tahap,
      selesai,
      total: tahap.length,
      tuntas: tahap.length > 0 && selesai === tahap.length,
    };
  });
}

// ---------------------------------------------------------------------------
// Aksara

/**
 * Kunci statistik berupa bacaan Latin yang dijawab/ditulis: Bab 1 memakai kode huruf ("ka"),
 * Bab 2–3 memakai suku kata ("ki", "kar", "t"). Peta Latin → aksara diambil dari soal.json dan
 * contoh bab.json agar suku kata bisa diatribusikan ke sandhangan/panyigeg/pangkon di dalamnya.
 */
function petaLatinKeAksara(): Map<string, string> {
  const peta = new Map<string, string>();
  for (const titik of Object.values(SOAL)) {
    for (const s of titik.pilihan ?? []) {
      const latin = s.arah === 'aksara-ke-latin' ? s.jawab : s.tanya;
      const aksara = s.arah === 'aksara-ke-latin' ? s.tanya : s.jawab;
      if (!peta.has(latin)) peta.set(latin, aksara);
    }
  }
  for (const b of BAB) {
    for (const c of b.contoh) {
      const latin = c.uraian.split('=').pop()?.trim();
      if (latin && !peta.has(latin)) peta.set(latin, c.aksara);
    }
  }
  return peta;
}

const LATIN_KE_AKSARA = petaLatinKeAksara();
const HURUF_MATERI = HURUF.filter((h) => h.bab !== null);
const BUKAN_NGLEGENA = HURUF_MATERI.filter((h) => h.jenis !== 'nglegena');

/** Kode huruf materi yang dilatih oleh satu kunci statistik. */
export function kodeDariKunciStat(kunci: string): string[] {
  const langsung = hurufDariKode(kunci);
  if (langsung && langsung.bab !== null) return [langsung.kode];
  const aksara = LATIN_KE_AKSARA.get(kunci);
  if (!aksara) return [];
  // Suku kata Bab 2–3: kreditkan tanda yang menjadi materi bab tsb (bukan konsonan dasarnya)
  return BUKAN_NGLEGENA.filter((h) => aksara.includes(h.unicode)).map((h) => h.kode);
}

export interface DetailAksara {
  huruf: Huruf;
  statusBelajar: StatusBelajar;
  benar: number;
  salah: number;
  penguasaan: Penguasaan;
}

export interface KelompokAksara {
  bab: 1 | 2 | 3;
  judul: string;
  aksara: DetailAksara[];
}

export function detailAksara(statusTahap: ReadonlyMap<string, StatusTitik>, stats: readonly StatHuruf[]): KelompokAksara[] {
  const jumlah = new Map<string, { benar: number; salah: number }>();
  for (const s of stats) {
    for (const kode of kodeDariKunciStat(s.letter)) {
      const j = jumlah.get(kode) ?? { benar: 0, salah: 0 };
      j.benar += s.correct;
      j.salah += s.wrong;
      jumlah.set(kode, j);
    }
  }
  return BAB.map((b) => {
    // Huruf bab dianggap sudah dipelajari setelah tahap Kenali bab itu selesai
    const dikenalkan = statusTahap.get(`b${b.bab}-kenali`) === 'selesai';
    const aksara = HURUF_MATERI.filter((h) => h.bab === b.bab).map((huruf) => {
      const j = jumlah.get(huruf.kode) ?? { benar: 0, salah: 0 };
      return {
        huruf,
        statusBelajar: (dikenalkan ? 'sudah' : 'belum') as StatusBelajar,
        benar: j.benar,
        salah: j.salah,
        penguasaan: nilaiPenguasaan(j.benar, j.salah),
      };
    });
    return { bab: b.bab as 1 | 2 | 3, judul: b.judul, aksara };
  });
}

export interface RingkasanAksara {
  total: number;
  dipelajari: number;
  dikuasai: number;
  perluLatihan: number;
}

export function ringkasAksara(kelompok: readonly KelompokAksara[]): RingkasanAksara {
  const semua = kelompok.flatMap((k) => k.aksara);
  return {
    total: semua.length,
    dipelajari: semua.filter((a) => a.statusBelajar === 'sudah').length,
    dikuasai: semua.filter((a) => a.penguasaan === 'dikuasai').length,
    perluLatihan: semua.filter((a) => a.penguasaan === 'perlu-latihan').length,
  };
}
