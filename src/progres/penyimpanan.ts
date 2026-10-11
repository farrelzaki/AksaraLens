// Penyimpanan progres. Tamu: localStorage. Masuk: Supabase (+ antrean saat offline).
// Pemilik: Emil. Antarmuka ini yang dipakai UI; jangan panggil localStorage/Supabase
// langsung dari komponen.

import { supabase } from '../lib/supabase';
import type { ProgresTitik, StatHuruf } from './model';

const KUNCI_PROGRES = 'aksaralens:progress';
const KUNCI_STATS = 'aksaralens:stats';

export interface Penyimpanan {
  muat(): Promise<{ progres: ProgresTitik[]; stats: StatHuruf[] }>;
  simpanTitik(p: ProgresTitik): Promise<void>;
  simpanStats(stats: StatHuruf[]): Promise<void>;
}

const baca = <T,>(kunci: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(kunci) ?? '[]') as T[];
  } catch {
    return [];
  }
};

export const penyimpananTamu: Penyimpanan = {
  async muat() {
    return { progres: baca<ProgresTitik>(KUNCI_PROGRES), stats: baca<StatHuruf>(KUNCI_STATS) };
  },
  async simpanTitik(p) {
    const ada = baca<ProgresTitik>(KUNCI_PROGRES).filter((x) => x.lesson_id !== p.lesson_id);
    localStorage.setItem(KUNCI_PROGRES, JSON.stringify([...ada, p]));
  },
  async simpanStats(stats) {
    localStorage.setItem(KUNCI_STATS, JSON.stringify(stats));
  },
};

export const kosongkanTamu = () => {
  localStorage.removeItem(KUNCI_PROGRES);
  localStorage.removeItem(KUNCI_STATS);
};

// TODO(Emil): antrean offline (F6) dan migrasi tamu -> akun memakai gabungProgres().
export function penyimpananAkun(userId: string): Penyimpanan {
  return {
    async muat() {
      if (!supabase) throw new Error('Supabase belum dikonfigurasi');
      const [p, s] = await Promise.all([
        supabase.from('lesson_progress').select('lesson_id, status, completed_at'),
        supabase.from('letter_stats').select('letter, correct, wrong, updated_at'),
      ]);
      if (p.error) throw p.error;
      if (s.error) throw s.error;
      return { progres: p.data as ProgresTitik[], stats: s.data as StatHuruf[] };
    },
    async simpanTitik(p) {
      if (!supabase) return;
      const { error } = await supabase.from('lesson_progress').upsert({ user_id: userId, ...p });
      if (error) throw error;
    },
    async simpanStats(stats) {
      if (!supabase) return;
      const { error } = await supabase.from('letter_stats').upsert(stats.map((s) => ({ user_id: userId, ...s })));
      if (error) throw error;
    },
  };
}
