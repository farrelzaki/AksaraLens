import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { JALUR } from '../content';
import { catatJawaban, statusJalur, type ProgresTitik, type StatHuruf, type StatusTitik } from './model';
import { penyimpananTamu, type Penyimpanan } from './penyimpanan';

interface NilaiProgres {
  status: Map<string, StatusTitik>;
  stats: StatHuruf[];
  selesaikanTitik(id: string): void;
  catat(letter: string, benar: boolean): void;
}

const Ctx = createContext<NilaiProgres | null>(null);

// TODO(Emil): pilih penyimpananAkun(userId) saat masuk dan jalankan migrasi tamu.
export function ProgresProvider({ children, penyimpanan = penyimpananTamu }: { children: ReactNode; penyimpanan?: Penyimpanan }) {
  const [progres, setProgres] = useState<ProgresTitik[]>([]);
  const [stats, setStats] = useState<StatHuruf[]>([]);

  useEffect(() => {
    penyimpanan.muat().then((d) => {
      setProgres(d.progres);
      setStats(d.stats);
    });
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
    (letter: string, benar: boolean) => {
      setStats((lama) => {
        const baru = catatJawaban(lama, letter, benar);
        void penyimpanan.simpanStats(baru);
        return baru;
      });
    },
    [penyimpanan],
  );

  const status = useMemo(() => statusJalur(JALUR, new Set(progres.map((p) => p.lesson_id))), [progres]);
  const nilai = useMemo(() => ({ status, stats, selesaikanTitik, catat }), [status, stats, selesaikanTitik, catat]);

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function useProgres(): NilaiProgres {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgres harus dipakai di dalam ProgresProvider');
  return v;
}
