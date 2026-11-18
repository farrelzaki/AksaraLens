import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { JALUR } from '../content';
import { useSesi } from '../lib/sesi';
import {
  catatJawaban,
  kunciStat,
  statusJalur,
  tandaiDikuasai,
  type JenisStat,
  type ProgresTitik,
  type StatHuruf,
  type StatusTitik,
} from './model';
import { statusTahap } from './tahap';
import { migrasiTamu, penyimpananAkun, penyimpananTamu, type HasilMigrasi, type Penyimpanan } from './penyimpanan';

interface NilaiProgres {
  status: Map<string, StatusTitik>;
  /** status 15 tahap belajar (Kenali, Cocokkan, Ingat, Tulis, Kuis per bab) */
  tahap: Map<string, StatusTitik>;
  stats: StatHuruf[];
  /** hasil migrasi tamu -> akun terakhir (null bila belum ada), untuk pesan ke pengguna */
  hasilMigrasi: HasilMigrasi | null;
  selesaikanTitik(id: string): void;
  /** jenis 'tebak' (kuis, default) atau 'tulis' (cek tulisan di kanvas) */
  catat(letter: string, benar: boolean, jenis?: JenisStat): void;
  /** "Sudah kukuasai": keluarkan huruf dari daftar huruf sering salah untuk jenis itu */
  kuasai(letter: string, jenis: JenisStat): void;
}

const Ctx = createContext<NilaiProgres | null>(null);

// Pilih penyimpanan akun saat masuk dan migrasikan progres tamu saat pertama kali berhasil.
// `penyimpanan` dari luar (mis. untuk tes) mengalahkan pilihan otomatis tamu/akun.
export function ProgresProvider({ children, penyimpanan: dariLuar }: { children: ReactNode; penyimpanan?: Penyimpanan }) {
  const { pengguna } = useSesi();
  const uid = pengguna?.id;
  const penyimpanan = useMemo<Penyimpanan>(
    () => dariLuar ?? (uid ? penyimpananAkun(uid) : penyimpananTamu),
    [dariLuar, uid],
  );

  const [progres, setProgres] = useState<ProgresTitik[]>([]);
  const [stats, setStats] = useState<StatHuruf[]>([]);
  const [hasilMigrasi, setHasilMigrasi] = useState<HasilMigrasi | null>(null);

  useEffect(() => {
    let batal = false;
    void (async () => {
      try {
        // Baru masuk: pindahkan progres tamu dulu, baru muat agar hasil gabungan yang tampil.
        if (uid && !dariLuar) {
          const hasil = await migrasiTamu(uid);
          if (!batal && hasil !== 'tidak-ada') setHasilMigrasi(hasil);
        } else if (!batal) {
          setHasilMigrasi(null);
        }
        const d = await penyimpanan.muat();
        if (batal) return;
        setProgres(d.progres);
        setStats(d.stats);
      } catch {
        /* biarkan state sebelumnya; muat berikutnya mencoba lagi */
      }
    })();
    return () => {
      batal = true;
    };
  }, [penyimpanan, uid, dariLuar]);

  // Kembali online: kirim antrean yang tertahan, lalu muat ulang.
  useEffect(() => {
    const saatOnline = () => {
      if (!penyimpanan.sinkron) return;
      penyimpanan
        .sinkron()
        .then(() => penyimpanan.muat())
        .then((d) => {
          setProgres(d.progres);
          setStats(d.stats);
        })
        .catch(() => {});
    };
    window.addEventListener('online', saatOnline);
    return () => window.removeEventListener('online', saatOnline);
  }, [penyimpanan]);

  const selesaikanTitik = useCallback(
    (id: string) => {
      if (progres.some((p) => p.lesson_id === id)) return; // mengulang tidak mengubah status
      const p: ProgresTitik = { lesson_id: id, status: 'completed', completed_at: new Date().toISOString() };
      setProgres((lama) => [...lama, p]);
      void penyimpanan.simpanTitik(p);
    },
    [progres, penyimpanan],
  );

  const catat = useCallback(
    (letter: string, benar: boolean, jenis: JenisStat = 'tebak') => {
      setStats((lama) => {
        const baru = catatJawaban(lama, kunciStat(letter, jenis), benar);
        void penyimpanan.simpanStats(baru);
        return baru;
      });
    },
    [penyimpanan],
  );

  const kuasai = useCallback(
    (letter: string, jenis: JenisStat) => {
      setStats((lama) => {
        const baru = tandaiDikuasai(lama, letter, jenis);
        void penyimpanan.simpanStats(baru);
        return baru;
      });
    },
    [penyimpanan],
  );

  const status = useMemo(() => statusJalur(JALUR, new Set(progres.map((p) => p.lesson_id))), [progres]);
  const tahap = useMemo(() => statusTahap(new Set(progres.map((p) => p.lesson_id))), [progres]);
  const nilai = useMemo(
    () => ({ status, tahap, stats, hasilMigrasi, selesaikanTitik, catat, kuasai }),
    [status, tahap, stats, hasilMigrasi, selesaikanTitik, catat, kuasai],
  );

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function useProgres(): NilaiProgres {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgres harus dipakai di dalam ProgresProvider');
  return v;
}