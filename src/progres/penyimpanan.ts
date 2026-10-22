// Penyimpanan progres. Tamu: localStorage. Masuk: Supabase (+ antrean saat offline).
// Pemilik: Emil. Antarmuka ini yang dipakai UI; jangan panggil localStorage/Supabase
// langsung dari komponen.

import { supabase } from '../lib/supabase';
import { gabungProgres, type ProgresTitik, type StatHuruf } from './model';

const KUNCI_PROGRES = 'aksaralens:progress';
const KUNCI_STATS = 'aksaralens:stats';

export interface Penyimpanan {
  muat(): Promise<{ progres: ProgresTitik[]; stats: StatHuruf[] }>;
  simpanTitik(p: ProgresTitik): Promise<void>;
  simpanStats(stats: StatHuruf[]): Promise<void>;
  /** Opsional (hanya akun): kirim antrean offline. Melempar galat bila masih gagal. */
  sinkron?(): Promise<void>;
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

// --- Akun: cache + antrean offline + migrasi tamu ---------------------------------

type Data = { progres: ProgresTitik[]; stats: StatHuruf[] };
/** Yang belum terkirim ke server. Statistik berupa snapshot penuh terbaru. */
type Antrean = { titik: ProgresTitik[]; stats: StatHuruf[] | null };

const kunciCache = (uid: string) => `aksaralens:cache:${uid}`;
const kunciAntrean = (uid: string) => `aksaralens:antrean:${uid}`;
const kunciMigrasi = (uid: string) => `aksaralens:migrasi:${uid}`;

const bacaObjek = <T,>(kunci: string, awal: T): T => {
  try {
    const mentah = localStorage.getItem(kunci);
    return mentah ? (JSON.parse(mentah) as T) : awal;
  } catch {
    return awal;
  }
};

const tulisObjek = (kunci: string, nilai: unknown) => {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    /* penyimpanan penuh/dimatikan: abaikan, aplikasi tetap jalan */
  }
};

/** Dipakai saat keluar/hapus akun: tidak ada sisa data pengguna di perangkat. */
export const bersihkanAkunLokal = (userId: string) => {
  try {
    localStorage.removeItem(kunciCache(userId));
    localStorage.removeItem(kunciAntrean(userId));
  } catch {
    /* abaikan */
  }
};

async function muatServer(): Promise<Data> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi');
  const [p, s] = await Promise.all([
    supabase.from('lesson_progress').select('lesson_id, status, completed_at'),
    supabase.from('letter_stats').select('letter, correct, wrong, updated_at'),
  ]);
  if (p.error) throw p.error;
  if (s.error) throw s.error;
  return { progres: p.data as ProgresTitik[], stats: s.data as StatHuruf[] };
}

/** Tulis ke server (upsert massal). Melempar galat bila gagal. */
async function kirimData(userId: string, d: Data): Promise<void> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi');
  if (d.progres.length > 0) {
    const { error } = await supabase
      .from('lesson_progress')
      .upsert(d.progres.map((p) => ({ user_id: userId, ...p })), { onConflict: 'user_id,lesson_id' });
    if (error) throw error;
  }
  if (d.stats.length > 0) {
    const { error } = await supabase
      .from('letter_stats')
      .upsert(d.stats.map((s) => ({ user_id: userId, ...s })), { onConflict: 'user_id,letter' });
    if (error) throw error;
  }
}

// Antrean offline dan migrasi tamu -> akun mengikuti F6.
export function penyimpananAkun(userId: string): Penyimpanan {
  const cache = () => bacaObjek<Data>(kunciCache(userId), { progres: [], stats: [] });
  const simpanCache = (d: Data) => tulisObjek(kunciCache(userId), d);
  const antrean = () => bacaObjek<Antrean>(kunciAntrean(userId), { titik: [], stats: null });
  const simpanAntrean = (a: Antrean) => tulisObjek(kunciAntrean(userId), a);

  /** Kirim antrean; yang bertambah selama pengiriman tetap tersimpan. */
  const kirimAntrean = async () => {
    const a = antrean();
    if (a.titik.length === 0 && !a.stats) return;
    await kirimData(userId, { progres: a.titik, stats: a.stats ?? [] });
    const kini = antrean();
    simpanAntrean({
      titik: kini.titik.filter((t) => !a.titik.some((x) => x.lesson_id === t.lesson_id)),
      stats: JSON.stringify(kini.stats) === JSON.stringify(a.stats) ? null : kini.stats,
    });
  };

  return {
    async muat() {
      try {
        await kirimAntrean();
      } catch {
        /* masih offline: tetap tertahan di antrean */
      }
      try {
        const d = await muatServer();
        const a = antrean();
        const semua = new Map<string, ProgresTitik>();
        for (const p of [...d.progres, ...a.titik]) semua.set(p.lesson_id, p);
        // Yang belum terkirim tetap tampil; snapshot statistik tertahan lebih baru dari server.
        const hasil: Data = { progres: [...semua.values()], stats: a.stats ?? d.stats };
        simpanCache(hasil);
        return hasil;
      } catch {
        return cache(); // offline: salinan terakhir
      }
    },
    async simpanTitik(p) {
      const c = cache();
      if (!c.progres.some((x) => x.lesson_id === p.lesson_id)) simpanCache({ ...c, progres: [...c.progres, p] });
      try {
        await kirimData(userId, { progres: [p], stats: [] });
        void kirimAntrean().catch(() => {});
      } catch {
        const a = antrean();
        simpanAntrean({ ...a, titik: [...a.titik.filter((x) => x.lesson_id !== p.lesson_id), p] });
      }
    },
    async simpanStats(stats) {
      simpanCache({ ...cache(), stats });
      try {
        await kirimData(userId, { progres: [], stats });
        simpanAntrean({ ...antrean(), stats: null }); // snapshot ini menggantikan yang tertahan
        void kirimAntrean().catch(() => {});
      } catch {
        simpanAntrean({ ...antrean(), stats });
      }
    },
    async sinkron() {
      await kirimAntrean();
    },
  };
}

export type HasilMigrasi = 'tidak-ada' | 'berhasil' | 'gagal';

const migrasiBerjalan = new Map<string, Promise<HasilMigrasi>>();

/**
 * F6: pindahkan progres tamu ke akun yang baru masuk. Titik digabung (status terjauh),
 * statistik dijumlah (gabungProgres). Data tamu dihapus hanya setelah server menerima.
 * Aman dipanggil berulang/bersamaan (mis. StrictMode): panggilan kedua ikut yang pertama.
 */
export function migrasiTamu(userId: string): Promise<HasilMigrasi> {
  const ada = migrasiBerjalan.get(userId);
  if (ada) return ada;

  const proses = (async (): Promise<HasilMigrasi> => {
    if (localStorage.getItem(kunciMigrasi(userId)) === 'berhasil') return 'tidak-ada';
    const lokal = await penyimpananTamu.muat();
    if (lokal.progres.length === 0 && lokal.stats.length === 0) return 'tidak-ada';
    try {
      const gabungan = gabungProgres(await muatServer(), lokal);
      await kirimData(userId, gabungan);
      localStorage.setItem(kunciMigrasi(userId), 'berhasil');
      kosongkanTamu();
      tulisObjek(kunciCache(userId), gabungan);
      return 'berhasil';
    } catch {
      return 'gagal'; // data tamu tetap aman; dicoba lagi saat masuk berikutnya
    }
  })().finally(() => migrasiBerjalan.delete(userId));

  migrasiBerjalan.set(userId, proses);
  return proses;
}