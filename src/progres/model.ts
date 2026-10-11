// Bentuk progres sama untuk tamu (localStorage) dan akun (Supabase), tanpa user_id.
// Fungsi di file ini murni dan wajib dites.

import type { Titik } from '../content';

export interface ProgresTitik {
  lesson_id: string;
  status: 'completed';
  completed_at: string;
}

export interface StatHuruf {
  letter: string;
  correct: number;
  wrong: number;
  updated_at: string;
}

export type StatusTitik = 'terkunci' | 'terbuka' | 'selesai';

/** F1: titik dibuka berurutan; titik berikutnya terbuka setelah titik sebelumnya selesai. */
export function statusJalur(jalur: Titik[], selesai: ReadonlySet<string>): Map<string, StatusTitik> {
  const status = new Map<string, StatusTitik>();
  let sebelumnyaSelesai = true;
  for (const t of jalur) {
    const s: StatusTitik = selesai.has(t.id) ? 'selesai' : sebelumnyaSelesai ? 'terbuka' : 'terkunci';
    status.set(t.id, s);
    sebelumnyaSelesai = s === 'selesai';
  }
  return status;
}

/** F7: 5 huruf dengan rasio salah tertinggi, minimal 3 percobaan. */
export function hurufSeringSalah(stats: StatHuruf[], batas = 5): StatHuruf[] {
  const rasio = (s: StatHuruf) => s.wrong / (s.correct + s.wrong);
  return stats
    .filter((s) => s.correct + s.wrong >= 3 && s.wrong > 0)
    .sort((a, b) => rasio(b) - rasio(a) || b.wrong - a.wrong)
    .slice(0, batas);
}

/** Menambah satu jawaban ke statistik (tanpa mutasi). */
export function catatJawaban(stats: StatHuruf[], letter: string, benar: boolean, kini = new Date()): StatHuruf[] {
  const ada = stats.find((s) => s.letter === letter) ?? { letter, correct: 0, wrong: 0, updated_at: '' };
  const baru: StatHuruf = {
    letter,
    correct: ada.correct + (benar ? 1 : 0),
    wrong: ada.wrong + (benar ? 0 : 1),
    updated_at: kini.toISOString(),
  };
  return [...stats.filter((s) => s.letter !== letter), baru];
}

/**
 * F6: migrasi tamu -> akun. Progres: ambil status terjauh per pelajaran
 * (status hanya 'completed', jadi gabungan himpunan; simpan waktu paling awal).
 * Statistik: jumlahkan per huruf.
 */
export function gabungProgres(
  server: { progres: ProgresTitik[]; stats: StatHuruf[] },
  lokal: { progres: ProgresTitik[]; stats: StatHuruf[] },
): { progres: ProgresTitik[]; stats: StatHuruf[] } {
  const progres = new Map<string, ProgresTitik>();
  for (const p of [...server.progres, ...lokal.progres]) {
    const ada = progres.get(p.lesson_id);
    if (!ada || p.completed_at < ada.completed_at) progres.set(p.lesson_id, p);
  }

  const stats = new Map<string, StatHuruf>();
  for (const s of [...server.stats, ...lokal.stats]) {
    const ada = stats.get(s.letter);
    stats.set(
      s.letter,
      ada
        ? {
            letter: s.letter,
            correct: ada.correct + s.correct,
            wrong: ada.wrong + s.wrong,
            updated_at: ada.updated_at > s.updated_at ? ada.updated_at : s.updated_at,
          }
        : s,
    );
  }
  return { progres: [...progres.values()], stats: [...stats.values()] };
}
