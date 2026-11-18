import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LABEL_TAHAP, type Tahap } from '../../content/tahap';
import { hurufSeringSalah } from '../../progres/model';
import { useProgres } from '../../progres/ProgresProvider';
import { pilihPembuka, pilihPenutup, type AdeganPenutup } from './selingan';

export interface SesiBelajar {
  total: number;
  salah: number;
  komboMaks: number;
  detik: number;
}

/**
 * Status selingan untuk satu tahap: pembuka tampil saat tahap dibuka, penutup saat tahap selesai.
 * Hanya membaca progres lewat useProgres() (tidak menulis apa pun).
 */
export function useSelingan(tahap: Tahap, sedangSelesai: boolean) {
  const { tahap: statusTahap, stats } = useProgres();
  const [tampil, setTampil] = useState<'pembuka' | 'penutup' | null>('pembuka');
  const [acak, setAcak] = useState(() => Math.random());
  const sudahPernahRef = useRef(false);

  // Tahap baru → pembuka lagi, dengan variasi kalimat baru
  useEffect(() => {
    setTampil('pembuka');
    setAcak(Math.random());
  }, [tahap.id]);

  // Ingat apakah tahap ini sudah pernah selesai SEBELUM sesi ini menyelesaikannya
  const sudahPernah = statusTahap.get(tahap.id) === 'selesai';
  useEffect(() => {
    if (!sedangSelesai) sudahPernahRef.current = sudahPernah;
  }, [sudahPernah, sedangSelesai]);

  const totalSelesaiSemua = useMemo(
    () => [...statusTahap.values()].filter((s) => s === 'selesai').length,
    [statusTahap],
  );
  const hurufLemah = useMemo(() => hurufSeringSalah(stats, 1)[0]?.letter, [stats]);

  const pembuka = useMemo(
    () =>
      pilihPembuka({
        jenis: tahap.jenis,
        nomor: tahap.nomor,
        sudahPernah,
        totalSelesaiSemua,
        hurufLemah,
        jam: new Date().getHours(),
        acak,
      }),
    [tahap.jenis, tahap.nomor, sudahPernah, totalSelesaiSemua, hurufLemah, acak],
  );

  const buatPenutup = useCallback(
    (sesi: SesiBelajar): AdeganPenutup =>
      pilihPenutup({ ...sesi, jenis: tahap.jenis, nomor: tahap.nomor, sudahPernah: sudahPernahRef.current, acak }),
    [tahap.jenis, tahap.nomor, acak],
  );

  const label = `BAB 0${tahap.bab} • ${LABEL_TAHAP[tahap.jenis]}`;
  const tutup = useCallback(() => setTampil(null), []);
  const tampilkanPenutup = useCallback(() => setTampil('penutup'), []);

  return { tampil, pembuka, buatPenutup, label, hurufLemah, tutup, tampilkanPenutup };
}
