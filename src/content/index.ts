// Konten belajar adalah JSON statis (PRD, Model data): tidak pernah di database.
// Pemilik isi: Emil. Bentuk tipe di sini adalah kontrak dengan kode jalur & UI.

import jalurJson from './jalur.json';
import babJson from './bab.json';
import goresanJson from './goresan.json';
import materiJson from './materi-huruf.json';
import soalJson from './soal.json';

export type JenisTitik = 'lesson' | 'writing';

export interface Titik {
  id: string; // mis. b1-p1, b1-tulis1; juga lesson_progress.lesson_id
  bab: 1 | 2 | 3;
  type: JenisTitik;
  title: string;
  letters: string[]; // kode dari src/aksara/huruf.ts
}

export interface Bab {
  bab: 1 | 2 | 3;
  judul: string;
  ringkasan: string;
  letters: string[];
  contoh: { aksara: string; uraian: string }[];
  mirip: [string, string][];
}

/** Titik [x, y] dinormalkan 0–1; satu huruf = daftar goresan. */
export type Goresan = [number, number][][];

/** Materi per huruf/sandhangan (kunci = kode huruf). `status` draf sampai dicek guru (Fase 3). */
export interface MateriHuruf {
  contoh: { kata: string; arti: string }[];
  /** hanya sandhangan/panyigeg/pangkon */
  bunyi?: string;
  posisi?: string;
  catatan?: string;
  status: 'draf' | 'final';
}

/**
 * Soal pelajaran (F2), kunci = id titik bertipe lesson. Pilihan ganda 6 soal, dua arah;
 * `pilihan` sudah berisi jawaban (UI cukup mengacaknya). `huruf` = kode untuk catatHuruf().
 * Bab 1: huruf tunggal. Bab 2–3: aksara dasar + penanda (mis. ꦏꦶ = ka + wulu = ki).
 */
export type ArahSoal = 'aksara-ke-latin' | 'latin-ke-aksara';

export interface SoalPilihan {
  arah: ArahSoal;
  huruf: string;
  tanya: string;
  jawab: string;
  pilihan: string[];
}

export interface PasanganJodoh {
  huruf: string;
  aksara: string;
  latin: string;
}

export interface SoalTitik {
  pilihan: SoalPilihan[];
  jodoh: PasanganJodoh[];
}

export const JALUR = jalurJson as Titik[];
export const BAB = babJson as Bab[];
export const GORESAN = goresanJson as Record<string, Goresan>;
export const MATERI_HURUF = materiJson as Record<string, MateriHuruf>;
export const SOAL = soalJson as Record<string, SoalTitik>;

export const titikDariId = (id: string) => JALUR.find((t) => t.id === id);
export const babDariNomor = (n: number) => BAB.find((b) => b.bab === n);
export const materiDariKode = (kode: string): MateriHuruf | undefined => MATERI_HURUF[kode];
export const soalDariTitik = (id: string): SoalTitik | undefined => SOAL[id];