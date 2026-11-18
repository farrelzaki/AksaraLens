import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { JALUR } from '../content';
import { useSesi } from '../lib/sesi';
import { catatJawaban, statusJalur, type ProgresTitik, type StatHuruf, type StatusTitik } from './model';
import { statusTahap } from './tahap';
import { beliAvatar as beliAvatarMurni, DOMPET_AWAL, hadiahJawaban, hadiahTitik, punyaAvatar as punyaAvatarMurni, type Dompet, type HasilBeli } from './koin';
import { migrasiTamu, penyimpananAkun, penyimpananTamu, type HasilMigrasi, type Penyimpanan } from './penyimpanan';

interface NilaiProgres {
  status: Map<string, StatusTitik>;
  /** status 15 tahap belajar (Kenali, Cocokkan, Ingat, Tulis, Kuis per bab) */
  tahap: Map<string, StatusTitik>;
  stats: StatHuruf[];
  /** hasil migrasi tamu -> akun terakhir (null bila belum ada), untuk pesan ke pengguna */
  hasilMigrasi: HasilMigrasi | null;
  /** Mengembalikan koin yang diberikan (0 bila titik sudah pernah selesai atau bukan tahap belajar). */
  selesaikanTitik(id: string): number;
  /** `kunciSoal` (mis. `kunciSoal(tahap.id, indeks)`) mengaktifkan hadiah koin; tanpa itu hanya statistik. Mengembalikan koin yang diberikan. */
  catat(letter: string, benar: boolean, kunciSoal?: string): number;
  /** F8: saldo koin dan karakter Aksa. */
  koin: number;
  punyaAvatar(id: number): boolean;
  beliAvatar(id: number): HasilBeli;
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
  const [dompet, setDompet] = useState<Dompet>(DOMPET_AWAL);
  // Ref agar hadiah beruntun (mis. dua jawaban cepat) dihitung dari saldo terbaru, bukan state yang basi.
  const dompetRef = useRef<Dompet>(DOMPET_AWAL);
  const terapkanDompet = useCallback(
    (d: Dompet) => {
      dompetRef.current = d;
      setDompet(d);
      void penyimpanan.simpanDompet(d);
    },
    [penyimpanan],
  );

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
        const dp = await penyimpanan.muatDompet();
        if (batal) return;
        dompetRef.current = dp;
        setDompet(dp);
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
          return penyimpanan.muatDompet();
        })
        .then((dp) => {
          dompetRef.current = dp;
          setDompet(dp);
        })
        .catch(() => {});
    };
    window.addEventListener('online', saatOnline);
    return () => window.removeEventListener('online', saatOnline);
  }, [penyimpanan]);

  const selesaikanTitik = useCallback(
    (id: string) => {
      if (progres.some((p) => p.lesson_id === id)) return 0; // mengulang tidak mengubah status
      const p: ProgresTitik = { lesson_id: id, status: 'completed', completed_at: new Date().toISOString() };
      setProgres((lama) => [...lama, p]);
      void penyimpanan.simpanTitik(p);
      const h = hadiahTitik(dompetRef.current, id);
      if (h.diberi > 0) terapkanDompet(h.dompet);
      return h.diberi;
    },
    [progres, penyimpanan, terapkanDompet],
  );

  const catat = useCallback(
    (letter: string, benar: boolean, kunciSoal?: string) => {
      setStats((lama) => {
        const baru = catatJawaban(lama, letter, benar);
        void penyimpanan.simpanStats(baru);
        return baru;
      });
      if (!kunciSoal) return 0;
      const h = hadiahJawaban(dompetRef.current, kunciSoal, benar);
      if (h.diberi > 0) terapkanDompet(h.dompet);
      return h.diberi;
    },
    [penyimpanan, terapkanDompet],
  );

  const punyaAvatar = useCallback((id: number) => punyaAvatarMurni(dompet, id), [dompet]);
  const beliAvatar = useCallback(
    (id: number): HasilBeli => {
      const h = beliAvatarMurni(dompetRef.current, id);
      if (h.ok) terapkanDompet(h.dompet);
      return h;
    },
    [terapkanDompet],
  );

  const status = useMemo(() => statusJalur(JALUR, new Set(progres.map((p) => p.lesson_id))), [progres]);
  const tahap = useMemo(() => statusTahap(new Set(progres.map((p) => p.lesson_id))), [progres]);
  const nilai = useMemo(
    () => ({ status, tahap, stats, hasilMigrasi, selesaikanTitik, catat, koin: dompet.koin, punyaAvatar, beliAvatar }),
    [status, tahap, stats, hasilMigrasi, selesaikanTitik, catat, dompet.koin, punyaAvatar, beliAvatar],
  );

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function useProgres(): NilaiProgres {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgres harus dipakai di dalam ProgresProvider');
  return v;
}