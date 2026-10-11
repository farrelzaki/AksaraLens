// Konten belajar adalah JSON statis (PRD, Model data): tidak pernah di database.
// Pemilik isi: Emil. Bentuk tipe di sini adalah kontrak dengan kode jalur & UI.

import jalurJson from './jalur.json';
import babJson from './bab.json';
import goresanJson from './goresan.json';

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

export const JALUR = jalurJson as Titik[];
export const BAB = babJson as Bab[];
export const GORESAN = goresanJson as Record<string, Goresan>;

export const titikDariId = (id: string) => JALUR.find((t) => t.id === id);
export const babDariNomor = (n: number) => BAB.find((b) => b.bab === n);
