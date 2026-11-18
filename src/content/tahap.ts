// Tahapan belajar tiap bab sesuai desain UI/UX (design/uiux):
// Kenali → Cocokkan → Ingat → Tulis → Kuis. Satu bab = 5 tahap, dibuka berurutan.
// Id tahap dipakai sebagai lesson_progress.lesson_id (progres tamu maupun akun).

export type JenisTahap = 'kenali' | 'cocokkan' | 'ingat' | 'tulis' | 'kuis';

export interface Tahap {
  id: string; // mis. b1-kenali
  bab: 1 | 2 | 3;
  jenis: JenisTahap;
  nomor: number; // 1..5
}

export type TahapBelajar = Tahap;

export const URUTAN_TAHAP: readonly JenisTahap[] = ['kenali', 'cocokkan', 'ingat', 'tulis', 'kuis'];

/** Label huruf kapital untuk header ("BAB 01 • KENALI"). */
export const LABEL_TAHAP: Record<JenisTahap, string> = {
  kenali: 'KENALI',
  cocokkan: 'COCOKKAN',
  ingat: 'INGAT',
  tulis: 'TULIS',
  kuis: 'KUIS',
};

/** Label biasa untuk tombol ("Lanjut: Cocokkan"). */
export const NAMA_TAHAP: Record<JenisTahap, string> = {
  kenali: 'Kenali',
  cocokkan: 'Cocokkan',
  ingat: 'Ingat',
  tulis: 'Tulis',
  kuis: 'Kuis',
};

export const TAHAP: Tahap[] = ([1, 2, 3] as const).flatMap((bab) =>
  URUTAN_TAHAP.map((jenis, i): Tahap => ({ id: `b${bab}-${jenis}`, bab, jenis, nomor: i + 1 })),
);

export const tahapDariId = (id: string): Tahap | undefined => TAHAP.find((t) => t.id === id);
export const tahapDiBab = (bab: number): Tahap[] => TAHAP.filter((t) => t.bab === bab);
